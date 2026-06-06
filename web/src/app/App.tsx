import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { PwaStatus } from "../shared/components/PwaStatus";

export function App() {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const showMobileNav = location.pathname !== "/login";
  const mobileShellClassName = showMobileNav
    ? `app-mobile-shell${location.pathname === "/" ? " app-mobile-shell-tasks" : ""}`
    : undefined;
  const isMoreActive = ["/settings/profile", "/trash", "/settings/tags"].includes(location.pathname);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname, location.search]);

  return (
    <>
      <div className={mobileShellClassName}>
        <Outlet />
      </div>
      {showMobileNav ? (
        <>
          <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
            <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/" end>
              <span className="tf-icon tf-icon-check" />
              Tasks
            </NavLink>
            <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/settings/folders">
              <span className="tf-icon tf-icon-folder" />
              Folders
            </NavLink>
            <NavLink className="mobile-bottom-nav-item mobile-bottom-nav-item-create" to="/?new=1" aria-label="Create task">
              <span className="mobile-bottom-nav-create-icon">+</span>
            </NavLink>
            <NavLink className={({ isActive }) => `mobile-bottom-nav-item${isActive ? " active" : ""}`} to="/settings/assignees">
              <span className="tf-icon tf-icon-team" />
              Team
            </NavLink>
            <button
              className={`mobile-bottom-nav-item mobile-bottom-nav-more${isMoreActive || isMoreOpen ? " active" : ""}`}
              type="button"
              aria-expanded={isMoreOpen}
              aria-controls="mobile-more-menu"
              onClick={() => setIsMoreOpen((current) => !current)}
            >
              <span className="tf-icon tf-icon-more" />
              More..
            </button>
          </nav>
          <div className={isMoreOpen ? "mobile-more-menu open" : "mobile-more-menu"} id="mobile-more-menu">
            <NavLink className={({ isActive }) => `mobile-more-menu-item${isActive ? " active" : ""}`} to="/settings/profile">
              <span className="tf-icon tf-icon-profile" />
              Profile
            </NavLink>
            <NavLink className={({ isActive }) => `mobile-more-menu-item${isActive ? " active" : ""}`} to="/trash">
              <span className="tf-icon tf-icon-report" />
              Trash
            </NavLink>
            <NavLink className={({ isActive }) => `mobile-more-menu-item${isActive ? " active" : ""}`} to="/settings/tags">
              <span className="tf-icon tf-icon-settings" />
              Tags
            </NavLink>
          </div>
        </>
      ) : null}
      <PwaStatus />
    </>
  );
}
