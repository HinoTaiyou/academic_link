
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 親ディレクトリにも package-lock.json があるため、明示的にここを root とする
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      // Allow larger request bodies for file uploads used in server actions
      bodySizeLimit: "20 MB",
    },
  },
};

export default nextConfig;
