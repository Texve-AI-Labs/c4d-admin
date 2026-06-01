import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Input, Spinner, Typography } from "@material-tailwind/react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const INITIAL_FILTERS = {
  fromDate: "",
  toDate: "",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD-MM-YYYY hh:mm A");
};

function SkipLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });

  const buildQuery = (page = 1, activeFilters = filters) => {
    const pages = {
      page,
      limit: pagination.itemsPerPage,
    };

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (String(value || "").trim()) {
        pages[key] = String(value).trim();
      }
    });

    return pages;
  };

  const fetchSkipLogs = async (page = 1, activeFilters = filters) => {
    setLoading(true);
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_SKIP_EVENTS, buildQuery(page, activeFilters));
      if (response?.success) {
        const records = Array.isArray(response?.data) ? response.data : [];
        setRows(records);
        setPagination((prev) => ({
          ...prev,
          currentPage: response?.pagination?.currentPage || page,
          totalPages: response?.pagination?.totalPages || 1,
          totalItems: response?.pagination?.totalItems || 0,
          itemsPerPage: response?.pagination?.itemsPerPage || prev.itemsPerPage,
        }));
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to fetch skip logs:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkipLogs(1);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchSkipLogs(1);
  };

  const handleClear = () => {
    const clearedFilters = { ...INITIAL_FILTERS };
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRows([]);
    fetchSkipLogs(1, clearedFilters);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || loading) return;
    fetchSkipLogs(nextPage);
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
          disabled={loading}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <div className="mb-8 flex flex-col gap-6">
      <Card>
        <CardBody>
          <Typography variant="h5" className="mb-1">
            Skip Logs
          </Typography>          

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="w-full md:w-52">
              <Input type="date" label="From Date" value={filters.fromDate} onChange={(e) => handleFilterChange("fromDate", e.target.value)} />
            </div>
            <div className="w-full md:w-52">
              <Input type="date" label="To Date" value={filters.toDate} onChange={(e) => handleFilterChange("toDate", e.target.value)} />
            </div>
            <Button onClick={handleSearch} disabled={loading} className={ColorStyles.bgColor}>
              {loading ? "Loading..." : "Search"}
            </Button>
            <Button variant="outlined" onClick={handleClear} disabled={loading}>
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <table className="w-full min-w-[1200px] table-auto">
              <thead>
                <tr className={`border-b text-left ${ColorStyles.bgColor}`}>
                  <th className="px-4 py-3 text-sm font-semibold text-white">Watch Date & Time</th>
                  <th className="px-4 py-3 text-sm font-semibold text-white">User Type</th>
                  {/* <th className="px-4 py-3 text-sm font-semibold">User ID</th> */}
                  <th className="px-4 py-3 text-sm font-semibold text-white">Platform</th>
                  <th className="px-4 py-3 text-sm font-semibold text-white">App Version</th>
                  <th className="px-4 py-3 text-sm font-semibold text-white">Screen</th>
                  <th className="px-4 py-3 text-sm font-semibold text-white">Component Type</th>
                  <th className="px-4 py-3 text-sm font-semibold text-white">Component Key</th>
                  {/* <th className="px-4 py-3 text-sm font-semibold text-white">Skip Action</th> */}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((item, index) => (
                    <tr className="border-b" key={item?.id || item?._id || `${item?.userId || "row"}-${index}`}>
                      <td className="px-4 py-3 text-sm">{formatDateTime(item?.created_at)}</td>
                      <td className="px-4 py-3 text-sm">{item?.userType || "-"}</td>
                      {/* <td className="px-4 py-3 text-sm">{item?.userId || "-"}</td> */}
                      <td className="px-4 py-3 text-sm">{item?.platform || "-"}</td>
                      <td className="px-4 py-3 text-sm">{item?.appVersion || "-"}</td>
                      <td className="px-4 py-3 text-sm">{item?.screen || "-"}</td>
                      <td className="px-4 py-3 text-sm">{item?.componentType || "-"}</td>
                      <td className="px-4 py-3 text-sm">{item?.componentKey || "-"}</td>
                      {/* <td className="px-4 py-3 text-sm">{item?.skipAction || "-"}</td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                      No skip logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {rows.length > 0 && (
      <div className="mt-2 flex flex-col items-center gap-2">        
        <div className="flex flex-wrap items-center justify-center">
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === 1 || loading}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className="mx-1"
            >
              {"<"}
            </Button>
            {generatePageButtons()}
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === pagination.totalPages || loading}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className="mx-1"
            >
              {">"}
            </Button>
          </div>
      </div>
      )}
    </div>
  );
}

export default SkipLogs;