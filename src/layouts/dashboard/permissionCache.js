const PERMISSIONS_CACHE_KEY_PREFIX = "dashboardPermissions";

export const getLoggedInUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
    return user?.id || "";
  } catch {
    return "";
  }
};

export const getPermissionsCacheKey = () => {
  const userId = getLoggedInUserId();
  return userId ? `${PERMISSIONS_CACHE_KEY_PREFIX}:${userId}` : PERMISSIONS_CACHE_KEY_PREFIX;
};

export const getCachedPermissions = () => {
  try {
    const cachedPermissions = JSON.parse(localStorage.getItem(getPermissionsCacheKey()) || "[]");
    return Array.isArray(cachedPermissions) ? cachedPermissions : [];
  } catch {
    return [];
  }
};

export const saveCachedPermissions = (permissions = []) => {
  localStorage.setItem(getPermissionsCacheKey(), JSON.stringify(permissions));
};

export const clearCachedPermissions = () => {
  localStorage.removeItem(getPermissionsCacheKey());
};