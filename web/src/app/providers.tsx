import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "../shared/api/queryClient";
import { AuthProvider } from "../shared/contexts/AuthContext";

export function providers(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
