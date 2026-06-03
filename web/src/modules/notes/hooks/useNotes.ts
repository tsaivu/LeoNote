import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { noteService } from "../services/noteService";
import type { NoteCommentPayload, NotePayload } from "../types/noteTypes";

export function useNotes(enabled: boolean, params?: URLSearchParams) {
  return useQuery({
    queryKey: ["notes", params?.toString() ?? ""],
    queryFn: () => noteService.list(params),
    enabled,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotePayload) => noteService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: string; payload: NotePayload }) =>
      noteService.update(noteId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => noteService.remove(noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useTrashNotes(enabled: boolean) {
  return useQuery({
    queryKey: ["trash-notes"],
    queryFn: () => noteService.listTrash(),
    enabled,
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => noteService.restoreFromTrash(noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["trash-notes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useNoteComments(noteId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["note-comments", noteId],
    queryFn: () => noteService.listComments(noteId as string),
    enabled: enabled && Boolean(noteId),
  });
}

export function useCreateNoteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: string; payload: NoteCommentPayload }) =>
      noteService.createComment(noteId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["note-comments", variables.noteId] });
    },
  });
}
