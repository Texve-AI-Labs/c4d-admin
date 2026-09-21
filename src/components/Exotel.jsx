import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Spinner,
  Chip,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  IconButton,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import moment from "moment";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

const ExotelCallsList = () => {
  const [callList, setCallList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Date filter states
  const [dateFilterType, setDateFilterType] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [startTimeFrom, setStartTimeFrom] = useState('');
  const [startTimeTo, setStartTimeTo] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [count, setCount] = useState({
    totalCalls: 0,
    uniqueCustomers: 0,
    totalDuration: 0,
    successfulCalls: 0,
    notAnswered: 0,
    clientHangup: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });

  const formatDateTimeLocal = (date) => moment(date).format("YYYY-MM-DDTHH:mm");
  const currentDateTime = formatDateTimeLocal(new Date());

  const handleStartTimeFromChange = (value) => {
    setStartTimeFrom(value);
    if (startTimeTo && value && new Date(startTimeTo) < new Date(value)) {
      setDateRangeError('Please select a valid date range. From Date cannot be later than To Date');
      return;
    }
    setDateRangeError('');
  };

  const handleStartTimeToChange = (value) => {
    setStartTimeTo(value);
    if (startTimeFrom && value && new Date(startTimeFrom) > new Date(value)) {
      setDateRangeError('Please select a valid date range. From Date cannot be later than To Date');
      return;
    }
    setDateRangeError('');
  };

  // Apply quick date filter
  const applyDateFilter = (type) => {
    setDateFilterType(type);
    setShowCustomDate(type === 'custom');

    const now = new Date();
    let from = '';
    let to = '';

    if (type === 'today') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      from = formatDateTimeLocal(startOfDay);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      to = formatDateTimeLocal(endOfDay > now ? now : endOfDay);
    } else if (type === '7days') {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      from = formatDateTimeLocal(start);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      to = formatDateTimeLocal(end > now ? now : end);
    } else if (type === '30days') {
      const start = new Date();
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      from = formatDateTimeLocal(start);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      to = formatDateTimeLocal(end > now ? now : end);
    }

    setStartTimeFrom(from);
    setStartTimeTo(to);
    setDateRangeError('');
  };

  // Main API function - uses current state directly
  const callsList = async (page = 1, showLoader = false) => {
    if (startTimeFrom && startTimeTo && new Date(startTimeFrom) > new Date(startTimeTo)) {
      setDateRangeError('Please select a valid date range. From Date cannot be later than To Date');
      return;
    }

    if (showLoader) setLoading(true);
    try {
      const queryParams = {
        StartTimeFrom: startTimeFrom ? new Date(startTimeFrom).toISOString() : '',
        StartTimeTo: startTimeTo ? new Date(startTimeTo).toISOString() : '',
        limit: pagination.itemsPerPage,
        page: page,
        CallType: statusFilter !== 'all' ? statusFilter : '',
        Direction: directionFilter !== 'all' ? directionFilter : '',
        search: searchQuery.trim(),
      };

      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.EXOTEL_CALL_LOGS, queryParams);

      if (data?.success && Array.isArray(data.data)) {
        setCallList(data.data);
        setCount({
          totalCalls: data?.summary?.totalCallCount || 0,
          uniqueCustomers: data?.summary?.uniqueUserCount || 0,
          totalDuration: data?.summary?.callDurationTotal || 0,
          successfulCalls: data?.summary?.callTypeCounts?.completed || 0,
          notAnswered: data?.summary?.callTypeCounts?.incomplete || 0,
          clientHangup: data?.summary?.callTypeCounts?.clientHangup || 0,
        });
        setPagination({
          currentPage: data?.pagination?.currentPage || page,
          totalPages: data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: pagination.itemsPerPage,
        });
      } else {
        setCallList([]);
        setPagination(prev => ({ ...prev, currentPage: page, totalPages: 1, totalItems: 0 }));
        setCount({ totalCalls: 0, uniqueCustomers: 0, totalDuration: 0, successfulCalls: 0, notAnswered: 0, clientHangup: 0 });
      }
    } catch (error) {
      console.error(error);
      setCallList([]);
      setPagination(prev => ({ ...prev, currentPage: page, totalPages: 1, totalItems: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Single useEffect for all filters + pagination
  useEffect(() => {
    callsList(pagination.currentPage, true);
  }, [
    pagination.currentPage,
    startTimeFrom,
    startTimeTo,
    statusFilter,
    directionFilter,
    searchQuery
  ]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [startTimeFrom, startTimeTo, statusFilter, directionFilter, searchQuery]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
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
          className={`mx-1 ${i === pagination.currentPage ? 'bg-blue-500 text-white' : 'border-blue-500 text-blue-500'}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds} sec`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} mins ${secs} sec`;
  };

  const formatHrsDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs} : ${mins} : ${secs}`;
    if (mins > 0) return `${mins} : ${secs}`;
    return `${secs} sec`;
  };

  const getStatusLabel = (CallType, Direction) => {
    if (CallType === 'completed') return 'Call successful';
    if (CallType === 'incomplete') return 'No Answer';
    if (CallType === 'failed') return 'Declined';
    if (CallType === 'busy') {
      if (Direction === 'incoming') return 'Dropped before connect';
      if (Direction === 'outcoming') return 'Dropped during call';
    }
    return CallType || '-';
  };

  const getStatusColor = (CallType) => {
    if (CallType === 'completed') return 'bg-green-600 text-white';
    if (CallType === 'client-hangup') return 'bg-red-600 text-white';
    if (CallType === 'failed') return 'bg-red-600 text-white';
    if (CallType === 'busy') return 'bg-yellow-600 text-white';
    return 'bg-blue-600 text-white';
  };
const getDirectionLabel = (direction) => {
  if (!direction) return '-';
  if (direction === 'incoming') return 'Incoming';
  if (direction === 'outbound-api' || direction === 'outgoing') return 'Outgoing';
  return direction.charAt(0).toUpperCase() + direction.slice(1); // fallback
};
  const getDirectionColor = (Direction) => {
    if (Direction === 'incoming') return 'text-orange-500';
    if (Direction === 'outcoming') return 'text-green-500';
    if (Direction === 'outbound-api') return 'text-green-500';
    return 'text-blue-600';
  };

  const hasActiveFilters =
    Boolean(startTimeFrom || startTimeTo || searchQuery.trim()) ||
    statusFilter !== 'all' ||
    directionFilter !== 'all';

  return (
    <div className="flex flex-col gap-6">

      {/* Search + Filters */}
      <div className="p-6 rounded-lg shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10 bg-white">

          {/* Search */}
          <div className="relative flex-grow max-w-[300px]">
            <input
              type="text"
              pattern="[0-9]*"
              maxLength="11"
              className="w-full px-4 py-2 pl-10 pr-10 text-sm border bg-gray-200 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Search By Phone Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Date Filters */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                {[{ key: 'today', label: 'Today' }, { key: '7days', label: 'Last 7 Days' }, { key: '30days', label: 'Last 30 Days' }, { key: 'custom', label: 'Custom Date' }].map(({ key, label }) => (
                  <Button
                    key={key}
                    size="sm"
                    className={`text-xs capitalize ${dateFilterType === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
                    onClick={() => applyDateFilter(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {showCustomDate && (
                <div className="mt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">From:</span>
                    <input type="datetime-local" value={startTimeFrom} onChange={(e) => handleStartTimeFromChange(e.target.value)} max={currentDateTime} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">To:</span>
                    <input type="datetime-local" value={startTimeTo} onChange={(e) => handleStartTimeToChange(e.target.value)} min={startTimeFrom} max={currentDateTime} className="px-2 py-1 border border-gray-300 rounded-md text-sm" />
                    </div>
                  </div>
                  {dateRangeError && (
                    <p className="mt-1 text-xs font-medium text-red-600">{dateRangeError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          <Button
            size="sm"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              applyDateFilter('');
              setStartTimeFrom('');
              setStartTimeTo('');
              setStatusFilter('all');
              setDirectionFilter('all');
              setSearchQuery('');
              setDateRangeError('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <Card>
        {callList.length > 0 || loading || hasActiveFilters ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 p-10 lg:grid-cols-6 gap-4">
              {[
                { key: 'totalCalls', label: 'Total Calls', color: 'bg-blue-50 text-blue-900' },
                { key: 'uniqueCustomers', label: 'Unique Customers', color: 'bg-yellow-50 text-yellow-900' },
                { key: 'totalDuration', label: 'Total Duration', color: 'bg-purple-50 text-purple-900' },
                { key: 'successfulCalls', label: 'Completed', color: 'bg-green-50 text-green-900' },
                { key: 'notAnswered', label: 'Not Answered', color: 'bg-red-50 text-red-900' },
                { key: 'clientHangup', label: 'Client-Hangup', color: 'bg-red-50 text-red-900' },
              ].map((item) => (
                <div key={item.key} className={`p-2 rounded-lg shadow-md flex flex-col items-center justify-center min-w-[80px] ${item.color}`}>
                  <Typography variant="small" className="text-xs font-medium mb-1 text-center w-full">{item.label}</Typography>
                  <Typography variant="h6" className="font-bold text-2xl">
                    {item.key === 'totalDuration' ? formatHrsDuration(count[item.key]) : count[item.key]}
                  </Typography>
                </div>
              ))}
            </div>

            <CardBody className="overflow-x-scroll px-4 pt-0 pb-2">
              <table className="w-full table-auto">
                <thead>
                  <tr>
                    {[
                      { label: "Start Time" },
                      { label: "End Time" },
                      { label: "From" },
                      { label: "To" },
                      { label: "Status", filterable: true },
                      { label: "Duration" },
                      { label: "Direction", directionFilter: true },
                    ].map((col) => (
                      <th key={col.label} className="border-b border-blue-gray-50 py-3 px-5 bg-blue-700">
                        <div className="flex items-center gap-2">
                          <Typography variant="small" className="text-[11px] font-bold uppercase text-white">{col.label}</Typography>
                          {col.filterable && (
                            <Menu placement="bottom-start">
                              <MenuHandler>
                                <IconButton size="sm" variant="text">
                                  <FunnelIcon className="h-4 w-4 text-white" />
                                </IconButton>
                              </MenuHandler>
                              <MenuList>
                                <MenuItem onClick={() => setStatusFilter('all')}>All</MenuItem>
                                <MenuItem onClick={() => setStatusFilter('completed')}>Call successful</MenuItem>
                                <MenuItem onClick={() => setStatusFilter('client-hangup')}>Client hung up</MenuItem>
                                <MenuItem onClick={() => setStatusFilter('incomplete')}>No Answer</MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                          {col.directionFilter && (
                            <Menu placement="bottom-start">
                              <MenuHandler>
                                <IconButton size="sm" variant="text">
                                  <FunnelIcon className="h-4 w-4 text-white" />
                                </IconButton>
                              </MenuHandler>
                              <MenuList>
                                {[{ label: "All", value: "all" }, { label: "Incoming", value: "incoming" }, { label: "Outgoing", value: "outgoing" }].map((item) => (
                                  <MenuItem key={item.value} onClick={() => setDirectionFilter(item.value)}>{item.label}</MenuItem>
                                ))}
                              </MenuList>
                            </Menu>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-10">
                        <div className="flex justify-center"><Spinner className="h-12 w-12" /></div>
                      </td>
                    </tr>
                  ) : callList.length > 0 ? (
                    callList.map((call) => (
                        <tr key={call.id}>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {call.StartTime ? moment(call.StartTime).subtract(5, 'hours').subtract(30, 'minutes').format('DD-MM-YYYY HH:mm') : '-'}
                            </Typography>
                        </td>
                        <td className="py-3 px-5 border-b border-blue-gray-50">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {call.CurrentTime ? moment(call.CurrentTime).subtract(5, 'hours').subtract(30, 'minutes').format('DD-MM-YYYY HH:mm') : '-'}
                          </Typography>
                        </td>
                        <td className="py-3 px-5 border-b border-blue-gray-50">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {(call.From || call.CallFrom || '').replace(/^0/, '') || '-'}
                          </Typography>
                        </td>
                        <td className="py-3 px-5 border-b border-blue-gray-50">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {(call.DialWhomNumber || '').replace(/^0/, '') || '-'}
                          </Typography>
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Chip
                              variant="ghost"
                              value={getStatusLabel(call.CallType, call.Direction)}
                              className={`py-0.5 px-2 text-[11px] font-medium w-fit ${getStatusColor(call.CallType)}`}
                            />
                          </td>
                          <td className="py-3 px-5 border-b border-blue-gray-50">
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {formatDuration(call.DialCallDuration)}
                            </Typography>
                          </td>
                        <td className="py-3 px-5 border-b border-blue-gray-50">
                          <Typography className={`text-xs font-semibold ${getDirectionColor(call.Direction)}`}>
                            {getDirectionLabel(call.Direction)}
                          </Typography>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <Typography className="text-sm font-medium text-blue-gray-500">
                          No Call Records Available
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
          </>
        ) : (
          <CardHeader variant="gradient" color="blue" className="mb-8 p-6">
            <Typography variant="h6" color="white">No Call Records Available</Typography>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}
export default ExotelCallsList;
