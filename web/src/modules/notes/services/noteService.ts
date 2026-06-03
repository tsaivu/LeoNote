import { noteRepository } from "../repositories/noteRepository";
import type { NoteComment, NoteCommentPayload, NoteItem, NotePayload } from "../types/noteTypes";

export const noteService = {
  list(params?: URLSearchParams): Promise<NoteItem[]> {
    return noteRepository.list(params);
  },
  create(payload: NotePayload): Promise<NoteItem> {
    return noteRepository.create(payload);
  },
  update(noteId: string, payload: NotePayload): Promise<NoteItem> {
    return noteRepository.update(noteId, payload);
  },
  remove(noteId: string): Promise<NoteItem> {
    return noteRepository.remove(noteId);
  },
  restore(noteId: string): Promise<NoteItem> {
    return noteRepository.restore(noteId);
  },
  listTrash(): Promise<NoteItem[]> {
    return noteRepository.listTrash();
  },
  restoreFromTrash(noteId: string): Promise<NoteItem> {
    return noteRepository.restoreFromTrash(noteId);
  },
  listComments(noteId: string): Promise<NoteComment[]> {
    return noteRepository.listComments(noteId);
  },
  createComment(noteId: string, payload: NoteCommentPayload): Promise<NoteComment> {
    return noteRepository.createComment(noteId, payload);
  },
};
