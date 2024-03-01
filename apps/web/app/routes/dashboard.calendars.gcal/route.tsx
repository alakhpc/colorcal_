import { LoaderFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { Gcal } from "~/gcal";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);
  if (!gcalAccount) throw redirect("/dashboard");

  const gcal = new Gcal({ context, db, ...gcalAccount });
  const calendars = await gcal.calendarList();

  const slimCalendars = calendars.items.map((calendar) => ({
    id: calendar.id,
    summary: calendar.summary,
  }));

  return json({ calendars: slimCalendars });
}

export default function DashboardConnected() {
  const { calendars } = useLoaderData<typeof loader>();

  return (
    <div>
      {calendars.map((calendar) => {
        return (
          <div key={calendar.id}>
            {calendar.summary} <input type="checkbox" />
          </div>
        );
      })}
    </div>
  );
}
