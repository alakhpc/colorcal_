import { watchedGcalsTable } from "@colorcal/db/tables";
import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { getGcalApi } from "~/lib/gcal.server";
import { requireUserId } from "~/lib/sessions.server";

const watchGcalSchema = z.object({ id: z.string() });

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: watchGcalSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);

  invariant(gcalAccount, "User must have a Google Calendar account to watch a calendar");

  const gcalApi = getGcalApi({ db, context, ...gcalAccount });

  // ignore past events and get sync-token
  let pageToken = undefined;
  let syncToken = undefined;
  while (syncToken === undefined) {
    const events = await gcalApi.eventsList({
      calendarId: submission.value.id,
      maxResults: 2500,
      pageToken,
    });
    pageToken = events.nextPageToken;
    syncToken = events.nextSyncToken;
  }

  await db
    .insert(watchedGcalsTable)
    .values({ id: submission.value.id, googleCalendarAccountSub: gcalAccount.sub, syncToken })
    .execute();

  return null;
}
