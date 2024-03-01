import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { SchemaRelations, SchemaWithRelations } from "../types";

export const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
});

export type User<T extends SchemaRelations<"usersTable"> = never> = SchemaWithRelations<
  "usersTable",
  T
>;
