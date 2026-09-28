import { samlAxios } from "@/api/axiosClient";
import { GLOBAL_LOGIN_URL } from "@/api/config";

export interface AppUser {
  username: string;
  role: string;
}

export function getUser(): AppUser | null {
  // Security: read token from sessionStorage (cleared on tab close) not localStorage.
  const token = sessionStorage.getItem("LS_AUTH_TOKEN");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const username = payload.sub;
    const roles: string[] = payload.portalRoles?.INDIA_OSS ?? [];
    const role = roles.includes("INDIA_ADMIN") ? "INDIA_ADMIN" : (roles[0] ?? "INDIA_NOC");
    return { username, role };
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const token = sessionStorage.getItem("LS_AUTH_TOKEN");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const username = payload.sub;
      if (username) {
        const res = await samlAxios.get<Array<{ id: number; username: string }>>("/v1/users");
        const match = res.data.find(
          (u) => u.username?.toLowerCase() === username.toLowerCase()
        );
        if (match?.id) {
          await samlAxios.post(`/v1/users/${match.id}/logout`);
        }
      }
    }
  } catch {}

  // Security: clear sessionStorage (not localStorage) on logout.
  sessionStorage.clear();
  window.location.href = GLOBAL_LOGIN_URL;
}
