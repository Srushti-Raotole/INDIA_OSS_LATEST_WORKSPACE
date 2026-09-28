
import { Navigate } from "react-router-dom";
import { getUser } from "../utils/auth/auth";

const AuthLanding = () => {

  const user = getUser();

  // wait until token restored
  if (!user) {
    return null;
  }

  // Admin goes to admin portal
  if (user.role === "INDIA_ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // All other INDIA OSS users go to faults page
  return <Navigate to="/faults/active" replace />;
};

export default AuthLanding;