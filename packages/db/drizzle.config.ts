import type { Config } from "drizzle-kit";

export default {
  schema: ["./src/tables/*.ts", "./src/relations.ts"],
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: "../../.wrangler/v3/d1/miniflare-D1DatabaseObject/eda924b5668aadcaf99cdb3f8357ed6ea6766683ccb511b5bc07fe0cbd7ed0f9.sqlite",
  },
} satisfies Config;
