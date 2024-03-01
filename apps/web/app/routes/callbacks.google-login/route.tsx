import { and, eq } from "@colorcal/db/drizzle";
import { oauthAccountsTable, usersTable } from "@colorcal/db/tables";
import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { nanoid } from "nanoid";
import { handleGoogleCallback } from "~/lib/auth.server";
import { getDb } from "~/lib/db.server";
import { createSession, getSessionStorage } from "~/lib/sessions.server";

const CALLBACK_PATH = "/callbacks/google-login";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const tokens = await handleGoogleCallback({ request, context, callbackPath: CALLBACK_PATH });

  const db = await getDb(context);

  const existingAccount = await db.query.oauthAccountsTable.findFirst({
    columns: { userId: true },
    where: and(
      eq(oauthAccountsTable.providerId, "google"),
      eq(oauthAccountsTable.providerUserId, tokens.idToken.sub),
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
    db.insert(usersTable).values({ id: userId }),
    db
      .insert(oauthAccountsTable)
      .values({ userId, providerId: "google", providerUserId: tokens.idToken.sub }),
  ]);

  const session = await createSession({ request, context, userId });

  throw redirect("/dashboard", {
    headers: {
      "Set-Cookie": await getSessionStorage(context).commitSession(session),
    },
  });
}
