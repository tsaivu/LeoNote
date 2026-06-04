import { ReactNode } from "react";

type MobilePageBarProps = {
  action: ReactNode;
  subtitle: string;
  title: string;
};

export function MobilePageBar({ action, subtitle, title }: MobilePageBarProps) {
  return (
    <section className="taskflow-mobile-toolbar taskflow-mobile-pagebar">
      <div className="taskflow-mobile-pagebar-copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      {action}
    </section>
  );
}
