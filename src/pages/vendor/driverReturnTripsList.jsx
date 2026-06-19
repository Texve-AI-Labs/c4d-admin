import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Spinner,
  Chip,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link } from 'react-router-dom';
import moment from "moment";
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const DRIVER_RETURN_TRIP_VIEW_FILTERS_KEY = 'driverReturnTripViewFilters';
const getDriverReturnTripViewFiltersKey = (tab) => `${DRIVER_RETURN_TRIP_VIEW_FILTERS_KEY}_${String(tab || '').toUpperCase()}`;

const isBrowser = () => typeof window !== 'undefined';

const getItemSafe = (key) => {
  if (!isBrowser()) return null;
  try {
    return sessionStorage.getItem(key);
  } catch (err) {
    console.error(`Error reading sessionStorage key "${key}":`, err);
    return null;
  }
};

const setItemSafe = (key, value) => {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(key, value);
  } catch (err) {
    console.error(`Error writing sessionStorage key "${key}":`, err);
  }
};

const getStatusChipStyles = (status = "") => {
  const normalizedStatus = String(status).toUpperCase();

  switch (normalizedStatus) {
    case "ACTIVE":
      return { color: "green", className: "bg-green-100 text-green-700" };
    case "BOOKED":
      return { color: "blue", className: "bg-blue-100 text-blue-700" };
    case "EXPIRED":
      return { color: "red", className: "bg-red-100 text-red-700" };
    default:
      return {
        color: "blue-gray",
        className: "bg-blue-gray-100 text-blue-gray-700",
      };
  }
};

const getDurationChipStyles = () => ({
  color: "amber",
  className: "bg-amber-100 text-amber-800",
});

const getDiscountChipStyles = () => ({
  color: "purple",
  className: "bg-purple-100 text-purple-800",
});

const formatDuration = (minutesValue) => {
  const totalMinutes = Number(minutesValue);

  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "N/A";

  const roundedMinutes = Math.round(totalMinutes);
  if (roundedMinutes < 60) {
    return `${roundedMinutes} min${roundedMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const mins = roundedMinutes % 60;
  if (mins === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }

  return `${hours} hr${hours === 1 ? "" : "s"} ${mins} min${mins === 1 ? "" : "s"}`;
};

export function DriverReturnTripsList() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Active");

  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

  const [pagination, setPagination] = useState(() => {
    const defaultPagination = {
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 15,
    };
    const stored = getItemSafe(getDriverReturnTripViewFiltersKey("Active"));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...defaultPagination,
          currentPage: parsed.currentPage || 1,
        };
      } catch {
        return defaultPagination;
      }
    }
    return defaultPagination;
  });

  useEffect(() => {
    const data = {
      currentPage: pagination.currentPage,
    };

    setItemSafe(getDriverReturnTripViewFiltersKey(activeTab), JSON.stringify(data));
  }, [pagination.currentPage, activeTab]);

  const fetchDrivers = async (page = 1, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const queryParams = {
        page,
        limit: pagination.itemsPerPage,
      };
      if (activeTab === "Active") {
        queryParams.status = "ACTIVE";
      }
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_RETURN_TRIP_DETAILS,queryParams);
      if (data?.success) {
        setAccounts(data?.data);
        const totalPages = data?.pagination?.totalPages || 1;
        const normalizedPage = Math.min(page, totalPages);
        setPagination({
          currentPage: normalizedPage,
          totalPages,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
        });
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDrivers(pagination.currentPage, true);
  }, [pagination.currentPage, activeTab]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    const stored = getItemSafe(getDriverReturnTripViewFiltersKey(activeTab));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Number.isFinite(parsed?.currentPage) && parsed.currentPage > 0) {
          setPagination((prev) => ({ ...prev, currentPage: parsed.currentPage }));
        }
      } catch {
        // Ignore malformed storage and fall back to page 1.
      }
    }
  }, [activeTab]);
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
          variant={i === pagination.currentPage ? 'filled' : 'outlined'}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };
  function formatPhoneNumber(phoneNumber) {
    if (phoneNumber) {
      if (phoneNumber.startsWith("+91")) {
        return phoneNumber;
      }
      return `+91${phoneNumber}`;
    }
  }

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedAccounts = [...accounts].sort((a, b) => {
      if (key === 'created_at') {
        return direction === 'ascending'
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      } else {
        const aValue = a[key]?.toLowerCase() || '';
        const bValue = b[key]?.toLowerCase() || '';
        if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
        return 0;
      }
    });
    setAccounts(sortedAccounts);
  };

  const formatDiscount = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "0";
    return Number.isInteger(num) ? String(num) : String(num);
  };
  return (
    <div className="mb-8 py-4 flex flex-col gap-12 mt-12">
      <Card>
        <CardHeader variant="gradient" className={`mb-8 p-6 flex-1 justify-between items-center rounded-xl
          ${ColorStyles.bgColor}`}>
          <div className='flex items-center justify-between w-full'>
            <Typography variant="h6" color="white">
              Return Trip Driver Details
            </Typography>
          </div>
        </CardHeader>
        <div className="px-6 pb-4">
          <div className="inline-flex rounded-lg bg-blue-gray-50 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("Active");
              }}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "Active"
                  ? "bg-white text-blue-gray-900 shadow"
                  : "text-blue-gray-600"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("In-Active");
              }}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "In-Active"
                  ? "bg-white text-blue-gray-900 shadow"
                  : "text-blue-gray-600"
              }`}
            >
              In-Active
            </button>
          </div>
        </div>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[980px] table-auto">
            <thead>
              <tr>
                {["Created Date","Duration","status", "Zone", "Driver Name", "Phone Number","Pickup Location", "Destination Location","Car Type","Total","Discount"].map((el) => (
                  <th
                    key={el}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left whitespace-nowrap"
                  >
                    {el === "Created Date" ? (
                      <div onClick={() => handleSort("created_at")} className="cursor-pointer flex items-center whitespace-nowrap">    
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-black whitespace-nowrap"
                      >
                        {el}
                      </Typography>
                        {sortConfig.key === "created_at" && (
                          sortConfig.direction === "ascending" ? (
                            <ChevronUpIcon className="w-4 h-4 ml-1 text-black" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 ml-1 text-black" />
                          )
                        )}
                      </div>
                    ) : (
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-black whitespace-nowrap"
                      >
                        {el}
                      </Typography>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-3 px-5">
                    <div className="flex justify-center items-center">
                      <Spinner className="h-12 w-12" />
                    </div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-5 text-center">
                    <Typography variant="small" className="font-semibold text-blue-gray-700">
                      No Records
                    </Typography>
                  </td>
                </tr>
              ) : (
                accounts.map(
                  ({ id, zone,created_at, name, phoneNumber,Driver,firstName,address,pickupLocation,destinationLocation,fareSnapshot,carType,fareBreakdown,total,discount,status,metadata,durationMinutes }, key) => {
                    const statusStyles = getStatusChipStyles(status);
                    const durationStyles = getDurationChipStyles();
                    const discountStyles = getDiscountChipStyles();
                    const displayDuration = formatDuration(
                      metadata?.durationMinutes ?? durationMinutes
                    );
                    const className = `py-3 px-5 ${key === accounts.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                      }`;

                    return (
                      <tr key={id}>
                        <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900 whitespace-nowrap">
                           {moment(created_at).format("DD-MM-YYYY" + " hh:mm A")}
                          </Typography>
                        </td>
                         <td className={`${className} whitespace-nowrap`}>
                          <Chip
                            variant="ghost"
                            color={durationStyles.color}
                            value={displayDuration}
                            className={`py-0.5 px-2 text-[11px] font-medium w-fit ${durationStyles.className}`}
                          />
                        </td>
                           <td className={`${className} whitespace-nowrap`}>
                          <Chip
                            variant="ghost"
                            color={statusStyles.color}
                            value={status || "N/A"}
                            className={`py-0.5 px-2 text-[11px] font-medium w-fit ${statusStyles.className}`}
                          />
                        </td>
                        <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900 whitespace-nowrap">
                            {zone}
                          </Typography>
                        </td>
                        <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900 whitespace-nowrap">
                         {Driver?.firstName || name || 'N/A'}
                         </Typography>
                        </td>
                        
                      
                        <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900 whitespace-nowrap">
                            {formatPhoneNumber(Driver?.phoneNumber || phoneNumber) || 'N/A'}
                          </Typography>
                        </td>
                        <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {pickupLocation?.address || 'N/A'}
                          </Typography>
                        </td>
                          <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {destinationLocation?.address || 'N/A'}
                          </Typography>
                        </td>
                          <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900 whitespace-nowrap">
                            {fareSnapshot?.carType || 'N/A'}
                          </Typography>
                        </td>
                          <td className={`${className} whitespace-nowrap`}>
                          <Typography className="text-xs font-semibold text-blue-gray-900 whitespace-nowrap">
                            ₹ {fareSnapshot?.fareBreakdown?.total || 'N/A'}
                          </Typography>
                        </td>
                         <td className={`${className} whitespace-nowrap`}>
                          <Chip
                            variant="ghost"
                            color={discountStyles.color}
                            value={`${formatDiscount(discount)} %`}
                            className={`py-0.5 px-2 text-[11px] font-medium w-fit ${discountStyles.className}`}
                          />
                        </td>                     

                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>

          {accounts.length > 0 && (
            <div className="flex items-center justify-center mt-4">
              <Button
                size="sm"
                variant="text"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="mx-1"
              >
                {'<'}
              </Button>
              {generatePageButtons()}
              <Button
                size="sm"
                variant="text"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="mx-1"
              >
                {'>'}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverReturnTripsList;
