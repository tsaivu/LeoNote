import { NavLink, Outlet, useLocation } from "react-router-dom";

import { PwaStatus } from "../shared/components/PwaStatus";

export function App() {
  const location = useLocation();
  const showMobileNav = location.pathname !== "/login";

  return (
    <>
      <div className={showMobileNav ? "app-mobile-shell" : undefined}>
        <Outlet />
      </div>
      {showMobileNav ? (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/" end>
            <span className="tf-icon tf-icon-check" />
            Tasks
          </NavLink>
          <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/settings/folders">
            <span className="tf-icon tf-icon-folder" />
            Folders
          </NavLink>
          <NavLink className="mobile-bottom-nav-item mobile-bottom-nav-item-create" to="/?new=1">
            <span className="mobile-bottom-nav-create-icon">+</span>
            Create
          </NavLink>
          <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/settings/assignees">
            <span className="tf-icon tf-icon-team" />
            Team
          </NavLink>
          <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/trash">
            <span className="tf-icon tf-icon-report" />
            Trash
          </NavLink>
          <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/settings/profile">
            <span className="tf-icon tf-icon-profile" />
            Profile
          </NavLink>
        </nav>
      ) : null}
      <PwaStatus />
    </>
  );
}
