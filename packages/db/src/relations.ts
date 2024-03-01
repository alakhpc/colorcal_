import { relations } from "drizzle-orm";
import { gcalAccountsTable, oauthAccountsTable, usersTable } from "./tables";
import { watchedGcalsTable } from "./tables/watched-gcals";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  oauthAccounts: many(oauthAccountsTable),
  gcalAccount: one(gcalAccountsTable),
}));

export const oauthAccountsRelations = relations(oauthAccountsTable, ({ one }) => ({
  user: one(usersTable, { fields: [oauthAccountsTable.userId], references: [usersTable.id] }),
}));

export const gcalAccountRelations = relations(gcalAccountsTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [gcalAccountsTable.userId], references: [usersTable.id] }),
  watchedGcals: many(watchedGcalsTable),
}));

export const watchedGcalsRelations = relations(watchedGcalsTable, ({ one }) => ({
  gcalAccount: one(gcalAccountsTable, {
    fields: [watchedGcalsTable.googleCalendarAccountSub],
    references: [gcalAccountsTable.sub],
  }),
}));
