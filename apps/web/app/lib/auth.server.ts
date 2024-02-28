import { Google } from "arctic";
import { env } from "./env.server";

export const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar"];

export const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.APP_URL}/auth/google/callback`,
);
