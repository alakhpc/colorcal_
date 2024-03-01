import { watchedGcals } from "@colorcal/db/schema";
import { ActionFunctionArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

const watchGcalSchema = z.object({ id: z.string() });

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);

  invariant(gcalAccount, "User must have a Google Calendar account to watch a calendar");

  const formData = Object.fromEntries(await request.formData());
  const body = watchGcalSchema.parse(formData);

  await db
    .insert(watchedGcals)
    .values({ id: body.id, googleCalendarAccountSub: gcalAccount.sub })
    .execute();

  return null;
}
