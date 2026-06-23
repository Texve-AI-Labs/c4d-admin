import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardBody, Typography, Button,
  Spinner,
} from '@material-tailwind/react';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

const DiscountView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('active');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        let res;

        if (statusTab === 'active') {
          res = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_DISCOUNT, {
            status: true,
          });
        } else if (statusTab === 'inactive') {
          res = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_DISCOUNT, {
            status: false,
          });
        } else {
          res = await ApiRequestUtils.get(API_ROUTES.GET_DISCOUNT);
        }

        let list = res?.data || [];

        // If an updated discount was passed via location.state, patch the list
        const updated = location.state?.updatedDiscount;
        if (updated) {
          list = list.map((item) => (item.id === updated.id ? updated : item));
        }

        setDiscounts(list);
      } catch (error) {
        console.error('Failed to fetch discount list:', error);
        setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, [location.state, statusTab]);
  const serviceTypeLabels = {
  ALL:"All Services",
  DRIVER: "Driver",
  RIDES: "Rides",
  RENTAL_HOURLY_PACKAGE:"Hourly Package",
  RENTAL_DROP_TAXI:"Drop Taxi",
  RENTAL:"Outstation",
  AUTO:"Auto",
  PARCEL:"Parcel"
};

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  const filteredDiscounts = discounts.filter((item) =>
    statusTab === 'active' ? item.isActive : !item.isActive
  );

  const displayedDiscounts =
    sortConfig.key === 'startDate'
      ? [...filteredDiscounts].sort((a, b) => {
          const aDate = a.startDate ? new Date(a.startDate) : new Date(0);
          const bDate = b.startDate ? new Date(b.startDate) : new Date(0);

          if (aDate < bDate) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aDate > bDate) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        })
      : filteredDiscounts;

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="flex items-center justify-end">
        <button
          onClick={() => navigate('/dashboard/finance/discountModule/add')}
          className="ml-4 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-700"
        >
          Add new
        </button>
      </div>

      <Card>
  <CardHeader className="mb-8 p-6 flex justify-between items-center bg-primary">
          <Typography variant="h6" color="white">Discount List</Typography>
        </CardHeader>

        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setStatusTab('active')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  statusTab === 'active' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('inactive')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  statusTab === 'inactive' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
          {loading ? (
           <div className="flex justify-center items-center py-10">
           <Spinner className="h-10 w-10" />
          </div>
          ) : (
            <table className="w-full min-w-[1000px] table-auto whitespace-nowrap">
              <thead>
                <tr>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Service Type</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Offer Type</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Target Mode</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Title</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Coupon Code</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Description</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Discount Type</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('startDate')}
                      className="flex items-center gap-1"
                    >
                      <span>Start Date</span>
                      <span className="ml-1 flex flex-col">
                        <ChevronUpIcon
                          className={`w-4 h-4 ${sortConfig.key === 'startDate' && sortConfig.direction === 'asc'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                            }`}
                        />
                        <ChevronDownIcon
                          className={`w-4 h-4 -mt-1 ${sortConfig.key === 'startDate' && sortConfig.direction === 'desc'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                            }`}
                        />
                      </span>
                    </button>
                  </th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">End Date</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Status</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Image</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Premium</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Cab Type</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">City</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="text-center py-4">
                      {statusTab === 'active'
                        ? 'No Active Discounts Found'
                        : 'No Inactive Discounts Found'}
                    </td>
                  </tr>
                ) : (
                  displayedDiscounts.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-5 whitespace-nowrap">{serviceTypeLabels[item.serviceType] || item.serviceType}</td>
                      <td className="py-3 px-5 whitespace-nowrap">{item.offerType || '-'}</td>
                      <td className="py-3 px-5 whitespace-nowrap">{item.targetMode || '-'}</td>
                      <td className="py-3 px-5 whitespace-nowrap">{item.title || '-'}</td>
                      <td className="py-3 px-5 font-semibold whitespace-nowrap">
                        <div className=' text-green-600'>
                            {item.couponCode || '-'}
                        </div>
                        </td>
                      <td className="py-3 px-5 whitespace-nowrap">{item.description || '-'}</td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {(() => {
                          const normalizedType = (item.discountType || (Number(item.amount) > 0 ? 'IsAmount' : 'percentage'))?.toLowerCase();
                          if (normalizedType === 'isamount' || normalizedType === 'amount' || normalizedType === 'flat') {
                            const value = item.amount ?? item.flatAmount ?? item.discountValue ?? 0;
                            return value ? `₹${value}` : '-';
                          }
                          const percent = item.percentage ?? item.discountValue ?? 0;
                          return percent !== null && percent !== undefined && percent !== '' ? `${percent}%` : '-';
                        })()}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">{moment(item.startDate).format('DD-MM-YYYY ')}</td>
                      <td className="py-3 px-5 whitespace-nowrap">{moment(item.endDate).format('DD-MM-YYYY ')}</td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {item.isActive
                          ? <span className="text-green-600 font-semibold">Active</span>
                          : <span className="text-red-600 font-semibold">Inactive</span>}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt="discount"
                            className="w-32 h-auto rounded-md"
                          />
                        ) : (
                          <div className="w-32  bg-gray-200 border-2 border-dashed rounded-md flex items-center justify-center  h-20">
                            <span className="text-gray-500 text-xs">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">{item.isPremium ? 'Premium' : 'Not Premium'}</td>
                      <td className="py-3 px-5 whitespace-nowrap">{item.cabType || item.parcelVehicleType || '-'}</td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {item.serviceArea && item.serviceArea.length > 0 ? (
                          item.serviceArea.map((area, index) => (
                            <span key={index} className="mr-2">{area}</span>
                          ))
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <Button
                          onClick={() =>
                            navigate(`/dashboard/finance/discountModule/edit/${item.id}`, {
                              state: { discount: item },
                            })
                          }
                          size="sm"
                          className="bg-primary-500 text-white px-3 py-1 rounded hover:bg-primary-600"
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

export default DiscountView;
