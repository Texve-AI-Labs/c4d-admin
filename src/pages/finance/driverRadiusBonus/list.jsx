import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const SERVICE_TYPE_LABELS = {
  ALL: "All",
  RIDES: "Rides",
  RENTAL: "Rental",
  AUTO: "Auto",
  BIKE: "Bike",
  // PARCEL: "Parcel",
  // DRIVER: "Driver",
};

const BONUS_TYPE_LABELS = {
  FLAT: "Flat",
  RATE: "Rate",
};

const SERVICE_TYPE_COLORS = {
  // DRIVER: "bg-blue-100 text-blue-700 border-blue-200",
  RIDES: "bg-emerald-100 text-emerald-700 border-emerald-200",
  RENTAL: "bg-amber-100 text-amber-700 border-amber-200",
  AUTO: "bg-purple-100 text-purple-700 border-purple-200",
  BIKE: "bg-pink-100 text-pink-700 border-pink-200",
  // PARCEL: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number.isNaN(Number(value)) ? String(value) : String(Number(value));
};

const formatCreatedAt = (value) => {
  if (!value) return "-";
  const raw = String(value);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return raw.replace("T", " ").replace(/:\d{3}Z$/, "");
};

const getNotes = (row = {}) => row?.metadata?.notes || row?.notes || "";
const getRowId = (row = {}) => row?.id || row?.configId || row?._id || "";

export default function DriverRadiusBonusList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [zoneOptions, setZoneOptions] = useState([]);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
        const list = Array.isArray(response?.data) ? response.data : [];
        setZoneOptions(
          list
            .map((item) => ({
              label: item?.name || item?.label || "Unnamed Zone",
              value: item?.name || item?.label || "",
            }))
            .filter((item) => item.value)
        );
      } catch (error) {
        console.error("Failed to load zone options:", error);
        setZoneOptions([]);
      }
    };

    loadZones();
  }, []);

  const fetchList = async () => {
    try {
      setLoading(true);
      const params = {};
      if (zoneFilter !== "ALL") params.zone = zoneFilter;
      if (serviceFilter !== "ALL") params.serviceType = serviceFilter;
      if (statusFilter !== "ALL") params.isActive = statusFilter === "ACTIVE";

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_DISPATCH_ZONE_CONFIGS, params);
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
      setRows(list);
    } catch (error) {
      console.error("Failed to fetch driver radius configs:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [zoneFilter, serviceFilter, statusFilter]);

  const filteredRows = useMemo(() => rows, [rows]);

  const handleRowClick = (row) => {
    const id = getRowId(row);
    if (!id) return;
    navigate(`/dashboard/finance/driver-radius-bonus/details/${id}`);
  };

  return (
    <div className="mb-8 flex flex-col gap-6 mt-8 bg-white pb-2 rounded-xl">
      <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Zone</label>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="ALL">All</option>
            {zoneOptions.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Service Type</label>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="ALL">All</option>
            {["RIDES", "RENTAL", "AUTO", "BIKE"].map((value) => (
              <option key={value} value={value}>
                {SERVICE_TYPE_LABELS[value]}
              </option>
            ))}
              </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader variant="gradient" className={`mb-8 mt-2 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              Driver Radius & Bonus Configuration
            </Typography>
          {/* </div> */}
        {/* <div className="flex justify-end mb-2 mt-2"> */}
        <Button
          size="sm"
          className='bg-white text-black'
          onClick={() => navigate("/dashboard/finance/driver-radius-bonus/add")}
        >
          Add New
        </Button>
      </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <table className="w-full min-w-[1400px] table-auto">
              <thead>
                <tr>
                {["Zone", "Service Type", "First Radius", "Max Radius", "Increment", "Threshold", "Bonus Type", "Bonus Amount", "Bonus Rate", "Status", "Created At", "Actions","Notes"].map((el) => (
                    <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left whitespace-nowrap">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                        {el}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, index) => {
                    const id = getRowId(row);
                    const notes = getNotes(row);
                    return (
                      <tr key={id || index} className="border-b">
                        <td className="py-3 px-5 whitespace-nowrap">{row?.zone || "-"}</td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          <Chip
                            variant="ghost"
                            color="blue-gray"
                            value={SERVICE_TYPE_LABELS[row?.serviceType] || row?.serviceType || "-"}
                            className={`w-fit border ${SERVICE_TYPE_COLORS[row?.serviceType] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                          />
                        </td>
                        <td className="py-3 px-5 whitespace-nowrap">{formatNumber(row?.firstSearchRadiusKm)}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{formatNumber(row?.maxSearchRadiusKm)}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{formatNumber(row?.radiusIncrementKm)}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{formatNumber(row?.bonusThresholdKm)}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{BONUS_TYPE_LABELS[row?.bonusType] || row?.bonusType || "-"}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{formatNumber(row?.bonusAmount)}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{formatNumber(row?.bonusRate)}</td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          <Chip
                            variant="ghost"
                            color={row?.isActive ? "green" : "blue-gray"}
                            value={row?.isActive ? "Active" : "Inactive"}
                            className="w-fit"
                          />
                        </td>
                        <td className="py-3 px-5 whitespace-nowrap">{formatCreatedAt(row?.createdAt || row?.created_at)}</td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outlined" onClick={() => handleRowClick(row)} disabled={!id}>
                              Details
                            </Button>
                            <Button
                              size="sm"
                              className={ColorStyles.continueButtonColor}
                              onClick={() => navigate(`/dashboard/finance/driver-radius-bonus/edit/${id}`, { state: { item: row } })}
                              disabled={!id}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                                                <td className="py-3 px-5 whitespace-nowrap">
                            {notes || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={13} className="py-10 px-5 text-center text-gray-600 whitespace-nowrap">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}