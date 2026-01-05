import { api } from "@/api/axios";
import { tokenStorage } from "./tokenStorage";

export async function login(email: string, password: string) {
  const res = await api.post("/api/auth/login", { email, password });

  await tokenStorage.setAccess(res.data.accessToken);
  await tokenStorage.setRefresh(res.data.refreshToken);

  return res.data.user;
}

export async function logout() {
  const refreshToken = await tokenStorage.getRefresh();
  if (refreshToken) {
    await api.post("/api/auth/logout", { refreshToken });
  }
  await tokenStorage.clear();
}
