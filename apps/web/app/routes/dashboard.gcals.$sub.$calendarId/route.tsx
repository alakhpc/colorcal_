import { and, eq } from "@colorcal/db/drizzle";
import { gcalAccountsTable, gcalEventChannelsTable, usersTable } from "@colorcal/db/tables";
import { GoogleCalendarAPI } from "@colorcal/gcal";
import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { nanoid } from "nanoid";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Switch } from "~/components/ui/switch";
import { getDb } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";
import { createWebhookUrl } from "~/lib/url.server";
import { GCAL_EVENTS_WEBHOOK_PATH } from "../api.webhooks.gcal.events/route";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const sub = params.sub;
  invariant(sub, "No sub param");

  const calendarId = params.calendarId;
  invariant(calendarId, "No calendarId param");

  const userId = await requireUserId({ request, context });

  const db = await getDb(context);

  const channel = await db
    .select({ channelId: gcalEventChannelsTable.channelId })
    .from(gcalEventChannelsTable)
    .innerJoin(gcalAccountsTable, eq(gcalEventChannelsTable.gcalAccountSub, gcalAccountsTable.sub))
    .innerJoin(usersTable, eq(gcalAccountsTable.userId, usersTable.id))
    .where(
      and(
        eq(usersTable.id, userId),
        eq(gcalEventChannelsTable.gcalAccountSub, sub),
        eq(gcalEventChannelsTable.calendarId, calendarId),
      ),
    )
    .then((v) => v[0]);

  return { enabled: channel !== undefined };
}

const formSchema = z.object({ enableAISorting: z.string().transform((v) => v === "true") });

export async function action({ request, context, params }: ActionFunctionArgs) {
  const sub = params.sub;
  invariant(sub, "No sub param");

  const calendarId = params.calendarId;
  invariant(calendarId, "No calendarId param");

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: formSchema });

  if (submission.status !== "success") {
    return json(submission.reply());
  }

  const userId = await requireUserId({ request, context });

  const { enableAISorting } = submission.value;
  const db = await getDb(context);

  const gcalAccount = await db.query.gcalAccountsTable.findFirst({
    where: (gcalAccountsTable, { and, eq }) =>
      and(eq(gcalAccountsTable.sub, sub), eq(gcalAccountsTable.userId, userId)),
  });

  invariant(gcalAccount, "No gcal account");

  const existingChannelId = await db
    .select({ channelId: gcalEventChannelsTable.channelId })
    .from(gcalEventChannelsTable)
    .innerJoin(gcalAccountsTable, eq(gcalEventChannelsTable.gcalAccountSub, gcalAccountsTable.sub))
    .innerJoin(usersTable, eq(gcalAccountsTable.userId, usersTable.id))
    .where(and(eq(usersTable.id, userId), eq(gcalEventChannelsTable.calendarId, calendarId)))
    .then((v) => v[0]?.channelId);

  const gcalApi = new GoogleCalendarAPI({
    db,
    clientId: context.cloudflare.env.GOOGLE_CLIENT_ID,
    clientSecret: context.cloudflare.env.GOOGLE_CLIENT_SECRET,
    accessToken: gcalAccount.accessToken,
    refreshToken: gcalAccount.refreshToken,
    accessTokenExpiresAt: gcalAccount.accessTokenExpiresAt,
  });

  if (!enableAISorting) {
    if (!existingChannelId) {
      return new Response(null, { status: 404 });
    }

    const deleted = await db
      .delete(gcalEventChannelsTable)
      .where(eq(gcalEventChannelsTable.channelId, existingChannelId))
      .returning({ resourceId: gcalEventChannelsTable.resourceId })
      .then((v) => v[0]);

    if (deleted) {
      await gcalApi.stopChannel({ id: existingChannelId, resourceId: deleted.resourceId });
    }

    return null;
  }

  if (existingChannelId) return null;

  let nextSyncToken = undefined;
  let nextPageToken = undefined;
  while (!nextSyncToken) {
    const eventsResponse = await gcalApi.listEvents({
      calendarId,
      maxResults: 2500,
      pageToken: nextPageToken,
      syncToken: nextSyncToken,
    });

    nextSyncToken = eventsResponse.nextSyncToken;
    nextPageToken = eventsResponse.nextPageToken;
  }

  const channelId = nanoid();
  const address = createWebhookUrl({ request, context, path: GCAL_EVENTS_WEBHOOK_PATH });
  const response = await gcalApi.watchEvents({ id: channelId, address, calendarId });
  const channelExpiration = response.expiration
    ? new Date(parseInt(response.expiration))
    : undefined;

  await db
    .insert(gcalEventChannelsTable)
    .values({
      channelId,
      calendarId,
      channelExpiration,
      gcalAccountSub: sub,
      syncToken: nextSyncToken,
      resourceId: response.resourceId,
    })
    .onConflictDoNothing();

  return null;
}

export default function GcalAccount() {
  const { enabled } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();

  return (
    <div className="p-4 border flex flex-col gap-8 rounded-lg grow">
      <div className="font-cal text-4xl">Settings</div>
      <div className="flex gap-2">
        <span>Enable AI sorting</span>
        <Switch
          name="enableAISorting"
          disabled={fetcher.state !== "idle"}
          checked={enabled}
          onCheckedChange={(v) => {
            fetcher.submit({ enableAISorting: v }, { method: "POST" });
          }}
        />
      </div>
    </div>
  );
}
