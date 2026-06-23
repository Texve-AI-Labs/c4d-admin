import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Popover,
  PopoverHandler,
  PopoverContent,
  Checkbox,
} from '@material-tailwind/react';
import { FaFilter } from 'react-icons/fa';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { useNavigate } from 'react-router-dom';
import moment from "moment";

export function NotificationList() {
  const navigate = useNavigate();
  const [notification, setNotificationItems] = useState([]);
  const [appFilter, setAppFilter] = useState(['All']); // State for app filter
  const [cityFilter, setCityFilter] = useState(['All']);
  const [timingFilter, setTimingFilter] = useState(['All']); // State for timing filter
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });
  const [cancellingId, setCancellingId] = useState(null);

  const fetchNotificationList = async (page = 1, showLoader = true) => {
    try {
      // Prepare filterType object for the API payload
      const filterType = {
        app: appFilter,
        city: cityFilter,
        timing: timingFilter,
      };

      // Prepare query parameters and payload
      const queryParams = {
        page: page,
        limit: pagination.itemsPerPage,
      };

      // Assume the API expects filterType as part of the query or body
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_NOTIFICATION, {
        ...queryParams,
        filterType: JSON.stringify(filterType), // Stringify filterType for query param
      });

      if (data?.success) {
        setNotificationItems(data?.data || []);
        setPagination({
          currentPage: page,
          totalPages: data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
        });
      }
    } catch (err) {
      console.error('API error:', err);
    }
  };

  useEffect(() => {
    fetchNotificationList(pagination.currentPage, true);
  }, [pagination.currentPage, pagination.itemsPerPage, timingFilter, appFilter, cityFilter]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      fetchNotificationList(page, true);
    }
  };
   const handleTimingFilterChange = (value) => {
    setTimingFilter((prev) => {
      if (value === 'All') {
        return ['All'];
      } else {
        const timingFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== 'All'), value];
        return timingFilter.length === 0 ? ['All'] : timingFilter;
      }
    });
  };

  const handleAppFilterChange = (value) => {
    setAppFilter((prev) => {
      if (value === 'All') {
        return ['All'];
      } else {
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== 'All'), value];
        return newFilter.length === 0 ? ['All'] : newFilter;
      }
    });
  };

  const handleCityFilterChange = (value) => {
    setCityFilter((prev) => {
      if (value === 'All') {
        return ['All'];
      } else {
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== 'All'), value];
        return newFilter.length === 0 ? ['All'] : newFilter;
      }
    });
  };

  const handleCancelNotification = async (id) => {
    try {
      setCancellingId(id);
      const response = await ApiRequestUtils.post(API_ROUTES.CANCEL_NOTIFICATION, {
        marketingId: id,
      });

      if (response?.success) {
        setNotificationItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'CANCELLED' } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    } finally {
      setCancellingId(null);
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

  const getStatusMeta = (status) => {
    const value = String(status || '').toUpperCase();
    if (value === 'SENT' || value === 'ACTIVE') {
      return { label: 'Sent', className: 'text-xs text-green-700' };
    }
    if (value === 'PENDING') {
      return { label: 'Pending', className: 'text-xs text-blue-700' };
    }
    if (value === 'CANCELLED' || value === 'INACTIVE') {
      return { label: 'Cancelled', className: 'text-xs text-red-700' };
    }
    if (value === 'FAILED') {
      return { label: 'Failed', className: 'text-xs text-red-700' };
    }
    return { label: '-', className: 'text-xs text-gray-700' };
  };

  const getDeliveryScheduleMeta = (deliverySchedule) => {
    const value = String(deliverySchedule || '').toUpperCase();
    if (value === 'SEND_NOW') {
      return { label: 'Send Now', className: 'text-xs text-blue-700' };
    }
    if (value === 'SCHEDULE_LATER') {
      return { label: 'Schedule Later', className: 'text-xs text-purple-700' };
    }
    return { label: '-', className: 'text-xs text-gray-700' };
  };

  // FilterPopover component for App and City filters
  const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <div className="flex items-center cursor-pointer">
        
            {title}
       
          <FaFilter className="text-gray-700 text-xs" />
        </div>
      </PopoverHandler>
      <PopoverContent className="p-2 z-10">
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

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="flex items-center justify-end">
        <button
          onClick={() => navigate('/dashboard/vendors/notification/add')}
          className={`ml-4 px-4 py-2 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${ColorStyles.addButtonColor}`}
        >
          Add new
        </button>
      </div>
      <Card>
        <CardHeader
          variant="gradient"
          className={`mb-8 p-6 flex-1 justify-between items-center ${ColorStyles.bgColor}`}
        >
          <Typography variant="h6" color="white">
             All Push Notification
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-max table-auto">
            <thead>
              <tr>
                {/* <th className="border-b border-blue-gray-50 py-3 px-5 text-left">Title</th> */}
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">Type</th>
                 <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">
                 <div className="flex items-center gap-2">
                  
                    <FilterPopover
                      title={<span className="text-sm font-semibold text-gray-700">Time Zone</span>}
                      options={[
                        { value: 'ALL', label: 'All' },
                        { value: 'MORNING', label: 'Morning' },
                        { value: 'AFTERNOON', label: 'Afternoon' },
                        { value: 'EVENING', label: 'Evening' },
                      ]}
                      selectedFilters={timingFilter}
                      onFilterChange={(value) => handleTimingFilterChange(value)}
                    />
                  </div>
                </th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">
                  <div className="flex items-center justify-between">
                  
                    <FilterPopover
                      title={<span className="text-sm font-semibold text-gray-700">App</span>}
                      options={[
                        { value: 'All', label: 'All' },
                        { value: 'CUSTOMER', label: 'Customer' },
                        { value: 'DRIVER', label: 'Driver' },
                      ]}
                      selectedFilters={appFilter}
                      onFilterChange={(value) => handleAppFilterChange(value)}
                    />
                  </div>
                </th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">Message</th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">
                  <div className="flex items-center justify-between">
                   
                    <FilterPopover
                      title={<span className="text-sm font-semibold text-gray-700">City</span>}
                      options={[
                        { value: 'All', label: 'All' },
                        { value: 'Chennai', label: 'Chennai' },
                        { value: 'Vellore', label: 'Vellore' },
                        { value: 'Thiruvannamalai', label: 'Thiruvannamalai' },
                        { value: 'Kanchipuram', label: 'Kanchipuram' },
                      ]}
                      selectedFilters={cityFilter}
                      onFilterChange={(value) => handleCityFilterChange(value)}
                    />
                  </div>
                </th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">Status</th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">Delivery Schedule</th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">Scheduled At</th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">Created Date</th>
                <th className="text-sm border-b border-blue-gray-50 py-3 px-5 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {notification.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-3 px-5 text-center">
                    No Notification List
                  </td>
                </tr>
              ) : (
                notification
                  .filter((item) => appFilter.includes('All') || appFilter.includes(item.app))
                  .filter((item) => cityFilter.includes('All') || cityFilter.includes(item.city))
                  .filter((item) => timingFilter.includes('All') || timingFilter.includes(item.timing))
                  .map((item, index) => (
                    <tr key={item.id || index} className="border-b border-blue-gray-50 text-sm">
                    <td className="py-3 px-5">{item.type || '-'}</td>
                     <td className="py-3 px-5">{item.timing || '-'}</td>
                    <td className="py-3 px-5">{item.app || '-'}</td>
                    <td className="py-3 px-5">{item.message || '-'}</td>
                    <td className="py-3 px-5">{item.city || '-'}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 ${getStatusMeta(item.status).className}`}>
                        {getStatusMeta(item.status).label}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 ${getDeliveryScheduleMeta(item.deliverySchedule).className}`}>
                        {getDeliveryScheduleMeta(item.deliverySchedule).label}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      {item?.scheduledAtUtc && moment(item.scheduledAtUtc).isValid()
                        ? moment(item.scheduledAtUtc).format('DD-MM-YYYY / hh:mm A')
                        : '-'}
                    </td>
                    <td className="py-3 px-5">{moment(item?.created_at).format('DD-MM-YYYY / hh:mm A') || '-'}</td>                  
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                      {item.status !== 'SENT' && item.status !== 'CANCELLED' && item.status !== 'PROCESSING' && item.status !== 'FAILED' && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/dashboard/vendors/notification/edit/${item.id}`)}
                          className="px-5 py-3 text-[10px] font-semibold bg-primary text-white"
                        >
                          Edit
                        </Button>
                      )}
                      {item.status !== 'SENT' && item.status !== 'CANCELLED' && item.status !== 'PROCESSING' && item.status !== 'FAILED' && (
                        <Button
                          size="sm"
                          color="red"
                          onClick={() => handleCancelNotification(item.id)}
                          className="px-5 py-3 text-[10px] font-semibold"
                          disabled={cancellingId === item.id}
                        >
                          {cancellingId === item.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {notification.length > 0 && (
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

export default NotificationList;