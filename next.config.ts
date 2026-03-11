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

const isDev = process.env.NODE_ENV === "development";

// Generate CSP img-src directive with all allowed image hosts
const imgSrcHosts = Array.from(imageHosts).map(host => `https://${host}`).join(" ");

// Environment-aware CSP for Next.js hydration and Supabase
// Development: allows unsafe-eval for Next.js runtime
// Production: removes unsafe-eval for better security
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Allow OpenStreetMap tile servers for the map + all configured image hosts
  `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://openstreetmap.org ${imgSrcHosts}`,
  "font-src 'self' https: data:",
  // Development allows unsafe-inline and unsafe-eval for Next.js hydration
  // Production removes unsafe-eval but keeps unsafe-inline for CSS-in-JS
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  // Connect-src allows Supabase (REST API + WebSocket) and OpenStreetMap
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https:",
  "style-src 'self' 'unsafe-inline' https:",
  "frame-src 'self'",
  "worker-src 'self' blob:",
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
  // COEP/CORP cause issues with external resources like OpenStreetMap tiles
  // Remove in development; keep in production only if needed for security isolation
  ...(isDev
    ? []
    : [
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "require-corp",
        },
        {
          key: "Cross-Origin-Resource-Policy",
          value: "same-origin",
        },
      ]),
  {
    key: "Cross-Origin-Opener-Policy",
    value: isDev ? "same-origin" : "same-origin",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
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
    // Disable image optimization for external domains in development to avoid 429 rate limiting
    // In production, you can remove this or set it to false
    unoptimized: isDev,
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

