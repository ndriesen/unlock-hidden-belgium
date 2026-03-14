import os
import time
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# -----------------------------
# STEP 1: Load environment
# -----------------------------
load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -----------------------------
# STEP 2: Helper functions
# -----------------------------

def geocode_osm(name, address=None, province=None, country=None):
    """Fetch latitude, longitude, and address using OpenStreetMap Nominatim API"""
    query_parts = [name, address, province, country]
    query = ", ".join(filter(None, query_parts))
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1},
            headers={"User-Agent": "Supabase-Enrichment-Script"}
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"]), data[0].get("display_name")
    except Exception as e:
        print(f"[Geocode] Failed for {query}: {e}")
    return None, None, None

def fetch_wikimedia_images(query, limit=5):
    """Fetch free images from Wikimedia Commons"""
    try:
        search_url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": limit,
            "prop": "imageinfo",
            "iiprop": "url"
        }
        resp = requests.get(search_url, params=params)
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        images = []
        for p in pages.values():
            for info in p.get("imageinfo", []):
                images.append(info["url"])
        return images
    except Exception as e:
        print(f"[Images] Failed for {query}: {e}")
        return []

def fetch_wikidata_info(name):
    """Fetch structured data from Wikidata"""
    query = f"""
    SELECT ?item ?itemLabel ?website ?categoryLabel ?openingHours ?entryFee ?tags WHERE {{
      ?item rdfs:label "{name}"@en.
      OPTIONAL {{ ?item wdt:P856 ?website. }}
      OPTIONAL {{ ?item wdt:P31 ?category. }}
      OPTIONAL {{ ?item wdt:P5313 ?openingHours. }}
      OPTIONAL {{ ?item wdt:P4987 ?entryFee. }}
      OPTIONAL {{ ?item wdt:P518 ?tags. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT 1
    """
    try:
        resp = requests.get(
            "https://query.wikidata.org/sparql",
            params={"query": query, "format": "json"},
            headers={"User-Agent": "Supabase-Enrichment-Script"}
        )
        resp.raise_for_status()
        results = resp.json().get("results", {}).get("bindings", [])
        if results:
            r = results[0]
            return {
                "website": r.get("website", {}).get("value"),
                "category": r.get("categoryLabel", {}).get("value"),
                "opening_hours": r.get("openingHours", {}).get("value"),
                "entry_fee": r.get("entryFee", {}).get("value"),
                "tags": [r.get("tags", {}).get("value")] if r.get("tags") else []
            }
    except Exception as e:
        print(f"[Wikidata] Failed for {name}: {e}")
    return {}

def merge_lists(a, b):
    """Merge lists and remove duplicates"""
    return list(set((a or []) + (b or [])))

# -----------------------------
# STEP 3: Fetch hotspots from Supabase
# -----------------------------
hotspots_response = supabase.table("hotspots").select("*").execute()

if hotspots_response.error:
    print("Fout bij ophalen hotspots:", hotspots_response.error)
else:
    hotspots_data = hotspots_response.data
    print(f"Succesvol {len(hotspots_data)} hotspots opgehaald")

hotspots = hotspots_response.data
print(f"[INFO] Fetched {len(hotspots)} hotspots")

# -----------------------------
# STEP 4: Enrich & Update
# -----------------------------
for h in hotspots:
    name = h.get("name")
    print(f"\n[PROCESSING] {name}")

    # 1️⃣ Geocode
    if not h.get("latitude") or not h.get("longitude"):
        lat, lon, address = geocode_osm(name, h.get("address"), h.get("province"), h.get("country"))
        if lat:
            h["latitude"] = lat
            h["longitude"] = lon
            if address:
                h["address"] = address
        time.sleep(1)

    # 2️⃣ Wikidata enrichment
    wikidata_info = fetch_wikidata_info(name)
    for k, v in wikidata_info.items():
        if v:
            h[k] = v
    h["tags"] = merge_lists(h.get("tags"), wikidata_info.get("tags", []))

    # 3️⃣ Wikimedia images
    if not h.get("images") or len(h["images"])==0:
        images = fetch_wikimedia_images(name)
        if images:
            h["images"] = images

    # 4️⃣ Update Supabase
    update_resp = supabase.table("hotspots").update(h).eq("id", h["id"]).execute()
    if update_resp.status_code == 200:
        print(f"[UPDATED] {name}")
    else:
        print(f"[FAILED] {name} | {update_resp.data}")

print("\n[INFO] Hotspot enrichment completed successfully.")