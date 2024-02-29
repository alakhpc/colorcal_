import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
});

export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
  googleAccounts: many(googleCalendarAccounts),
}));

export const oauthAccounts = sqliteTable(
  "oauth_accounts",
  {
    providerId: text("provider_id"),
    providerUserId: text("provider_user_id"),

    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
  }),
);

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));

export const googleCalendarAccounts = sqliteTable("google_calendar_accounts", {
  sub: text("sub").primaryKey(),
  accessToken: text("access_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }).notNull(),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const googleAccountsRelations = relations(googleCalendarAccounts, ({ one, many }) => ({
  user: one(users, { fields: [googleCalendarAccounts.userId], references: [users.id] }),
  googleCalendars: many(googleCalendars),
}));

export const googleCalendars = sqliteTable("google_calendars", {
  id: text("id").primaryKey(),
  watchChannelId: text("watch_channel_id").notNull(),
  watchResourceId: text("watch_resource_id").notNull(),
  watchExpiration: integer("watch_expiration", { mode: "timestamp_ms" }).notNull(),

  googleCalendarAccountSub: text("google_account_id")
    .notNull()
    .references(() => googleCalendarAccounts.sub, { onDelete: "cascade" }),
});

export const googleCalendarsRelations = relations(googleCalendars, ({ one }) => ({
  googleAccount: one(googleCalendarAccounts, {
    fields: [googleCalendars.googleCalendarAccountSub],
    references: [googleCalendarAccounts.sub],
  }),
}));
