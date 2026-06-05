import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { DesktopSidebar } from "../../../shared/components/DesktopSidebar";
import { MobileManagementHeader } from "../../../shared/components/MobileManagementHeader";
import { MobilePageBarAction } from "../../../shared/components/MobilePageBarAction";
import { MobilePanelHeader } from "../../../shared/components/MobilePanelHeader";
import { useAuth } from "../../auth/hooks/useAuth";
import { useUpdateUserPassword, useUpdateUserProfile, useUserProfile } from "../hooks/useUserProfile";

type ProfileForm = {
  display_name: string;
  email: string;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const emptyProfileForm: ProfileForm = {
  display_name: "",
  email: "",
};

const emptyPasswordForm: PasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

export function ProfilePage() {
  const { isAuthenticated, logout, setAuthUser, user } = useAuth();
  const profileQuery = useUserProfile(isAuthenticated);
  const updateProfile = useUpdateUserProfile();
  const updatePassword = useUpdateUserPassword();
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const profile = profileQuery.data ?? user;
    if (!profile) {
      return;
    }
    setProfileForm({
      display_name: profile.display_name ?? "",
      email: profile.email ?? "",
    });
  }, [profileQuery.data, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const displayName = profileQuery.data?.display_name || user?.display_name || user?.username || "User";
  const username = profileQuery.data?.username || user?.username || "";

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    try {
      const saved = await updateProfile.mutateAsync({
        display_name: profileForm.display_name.trim() || null,
        email: profileForm.email.trim() || null,
      });
      setAuthUser(saved);
      setProfileMessage("Profile saved");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Password confirmation does not match");
      return;
    }
    try {
      await updatePassword.mutateAsync({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordMessage("Password updated");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Password update failed");
    }
  }

  return (
    <main className="taskflow-shell management-shell">
      <DesktopSidebar active="profile" userName={username} onLogout={logout} />
      <div className="taskflow-main management-main">
        <MobileManagementHeader
          userName={displayName}
          onLogout={logout}
          title="Profile"
          subtitle="Manage your account."
          action={
            <MobilePageBarAction icon="back" kind="secondary" to="/">
              Back
            </MobilePageBarAction>
          }
        />
        <header className="topbar">
          <div>
            <h1>Profile</h1>
            <p>Update your name, email and password.</p>
          </div>
        </header>
        <div className="management-grid profile-grid">
          <section className="panel">
            <MobilePanelHeader
              title="Account Details"
              meta={<span className="chip panel-meta-chip">{username || "Account"}</span>}
            />
            <div className="panel-body">
              {profileQuery.isLoading ? <p className="empty-state">Loading profile...</p> : null}
              {profileMessage ? <p className="status-text success">{profileMessage}</p> : null}
              <form className="form-grid" onSubmit={submitProfile}>
                <div className="field full">
                  <label htmlFor="profile-username">Username</label>
                  <input id="profile-username" value={username} disabled />
                </div>
                <div className="field full">
                  <label htmlFor="profile-display-name">Name</label>
                  <input
                    id="profile-display-name"
                    value={profileForm.display_name}
                    onChange={(event) => setProfileForm((current) => ({ ...current, display_name: event.target.value }))}
                    placeholder="Your display name"
                  />
                </div>
                <div className="field full">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="field full button-row">
                  <button className="btn btn-primary" type="submit" disabled={updateProfile.isPending}>
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          </section>
          <section className="panel">
            <MobilePanelHeader title="Password" meta={<span className="chip panel-meta-chip">Secure</span>} />
            <div className="panel-body">
              {passwordMessage ? <p className="status-text success">{passwordMessage}</p> : null}
              {passwordError ? <p className="status-text danger">{passwordError}</p> : null}
              <form className="form-grid" onSubmit={submitPassword}>
                <div className="field full">
                  <label htmlFor="profile-current-password">Current password</label>
                  <input
                    id="profile-current-password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
                    required
                  />
                </div>
                <div className="field full">
                  <label htmlFor="profile-new-password">New password</label>
                  <input
                    id="profile-new-password"
                    type="password"
                    minLength={6}
                    value={passwordForm.new_password}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
                    required
                  />
                </div>
                <div className="field full">
                  <label htmlFor="profile-confirm-password">Confirm password</label>
                  <input
                    id="profile-confirm-password"
                    type="password"
                    minLength={6}
                    value={passwordForm.confirm_password}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
                    required
                  />
                </div>
                <div className="field full button-row">
                  <button className="btn btn-primary" type="submit" disabled={updatePassword.isPending}>
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
