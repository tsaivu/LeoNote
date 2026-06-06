import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";

import { DesktopSidebar } from "../../../shared/components/DesktopSidebar";
import { MobileManagementHeader } from "../../../shared/components/MobileManagementHeader";
import { MobilePageBarAction } from "../../../shared/components/MobilePageBarAction";
import { MobilePanelHeader } from "../../../shared/components/MobilePanelHeader";
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
  const { isAuthenticated, user, logout } = useAuth();
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

  async function handleDeleteAssignee(assignee: Assignee) {
    if (!window.confirm(`Delete or deactivate assignee "${assignee.name}"?`)) {
      return;
    }
    try {
      const saved = await deleteAssignee.mutateAsync(assignee.id);
      if (selectedId === assignee.id) {
        if (saved.deleted_at) {
          setSelectedId(null);
          setForm(emptyForm);
        } else {
          setForm(toForm(saved));
        }
      }
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
    <main className="taskflow-shell management-shell">
      <DesktopSidebar active="assignees" userName={user?.username} onLogout={logout} />
      <div className="taskflow-main management-main">
        <MobileManagementHeader
          userName={user?.display_name || user?.username || "User"}
          onLogout={logout}
          title="Team Members"
          subtitle="Internal assignee directory."
          action={
            <MobilePageBarAction
              icon="plus"
              onClick={() => {
                setSelectedId(null);
                setForm(emptyForm);
                setMessage(null);
              }}
            >
              New
            </MobilePageBarAction>
          }
        />
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
            <MobilePanelHeader
              title="Team Directory"
              meta={
                <span className="chip panel-meta-chip">{(assigneesQuery.data ?? []).length}</span>
              }
            />
            {assigneesQuery.isLoading ? <p className="empty-state">Loading...</p> : null}
            {!assigneesQuery.isLoading && (assigneesQuery.data ?? []).length === 0 ? (
              <p className="empty-state">No team members yet. Add someone to start assigning tasks.</p>
            ) : null}
            <div className="row-list">
              {(assigneesQuery.data ?? []).map((assignee) => (
                <div
                  className={selectedId === assignee.id ? "row-button active" : "row-button"}
                  key={assignee.id}
                >
                  <button
                    className="row-button-main"
                    type="button"
                    onClick={() => {
                      setSelectedId(assignee.id);
                      setForm(toForm(assignee));
                      setMessage(null);
                    }}
                  >
                    <span className="row-button-copy">
                      <strong>{assignee.name}</strong>
                      <span>{assignee.email || assignee.phone || "No contact details"}</span>
                    </span>
                    <span className={assignee.is_active ? "chip success" : "chip warning"}>
                      {assignee.is_active ? "Active" : "Inactive"}
                    </span>
                  </button>
                  <button
                    className="row-delete-button"
                    type="button"
                    onClick={() => handleDeleteAssignee(assignee)}
                    disabled={deleteAssignee.isPending}
                    aria-label={`Delete assignee ${assignee.name}`}
                    title="Delete assignee"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <MobilePanelHeader
              title={selectedId ? "Member Details" : "Create Member"}
              meta={
                <span className="chip panel-meta-chip">{selectedId ? "Editing" : "New"}</span>
              }
            />
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
