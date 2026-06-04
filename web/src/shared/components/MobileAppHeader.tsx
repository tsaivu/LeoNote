type MobileAppHeaderProps = {
  userName: string;
  onLogout: () => void;
};

export function MobileAppHeader({ userName, onLogout }: MobileAppHeaderProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="taskflow-mobile-header-main">
      <div className="taskflow-mobile-brand">
        <span className="taskflow-mobile-avatar">{initial}</span>
        <div className="taskflow-mobile-userblock">
          <strong>{userName}</strong>
          <button className="taskflow-mobile-logout" type="button" onClick={onLogout} aria-label="Logout">
            <span className="taskflow-mobile-logout-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
