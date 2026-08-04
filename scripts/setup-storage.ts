/**
 * One-time setup: create the private Cloudflare R2 bucket.
 * Run: npx tsx scripts/setup-storage.ts (needs the R2_* credentials)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { ensureMediaBucket } from "../src/lib/storage";

ensureMediaBucket()
  .then(() => console.log(`R2 bucket "${process.env.R2_BUCKET ?? "synerix-studio"}" ready (private)`))
  .catch((e) => {
    console.error("setup failed:", e.message);
    process.exit(1);
  });
