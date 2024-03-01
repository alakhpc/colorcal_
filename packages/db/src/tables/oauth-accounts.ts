import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { SchemaRelations, SchemaWithRelations } from "../types";
import { usersTable } from "./users";

export const oauthAccountsTable = sqliteTable(
  "oauth_accounts",
  {
    providerId: text("provider_id"),
    providerUserId: text("provider_user_id"),

    userId: text("userId")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
  }),
);

export type OauthAccount<T extends SchemaRelations<"oauthAccountsTable"> = never> =
  SchemaWithRelations<"oauthAccountsTable", T>;
