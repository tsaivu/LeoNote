import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tagService } from "../services/tagService";
import type { TagPayload } from "../repositories/tagRepository";

const TAGS_QUERY_KEY = ["tags"];

export function useTags(enabled: boolean) {
  return useQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: () => tagService.list(),
    enabled,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TagPayload) => tagService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, payload }: { tagId: string; payload: TagPayload }) => tagService.update(tagId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => tagService.delete(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
