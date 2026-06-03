import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import {
  useActivateAssignee,
  useAssignees,
  useCreateAssignee,
  useDeactivateAssignee,
  useDeleteAssignee,
  useUpdateAssignee,
} from "../hooks/useAssignees";
import type { Assignee } from "../types/assigneeTypes";

type AssigneeForm = {
  name: string;
  phone: string;
  email: string;
  note: string;
};

const emptyForm: AssigneeForm = {
  name: "",
  phone: "",
  email: "",
  note: "",
};

function toForm(assignee: Assignee): AssigneeForm {
  return {
    name: assignee.name,
    phone: assignee.phone ?? "",
    email: assignee.email ?? "",
    note: assignee.note ?? "",
  };
}

export function AssigneeManagementPage() {
  const { isAuthenticated } = useAuth();
  const assigneesQuery = useAssignees(isAuthenticated);
  const createAssignee = useCreateAssignee();
  const updateAssignee = useUpdateAssignee();
  const deleteAssignee = useDeleteAssignee();
  const activateAssignee = useActivateAssignee();
  const deactivateAssignee = useDeactivateAssignee();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<AssigneeForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const selectedAssignee = (assigneesQuery.data ?? []).find((item) => item.id === selectedId) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const payload = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      note: form.note || null,
    };

    try {
      const saved = selectedId
        ? await updateAssignee.mutateAsync({ assigneeId: selectedId, payload })
        : await createAssignee.mutateAsync(payload);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm("Delete or deactivate this assignee?")) {
      return;
    }
    try {
      const saved = await deleteAssignee.mutateAsync(selectedId);
      setForm(toForm(saved));
      setMessage(saved.deleted_at ? "Deleted" : "Deactivated because this assignee is in use");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  }

  async function toggleActive() {
    if (!selectedAssignee) {
      return;
    }
    try {
      const saved = selectedAssignee.is_active
        ? await deactivateAssignee.mutateAsync(selectedAssignee.id)
        : await activateAssignee.mutateAsync(selectedAssignee.id);
      setForm(toForm(saved));
      setMessage(saved.is_active ? "Activated" : "Deactivated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
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
          <Link className="nav-item active" to="/settings/assignees">Team Members</Link>
          <Link className="nav-item" to="/trash">Trash</Link>
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          <div>
            <h1>Team Members</h1>
            <p>Internal assignee directory for old and new notes.</p>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setSelectedId(null);
              setForm(emptyForm);
              setMessage(null);
            }}
          >
            New Assignee
          </button>
        </header>
        <div className="management-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Directory</h2>
            </div>
            {assigneesQuery.isLoading ? <p className="empty-state">Loading...</p> : null}
            <div className="row-list">
              {(assigneesQuery.data ?? []).map((assignee) => (
                <button
                  className="row-button"
                  key={assignee.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(assignee.id);
                    setForm(toForm(assignee));
                    setMessage(null);
                  }}
                >
                  <span>{assignee.name}</span>
                  <span className={assignee.is_active ? "chip success" : "chip warning"}>
                    {assignee.is_active ? "Active" : "Inactive"}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>{selectedId ? "Edit Assignee" : "Create Assignee"}</h2>
            </div>
            <div className="panel-body">
              {message ? <p className="status-text success">{message}</p> : null}
              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="assignee-name">Name</label>
                  <input
                    id="assignee-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="assignee-phone">Phone</label>
                  <input
                    id="assignee-phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div className="field full">
                  <label htmlFor="assignee-email">Email</label>
                  <input
                    id="assignee-email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div className="field full">
                  <label htmlFor="assignee-note">Note</label>
                  <textarea
                    id="assignee-note"
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  />
                </div>
                <div className="field full button-row">
                  <button className="btn btn-primary" type="submit" disabled={createAssignee.isPending || updateAssignee.isPending}>
                    Save
                  </button>
                  {selectedAssignee ? (
                    <>
                      <button className="btn btn-secondary" type="button" onClick={toggleActive}>
                        {selectedAssignee.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button className="btn btn-danger" type="button" onClick={handleDelete}>
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
