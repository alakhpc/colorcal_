import { Google, generateCodeVerifier, generateState } from "arctic";
import { parseJWT } from "oslo/jwt";
import { z } from "zod";

interface GoogleArgs {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface RefreshTokenArgs extends Omit<GoogleArgs, "redirectUri"> {
  refreshToken: string;
}

export async function refreshAccessToken(args: RefreshTokenArgs) {
  const redirectUri = "https://google.com";
  const { clientId, clientSecret, refreshToken } = args;
  const google = new Google(clientId, clientSecret, redirectUri);
  return await google.refreshAccessToken(refreshToken);
}

interface GenerateGoogleUrlArgs extends GoogleArgs {
  scopes?: string[];
}

export async function generateGoogleUrl(args: GenerateGoogleUrlArgs) {
  const { clientId, clientSecret, redirectUri, scopes } = args;

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const google = new Google(clientId, clientSecret, redirectUri);
  const url = await google.createAuthorizationURL(state, codeVerifier, { scopes });

  return { url, state, codeVerifier };
}

interface ValidateGoogleAuthCodeOptions extends GoogleArgs {
  code: string;
  storedCodeVerifier: string;
  redirectUri: string;
}

const googleJwtSchema = z.object({
  iss: z.string(),
  sub: z.string(),
  azp: z.string(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export async function validateGoogleAuthCode(args: ValidateGoogleAuthCodeOptions) {
  const { clientId, clientSecret, redirectUri, code, storedCodeVerifier } = args;
  const google = new Google(clientId, clientSecret, redirectUri);
  const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);

  const _jwt = parseJWT(tokens.idToken)?.payload;
  const jwt = googleJwtSchema.parse(_jwt);

  return {
    ...tokens,
    idToken: jwt,
  };
}
