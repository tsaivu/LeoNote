import { useAuthContext } from "../../../shared/contexts/AuthContext";

export function useAuth() {
  return useAuthContext();
}
