import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/libsql";

export const users = sqliteTable("users", {
  id: text("userId").primaryKey(),
});

export const signInAccounts = sqliteTable("sign_in_accounts", {
  googleUserId: text("googleId").primaryKey(),
  id: text("userId"),
});

export const googleCalendar = sqliteTable("google_calendar", {
  calendarId: text("calendarId").primaryKey(),
  googleAccountId: text("userId"),
  watchChannelId: text("watchChannelId"),
  watchResourceId: text("watchResourceId"),
  watchExpiration: integer("watchExpiration"),
});

export const googleCalendarAccounts = sqliteTable("google_calendar_accounts", {
  googleAccountId: text("googleAccountId").primaryKey(),
  userId: text("userId"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiration: integer("accessTokenExpiration"),
});
