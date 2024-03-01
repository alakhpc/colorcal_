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
  request: Request;
  context: AppLoadContext;
  callbackPath: string;
}

const googleAuth = ({ request, context, callbackPath }: GoogleOptions) => {
  const base = new URL(request.url).origin;
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env(context);
  return new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${base}${callbackPath}`);
};

interface GenerateGoogleUrlOptions {
  request: Request;
  context: AppLoadContext;

  callbackPath: string;
  scopes?: string[];
}

export async function generateGoogleUrl(args: GenerateGoogleUrlOptions) {
  const { request, context, callbackPath, scopes } = args;

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const google = googleAuth({ request, context, callbackPath });
  const url = await google.createAuthorizationURL(state, codeVerifier, { scopes });

  const createdStateCookie = await stateCookie.serialize(state);
  const createdCodeVerifierCookie = await codeVerifierCookie.serialize(codeVerifier);

  return { url, createdStateCookie, createdCodeVerifierCookie };
}

interface ValidateGoogleAuthCodeOptions {
  request: Request;
  context: AppLoadContext;

  code: string;
  storedCodeVerifier: string;
  callbackPath: string;
}

export async function validateGoogleAuthCode(args: ValidateGoogleAuthCodeOptions) {
  const { request, context, code, storedCodeVerifier, callbackPath } = args;
  const google = googleAuth({ request, context, callbackPath });
  return await google.validateAuthorizationCode(code, storedCodeVerifier);
}

interface RefreshAccessTokenOptions {
  request: Request;
  context: AppLoadContext;

  refreshToken: string;
}

export async function refreshAccessToken(args: RefreshAccessTokenOptions) {
  const { request, context, refreshToken } = args;
  const google = googleAuth({ request, context, callbackPath: "" });
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
    request,
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
