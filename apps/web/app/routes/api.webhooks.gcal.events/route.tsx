import { Database } from "@colorcal/db";
import { eq } from "@colorcal/db/drizzle";
import { CalendarListItem, GcalEventsChannel, gcalEventChannelsTable } from "@colorcal/db/tables";
import { GcalEvent, GoogleCalendarAPI } from "@colorcal/gcal";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ActionFunctionArgs, AppLoadContext } from "@remix-run/cloudflare";
import { getDb } from "~/lib/db.server";

export const GCAL_EVENTS_WEBHOOK_PATH = "/api/webhooks/gcal/events";

export async function action({ request, context }: ActionFunctionArgs) {
  const channelId = request.headers.get("x-goog-channel-id");
  const resourceId = request.headers.get("x-goog-resource-id");
  const resourceUri = request.headers.get("x-goog-resource-uri");
  const resourceState = request.headers.get("x-goog-resource-state");
  const messageNumber = request.headers.get("x-goog-message-number");

  if (!resourceState || !channelId || !resourceId || !resourceUri || !messageNumber) {
    return new Response(null, { status: 400 });
  }

  const db = await getDb(context);

  const channel = await db.query.gcalEventChannelsTable.findFirst({
    with: { gcalAccount: true },
    where: (gcalEventChannelsTable, { and, eq }) =>
      and(
        eq(gcalEventChannelsTable.channelId, channelId),
        eq(gcalEventChannelsTable.resourceId, resourceId),
      ),
  });

  if (!channel) {
    return new Response(null, { status: 404 });
  }

  const handlePromise = handleEventsMessage({ db, context, channel });
  context.cloudflare.ctx.waitUntil(handlePromise);

  return new Response(null, { status: 200 });
}

interface HandleEventsMessageArgs {
  db: Database;
  context: AppLoadContext;
  channel: GcalEventsChannel<"gcalAccount">;
}

async function handleEventsMessage(args: HandleEventsMessageArgs) {
  const { db, context, channel } = args;

  const gcalApi = new GoogleCalendarAPI({
    db,
    clientId: context.cloudflare.env.GOOGLE_CLIENT_ID,
    clientSecret: context.cloudflare.env.GOOGLE_CLIENT_SECRET,
    accessToken: channel.gcalAccount.accessToken,
    refreshToken: channel.gcalAccount.refreshToken,
    accessTokenExpiresAt: channel.gcalAccount.accessTokenExpiresAt,
  });

  const allEvents: GcalEvent[] = [];
  let nextSyncToken = undefined;
  let nextPageToken = undefined;
  while (!nextSyncToken) {
    const eventsResponse = await gcalApi.listEvents({
      maxResults: 2500,
      eventTypes: "default",
      pageToken: nextPageToken,
      syncToken: channel.syncToken,
      calendarId: channel.calendarId,
    });

    allEvents.push(...eventsResponse.items);

    nextSyncToken = eventsResponse.nextSyncToken;
    nextPageToken = eventsResponse.nextPageToken;
  }

  await db
    .update(gcalEventChannelsTable)
    .set({ syncToken: nextSyncToken })
    .where(eq(gcalEventChannelsTable.channelId, channel.channelId));

  const writableCalendars = channel.gcalAccount.calendarList.filter(
    (v) => v.accessRole === "writer" || v.accessRole === "owner",
  );

  const interestingEvents = allEvents
    .filter((event) => event.summary)
    .filter((e) => e.status !== "cancelled" && (!e.eventType || e.eventType === "default"));

  await Promise.allSettled(
    interestingEvents.map(async (event) => {
      const destination = await doAIStuff({ context, event, calendars: writableCalendars });
      if (!destination || destination === channel.calendarId) return;
      await gcalApi.moveEvent({ eventId: event.id, calendarId: channel.calendarId, destination });
    }),
  );
}

interface DoAIStuffArgs {
  context: AppLoadContext;
  event: GcalEvent;
  calendars: CalendarListItem[];
}

async function doAIStuff(args: DoAIStuffArgs) {
  const { context, event, calendars } = args;
  if (!event.summary) return;
  if (calendars.length === 0) return;

  const buckets = calendars.map((c) => c.summary).join(", ") + ", Other";

  const genAI = new GoogleGenerativeAI(context.cloudflare.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: { temperature: 0, maxOutputTokens: 50 },
  });

  const prompt = `Classify this task ${JSON.stringify(event.summary)} into these buckets: ${buckets}. Respond only with the bucket name.`;

  console.log("Prompting AI with:", prompt);

  const result = await model.generateContent(prompt);
  const maybeBucket = result.response.text();

  console.log("AI responded with:", maybeBucket);

  return calendars.find((c) => c.summary === maybeBucket)?.id;
}
