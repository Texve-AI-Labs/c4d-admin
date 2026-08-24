import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Spinner,
  Switch,
  Input,
} from '@material-tailwind/react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { fetchZoneOptions } from '@/pages/marketing/DriverIncentive/zoneOptions';

const BannerView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bannerList, setBannerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingBannerId, setUpdatingBannerId] = useState(null);
  const [editingPositionId, setEditingPositionId] = useState(null);
  const [positionValues, setPositionValues] = useState([]);
  const [typeFilter, setTypeFilter] = useState(['All']);
  const [zoneFilter, setZoneFilter] = useState(['All']);
  const [zoneOptions, setZoneOptions] = useState([{ label: 'All', value: 'All' }]);
  const [statusTab, setStatusTab] = useState('active');
  const [positionErrorById, setPositionErrorById] = useState({});

  const formatTypeText = (type) => {
    if (!type) return '-';
    return String(type)
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const mapServiceDetails = (serviceType) => {
    switch (serviceType) {
      case 'DRIVER':
        return { serviceType: 'DRIVER', bookingType: null, packageType: null };
      case 'RENTAL_HOURLY_PACKAGE':
        return { serviceType: 'RENTAL', bookingType: null, packageType: 'Local' };
      case 'RENTAL':
        return { serviceType: 'RENTAL', bookingType: 'ROUND TRIP', packageType: 'Outstation' };
      case 'RENTAL_DROP_TAXI':
        return { serviceType: 'RENTAL', bookingType: 'DROP ONLY', packageType: 'Outstation' };
      case 'RIDES':
        return { serviceType: 'RIDES', bookingType: null, packageType: null };
      case 'AUTO':
        return { serviceType: 'AUTO', bookingType: null, packageType: null };
      case 'PARCEL':
        return { serviceType: 'PARCEL', bookingType: null, packageType: null };
      case 'BIKE':
        return { serviceType: 'BIKE', bookingType: null, packageType: null };
      default:
        return { serviceType: '', bookingType: null, packageType: null };
    }
  };

  const getServiceTypeLabel = (item) => {
    if (!item) return '-';

    const serviceType = item.serviceType || '';
    const bookingType = item.bookingType || '';
    const packageType = item.packageType || '';

    if (serviceType === 'RENTAL' && bookingType === 'ROUND TRIP' && packageType === 'Outstation') {
      return 'Outstation';
    }

    if (serviceType === 'RENTAL' && bookingType === 'DROP ONLY' && packageType === 'Outstation') {
      return 'Drop Taxi';
    }

    if (serviceType === 'RENTAL' && packageType === 'Local') {
      return 'Hourly Package';
    }

    const mapped = mapServiceDetails(serviceType);
    const serviceLabel = formatTypeText(mapped.serviceType);
    return serviceLabel || '-';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    return moment(dateValue).format('DD-MM-YYYY');
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '-';
    return moment(timeValue, ['HH:mm:ss', 'HH:mm']).format('hh:mm A');
  };

  const normalizeStatus = (status) => {
    if (status === true || status === false) return status;
    if (typeof status === 'string') {
      return status.toLowerCase() === 'true';
    }
    return Boolean(status);
  };

  const getPrimaryBannerImage = (item) => {
    if (!item) return '';
    return item.imageUrl || '';
  };

  const handleEditBanner = (item) => {
    navigate(`/dashboard/user/bannerimg/edit/${item.id}`, {
      state: { banner: item },
    });
  };

  useEffect(() => {
    const loadZoneOptions = async () => {
      const options = await fetchZoneOptions();
      setZoneOptions(
        options.map((opt) => ({
          label: opt.label === 'ALL' ? 'All' : opt.label,
          value: opt.value === '' ? 'All' : opt.value,
        }))
      );
    };

    loadZoneOptions();

    const fetchBanners = async () => {
      try {
        setLoading(true);
        const filterType = {
          type: typeFilter,
          zone: zoneFilter,
        };
        const queryParams = {
          filterType: JSON.stringify(filterType),
          status: statusTab === 'active',
        };
      const res = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_BANNER, queryParams);
      
      // Handle different response structures
      let list = [];
      if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      }
      
      
      const updated = location.state?.updatedBanner;
      if (updated) {
        list = list.map((item) => item.id === updated.id ? { ...item, ...updated, status: normalizeStatus(updated.status) } : item);
      }

      setBannerList(list);
    } catch (err) {
      console.error('Failed to fetch banner list:', err);
      setBannerList([]);
    } finally {
      setLoading(false);
    }
    };

  fetchBanners();
}, [location.state, typeFilter, zoneFilter, statusTab]);

  const handleStatusToggle = async (bannerId, newStatus) => {
    try {
      setLoading(true);
      setUpdatingBannerId(bannerId);
      // console.log('Updating Banner:', { bannerId, status: newStatus });

      const res = await ApiRequestUtils.update(API_ROUTES.UPDATE_BANNER, {
        bannerId: bannerId,
        status: newStatus,
      });
      // console.log('Update Response ====> :', res);

      setBannerList((prevList) =>
        prevList.map((item) =>
          item.id === bannerId ? { ...item, status: normalizeStatus(newStatus) } : item
        )
      );
    } catch (err) {
      console.error('Failed to update banner status:', err);
    } finally {
      setUpdatingBannerId(null);
      setLoading(false);
    }
  };

  const handlePositionChange = (bannerId, value) => {
    setPositionValues(prev => ({
      ...prev,
      [bannerId]: value
    }));
  };

  const positionUpdate = async (bannerId) => {
    try {
      setLoading(true);
      const currentBanner = bannerList.find((item) => item.id === bannerId);
      const newPosition = positionValues[bannerId] ?? currentBanner?.position;
      await ApiRequestUtils.update(API_ROUTES.BANNER_POSITION_UPDATE, {
        bannerId: bannerId,
        position: newPosition,
        type: currentBanner?.type,
        driverType: currentBanner?.driverType || '',
      });
      
      setBannerList((prevList) =>
        prevList.map((item) =>
          item.id === bannerId ? { ...item, position: newPosition } : item
        )
      );
      setEditingPositionId(null); 
    } catch (err) {
      console.error('Failed to update banner position:', err);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
  { value: 'All', label: 'All' },
  {value:'BANNER', label:'Customer Banner First App' },
  {value:'BANNER_DRIVER', label:'One Time Driver Banner' },
  {value:'ONTRIP_BANNER', label:'Trip Screen Banner' },
  {value: 'TOP_NEW', label: 'Dashboard Banner Image'},
  {value: 'SERVICE_INTRO_IMAGE', label:'Service Intro Image (customer)'},
  { value: 'NEW_CUSTOMER', label: 'New Customer' },
  { value: 'INTRO_SLIDES', label: 'Intro Slides (customer)'},
  { value: 'INTRO_SLIDES_DRIVER', label: 'Intro Slides (Driver)' },
  { value: 'FUTURE_BOOKING_INTRO_DRIVER', label: 'Future Booking Intro (Driver)' },
  { value: 'RETURN_TRIP_INTRO_DRIVER', label: 'Return Trip Intro (Driver)' },
  { value: 'TRAINING_VIDEO_DRIVER', label: 'Training Video (Driver)' },
  // { value: 'QR_DRIVER_TO_DRIVER', label: 'QR Driver To Driver' },
  // { value: 'QR_DRIVER_TO_CUSTOMER', label: 'QR Driver To Customer' },
  // { value: 'QR_CUSTOMER_TO_CUSTOMER', label: 'QR Customer To Customer' }
] ;
  const getTypeLabel = (type) => {
    const matched = typeOptions.find((option) => option.value === type);
    return matched?.label || formatTypeText(type);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value === 'All' ? ['All'] : [value]);
  };

  const handleZoneFilterChange = (value) => {
    setZoneFilter(value === 'All' ? ['All'] : [value]);
  };

  // Client-side filtering remains as a fallback
  const filteredBannerList = bannerList.filter(item =>
    (typeFilter.includes('All') || typeFilter.includes(item.type)) &&
    (zoneFilter.includes('All') || zoneFilter.includes(item.zone))
  );

  return (
    <div className="mb-8 flex flex-col gap-12">
       <div className="p-4 flex  flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm"
                value={typeFilter[0] || 'All'}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm"
                value={zoneFilter[0] || 'All'}
                onChange={(e) => handleZoneFilterChange(e.target.value)}
              >
                {zoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            
            
              <button
                type="button"
                onClick={() => setStatusTab('active')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  statusTab === 'active' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Active 
                {/* ({activeCount}) */}
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('inactive')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  statusTab === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Inactive
                {/* ({inactiveCount}) */}
              </button>
            </div>
             <button
          onClick={() => navigate('/dashboard/user/bannerimg/add')}
          className="ml-4 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-700"
        >
          Add New
        </button>
          </div>
      <Card className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <CardHeader className="mb-4 p-6 bg-primary">
          <Typography variant="h6" color="white">Banner List</Typography>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-4">

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <table className="min-w-full w-max table-auto">
              <thead>
                <tr className="text-black">
                  <th className="py-3 px-5 text-left text-gray-700">Image</th>
                  <th className="py-3 px-5 text-left text-gray-700">Type</th>
                  <th className="py-3 px-5 text-left text-gray-700">Status</th>
                  <th className="py-3 px-5 text-left  text-gray-700">From Date</th>
                  <th className="py-3 px-5 text-left  text-gray-700">To Date</th>
                  <th className="py-3 px-5 text-left  text-gray-700">Start Time</th>
                  <th className="py-3 px-5 text-left  text-gray-700">End Time</th>
                  <th className="py-3 px-5 text-left  text-gray-700">Zone</th>
                  <th className="py-3 px-5 text-left  text-gray-700">Driver Type</th>
                  <th className="py-3 px-5 text-left  text-gray-700">Service Type</th>  
                  <th className="py-3 px-5 text-left  text-gray-700">Position</th>
                  <th className="py-3 px-5 text-left  text-gray-700">Redirect URL</th>
                  <th className="py-3 px-5 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBannerList.length === 0 ? (
                  <tr>
                  <td colSpan="12" className="text-center py-4">
                      No Banner Records Found
                    </td>
                  </tr>
                ) : (
                  filteredBannerList.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-5">
                        {getPrimaryBannerImage(item) ? (
                          <img
                            src={getPrimaryBannerImage(item)}
                            alt="banner"
                            className="w-8 h-auto rounded-xl"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">No image</span>
                        )}
                      </td>
                      <td className="py-3 px-5">{getTypeLabel(item.type)}</td>
                      <td className="py-3 px-5">
                        <Switch
                          color="blue"
                          checked={normalizeStatus(item.status)}
                          onChange={() => handleStatusToggle(item.id, !normalizeStatus(item.status))}
                          disabled={updatingBannerId === item.id}
                          label={normalizeStatus(item.status) ? 'Active' : 'Inactive'}
                        />
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {formatDate(item.fromDate)}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {formatDate(item.toDate)}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {formatTime(item.startTime)}
                      </td> 
                      <td className="py-3 px-5 whitespace-nowrap">
                        {formatTime(item.endTime)}
                      </td>
                      <td className="py-3 px-5">
                        {item.zone}
                      </td>
                      <td className="py-3 px-5">
                        {formatTypeText(item.driverType)}
                      </td>
                      <td className="py-3 px-5">
                        {getServiceTypeLabel(item)}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            className="w-12 h-10 border border-gray-300 rounded-md text-center mx-auto"
                            value={item.id === editingPositionId ? (positionValues[item.id] ?? item.position) : item.position}
                            onChange={(e) => handlePositionChange(item.id, e.target.value)}
                            disabled={editingPositionId !== item.id}
                          />
                          <Button
                            size="sm"
                            color="blue"
                            variant="gradient"
                            className="ml-2"
                            onClick={() => {
                              if (editingPositionId === item.id) {
                                const newPositionValue = positionValues[item.id] ?? item.position;
                                const newPosition = newPositionValue !== undefined && newPositionValue !== null
                                  ? String(newPositionValue).trim()
                                  : '';

                                if (newPosition === '') {
                                  setPositionErrorById(prev => ({
                                    ...prev,
                                    [item.id]: 'Position is required',
                                  }));
                                  return;
                                }

                                const isDuplicate = bannerList.some((b) => {
                                  if (b.id === item.id) return false;
                                  if (String(b.position) !== newPosition) return false;
                                  if (b.type !== item.type) return false;
                                  if ((b.zone || '') !== (item.zone || '')) return false;

                                  if (
                                    item.type === 'INTRO_SLIDES_DRIVER' ||
                                    item.type === 'TRAINING_VIDEO_DRIVER'
                                  ) {
                                    return (b.driverType || '') === (item.driverType || '');
                                  }

                                  return true;
                                });

                                if (isDuplicate) {
                                  setPositionErrorById(prev => ({
                                    ...prev,
                                    [item.id]:
                                      item.type === 'INTRO_SLIDES_DRIVER' 
                                      || item.type === 'TRAINING_VIDEO_DRIVER'
                                        ? `Another ${item.type} (${item.driverType || 'N/A'}) banner in ${item.zone || 'N/A'} already uses position ${newPosition}`
                                        : `Another ${item.type} banner in ${item.zone || 'N/A'} already uses position ${newPosition}`,
                                  }));
                                  return;
                                }

                                setPositionErrorById(prev => ({
                                  ...prev,
                                  [item.id]: '',
                                }));

                                positionUpdate(item.id);
                              } else {
                                setEditingPositionId(item.id);
                              }
                            }}
                          >
                            {editingPositionId === item.id ? 'Update' : 'Edit'}
                          </Button>
                        </div>
                        {positionErrorById[item.id] && (
                          <p className="mt-1 text-xs text-red-500 text-center">
                            {positionErrorById[item.id]}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-5 break-words max-w-xs">{item.redirectUrl || '-'}</td>
                      <td className="py-3 px-5">
                        <Button
                          size="sm"
                          color="blue"
                          variant="gradient"
                          onClick={() => handleEditBanner(item)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default BannerView;
