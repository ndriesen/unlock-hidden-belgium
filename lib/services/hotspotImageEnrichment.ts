import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DELAY = 1200;

const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));

type Metadata = {
  images?:string[]
  latitude?:number
  longitude?:number
  description?:string
  wikipedia_intro?:string
  tags?:string[]
  tourism_type?:string
  opening_hours?:string
  heritage?:boolean
}

/* --------------------------- */
/* Wikidata search */
/* --------------------------- */

async function searchWikidata(name:string){

  const url=
  "https://www.wikidata.org/w/api.php?action=wbsearchentities"+
  "&language=en&format=json&origin=*"+
  "&search="+encodeURIComponent(name)

  const res=await fetch(url)
  const data=await res.json()

  return data?.search?.[0]??null
}

/* --------------------------- */
/* Wikidata entity data */
/* --------------------------- */

async function fetchWikidataEntity(qid:string){

  const res=await fetch(
  `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`
  )

  const data=await res.json()

  const entity=data.entities[qid]

  const claims=entity.claims

  const osmRelation=
  claims?.P402?.[0]?.mainsnak?.datavalue?.value

  const instanceOf=
  claims?.P31?.map((c:any)=>
  c.mainsnak?.datavalue?.value?.id)

  const wikipedia=
  entity?.sitelinks?.enwiki?.title

  return{
    osmRelation,
    instanceOf,
    wikipedia
  }
}

/* --------------------------- */
/* Wikipedia intro */
/* --------------------------- */

async function fetchWikipediaIntro(title:string){

  const url=
  "https://en.wikipedia.org/api/rest_v1/page/summary/"
  +encodeURIComponent(title)

  const res=await fetch(url)

  if(!res.ok) return null

  const data=await res.json()

  return data.extract
}

/* --------------------------- */
/* OSM geometry + tags */
/* --------------------------- */

async function fetchOSMData(osmRelation:number){

const query=`
[out:json];
relation(${osmRelation});
out geom tags;
`

const res=await fetch(
"https://overpass-api.de/api/interpreter",
{
method:"POST",
body:query
})

const data=await res.json()

const rel=data.elements?.[0]

if(!rel) return null

const coords:any[]=[]

for(const m of rel.members){

if(m.geometry) coords.push(...m.geometry)

}

if(!coords.length) return null

const lat=
coords.reduce((s,c)=>s+c.lat,0)/coords.length

const lon=
coords.reduce((s,c)=>s+c.lon,0)/coords.length

return{
lat,
lon,
tags:rel.tags
}

}

/* --------------------------- */
/* Wikimedia category images */
/* --------------------------- */

async function fetchCommonsImages(term:string){

const url=
"https://commons.wikimedia.org/w/api.php"+
"?action=query"+
"&generator=search"+
"&gsrsearch="+encodeURIComponent(term)+
"&gsrlimit=20"+
"&prop=imageinfo"+
"&iiprop=url"+
"&format=json"+
"&origin=*"

const res=await fetch(url)
const data=await res.json()

const pages=data?.query?.pages

if(!pages) return null

return Object.values(pages)
.map((p:any)=>p.imageinfo?.[0]?.url)
.filter(Boolean)

}

/* --------------------------- */
/* Update Supabase */
/* --------------------------- */

async function updateHotspot(id:string,meta:Metadata){

const{error}=await supabase
.from("hotspots")
.update(meta)
.eq("id",id)

if(error) throw error

}

/* --------------------------- */
/* MAIN ENGINE */
/* --------------------------- */

export async function enrichHotspots(){

const{data:hotspots,error}=
await supabase.from("hotspots").select("*")

if(error) throw error

console.log("Hotspots:",hotspots.length)

for(const hotspot of hotspots){

try{

const search=
hotspot.municipality
?`${hotspot.name} ${hotspot.municipality}`
:hotspot.name

const metadata:Metadata={}

/* Wikidata */

const wd=await searchWikidata(search)

if(wd?.description&&!hotspot.description)
metadata.description=wd.description

if(wd){

const entity=
await fetchWikidataEntity(wd.id)

/* Wikipedia */

if(entity.wikipedia&&!hotspot.wikipedia_intro){

const intro=
await fetchWikipediaIntro(entity.wikipedia)

if(intro)
metadata.wikipedia_intro=intro

}

/* OSM */

if(entity.osmRelation
&&(!hotspot.latitude||!hotspot.longitude)){

const osm=
await fetchOSMData(entity.osmRelation)

if(osm){

metadata.latitude=osm.lat
metadata.longitude=osm.lon

if(osm.tags?.tourism)
metadata.tourism_type=osm.tags.tourism

if(osm.tags?.opening_hours)
metadata.opening_hours=osm.tags.opening_hours

if(osm.tags?.heritage)
metadata.heritage=true

}

}

/* tags */

if(entity.instanceOf)
metadata.tags=entity.instanceOf

}

/* images */

if(!hotspot.images){

const imgs=
await fetchCommonsImages(search)

if(imgs?.length)
metadata.images=imgs

}

/* update */

if(Object.keys(metadata).length){

await updateHotspot(hotspot.id,metadata)

console.log("✓",search)

}

}catch(e){

console.error("FAIL",hotspot.name,e)

}

await sleep(DELAY)

}

}