import { AppLoadContext } from "@remix-run/cloudflare";
import { Google, generateCodeVerifier, generateState } from "arctic";
import { jwtDecode } from "jwt-decode";
import invariant from "tiny-invariant";
import { z } from "zod";
import { codeVerifierCookie, stateCookie } from "./cookies.server";
import { env } from "./env.server";

const googleJwtSchema = z.object({
  iss: z.string(),
  sub: z.string(),
  azp: z.string(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number(),
});

interface GoogleOptions {
  context: AppLoadContext;
  callbackPath: string;
}

const googleAuth = ({ context, callbackPath }: GoogleOptions) => {
  const { APP_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env(context);
  return new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${APP_URL}${callbackPath}`);
};

interface GenerateGoogleUrlOptions {
  context: AppLoadContext;
  callbackPath: string;
  scopes?: string[];
}

export async function generateGoogleUrl(args: GenerateGoogleUrlOptions) {
  const { context, callbackPath, scopes } = args;

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const google = googleAuth({ context, callbackPath });
  const url = await google.createAuthorizationURL(state, codeVerifier, { scopes });

  const createdStateCookie = await stateCookie.serialize(state);
  const createdCodeVerifierCookie = await codeVerifierCookie.serialize(codeVerifier);

  return { url, createdStateCookie, createdCodeVerifierCookie };
}

interface ValidateGoogleAuthCodeOptions {
  context: AppLoadContext;
  code: string;
  storedCodeVerifier: string;
  callbackPath: string;
}

export async function validateGoogleAuthCode(args: ValidateGoogleAuthCodeOptions) {
  const { context, code, storedCodeVerifier, callbackPath } = args;
  const google = googleAuth({ context, callbackPath });
  return await google.validateAuthorizationCode(code, storedCodeVerifier);
}

interface RefreshAccessTokenOptions {
  context: AppLoadContext;
  refreshToken: string;
}

export async function refreshAccessToken({ context, refreshToken }: RefreshAccessTokenOptions) {
  const google = googleAuth({ context, callbackPath: "" });
  return await google.refreshAccessToken(refreshToken);
}

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

  const tokens = await validateGoogleAuthCode({
    context,
    code,
    storedCodeVerifier,
    callbackPath,
  });

  const jwt = googleJwtSchema.parse(jwtDecode(tokens.idToken));

  return {
    ...tokens,
    idToken: jwt,
  };
}
