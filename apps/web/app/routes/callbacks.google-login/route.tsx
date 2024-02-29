import { and, eq } from "@colorcal/db";
import { oauthAccounts, users } from "@colorcal/db/schema";
import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { nanoid } from "nanoid";
import { handleGoogleCallback } from "~/lib/auth.server";
import { getDb } from "~/lib/db.server";
import { createSession, getSessionStorage } from "~/lib/sessions.server";

const CALLBACK_PATH = "/callbacks/google-login";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const tokens = await handleGoogleCallback({ request, context, callbackPath: CALLBACK_PATH });

  const db = await getDb(context);

  const existingAccount = await db.query.oauthAccounts.findFirst({
    columns: { userId: true },
    where: and(
      eq(oauthAccounts.providerId, "google"),
      eq(oauthAccounts.providerUserId, tokens.idToken.sub),
    ),
  });

  if (existingAccount) {
    const session = await createSession({ request, context, userId: existingAccount.userId });

    throw redirect("/dashboard", {
      headers: {
        "Set-Cookie": await getSessionStorage(context).commitSession(session),
      },
    });
  }

  const userId = nanoid();

  await db.batch([
    db.insert(users).values({ id: userId }),
    db
      .insert(oauthAccounts)
      .values({ userId, providerId: "google", providerUserId: tokens.idToken.sub }),
  ]);

  const session = await createSession({ request, context, userId });

  throw redirect("/dashboard", {
    headers: {
      "Set-Cookie": await getSessionStorage(context).commitSession(session),
    },
  });
}
