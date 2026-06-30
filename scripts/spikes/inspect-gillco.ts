/**
 * READ-ONLY investigation: pull gillco workspace's recent creatives, download
 * the composed render + its master plate, and report plate-vs-canvas dims so we
 * can see whether images are being edge-cropped and why. No writes to the DB or
 * storage. Run:  npx tsx scripts/spikes/inspect-gillco.ts
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { PrismaClient } from "../../src/generated/prisma/client";

const OUT = "/private/tmp/claude-501/-Users-nitingupta-Desktop-Personal-Projects-Pinata/948c2ddc-3429-485d-8d1d-266633360cb2/scratchpad/gillco";
mkdirSync(OUT, { recursive: true });

function poolCfg(cs: string) {
  const url = new URL(cs.replace(/^postgresql:/, "http:"));
  return {
    host: url.hostname, port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "postgres",
    ssl: { rejectUnauthorized: false }, max: 3,
  };
}

const prisma = new PrismaClient({ adapter: new PrismaPg(poolCfg(process.env.DATABASE_URL!)) });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function dl(key: string, file: string) {
  const { data, error } = await sb.storage.from("media").download(key);
  if (error || !data) return { ok: false, err: error?.message };
  const buf = Buffer.from(await data.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const { writeFileSync } = await import("node:fs");
  writeFileSync(`${OUT}/${file}`, buf);
  return { ok: true, w: meta.width, h: meta.height, ratio: (meta.width! / meta.height!).toFixed(4) };
}

async function main() {
  const target = process.env.WS ?? "gillco";
  let ws = await prisma.workspace.findMany({
    where: { OR: [{ slug: { contains: target, mode: "insensitive" } }, { name: { contains: target, mode: "insensitive" } }] },
    select: { id: true, slug: true, name: true },
  });
  if (!ws.length) {
    console.log(`no "${target}" workspace; falling back to any workspace with ON_MODEL runs`);
    const onModelRuns = await prisma.generationRun.findMany({ where: { fidelityMode: "ON_MODEL" }, select: { workspaceId: true }, distinct: ["workspaceId"] });
    ws = await prisma.workspace.findMany({ where: { id: { in: onModelRuns.map(r => r.workspaceId) } }, select: { id: true, slug: true, name: true } });
  }
  console.log("WORKSPACES:", JSON.stringify(ws));
  if (!ws.length) { console.log("no ON_MODEL runs anywhere; all workspaces:", JSON.stringify(await prisma.workspace.findMany({ select: { slug: true, name: true } }))); return; }

  for (const w of ws) {
    const runs = await prisma.generationRun.findMany({
      where: { workspaceId: w.id },
      orderBy: { createdAt: "desc" }, take: 8,
      select: { id: true, fidelityMode: true, brandingMode: true, requestedAspects: true, status: true, createdAt: true },
    });
    console.log(`\n[${w.slug}] recent runs:`, JSON.stringify(runs.map(r => ({ id: r.id.slice(0,8), fid: r.fidelityMode, brand: r.brandingMode, asp: r.requestedAspects, st: r.status })), null, 0));

    const creatives = await prisma.creative.findMany({
      where: { generationRun: { workspaceId: w.id }, status: "READY" },
      orderBy: { createdAt: "desc" }, take: 6,
      select: {
        id: true, masterPlateKey: true, masterAspect: true, concept: true,
        generationRun: { select: { fidelityMode: true, brandingMode: true } },
        renders: { select: { aspectRatio: true, composedImageKey: true } },
      },
    });
    console.log(`[${w.slug}] READY creatives: ${creatives.length}`);
    let i = 0;
    for (const c of creatives) {
      i++;
      const fid = c.generationRun?.fidelityMode; const bm = c.generationRun?.brandingMode;
      const plate = c.masterPlateKey ? await dl(c.masterPlateKey, `c${i}_${fid}_plate.png`) : null;
      const render = c.renders[0]?.composedImageKey ? await dl(c.renders[0].composedImageKey, `c${i}_${fid}_render.png`) : null;
      console.log(`  c${i} [${fid}/${bm}] master=${c.masterAspect}`);
      console.log(`     plate ${c.masterPlateKey}: ${JSON.stringify(plate)}`);
      console.log(`     render(${c.renders[0]?.aspectRatio}) ${c.renders[0]?.composedImageKey}: ${JSON.stringify(render)}`);
    }
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
