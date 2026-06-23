import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Alert,
  Popover,
  PopoverHandler,
  PopoverContent,
  Checkbox,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { FaFilter } from 'react-icons/fa';
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DriverSearch from '@/components/DriverSearch';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { KYC_STATUS_OPTIONS } from "@/pages/common/kycStatusOptions";
import { EMPTY_KYC_STATUS_COUNTS, extractKycStatusCounts, normalizeKycStatusFilterValues } from "@/pages/common/kycStatusCounts";
import KycStatusCards from "@/pages/common/KycStatusCards";

const DRIVER_VIEW_FILTERS_KEY = 'driverViewFilters';
 
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
export function DriverView() {
  const [drivers, setDrivers] = useState([]);
  const [alert, setAlert] = useState(false);
  const [statusFilter, setStatusFilter] = useState(['All']);
  const [serviceTypeFilter, setServiceTypeFilter] = useState(['All']);
  const [documentTypeFilter, setDocumentTypeFilter] = useState(['All'])
  const [sourceFilter,setSourceFilter] = useState(['All'])
  const [subscriptionStatusFilter,setsubscriptionStatusFilter] = useState(['All'])
  const [loading, setLoading] = useState(false);
  const [zoneFilter, setZoneFilter] = useState(['All']);
const [zoneOptions, setZoneOptions] = useState([]);
  const [kycStatusCounts, setKycStatusCounts] = useState(EMPTY_KYC_STATUS_COUNTS);
  const prevSearchRef = useRef('');

  const [pagination, setPagination] = useState(() => {
    const stored = getItemSafe(DRIVER_VIEW_FILTERS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          currentPage: parsed.currentPage || 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 15,
          search: parsed.search || '',
        };
      } catch {
        return {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 15,
          search: '',
        };
      }
    }
    return {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
    search: '',
    };
        }); 

  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [filtersLoaded, setFiltersLoaded] = useState(false);
 
  const location = useLocation();
  const paramsPassed = location.state;

  const navigate = useNavigate();
 
  // Load filters from sessionStorage on initial mount
  useEffect(() => {
    const stored = getItemSafe(DRIVER_VIEW_FILTERS_KEY);
    if (!stored) {
      setFiltersLoaded(true);
      return;
    }
 
    try {
      const parsed = JSON.parse(stored);
 
      if (Array.isArray(parsed.statusFilter)) setStatusFilter(parsed.statusFilter);
      if (Array.isArray(parsed.serviceTypeFilter)) setServiceTypeFilter(parsed.serviceTypeFilter);
      if (Array.isArray(parsed.documentTypeFilter)) {
        setDocumentTypeFilter(normalizeKycStatusFilterValues(parsed.documentTypeFilter));
      }
      if (Array.isArray(parsed.sourceFilter)) setSourceFilter(parsed.sourceFilter);
      if (Array.isArray(parsed.subscriptionStatusFilter)) setsubscriptionStatusFilter(parsed.subscriptionStatusFilter);
      if (Array.isArray(parsed.zoneFilter)) setZoneFilter(parsed.zoneFilter);
     
      // Set pagination search if available
      if (parsed.search !== undefined) {
        setPagination(prev => ({ ...prev, search: parsed.search }));
      }
    } catch (err) {
      console.error("Failed to load driver filters", err);
    } finally {
      setFiltersLoaded(true);
    }
  }, []);
 
  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    if (!filtersLoaded) return;
 
    const data = {
      statusFilter,
      serviceTypeFilter,
      documentTypeFilter,
      sourceFilter,
      subscriptionStatusFilter,
      zoneFilter,
      currentPage: pagination.currentPage,
      search: pagination.search
    };
 
    setItemSafe(DRIVER_VIEW_FILTERS_KEY, JSON.stringify(data));
  }, [filtersLoaded, pagination.currentPage, pagination.search, statusFilter, serviceTypeFilter,
      documentTypeFilter, sourceFilter, subscriptionStatusFilter, zoneFilter]);
  const fetchDrivers = async (page = 1, searchQuery = '', showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const shouldIncludeFilter = (filterValue) =>
        Array.isArray(filterValue) && filterValue.length > 0 && !filterValue.includes('All');

      const queryParams = {
        page,
        limit: pagination.itemsPerPage,
        search: searchQuery.trim(),
      };

      if (shouldIncludeFilter(zoneFilter)) {
        queryParams.district = JSON.stringify(zoneFilter);
      }
      if (shouldIncludeFilter(statusFilter)) {
        queryParams.status = JSON.stringify(statusFilter);
      }
      if (shouldIncludeFilter(sourceFilter)) {
        queryParams.source = JSON.stringify(sourceFilter);
      }
      if (shouldIncludeFilter(serviceTypeFilter)) {
        queryParams.serviceType = JSON.stringify(serviceTypeFilter);
      }
      if (shouldIncludeFilter(subscriptionStatusFilter)) {
        queryParams.subscriptionStatus = JSON.stringify(subscriptionStatusFilter);
      }
      if (shouldIncludeFilter(documentTypeFilter)) {
        queryParams.documentStatus = JSON.stringify(documentTypeFilter);
      }
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_DRIVERS, queryParams);
    if (data?.success) {
      setDrivers(data?.data);
      setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: searchQuery.trim() ? 1 : data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
          search: searchQuery.trim(),
        }));
      setKycStatusCounts(extractKycStatusCounts(data));
      } else {
      setKycStatusCounts(EMPTY_KYC_STATUS_COUNTS);
      } 
    } catch (err) {
   console.error('Error fetching drivers:', err);
   setKycStatusCounts(EMPTY_KYC_STATUS_COUNTS);
    } finally {
      setLoading(false);
    }
  };

  const getDrivers = useCallback((searchQuery) => {
      setPagination((prev) => {
        if (prev.search === searchQuery) return prev;
        return {
        ...prev,
        currentPage: 1,
        search: searchQuery,
      };
      });
  }, []);
 
  useEffect(() => {
    if (!filtersLoaded) return;
  fetchZones(); 
  }, [filtersLoaded]);

  useEffect(() => {
    if (!filtersLoaded) return;
    const searchChanged = prevSearchRef.current !== (pagination.search || '');
    prevSearchRef.current = pagination.search || '';
    fetchDrivers(pagination.currentPage, pagination.search, !searchChanged);
  }, [filtersLoaded, pagination.currentPage, pagination.search, statusFilter, sourceFilter,
      serviceTypeFilter, subscriptionStatusFilter, documentTypeFilter, zoneFilter]);
 
  useEffect(() => {
    if (paramsPassed?.driverAdded || paramsPassed?.driverUpdated) {
      setAlert(true);
      setTimeout(() => {
        setAlert(false);
      }, 2000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [paramsPassed, navigate, location.pathname]);
 
  const handleRefresh = () => {
    sessionStorage.removeItem(DRIVER_VIEW_FILTERS_KEY);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 15,
      search: '',
    });
    setStatusFilter(['All']);
    setServiceTypeFilter(['All']);
    setDocumentTypeFilter(['All']);
    setSourceFilter(['All']);
    setsubscriptionStatusFilter(['All']);
    setZoneFilter(['All']);
  };
 
  function formatPhoneNumber(phoneNumber) {
    if(phoneNumber){if (phoneNumber.startsWith("+91")) {
      return phoneNumber;
    }
    return `+91${phoneNumber}`;}
  }
  const updateDrivers = async (driverId, status) => {
    let driverData = {
      driverId,
      status: status == "ACTIVE" ? "NOT_ACTIVE" : "ACTIVE"
    };
    const data = await ApiRequestUtils.update(API_ROUTES.UPDATE_DRIVERS, driverData);
    fetchDrivers('');
  };


  // useEffect(() => {
  //   getDrivers('');
  //   if (paramsPassed?.driverAdded || paramsPassed?.driverUpdated) {
  //     setAlert(true);
  //     setTimeout(() => {
  //       setAlert(false);
  //     }, 2000);
  //   }
  // }, [])

  // useEffect(() => {
  //   getDrivers(searchQuery.trim());
  // }, [searchQuery]);
const fetchZones = async () => {
    try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
        if (response?.success) {
            const areas = response.data.filter(area => area.type === 'Service Area');
            setZoneOptions(areas);
        }
    } catch (err) {
        console.error("Failed to load zones for filter:", err);
    }
};
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'availableStatus') {
      setStatusFilter(prev => {
        if (value === 'All') {
          return ['All'];
        } else {
          const newFilter = prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev.filter(item => item !== 'All'), value];
          return newFilter.length === 0 ? ['All'] : newFilter;
        }
      });
    }
    else if (filterType === 'subscriptionStatus') {
      setsubscriptionStatusFilter(prev => {
        if (value === 'All') {
          return ['All'];
        }
        else {
          const newFilter = prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev.filter(item => item !== 'All'), value];
          return newFilter.length === 0 ? ['All'] : newFilter;
        }
      })
    } 
     else if (filterType === "zone") {  // Add this new condition
    setZoneFilter(prev => {
      if (value === 'All') {
        return ['All'];
      } else {
        const newFilter = prev.includes(value)
          ? prev.filter(item => item !== value)
          : [...prev.filter(item => item !== 'All'), value];
        return newFilter.length === 0 ? ['All'] : newFilter;
      }
    });
  }
    else if(filterType === "source")
      {
        setSourceFilter(prev => {
          if( value === 'All')
          {
            return ['All']
          }
          else{
            const newFilter = prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev.filter(item => item !== 'All'), value];
          return newFilter.length === 0 ? ['All'] : newFilter;
          }
        })
      }
    
    else if (filterType === 'documentStatus') {
      setDocumentTypeFilter(prev => {
          if (value === 'All') {
              return ['All'];
          } else {
              const newFilter = prev.includes(value)
                  ? prev.filter(item => item !== value)
                  : [...prev.filter(item => item !== 'All'), value];
              return newFilter.length === 0 ? ['All'] : newFilter;
          }
      });
  }
  };
  const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <div className="flex items-center cursor-pointer">
          <Typography variant="small" className={`text-[11px] font-bold uppercase mr-1 ${ColorStyles.PopoverHandlerText}`}>
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
  const FilterSelectPopover = ({ valueText, options, selectedFilters, onFilterChange }) => (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <div className="w-[280px] bg-white border border-blue-gray-200 rounded-md px-3 py-2 flex items-center justify-between cursor-pointer">
          <Typography variant="small" className="text-sm font-normal normal-case text-blue-gray-700 truncate">
            {valueText}
          </Typography>
          <ChevronDownIcon className="w-4 h-4 text-blue-gray-500" />
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

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedDrivers = [...drivers].sort((a, b) => {
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

    setDrivers(sortedDrivers);
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      {alert && <div className='mb-2'>
        <Alert
          color='blue'
          className='py-3 px-6 rounded-xl'
        >
          {paramsPassed?.driverName} {paramsPassed?.driverAdded ? 'added' : 'updated'} successfully!
        </Alert>
      </div>}
      <DriverSearch onSearch={getDrivers} initialValue={pagination.search} />
              <div className="px-6 -mt-4 pb-4 flex flex-wrap items-start gap-8">
          <div className="min-w-[220px]">
            <Typography variant="small" className="text-sm font-semibold text-blue-gray-800 mb-2">
              KYC Filter
            </Typography>
            <FilterSelectPopover
              valueText={`${documentTypeFilter.includes('All') ? 'All' : documentTypeFilter.join(', ')}`}
              options={[
                { value: "All", label: "All" },
                ...KYC_STATUS_OPTIONS,
              ]}
              selectedFilters={documentTypeFilter}
              onFilterChange={(value) => handleFilterChange("documentStatus", value)}
            />
          </div>
          <div className="min-w-[220px]">
            <Typography variant="small" className="text-sm font-semibold text-blue-gray-800 mb-2">
              Zone Filter
            </Typography>
            <FilterSelectPopover
              valueText={`${zoneFilter.includes('All') ? 'All' : zoneFilter.join(', ')}`}
              options={[
                { value: 'All', label: 'All' },
                ...zoneOptions.map(zone => ({
                  value: zone.name,
                  label: zone.name
                }))
              ]}
              selectedFilters={zoneFilter}
              onFilterChange={(value) => handleFilterChange("zone", value)}
            />
          </div>
        </div>
      <KycStatusCards options={KYC_STATUS_OPTIONS} counts={kycStatusCounts} />
      <Card>
        <CardHeader variant="gradient" className={`mb-8 p-6 flex-1 justify-between items-center rounded-xl ${ColorStyles.bgColor}`}>
          <div className='flex items-center justify-between w-full'>
          <Typography variant="h6" color="white">
            Acting Drivers List
          </Typography>
            <button
              className="bg-primary-400 text-white px-4 py-2 rounded-2xl flex items-center gap-2 hover:bg-primary-500"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <img src="/img/refresh.png" alt="Refresh" className="w-4 h-4" />
              )}
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('created_at')} className="border-b border-blue-gray-50 py-3 px-5 text-left cursor-pointer">
                      <div className="flex items-center gap-1">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">Created Date</Typography>
                      {sortConfig.key === 'created_at' && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-5 h-5 mx-1 justify-center items-center text-black" /> : <ChevronDownIcon className="w-5 h-5 ml-1" />)}
                      </div>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-black"
                      >
                        ID
                      </Typography>
                    </th>
                    {/* <th onClick={() => handleSort('firstName')} className="border-b border-blue-gray-50 py-3 px-5 text-left cursor-pointer">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Driver Name</Typography>
                      {sortConfig.key === 'firstName' && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-5 h-5 ml-1" /> : <ChevronDownIcon className="w-5 h-5 ml-1" />)}
                    </th> */}
                    {["Driver Name","Phone Number", "Local", "Outstation","Zone", "Source", "Service Type", "Available Status", "subscription Status", "KYC Status","Last Online Date and Time"].map((el) => (
                      <th
                      key={el}
                      className="border-b border-blue-gray-50 py-3 px-5 text-left"
                    >
                      {el === "Available Status" ? (
                        <FilterPopover
                          title={el}
                          options={[
                            { value: "All", label: "All" },
                            { value: "ACTIVE", label: "Online" },
                            { value: "IN_ACTIVE", label: "Offline" }
                          ]}
                          selectedFilters={statusFilter}
                          onFilterChange={(value) => handleFilterChange("availableStatus", value)}
                        />
                      ) : el === "Source" ? (
                        <FilterPopover 
                        title = {el}
                        options={[
                          {value:"All" ,label:"All"},
                          {value: "Mobile App" , label:"mobile app"},
                          {value: "Walk In", label:"walk in"},
                          {value: "Call", label:"call"},
                          {value: "Website", label:"web site"},
                        ]}
                        selectedFilters={sourceFilter}
                        onFilterChange={(value) => handleFilterChange("source", value)}
                        />
                    ) : el === "subscription Status" ? (
                      <FilterPopover title={el}
                        options={[
                          { value: "All", label: "All" },
                          { value: "IN_ACTIVE", label: "Offline" },
                          { value: "ACTIVE", label: "Online" }
                        ]}
                        selectedFilters={subscriptionStatusFilter}
                        onFilterChange={(value) => handleFilterChange("subscriptionStatus", value)}
                      />
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
                  {loading ? (
                      <tr>
                        <td colSpan={13} className="py-3 px-5">
                          <div className="flex justify-center items-center">
                            <Spinner className="h-12 w-12" />
                          </div>
                        </td>
                      </tr>
                    ) : drivers.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-6 px-5 text-center">
                          <Typography variant="small" className="font-semibold text-blue-gray-700">
                            No Drivers
                          </Typography>
                        </td>
                      </tr>
                    ) : (
                      drivers.map(
                      ({ id, firstName, lastName, phoneNumber, district,email, status, localCount, outstationCount, curAddress, source, driverType, created_at, subscriptionStatus, documentStatus, Shifts}, key) => {
                        const className = `py-3 px-5 ${key === drivers.length - 1
                          ? ""
                          : "border-b border-blue-gray-50"
                          }`;
                          

                        return (
                          <tr key={id}>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {moment(created_at).format("DD-MM-YYYY")}
                              </Typography>
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {id}
                              </Typography>
                            </td>
                            <td className={className}>
                              <div className="flex items-center gap-4">
                                <Link to={`/dashboard/vendors/account/drivers/details/${id}`}>
                                  <Typography
                                    variant="small"
                                    color="blue"
                                    className="font-semibold underline cursor-pointer"
                                  >
                                    {firstName}
                                  </Typography>
                                  {/* <Typography className="text-xs font-normal text-blue-gray-500">
                                  {email}
                                </Typography> */}
                                </Link>
                              </div>
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {formatPhoneNumber(phoneNumber)}
                              </Typography>
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900 ">
                                {localCount}
                              </Typography>
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {outstationCount}
                              </Typography>
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {district|| '-'}  
                              </Typography>
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {source}
                              </Typography>
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {driverType}
                              </Typography>
                            </td>
                            <td className={className}>
                              <Chip
                                variant="ghost"
                                color={status == "ACTIVE" ? "green" : "black"}
                                value={status == "ACTIVE" ? "online" : "offline"}
                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                              />
                            </td>
                            <td className={className}>
                              <Chip
                                variant="ghost"
                                color={subscriptionStatus == "ACTIVE" ? "green" : subscriptionStatus == "BLOCKED" ? "red" : "black"}
                                value={subscriptionStatus}
                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                              />
                            </td>
                            <td className={className}>
                              <Chip
                                variant="ghost"
                                color={documentStatus?.status == "VERIFIED" ? "green" : documentStatus?.status == "DECLINED" ? "red" : "black"}
                                value={documentStatus?.status}
                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                              />
                            </td>
                            <td className={className}>
                              <Typography className="text-xs font-semibold text-blue-gray-900">
                                {Shifts?.[0]?.created_at
                                  ? moment(Shifts[0].created_at).format("DD-MM-YYYY HH:mm")
                                  : "-"}
                              </Typography>
                            </td>
                          </tr>
                        );
                      }
                    ))}
                </tbody>
              </table>

              {drivers.length > 0 && (
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
    </div >
  );

}

export default DriverView;
