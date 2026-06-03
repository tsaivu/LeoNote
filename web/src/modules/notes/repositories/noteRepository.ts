import { httpDelete, httpGet, httpPost, httpPut } from "../../../shared/api/httpClient";
import type { NoteComment, NoteCommentPayload, NoteItem, NotePayload } from "../types/noteTypes";

export const noteRepository = {
  list(params?: URLSearchParams): Promise<NoteItem[]> {
    const query = params?.toString();
    return httpGet<NoteItem[]>(query ? `/notes?${query}` : "/notes");
  },
  create(payload: NotePayload): Promise<NoteItem> {
    return httpPost<NoteItem, NotePayload>("/notes", payload);
  },
  update(noteId: string, payload: NotePayload): Promise<NoteItem> {
    return httpPut<NoteItem, NotePayload>(`/notes/${noteId}`, payload);
  },
  remove(noteId: string): Promise<NoteItem> {
    return httpDelete<NoteItem>(`/notes/${noteId}`);
  },
  restore(noteId: string): Promise<NoteItem> {
    return httpPost<NoteItem, Record<string, never>>(`/notes/${noteId}/restore`, {});
  },
  listTrash(): Promise<NoteItem[]> {
    return httpGet<NoteItem[]>("/trash/notes");
  },
  restoreFromTrash(noteId: string): Promise<NoteItem> {
    return httpPost<NoteItem, Record<string, never>>(`/trash/notes/${noteId}/restore`, {});
  },
  listComments(noteId: string): Promise<NoteComment[]> {
    return httpGet<NoteComment[]>(`/notes/${noteId}/comments`);
  },
  createComment(noteId: string, payload: NoteCommentPayload): Promise<NoteComment> {
    return httpPost<NoteComment, NoteCommentPayload>(`/notes/${noteId}/comments`, payload);
  },
};
