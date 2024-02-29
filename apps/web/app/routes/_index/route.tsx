import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix! Using Vite and Cloudflare!" },
  ];
};

export default function Index() {
  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      <div className="text-xl text-blue-500">Landing page</div>
      <Link to="/dashboard" className="bg-black text-white rounded-md px-4 py-2">
        Dashboard
      </Link>
    </div>
  );
}
