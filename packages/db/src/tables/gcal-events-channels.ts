import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { SchemaRelations, SchemaWithRelations } from "../types";
import { gcalAccountsTable } from "./gcal-accounts";

export const gcalEventChannelsTable = sqliteTable("gcal_event_channels", {
  channelId: text("channel_id").primaryKey(),
  resourceId: text("resource_id").notNull().unique(),
  channelExpiration: integer("channel_expiration", { mode: "timestamp_ms" }),

  calendarId: text("calendar_id").notNull().unique(),
  syncToken: text("sync_token").notNull(),

  gcalAccountSub: text("gcal_account_id")
    .notNull()
    .references(() => gcalAccountsTable.sub, { onDelete: "cascade" }),
});

export type GcalEventsChannel<T extends SchemaRelations<"gcalEventChannelsTable"> = never> =
  SchemaWithRelations<"gcalEventChannelsTable", T>;
