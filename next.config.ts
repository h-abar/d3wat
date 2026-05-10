import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sql.js"],
  turbopack: {},
};

export default nextConfig;
