import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { SchemaRelations, SchemaWithRelations } from "../types";
import { usersTable } from "./users";

export interface CalendarListItem {
  id: string;
  summary: string;
  accessRole: "freeBusyReader" | "reader" | "writer" | "owner";
}

export const gcalAccountsTable = sqliteTable("gcal_accounts", {
  sub: text("sub").primaryKey(),
  accessToken: text("access_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }).notNull(),

  channelId: text("channel_id").notNull().unique(),
  resourceId: text("resource_id").notNull().unique(),
  channelExpiration: integer("channel_expiration", { mode: "timestamp_ms" }),
  calendarList: text("calendar_list", { mode: "json" }).$type<CalendarListItem[]>().notNull(),

  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export type GcalAccount<T extends SchemaRelations<"gcalAccountsTable"> = never> =
  SchemaWithRelations<"gcalAccountsTable", T>;
