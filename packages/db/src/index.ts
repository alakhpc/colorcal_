import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function makeDrizzle(d1: D1Database) {
  const db = drizzle(d1, { schema });
  await db.run(sql`PRAGMA foreign_keys = ON;`);
  return db;
}
