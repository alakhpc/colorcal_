import { makeDrizzle } from "@colorcal/db";
import { processGcalAcount } from "./process-cron";
import { Env } from "./types";

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    const db = await makeDrizzle(env.D1);

    const gcalAccounts = await db.query.gcalAccountsTable.findMany({
      with: { watchedGcals: true },
    });

    const promises = gcalAccounts.map((account) => processGcalAcount({ account, db, env }));
    await Promise.all(promises);
  },
};
