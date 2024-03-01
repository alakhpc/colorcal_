import { generateGoogleUrl } from "@colorcal/auth/google";
import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { stateCookie } from "~/lib/cookies.server";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { env } from "~/lib/env.server";
import { requireUserId } from "~/lib/sessions.server";
import { createAbsoluteUrl } from "~/lib/url.sever";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);
  // Already connected
  if (gcalAccount) throw redirect("/dashboard");

  const redirectUri = createAbsoluteUrl({ request, path: "/callbacks/gcal-connect" });
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = env(context);
  const { url, ...cookies } = await generateGoogleUrl({
    clientId,
    clientSecret,
    redirectUri,
    scopes: [CALENDAR_SCOPE],
  });

  url.searchParams.set("prompt", "consent");
  url.searchParams.set("access_type", "offline");

  throw redirect(url.toString(), {
    headers: [
      ["Set-Cookie", await stateCookie.serialize(cookies.state)],
      ["Set-Cookie", await stateCookie.serialize(cookies.codeVerifier)],
    ],
  });
}
