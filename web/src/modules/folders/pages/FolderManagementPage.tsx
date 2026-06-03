import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateFolder, useDeleteFolder, useFolders, useUpdateFolder } from "../hooks/useFolders";
import type { Folder } from "../types/folderTypes";

type FolderForm = {
  name: string;
  parent_id: string;
  sort_order: string;
};

const emptyForm: FolderForm = {
  name: "",
  parent_id: "",
  sort_order: "0",
};

function toForm(folder: Folder): FolderForm {
  return {
    name: folder.name,
    parent_id: folder.parent_id ?? "",
    sort_order: String(folder.sort_order),
  };
}

function folderDepth(folder: Folder, folders: Folder[]): number {
  let depth = 0;
  let parentId = folder.parent_id;
  while (parentId) {
    const parent = folders.find((item) => item.id === parentId);
    if (!parent) {
      break;
    }
    depth += 1;
    parentId = parent.parent_id ?? null;
  }
  return depth;
}

export function FolderManagementPage() {
  const { isAuthenticated } = useAuth();
  const foldersQuery = useFolders(isAuthenticated);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FolderForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const folders = foldersQuery.data ?? [];
  const selectedFolder = folders.find((item) => item.id === selectedId) ?? null;
  const sortedFolders = [...folders].sort((left, right) => {
    const leftDepth = folderDepth(left, folders);
    const rightDepth = folderDepth(right, folders);
    return leftDepth - rightDepth || left.sort_order - right.sort_order || left.name.localeCompare(right.name);
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const payload = {
      name: form.name,
      parent_id: form.parent_id || null,
      sort_order: Number(form.sort_order) || 0,
    };

    try {
      const saved = selectedId
        ? await updateFolder.mutateAsync({ folderId: selectedId, payload })
        : await createFolder.mutateAsync(payload);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm("Soft delete this folder? Active notes will move to Inbox.")) {
      return;
    }
    try {
      await deleteFolder.mutateAsync(selectedId);
      setSelectedId(null);
      setForm(emptyForm);
      setMessage("Deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
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
          <Link className="nav-item active" to="/settings/folders">Folders</Link>
          <Link className="nav-item" to="/settings/tags">Tags</Link>
          <Link className="nav-item" to="/settings/assignees">Team Members</Link>
          <Link className="nav-item" to="/trash">Trash</Link>
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          <div>
            <h1>Folders</h1>
            <p>Manage the note tree. Active children still block deletion.</p>
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
            New Folder
          </button>
        </header>
        <div className="management-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Tree</h2>
            </div>
            {foldersQuery.isLoading ? <p className="empty-state">Loading...</p> : null}
            <div className="row-list">
              {sortedFolders.map((folder) => (
                <button
                  className="row-button"
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(folder.id);
                    setForm(toForm(folder));
                    setMessage(null);
                  }}
                >
                  <span style={{ paddingLeft: `${folderDepth(folder, folders) * 16}px` }}>{folder.name}</span>
                  {folder.is_system ? <span className="chip">System</span> : null}
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>{selectedId ? "Edit Folder" : "Create Folder"}</h2>
            </div>
            <div className="panel-body">
              {message ? <p className="status-text success">{message}</p> : null}
              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="field full">
                  <label htmlFor="folder-name">Name</label>
                  <input
                    id="folder-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="folder-parent">Parent</label>
                  <select
                    id="folder-parent"
                    value={form.parent_id}
                    onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}
                  >
                    <option value="">No parent</option>
                    {folders
                      .filter((folder) => folder.id !== selectedId)
                      .map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="folder-sort-order">Sort order</label>
                  <input
                    id="folder-sort-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
                  />
                </div>
                <div className="field full button-row">
                  <button className="btn btn-primary" type="submit" disabled={createFolder.isPending || updateFolder.isPending}>
                    Save
                  </button>
                  {selectedFolder && !selectedFolder.is_system ? (
                    <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={deleteFolder.isPending}>
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
