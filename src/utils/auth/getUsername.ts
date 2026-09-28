import { getUser } from "./auth";

export const getUsername = (reduxUser?: any) => {
  const user = reduxUser ?? getUser();

  return (
    user?.userName ??
    user?.username ??
    "Guest"
  );
};