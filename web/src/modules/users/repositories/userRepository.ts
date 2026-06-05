import { httpGet, httpPut } from "../../../shared/api/httpClient";
import type { UserPasswordPayload, UserProfile, UserProfilePayload } from "../types/userTypes";

export const userRepository = {
  me(): Promise<UserProfile> {
    return httpGet<UserProfile>("/users/me");
  },
  updateProfile(payload: UserProfilePayload): Promise<UserProfile> {
    return httpPut<UserProfile, UserProfilePayload>("/users/me", payload);
  },
  updatePassword(payload: UserPasswordPayload): Promise<{ status: string }> {
    return httpPut<{ status: string }, UserPasswordPayload>("/users/me/password", payload);
  },
};
