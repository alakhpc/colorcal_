import { generateGoogleUrl } from "@colorcal/auth/google";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { stateCookie } from "~/lib/cookies.server";
import { env } from "~/lib/env.server";
import { getUserId } from "~/lib/sessions.server";
import { createAbsoluteUrl } from "~/lib/url.sever";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await getUserId({ request, context });
  if (userId) throw redirect("/dashboard");
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const redirectUri = createAbsoluteUrl({ request, path: "/callbacks/google-login" });
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = env(context);
  const { url, ...cookies } = await generateGoogleUrl({ clientId, clientSecret, redirectUri });

  throw redirect(url.toString(), {
    headers: [
      ["Set-Cookie", await stateCookie.serialize(cookies.state)],
      ["Set-Cookie", await stateCookie.serialize(cookies.codeVerifier)],
    ],
  });
}

export default function Login() {
  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      <div className="text-xl text-blue-500">Login page</div>
      <Form method="POST">
        <button type="submit" className="px-4 py-2 bg-black text-white rounded-md">
          Login
        </button>
      </Form>
    </div>
  );
}
