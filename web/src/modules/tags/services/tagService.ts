import { tagRepository, type TagPayload } from "../repositories/tagRepository";
import type { Tag } from "../types/tagTypes";

export const tagService = {
  list(): Promise<Tag[]> {
    return tagRepository.list();
  },
  create(payload: TagPayload): Promise<Tag> {
    return tagRepository.create(payload);
  },
  update(tagId: string, payload: TagPayload): Promise<Tag> {
    return tagRepository.update(tagId, payload);
  },
  delete(tagId: string): Promise<Tag> {
    return tagRepository.delete(tagId);
  },
};
