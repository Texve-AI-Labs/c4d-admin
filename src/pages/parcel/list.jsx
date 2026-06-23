import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Chip,
  Popover,
  PopoverHandler,
  PopoverContent,
  Checkbox,
  Spinner,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link, useNavigate } from 'react-router-dom';
import moment from "moment";
import { FaFilter } from "react-icons/fa";
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import ParcelSearch from '@/components/ParcelSearch';

// Debounce utility (same as in AutoView)
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function ParcelDetailsList({ id = 0 }) {
  const [parcelList, setParcelList] = useState([]);
  const [statusFilter, setStatusFilter] = useState(["All"]);
  const [documentStatusFilter, setDocumentStatusFilter] = useState(["All"]);
  const [sourceFilter, setSourceFilter] = useState(["All"]); // New state for source filter
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
    search: '',
  });

  // Fetch parcel list with pagination and search
  const fetchParcelList = useCallback(async (page = 1, searchQuery = '', showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_ACCOUNTS, {
        serviceType: "Parcel",
        page,
        limit: pagination.itemsPerPage,
        search: searchQuery.trim(),
        filterType: JSON.stringify({
          status: statusFilter,
          documentStatus: documentStatusFilter,
          source: sourceFilter,
           serviceType: [ 'Parcel'],// Ensure Parcel is included
        }),
      });
      console.log("API Response:", data);
      if (data?.success) {
        setParcelList(data.data || []);
        setPagination({
          currentPage: page,
          totalPages: searchQuery.trim() ? 1 : data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
          search: searchQuery.trim(),
        });
      } else {
        console.error('API request failed:', data?.message);
      }
    } catch (error) {
      console.error('Error fetching parcel list:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage, statusFilter, documentStatusFilter, sourceFilter]);

  // Fetch data when id changes or filters change
  useEffect(() => {
    fetchParcelList(pagination.currentPage, pagination.search, true);
  }, [fetchParcelList, pagination.currentPage, pagination.search, statusFilter, documentStatusFilter, sourceFilter]);

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((searchQuery) => {
      setPagination((prev) => ({
        ...prev,
        currentPage: 1,
        search: searchQuery,
      }));
    }, 1000),
    []
  );

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  // Generate pagination buttons
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

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedParcels = [...parcelList].sort((a, b) => {
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
    setParcelList(sortedParcels);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    if (filterType === "Status") {
      setStatusFilter((prev) => {
        if (value === "All") return ["All"];
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== "All"), value];
        return newFilter.length === 0 ? ["All"] : newFilter;
      });
    } else if (filterType === "DocumentStatus") {
      setDocumentStatusFilter((prev) => {
        if (value === "All") return ["All"];
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== "All"), value];
        return newFilter.length === 0 ? ["All"] : newFilter;
      });
    } else if (filterType === "source") {
      setSourceFilter((prev) => {
        if (value === "All") return ["All"];
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== "All"), value];
        return newFilter.length === 0 ? ["All"] : newFilter;
      });
    }
  };

  const getFilteredData = () => {
    return parcelList.filter(parcel =>
      (statusFilter.includes('All') || statusFilter.includes(parcel?.ownerStatus)) &&
      (documentStatusFilter.includes('All') || documentStatusFilter.includes(parcel?.documentStatus?.status)) &&
      (sourceFilter.includes('All') || sourceFilter.includes(parcel?.source))
    );
  };

  const filteredData = getFilteredData();

  const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <div className="flex items-center cursor-pointer">
          <Typography
            variant="small"
            className="text-[11px] font-bold uppercase text-black mr-1"
          >
            {title}
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

  // Format phone number
  const formatPhoneNumber = (phoneNumber) => {
    if (phoneNumber) {
      if (phoneNumber.startsWith("+91")) {
        return phoneNumber;
      }
      return `+91${phoneNumber}`;
    }
    return "-";
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      <ParcelSearch onSearch={handleSearch} />
      <Card>
        {loading ? (
          <CardBody>
            <div className="flex justify-center items-center">
              <Spinner className="h-12 w-12" />
            </div>
          </CardBody>
        ) : parcelList.length > 0 ? (
          <>
            <CardHeader variant="gradient" color="blue" className="mb-8 p-6 flex justify-between items-center">
              <Typography variant="h6" color="white">Owner List</Typography>
              {/* <Typography variant="small" color="white">
                Showing {filteredData.length} entries
              </Typography> */}
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {["Created Date", "Name", "Phone Number", "Email", "Type", "Source", "Status", "KYC Status"].map((el) => (
                      <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                        {el === "KYC Status" ? (
                          <FilterPopover
                            title={el}
                          options={[
                              { value: "All", label: "All" },
                              { value: "PENDING UPLOAD", label: "Pending Upload" },
                              // { value: "PENDING VERIFICATION", label: "Pending Verified" },
                              { value: "VERIFIED", label: "Verified" },
                              { value: "DECLINED", label: "Declined" },
                            ]}
                            selectedFilters={documentStatusFilter}
                            onFilterChange={(value) => handleFilterChange("DocumentStatus", value)}
                          />
                        ) 
                        // : el === "Status" ? (
                        //   <FilterPopover
                        //     title={el}
                        //     options={[
                        //       { value: "All", label: "All" },
                        //       { value: "ACTIVE", label: "Active" },
                        //       { value: "IN_ACTIVE", label: "In_Active" },
                        //     ]}
                        //     selectedFilters={statusFilter}
                        //     onFilterChange={(value) => handleFilterChange("Status", value)}
                        //   />
                        // ) 
                        : el === "Source" ? (
                          <FilterPopover
                            title={el}
                            options={[
                              { value: "All", label: "All" },
                              { value: "Mobile App", label: "Mobile App" },
                              { value: "Walk In", label: "Walk In" },
                              { value: "Call", label: "Call" },
                              { value: "Website", label: "Website" },
                            ]}
                            selectedFilters={sourceFilter}
                            onFilterChange={(value) => handleFilterChange("source", value)}
                          />
                        ) : el === "Created Date" ? (
                          <div onClick={() => handleSort("created_at")} className="cursor-pointer flex items-center">
                            <Typography
                              variant="small"
                              className="text-[11px] font-bold uppercase text-black"
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
                            className="text-[11px] font-bold uppercase text-black"
                          >
                            {el}
                          </Typography>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-3 px-5 text-center">
                        <Typography className="text-sm font-semibold text-blue-gray-600">
                          No results match the selected filters.
                        </Typography>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(
                      ({ id, name, phoneNumber, email, type, source, ownerStatus, documentStatus, created_at }) => (
                        <tr key={id}>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {moment(created_at).format('DD-MM-YYYY ')}
                            </Typography>
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Link
                              to={`/dashboard/vendors/account/parcel/details/${id}`}
                              className="underline cursor-pointer text-blue-600"
                            >
                              <Typography className="text-xs font-semibold text-blue-600">{name}</Typography>
                            </Link>
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {formatPhoneNumber(phoneNumber)}
                            </Typography>
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Typography className="text-xs font-semibold text-blue-gray-600">{email || "-"}</Typography>
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Typography className="text-xs font-semibold text-blue-gray-600">{type || "-"}</Typography>
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Typography className="text-xs font-semibold text-blue-gray-600">{source || "-"}</Typography>
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Chip
                              variant="ghost"
                              color={ownerStatus === "ACTIVE" ? "green" : "blue-gray"}
                              value={ownerStatus === "ACTIVE" ? "Active" : "In_Active"}
                              className="py-0.5 px-2 text-[11px] font-medium w-fit"
                            />
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Chip
                              variant="ghost"
                              color={documentStatus?.status === "VERIFIED" ? "green" : documentStatus?.status === "DECLINED" ? "red" : "blue-gray"}
                              value={documentStatus?.status === "VERIFIED" ? "Verified" : documentStatus?.status === "DECLINED" ? "Declined" : "Pending"}
                              className="py-0.5 px-2 text-[11px] font-medium w-fit"
                            />
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
              {filteredData.length > 0 && (
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
          </>
        ) : (
          <CardHeader variant="gradient" color="blue" className="mb-8 p-6">
            <Typography variant="h6" color="white">Not Available</Typography>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}

export default ParcelDetailsList;