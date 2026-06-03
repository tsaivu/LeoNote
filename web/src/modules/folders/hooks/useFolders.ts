import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { folderService } from "../services/folderService";
import type { FolderPayload } from "../repositories/folderRepository";

const FOLDERS_QUERY_KEY = ["folders"];

export function useFolders(enabled: boolean) {
  return useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: () => folderService.tree(),
    enabled,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FolderPayload) => folderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, payload }: { folderId: string; payload: FolderPayload }) =>
      folderService.update(folderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => folderService.delete(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
