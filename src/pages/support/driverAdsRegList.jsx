import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, IconButton, Option, Select, Spinner, Typography } from "@material-tailwind/react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD-MM-YYYY hh:mm A");
};

const formatStatusLabel = (value) => {
  if (!value) return "-";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusBadgeClass = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "NEW") return "bg-blue-gray-100 text-blue-gray-800";
  if (normalized === "IN_PROGRESS") return "bg-blue-100 text-blue-800";
  if (normalized === "FOLLOW_UP_SCHEDULED") return "bg-orange-100 text-orange-800";
  if (normalized === "COMPLETED") return "bg-green-100 text-green-800";
  return "bg-blue-gray-100 text-blue-gray-700";
};

const STATUS_FILTERS = ["ALL", "NEW", "IN_PROGRESS", "FOLLOW_UP_SCHEDULED", "COMPLETED"];

const resolveValue = (row, keys) => {
  const source = row;
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "-";
};

function DriverAdsRegList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const fetchGeoMarkings = async () => {
    try {
      const [serviceAreaRes, zoneRes] = await Promise.all([
        ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" }),
        ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Zone" }),
      ]);
      if (serviceAreaRes?.success) setServiceAreas(serviceAreaRes.data || []);
      if (zoneRes?.success) setZones(zoneRes.data || []);
    } catch (error) {
      console.error("Error fetching geo markings for driver ad registrations:", error);
    }
  };

  const fetchDriverAdsRegList = async (page = 1, showLoader = false) => {
    if (showLoader) setLoading(true);
    setAlert("");
    try {
      const params = { page, limit: pagination.itemsPerPage };
      if (statusFilter !== "ALL") params.status = statusFilter;
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_DRIVER_ADS_LIST, params);
      if (response?.success) {
        setRows(normalizeRows(response?.data));
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalPages: response?.pagination?.totalPages || 1,
          totalItems: response?.pagination?.totalItems || 0,
          itemsPerPage: response?.pagination?.itemsPerPage || prev.itemsPerPage,
        }));
      } else {
        setRows([]);
        setAlert(response?.message || "Failed to load driver ad registrations.");
      }
    } catch (error) {
      console.error("Error fetching driver ad registrations:", error);
      setRows([]);
      setAlert("Failed to load driver ad registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverAdsRegList(pagination.currentPage, true);
  }, [pagination.currentPage, pagination.itemsPerPage, refreshKey, statusFilter]);

  useEffect(() => {
    fetchGeoMarkings();
  }, [refreshKey]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const handleRefresh = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((prev) => prev + 1);
  };

  const generatePageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i += 1) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  const resolveGeoName = (value, collection) =>
    collection.find((item) => String(item?.id) === String(value))?.name || value || "-";

  return (
    <div className="mb-8 mt-8 flex flex-col gap-12 bg-white">
      <Card className="border border-blue-gray-100">
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="black">
              Driver Ads Reg List
            </Typography>
            <div className="flex items-center gap-2">
              <IconButton variant="text" onClick={handleRefresh} className="shrink-0 text-black">
                <ArrowPathIcon className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
        </CardBody>

        {alert ? (
          <div className="mb-2">
            <Alert color="blue" className="rounded-xl px-6 py-3">
              {alert}
            </Alert>
          </div>
        ) : null}

        <CardBody className="pt-0">
          <div className="flex w-full max-w-xs items-center gap-3 rounded-xl">
            <Typography variant="small" className="whitespace-nowrap font-medium text-blue-gray-700">
              Status
            </Typography>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
                setStatusFilter(value || "ALL");
              }}
              className="w-full"
            >
              {STATUS_FILTERS.map((status) => (
                <Option key={status} value={status}>
                  {formatStatusLabel(status)}
                </Option>
              ))}
            </Select>
          </div>
        </CardBody>

        <CardBody className="overflow-x-auto px-0 pt-0 pb-2 pl-2 pr-2">
          <div className="min-w-[1100px]">
          <table className="w-full table-auto">
            <thead className="bg-primary">
              <tr>
                {["Name", "Zone", "Sub Zone", "Ads Status", "Registration Status", "Driver Name", "Phone Number", "Created At", "View"].map((heading) => (
                  <th
                    key={heading}
                    className={`border-b border-blue-gray-50 py-3 px-5 text-left ${
                      heading === "Registration Status" || heading === "Created At" ? "whitespace-nowrap" : ""
                    }`}
                  >
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                      {heading}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8">
                    <div className="flex items-center justify-center">
                      <Spinner className="h-12 w-12" />
                    </div>
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((row, index) => {
                  const key = row?.id || row?._id || `${index}`;
                  const className = `py-3 px-5 ${index === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                  const advertisement = row?.advertisement || row;
                  return (
                    <tr key={key} className="border-b border-blue-gray-50">
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">{row?.advertisement?.name || "-"}</Typography>
                      </td>
                     
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {resolveGeoName(advertisement?.zone, serviceAreas)}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {resolveGeoName(advertisement?.subZoneId, zones)}
                        </Typography>
                      </td>
                      <td className={className}>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            advertisement?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {advertisement?.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={`${className} whitespace-nowrap`}>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row?.status)}`}
                        >
                          {formatStatusLabel(row?.status)}
                        </span>
                      </td>
                       <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {row?.driver?.firstName || row?.driver?.name || row?.driverName || "-"}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {row?.driver?.phoneNumber || '-'}
                        </Typography>
                      </td>
                      <td className={`${className} whitespace-nowrap`}>
                        <Typography className="text-xs font-semibold text-black">
                          {formatDateTime(resolveValue(row, ["createdAt", "created_at"]))}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Link to={`/dashboard/support/driver-ads-reg/details/${row?.id || row?._id}`}>
                          <Typography className="cursor-pointer text-xs font-semibold text-blue-600 underline">
                            Open
                          </Typography>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center">
                    <Typography className="text-sm font-medium text-blue-gray-600">
                      No driver ad registrations found.
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className="mx-1"
            >
              {"<"}
            </Button>
            {generatePageButtons()}
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className="mx-1"
            >
              {">"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverAdsRegList;
