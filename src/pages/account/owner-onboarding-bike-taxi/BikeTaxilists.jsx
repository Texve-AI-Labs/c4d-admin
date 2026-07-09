import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function BikeTaxiLists({ id = 0 }) {
  const navigate = useNavigate();
  const [bikeList, setBikeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const prevSearchRef = useRef("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
    search: "",
  });

  const fetchBikeList = async (page = 1, search = "", showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_BIKE_LIST, {
        id,
        page,
        limit: pagination.itemsPerPage,
        search: search.trim(),
      });

      if (data?.success) {
        setBikeList(data.data || []);
        setPagination({
          currentPage: page,
          totalPages: data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
          search: search.trim(),
        });
      } else {
        console.error("API request failed:", data?.message);
      }
    } catch (error) {
      console.error("Error fetching bike taxi list:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      setPagination((prev) => ({
        ...prev,
        currentPage: 1,
        search: value,
      }));
    }, 700),
    []
  );

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== (pagination.search || "");
    prevSearchRef.current = pagination.search || "";
    fetchBikeList(pagination.currentPage, pagination.search, !searchChanged);
  }, [id, pagination.currentPage, pagination.itemsPerPage, pagination.search]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const generatePageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
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

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            className="w-full rounded-2xl border border-gray-300 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search bike taxi"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        ) : (
          <>
            <CardHeader
              variant="gradient"
              className={`mb-8 p-6 flex justify-between items-center rounded-xl ${ColorStyles.bgColor}`}
            >
              <Typography variant="h6" color="white">
                Bike Taxi List
              </Typography>
              <div className="flex items-center gap-3">
                <Typography variant="h6" color="white">
                  {pagination.totalItems} Bike{pagination.totalItems !== 1 ? "s" : ""} found
                </Typography>
               
              </div>
            </CardHeader>
            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {["Name", "Company", "Vehicle Number", "Registration Date", "Available Status"].map((el) => (
                      <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          {el}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bikeList.length > 0 ? (
                    bikeList.map(({ id, name, company, bikeNumber, created_at, status, subscriptionStatus }, index) => {
                      const className = `py-3 px-5 ${index === bikeList.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                      return (
                        <tr key={id}>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {name || "-"}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {company || "-"}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {bikeNumber || "-"}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {created_at ? moment(created_at).format("DD-MM-YYYY") : "-"}
                            </Typography>
                          </td>
                          <td className={className}>
                            <div className="flex flex-col gap-1">
                              <Chip
                                variant="ghost"
                                color={status === "ACTIVE" ? "green" : "blue-gray"}
                                value={status === "ACTIVE" ? "Active" : "In_Active"}
                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 px-5 text-center">
                        <Typography variant="h6" color="gray">
                          No bike taxi records found
                        </Typography>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {bikeList.length > 0 && (
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
              )}
            </CardBody>
          </>
        )}
      </Card>
    </div>
  );
}

export default BikeTaxiLists;
