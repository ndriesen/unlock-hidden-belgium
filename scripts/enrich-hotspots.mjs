import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })


async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, "..");
  const sourceFile = path.join(rootDir, "lib", "services", "hotspotImageEnrichment.ts");
  const tempDir = path.join(rootDir, ".tmp", "enrich-hotspots");

  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  execSync(
    `npx tsc --pretty false --module commonjs --target es2021 --moduleResolution node --esModuleInterop --skipLibCheck --outDir "${tempDir}" --rootDir "${path.dirname(sourceFile)}" "${sourceFile}"`,
    { stdio: "inherit" }
  );

  const runtimeFile = path.join(tempDir, "hotspotImageEnrichment.js");
  const runtimeModule = await import(pathToFileURL(runtimeFile).href);
  const enrichHotspotsWithImages =
    runtimeModule.enrichHotspotsWithImages ?? runtimeModule.default?.enrichHotspotsWithImages;

  if (typeof enrichHotspotsWithImages !== "function") {
    throw new Error("enrichHotspotsWithImages() was not exported correctly.");
  }

  await enrichHotspotsWithImages();

  fs.rmSync(tempDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

