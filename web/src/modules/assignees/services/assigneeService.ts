import { assigneeRepository, type AssigneePayload } from "../repositories/assigneeRepository";
import type { Assignee } from "../types/assigneeTypes";

export const assigneeService = {
  list(): Promise<Assignee[]> {
    return assigneeRepository.list();
  },
  create(payload: AssigneePayload): Promise<Assignee> {
    return assigneeRepository.create(payload);
  },
  update(assigneeId: string, payload: AssigneePayload): Promise<Assignee> {
    return assigneeRepository.update(assigneeId, payload);
  },
  delete(assigneeId: string): Promise<Assignee> {
    return assigneeRepository.delete(assigneeId);
  },
  activate(assigneeId: string): Promise<Assignee> {
    return assigneeRepository.activate(assigneeId);
  },
  deactivate(assigneeId: string): Promise<Assignee> {
    return assigneeRepository.deactivate(assigneeId);
  },
};
