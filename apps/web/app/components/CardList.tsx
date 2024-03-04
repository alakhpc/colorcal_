import { Link, NavLink, NavLinkProps } from "@remix-run/react";
import { LucideIcon } from "lucide-react";
import { ComponentProps, PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

interface CardListProps {
  className?: string;
}

function CardList(props: PropsWithChildren<CardListProps>) {
  const { className, children } = props;

  return (
    <div
      className={cn(
        "flex overflow-y-auto flex-col border gap-4 p-4 rounded-lg w-72 h-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavLinkRenderProps = Extract<NavLinkProps["className"], (v: any) => any>;

interface CardListItemProps {
  title: string;
  description?: string;
  icon: LucideIcon;

  linkTo: ComponentProps<typeof Link>["to"];
  linkClassName?: NavLinkRenderProps;
}

function CardListItem(props: CardListItemProps) {
  const { title, description, icon: Icon, linkTo, linkClassName } = props;

  const baseClasses = "border items-center flex gap-6 p-4 rounded-lg";

  return (
    <NavLink to={linkTo} className={(v) => cn(baseClasses, linkClassName?.(v))}>
      <Icon size={24} className="shrink-0" />
      <div className="flex flex-col overflow-hidden gap-2">
        <div className="font-cal">{title}</div>
        {description && (
          <div className="truncate whitespace-nowrap text-sm text-gray-500">{description}</div>
        )}
      </div>
    </NavLink>
  );
}

CardList.Item = CardListItem;
export default CardList;
