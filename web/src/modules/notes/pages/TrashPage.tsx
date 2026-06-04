import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import { MobileManagementHeader } from "../../../shared/components/MobileManagementHeader";
import { MobilePageBarAction } from "../../../shared/components/MobilePageBarAction";
import { MobilePanelHeader } from "../../../shared/components/MobilePanelHeader";
import { formatVietnamDate } from "../../../shared/lib/datetime";
import { formatVietnamDateTime } from "../../../shared/lib/datetime";
import { useRestoreNote, useTrashNotes } from "../hooks/useNotes";

export function TrashPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const trashQuery = useTrashNotes(isAuthenticated);
  const restoreNote = useRestoreNote();
  const [message, setMessage] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  async function handleRestore(noteId: string) {
    setMessage(null);
    try {
      await restoreNote.mutateAsync(noteId);
      setMessage("Restored");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restore failed");
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">L</span>
          <span>LeoNote</span>
        </div>
        <nav className="nav-stack" aria-label="Main navigation">
          <Link className="nav-item" to="/">Dashboard</Link>
          <Link className="nav-item" to="/settings/folders">Folders</Link>
          <Link className="nav-item" to="/settings/tags">Tags</Link>
          <Link className="nav-item" to="/settings/assignees">Team Members</Link>
          <Link className="nav-item active" to="/trash">Trash</Link>
        </nav>
      </aside>
      <div className="content">
        <MobileManagementHeader
          userName={user?.display_name || user?.username || "User"}
          onLogout={logout}
          title="Trash"
          subtitle="Restore deleted tasks."
          action={
            <MobilePageBarAction icon="back" kind="secondary" to="/">
              Back
            </MobilePageBarAction>
          }
        />
        <header className="topbar">
          <div>
            <h1>Trash</h1>
            <p>Soft-deleted notes can be restored from here.</p>
          </div>
          <Link className="btn btn-secondary" to="/">Back to Dashboard</Link>
        </header>
        <section className="panel stack-top">
          <MobilePanelHeader
            title="Recently Deleted"
            meta={
              <>
                <span className="chip panel-meta-chip warning">{trashQuery.data?.length ?? 0}</span>
                {message ? <span className="status-text success">{message}</span> : null}
              </>
            }
          />
          {trashQuery.isLoading ? <p className="empty-state">Loading...</p> : null}
          {trashQuery.isError ? <p className="empty-state">Failed to load trash.</p> : null}
          <div className="note-list">
            {(trashQuery.data ?? []).map((note) => (
              <article className="note-card trash-note-card" key={note.id}>
                <div className="trash-note-card-head">
                  <span className="note-card-title">{note.title}</span>
                  <span className="chip warning">Deleted</span>
                </div>
                <div className="note-card-meta trash-note-card-meta">
                  <span>{note.deadline_at ? `Deadline ${formatVietnamDate(note.deadline_at)}` : "No deadline"}</span>
                  <span>{note.deleted_at ? `Deleted ${formatVietnamDateTime(note.deleted_at)}` : ""}</span>
                </div>
                <div className="trash-note-card-actions">
                  <button className="btn btn-primary" type="button" onClick={() => handleRestore(note.id)} disabled={restoreNote.isPending}>
                    Restore
                  </button>
                </div>
              </article>
            ))}
          </div>
          {trashQuery.data?.length === 0 ? <p className="empty-state">Trash is empty.</p> : null}
        </section>
      </div>
    </main>
  );
}
