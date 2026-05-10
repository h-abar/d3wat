import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/send",
  serverExternalPackages: ["sql.js"],
  turbopack: {},
};

export default nextConfig;
