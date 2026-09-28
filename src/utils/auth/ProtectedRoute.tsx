import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { getUser } from "./auth";

interface Props {
  allow: string[];
  children: JSX.Element;
}

const ProtectedRoute: React.FC<Props> = ({ allow, children }) => {
  const user = getUser();

  if (!user) {
    return null;
  }

  if (user.role === "INDIA_ADMIN") {
    return children;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
export default ProtectedRoute;
