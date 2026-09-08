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
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    if (!expandedImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setExpandedImage(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage]);

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
  <CardHeader className="mb-8 flex items-center justify-between gap-4 bg-primary p-4 sm:p-6">
          <Typography variant="h6" color="white">Discount List</Typography>
            <div className="inline-flex shrink-0 rounded-full bg-white/20 p-1">
              <button
                type="button"
                onClick={() => setStatusTab('active')}
                className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                  statusTab === 'active' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('inactive')}
                className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                  statusTab === 'inactive' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'
                }`}
              >
                Inactive
              </button>
            </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
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
                  <th className="py-3 px-5 text-left whitespace-nowrap">Premium</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Cab Type</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">City</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Description</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Image</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Dashboard Image</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan="16" className="px-5 py-4 text-center text-sm text-gray-500">
                      {statusTab === 'active'
                        ? 'No Active Discounts Found'
                        : 'No Inactive Discounts Found'}
                    </td>
                  </tr>
                ) : (
                  displayedDiscounts.map((item, index) => (
                    <tr key={index} className="border-b border-blue-gray-50 text-sm hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-3">{serviceTypeLabels[item.serviceType] || item.serviceType}</td>
                      <td className="whitespace-nowrap px-5 py-3">{item.offerType || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-3">{item.targetMode || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-3">{item.title || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-3 font-semibold">
                        <div className=' text-green-600'>
                            {item.couponCode || '-'}
                        </div>
                        </td>
                      <td className="whitespace-nowrap px-5 py-3">
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
                      <td className="whitespace-nowrap px-5 py-3">{moment(item.startDate).format('DD-MM-YYYY ')}</td>
                      <td className="whitespace-nowrap px-5 py-3">{moment(item.endDate).format('DD-MM-YYYY ')}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {item.isActive
                          ? <span className="text-green-600 font-semibold">Active</span>
                          : <span className="text-red-600 font-semibold">Inactive</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">{item.isPremium ? 'Premium' : 'Not Premium'}</td>
                      <td className="whitespace-nowrap px-5 py-3">{item.cabType || item.parcelVehicleType || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {item.serviceArea && item.serviceArea.length > 0 ? (
                          item.serviceArea.map((area, index) => (
                            <span key={index} className="mr-2">{area}</span>
                          ))
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">{item.description || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-primary-500 px-4 py-1 text-white rounded hover:bg-primary-600"
                          onClick={() => setExpandedImage({
                            src: item.imageUrl || null,
                            alt: item.title || 'Discount image',
                          })}
                        >
                          View
                        </Button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-primary-500 px-4 py-1 text-white rounded hover:bg-primary-600"
                          onClick={() => setExpandedImage({
                            src: item.dashboardOfferImg || null,
                            alt: item.title ? `${item.title} dashboard image` : 'Dashboard offer image',
                          })}
                        >
                          View
                        </Button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
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

      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded discount image"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="relative max-h-full max-w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close expanded image"
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-2xl leading-none text-gray-700 shadow-lg hover:bg-gray-100"
              onClick={() => setExpandedImage(null)}
            >
              &times;
            </button>
            {expandedImage.src ? (
              <img
                src={expandedImage.src}
                alt={expandedImage.alt}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <div className="flex h-64 w-80 items-center justify-center rounded-lg bg-gray-200 text-gray-500 shadow-2xl">
                No Image
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountView;
