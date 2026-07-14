import React, { useEffect, useState } from "react";
import { Button, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import DriverIncentiveTabs from "./DriverIncentiveTabs";
import DriverIncentiveFilters from "./DriverIncentiveFilters";
import DriverIncentiveTable from "./DriverIncentiveTable";
import { fetchDriverIncentiveList } from "./driverIncentiveApi";
import { mapDriverIncentiveRows } from "./driverIncentiveMapper";
import { fetchZoneOptions } from "./zoneOptions";

const toBooleanOrNull = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
};

const hasRenderableComponent = (item) =>
  item?.mode !== "RULES" || (item?.component && typeof item.component === "object");

function DriverIncentiveList() {
  const navigate = useNavigate();
  const [code, setCode] = useState("ONLINE_HOURS_RULES");
  const [partnerType, setPartnerType] = useState("CAB");
  const [status, setStatus] = useState("ALL");
  const [zone, setZone] = useState("");
  const [zoneOptions, setZoneOptions] = useState([{ label: "ALL", value: "" }]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadZones = async () => {
      const options = await fetchZoneOptions();
      setZoneOptions(options);
    };

    loadZones();
  }, []);

  useEffect(() => {
    const loadList = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchDriverIncentiveList({
          code,
          partnerType,
          zone,
          isActive: status === "ALL" ? undefined : status === "ACTIVE",
          vehicleType: String(partnerType || "").toUpperCase() === "AUTO" ? "AUTO": String(partnerType || "").toUpperCase() === "BIKE" ? "BIKE" : "ALL",
        });
        const rawRows = Array.isArray(response?.rows)
          ? response.rows
          : Array.isArray(response?.data)
            ? response.data
            : response?.data && typeof response.data === "object"
            ? [response.data]
            : [];
        const filteredRows =
          status === "ALL"
            ? rawRows
            : rawRows.filter((item) => {
                const activeValue = toBooleanOrNull(item?.isActive);
                return status === "ACTIVE" ? activeValue === true : activeValue === false;
              });
        setRows(mapDriverIncentiveRows(filteredRows.filter(hasRenderableComponent)));
      } catch (apiError) {
        console.error("Failed to fetch driver incentive list:", apiError);
        setRows([]);
        setError(apiError?.message || "Failed to load driver incentive list");
      } finally {
        setLoading(false);
      }
    };

    loadList();
  }, [code, partnerType, zone, status]);

  return (
    <div className="mb-10 mt-5 space-y-4 bg-white p-2 px-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
      <div>
        <Typography variant="h5" color="blue-gray" className="font-bold">
          Driver Incentive
        </Typography>
        <Typography color="gray" className="mt-1 text-base font-normal">
          Review driver incentive components by code and scope
        </Typography>
        </div>
        <Button
          color="blue"
          onClick={() =>
            navigate(
              `/dashboard/vendors/driver-incentive/add?code=${encodeURIComponent(code)}&partnerType=${encodeURIComponent(partnerType)}&zone=${encodeURIComponent(zone)}`
            )
          }
        >
          Add
        </Button>
      </div>
      <DriverIncentiveFilters
        partnerType={partnerType}
        status={status}
        zone={zone}
        zoneOptions={zoneOptions}
        onPartnerTypeChange={setPartnerType}
        onStatusChange={setStatus}
        onZoneChange={setZone}
      />
      <DriverIncentiveTabs value={code} onChange={setCode} />
      <DriverIncentiveTable
        rows={rows}
        loading={loading}
        error={error}
        onEdit={(row) =>
          navigate(`/dashboard/vendors/driver-incentive/edit/${row?.raw?.settingId || row.settingId}?code=${code}`, {
            state: { row: row?.raw || row },
          })
        }
      />
    </div>
  );
}

export default DriverIncentiveList;
