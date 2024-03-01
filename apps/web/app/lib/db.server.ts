import { Database, eq, makeDrizzle } from "@colorcal/db";
import { gcalAccounts } from "@colorcal/db/schema";
import { AppLoadContext } from "@remix-run/cloudflare";

export async function getDb(context: AppLoadContext) {
  return await makeDrizzle(context.cloudflare.env.DB);
}

export async function getGcalAccount(userId: string, db: Database) {
  const gcalAccount = await db.query.gcalAccounts.findFirst({
    where: eq(gcalAccounts.userId, userId),
  });

  return gcalAccount;
}
