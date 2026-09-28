import { useEffect, useRef } from "react";
import axiosClient from "@/api/axiosClient";
import { GLOBAL_LOGIN_URL } from "@/api/config";
import { RENEW_TOKEN } from "@/api/apis";

// Security Issue Fix - Fire 5 minutes before JWT expiry for silent renewal.
const RENEW_BEFORE_MS = 5 * 60 * 1000;

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Security Issue Fix - Silent token renewal hook.
// At 25 minutes (5 min before 30-min JWT expiry), calls POST /v1/apiauth/renew on INDIA_OSS_Backend.
// On success: updates sessionStorage with new token, restarts the 25-min timer.
// On failure (backend unreachable or token already expired): redirects to login.
// NOC screens running 24x7 renew every 25 minutes automatically — no login interruption.
export function useTokenRefresh(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleRenew() {
      const token = sessionStorage.getItem("LS_AUTH_TOKEN");
      if (!token) {
        console.warn("[TokenRenew] No token in sessionStorage — redirecting to login.");
        window.location.href = GLOBAL_LOGIN_URL;
        return;
      }

      const expiry = getTokenExpiry(token);
      if (!expiry) {
        console.warn("[TokenRenew] Cannot read token expiry — skipping timer.");
        return;
      }

      const delay = expiry - Date.now() - RENEW_BEFORE_MS;

      if (delay <= 0) {
        // Already at or past renewal window — attempt renew immediately
        doRenew();
        return;
      }

      console.log(`[TokenRenew] Next renewal at ${new Date(Date.now() + delay).toLocaleTimeString()}.`);

      timerRef.current = setTimeout(() => doRenew(), delay);
    }

    async function doRenew() {
      try {
        const res = await axiosClient.post<{ token: string }>(RENEW_TOKEN);
        const newToken = res.data.token;
        // Security Issue Fix - Update sessionStorage with fresh token before old one expires.
        sessionStorage.setItem("LS_AUTH_TOKEN", newToken);
        console.log("[TokenRenew] Token renewed silently. Scheduling next renewal.");
        // Schedule the next renewal cycle
        scheduleRenew();
      } catch {
        console.warn("[TokenRenew] Renewal failed — clearing session and redirecting to login.");
        sessionStorage.clear();
        window.location.href = GLOBAL_LOGIN_URL;
      }
    }

    scheduleRenew();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
