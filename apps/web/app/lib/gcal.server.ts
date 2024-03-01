import { Database } from "@colorcal/db";
import { GcalAccount } from "@colorcal/db/tables";
import { GoogleCalendarAPI } from "@colorcal/gcal";
import { AppLoadContext } from "@remix-run/cloudflare";
import { env } from "./env.server";

type Tokens = Pick<GcalAccount, "accessToken" | "refreshToken" | "accessTokenExpiresAt">;

interface GetGcalApiArgs extends Tokens {
  context: AppLoadContext;
  db: Database;
}

export function getGcalApi(args: GetGcalApiArgs) {
  const { context, db, accessToken, refreshToken, accessTokenExpiresAt } = args;
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = env(context);
  return new GoogleCalendarAPI({
    db,
    clientId,
    clientSecret,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
  });
}
