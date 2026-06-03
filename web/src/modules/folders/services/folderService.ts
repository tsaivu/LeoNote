import { folderRepository, type FolderPayload } from "../repositories/folderRepository";
import type { Folder } from "../types/folderTypes";

export const folderService = {
  tree(): Promise<Folder[]> {
    return folderRepository.tree();
  },
  create(payload: FolderPayload): Promise<Folder> {
    return folderRepository.create(payload);
  },
  update(folderId: string, payload: FolderPayload): Promise<Folder> {
    return folderRepository.update(folderId, payload);
  },
  delete(folderId: string): Promise<Folder> {
    return folderRepository.delete(folderId);
  },
};
