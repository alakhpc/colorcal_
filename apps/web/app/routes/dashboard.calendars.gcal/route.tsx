import { eq } from "@colorcal/db";
import { watchedGcals } from "@colorcal/db/schema";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Gcal } from "~/gcal";
import { getDb, getGcalAccount } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await getGcalAccount(userId, db);
  if (!gcalAccount) throw redirect("/dashboard");

  const gcal = new Gcal({ request, context, db, ...gcalAccount });

  const calendars = await gcal.calendarList();

  const watchedCalendars = await db.query.watchedGcals.findMany({
    columns: { id: true },
    where: eq(watchedGcals.googleCalendarAccountSub, gcalAccount.sub),
  });

  const watchedCalendarIds = watchedCalendars.map((cal) => cal.id);

  const slimCalendars = calendars.items.map((cal) => ({
    id: cal.id,
    summary: cal.summary,
    watched: watchedCalendarIds.includes(cal.id),
  }));

  return json({ calendars: slimCalendars });
}

export default function GoogleCalendars() {
  const fetcher = useFetcher();
  const { calendars } = useLoaderData<typeof loader>();

  return (
    <div>
      {calendars.map((cal) => {
        return (
          <div className="flex gap-4" key={cal.id}>
            <span>{cal.summary}</span>
            {cal.watched ? (
              <fetcher.Form method="POST" action="/api/gcal/unwatch">
                <input type="hidden" name="id" value={cal.id} />
                <button className="bg-black text-white rounded-md px-4 py-2">
                  Unwatch calendar
                </button>
              </fetcher.Form>
            ) : (
              <fetcher.Form method="POST" action="/api/gcal/watch">
                <input type="hidden" name="id" value={cal.id} />
                <button className="bg-black text-white rounded-md px-4 py-2">Watch calendar</button>
              </fetcher.Form>
            )}
          </div>
        );
      })}
    </div>
  );
}
