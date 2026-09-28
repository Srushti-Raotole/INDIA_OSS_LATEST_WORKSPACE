import { JSX } from "react";
import { useTokenRefresh } from "./useTokenRefresh";
import { GLOBAL_LOGIN_URL } from "@/api/config";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const AuthGuard = ({ children }: { children: JSX.Element }) => {
  // Proactive timer: redirects 5 min before JWT expiry (at ~25 min for 30-min tokens).
  useTokenRefresh();

  // Security Issue Fix - Use sessionStorage instead of localStorage for auth token.
  // sessionStorage is tab-scoped and cleared when the browser tab closes, reducing token leak risk.
  const token = sessionStorage.getItem("LS_AUTH_TOKEN");

  if (!token || isTokenExpired(token)) {
    sessionStorage.clear();
    window.location.href = GLOBAL_LOGIN_URL;
    return null;
  }

  return children;
};

export default AuthGuard;
