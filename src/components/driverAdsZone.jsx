import React, { useEffect, useState } from "react";
import { Option, Select, Typography } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

function DriverAdsZone({
  label,
  placeholder,
  value,
  onChange,
  error,
  touched,
  refreshKey = 0,
  isSubZone = false,
  parentValue = "",
  showAll = true,
  disabled = false,
  returnLabel = false,
}) {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const fetchServiceAreas = async () => {
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
      if (response?.success) {
        setServiceAreas(response.data || []);
      } else {
        throw new Error(response?.message || "Failed to fetch service areas");
      }
    } catch (err) {
      setLoadError(err.message);
    }
  };

  const fetchZones = async () => {
    const parentId = serviceAreas.find(
      (item) => String(item?.id) === String(parentValue) || String(item?.name) === String(parentValue)
    )?.id;

    if (!parentId) {
      setZones([]);
      return;
    }
    try {
      setIsLoading(true);
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
        type: "Zone",
        parent_id: parentId,
      });
      if (response?.success) {
        setZones(response.data || []);
      } else {
        throw new Error(response?.message || "Failed to fetch zones");
      }
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceAreas();
  }, [refreshKey]);

  useEffect(() => {
    if (isSubZone) fetchZones();
  }, [parentValue, refreshKey, isSubZone]);

  const options = isSubZone ? zones : serviceAreas;
  const selectOptions = [
    ...(showAll ? [<Option key="All" value="">All</Option>] : []),
    ...options.map((item) => (
      <Option key={item?.id || item?.name} value={item?.id || ""}>
        {item?.name || ""}
      </Option>
    )),
  ];
  const selectedLabel =
    value === ""
      ? showAll
        ? "All"
        : placeholder || "Select"
      : options.find((item) => String(item?.id) === String(value))?.name
        || options.find((item) => String(item?.name) === String(value))?.name
        || placeholder || "Select";
  const resolveNextValue = (nextValue) => {
    if (nextValue === "" || nextValue === null || nextValue === undefined) return "";
    if (returnLabel) {
      const matched = options.find((item) => String(item?.id) === String(nextValue));
      return matched?.name || "";
    }
    return nextValue;
  };
  return (
    <div>
      <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
        {label}
      </Typography>
      <Select
        value={value}
        selected={() => selectedLabel}
        onChange={(nextValue) => onChange(resolveNextValue(nextValue))}
        disabled={isLoading || disabled}
      >
        {selectOptions}
      </Select>
      {touched && error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {loadError ? <div className="mt-1 text-sm text-red-500">{loadError}</div> : null}
    </div>
  );
}

export default DriverAdsZone;