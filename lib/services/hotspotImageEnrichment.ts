import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DELAY = 1200
const BATCH_SIZE = 100

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

type Metadata = Partial<{
  images: string[]
  latitude: number
  longitude: number
  description: string
  wikipedia_intro: string
  tags: string[]
  tourism_type: string
  opening_hours: string
  heritage: boolean
}>

/* ------------------------------------------------ */
/* Utility helpers */
/* ------------------------------------------------ */

function cleanMetadata(meta: Metadata) {

  const cleaned: any = {}

  for (const key in meta) {

    const value = (meta as any)[key]

    if (
      value !== undefined &&
      value !== null &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      cleaned[key] = value
    }

  }

  return cleaned
}

function similarity(a: string, b: string) {

  a = a.toLowerCase()
  b = b.toLowerCase()

  if (a === b) return 1

  if (a.includes(b) || b.includes(a)) return 0.8

  return 0
}

/* ------------------------------------------------ */
/* Wikidata search */
/* ------------------------------------------------ */

async function searchWikidata(name: string) {

  const url =
    "https://www.wikidata.org/w/api.php?action=wbsearchentities" +
    "&language=en&format=json&origin=*" +
    "&search=" + encodeURIComponent(name)

  const res = await fetch(url)
  const data = await res.json()

  if (!data?.search?.length) return null

  const best = data.search
    .map((r: any) => ({
      item: r,
      score: similarity(name, r.label)
    }))
    .sort((a: any, b: any) => b.score - a.score)[0]

  if (best.score < 0.6) return null

  return best.item
}

/* ------------------------------------------------ */
/* Wikidata entity */
/* ------------------------------------------------ */

async function fetchWikidataEntity(qid: string) {

  const res = await fetch(
    `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`
  )

  const data = await res.json()
  const entity = data.entities[qid]

  const claims = entity.claims

  const osmRelation =
    claims?.P402?.[0]?.mainsnak?.datavalue?.value

  const instanceOf =
    claims?.P31?.map((c: any) =>
      c.mainsnak?.datavalue?.value?.id
    )

  const wikipedia =
    entity?.sitelinks?.enwiki?.title

  return {
    osmRelation,
    instanceOf,
    wikipedia
  }
}

/* ------------------------------------------------ */
/* Wikipedia intro */
/* ------------------------------------------------ */

async function fetchWikipediaIntro(title: string) {

  const url =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(title)

  const res = await fetch(url)

  if (!res.ok) return null

  const data = await res.json()

  return data.extract
}

/* ------------------------------------------------ */
/* OSM geometry + tags */
/* ------------------------------------------------ */

async function fetchOSMData(osmRelation: number) {

  const query = `
  [out:json];
  relation(${osmRelation});
  out geom tags;
  `

  const res = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      body: query
    }
  )

  const data = await res.json()

  const rel = data.elements?.[0]

  if (!rel) return null

  const coords: any[] = []

  for (const m of rel.members) {
    if (m.geometry) coords.push(...m.geometry)
  }

  if (!coords.length) return null

  const center = coords[Math.floor(coords.length / 2)]

  return {
    lat: center.lat,
    lon: center.lon,
    tags: rel.tags
  }

}

/* ------------------------------------------------ */
/* Wikimedia images */
/* ------------------------------------------------ */

async function fetchCommonsImages(term: string) {

  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(term) +
    "&gsrlimit=20" +
    "&prop=imageinfo" +
    "&iiprop=url" +
    "&format=json" +
    "&origin=*"

  const res = await fetch(url)
  const data = await res.json()

  const pages = data?.query?.pages

  if (!pages) return []

  const images = Object.values(pages)
    .map((p: any) => p.imageinfo?.[0]?.url)
    .filter(Boolean)

  const bad = [
    "map",
    "logo",
    "diagram",
    "symbol",
    "coat"
  ]

  return images.filter((url: string) =>
    !bad.some(b =>
      url.toLowerCase().includes(b)
    )
  )
}

/* ------------------------------------------------ */
/* Supabase update */
/* ------------------------------------------------ */

async function updateHotspot(id: string, meta: Metadata) {

  const payload = cleanMetadata(meta)

  if (!Object.keys(payload).length) return

  const { error } = await supabase
    .from("hotspots")
    .update(payload)
    .eq("id", id)

  if (error) throw error
}

/* ------------------------------------------------ */
/* Single hotspot enrichment */
/* ------------------------------------------------ */

async function enrichHotspot(hotspot: any) {

  const search =
    hotspot.municipality
      ? `${hotspot.name} ${hotspot.municipality}`
      : hotspot.name

  const metadata: Metadata = {}

  const wd = await searchWikidata(search)

  if (wd?.description && !hotspot.description)
    metadata.description = wd.description

  if (wd) {

    const entity = await fetchWikidataEntity(wd.id)

    /* Wikipedia */

    if (entity.wikipedia && !hotspot.wikipedia_intro) {

      const intro = await fetchWikipediaIntro(entity.wikipedia)

      if (intro)
        metadata.wikipedia_intro = intro

    }

    /* OSM */

    if (
      entity.osmRelation &&
      (!hotspot.latitude || !hotspot.longitude)
    ) {

      const osm = await fetchOSMData(entity.osmRelation)

      if (osm) {

        metadata.latitude = osm.lat
        metadata.longitude = osm.lon

        if (osm.tags?.tourism)
          metadata.tourism_type = osm.tags.tourism

        if (osm.tags?.opening_hours)
          metadata.opening_hours = osm.tags.opening_hours

        // heritage not in schema, use is_verified or featured instead?
        // if (osm.tags?.heritage)
        //   metadata.heritage = true

      }

    }

    if (entity.instanceOf)
      metadata.tags = entity.instanceOf

  }

  /* images */

  if (!hotspot.images || hotspot.images.length === 0) {

    const imgs = await fetchCommonsImages(search)

    if (imgs.length)
      metadata.images = imgs

  }

  await updateHotspot(hotspot.id, metadata)

  const changes = Object.keys(metadata);
  console.log(
    `✓ ${search} | changes:[${changes.join(', ')}] | images:${metadata.images?.length ?? 0}`
  )

}

/* ------------------------------------------------ */
/* MAIN ENGINE */
/* ------------------------------------------------ */

export async function enrichHotspots() {

  console.log("Starting enrichment pipeline")

  let from = 0
  let to = BATCH_SIZE - 1

  const allEnriched: any[] = [];

  while (true) {

    const { data: hotspots, error } = await supabase
      .from("hotspots")
      .select(`
        *,
        wikipedia_intro,
        tags,
        latitude,
        longitude,
        description,
        images,
        opening_hours
      `)
      .range(from, to)

    if (error) throw error
    if (!hotspots?.length) break

    console.log(`Batch ${from}-${to}`)

    for (const hotspot of hotspots) {

      try {

        await enrichHotspot(hotspot)

        // Re-fetch to get updated data
        const { data: updated } = await supabase
          .from("hotspots")
          .select(`
            id,
            name,
            wikipedia_intro,
            tags,
            latitude,
            longitude,
            description,
            images,
            opening_hours
          `)
          .eq("id", hotspot.id)
          .single();

        if (updated) {
          allEnriched.push(updated);
        }

      } catch (e) {

        console.error(
          "FAIL",
          hotspot.name,
          e
        )

      }

      await sleep(DELAY)

    }

    from += BATCH_SIZE
    to += BATCH_SIZE

  }

  // Export summary
  console.log("\n=== ENRICHMENT SUMMARY ===");
  console.log(`Total enriched hotspots: ${allEnriched.length}`);
  
  const summary = {
    total: allEnriched.length,
    withWikipedia: allEnriched.filter(h => h.wikipedia_intro).length,
    withTags: allEnriched.filter(h => h.tags && h.tags.length > 0).length,
    withImages: allEnriched.filter(h => h.images && h.images.length > 0).length,
    withLatLng: allEnriched.filter(h => h.latitude && h.longitude).length,
    sample: allEnriched.slice(0, 5).map(h => ({
      name: h.name,
      wikipedia_intro: h.wikipedia_intro ? h.wikipedia_intro.substring(0, 100) + '...' : null,
      tags: h.tags,
      images: h.images?.length,
      lat: h.latitude,
      lng: h.longitude
    }))
  };

  console.log("Summary:", JSON.stringify(summary, null, 2));

  console.log("Report data (copy to file):");
  console.log(JSON.stringify(summary, null, 2)); 

  console.log("Enrichment finished")

}
