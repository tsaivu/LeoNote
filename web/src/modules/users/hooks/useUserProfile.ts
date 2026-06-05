import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userService } from "../services/userService";
import type { UserPasswordPayload, UserProfilePayload } from "../types/userTypes";

const USER_PROFILE_QUERY_KEY = ["user-profile"];

export function useUserProfile(enabled: boolean) {
  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: () => userService.me(),
    enabled,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserProfilePayload) => userService.updateProfile(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(USER_PROFILE_QUERY_KEY, user);
    },
  });
}

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: (payload: UserPasswordPayload) => userService.updatePassword(payload),
  });
}
