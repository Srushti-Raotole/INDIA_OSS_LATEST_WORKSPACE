import { getUser } from "./auth/auth";
import { PUSH_ACTIVITY_LOGS } from "../api/apis";
import axiosClient from "../api/axiosClient";


export type ActivityLogPayload = {
  activity: string;
  actionName: string;
  module: string;
};

export const logActivity = async (
  payload: ActivityLogPayload
): Promise<void> => {
  try {
    const user = getUser();
    if (!user) return;

    await axiosClient.post(PUSH_ACTIVITY_LOGS, null, {
      params: {
        username: user.username,
        role: user.role,
        ...payload,
      },
    });
  } catch (err) {
    console.warn("Activity log failed", err);
  }
};
