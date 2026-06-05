import { Link } from "react-router-dom";

export type DesktopSidebarSection = "tasks" | "folders" | "tags" | "assignees" | "trash";

type DesktopSidebarProps = {
  active: DesktopSidebarSection;
  userName?: string | null;
  onLogout: () => void;
};

const navItems: Array<{
  key: DesktopSidebarSection;
  label: string;
  to: string;
  icon: string;
}> = [
  { key: "tasks", label: "My Tasks", to: "/", icon: "tf-icon-check" },
  { key: "folders", label: "Projects", to: "/settings/folders", icon: "tf-icon-folder" },
  { key: "tags", label: "Tags", to: "/settings/tags", icon: "tf-icon-settings" },
  { key: "assignees", label: "Team", to: "/settings/assignees", icon: "tf-icon-team" },
  { key: "trash", label: "Reports", to: "/trash", icon: "tf-icon-report" },
];

export function DesktopSidebar({ active, userName, onLogout }: DesktopSidebarProps) {
  const initial = userName?.trim().slice(0, 1).toUpperCase() || "U";

  return (
    <aside className="taskflow-sidebar">
      <div className="taskflow-brand">
        <span className="taskflow-logo" />
        <span>TaskFlow</span>
      </div>
      <nav className="taskflow-nav" aria-label="TaskFlow navigation">
        {navItems.map((item) => (
          <Link className={active === item.key ? "taskflow-nav-item active" : "taskflow-nav-item"} key={item.key} to={item.to}>
            <span className={`tf-icon ${item.icon}`} />
            {item.label}
          </Link>
        ))}
      </nav>
      <button className="taskflow-user" type="button" onClick={onLogout} title={`Logout ${userName ?? ""}`}>
        <span className="taskflow-user-avatar">{initial}</span>
        <span className="taskflow-user-caret">v</span>
      </button>
    </aside>
  );
}
