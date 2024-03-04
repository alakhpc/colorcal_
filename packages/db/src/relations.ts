import { relations } from "drizzle-orm";
import {
  gcalAccountsTable,
  gcalEventChannelsTable,
  oauthAccountsTable,
  usersTable,
} from "./tables";

export const usersRelations = relations(usersTable, ({ many }) => ({
  oauthAccounts: many(oauthAccountsTable),
  gcalAccounts: many(gcalAccountsTable),
}));

export const oauthAccountsRelations = relations(oauthAccountsTable, ({ one }) => ({
  user: one(usersTable, { fields: [oauthAccountsTable.userId], references: [usersTable.id] }),
}));

export const gcalAccountsRelations = relations(gcalAccountsTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [gcalAccountsTable.userId], references: [usersTable.id] }),
  channels: many(gcalEventChannelsTable),
}));

export const gcalEventChannelsRelations = relations(gcalEventChannelsTable, ({ one }) => ({
  gcalAccount: one(gcalAccountsTable, {
    fields: [gcalEventChannelsTable.gcalAccountSub],
    references: [gcalAccountsTable.sub],
  }),
}));
