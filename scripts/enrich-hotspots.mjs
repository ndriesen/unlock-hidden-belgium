import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { enrichHotspots } from "../lib/services/hotspotImageEnrichment.ts"
import { enrichHotspots } from "../scripts/explore.ts"

async function main(){

  try{

    await enrichHotspots()

    console.log("Enrichment completed")

  }catch(e){

    console.error("Pipeline failed:",e)

  }

}

main()