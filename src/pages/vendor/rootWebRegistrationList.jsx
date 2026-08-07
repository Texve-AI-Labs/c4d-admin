import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Checkbox,
  Chip,
  Input,
  Popover,
  PopoverContent,
  PopoverHandler,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import moment from "moment";

const SERVICE_TYPE_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Individual", label: "Individual" },
  { value: "Auto", label: "Auto" },
  { value: "Bike", label: "Bike" },
  { value: "Parcel", label: "Parcel" },
  { value: "Acting driver", label: "Acting driver" },
];

const pageSize = 20;

export default function RootWebRegistrationList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: pageSize,
  });
  const [serviceTypeFilter, setServiceTypeFilter] = useState(["All"]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleClearFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setServiceTypeFilter(["All"]);
    setFromDate("");
    setToDate("");
    setName("");
    setPhoneNumber("");
  };

  const fetchRows = async (page = 1, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.itemsPerPage,
      };

      const serviceTypes = serviceTypeFilter.includes("All") ? [] : serviceTypeFilter;
      if (serviceTypes.length === 1) params.serviceType = serviceTypes[0];
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (name.trim()) params.name = name.trim();
      if (phoneNumber.trim()) params.phoneNumber = phoneNumber.trim();

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ROOTCABS_WEBSITE_REGISTRATIONS,params);

      if (response?.success) {
        const nextRows = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response?.data?.rows)
            ? response.data.rows
            : Array.isArray(response?.data?.accounts) || Array.isArray(response?.data?.drivers)
              ? [
                  ...(Array.isArray(response?.data?.accounts) ? response.data.accounts : []),
                  ...(Array.isArray(response?.data?.drivers) ? response.data.drivers : []),
                ]
              : [];

        setRows(nextRows);
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalPages: response?.pagination?.totalPages || 1,
          totalItems: response?.pagination?.totalItems || nextRows.length,
          itemsPerPage: response?.pagination?.itemsPerPage || prev.itemsPerPage,
        }));
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to load root web registrations:", error);
      setRows([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(pagination.currentPage, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, serviceTypeFilter, fromDate, toDate, name, phoneNumber]);

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

  const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <div className="flex items-center cursor-pointer gap-2 rounded-md border border-blue-gray-200 px-3 py-2">
          <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
            {title}
          </Typography>
          <Typography variant="small" className="text-[11px] font-semibold text-blue-gray-700 normal-case">
            {selectedFilters.includes("All") ? "Select" : selectedFilters.join(", ")}
          </Typography>
          <FaFilter className="text-black text-xs" />
        </div>
      </PopoverHandler>
      <PopoverContent className="p-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center mb-2">
            <Checkbox
              color="blue"
              checked={selectedFilters.includes(option.value)}
              onChange={() => onFilterChange(option.value)}
            />
            <Typography color="blue-gray" className="font-medium ml-2">
              {option.label}
            </Typography>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );

  const getName = (row) =>
    row?.name || row?.fullName || row?.customerName || row?.driverName || row?.accountName || "-";
  const getAccountId = (row) => row?.accountId || row?.account?.id || row?.account?.accountId || "-";
  const getDriverId = (row) => row?.driverId || row?.driver?.id || row?.driver?.driverId || "-";
  const getPhone = (row) => row?.phoneNumber || row?.phone || row?.mobileNumber || "-";
  const getSource = (row) => row?.source || row?.registrationSource || row?.from || "-";
  const getType = (row) => row?.serviceType || row?.type || row?.userType || "-";
  const getCreatedAt = (row) => row?.created_at || row?.createdAt || row?.createdAtDate || null;
  const getServiceTypeChipProps = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "individual") return { color: "blue", label: "Individual" };
    if (normalized === "auto") return { color: "green", label: "Auto" };
    if (normalized === "bike") return { color: "amber", label: "Bike" };
    if (normalized === "parcel") return { color: "red", label: "Parcel" };
    if (normalized === "acting driver") return { color: "purple", label: "Acting Driver" };
    return { color: "blue-gray", label: value || "-" };
  };

  return (
    <div className="mt-6 flex flex-col gap-8">
      <Card className="overflow-hidden p-4 m-4">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <Typography variant="h6" color="black">
              Root Web Registrations
            </Typography>
            {/* <Typography variant="small" color="black">
              Total: {pagination.totalItems}
            </Typography> */}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FilterPopover
              title="Service Type"
              options={SERVICE_TYPE_OPTIONS}
              selectedFilters={serviceTypeFilter}
              onFilterChange={(value) => {
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
                setServiceTypeFilter((prev) => {
                  if (value === "All") return ["All"];
                  const next = prev.includes(value)
                    ? prev.filter((item) => item !== value)
                    : [...prev.filter((item) => item !== "All"), value];
                  return next.length ? next : ["All"];
                });
              }}
            />
            <Input
              type="date"
              label="From Date"
              value={fromDate}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
                setFromDate(e.target.value);
              }}
            />
            <Input
              type="date"
              label="To Date"
              value={toDate}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
                setToDate(e.target.value);
              }}
            />
            <div className="flex items-end">
              <Button className="w-full bg-red-500 inline-flex items-center justify-center rounded-full text-xs font-medium text-white hover:bg-red-600" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2 mt-2">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="h-12 w-12" />
            </div>
          ) : rows.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] table-auto">
                  <thead className="bg-primary text-white">
                    <tr>
                        <th className="border-b border-blue-gray-100 p-2 text-left">
                        <Typography variant="small" className="font-bold leading-none">
                          Account ID
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-2 text-left">
                        <Typography variant="small" className="font-bold leading-none">
                          Driver ID
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-2 text-left">
                        <Typography variant="small" className="font-bold leading-none">
                          Name
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-2 text-left">
                        <Typography variant="small" className="font-bold leading-none">
                          Phone
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-2 text-left">
                        <Typography variant="small" className="font-bold leading-none">
                          Source
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-2 text-left">
                        <Typography variant="small" className="font-bold leading-none">
                          Service Type
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-2 text-left">
                        <Typography variant="small" className="font-bold leading-none">
                          Created At
                        </Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row?.id || index}>
                        <td className="p-2 border-b border-blue-gray-50">{getAccountId(row)}</td>
                        <td className="p-2 border-b border-blue-gray-50">{getDriverId(row)}</td>
                        <td className="p-2 border-b border-blue-gray-50">{getName(row)}</td>
                        <td className="p-2 border-b border-blue-gray-50">{getPhone(row)}</td>
                        <td className="p-2 border-b border-blue-gray-50">{getSource(row)}</td>
                        <td className="p-2 border-b border-blue-gray-50">
                          {(() => {
                            const chip = getServiceTypeChipProps(getType(row));
                            return (
                              <Chip
                                value={chip.label}
                                size="sm"
                                variant="ghost"
                                color={chip.color}
                                className="w-fit inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium"
                              />
                            );
                          })()}
                        </td>
                        <td className="p-2 border-b border-blue-gray-50">
                          {getCreatedAt(row) ? moment.utc(getCreatedAt(row)).format("DD-MM-YYYY hh:mm A") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-center gap-4 py-4 px-4 flex-wrap">
                {/* <Typography variant="small" color="blue-gray">
                  Showing {filteredRows.length} of {pagination.totalItems}
                </Typography> */}
                <div className="flex justify-center w-full">
                  {generatePageButtons()}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Typography variant="small" color="blue-gray">
                No root web registrations found.
              </Typography>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
