import { FormEvent, KeyboardEvent, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAssignees, useCreateAssignee } from "../../assignees/hooks/useAssignees";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateFolder, useFolders } from "../../folders/hooks/useFolders";
import { formatVietnamDate } from "../../../shared/lib/datetime";
import { MobileAppHeader } from "../../../shared/components/MobileAppHeader";
import { isRichTextEmpty, sanitizeRichTextHtml } from "../../../shared/lib/richText";
import { useCreateTag } from "../../tags/hooks/useTags";
import { useTags } from "../../tags/hooks/useTags";
import { RichTextEditor } from "../components/RichTextEditor";
import { useCreateNote, useCreateNoteComment, useDeleteNote, useNoteComments, useNotes, useUpdateNote } from "../hooks/useNotes";
import type { NoteItem, NotePayload, SubtaskPayload } from "../types/noteTypes";

type NoteFormState = {
  title: string;
  content: string;
  folder_id: string;
  main_assignee_id: string;
  assignee_ids: string[];
  status: string;
  priority: string;
  progress_percent: number;
  deadline_at: string;
  tag_names: string[];
  subtasks: SubtaskPayload[];
};

const emptyForm: NoteFormState = {
  title: "",
  content: "",
  folder_id: "",
  main_assignee_id: "",
  assignee_ids: [],
  status: "TODO",
  priority: "MEDIUM",
  progress_percent: 0,
  deadline_at: "",
  tag_names: [],
  subtasks: [],
};

type MessageTone = "success" | "danger";

type SubtaskFormState = {
  id?: string | null;
  title: string;
  content: string;
  assignee_id: string;
  priority: string;
  deadline_at: string;
  status: string;
  sort_order: number;
};

type TimelineItem = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  kind: "comment" | "timeline" | "system";
};

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function formatDateInputPreview(value: string) {
  if (!value) {
    return "No due date";
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "No due date";
  }
  return `${day}/${month}/${year}`;
}

function fromNote(note: NoteItem): NoteFormState {
  return {
    title: note.title,
    content: note.content ?? "",
    folder_id: note.folder.id,
    main_assignee_id: note.main_assignee.id,
    assignee_ids: (note.assignees?.length ? note.assignees : [note.main_assignee]).map((assignee) => assignee.id),
    status: note.status,
    priority: note.priority,
    progress_percent: note.progress_percent,
    deadline_at: toDateInputValue(note.deadline_at),
    tag_names: note.tags.map((tag) => tag.name),
    subtasks: note.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      content: subtask.content ?? "",
      assignee_id: subtask.assignee?.id ?? note.main_assignee.id,
      priority: subtask.priority,
      deadline_at: subtask.deadline_at,
      status: subtask.status,
      sort_order: subtask.sort_order,
    })),
  };
}

function toPayload(form: NoteFormState, tagIds: string[]): NotePayload {
  const assigneeIds = Array.from(new Set(form.assignee_ids.length ? form.assignee_ids : [form.main_assignee_id])).filter(Boolean);
  const mainAssigneeId = assigneeIds[0] ?? form.main_assignee_id;
  const payload: NotePayload = {
    title: form.title,
    content: sanitizeRichTextHtml(form.content) || null,
    folder_id: form.folder_id || null,
    main_assignee_id: mainAssigneeId,
    assignee_ids: assigneeIds,
    status: form.status,
    priority: form.priority,
    progress_percent: form.progress_percent,
    tag_ids: tagIds,
    subtasks: form.subtasks.map((subtask, index) => ({
      ...subtask,
      content: subtask.content || null,
      assignee_id: subtask.assignee_id || mainAssigneeId,
      deadline_at: subtask.deadline_at || null,
      sort_order: subtask.sort_order || index + 1,
    })),
  };
  if (form.deadline_at) {
    payload.deadline_at = new Date(`${form.deadline_at}T00:00:00+07:00`).toISOString();
  }
  return payload;
}

function statusChipClass(status: string) {
  if (status === "DONE") {
    return "chip success";
  }
  if (status === "PENDING") {
    return "chip warning";
  }
  return "chip";
}

function statusLabel(status: string) {
  if (status === "DOING") {
    return "In Progress";
  }
  if (status === "TODO") {
    return "To Do";
  }
  return status;
}

function priorityChipClass(priority: string) {
  if (priority === "HIGH" || priority === "CRITICAL") {
    return "priority-badge high";
  }
  if (priority === "MEDIUM") {
    return "priority-badge medium";
  }
  return "priority-badge low";
}

function priorityLabel(priority: string) {
  if (priority === "CRITICAL") {
    return "High";
  }
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function formatDeadline(value: string | null) {
  if (!value) {
    return "No deadline";
  }
  return formatVietnamDate(value);
}

function getProgress(note: NoteItem) {
  if (note.status === "DONE") {
    return 100;
  }
  if (note.subtasks.length === 0) {
    return Math.max(0, Math.min(100, note.progress_percent ?? 0));
  }
  const doneCount = note.subtasks.filter((subtask) => subtask.status === "DONE").length;
  return Math.round((doneCount / note.subtasks.length) * 100);
}

function getProgressClass(progress: number) {
  if (progress >= 100) {
    return "progress-fill done";
  }
  if (progress >= 40) {
    return "progress-fill active";
  }
  if (progress >= 20) {
    return "progress-fill warning";
  }
  return "progress-fill danger";
}

function getAssigneeInitials(note: NoteItem) {
  const names = [
    ...(note.assignees?.length ? note.assignees.map((assignee) => assignee.name) : [note.main_assignee.name]),
    ...note.subtasks.map((subtask) => subtask.assignee.name),
  ];
  return Array.from(new Set(names))
    .slice(0, 3)
    .map((name) => name.trim().charAt(0).toUpperCase() || "?");
}

function getAssigneeNames(note: NoteItem) {
  const names = [
    ...(note.assignees?.length ? note.assignees.map((assignee) => assignee.name) : [note.main_assignee.name]),
    ...note.subtasks.map((subtask) => subtask.assignee.name),
  ];
  return Array.from(new Set(names)).filter(Boolean);
}

function toSubtaskFormState(subtask?: SubtaskPayload | null, fallbackAssigneeId = ""): SubtaskFormState {
  return {
    id: subtask?.id ?? null,
    title: subtask?.title ?? "",
    content: subtask?.content ?? "",
    assignee_id: subtask?.assignee_id ?? fallbackAssigneeId,
    priority: subtask?.priority ?? "MEDIUM",
    deadline_at: toDateInputValue(subtask?.deadline_at),
    status: subtask?.status ?? "TODO",
    sort_order: subtask?.sort_order ?? 0,
  };
}

function buildPayloadFromNote(note: NoteItem, patch: Partial<NoteFormState> = {}): NotePayload {
  const form = { ...fromNote(note), ...patch };
  return toPayload(
    form,
    note.tags.map((tag) => tag.id),
  );
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  return `${Math.round(diffHours / 24)} days ago`;
}

export function NotesWorkspacePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<"TODO" | "DOING" | "DONE">("TODO");
  const [activePriorityFilter, setActivePriorityFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("ALL");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const noteParams = useMemo(() => {
    const params = new URLSearchParams();
    if (deferredSearchTerm.trim()) {
      params.set("q", deferredSearchTerm.trim());
    }
    params.set("status", activeStatus);
    if (activePriorityFilter !== "ALL") {
      params.set("priority", activePriorityFilter);
    }
    if (activeFolderId) {
      params.set("folder_id", activeFolderId);
    }
    return params;
  }, [activeFolderId, activePriorityFilter, activeStatus, deferredSearchTerm]);
  const notesQuery = useNotes(isAuthenticated, noteParams);
  const foldersQuery = useFolders(isAuthenticated);
  const assigneesQuery = useAssignees(isAuthenticated);
  const tagsQuery = useTags(isAuthenticated);
  const createFolderMutation = useCreateFolder();
  const createAssigneeMutation = useCreateAssignee();
  const createTagMutation = useCreateTag();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const createNoteCommentMutation = useCreateNoteComment();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);
  const [detailNoteSnapshot, setDetailNoteSnapshot] = useState<NoteItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<NoteFormState>(emptyForm);
  const [lastSavedForm, setLastSavedForm] = useState<NoteFormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("success");
  const [tagDraft, setTagDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newAssigneeName, setNewAssigneeName] = useState("");
  const [detailSubtaskStatuses, setDetailSubtaskStatuses] = useState<Record<string, string>>({});
  const [isSubtaskEditorOpen, setIsSubtaskEditorOpen] = useState(false);
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null);
  const [subtaskForm, setSubtaskForm] = useState<SubtaskFormState>(() => toSubtaskFormState(null));

  const notes = notesQuery.data ?? [];
  const activeProjectName = activeFolderId
    ? (foldersQuery.data ?? []).find((folder) => folder.id === activeFolderId)?.name ?? "Selected project"
    : "All projects";
  const visibleUrgentCount = notes.filter((note) => note.priority === "HIGH" || note.priority === "CRITICAL").length;
  const averageProgress =
    notes.length === 0
      ? 0
      : Math.round(notes.reduce((total, note) => total + getProgress(note), 0) / notes.length);
  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );
  const detailNote = useMemo(
    () => notes.find((note) => note.id === detailNoteId) ?? (detailNoteSnapshot?.id === detailNoteId ? detailNoteSnapshot : null),
    [detailNoteId, detailNoteSnapshot, notes],
  );
  const commentsQuery = useNoteComments(detailNote?.id ?? null, isAuthenticated && Boolean(detailNote));
  const detailTimeline = useMemo(() => {
    if (!detailNote) {
      return [];
    }
    const commentItems: TimelineItem[] = (commentsQuery.data ?? []).map((comment) => ({
      id: comment.id,
      author: comment.author_name,
      text: comment.content,
      createdAt: comment.created_at,
      kind: comment.kind === "TIMELINE_NOTE" ? "timeline" : "comment",
    }));
    const baseItems: TimelineItem[] = [
      {
        id: `${detailNote.id}-updated`,
        author: "System",
        text: `Task updated with status "${statusLabel(detailNote.status)}".`,
        createdAt: detailNote.updated_at,
        kind: "system",
      },
      {
        id: `${detailNote.id}-created`,
        author: "System",
        text: "Task was created.",
        createdAt: detailNote.created_at,
        kind: "system",
      },
    ];
    return [...commentItems, ...baseItems].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [commentsQuery.data, detailNote]);
  const isDirty = JSON.stringify(form) !== JSON.stringify(lastSavedForm);

  useEffect(() => {
    if (!selectedNoteId && !isDirty) {
      const nextForm = {
        ...emptyForm,
        folder_id: foldersQuery.data?.[0]?.id ?? "",
        main_assignee_id: assigneesQuery.data?.[0]?.id ?? "",
        assignee_ids: assigneesQuery.data?.[0]?.id ? [assigneesQuery.data[0].id] : [],
      };
      setForm(nextForm);
      setLastSavedForm(nextForm);
    }
  }, [assigneesQuery.data, foldersQuery.data, isDirty, selectedNoteId]);

  useEffect(() => {
    if (!detailNote) {
      setDetailSubtaskStatuses({});
      return;
    }
    setDetailSubtaskStatuses(
      Object.fromEntries(detailNote.subtasks.map((subtask) => [subtask.id, subtask.status])),
    );
  }, [detailNote?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") !== "1" || isEditorOpen) {
      return;
    }
    startNewNote();
    params.delete("new");
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: true },
    );
  }, [isEditorOpen, location.pathname, location.search, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  function openNoteDetail(note: NoteItem) {
    setDetailNoteId(note.id);
    setDetailNoteSnapshot(note);
    setCommentDraft("");
    setMessage(null);
  }

  function selectNote(note: NoteItem) {
    if (isDirty && !window.confirm("Discard unsaved changes?")) {
      return;
    }
    const nextForm = fromNote(note);
    setSelectedNoteId(note.id);
    setDetailNoteId(null);
    setDetailNoteSnapshot(null);
    setForm(nextForm);
    setLastSavedForm(nextForm);
    setMessage(null);
    setMessageTone("success");
    setIsEditorOpen(true);
    setIsSubtaskEditorOpen(false);
    setTagDraft("");
  }

  function startNewNote() {
    if (isDirty && !window.confirm("Discard unsaved changes?")) {
      return;
    }
    const nextForm = {
      ...emptyForm,
      folder_id: foldersQuery.data?.[0]?.id ?? "",
      main_assignee_id: assigneesQuery.data?.[0]?.id ?? "",
      assignee_ids: assigneesQuery.data?.[0]?.id ? [assigneesQuery.data[0].id] : [],
    };
    setSelectedNoteId(null);
    setDetailNoteId(null);
    setDetailNoteSnapshot(null);
    setForm(nextForm);
    setLastSavedForm(nextForm);
    setMessage(null);
    setMessageTone("success");
    setIsEditorOpen(true);
    setIsSubtaskEditorOpen(false);
    setTagDraft("");
  }

  async function markDetailComplete() {
    if (!detailNote) {
      return;
    }
    try {
      const saved = await updateNoteMutation.mutateAsync({
        noteId: detailNote.id,
        payload: buildPayloadFromNote(detailNote, { status: "DONE" }),
      });
      setDetailNoteId(saved.id);
      setDetailNoteSnapshot(saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
      setMessageTone("danger");
    }
  }

  async function updateDetailStatus(status: string) {
    if (!detailNote) {
      return;
    }
    try {
      const saved = await updateNoteMutation.mutateAsync({
        noteId: detailNote.id,
        payload: buildPayloadFromNote(detailNote, { status }),
      });
      setDetailNoteId(saved.id);
      setDetailNoteSnapshot(saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
      setMessageTone("danger");
    }
  }

  async function updateDetailProgress(progressPercent: number) {
    if (!detailNote || detailNote.subtasks.length > 0) {
      return;
    }
    try {
      const saved = await updateNoteMutation.mutateAsync({
        noteId: detailNote.id,
        payload: buildPayloadFromNote(detailNote, { progress_percent: progressPercent }),
      });
      setDetailNoteId(saved.id);
      setDetailNoteSnapshot(saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
      setMessageTone("danger");
    }
  }

  function hasDetailSubtaskChanges() {
    if (!detailNote) {
      return false;
    }
    return detailNote.subtasks.some((subtask) => detailSubtaskStatuses[subtask.id] && detailSubtaskStatuses[subtask.id] !== subtask.status);
  }

  async function saveDetailSubtasks() {
    if (!detailNote || !hasDetailSubtaskChanges()) {
      return;
    }
    try {
      const saved = await updateNoteMutation.mutateAsync({
        noteId: detailNote.id,
        payload: buildPayloadFromNote(detailNote, {
          subtasks: fromNote(detailNote).subtasks.map((subtask) => ({
            ...subtask,
            status: detailSubtaskStatuses[subtask.id ?? ""] ?? subtask.status,
          })),
        }),
      });
      setDetailNoteId(saved.id);
      setDetailNoteSnapshot(saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
      setMessageTone("danger");
    }
  }

  async function submitDetailComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailNote) {
      return;
    }
    const text = commentDraft.trim();
    if (!text) {
      return;
    }
    try {
      await createNoteCommentMutation.mutateAsync({
        noteId: detailNote.id,
        payload: {
          content: text,
          kind: "COMMENT",
        },
      });
      setCommentDraft("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save comment failed");
      setMessageTone("danger");
    }
  }

  function closeEditor() {
    if (isDirty && !window.confirm("Discard unsaved changes?")) {
      return;
    }
    setIsEditorOpen(false);
    setIsSubtaskEditorOpen(false);
    setMessage(null);
    setMessageTone("success");
    setTagDraft("");
  }

  function normalizeTagName(value: string) {
    return value.trim().replace(/\s+/g, " ");
  }

  function addTagName(rawValue: string) {
    const name = normalizeTagName(rawValue);
    if (!name) {
      return;
    }
    setForm((current) => {
      const exists = current.tag_names.some((tagName) => tagName.toLowerCase() === name.toLowerCase());
      return exists ? current : { ...current, tag_names: [...current.tag_names, name] };
    });
    setTagDraft("");
  }

  function selectedProjectName() {
    return (foldersQuery.data ?? []).find((folder) => folder.id === form.folder_id)?.name ?? "Select project";
  }

  function selectedAssigneeNames() {
    const selectedIds = new Set(form.assignee_ids);
    return (assigneesQuery.data ?? [])
      .filter((assignee) => selectedIds.has(assignee.id))
      .map((assignee) => assignee.name);
  }

  function toggleAssignee(assigneeId: string) {
    setForm((current) => {
      const exists = current.assignee_ids.includes(assigneeId);
      const assigneeIds = exists
        ? current.assignee_ids.filter((id) => id !== assigneeId)
        : [...current.assignee_ids, assigneeId];
      const fallbackId = assigneesQuery.data?.[0]?.id ?? "";
      const nextMainAssigneeId = assigneeIds[0] ?? fallbackId;
      return {
        ...current,
        assignee_ids: assigneeIds,
        main_assignee_id: nextMainAssigneeId,
        subtasks: current.subtasks.map((subtask) => ({
          ...subtask,
          assignee_id: subtask.assignee_id || nextMainAssigneeId,
        })),
      };
    });
  }

  async function createProjectFromPicker() {
    const name = newProjectName.trim();
    if (!name) {
      return;
    }
    const folder = await createFolderMutation.mutateAsync({ name });
    setForm((current) => ({ ...current, folder_id: folder.id }));
    setNewProjectName("");
  }

  async function createAssigneeFromPicker() {
    const name = newAssigneeName.trim();
    if (!name) {
      return;
    }
    const assignee = await createAssigneeMutation.mutateAsync({ name });
    setForm((current) => ({
      ...current,
      main_assignee_id: current.main_assignee_id || assignee.id,
      assignee_ids: Array.from(new Set([...current.assignee_ids, assignee.id])),
    }));
    setNewAssigneeName("");
  }

  function handleTagInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }
    event.preventDefault();
    addTagName(tagDraft);
  }

  async function resolveTagIds(tagNames: string[]) {
    const existingTags = tagsQuery.data ?? [];
    const tagIds: string[] = [];
    for (const tagName of tagNames) {
      const existing = existingTags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());
      if (existing) {
        tagIds.push(existing.id);
        continue;
      }
      const created = await createTagMutation.mutateAsync({ name: tagName });
      tagIds.push(created.id);
    }
    return tagIds;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone("success");
    try {
      const draftTagName = normalizeTagName(tagDraft);
      const finalTagNames =
        draftTagName && !form.tag_names.some((tagName) => tagName.toLowerCase() === draftTagName.toLowerCase())
          ? [...form.tag_names, draftTagName]
          : form.tag_names;
      const tagIds = await resolveTagIds(finalTagNames);
      const payload = toPayload({ ...form, tag_names: finalTagNames }, tagIds);
      const saved = selectedNoteId
        ? await updateNoteMutation.mutateAsync({ noteId: selectedNoteId, payload })
        : await createNoteMutation.mutateAsync(payload);
      const nextForm = fromNote(saved);
      setSelectedNoteId(saved.id);
      setForm(nextForm);
      setLastSavedForm(nextForm);
      setMessage("Saved");
      setMessageTone("success");
      setIsEditorOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
      setMessageTone("danger");
    }
  }

  async function deleteSelectedNote() {
    if (!selectedNoteId || !window.confirm("Delete this note?")) {
      return;
    }
    try {
      await deleteNoteMutation.mutateAsync(selectedNoteId);
      const nextForm = {
        ...emptyForm,
        folder_id: foldersQuery.data?.[0]?.id ?? "",
        main_assignee_id: assigneesQuery.data?.[0]?.id ?? "",
        assignee_ids: assigneesQuery.data?.[0]?.id ? [assigneesQuery.data[0].id] : [],
      };
      setSelectedNoteId(null);
      setForm(nextForm);
      setLastSavedForm(nextForm);
      setMessage("Deleted");
      setMessageTone("success");
      setIsEditorOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
      setMessageTone("danger");
    }
  }

  function openSubtaskEditor(index?: number) {
    const target = typeof index === "number" ? form.subtasks[index] : null;
    setEditingSubtaskIndex(typeof index === "number" ? index : null);
    setSubtaskForm(toSubtaskFormState(target, form.main_assignee_id || (assigneesQuery.data?.[0]?.id ?? "")));
    setIsSubtaskEditorOpen(true);
  }

  function closeSubtaskEditor() {
    setIsSubtaskEditorOpen(false);
    setEditingSubtaskIndex(null);
    setSubtaskForm(toSubtaskFormState(null, form.main_assignee_id || (assigneesQuery.data?.[0]?.id ?? "")));
  }

  function saveSubtaskDraft() {
    if (!subtaskForm.title.trim() || !subtaskForm.assignee_id) {
      return;
    }
    const nextSubtask: SubtaskPayload = {
      id: subtaskForm.id ?? null,
      title: subtaskForm.title.trim(),
      content: sanitizeRichTextHtml(subtaskForm.content),
      assignee_id: subtaskForm.assignee_id,
      priority: subtaskForm.priority,
      deadline_at: subtaskForm.deadline_at ? new Date(`${subtaskForm.deadline_at}T00:00:00+07:00`).toISOString() : null,
      status: subtaskForm.status,
      sort_order: subtaskForm.sort_order,
    };
    setForm((current) => {
      if (editingSubtaskIndex === null) {
        return {
          ...current,
          subtasks: [
            ...current.subtasks,
            {
              ...nextSubtask,
              sort_order: current.subtasks.length + 1,
            },
          ],
        };
      }
      return {
        ...current,
        subtasks: current.subtasks.map((subtask, index) =>
          index === editingSubtaskIndex
            ? {
                ...nextSubtask,
                sort_order: subtask.sort_order || index + 1,
              }
            : subtask,
        ),
      };
    });
    closeSubtaskEditor();
  }

  function removeSubtask(index: number) {
    setForm((current) => ({
      ...current,
      subtasks: current.subtasks
        .filter((_, subtaskIndex) => subtaskIndex !== index)
        .map((subtask, subtaskIndex) => ({ ...subtask, sort_order: subtaskIndex + 1 })),
    }));
  }

  return (
    <main className="taskflow-shell">
      <aside className="taskflow-sidebar">
        <div className="taskflow-brand">
          <span className="taskflow-logo" />
          <span>TaskFlow</span>
        </div>
        <nav className="taskflow-nav" aria-label="TaskFlow navigation">
          <button className="taskflow-nav-item active" type="button" onClick={startNewNote}>
            <span className="tf-icon tf-icon-check" />
            My Tasks
          </button>
          <Link className="taskflow-nav-item" to="/settings/folders">
            <span className="tf-icon tf-icon-folder" />
            Projects
          </Link>
          <Link className="taskflow-nav-item" to="/">
            <span className="tf-icon tf-icon-calendar" />
            Calendar
          </Link>
          <Link className="taskflow-nav-item" to="/settings/assignees">
            <span className="tf-icon tf-icon-team" />
            Team
          </Link>
          <Link className="taskflow-nav-item" to="/trash">
            <span className="tf-icon tf-icon-report" />
            Reports
          </Link>
          <Link className="taskflow-nav-item" to="/settings/tags">
            <span className="tf-icon tf-icon-settings" />
            Settings
          </Link>
        </nav>
        <button className="taskflow-user" type="button" onClick={logout} title={`Logout ${user?.username ?? ""}`}>
          <span className="taskflow-user-avatar">{user?.username?.slice(0, 1).toUpperCase() ?? "U"}</span>
          <span className="taskflow-user-caret">v</span>
        </button>
      </aside>

      <div className="taskflow-main">
        <section className="taskflow-desktop-header" aria-label="Dashboard overview">
          <div className="taskflow-desktop-header-main">
            <div className="taskflow-page-title">
              <span>Dashboard</span>
              <h1>My Tasks</h1>
              <p>
                {activeProjectName} / {statusLabel(activeStatus)}
              </p>
            </div>
            <label className="taskflow-search" htmlFor="task-search-desktop">
              <span className="search-icon" aria-hidden="true" />
              <input
                id="task-search-desktop"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks..."
              />
            </label>
            <button className="taskflow-new-task-button" type="button" onClick={startNewNote}>
              New Task
            </button>
          </div>
          <div className="taskflow-summary-grid" aria-label="Visible task summary">
            <article className="taskflow-summary-card">
              <span>Visible tasks</span>
              <strong>{notes.length}</strong>
            </article>
            <article className="taskflow-summary-card">
              <span>Avg progress</span>
              <strong>{averageProgress}%</strong>
            </article>
            <article className="taskflow-summary-card">
              <span>High priority</span>
              <strong>{visibleUrgentCount}</strong>
            </article>
          </div>
          <div className="project-tabs taskflow-desktop-project-tabs" role="tablist" aria-label="Project filter">
            <button className={activeFolderId === null ? "active" : ""} type="button" onClick={() => setActiveFolderId(null)}>
              All Tasks
            </button>
            {(foldersQuery.data ?? []).map((folder) => (
              <button
                className={activeFolderId === folder.id ? "active" : ""}
                key={folder.id}
                type="button"
                onClick={() => setActiveFolderId(folder.id)}
              >
                {folder.name}
              </button>
            ))}
          </div>
        </section>
        <header className="taskflow-mobile-header taskflow-mobile-header-dashboard">
          <MobileAppHeader userName={user?.display_name || user?.username || "User"} onLogout={logout} />
          <section className="taskflow-mobile-toolbar">
            <label className="taskflow-mobile-search-pill" htmlFor="task-search-header">
              <span className="search-icon" aria-hidden="true" />
              <input
                id="task-search-header"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks..."
              />
            </label>
            <button
              className="taskflow-mobile-filter-button"
              type="button"
              aria-label="Filter tasks"
              onClick={() => setIsMobileFilterOpen((current) => !current)}
            >
              <span className="taskflow-mobile-filter-icon" aria-hidden="true" />
            </button>
          </section>
          <div className="project-tabs" role="tablist" aria-label="Project filter">
            <button className={activeFolderId === null ? "active" : ""} type="button" onClick={() => setActiveFolderId(null)}>
              All Tasks
            </button>
            {(foldersQuery.data ?? []).map((folder) => (
              <button
                className={activeFolderId === folder.id ? "active" : ""}
                key={folder.id}
                type="button"
                onClick={() => setActiveFolderId(folder.id)}
              >
                {folder.name}
              </button>
            ))}
          </div>
        </header>
        <section className="taskflow-board">
          <div className="taskflow-board-header">
            <div className={isMobileFilterOpen ? "taskflow-filter-panel mobile-open" : "taskflow-filter-panel"}>
              <div className="taskflow-tabs" role="tablist" aria-label="Task status">
                <button className={activeStatus === "TODO" ? "active" : ""} type="button" onClick={() => setActiveStatus("TODO")}>
                  To Do
                </button>
                <button className={activeStatus === "DOING" ? "active" : ""} type="button" onClick={() => setActiveStatus("DOING")}>
                  In Progress
                </button>
                <button className={activeStatus === "DONE" ? "active" : ""} type="button" onClick={() => setActiveStatus("DONE")}>
                  Done
                </button>
              </div>
              <div className="taskflow-priority-pills" role="tablist" aria-label="Priority filter">
                {[
                  ["ALL", "All"],
                  ["LOW", "Low"],
                  ["MEDIUM", "Medium"],
                  ["HIGH", "High"],
                  ["CRITICAL", "Urgent"],
                ].map(([value, label]) => (
                  <button
                    className={activePriorityFilter === value ? "active" : ""}
                    key={value}
                    type="button"
                    onClick={() => setActivePriorityFilter(value as "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {notesQuery.isLoading ? <p className="empty-state">Loading notes...</p> : null}
          {notesQuery.isError ? <p className="empty-state">Failed to load notes.</p> : null}
          <table className="taskflow-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Deadline</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => {
                const progress = getProgress(note);
                const assigneeNames = getAssigneeNames(note);
                return (
                  <tr
                    key={note.id}
                    className={note.id === detailNoteId ? "selected-row" : ""}
                    onClick={() => openNoteDetail(note)}
                  >
                    <td>
                      <button className="task-name-button" type="button" onClick={() => openNoteDetail(note)}>
                        {note.title}
                      </button>
                    </td>
                    <td>
                      <span className={priorityChipClass(note.priority)} aria-label={priorityLabel(note.priority)} title={priorityLabel(note.priority)}>
                        {priorityLabel(note.priority)}
                      </span>
                    </td>
                    <td>
                      <span className="assignee-stack">
                        {getAssigneeInitials(note).map((initial, index) => (
                          <span className={`assignee-avatar avatar-${index + 1}`} key={`${note.id}-${initial}-${index}`}>
                            {initial}
                          </span>
                        ))}
                      </span>
                      <span className="task-assignee-pill-list" aria-label={`Assignees: ${assigneeNames.join(", ")}`}>
                        {assigneeNames.map((name) => (
                          <span className="task-assignee-pill" key={`${note.id}-${name}`}>
                            {name}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td>{formatDeadline(note.deadline_at)}</td>
                    <td>
                      <div className="progress-cell">
                        <span>{progress}%</span>
                        <span className="progress-track">
                          <span className={getProgressClass(progress)} style={{ width: `${progress}%` }} />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {notes.length === 0 ? <p className="empty-state">No active notes.</p> : null}
          <button className="taskflow-floating-button" type="button" onClick={startNewNote} aria-label="New Task">
            +
          </button>
        </section>
        {detailNote ? (
          <div className="task-modal-backdrop task-detail-backdrop" role="presentation">
            <section className="task-detail-modal" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
              <div className="task-detail-main">
                <button
                  className="task-detail-close"
                  type="button"
                  onClick={() => {
                    setDetailNoteId(null);
                    setDetailNoteSnapshot(null);
                  }}
                  aria-label="Close task detail"
                >
                  x
                </button>
                <h2 id="task-detail-title">{detailNote.title}</h2>
                {isRichTextEmpty(detailNote.content) ? (
                  <p className="task-detail-description">No description has been added for this task yet.</p>
                ) : (
                  <div
                    className="task-detail-description rich-text-content"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(detailNote.content ?? "") }}
                  />
                )}

                <div className="detail-divider" />

                <div className="detail-subtask-header">
                  <h3>{detailNote.subtasks.length === 0 ? "Progress" : "Subtasks"}</h3>
                  <div className="detail-subtask-actions">
                    <span>{getProgress(detailNote)}% Complete</span>
                    {hasDetailSubtaskChanges() ? (
                      <button type="button" onClick={saveDetailSubtasks} disabled={updateNoteMutation.isPending}>
                        Save
                      </button>
                    ) : null}
                  </div>
                </div>
                <span className="detail-progress-track">
                  <span className={getProgressClass(getProgress(detailNote))} style={{ width: `${getProgress(detailNote)}%` }} />
                </span>
                <div className="detail-subtask-list">
                  {detailNote.subtasks.length === 0 ? <p className="detail-empty">No subtasks yet.</p> : null}
                  {detailNote.subtasks.map((subtask) => (
                    <div className="detail-subtask-row" key={subtask.id}>
                      <button
                        className={(detailSubtaskStatuses[subtask.id] ?? subtask.status) === "DONE" ? "detail-check checked" : "detail-check"}
                        type="button"
                        onClick={() =>
                          setDetailSubtaskStatuses((current) => ({
                            ...current,
                            [subtask.id]: (current[subtask.id] ?? subtask.status) === "DONE" ? "TODO" : "DONE",
                          }))
                        }
                        aria-label={`Toggle subtask ${subtask.title}`}
                      >
                        {(detailSubtaskStatuses[subtask.id] ?? subtask.status) === "DONE" ? "x" : ""}
                      </button>
                      <span>{subtask.title}</span>
                      <span className="detail-comment-icon" aria-hidden="true" />
                    </div>
                  ))}
                </div>

                <form className="detail-comment-form" onSubmit={submitDetailComment}>
                  <span className="detail-comment-avatar">{user?.username?.slice(0, 1).toUpperCase() ?? "U"}</span>
                  <input
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Add a comment or timeline note..."
                  />
                  <button type="submit" disabled={createNoteCommentMutation.isPending}>
                    Post
                  </button>
                </form>

                <section className="detail-timeline" aria-label="Timeline and activity log">
                  <h3>Timeline & Activity Log</h3>
                  {commentsQuery.isLoading ? <p className="detail-empty">Loading comments...</p> : null}
                  {detailTimeline.map((item) => (
                    <article className="timeline-item" key={item.id}>
                      <span className={item.kind === "system" ? "timeline-avatar system" : "timeline-avatar"}>
                        {item.kind === "system" ? "S" : item.author.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p>
                          <strong>{item.author}</strong> <span>{formatRelativeTime(item.createdAt)}</span>
                        </p>
                        <p>{item.text}</p>
                      </div>
                    </article>
                  ))}
                </section>
              </div>

              <aside className="task-detail-side">
                <div className="detail-side-actions">
                  <button
                    className="detail-primary-action"
                    type="button"
                    onClick={markDetailComplete}
                    disabled={detailNote.status === "DONE" || updateNoteMutation.isPending}
                  >
                    Mark as Complete
                  </button>
                  <button className="detail-secondary-action" type="button" onClick={() => selectNote(detailNote)}>
                    Edit Task
                  </button>
                </div>

                <div className="detail-side-field">
                  <label htmlFor="detail-status">Status</label>
                  <select
                    id="detail-status"
                    value={detailNote.status}
                    onChange={(event) => updateDetailStatus(event.target.value)}
                    disabled={updateNoteMutation.isPending}
                  >
                    <option value="TODO">To Do</option>
                    <option value="DOING">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className="detail-side-field">
                  <span>Priority</span>
                  <span className={priorityChipClass(detailNote.priority)}>{priorityLabel(detailNote.priority)}</span>
                </div>

                {detailNote.subtasks.length === 0 ? (
                  <div className="detail-side-field">
                    <label htmlFor="detail-progress-percent">Progress</label>
                    <div className="progress-editor detail-progress-editor">
                      <input
                        id="detail-progress-percent"
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={detailNote.progress_percent}
                        onChange={(event) => updateDetailProgress(Number(event.target.value) || 0)}
                        disabled={updateNoteMutation.isPending}
                      />
                      <strong>{detailNote.progress_percent}%</strong>
                    </div>
                  </div>
                ) : null}

                <div className="detail-side-field">
                  <span>Assignees</span>
                  <div className="detail-assignee-list">
                    {(detailNote.assignees?.length ? detailNote.assignees : [detailNote.main_assignee]).map((assignee) => (
                      <div className="detail-assignee-card" key={assignee.id}>
                        <span className="detail-assignee-avatar">{assignee.name.slice(0, 1).toUpperCase()}</span>
                        <div>
                          <strong>{assignee.name}</strong>
                          <small>{assignee.is_active ? "Active assignee" : "Inactive assignee"}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detail-side-field">
                  <span>Due Date</span>
                  <strong>{formatDeadline(detailNote.deadline_at)}</strong>
                </div>

                <div className="detail-side-field">
                  <span>Project associated</span>
                  <strong className="detail-project-name">{detailNote.folder.name}</strong>
                </div>

                <div className="detail-side-field">
                  <span>Tags</span>
                  <div className="detail-tag-list">
                    {detailNote.tags.length === 0 ? <small>No tags</small> : null}
                    {detailNote.tags.map((tag) => (
                      <span className="detail-tag" key={tag.id}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </aside>
            </section>
          </div>
        ) : null}

        {isEditorOpen ? (
          <div className="task-modal-backdrop" role="presentation">
            <section className="task-modal create-task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
              <div className="create-task-header">
                <h2 id="task-modal-title">{selectedNote ? "Edit Task" : "Create New Task"}</h2>
                <button className="create-task-close" type="button" onClick={closeEditor} aria-label="Close create task">
                  x
                </button>
              </div>
              <div className="task-modal-body">
                {message ? <p className={`status-text ${messageTone}`}>{message}</p> : null}
                <form className="create-task-form" onSubmit={handleSubmit}>
                  <input
                    className="create-task-title"
                    id="note-title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Enter Task Title"
                    required
                  />

                  <div className="create-task-field full">
                    <label htmlFor="note-content">Description</label>
                    <RichTextEditor
                      id="note-content"
                      value={form.content}
                      onChange={(value) => setForm((current) => ({ ...current, content: value }))}
                      placeholder="Add details about the task here, including requirements and objectives."
                    />
                  </div>

                  <div className="create-task-field">
                    <span className="form-label">Project</span>
                    <button className="picker-open-button" type="button" onClick={() => setIsProjectPickerOpen(true)}>
                      <span>{selectedProjectName()}</span>
                      <span>Change</span>
                    </button>
                  </div>

                  <div className="create-task-field">
                    <span className="form-label">Assignees</span>
                    <button className="picker-open-button" type="button" onClick={() => setIsAssigneePickerOpen(true)}>
                      <span>
                        {selectedAssigneeNames().length > 0
                          ? selectedAssigneeNames().join(", ")
                          : "Select assignees"}
                      </span>
                      <span>Change</span>
                    </button>
                  </div>

                  <div className="create-task-field">
                    <span className="form-label">Priority</span>
                    <div className="priority-segment">
                      {[
                        ["LOW", "Low"],
                        ["MEDIUM", "Medium"],
                        ["HIGH", "High"],
                        ["CRITICAL", "Urgent"],
                      ].map(([value, label]) => (
                        <button
                          className={form.priority === value ? "active" : ""}
                          key={value}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, priority: value }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.subtasks.length === 0 ? (
                    <div className="create-task-field">
                      <label htmlFor="note-progress-percent">Progress</label>
                      <div className="progress-editor">
                        <input
                          id="note-progress-percent"
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={form.progress_percent}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, progress_percent: Number(event.target.value) || 0 }))
                          }
                        />
                        <strong>{form.progress_percent}%</strong>
                      </div>
                    </div>
                  ) : null}

                  <div className="create-task-field">
                    <label htmlFor="note-deadline">Due Date</label>
                    <input
                      id="note-deadline"
                      type="date"
                      value={form.deadline_at}
                      onChange={(event) => setForm((current) => ({ ...current, deadline_at: event.target.value }))}
                    />
                    <small className="field-hint">{formatDateInputPreview(form.deadline_at)}</small>
                  </div>

                  <div className="create-task-field full">
                    <label htmlFor="note-tags">Tags</label>
                    <div className="tag-input-box create-tags">
                      {form.tag_names.map((tagName) => (
                        <span className="tag-chip" key={tagName}>
                          {tagName}
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                tag_names: current.tag_names.filter((currentTagName) => currentTagName !== tagName),
                              }))
                            }
                            aria-label={`Remove tag ${tagName}`}
                          >
                            x
                          </button>
                        </span>
                      ))}
                      <input
                        id="note-tags"
                        list="available-tags"
                        value={tagDraft}
                        onBlur={() => addTagName(tagDraft)}
                        onChange={(event) => setTagDraft(event.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Type tag and press Enter"
                      />
                      <datalist id="available-tags">
                        {(tagsQuery.data ?? []).map((tag) => (
                          <option key={tag.id} value={tag.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="create-task-field full">
                    <span className="form-label">Subtasks</span>
                    <div className="create-subtask-list">
                      {form.subtasks.length === 0 ? (
                        <div className="create-subtask-empty">
                          <p>No subtasks yet.</p>
                          <button
                            className="add-subtask-button primary"
                            type="button"
                            onClick={() => openSubtaskEditor()}
                          >
                            + Add Subtask
                          </button>
                        </div>
                      ) : null}
                      {form.subtasks.map((subtask, index) => (
                        <div className="create-subtask-card" key={subtask.id ?? index}>
                          <div className="create-subtask-card-header">
                            <strong>{subtask.title}</strong>
                            <span className={priorityChipClass(subtask.priority)}>{priorityLabel(subtask.priority)}</span>
                          </div>
                          <div className="create-subtask-card-meta">
                            <span>
                              {(assigneesQuery.data ?? []).find((assignee) => assignee.id === subtask.assignee_id)?.name ?? "Unassigned"}
                            </span>
                            <span>{subtask.deadline_at ? formatDeadline(subtask.deadline_at) : "No deadline"}</span>
                          </div>
                          <div className="create-subtask-card-actions">
                            <button type="button" onClick={() => openSubtaskEditor(index)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => removeSubtask(index)} aria-label="Remove subtask">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        className="add-subtask-button"
                        type="button"
                        onClick={() => openSubtaskEditor()}
                      >
                        + Add Another Subtask
                      </button>
                    </div>
                  </div>

                  <div className="create-task-footer">
                    {selectedNoteId ? (
                      <button className="btn btn-danger" type="button" onClick={deleteSelectedNote} disabled={deleteNoteMutation.isPending}>
                        Delete
                      </button>
                    ) : null}
                    <button
                      className="create-task-submit"
                      type="submit"
                      disabled={
                        createNoteMutation.isPending ||
                        updateNoteMutation.isPending ||
                        !form.folder_id ||
                        form.assignee_ids.length === 0
                      }
                    >
                      {selectedNote ? "Update Task" : "Create Task"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
            {isSubtaskEditorOpen ? (
              <section className="picker-modal subtask-modal" role="dialog" aria-modal="true" aria-labelledby="subtask-editor-title">
                <div className="picker-modal-header">
                  <h3 id="subtask-editor-title">{editingSubtaskIndex === null ? "Add Subtask" : "Edit Subtask"}</h3>
                  <button type="button" onClick={closeSubtaskEditor} aria-label="Close subtask editor">
                    x
                  </button>
                </div>
                <div className="subtask-modal-body">
                  <div className="create-task-field">
                    <label htmlFor="subtask-title">Title</label>
                    <input
                      id="subtask-title"
                      type="text"
                      value={subtaskForm.title}
                      onChange={(event) => setSubtaskForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Subtask title"
                    />
                  </div>

                  <div className="create-task-field full">
                    <label htmlFor="subtask-content">Description</label>
                    <RichTextEditor
                      id="subtask-content"
                      value={subtaskForm.content}
                      onChange={(value) => setSubtaskForm((current) => ({ ...current, content: value }))}
                      placeholder="Describe the scope of this subtask."
                    />
                  </div>

                  <div className="create-task-field">
                    <span className="form-label">Assignee</span>
                    <select
                      value={subtaskForm.assignee_id}
                      onChange={(event) => setSubtaskForm((current) => ({ ...current, assignee_id: event.target.value }))}
                    >
                      {(assigneesQuery.data ?? [])
                        .filter((assignee) => assignee.is_active)
                        .map((assignee) => (
                          <option key={assignee.id} value={assignee.id}>
                            {assignee.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="create-task-field full">
                    <span className="form-label">Priority</span>
                    <div className="priority-segment">
                      {[
                        ["LOW", "Low"],
                        ["MEDIUM", "Medium"],
                        ["HIGH", "High"],
                        ["CRITICAL", "Urgent"],
                      ].map(([value, label]) => (
                        <button
                          className={subtaskForm.priority === value ? "active" : ""}
                          key={value}
                          type="button"
                          onClick={() => setSubtaskForm((current) => ({ ...current, priority: value }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="create-task-field">
                    <label htmlFor="subtask-deadline">Due Date</label>
                    <input
                      id="subtask-deadline"
                      type="date"
                      value={subtaskForm.deadline_at}
                      onChange={(event) => setSubtaskForm((current) => ({ ...current, deadline_at: event.target.value }))}
                    />
                    <small className="field-hint">{formatDateInputPreview(subtaskForm.deadline_at)}</small>
                  </div>

                  <div className="create-task-field">
                    <span className="form-label">Status</span>
                    <div className="priority-segment subtask-status-segment">
                      {[
                        ["TODO", "To Do"],
                        ["DONE", "Done"],
                      ].map(([value, label]) => (
                        <button
                          className={subtaskForm.status === value ? "active" : ""}
                          key={value}
                          type="button"
                          onClick={() => setSubtaskForm((current) => ({ ...current, status: value }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="create-task-footer subtask-modal-footer">
                    <button className="cancel-task-button" type="button" onClick={closeSubtaskEditor}>
                      Cancel
                    </button>
                    <button className="create-task-submit" type="button" onClick={saveSubtaskDraft} disabled={!subtaskForm.title.trim() || !subtaskForm.assignee_id}>
                      Save Subtask
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
            {isProjectPickerOpen ? (
              <section className="picker-modal" role="dialog" aria-modal="true" aria-labelledby="project-picker-title">
                <div className="picker-modal-header">
                  <h3 id="project-picker-title">Select Project</h3>
                  <button type="button" onClick={() => setIsProjectPickerOpen(false)} aria-label="Close project picker">
                    x
                  </button>
                </div>
                <div className="picker-create-row">
                  <input
                    value={newProjectName}
                    onChange={(event) => setNewProjectName(event.target.value)}
                    placeholder="New project name"
                  />
                  <button type="button" onClick={createProjectFromPicker} disabled={createFolderMutation.isPending}>
                    +
                  </button>
                </div>
                <div className="picker-option-list">
                  {(foldersQuery.data ?? []).map((folder) => (
                    <button
                      className={form.folder_id === folder.id ? "active" : ""}
                      key={folder.id}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, folder_id: folder.id }));
                        setIsProjectPickerOpen(false);
                      }}
                    >
                      <span>{folder.name}</span>
                      <small>{folder.is_system ? "System" : "Project"}</small>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {isAssigneePickerOpen ? (
              <section className="picker-modal" role="dialog" aria-modal="true" aria-labelledby="assignee-picker-title">
                <div className="picker-modal-header">
                  <h3 id="assignee-picker-title">Select Assignees</h3>
                  <button type="button" onClick={() => setIsAssigneePickerOpen(false)} aria-label="Close assignee picker">
                    x
                  </button>
                </div>
                <div className="picker-create-row">
                  <input
                    value={newAssigneeName}
                    onChange={(event) => setNewAssigneeName(event.target.value)}
                    placeholder="New assignee name"
                  />
                  <button type="button" onClick={createAssigneeFromPicker} disabled={createAssigneeMutation.isPending}>
                    +
                  </button>
                </div>
                <div className="picker-option-list">
                  {(assigneesQuery.data ?? [])
                    .filter((assignee) => assignee.is_active)
                    .map((assignee) => (
                      <button
                        className={form.assignee_ids.includes(assignee.id) ? "active" : ""}
                        key={assignee.id}
                        type="button"
                        onClick={() => toggleAssignee(assignee.id)}
                      >
                        <span>{assignee.name}</span>
                        <small>{form.main_assignee_id === assignee.id ? "Primary" : "Assignee"}</small>
                      </button>
                    ))}
                </div>
                <div className="picker-footer">
                  <button type="button" onClick={() => setIsAssigneePickerOpen(false)}>
                    Done
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
