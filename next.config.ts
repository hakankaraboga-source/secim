import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Excel ice aktarma dosyalari icin (varsayilan 1MB yetersiz)
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
