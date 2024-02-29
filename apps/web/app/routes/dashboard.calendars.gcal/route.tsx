import { LoaderFunctionArgs, json, redirect } from "@remix-run/cloudflare";
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

  return json({ calendars });
}

export default function DashboardConnected() {
  return <div>hi</div>;
}
