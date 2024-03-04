import { generateGoogleUrl } from "@colorcal/auth/google";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { Form, Outlet, useLoaderData } from "@remix-run/react";
import { Plus } from "lucide-react";
import CardList from "~/components/CardList";
import { codeVerifierCookie, stateCookie } from "~/lib/cookies.server";
import { getDb } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";
import { createAbsoluteUrl } from "~/lib/url.server";
import { GCAL_CONNECT_CALLBACK_PATH } from "../api.callbacks.gcal-connect/route";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccounts = await db.query.gcalAccountsTable.findMany({
    columns: { sub: true },
    where: (gcalAccountsTable, { eq }) => eq(gcalAccountsTable.userId, userId),
  });

  const accounts = gcalAccounts.map(({ sub }) => ({ sub }));

  return { accounts };
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  await requireUserId({ request, context });

  const redirectUri = createAbsoluteUrl({ request, path: GCAL_CONNECT_CALLBACK_PATH });
  const { url, ...cookies } = await generateGoogleUrl({
    clientId: context.cloudflare.env.GOOGLE_CLIENT_ID,
    clientSecret: context.cloudflare.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
    scopes: [CALENDAR_SCOPE],
  });

  url.searchParams.set("prompt", "consent");
  url.searchParams.set("access_type", "offline");

  throw redirect(url.toString(), {
    headers: [
      ["Set-Cookie", await stateCookie.serialize(cookies.state)],
      ["Set-Cookie", await codeVerifierCookie.serialize(cookies.codeVerifier)],
    ],
  });
}

export default function Dashboard() {
  const { accounts } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full p-4 gap-4">
      <CardList>
        {accounts.map(({ sub }) => (
          <CardList.Item
            key={sub}
            icon={SiGoogle}
            title="Google calendar"
            description={sub}
            linkTo={`./gcals/${sub}`}
            linkClassName={({ isActive }) => (isActive ? "bg-accent" : undefined)}
          />
        ))}
        <Form method="POST">
          <button className="border w-full rounded-lg p-4 justify-center hover:bg-accent flex gap-4 items-center">
            <Plus size={32} />
          </button>
        </Form>
      </CardList>
      <Outlet />
    </div>
  );
}
