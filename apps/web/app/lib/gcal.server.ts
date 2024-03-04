import { Database } from "@colorcal/db";
import { GcalAccount } from "@colorcal/db/tables";
import { GoogleCalendarAPI } from "@colorcal/gcal";
import { AppLoadContext } from "@remix-run/cloudflare";

type Tokens = Pick<GcalAccount, "accessToken" | "refreshToken" | "accessTokenExpiresAt">;

interface GetGcalApiArgs extends Tokens {
  context: AppLoadContext;
  db: Database;
}

export function getGcalApi(args: GetGcalApiArgs) {
  const { context, db, accessToken, refreshToken, accessTokenExpiresAt } = args;
  return new GoogleCalendarAPI({
    db,
    clientId: context.cloudflare.env.GOOGLE_CLIENT_ID,
    clientSecret: context.cloudflare.env.GOOGLE_CLIENT_SECRET,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
  });
}
