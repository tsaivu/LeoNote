import { Link } from "react-router-dom";

type MobileAppHeaderProps = {
  userName: string;
  onLogout: () => void;
};

export function MobileAppHeader({ userName, onLogout }: MobileAppHeaderProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="taskflow-mobile-header-main">
      <div className="taskflow-mobile-brand">
        <Link className="taskflow-mobile-avatar" to="/settings/profile" aria-label="Open profile">
          {initial}
        </Link>
        <div className="taskflow-mobile-userblock">
          <Link className="taskflow-mobile-profile-link" to="/settings/profile">
            {userName}
          </Link>
          <button className="taskflow-mobile-logout" type="button" onClick={onLogout} aria-label="Logout">
            <span className="taskflow-mobile-logout-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
