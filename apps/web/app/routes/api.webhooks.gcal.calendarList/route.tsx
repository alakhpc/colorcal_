import { Database } from "@colorcal/db";
import { and, eq, notInArray } from "@colorcal/db/drizzle";
import { GcalAccount, gcalAccountsTable, gcalEventChannelsTable } from "@colorcal/db/tables";
import { GoogleCalendarAPI } from "@colorcal/gcal";
import { ActionFunctionArgs, AppLoadContext } from "@remix-run/cloudflare";
import { getDb } from "~/lib/db.server";

export const GCAL_CALENDAR_LIST_WEBHOOK_PATH = "/api/webhooks/gcal/calendarList";

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

  const gcalAccount = await db.query.gcalAccountsTable.findFirst({
    where: (gcalAccountsTable, { and, eq }) =>
      and(eq(gcalAccountsTable.channelId, channelId), eq(gcalAccountsTable.resourceId, resourceId)),
  });

  if (!gcalAccount) {
    return new Response(null, { status: 404 });
  }

  const handlePromise = handleCalendarListMessage({ db, context, gcalAccount });
  context.cloudflare.ctx.waitUntil(handlePromise);

  return new Response(null, { status: 200 });
}

interface HandleCalendarListMessageArgs {
  db: Database;
  context: AppLoadContext;
  gcalAccount: GcalAccount;
}

async function handleCalendarListMessage(args: HandleCalendarListMessageArgs) {
  const { db, context, gcalAccount } = args;

  const gcalApi = new GoogleCalendarAPI({
    db,
    clientId: context.cloudflare.env.GOOGLE_CLIENT_ID,
    clientSecret: context.cloudflare.env.GOOGLE_CLIENT_SECRET,
    accessToken: gcalAccount.accessToken,
    refreshToken: gcalAccount.refreshToken,
    accessTokenExpiresAt: gcalAccount.accessTokenExpiresAt,
  });

  const _calendarList = await gcalApi.listCalendarList();
  const calendarList = _calendarList.items.map((c) => ({
    id: c.id,
    summary: c.summary,
    accessRole: c.accessRole,
  }));

  const deletedEventChannels = await db
    .delete(gcalEventChannelsTable)
    .where(
      and(
        eq(gcalEventChannelsTable.gcalAccountSub, gcalAccount.sub),
        notInArray(
          gcalEventChannelsTable.calendarId,
          calendarList.map((c) => c.id),
        ),
      ),
    )
    .returning({
      channelId: gcalEventChannelsTable.channelId,
      resourceId: gcalEventChannelsTable.resourceId,
    });

  await Promise.allSettled(
    deletedEventChannels.map(async ({ channelId, resourceId }) => {
      await gcalApi.stopChannel({ id: channelId, resourceId });
    }),
  );

  await db
    .update(gcalAccountsTable)
    .set({ calendarList })
    .where(eq(gcalAccountsTable.sub, gcalAccount.sub));
}
