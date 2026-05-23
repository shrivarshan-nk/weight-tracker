import axiosClient from "./axiosClient";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
}

export function googleLogin(token: string) {
  return axiosClient.post<{ access_token: string; token_type: string; user: AuthUser }>(
    "/auth/google",
    { token }
  );
}
