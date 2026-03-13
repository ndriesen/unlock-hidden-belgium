"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config({ path: ".env.local" });
const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const REQUEST_DELAY_MS = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/* ------------------------------------------------ */
/* OSM centroid via Overpass */
/* ------------------------------------------------ */
async function fetchOSMCenter(name, city) {
    try {
        const query = `
    [out:json];
    area["name"="${city}"]->.searchArea;
    (
      way["name"="${name}"](area.searchArea);
      node["name"="${name}"](area.searchArea);
    );
    out geom;
    `;
        const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query
        });
        const data = await res.json();
        if (!data.elements?.length)
            return null;
        const el = data.elements[0];
        if (el.type === "node") {
            return {
                lat: el.lat,
                lon: el.lon
            };
        }
        if (el.type === "way" && el.geometry) {
            const coords = el.geometry;
            const lat = coords.reduce((sum, p) => sum + p.lat, 0) / coords.length;
            const lon = coords.reduce((sum, p) => sum + p.lon, 0) / coords.length;
            return { lat, lon };
        }
        return null;
    }
    catch (err) {
        console.error("OSM error", err);
        return null;
    }
}
/* ------------------------------------------------ */
/* Wikimedia images */
/* ------------------------------------------------ */
async function fetchWikimediaImages(searchTerm) {
    try {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=10&prop=imageinfo&iiprop=url&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        const pages = data?.query?.pages;
        if (!pages)
            return undefined;
        const images = Object.values(pages)
            .map((p) => p.imageinfo?.[0]?.url)
            .filter(Boolean);
        return images.length ? images : undefined;
    }
    catch (err) {
        return undefined;
    }
}
/* ------------------------------------------------ */
/* Wikidata description + tags */
/* ------------------------------------------------ */
async function fetchWikidataInfo(searchTerm) {
    try {
        const sparql = `
    SELECT ?item ?itemLabel ?description WHERE {
      ?item rdfs:label "${searchTerm}"@en.
      OPTIONAL { ?item schema:description ?description FILTER (lang(?description)="en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1
    `;
        const url = "https://query.wikidata.org/sparql?format=json&query=" +
            encodeURIComponent(sparql);
        const res = await fetch(url);
        const data = await res.json();
        const result = data?.results?.bindings?.[0];
        return {
            description: result?.description?.value ?? undefined,
            tags: undefined
        };
    }
    catch {
        return {
            description: undefined,
            tags: undefined
        };
    }
}
/* ------------------------------------------------ */
/* Supabase update */
/* ------------------------------------------------ */
async function updateHotspotMetadata(id, metadata) {
    const { error } = await supabase
        .from("hotspots")
        .update(metadata)
        .eq("id", id);
    if (error)
        throw error;
}
/* ------------------------------------------------ */
/* Main enrichment */
/* ------------------------------------------------ */
async function enrichHotspots() {
    const { data: hotspots, error } = await supabase
        .from("hotspots")
        .select("*");
    if (error)
        throw error;
    console.log(`Found ${hotspots.length} hotspots`);
    for (const hotspot of hotspots) {
        try {
            const searchTerm = hotspot.municipality
                ? `${hotspot.name} ${hotspot.municipality}`
                : hotspot.name;
            /* images */
            let images = Array.isArray(hotspot.images)
                ? hotspot.images
                : undefined;
            if (!images) {
                images = await fetchWikimediaImages(searchTerm);
            }
            /* osm coords */
            let latitude = hotspot.latitude;
            let longitude = hotspot.longitude;
            if (!latitude || !longitude) {
                const coords = await fetchOSMCenter(hotspot.name, hotspot.municipality || "Belgium");
                if (coords) {
                    latitude = coords.lat;
                    longitude = coords.lon;
                }
            }
            /* wikidata */
            const { description, tags } = await fetchWikidataInfo(hotspot.name);
            const metadata = {};
            if (images && images.length)
                metadata.images = images;
            if (latitude)
                metadata.latitude = latitude;
            if (longitude)
                metadata.longitude = longitude;
            if (description)
                metadata.description = description;
            if (tags)
                metadata.tags = tags;
            await updateHotspotMetadata(hotspot.id, metadata);
            console.log(`[OK] ${searchTerm}`);
        }
        catch (err) {
            console.error(`[FAIL] ${hotspot.name}`, err);
        }
        await sleep(REQUEST_DELAY_MS);
    }
}
/* ------------------------------------------------ */
async function main() {
    await enrichHotspots();
}
main();
