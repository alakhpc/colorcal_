import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
});

export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
  googleAccounts: many(googleAccounts),
}));

export const oauthAccounts = sqliteTable(
  "oauth_accounts",
  {
    providerId: text("provider_id"),
    providerUserId: text("provider_user_id"),

    userId: text("userId")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
  }),
);

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));

export const googleAccounts = sqliteTable("google_accounts", {
  id: text("id").primaryKey(),
  accessToken: text("access_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }).notNull(),

  userId: text("user_id")
    .notNull()
    .references(() => users.id),
});

export const googleAccountsRelations = relations(googleAccounts, ({ one, many }) => ({
  user: one(users, { fields: [googleAccounts.userId], references: [users.id] }),
  googleCalendars: many(googleCalendars),
}));

export const googleCalendars = sqliteTable("google_calendars", {
  id: text("id").primaryKey(),
  watchChannelId: text("watch_channel_id").notNull(),
  watchResourceId: text("watch_resource_id").notNull(),
  watchExpiration: integer("watch_expiration", { mode: "timestamp_ms" }).notNull(),

  googleAccountId: text("google_account_id")
    .notNull()
    .references(() => googleAccounts.id),
});

export const googleCalendarsRelations = relations(googleCalendars, ({ one }) => ({
  googleAccount: one(googleAccounts, {
    fields: [googleCalendars.googleAccountId],
    references: [googleAccounts.id],
  }),
}));
