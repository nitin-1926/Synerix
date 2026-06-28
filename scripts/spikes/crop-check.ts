/** Prove the PLAIN on-model deliverable now anchors its crop through the REAL
 * chain: analyzePlate → plateFocusYFor → plain spec → renderOverlay. Read-only. */
import { readFileSync, writeFileSync } from "node:fs";
import { renderOverlay } from "../../src/lib/composition/render";
import { analyzePlate } from "../../src/lib/composition/analyze";
import { plateFocusYFor } from "../../src/lib/composition/archetypes";
import type { OverlaySpec } from "../../src/lib/composition/types";

const DIR = "/private/tmp/claude-501/-Users-nitingupta-Desktop-Personal-Projects-Pinata/948c2ddc-3429-485d-8d1d-266633360cb2/scratchpad/gillco";
const plate = readFileSync(`${DIR}/c1_IN_SCENE_plate.png`); // off-ratio 2:3, subject high

const plainSpec = (focusY?: number): OverlaySpec => ({
  version: 2, archetype: "plain", canvas: { width: 1080, height: 1350 }, plateFit: "cover",
  ...(focusY !== undefined && focusY !== 0.5 ? { plateFocusY: focusY } : {}),
  scrims: [], textLayers: [], language: "en",
});

(async () => {
  const analysis = await analyzePlate(plate).catch(() => null);
  const focusY = plateFocusYFor(analysis?.safeBand);
  console.log(`safeBand=${analysis?.safeBand} → plateFocusY=${focusY}`);
  const oldWay = await renderOverlay(plainSpec(0.5), { plate });
  const newWay = await renderOverlay(plainSpec(focusY), { plate });
  writeFileSync(`${DIR}/plain_old_center.png`, oldWay);
  writeFileSync(`${DIR}/plain_new_anchored.png`, newWay);
  console.log("wrote plain_old_center.png + plain_new_anchored.png");
})();
