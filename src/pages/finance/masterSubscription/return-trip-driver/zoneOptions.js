import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

const ALL_OPTION = { label: "ALL", value: "ALL" };

export const fetchZoneOptions = async () => {
  try {
    const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
      type: "Service Area",
    });

    const list = Array.isArray(response?.data) ? response.data : [];
    const zoneNames = [
      ...new Set(
        list
          .filter((item) => String(item?.type || "").toLowerCase() === "service area")
          .map((item) => String(item?.name || "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    const options = zoneNames.map((name) => ({ label: name, value: name }));
    return [ALL_OPTION, ...options];
  } catch (error) {
    console.error("Failed to fetch zone options:", error);
    return [ALL_OPTION];
  }
};
