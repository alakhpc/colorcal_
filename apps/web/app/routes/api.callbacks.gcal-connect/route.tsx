import { gcalAccountsTable } from "@colorcal/db/tables";
import { GoogleCalendarAPI } from "@colorcal/gcal";
import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { nanoid } from "nanoid";
import invariant from "tiny-invariant";
import { handleGoogleCallback } from "~/lib/auth.server";
import { getDb } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";
import { createWebhookUrl } from "~/lib/url.server";
import { GCAL_CALENDAR_LIST_WEBHOOK_PATH } from "../api.webhooks.gcal.calendarList/route";

export const GCAL_CONNECT_CALLBACK_PATH = "/api/callbacks/gcal-connect";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId({ request, context });

  const tokens = await handleGoogleCallback({
    request,
    context,
    callbackPath: GCAL_CONNECT_CALLBACK_PATH,
  });

  invariant(tokens.refreshToken, "No refresh token");

  const db = await getDb(context);

  const existingGcalAccount = await db.query.gcalAccountsTable.findFirst({
    columns: { sub: true },
    where: (gcalAccountsTable, { eq }) => eq(gcalAccountsTable.sub, tokens.idToken.sub),
  });

  invariant(!existingGcalAccount, "Account already exists");

  const gcalApi = new GoogleCalendarAPI({
    db,
    clientId: context.cloudflare.env.GOOGLE_CLIENT_ID,
    clientSecret: context.cloudflare.env.GOOGLE_CLIENT_SECRET,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
  });

  const _calendarList = await gcalApi.listCalendarList();
  const calendarList = _calendarList.items.map((c) => ({
    id: c.id,
    summary: c.summary,
    accessRole: c.accessRole,
  }));

  const channelId = nanoid();
  const address = createWebhookUrl({ request, context, path: GCAL_CALENDAR_LIST_WEBHOOK_PATH });
  const watchResponse = await gcalApi.watchCalendarList({ id: channelId, address });
  const channelExpiration = watchResponse.expiration
    ? new Date(parseInt(watchResponse.expiration))
    : undefined;

  await db
    .insert(gcalAccountsTable)
    .values({
      userId,
      calendarList,
      sub: tokens.idToken.sub,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      channelId: watchResponse.id,
      resourceId: watchResponse.resourceId,
      channelExpiration,
    })
    .onConflictDoUpdate({
      target: gcalAccountsTable.sub,
      set: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      },
    });

  throw redirect("/dashboard");
}
