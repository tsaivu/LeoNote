import { dashboardRepository } from "../repositories/dashboardRepository";
import type { DashboardSummary } from "../types/dashboardTypes";

export const dashboardService = {
  summary(): Promise<DashboardSummary> {
    return dashboardRepository.summary();
  },
};
