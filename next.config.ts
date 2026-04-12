import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.rosariogarage.com' },
      { protocol: 'https', hostname: 'rosariogarage.com' },
      { protocol: 'https', hostname: 'www.bienesrosario.com' },
      { protocol: 'https', hostname: 'bienesrosario.com' },
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
      { protocol: 'https', hostname: '*.mlstatic.com' },
      { protocol: 'https', hostname: 'images.evisos.com.ar' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;