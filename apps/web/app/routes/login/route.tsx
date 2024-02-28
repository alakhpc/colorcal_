import { ActionFunction, LoaderFunction, redirect } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { generateCodeVerifier, generateState } from "arctic";
import { GOOGLE_SCOPES, google } from "~/lib/auth.server";
import { codeVerifierCookie, stateCookie } from "~/lib/cookies.server";
import { getUserId } from "~/lib/sessions.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect("/app");
  }

  return null;
};

export const action: ActionFunction = async () => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, { scopes: GOOGLE_SCOPES });
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("access_type", "offline");

  return redirect(url.toString(), {
    headers: [
      ["Set-Cookie", await stateCookie.serialize(state)],
      ["Set-Cookie", await codeVerifierCookie.serialize(codeVerifier)],
    ],
  });
};

export default function Login() {
  return (
    <main className="flex h-full items-center justify-center">
      <Form method="POST">
        <button className="px-4 py-2 bg-black text-white rounded-md">Login</button>
      </Form>
    </main>
  );
}
