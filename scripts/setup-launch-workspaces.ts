/**
 * Launch setup — one-time, DESTRUCTIVE (soft): prepares the DB for customer
 * onboarding with the three account types.
 *
 *   1. Soft-deletes EVERY existing creative (sets deletedAt; renders/versions
 *      stay in storage and stay recoverable by clearing deletedAt).
 *   2. Creates the three customer workspaces (owner = SUPER_ADMIN_EMAIL user):
 *        FMCG Creative Studio    (FMCG_PRODUCT)
 *        Apparel Studio          (APPAREL_ON_MODEL)
 *        Fashion Editorial Studio(FASHION_EDITORIAL)
 *      Each starts with 0 credits — grant via the admin console.
 *
 * Existing workspaces (Dev workspace, ZZ Test Workspace, Blueman Clothing) are
 * left in place, only their creatives are soft-deleted.
 *
 * Run:  npx tsx scripts/setup-launch-workspaces.ts                       (dry run — prints counts, changes nothing)
 *       npx tsx scripts/setup-launch-workspaces.ts --apply               (executes)
 *       npx tsx scripts/setup-launch-workspaces.ts --owner you@x.com     (own the workspaces with a different existing user)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const APPLY = process.argv.includes("--apply");

const LAUNCH_WORKSPACES = [
  { name: "FMCG Creative Studio", slug: "fmcg-studio", type: "FMCG_PRODUCT" },
  { name: "Apparel Studio", slug: "apparel-studio", type: "APPAREL_ON_MODEL" },
  { name: "Fashion Editorial Studio", slug: "fashion-editorial-studio", type: "FASHION_EDITORIAL" },
] as const;

async function main() {
  // Dynamic import: static imports hoist above the dotenv config() calls and
  // db.ts throws on a missing DATABASE_URL at module load.
  const { prisma } = await import("../src/lib/db");
  const ownerFlag = process.argv.indexOf("--owner");
  const ownerEmail = (
    (ownerFlag !== -1 && process.argv[ownerFlag + 1]) ||
    process.env.SUPER_ADMIN_EMAIL ||
    "consulting.synerix@gmail.com"
  ).toLowerCase();
  const owner = await prisma.user.findFirst({ where: { email: { equals: ownerEmail, mode: "insensitive" } } });

  const liveCreatives = await prisma.creative.count({ where: { deletedAt: null } });
  const existingWs = await prisma.workspace.findMany({ select: { name: true, slug: true, type: true } });
  const collisions = LAUNCH_WORKSPACES.filter((w) => existingWs.some((e) => e.slug === w.slug));

  console.log(`mode:               ${APPLY ? "APPLY" : "DRY RUN (pass --apply to execute)"}`);
  console.log(`creatives to soft-delete: ${liveCreatives}`);
  console.log(`existing workspaces:      ${existingWs.map((w) => `${w.name} [${w.type}]`).join(", ") || "none"}`);
  console.log(`workspaces to create:     ${LAUNCH_WORKSPACES.filter((w) => !collisions.includes(w)).map((w) => w.name).join(", ") || "none (all exist)"}`);
  if (collisions.length) console.log(`already present (skipped): ${collisions.map((w) => w.name).join(", ")}`);
  if (!owner) {
    console.error(`\nABORT: no user found for ${ownerEmail}. Sign in once with that Google account first, or pass --owner <existing-email>.`);
    process.exit(1);
  }
  console.log(`owner:              ${owner.email}`);

  if (!APPLY) return;

  const wiped = await prisma.creative.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date() },
  });
  console.log(`\nsoft-deleted ${wiped.count} creatives`);

  for (const w of LAUNCH_WORKSPACES) {
    if (collisions.includes(w)) continue;
    const ws = await prisma.workspace.create({
      data: {
        name: w.name,
        slug: w.slug,
        type: w.type,
        ownerUserId: owner.id,
        credits: { create: { balance: 0 } },
        memberships: { create: { userId: owner.id, role: "OWNER" } },
      },
    });
    console.log(`created ${ws.name} (${ws.type}) — ${ws.id}`);
  }
  console.log("\nDone. Next: open /admin → enter each workspace → set up brand + products, grant credits, invite users.");
}

main().catch((e) => {
  console.error("setup failed:", e.message);
  process.exit(1);
});
