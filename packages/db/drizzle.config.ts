import type { Config } from "drizzle-kit";

export default {
  schema: ["./src/tables/*.ts", "./src/relations.ts"],
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: "../../.wrangler/v3/d1/miniflare-D1DatabaseObject/c15aec3e0c24f3884222853037b835aaee381627006c7d665ed1aeb2ab255fcf.sqlite",
  },
} satisfies Config;
