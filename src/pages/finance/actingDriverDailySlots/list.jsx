import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { EMPTY_FILTERS } from "./constants";
import Filters from "./components/Filters";
import { buildDailySlotQuery, formatDate, formatDisplayTime, getDayChip, getSlotStateChip, normalizeText } from "./utils";

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: EMPTY_FILTERS.limit,
};

const ActingDriverDailySlotsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  useEffect(() => {
    const loadGeo = async () => {
      try {
        const areaResp = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });

        const allAreas = Array.isArray(areaResp?.data) ? areaResp.data : [];

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
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ADMIN_ACTING_DRIVER_DAILY_SLOTS, query);
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
      console.error("Failed to load acting driver daily slots:", error);
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
        onChange={updateFilters}
        onReset={resetFilters}
        onFind={handleFind}
      />

      <Card>
        <CardHeader variant="gradient" className={`flex items-center justify-between gap-3 p-5 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Acting Driver Daily Slot History
          </Typography>
          <Button
            size="sm"
            className="rounded-lg bg-white px-4 py-2 text-blue-700 shadow-sm hover:bg-blue-gray-50"
            onClick={() => navigate("/dashboard/finance/acting-driver-daily-slots/add")}
          >
            Add New
          </Button>
        </CardHeader>
        <CardBody className="pt-0 px-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] table-auto">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Slot Date</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Zone</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Day</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Time</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Capacity</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Booked Drivers</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Remaining</th>
                    <th className="px-5 py-3 text-left whitespace-nowrap">State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const stateChip = getSlotStateChip(row);
                      return (
                        <tr key={row.id} className="border-b">
                          <td className="px-5 py-3 whitespace-nowrap">{formatDate(row.date)}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.zone || "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {row.id ? (
                              <Link
                                to={`/dashboard/finance/acting-driver-daily-slots/details/${row.id}`}
                                state={{ slot: row }}
                                className="cursor-pointer font-semibold text-blue-600 underline"
                              >
                                {row.dayOfWeek ? <Chip value={getDayChip(row.dayOfWeek).label} className={getDayChip(row.dayOfWeek).className} /> : "-"}
                              </Link>
                            ) : (
                              row.dayOfWeek ? <Chip value={getDayChip(row.dayOfWeek).label} className={getDayChip(row.dayOfWeek).className} /> : "-"
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">{formatDisplayTime(row)}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.capacity ?? "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.bookedDrivers ?? "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{row.remainingCapacity ?? "-"}</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <Chip value={stateChip.label} className={stateChip.className} />
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

export default ActingDriverDailySlotsList;
