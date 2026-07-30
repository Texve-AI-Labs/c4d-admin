import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, IconButton, Input, Option, Select, Spinner, Typography } from "@material-tailwind/react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import DriverAdsZone from "@/components/driverAdsZone";

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

const resolveValue = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "-";
};

function DriverAdsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [toLaunchAt, setToLaunchAt] = useState("");
  const [selectedServiceArea, setSelectedServiceArea] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
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
      console.error("Error fetching geo markings for driver ads list:", error);
    }
  };

  const fetchDriverAds = async (page = 1, showLoader = false) => {
    if (showLoader) setLoading(true);
    setAlert("");
    try {
      const params = {
        page,
        limit: pagination.itemsPerPage,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedServiceArea) params.zone = selectedServiceArea;
      if (selectedZone) params.subZoneId = selectedZone;
      if (isActive !== "") params.isActive = isActive;
      // if (fromLaunchAt) params.fromLaunchAt = fromLaunchAt;
      if (toLaunchAt) params.toLaunchAt = toLaunchAt;

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_DRIVER_ADVERISEMENT, params);

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
        setAlert(response?.message || "Failed to load driver advertisements.");
      }
    } catch (error) {
      console.error("Error fetching driver advertisements:", error);
      setRows([]);
      setAlert("Failed to load driver advertisements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverAds(pagination.currentPage, true);
  }, [pagination.currentPage, pagination.itemsPerPage, search, isActive, 
    // fromLaunchAt, 
    toLaunchAt, selectedServiceArea, selectedZone, refreshKey]);

  useEffect(() => {
    fetchGeoMarkings();
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setIsActive("");
    // setFromLaunchAt("");
    setToLaunchAt("");
    setSelectedServiceArea("");
    setSelectedZone("");
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

  const getStatusBadgeClass = (value) =>
    value
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

  const resolveImage = (row) => row?.image || row?.imageUrl || row?.banner || "";

  return (
    <div className="mb-8 mt-8 flex flex-col gap-12">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="black">
              Driver Ads List
            </Typography>
            <div className="flex items-center gap-2">
              <IconButton variant="text" onClick={handleRefresh} className="shrink-0 text-black">
                <ArrowPathIcon className="h-5 w-5" />
              </IconButton>
              <Button className="bg-primary text-white" onClick={() => navigate("/dashboard/support/driver-ads/create")}>
                Add New
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <DriverAdsZone
              label="Zone"
              value={selectedServiceArea}
              refreshKey={refreshKey}
              onChange={(value) => {
                setSelectedServiceArea(value);
                setSelectedZone("");
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
            />
            <DriverAdsZone
              label="Sub Zone"
              value={selectedZone}
              refreshKey={refreshKey}
              isSubZone
              parentValue={selectedServiceArea}
              onChange={(value) => {
                setSelectedZone(value);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
            />
            <div>
              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                Is Active
              </Typography>
              <Select
                value={isActive}
                onChange={(value) => {
                  setIsActive(value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
              >
                <Option value="">All</Option>
                <Option value="true">Active</Option>
                <Option value="false">Inactive</Option>
              </Select>
            </div>
            <div>
              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                To Launch At
              </Typography>
              <Input
                type="date"
                value={toLaunchAt}
                onChange={(e) => {
                  setToLaunchAt(e.target.value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
              />
            </div>


          </div>
        </CardBody>

        {alert ? (
          <div className="mb-2">
            <Alert color="blue" className="py-3 px-6 rounded-xl">
              {alert}
            </Alert>
          </div>
        ) : null}
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 pl-2 pr-2">
          <table className="w-full min-w-[900px] table-auto">
            <thead className="bg-primary">
              <tr>
                {[
                  "Image",
                  "Name",
                  "Zone",
                  "Sub Zone",
                  "Is Active",
                  "Created At",
                  "Launch At",
                ].map((heading) => (
                  <th key={heading} className="border-b border-blue-gray-50 py-3 px-5 text-left">
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
                  <td colSpan={5} className="py-8 px-5">
                    <div className="flex justify-center items-center">
                      <Spinner className="h-12 w-12" />
                    </div>
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((row, index) => {
                  const key = row?.id || row?._id || `${index}`;
                  const className = `py-3 px-5 ${index === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                  const zoneName = resolveGeoName(row?.zone, serviceAreas);
                  const subZoneName = resolveGeoName(row?.subZoneId, zones);
                  return (
                    <tr key={key} className="border-b border-blue-gray-50">
                      <td className={className}>
                        {resolveImage(row) ? (
                          <img
                            src={resolveImage(row)}
                            alt={row?.name || "driver advertisement"}
                            className="h-12 w-20 rounded-md border object-cover"
                          />
                        ) : (
                          <Typography className="text-xs font-semibold text-blue-gray-500">
                            No image
                          </Typography>
                        )}
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {resolveValue(row, ["name"])}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {zoneName}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Link to={`/dashboard/support/driver-ads/details/${row?.id || row?._id}`}>
                          <Typography className="text-xs font-semibold text-blue-600 underline cursor-pointer">
                            {subZoneName}
                          </Typography>
                        </Link>
                      </td>
                      <td className={className}>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            row?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {row?.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {formatDateTime(resolveValue(row, ["createdAt", "created_at"]))}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-black">
                          {moment(resolveValue(row, ["launchAt"])).isValid()
                            ? moment(resolveValue(row, ["launchAt"])).format("DD-MM-YYYY")
                            : resolveValue(row, ["launchAt"])}
                        </Typography>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 px-5 text-center">
                    <Typography className="text-sm font-medium text-blue-gray-600">
                      No driver advertisements found.
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-center mt-4">
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

export default DriverAdsList;