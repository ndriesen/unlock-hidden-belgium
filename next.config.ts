import type { NextConfig } from "next";

function parseExtraHosts(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const imageHosts = new Set<string>([
  "images.unsplash.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    imageHosts.add(new URL(supabaseUrl).hostname);
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_SUPABASE_URL for image hostname parsing", error);
  }
}

parseExtraHosts(process.env.NEXT_PUBLIC_EXTRA_IMAGE_HOSTS).forEach((host) => {
  imageHosts.add(host);
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: Array.from(imageHosts).map((hostname) => ({
      protocol: "https",
      hostname,
    })),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
