import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/node-API packages must not be bundled into server chunks (sharp is
  // already on Next's built-in list).
  serverExternalPackages: ["@napi-rs/canvas"],
  experimental: {
    // Product/logo uploads ship image bytes through Server Actions; the default
    // 1 MB cap rejects a single photo. Cover the 5×8 MB product form with margin.
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
