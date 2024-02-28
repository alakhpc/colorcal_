import { createCookieSessionStorage, redirect } from "@remix-run/cloudflare";
import { env } from "./env.server";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    path: "/",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
    secrets: [env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userId";

export async function getSession(req: Request) {
  const cookie = req.headers.get("Cookie");
  return await sessionStorage.getSession(cookie);
}

export async function getUserId(request: Request): Promise<string | undefined> {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function createSession({ request, userId }: { request: Request; userId: string }) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect("/app", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function destroySession(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
