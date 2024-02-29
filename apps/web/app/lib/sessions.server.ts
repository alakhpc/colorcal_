import { AppLoadContext, createCookieSessionStorage, redirect } from "@remix-run/cloudflare";
import { env } from "./env.server";

export function getSessionStorage(context: AppLoadContext) {
  const { SESSION_SECRET } = env(context);

  return createCookieSessionStorage({
    cookie: {
      name: "__session",
      path: "/",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      secrets: [SESSION_SECRET],
      secure: process.env.NODE_ENV === "production",
    },
  });
}

const USER_SESSION_KEY = "userId";

interface ReqAndContext {
  request: Request;
  context: AppLoadContext;
}

export async function getSession({ request, context }: ReqAndContext) {
  const cookie = request.headers.get("Cookie");
  return await getSessionStorage(context).getSession(cookie);
}

export async function getUserId({ request, context }: ReqAndContext) {
  const session = await getSession({ request, context });
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function requireUserId({ request, context }: ReqAndContext) {
  const userId = await getUserId({ request, context });
  if (!userId) throw redirect("/login");
  return userId;
}

interface CreateSessionArgs extends ReqAndContext {
  userId: string;
}

export async function createSession({ request, context, userId }: CreateSessionArgs) {
  const session = await getSession({ request, context });
  session.set(USER_SESSION_KEY, userId);
  return session;
}

export async function destroySession({ request, context }: ReqAndContext) {
  const session = await getSession({ request, context });
  session.unset(USER_SESSION_KEY);
  return session;
}
