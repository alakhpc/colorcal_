import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { SchemaRelations, SchemaWithRelations } from "../types";
import { gcalAccountsTable } from "./gcal-accounts";

export const watchedGcalsTable = sqliteTable("watched_gcals", {
  id: text("id").primaryKey(),
  syncToken: text("sync_token").notNull(),
  googleCalendarAccountSub: text("google_account_id")
    .notNull()
    .references(() => gcalAccountsTable.sub, { onDelete: "cascade" }),
});

export type WatchedGcal<T extends SchemaRelations<"watchedGcalsTable"> = never> =
  SchemaWithRelations<"watchedGcalsTable", T>;
