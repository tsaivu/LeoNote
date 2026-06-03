import { httpDelete, httpGet, httpPost, httpPut } from "../../../shared/api/httpClient";
import type { Assignee } from "../types/assigneeTypes";

export type AssigneePayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
};

export const assigneeRepository = {
  list(): Promise<Assignee[]> {
    return httpGet<Assignee[]>("/assignees");
  },
  create(payload: AssigneePayload): Promise<Assignee> {
    return httpPost<Assignee, AssigneePayload>("/assignees", payload);
  },
  update(assigneeId: string, payload: AssigneePayload): Promise<Assignee> {
    return httpPut<Assignee, AssigneePayload>(`/assignees/${assigneeId}`, payload);
  },
  delete(assigneeId: string): Promise<Assignee> {
    return httpDelete<Assignee>(`/assignees/${assigneeId}`);
  },
  activate(assigneeId: string): Promise<Assignee> {
    return httpPost<Assignee, Record<string, never>>(`/assignees/${assigneeId}/activate`, {});
  },
  deactivate(assigneeId: string): Promise<Assignee> {
    return httpPost<Assignee, Record<string, never>>(`/assignees/${assigneeId}/deactivate`, {});
  },
};
