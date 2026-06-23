import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Spinner,
  Button,
  Select,
  Option,
  Popover,
  PopoverHandler,
  PopoverContent,
  Checkbox,
} from '@material-tailwind/react';
import { FaFilter } from 'react-icons/fa';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function OnlineVehiclesList({ id = 0 }) {
  const [vehicleList, setVehicleList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusCheckedDriverIds, setStatusCheckedDriverIds] = useState([]);
  const [selectedInterval, setSelectedInterval] = useState('');
   const [typeFilter, setTypeFilter] = useState(['All']);
  const intervalRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [driverIds, setDriverIds] = useState([]);
  const navigate = useNavigate();
  const prevSearchRef = useRef('');

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
    search: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const driverType = typeFilter[0] === 'All' ? "All" : typeFilter[0];

  const checkPresence = async (driverId, vehicleId, all) => {
    try {
      if (all) {
        const result = await ApiRequestUtils.post(API_ROUTES.CHECK_PRESENCE, { driverId: driverIds });
        if (result?.success && result?.data?.status) {
          setVehicleList((prev) =>
            prev.map((vehicle) =>
              vehicle.id === vehicleId && vehicle.Drivers?.length > 0
                ? {
                    ...vehicle,
                    Drivers: [
                      {
                        ...vehicle.Drivers[0],
                        status: result.data.status === 'AVAILABLE' ? 'ACTIVE' : 'INACTIVE',
                      },
                    ],
                  }
                : vehicle
            )
          );
        } else {
          console.error('Invalid API response:', result?.message);
        }
      } else {
      const result = await ApiRequestUtils.post(API_ROUTES.CHECK_PRESENCE, { driverId });
      if (result?.success && result?.data?.status) {
        setVehicleList((prev) =>
          prev.map((vehicle) =>
            vehicle.id === vehicleId && vehicle.Drivers?.length > 0
              ? {
                  ...vehicle,
                  Drivers: [
                    {
                      ...vehicle.Drivers[0],
                      status: result.data.status === 'AVAILABLE' ? 'ACTIVE' : 'INACTIVE',
                    },
                  ],
                }
              : vehicle
          )
        );
      } else {
        console.error('Invalid API response:', result?.message);
        }
      }
    } catch (error) {
      console.error('Error checking presence:', error);
    } finally {
      setStatusCheckedDriverIds((prev) => [...new Set([...prev, driverId])]);
    }
  };

  const checkAllStatus = async () => {
    const vehiclesWithDrivers = vehicleList.filter(
      (vehicle) =>
        vehicle.Drivers?.length > 0 &&
        !statusCheckedDriverIds.includes(vehicle.Drivers[0]?.id)
    );
    for (const vehicle of vehiclesWithDrivers) {
      await checkPresence(vehicle.Drivers[0]?.id, vehicle.id, true);
    }
  };

  const fetchCabList = async (page = 1, search = '', showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = {
        isToday: 'true',
        page: page,
        limit: pagination.itemsPerPage,
      };
      if (driverType) params.type = driverType;          
      if (search.trim()) {
        params.search = search.trim();
      }
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_CABS_PACKAGE, params);
      if (data?.success) {
        const updatedVehicleList = (data.data || []).map((item) => {
          // console.log(`Vehicle ${item.id}: Shift availability = ${item.Shifts?.[0]?.availability}`);
          return {
            ...item,
            Drivers: item.Drivers?.length > 0
              ? item.Drivers.map((driver) => ({
                  ...driver,
                  status: item.Shifts?.[0]?.availability === 'AVAILABLE' ? 'ACTIVE' : 'INACTIVE',
                }))
              : [],
          };
        });
        setVehicleList(updatedVehicleList);
        setStatusCheckedDriverIds([]);
        // console.log('Fetched vehicle list:', updatedVehicleList);
        setDriverIds(data?.driverIds);
        setPagination({
          currentPage: page,
          totalPages: data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
          search: search.trim(),
        });
      } else {
        console.error('API request failed:', data?.message);
      }
    } catch (error) {
      console.error('Error fetching vehicle list:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleIntervalChange = (value) => {
    setSelectedInterval(value);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      intervalRef.current = null;
      }
    if (value) {
      const intervalSeconds = parseInt(value);
      intervalRef.current = setInterval(() => {
        fetchCabList(pagination.currentPage, pagination.search, false);
      }, intervalSeconds * 1000);
    }
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'type') {
      setTypeFilter([value]);
    }
  };

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== (pagination.search || '');
    prevSearchRef.current = pagination.search || '';
    fetchCabList(pagination.currentPage, pagination.search, !searchChanged);
  }, [id, pagination.currentPage, pagination.search, typeFilter]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const filteredVehicles = vehicleList.filter((v) => {
    if (typeFilter[0] === 'All') return true;
    return (v.type?.toUpperCase() || '') === typeFilter[0];
  });

  const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <div className="flex items-center cursor-pointer">
          <Typography
            variant="small"
            className={`text-[11px] font-bold uppercase mr-1 ${ColorStyles.PopoverHandlerText}`}
          >
            {/* {title} */}
          </Typography>
          <FaFilter className="text-black text-xs" />
        </div>
      </PopoverHandler>
      <PopoverContent className="p-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center mb-2">
            <Checkbox
              color="blue"
              checked={selectedFilters[0] === option.value}
              onChange={() => onFilterChange('type', option.value)}
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
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });

    const sorted = [...vehicleList].sort((a, b) => {
      let aVal, bVal;

      if (key === 'firstName') {
        aVal = (a.Drivers?.[0]?.firstName || '').trim().toLowerCase();
        bVal = (b.Drivers?.[0]?.firstName || '').trim().toLowerCase();
      } else if (key === 'updated_at') {
        aVal = a.Shifts?.[0]?.updated_at ? new Date(a.Shifts[0].updated_at) : new Date(0);
        bVal = b.Shifts?.[0]?.updated_at ? new Date(b.Shifts[0].updated_at) : new Date(0);
      } else {
        return 0;
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setVehicleList(sorted);
  };

  const debouncedFetchCabList = useRef(
    debounce((searchTerm) => {
      setPagination(prev => ({ ...prev, currentPage: 1, search: searchTerm.trim() }));
    }, 600)
  ).current;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedFetchCabList(value);
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="p-4 border border-gray-300 rounded-lg shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4 max-w-[500px]">
          <Select
            label={selectedInterval ? `Refreshing every ${selectedInterval}` : 'Select Refresh Interval'}
            value={selectedInterval}
            onChange={handleIntervalChange}
          >
            <Option value="">Stop Refresh</Option>
            {['5', '10', '15', '20', '30', '60', '90', '120'].map((sec) => (
              <Option key={sec} value={sec}>{`${sec} sec`}</Option>
            ))}
          </Select>
        </div>
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full py-2 pl-10 pr-10 border rounded-xl text-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search by Driver Name"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPagination((prev) => ({ ...prev, currentPage: 1, search: '' }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <Card>
            <CardHeader
              variant="gradient"
              className="mb-8 p-6 flex justify-between items-center bg-primary"
            >
              <Typography variant="h6" color="white">
                Online Vehicles List
              </Typography>
              <Button
                color="red"
                size="sm"
                onClick={checkAllStatus}
                disabled={vehicleList.every(
                  (vehicle) =>
                    vehicle.Drivers?.length === 0 ||
                    statusCheckedDriverIds.includes(vehicle.Drivers[0]?.id)
                )}
              >
                Check All Status
              </Button>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {[
                      'Type',
                      'Driver Name',
                      'Cab Name',
                      'Phone Number',
                      'Current Address',
                      'Last Location Updated',
                      'Available Status',
                ].map((el) => {
                  const sortKey = el === 'Driver Name' ? 'firstName' : el === 'Last Location Updated' ? 'updated_at' : null;
                  return (
                    <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <div className="flex items-center justify-between">
                        {sortKey ? (
                          <div
                            onClick={() => handleSort(sortKey)}
                            className="cursor-pointer flex items-center hover:text-blue-700 transition-colors"
                          >
                            <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                              {el}
                            </Typography>
                            <span className="ml-1 flex flex-col">
                              <ChevronUpIcon
                                className={`w-4 h-4 ${sortConfig.key === sortKey && sortConfig.direction === 'asc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                                  }`}
                              />
                              <ChevronDownIcon
                                className={`w-4 h-4 -mt-1 ${sortConfig.key === sortKey && sortConfig.direction === 'desc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                                  }`}
                              />
                            </span>
                          </div>
                        ) : (
                          <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                            {el}
                          </Typography>
                        )}
                        {el === 'Type' && (
                      <FilterPopover
                        // title={el}
                        options={[
                          { value: 'All', label: 'All' },
                          { value: 'CAB', label: 'Cab' },
                          { value: 'AUTO', label: 'Auto' },
                          { value: 'PARCEL', label: 'Bike' }
                        ]}
                        selectedFilters={typeFilter}
                        onFilterChange={handleFilterChange}
                      />
                            )}
                          </div>
                      </th>
                    );
                    })}
                  </tr>
                </thead>
                <tbody>
                {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {vehicle.type || '-'}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {vehicle.Drivers?.[0]?.firstName || '-'}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {vehicle.name || '-'}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {vehicle.Drivers?.[0]?.phoneNumber || '-'}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {/* {vehicle.Shifts?.[0]?.curAddress || '-'} */
                          vehicle.Shifts?.[0]?.curAddress?.name}
                        </Typography>
                      </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                    {vehicle.Shifts?.[0]?.updated_at
                    ? moment(vehicle.Shifts[0]?.updated_at).format('DD-MM-YYYY HH:mm')
                    : '-'}
                    </Typography>
                    </td>
                     <td className="py-3 px-5 border-b border-blue-gray-50">
                        <div className="flex items-center gap-2">
                          <Chip
                            variant="ghost"
                            color={
                              vehicle.Drivers?.length > 0 &&
                              vehicle.Drivers[0]?.status === 'ACTIVE'
                                ? 'green'
                                : 'red'
                            }
                            value={
                              vehicle.Drivers?.length > 0
                                ? vehicle.Drivers[0]?.status === 'ACTIVE'
                                  ? 'Active'
                                  : 'Offline'
                                : 'No Driver'
                            }
                            className="text-xs font-semibold"
                          />
                          {vehicle.Drivers?.length > 0 &&
                            vehicle.Drivers[0]?.status === 'ACTIVE' &&
                            !statusCheckedDriverIds.includes(vehicle.Drivers[0]?.id) && (
                              <Typography
                                className="text-xs font-semibold text-primary-900 underline cursor-pointer"
                                onClick={() => checkPresence(vehicle.Drivers[0]?.id, vehicle.id, false)}
                              >
                                Check Status
                              </Typography>
                            )}
                        </div>
                      </td>
                      
                    
                    </tr>
                  ))}
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