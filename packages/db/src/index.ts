import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as relations from "./relations";
import * as tables from "./tables";

export async function makeDrizzle(d1: D1Database) {
  const db = drizzle(d1, { schema: { ...tables, ...relations } });
  await db.run(sql`PRAGMA foreign_keys = ON;`);
  return db;
}

export type Database = Awaited<ReturnType<typeof makeDrizzle>>;
