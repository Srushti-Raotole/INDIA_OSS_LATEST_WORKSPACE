import axios from "axios";
import { baseURL, GLOBAL_LOGIN_URL, SAML_BASE_URL } from "./config";

export { baseURL };

// ---------------------------------------------------------------------------
// Main axios instance — India OSS Backend (port 7070)
// ---------------------------------------------------------------------------
const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const authToken = sessionStorage.getItem("LS_AUTH_TOKEN");
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// Catch expired or invalid token: clear session and redirect to global login.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = GLOBAL_LOGIN_URL;
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// SAML axios instance — Global Auth backend (port 7071)
// Used for logout and any direct calls to the Global Login service.
// ---------------------------------------------------------------------------
export const samlAxios = axios.create({
  baseURL: SAML_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

samlAxios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("LS_AUTH_TOKEN");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
