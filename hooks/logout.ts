
import { tokenStorage } from "@/api/auth/tokenStorage";
import { api } from "@/api/axios";
import { useClient } from "@/context/ClientContext";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

const useLogout = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const clientCtx = useClient();

  const logout = useCallback(async () => {
    setIsPending(true);
    let refreshToken: string | null = null;

    try {
      try {
        await api.post("/api/logout", {
          ...(refreshToken ? { refresh_token: refreshToken } : {})
        });
      } catch (e) {
        // ignore
      }

      try {
        await tokenStorage.clear();
      } catch (e) {
        // ignore
      }

      // Clear React Native async storage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        if (AsyncStorage && AsyncStorage.clear) {
          await AsyncStorage.clear();
        }
        if (clientCtx.clearAllClientData) {
          await clientCtx.clearAllClientData();
        }
      } catch (e) {}

      router.replace('/(auth)/login');
    } catch (error) {
      // ignore
    } finally {
      setIsPending(false);
    }
  }, [router, clientCtx]);

  return { logout, isPending };
};

export default useLogout;

