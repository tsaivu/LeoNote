import { userRepository } from "../repositories/userRepository";
import type { UserPasswordPayload, UserProfile, UserProfilePayload } from "../types/userTypes";

export const userService = {
  me(): Promise<UserProfile> {
    return userRepository.me();
  },
  updateProfile(payload: UserProfilePayload): Promise<UserProfile> {
    return userRepository.updateProfile(payload);
  },
  updatePassword(payload: UserPasswordPayload): Promise<{ status: string }> {
    return userRepository.updatePassword(payload);
  },
};
