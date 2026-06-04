import { ReactNode } from "react";
import { Link } from "react-router-dom";

type MobilePageBarActionProps = {
  children: ReactNode;
  icon: "plus" | "back";
  kind?: "primary" | "secondary";
  onClick?: () => void;
  to?: string;
  type?: "button" | "submit";
};

export function MobilePageBarAction({
  children,
  icon,
  kind = "primary",
  onClick,
  to,
  type = "button",
}: MobilePageBarActionProps) {
  const className = kind === "secondary" ? "taskflow-mobile-pagebar-action secondary" : "taskflow-mobile-pagebar-action";

  if (to) {
    return (
      <Link className={className} to={to}>
        <span className={`taskflow-mobile-pagebar-action-icon ${icon}`} aria-hidden="true" />
        {children}
      </Link>
    );
  }

  return (
    <button className={className} type={type} onClick={onClick}>
      <span className={`taskflow-mobile-pagebar-action-icon ${icon}`} aria-hidden="true" />
      {children}
    </button>
  );
}
