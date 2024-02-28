import { makeDrizzle } from "@colorcal/db";
import { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function getDb(x: LoaderFunctionArgs["context"]) {
  const db = makeDrizzle(x.cloudflare.env.DB);
  return db;
}
