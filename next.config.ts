import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/node-API packages must not be bundled into server chunks.
  serverExternalPackages: ["@napi-rs/canvas", "sharp"],
  experimental: {
    // Product/logo uploads ship image bytes through Server Actions; the default
    // 1 MB cap rejects a single photo. Cover the 5×8 MB product form with margin.
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
