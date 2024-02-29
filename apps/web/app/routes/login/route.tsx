import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { generateGoogleUrl } from "~/lib/auth.server";
import { getUserId } from "~/lib/sessions.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await getUserId({ request, context });
  if (userId) throw redirect("/dashboard");
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const googleGen = await generateGoogleUrl({ context, callbackPath: "/callbacks/google-login" });

  throw redirect(googleGen.url.toString(), {
    headers: [
      ["Set-Cookie", googleGen.createdStateCookie],
      ["Set-Cookie", googleGen.createdCodeVerifierCookie],
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
