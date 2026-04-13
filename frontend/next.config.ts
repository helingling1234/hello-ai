import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",      // Generate static HTML/CSS/JS files
  trailingSlash: true,   // /results -> /results/index.html
};

export default nextConfig;
