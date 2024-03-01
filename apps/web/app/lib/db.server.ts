import { Database, makeDrizzle } from "@colorcal/db";
import { eq } from "@colorcal/db/drizzle";
import { gcalAccountsTable } from "@colorcal/db/tables";
import { AppLoadContext } from "@remix-run/cloudflare";

export async function getDb(context: AppLoadContext) {
  return await makeDrizzle(context.cloudflare.env.DB);
}

export async function getGcalAccount(userId: string, db: Database) {
  const gcalAccount = await db.query.gcalAccountsTable.findFirst({
    where: eq(gcalAccountsTable.userId, userId),
  });

  return gcalAccount;
}
