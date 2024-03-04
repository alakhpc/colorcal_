import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Outlet, useLoaderData } from "@remix-run/react";
import { Plus } from "lucide-react";
import invariant from "tiny-invariant";
import CardList from "~/components/CardList";
import { getDb } from "~/lib/db.server";
import { requireUserId } from "~/lib/sessions.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const sub = params.sub;
  invariant(sub, "No sub param");

  const userId = await requireUserId({ request, context });

  const db = await getDb(context);
  const gcalAccount = await db.query.gcalAccountsTable.findFirst({
    columns: { calendarList: true },
    where: (gcalAccountsTable, { and, eq }) =>
      and(eq(gcalAccountsTable.userId, userId), eq(gcalAccountsTable.sub, sub)),
  });

  if (!gcalAccount) {
    throw new Response("No valid account", { status: 404 });
  }

  return { calendars: gcalAccount.calendarList };
}

export default function GcalAccount() {
  const { calendars } = useLoaderData<typeof loader>();

  return (
    <>
      <CardList>
        {calendars.map(({ id, summary }) => (
          <CardList.Item
            key={id}
            icon={Plus}
            title={summary}
            description={id}
            linkTo={`./${id}`}
            linkClassName={({ isActive }) => (isActive ? "bg-accent" : undefined)}
          />
        ))}
      </CardList>
      <Outlet />
    </>
  );
}
