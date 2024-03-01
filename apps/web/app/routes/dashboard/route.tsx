import { LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { Link, Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);

  return json({ gcalConnected: !!gcalAccount });
}

export default function Dashboard() {
  const fetcher = useFetcher();
  const { gcalConnected } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="h-16 flex justify-between items-center">
        <div className="text-xl text-blue-500">Dashboard page</div>
        <Link to="/logout" className="bg-black text-white rounded-md px-4 py-2">
          Logout
        </Link>
      </div>
      <div>
        <div>Gcal connected: {String(gcalConnected)}</div>
        {gcalConnected ? (
          <fetcher.Form method="POST" action="/api/gcal/disconnect">
            <button className="bg-black text-white rounded-md px-4 py-2">Disconnect gcal</button>
          </fetcher.Form>
        ) : (
          <fetcher.Form method="POST" action="/api/gcal/connect">
            <button className="bg-black text-white rounded-md px-4 py-2">Connect gcal</button>
          </fetcher.Form>
        )}
      </div>
      {gcalConnected && (
        <div>
          <Link to="./calendars/gcal" className="bg-black text-white rounded-md px-4 py-2">
            View gcal calendars
          </Link>
        </div>
      )}
      <Outlet />
    </div>
  );
}
