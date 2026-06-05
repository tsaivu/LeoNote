import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";

import { DesktopSidebar } from "../../../shared/components/DesktopSidebar";
import { MobileManagementHeader } from "../../../shared/components/MobileManagementHeader";
import { MobilePageBarAction } from "../../../shared/components/MobilePageBarAction";
import { MobilePanelHeader } from "../../../shared/components/MobilePanelHeader";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from "../hooks/useTags";
import type { Tag } from "../types/tagTypes";

type TagForm = {
  name: string;
};

const emptyForm: TagForm = {
  name: "",
};

function toForm(tag: Tag): TagForm {
  return {
    name: tag.name,
  };
}

export function TagManagementPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const tagsQuery = useTags(isAuthenticated);
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<TagForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const selectedTag = (tagsQuery.data ?? []).find((item) => item.id === selectedId) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      const saved = selectedId
        ? await updateTag.mutateAsync({ tagId: selectedId, payload: form })
        : await createTag.mutateAsync(form);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm("Soft delete this tag and remove it from notes?")) {
      return;
    }
    try {
      await deleteTag.mutateAsync(selectedId);
      setSelectedId(null);
      setForm(emptyForm);
      setMessage("Deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <main className="taskflow-shell management-shell">
      <DesktopSidebar active="tags" userName={user?.username} onLogout={logout} />
      <div className="taskflow-main management-main">
        <MobileManagementHeader
          userName={user?.display_name || user?.username || "User"}
          onLogout={logout}
          title="Tags"
          subtitle="Classify notes consistently."
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
            <h1>Tags</h1>
            <p>Labels used to classify notes and search context.</p>
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
            New Tag
          </button>
        </header>
        <div className="management-grid">
          <section className="panel">
            <MobilePanelHeader
              title="Tag Library"
              meta={
                <span className="chip panel-meta-chip">{(tagsQuery.data ?? []).length}</span>
              }
            />
            {tagsQuery.isLoading ? <p className="empty-state">Loading...</p> : null}
            {!tagsQuery.isLoading && (tagsQuery.data ?? []).length === 0 ? <p className="empty-state">No tags yet. Create a tag to organize tasks.</p> : null}
            <div className="row-list">
              {(tagsQuery.data ?? []).map((tag) => (
                <button
                  className={selectedId === tag.id ? "row-button active" : "row-button"}
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(tag.id);
                    setForm(toForm(tag));
                    setMessage(null);
                  }}
                >
                  <span className="row-button-copy">
                    <strong>{tag.name}</strong>
                    <span>Used for task grouping</span>
                  </span>
                  <span className="chip">{tag.slug}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <MobilePanelHeader
              title={selectedId ? "Tag Details" : "Create Tag"}
              meta={
                <span className="chip panel-meta-chip">{selectedId ? "Editing" : "New"}</span>
              }
            />
            <div className="panel-body">
              {message ? <p className="status-text success">{message}</p> : null}
              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="field full">
                  <label htmlFor="tag-name">Name</label>
                  <input
                    id="tag-name"
                    value={form.name}
                    onChange={(event) => setForm({ name: event.target.value })}
                    required
                  />
                </div>
                <div className="field full button-row">
                  <button className="btn btn-primary" type="submit" disabled={createTag.isPending || updateTag.isPending}>
                    Save
                  </button>
                  {selectedTag ? (
                    <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={deleteTag.isPending}>
                      Delete
                    </button>
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
