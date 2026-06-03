import { httpGet } from "../../../shared/api/httpClient";
import type { DashboardSummary } from "../types/dashboardTypes";

export const dashboardRepository = {
  summary(): Promise<DashboardSummary> {
    return httpGet<DashboardSummary>("/dashboard/summary");
  },
};
