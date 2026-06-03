import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assigneeService } from "../services/assigneeService";
import type { AssigneePayload } from "../repositories/assigneeRepository";

const ASSIGNEES_QUERY_KEY = ["assignees"];

export function useAssignees(enabled: boolean) {
  return useQuery({
    queryKey: ASSIGNEES_QUERY_KEY,
    queryFn: () => assigneeService.list(),
    enabled,
  });
}

export function useCreateAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssigneePayload) => assigneeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNEES_QUERY_KEY });
    },
  });
}

export function useUpdateAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assigneeId, payload }: { assigneeId: string; payload: AssigneePayload }) =>
      assigneeService.update(assigneeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: string) => assigneeService.delete(assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useActivateAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: string) => assigneeService.activate(assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNEES_QUERY_KEY });
    },
  });
}

export function useDeactivateAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: string) => assigneeService.deactivate(assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
