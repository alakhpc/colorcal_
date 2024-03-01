import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { SchemaRelations, SchemaWithRelations } from "../types";
import { usersTable } from "./users";

export const gcalAccountsTable = sqliteTable("google_calendar_accounts", {
  sub: text("sub").primaryKey(),
  accessToken: text("access_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }).notNull(),

  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export type GcalAccount<T extends SchemaRelations<"gcalAccountsTable"> = never> =
  SchemaWithRelations<"gcalAccountsTable", T>;
