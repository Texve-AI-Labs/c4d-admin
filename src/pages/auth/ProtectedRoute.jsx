import { Navigate } from "react-router-dom";
import { isSuperUserRole } from "@/utils/roleUtils";

const ProtectedRoute = ({ element, permission, permissions, permissionsAny = [], superUserOnly = false, requirePermission = false }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  // Frontend safe mode: deny route access if permission metadata is missing.
  if (requirePermission && !permission) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }

  if (superUserOnly) {
    if (!isSuperUserRole()) {
      return <Navigate to="/dashboard/tripDetails" replace />;
    }
  }

  const normalizedPermissions = (permissions || []).map((item) =>
    String(item || "").trim().toLowerCase()
  );
  const requiredPermission = String(permission || "").trim().toLowerCase();
  const requiredAnyPermissions = permissionsAny
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean);

  if (
    requiredAnyPermissions.length > 0
      ? !requiredAnyPermissions.some((item) => normalizedPermissions.includes(item))
      : permission && !normalizedPermissions.includes(requiredPermission)
  ) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }

  return element;
};

export default ProtectedRoute;
