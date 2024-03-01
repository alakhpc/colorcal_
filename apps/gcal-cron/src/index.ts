import { Database, makeDrizzle } from "@colorcal/db";
import { eq } from "@colorcal/db/drizzle";
import { WatchedGcal, watchedGcalsTable } from "@colorcal/db/tables";
import { GoogleCalendarAPI } from "@colorcal/gcal";
import { GcalEvent } from "@colorcal/gcal/schema";

export interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  D1: D1Database;
}

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    const db = await makeDrizzle(env.D1);

    const gcalAccounts = await db.query.gcalAccountsTable.findMany({
      with: { watchedGcals: true },
    });

    const promises = gcalAccounts.map((account) => processGcalAccount(account, env, db));
    await Promise.all(promises);
  },
};

async function getGcalAccountsWithWatchedGcals(db: Database) {
  return await db.query.gcalAccountsTable.findMany({ with: { watchedGcals: true } });
}

type GcalAccountWithWatchedGcals = Awaited<
  ReturnType<typeof getGcalAccountsWithWatchedGcals>
>[number];

async function processGcalAccount(account: GcalAccountWithWatchedGcals, env: Env, db: Database) {
  const gcalApi = new GoogleCalendarAPI({
    db,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    accessTokenExpiresAt: account.accessTokenExpiresAt,
  });

  const promises = account.watchedGcals.map((wGcal) => processWatchedGcal(gcalApi, wGcal, db));
  await Promise.all(promises);
}

async function processWatchedGcal(gcal: GoogleCalendarAPI, watchedGcal: WatchedGcal, db: Database) {
  console.log(`Processing ${watchedGcal.id}`);

  const events = await gcal.eventsList({
    calendarId: watchedGcal.id,
    maxResults: 2500,
    syncToken: watchedGcal.syncToken,
  });

  await db
    .update(watchedGcalsTable)
    .set({ syncToken: events.nextSyncToken })
    .where(eq(watchedGcalsTable.id, watchedGcal.id));

  await Promise.all(events.items.map((event) => processEvent(event)));
}

async function processEvent(event: GcalEvent) {
  if (event.summary) console.log(`Updating ${event.summary}`);
}
