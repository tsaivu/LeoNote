import { ReactNode } from "react";

import { MobileAppHeader } from "./MobileAppHeader";
import { MobilePageBar } from "./MobilePageBar";

type MobileManagementHeaderProps = {
  action: ReactNode;
  onLogout: () => void;
  subtitle: string;
  title: string;
  userName: string;
};

export function MobileManagementHeader({ action, onLogout, subtitle, title, userName }: MobileManagementHeaderProps) {
  return (
    <header className="taskflow-mobile-header taskflow-mobile-header-dashboard">
      <MobileAppHeader userName={userName} onLogout={onLogout} />
      <MobilePageBar action={action} subtitle={subtitle} title={title} />
    </header>
  );
}
