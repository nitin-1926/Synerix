/**
 * One-time setup: create the private `media` bucket.
 * Run: npx tsx scripts/setup-storage.ts (needs SUPABASE_SERVICE_ROLE_KEY)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { ensureMediaBucket } from "../src/lib/storage";

ensureMediaBucket()
  .then(() => console.log("media bucket ready (private)"))
  .catch((e) => {
    console.error("setup failed:", e.message);
    process.exit(1);
  });
