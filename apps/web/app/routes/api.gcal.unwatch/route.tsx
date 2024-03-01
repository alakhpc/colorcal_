import { eq } from "@colorcal/db/drizzle";
import { watchedGcalsTable } from "@colorcal/db/tables";
import { ActionFunctionArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

const unwatchGcalSchema = z.object({ id: z.string() });

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const formData = Object.fromEntries(await request.formData());
  const body = unwatchGcalSchema.parse(formData);

  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);

  invariant(gcalAccount, "User must have a Google Calendar account to unwatch a calendar");

  await db.delete(watchedGcalsTable).where(eq(watchedGcalsTable.id, body.id)).execute();

  return null;
}
