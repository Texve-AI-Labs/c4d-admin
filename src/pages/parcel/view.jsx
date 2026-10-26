import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Spinner,
} from '@material-tailwind/react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import moment from 'moment';
import { safeText } from '@/utils/text';

export function ParcelView({ type, ownerName, id }) {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [parcelCreatedFrom, setParcelCreatedFrom] = useState('');
  const [parcelCreatedTo, setParcelCreatedTo] = useState('');
  const [draftParcelCreatedFrom, setDraftParcelCreatedFrom] = useState('');
  const [draftParcelCreatedTo, setDraftParcelCreatedTo] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
    search: '',
  });
  const prevSearchRef = useRef('');

  const fetchParcelAccounts = useCallback(
    async (
      page = 1,
      search = '',
      showLoader = false,
      dateFrom = parcelCreatedFrom,
      dateTo = parcelCreatedTo
    ) => {
      if (showLoader) setLoading(true);
      try {
        const queryParams = {
          page,
          limit: pagination.itemsPerPage,
          search: search.trim(),
        };

        if (dateFrom && dateTo) {
          queryParams.parcelCreatedFrom = dateFrom;
          queryParams.parcelCreatedTo = dateTo;
        }

        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_PARCEL, queryParams);
        if (data?.success) {
          setAccounts(data?.data || []);
          setPagination((prev) => ({
            ...prev,
            currentPage: page,
            totalPages: data?.pagination?.totalPages || 1,
            totalItems: data?.pagination?.totalItems || 0,
            itemsPerPage: data?.pagination?.itemsPerPage || 15,
            search: search.trim(),
          }));
        } else {
          console.error('API request failed:', data?.message);
        }
      } catch (error) {
        console.error('Error fetching parcel accounts:', error);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [pagination.itemsPerPage, parcelCreatedFrom, parcelCreatedTo]
  );

  const submitSearch = () => setPagination((prev) => ({ ...prev, currentPage: 1, search: searchQuery.trim() }));
  const clearSearch = () => { setSearchQuery(''); setPagination((prev) => ({ ...prev, currentPage: 1, search: '' })); };

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== (pagination.search || '');
    prevSearchRef.current = pagination.search || '';
    fetchParcelAccounts(pagination.currentPage, pagination.search, !searchChanged);
  }, [pagination.currentPage, pagination.search, fetchParcelAccounts]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const handleOpenDateModal = () => {
    if (isDateModalOpen) {
      setIsDateModalOpen(false);
      return;
    }
    setDraftParcelCreatedFrom(parcelCreatedFrom);
    setDraftParcelCreatedTo(parcelCreatedTo);
    setIsDateModalOpen(true);
  };

  const applyDateFilter = (fromDate, toDate) => {
    if (!(fromDate && toDate)) return;
    setParcelCreatedFrom(fromDate);
    setParcelCreatedTo(toDate);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchParcelAccounts(1, searchQuery, true, fromDate, toDate);
    setIsDateModalOpen(false);
  };

  const handleClearDateFilter = () => {
    setParcelCreatedFrom('');
    setParcelCreatedTo('');
    setDraftParcelCreatedFrom('');
    setDraftParcelCreatedTo('');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchParcelAccounts(1, searchQuery, true, '', '');
    setIsDateModalOpen(false);
  };

  const handleRefreshFilters = () => {
    setSearchQuery('');
    setParcelCreatedFrom('');
    setParcelCreatedTo('');
    setDraftParcelCreatedFrom('');
    setDraftParcelCreatedTo('');
    setIsDateModalOpen(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchParcelAccounts(1, '', true, '', '');
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

  return (
    <div className="flex flex-col gap-12 mt-6">
      <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
        <div className="mb-4 flex items-center justify-start gap-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            className="w-full rounded-2xl border border-gray-300 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search parcel"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          {searchQuery && <button type="button" onClick={clearSearch} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800" aria-label="Clear search"><XMarkIcon className="h-5 w-5" /></button>}
          </div>
          <button type="button" onClick={submitSearch} className={`rounded-2xl px-4 py-2 ${ColorStyles.searchButtonColor}`}>Search</button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        ) : (
          <>
            <CardHeader
              variant="gradient"
              className={`mb-8 p-6 flex justify-between items-center rounded-xl ${ColorStyles.bgColor}`}
            >
              <Typography variant="h6" color="white">
                Bike details List
              </Typography>
              <div className="flex items-center gap-2">
                <Typography variant="h6" color="white">{pagination.totalItems} Bike{pagination.totalItems !== 1 ? 's' : ''} found</Typography>
              {type === 'Parcel' && (
                  <Button
                    className={`text-white ${ColorStyles.addButtonColor}`}
                    onClick={() =>
                      navigate('/dashboard/vendors/account/parcel/allVehicles/add', {
                        state: {
                          ownerName,
                          type: 'Parcel',
                          accountId: id,
                        },
                      })
                    }
                  >
                    Add new Bike
                  </Button>
                )}
                </div>
            </CardHeader>
            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto whitespace-nowrap">
                {accounts.length > 0 && (
                <thead>
                  <tr>
                      <th className="border-b border-gray-50 text-left py-3 px-5">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          Name
                        </Typography>
                      </th>
                      <th className="border-b border-gray-50 text-left py-3 px-5">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          company
                        </Typography>
                      </th>
                      <th className="border-b border-gray-50 text-left py-3 px-5">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          vehicleNumber
                        </Typography>
                      </th>
                      <th className="border-b border-gray-50 text-left py-3 px-5">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          Current Address
                        </Typography>
                      </th>
                      <th className="border-b border-gray-50 text-left py-3 px-5">
                        <div className="relative flex items-center gap-2">
                          <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                            Registration date
                          </Typography>
                        </div>
                      </th>
                      <th className="border-b border-gray-50 text-left py-3 px-5">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          Status
                        </Typography>
                      </th>
                  </tr>
                </thead>
                )}
                <tbody>
                  {accounts.length > 0 ? (
                    accounts.map(
                    (
                      {
                        id,
                        name,
                        company,
                        // vehicleType,
                        vehicleNumber,
                        created_at, 
                        Drivers 
                      },
                      key
                    ) => {
                      const className = `py-3 px-5 ${
                        key === accounts.length - 1 ? '' : 'border-b border-blue-gray-50'
                      }`;
                      return (
                        <tr key={id}>
                          <td className={className}>
                            
                            <Typography className="text-xs font-semibold text-blue-gray-900">{safeText(name)}</Typography>
                                
                              
                            
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {safeText(company)}
                              </Typography>
                          </td>
                          {/* <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {vehicleType}
                              </Typography>
                          </td> */}
                           <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {safeText(vehicleNumber)}
                              </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {safeText(Drivers?.[0]?.curAddress)}
                            </Typography>
                          </td>
                           <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {moment(created_at).format('DD-MM-YYYY')}
                              </Typography>
                          </td>
                          <td className={className}>
                            {Drivers?.[0]?.shiftAvailability === 'AVAILABLE' ? (
                              <Chip
                                value="ACTIVE"
                                color="green"
                                variant="ghost"
                                className="font-medium py-0.5 px-2 text-[11px] w-fit normal-case"
                              />
                            ) : (
                              <Chip
                                value="IN ACTIVE"
                                color="blue-gray"
                                variant="ghost"
                                className="font-medium py-0.5 px-2 text-[11px] w-fit normal-case"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 px-5 text-center">
                        <Typography variant="h6" color="white" className={`rounded-lg p-4 ${ColorStyles.bgColor}`}>
                          No Vehicles Available
                        </Typography>
                      </td>
                    </tr>
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
          </>
        )}
      </Card>
    </div>
  );
}

export default ParcelView;
