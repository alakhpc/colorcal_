import { Database, makeDrizzle } from "@colorcal/db";
import { AppLoadContext } from "@remix-run/cloudflare";

export async function getDb(context: AppLoadContext) {
  return await makeDrizzle(context.cloudflare.env.DB);
}

export async function getGcalAccount(userId: string, db: Database) {
  const gcalAccount = await db.query.gcalAccountsTable.findFirst({
    where: (gcalAccountsTable, { eq }) => eq(gcalAccountsTable.userId, userId),
  });

  return gcalAccount;
}
