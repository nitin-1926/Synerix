import { schedules, logger } from "@trigger.dev/sdk";
import { healAllStalledRuns } from "@/lib/run-heal";

/**
 * Sweep runs whose worker died (OOM kill, crash) and left them non-terminal.
 * The studio page heals the run it is showing, but only while someone is
 * looking at it — a user who closed the tab kept a spinner and held credits
 * until they came back. This runs every 10 minutes regardless.
 */
export const healRuns = schedules.task({
  id: "heal-stalled-runs",
  cron: "*/10 * * * *",
  run: async () => {
    const { healed, runIds } = await healAllStalledRuns();
    if (healed > 0) logger.warn("healed stalled runs", { healed, runIds });
    return { healed };
  },
});
