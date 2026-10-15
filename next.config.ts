import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/opengraph-image": ["./src/app/fonts/**"] },
  async redirects() {
    return [{ source: "/products/olo/app", destination: "/lab/portrait", permanent: true }];
  },
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
