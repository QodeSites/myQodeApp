import * as SecureStore from "expo-secure-store";

// Use only documented SecureStore API: getItemAsync, setItemAsync, deleteItemAsync
export const tokenStorage = {
  getAccess: async () => await SecureStore.getItemAsync("accessToken"),
  setAccess: async (token: string) => await SecureStore.setItemAsync("accessToken", token),

  getRefresh: async () => await SecureStore.getItemAsync("refreshToken"),
  setRefresh: async (token: string) => await SecureStore.setItemAsync("refreshToken", token),

  clear: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
  },

  clearAccess: async () => {await SecureStore.deleteItemAsync("accessToken")},
};
