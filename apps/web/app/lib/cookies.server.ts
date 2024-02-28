import { createCookie } from "@remix-run/cloudflare";

export const stateCookie = createCookie("state", {
  encode: (value) => value,
  decode: (value) => value,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  httpOnly: true,
  maxAge: 10 * 60,
});

export const codeVerifierCookie = createCookie("codeVerifier", {
  encode: (value) => value,
  decode: (value) => value,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  httpOnly: true,
  maxAge: 10 * 60,
});
