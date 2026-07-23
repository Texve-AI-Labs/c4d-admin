import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { EMPTY_FILTERS } from "./constants";
import Filters from "./components/Filters";
import { buildDailySlotQuery, formatDate, formatDateTime, formatTime, getSlotStateChip, normalizeText } from "./utils";

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: EMPTY_FILTERS.limit,
};

const ParcelDailySlotsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  useEffect(() => {
    const loadGeo = async () => {
      try {
        const [areaResp, zoneResp] = await Promise.all([
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" }),
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Zone" }),
        ]);

        const allAreas = Array.isArray(areaResp?.data) ? areaResp.data : [];
        const allZones = Array.isArray(zoneResp?.data) ? zoneResp.data : [];

        setServiceAreas(
          allAreas
            .filter((item) => item.type === "Service Area")
            .map((item) => ({
              id: String(item.id ?? item._id ?? ""),
              label: item.name || item.label || "Unnamed Zone",
              value: item.name || item.label || "",
            }))
            .filter((item) => normalizeText(item.value))
        );

        setZones(
          allZones
            .filter((item) => item.type === "Zone" && item.description === "Zone")
            .map((item) => ({
              type: item.type || "",
              description: item.description || "",
              label: item.name || item.label || "Unnamed Sub Zone",
              value: String(item.id ?? item._id ?? item.name ?? item.label ?? ""),
              parentId: String(item.parent_id ?? item.parentId ?? item.parent?.id ?? item.serviceArea?.id ?? ""),
            }))
            .filter((item) => normalizeText(item.value))
        );
      } catch (error) {
        console.error("Failed to load geo options:", error);
      }
    };

    loadGeo();
  }, []);

  const query = useMemo(
    () =>
      buildDailySlotQuery({
        ...appliedFilters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      }),
    [appliedFilters, pagination.currentPage, pagination.itemsPerPage]
  );

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ADMIN_PARCEL_DALIY_SLOTS, query);
      const responseData = response?.data || {};
      const list =
        (Array.isArray(responseData) && responseData) ||
        (Array.isArray(responseData?.rows) && responseData.rows) ||
        [];
      const totalItems = Number(responseData?.count ?? responseData?.pagination?.totalItems ?? 0) || 0;
      const itemsPerPage = responseData?.pagination?.itemsPerPage || pagination.itemsPerPage;

      setRows(list);
      setPagination((prev) => ({
        ...prev,
        totalItems,
        itemsPerPage,
        totalPages: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
      }));
    } catch (error) {
      console.error("Failed to load parcel daily slots:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage, query]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const updateFilters = (next) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleFind = () => {
    if ((filters.fromDate && !filters.toDate) || (!filters.fromDate && filters.toDate)) {
      return;
    }

    setAppliedFilters(filters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  return (
    <div className=" bg-white rounded-xl flex flex-col gap-6">
      <Filters
        filters={filters}
        zones={serviceAreas}
        subZones={zones}
        onChange={updateFilters}
        onReset={resetFilters}
        onFind={handleFind}
      />

      <Card>
        <CardHeader variant="gradient" className={`p-5 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Daily Slot History
          </Typography>
        </CardHeader>
        <CardBody className="pt-0 px-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] table-auto">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Slot Date</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Zone</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Sub Zone</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Day</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Start Time</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">End Time</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Max Bookings</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Booked Count</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">State</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Source Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const stateChip = getSlotStateChip(row);
                      return (
                        <tr key={row.id} className="border-b">
                          <td className="px-5 py-3 whitespace-nowrap">{formatDate(row.slotDate)}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.zone || "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {row.id ? (
                              <Link
                                to={`/dashboard/finance/parcel-daily-slots/details/${row.id}`}
                                state={{ slot: row }}
                                className="cursor-pointer font-semibold text-blue-600 underline"
                              >
                                {row.subZone?.name || row.subZone?.label || row.subZoneId || "-"}
                              </Link>
                            ) : (
                              row.subZone?.name || row.subZone?.label || row.subZoneId || "-"
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.dayOfWeek || "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{formatTime(row.startTime)}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{formatTime(row.endTime)}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.maxBookings ?? "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.bookingCount ?? row.bookedCount ?? "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <Chip value={stateChip.label} className={stateChip.className} />
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {row.sourceRuleType || "-"}{row.sourceRuleId ? ` #${row.sourceRuleId}` : ""}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button size="sm" variant="text" disabled={pagination.currentPage === 1} onClick={() => handlePageChange(pagination.currentPage - 1)}>
              {"<"}
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
              .slice(Math.max(0, pagination.currentPage - 3), Math.min(pagination.totalPages, pagination.currentPage + 2))
              .map((page) => (
                <Button
                  key={page}
                  size="sm"
                  variant={page === pagination.currentPage ? "filled" : "outlined"}
                  className={`mx-1 ${ColorStyles.bgColor} text-white`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            <Button size="sm" variant="text" disabled={pagination.currentPage === pagination.totalPages} onClick={() => handlePageChange(pagination.currentPage + 1)}>
              {">"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ParcelDailySlotsList;
