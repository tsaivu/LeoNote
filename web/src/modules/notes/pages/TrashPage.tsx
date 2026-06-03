import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import { formatVietnamDateTime } from "../../../shared/lib/datetime";
import { useRestoreNote, useTrashNotes } from "../hooks/useNotes";

export function TrashPage() {
  const { isAuthenticated } = useAuth();
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
        <header className="topbar">
          <div>
            <h1>Trash</h1>
            <p>Soft-deleted notes can be restored from here.</p>
          </div>
          <Link className="btn btn-secondary" to="/">Back to Dashboard</Link>
        </header>
        <section className="panel stack-top">
          <div className="panel-header">
            <h2>Deleted Tasks</h2>
            {message ? <span className="status-text success">{message}</span> : null}
          </div>
          {trashQuery.isLoading ? <p className="empty-state">Loading...</p> : null}
          {trashQuery.isError ? <p className="empty-state">Failed to load trash.</p> : null}
          <div className="note-list">
            {(trashQuery.data ?? []).map((note) => (
              <article className="note-card" key={note.id}>
                <span className="note-card-title">{note.title}</span>
                <span className="note-card-meta">
                  <span>Deadline: {formatVietnamDateTime(note.deadline_at)}</span>
                  <span>Deleted: {note.deleted_at ? formatVietnamDateTime(note.deleted_at) : ""}</span>
                </span>
                <div>
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
