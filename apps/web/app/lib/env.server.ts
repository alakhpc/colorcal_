import { AppLoadContext } from "@remix-run/cloudflare";
import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

export function env(context: AppLoadContext) {
  return envSchema.parse(context.cloudflare.env);
}
