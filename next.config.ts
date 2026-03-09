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
  "upload.wikimedia.org",
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

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https: data:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns: Array.from(imageHosts).map((hostname) => ({
      protocol: "https",
      hostname,
    })),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

