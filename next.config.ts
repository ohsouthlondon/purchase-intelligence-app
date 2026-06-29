import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in the
  // home directory otherwise makes Next infer the wrong root, which breaks
  // type resolution (e.g. the globals.css side-effect import).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
