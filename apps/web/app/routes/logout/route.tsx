import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { destroySession, getSessionStorage } from "~/lib/sessions.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const session = await destroySession({ request, context });

  throw redirect("/", {
    headers: {
      "Set-Cookie": await getSessionStorage(context).destroySession(session),
    },
  });
}
