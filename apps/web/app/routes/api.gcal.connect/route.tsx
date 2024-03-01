import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { generateGoogleUrl } from "~/lib/auth.server";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);
  // Already connected
  if (gcalAccount) throw redirect("/dashboard");

  const googleGen = await generateGoogleUrl({
    request,
    context,
    scopes: SCOPES,
    callbackPath: "/callbacks/gcal-connect",
  });
  googleGen.url.searchParams.set("prompt", "consent");
  googleGen.url.searchParams.set("access_type", "offline");

  throw redirect(googleGen.url.toString(), {
    headers: [
      ["Set-Cookie", googleGen.createdStateCookie],
      ["Set-Cookie", googleGen.createdCodeVerifierCookie],
    ],
  });
}
