import { httpDelete, httpGet, httpPost, httpPut } from "../../../shared/api/httpClient";
import type { Folder } from "../types/folderTypes";

export type FolderPayload = {
  name: string;
  parent_id?: string | null;
  sort_order?: number;
};

export const folderRepository = {
  tree(): Promise<Folder[]> {
    return httpGet<Folder[]>("/folders/tree");
  },
  create(payload: FolderPayload): Promise<Folder> {
    return httpPost<Folder, FolderPayload>("/folders", payload);
  },
  update(folderId: string, payload: FolderPayload): Promise<Folder> {
    return httpPut<Folder, FolderPayload>(`/folders/${folderId}`, payload);
  },
  delete(folderId: string): Promise<Folder> {
    return httpDelete<Folder>(`/folders/${folderId}`);
  },
};
