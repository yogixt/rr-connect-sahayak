import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure the pincode directory is bundled into the /api/asm serverless function
  // on Vercel (it is read with fs at runtime, which file tracing can otherwise miss).
  outputFileTracingIncludes: {
    "/api/asm": ["./data/pincode_mapping.csv.gz"],
  },
};

export default nextConfig;
