import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "isaetor.storage.iran.liara.space",
      },
      {
        protocol: "https",
        hostname: "negah.hot.ir-central1.arvanstorage.ir",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
