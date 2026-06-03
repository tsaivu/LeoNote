import type { LoginResponse } from "../types/authTypes";
import { authRepository } from "../repositories/authRepository";

export const authService = {
  login(username: string, password: string): Promise<LoginResponse> {
    return authRepository.login(username, password);
  },
  refresh(refreshToken?: string | null): Promise<LoginResponse> {
    return authRepository.refresh(refreshToken);
  },
  logout(refreshToken?: string | null): Promise<{ status: string }> {
    return authRepository.logout(refreshToken);
  },
};
