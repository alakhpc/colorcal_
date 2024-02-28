import { LoaderFunction, json } from "@remix-run/cloudflare";
import { google } from "~/lib/auth.server";
import { codeVerifierCookie, stateCookie } from "~/lib/cookies.server";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const state = url.searchParams.get(stateCookie.name);
  const code = url.searchParams.get("code");

  const cookieHeader = request.headers.get("Cookie");
  const storedState = await stateCookie.parse(cookieHeader);
  const storedCodeVerifier = await codeVerifierCookie.parse(cookieHeader);

  if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
    return json({ error: "Invalid state or code" }, { status: 400 });
  }

  const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);

  return json({ tokens });
};
