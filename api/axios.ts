import { tokenStorage } from "@/api/auth/tokenStorage";
import axios from "axios";

// Utility to make sure headers object exists and is not undefined/null
function ensureHeaders(config: any) {
  if (!config.headers) config.headers = {};
  return config.headers;
}

// Axios instances (fixed for correct env var names, fallback, and consistent export)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";
const PY_BASE_URL = process.env.EXPO_PUBLIC_PYTHON_API_URL || process.env.PYTHON_PUBLIC_API_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "X-Client-Type": "native",
  },
});

const pyapi = axios.create({
  baseURL: PY_BASE_URL,
  headers: {
    "X-Client-Type": "native",
  },
});

export { api, pyapi };


let refreshing = false as boolean;
let queue: Array<{resolve: (token: string) => void, reject: (err: any) => void}> = [];

// --- Token Injection --- //
async function injectToken(config: any) {
  try {
    const token = await tokenStorage.getAccess();
    if (token) {
      ensureHeaders(config).Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // Optionally log or handle token retrieval error
  }
  return config;
}

api.interceptors.request.use(injectToken);
pyapi.interceptors.request.use(injectToken);

async function handleAuthError(error: any, originApi: typeof api | typeof pyapi) {
  try {
    const original = error.config;
    if (!original || original._retry) {
      return Promise.reject(error);
    }
    console.log(error.response,"=======================error")

    if (error.response?.status === 401) {
      const refreshToken = await tokenStorage.getRefresh();
      if (!refreshToken) {
        await tokenStorage.clear();
        return Promise.reject(error);
      }
      console.log(refreshToken,"======================refreshToken")

      if (refreshing) {
        // Wait for refresh to complete and retry
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((accessToken) => {
          if (!accessToken) {
            return Promise.reject(error);
          }
          // Retry with new token
          ensureHeaders(original).Authorization = `Bearer ${accessToken}`;
          return originApi(original);
        });
      }

      original._retry = true;
      refreshing = true;

      try {
        // Request new tokens
        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken },
          { headers: { "X-Client-Type": "native" } }
        );
        const { accessToken, refreshToken: newRefreshToken } = res.data;
        await tokenStorage.setAccess(accessToken);
        await tokenStorage.setRefresh(newRefreshToken);

        // Release queue after refresh
        queue.forEach(item => item.resolve(accessToken));
        queue = [];

        // Retry original request
        ensureHeaders(original).Authorization = `Bearer ${accessToken}`;
        return originApi(original);
      } catch (refreshError) {
        // Failed to refresh
        queue.forEach(item => item.reject(refreshError));
        queue = [];
        await tokenStorage.clear();
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    // Not a 401 error or already retried
    return Promise.reject(error);

  } catch (catchError) {
    return Promise.reject(catchError);
  }
}

api.interceptors.response.use(
  response => response,
  error => handleAuthError(error, api)
);

pyapi.interceptors.response.use(
  response => response,
  error => handleAuthError(error, pyapi)
);


