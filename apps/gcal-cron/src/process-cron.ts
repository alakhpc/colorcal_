import { Database } from "@colorcal/db";
import { eq } from "@colorcal/db/drizzle";
import { GcalAccount, WatchedGcal, watchedGcalsTable } from "@colorcal/db/tables";
import { GcalCalendar, GoogleCalendarAPI } from "@colorcal/gcal";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Env } from "./types";

interface ProcessGcalAccountArgs {
  account: GcalAccount<"watchedGcals">;
  db: Database;
  env: Env;
}

export async function processGcalAcount({ account, db, env }: ProcessGcalAccountArgs) {
  const gcalApi = new GoogleCalendarAPI({
    db,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    accessTokenExpiresAt: account.accessTokenExpiresAt,
  });

  const gcals = (await gcalApi.calendarList()).items;

  const promises = account.watchedGcals.map((watchedGcal) =>
    processWatchedGcal({ gcalApi, gcals, watchedGcal, db, env }),
  );

  await Promise.allSettled(promises);
}

interface ProcessWatchedGcalArgs {
  gcalApi: GoogleCalendarAPI;
  gcals: GcalCalendar[];
  watchedGcal: WatchedGcal;
  db: Database;
  env: Env;
}

async function processWatchedGcal(params: ProcessWatchedGcalArgs) {
  const { gcalApi, gcals, watchedGcal, db, env } = params;
  const events = await gcalApi.eventsList({
    calendarId: watchedGcal.id,
    maxResults: 2500,
    syncToken: watchedGcal.syncToken,
  });

  await db
    .update(watchedGcalsTable)
    .set({ syncToken: events.nextSyncToken })
    .where(eq(watchedGcalsTable.id, watchedGcal.id));

  const eventsToProcess = events.items
    .filter((e) => e.summary)
    .filter((e) => e.status !== "cancelled" && (!e.eventType || e.eventType === "default"));

  const writableGcals = gcals
    .filter((g) => g.accessRole !== "freeBusyReader" && g.accessRole !== "reader")
    .map((g) => g.summary);

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: { temperature: 0, maxOutputTokens: 50 },
  });

  const prompt = makePrompt(
    eventsToProcess.map((e) => e.summary!),
    writableGcals,
  );

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const calendarId = watchedGcal.id;
  const promises = text.split("\n").map((maybeBucket, i) => {
    const destination = gcals.find((c) => c.summary === maybeBucket)?.id;
    if (!destination || destination === watchedGcal.id) return;
    const eventId = eventsToProcess?.[i]?.id;
    if (!eventId) return;
    return gcalApi.moveEvent({ eventId, calendarId, destination });
  });

  await Promise.allSettled(promises);
}

function makePrompt(items: string[], buckets: string[]) {
  return `Classify these events ${JSON.stringify(items)} into these buckets: ${buckets.join(",")}. Respond only with the bucket names, in order, one on each line.`;
}
