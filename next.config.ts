import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {},
  async rewrites() {
    return [
      {
        source: "/@:nick/world",
        destination: "/station/:nick/world",
      },
      {
        source: "/@:nick",
        destination: "/station/:nick",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
      },
      {
        hostname: "mmg.whatsapp.net",
      },
      {
        hostname: "uazapi.com",
      },
      {
        hostname: "nasa-ex.t3.storage.dev",
      },
      {
        hostname: "pub-f9e718fa60aa4e1092c20a791898d931.r2.dev",
      },
      {
        hostname: "lh3.googleusercontent.com",
      },
      {
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
