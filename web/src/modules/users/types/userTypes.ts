import type { AuthUser } from "../../auth/types/authTypes";

export type UserProfile = AuthUser;

export type UserProfilePayload = {
  display_name?: string | null;
  email?: string | null;
};

export type UserPasswordPayload = {
  current_password: string;
  new_password: string;
};
