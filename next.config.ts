
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 親ディレクトリにも package-lock.json があるため、明示的にここを root とする
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
