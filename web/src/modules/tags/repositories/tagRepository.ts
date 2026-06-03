import { httpDelete, httpGet, httpPost, httpPut } from "../../../shared/api/httpClient";
import type { Tag } from "../types/tagTypes";

export type TagPayload = {
  name: string;
};

export const tagRepository = {
  list(): Promise<Tag[]> {
    return httpGet<Tag[]>("/tags");
  },
  create(payload: TagPayload): Promise<Tag> {
    return httpPost<Tag, TagPayload>("/tags", payload);
  },
  update(tagId: string, payload: TagPayload): Promise<Tag> {
    return httpPut<Tag, TagPayload>(`/tags/${tagId}`, payload);
  },
  delete(tagId: string): Promise<Tag> {
    return httpDelete<Tag>(`/tags/${tagId}`);
  },
};
