import { validateGoogleAuthCode } from "@colorcal/auth/google";
import { AppLoadContext } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { codeVerifierCookie, stateCookie } from "./cookies.server";
import { createAbsoluteUrl } from "./url.server";

interface HandleGoogleCallbackOptions {
  request: Request;
  context: AppLoadContext;
  callbackPath: string;
}

export async function handleGoogleCallback(args: HandleGoogleCallbackOptions) {
  const { request, context, callbackPath } = args;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get(stateCookie.name);

  const cookieHeader = request.headers.get("Cookie");
  const storedState = await stateCookie.parse(cookieHeader);
  const storedCodeVerifier = await codeVerifierCookie.parse(cookieHeader);

  invariant(code, "No code");
  invariant(storedState, "No state");
  invariant(storedCodeVerifier, "No code verifier");
  invariant(state === storedState, "Invalid state");

  const redirectUri = createAbsoluteUrl({ request, path: callbackPath });
  return await validateGoogleAuthCode({
    clientId: context.cloudflare.env.GOOGLE_CLIENT_ID,
    clientSecret: context.cloudflare.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
    code,
    storedCodeVerifier,
  });
}
