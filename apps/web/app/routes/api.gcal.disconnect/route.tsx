import { ActionFunctionArgs } from "@remix-run/cloudflare";
import { getDb } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const userId = await requireUserId({ request, context });
  const db = await getDb(context);
}
