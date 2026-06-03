import { httpGet, httpPost } from "../../../shared/api/httpClient";
import type { AuthUser, LoginPayload, LoginResponse } from "../types/authTypes";

export const authRepository = {
  login(username: string, password: string): Promise<LoginResponse> {
    const payload: LoginPayload = { username, password };
    return httpPost<LoginResponse, LoginPayload>("/auth/login", payload);
  },
  refresh(refreshToken?: string | null): Promise<LoginResponse> {
    return httpPost<LoginResponse, { refresh_token?: string | null }>("/auth/refresh", {
      refresh_token: refreshToken ?? null,
    });
  },
  logout(refreshToken?: string | null): Promise<{ status: string }> {
    return httpPost<{ status: string }, { refresh_token?: string | null }>("/auth/logout", {
      refresh_token: refreshToken ?? null,
    });
  },
  me(): Promise<AuthUser> {
    return httpGet<AuthUser>("/auth/me");
  },
};
