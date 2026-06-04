import { ReactNode } from "react";

type MobilePanelHeaderProps = {
  meta?: ReactNode;
  title: string;
};

export function MobilePanelHeader({ meta, title }: MobilePanelHeaderProps) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      {meta ? <div className="panel-header-meta">{meta}</div> : null}
    </div>
  );
}
