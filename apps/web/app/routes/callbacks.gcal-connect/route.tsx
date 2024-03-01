import { gcalAccounts } from "@colorcal/db/schema";
import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { handleGoogleCallback } from "~/lib/auth.server";
import { getDb } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

const CALLBACK_PATH = "/callbacks/gcal-connect";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId({ request, context });
  const tokens = await handleGoogleCallback({ request, context, callbackPath: CALLBACK_PATH });

  invariant(tokens.refreshToken, "No refresh token");

  const db = await getDb(context);

  await db
    .insert(gcalAccounts)
    .values({
      userId,
      sub: tokens.idToken.sub,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    })
    .onConflictDoUpdate({
      target: gcalAccounts.sub,
      set: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      },
    });

  throw redirect("/dashboard");
}
