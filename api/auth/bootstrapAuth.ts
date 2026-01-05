import axios from "axios";
import { tokenStorage } from "./tokenStorage";

export async function bootstrapAuth() {
  try {
    const refreshToken = await tokenStorage.getRefresh();
    if (!refreshToken) return false;

    const res = await axios.post(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/refresh`,
      { refreshToken },
      { headers: { "X-Client-Type": "native" } }
    );

    await tokenStorage.setAccess(res.data.accessToken);
    await tokenStorage.setRefresh(res.data.refreshToken);

    return true;
  } catch {
    await tokenStorage.clear();
    return false;
  }
}
