import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Alert,
  Spinner,
  Popover,
  PopoverHandler,
  PopoverContent,
  Checkbox
} from "@material-tailwind/react";
import CustomerSearch from "@/components/CustomerSearch";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon, StarIcon } from '@heroicons/react/24/solid';
import { FaFilter } from 'react-icons/fa';

const CUSTOMER_LIST_FILTERS_KEY = 'customerListFilters';

const getStoredCustomerFilters = () => {
  if (typeof window === 'undefined') return { search: '', zone: 'All' };

  try {
    const storedFilters = sessionStorage.getItem(CUSTOMER_LIST_FILTERS_KEY);
    return storedFilters ? JSON.parse(storedFilters) : { search: '', zone: 'All' };
  } catch (error) {
    return { search: '', zone: 'All' };
  }
};

export function CustomerView() {
  const navigate = useNavigate();
  const storedFilters = getStoredCustomerFilters();
  const [customers, setCustomers] = useState([]);
  const [alert, setAlert] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [zoneFilter, setZoneFilter] = useState(storedFilters.zone || 'All');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    search: storedFilters.search || '',
    forSearch:false
  });

  const location = useLocation();

  useEffect(() => {
    try {
      sessionStorage.setItem(CUSTOMER_LIST_FILTERS_KEY, JSON.stringify({
        search: pagination.search,
        zone: zoneFilter
      }));
    } catch (error) {
      console.error('Unable to store customer filters:', error);
    }
  }, [pagination.search, zoneFilter]);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS, {
          type: 'Service Area',
        });
        setServiceAreas(response?.data || []);
      } catch (error) {
        console.error('Error fetching service areas:', error);
      }
    };

    fetchGeoData();
  }, []);

  const fetchCustomers = async (page = 1, searchQuery = '', showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const normalizedSearch = searchQuery.trim();
      const isSearchMode = Boolean(normalizedSearch);
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_CUSTOMERS,{
        page: page,
        limit: pagination.itemsPerPage,
        search: normalizedSearch,
        zone: zoneFilter === 'All' ? undefined : zoneFilter,
        forSearch: isSearchMode
      });
      if (data?.success) {
        setCustomers(data?.data || []);
        setPagination({
          currentPage: page,
          totalPages: data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 10,
          search: normalizedSearch,
          forSearch: isSearchMode,
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleExportExcel = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await ApiRequestUtils.fetchExcelDownload(API_ROUTES.EXPORT_EXCEL_CUSTOMER_DETAILS);
  //     const blob = new Blob([response.data], {
  //       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //     });

  //     let filename = 'customers.xlsx';
  //     if (response.headers['content-disposition']) {
  //       const match = response.headers['content-disposition'].match(/filename="(.+)"/);
  //       if (match && match[1]) filename = match[1];
  //     }

  //     saveAs(blob, filename);
  //   } catch (err) {
  //     console.error('Export error:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const getCustomers = useCallback((searchQuery) => {
      setPagination((prev) => ({
        ...prev,
        currentPage: 1,
        search: searchQuery
      }));
    }, []);

  useEffect(() => {
    fetchCustomers(pagination.currentPage, pagination.search, true);
  }, [pagination.currentPage, pagination.search, zoneFilter]);

  useEffect(() => {
    if (location.state?.customerAdded || location.state?.customerUpdated) {
      const action = location.state.customerAdded ? 'added' : 'updated';
      setAlert({
        message: `${location.state.customerName} ${action} successfully!`
      });
      setTimeout(() => {
        setAlert(null)
      }, 5000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const handleZoneFilterChange = (event) => {
    const nextZone = event.target.value;
    setZoneFilter(nextZone);
    setPagination((prev) => ({
      ...prev,
      currentPage: 1
    }));
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

  const formatPhoneNumber = (phoneNumber) => {
    if (phoneNumber) {
      return phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`;
    }
    return '';
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      {alert && (
        <div className='mb-2'>
        <Alert
          color='blue'
          className='py-3 px-6 rounded-xl'
        >
          {alert.message}
        </Alert>
      </div>)}
      <Card className="p-4 bg-gray-50">
        <CustomerSearch onSearch={getCustomers} initialSearch={pagination.search} />
      </Card>
      <Card>
        {customers.length > 0 ? (
          <>
            <CardHeader variant="gradient" className={`mb-8 p-6 rounded-xl ${ColorStyles.bgColor}`}>
              <div className="flex justify-between items-center">
                <Typography variant="h6" color="white">
                  Customers List
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {["ID","Name", "Phone Number","Rating","Zone", ""].map((el) => (
                      <th
                        key={el}
                        className={`border-b border-blue-gray-50 py-3 px-5 text-left ${el === 'Rating' ? 'cursor-pointer' : ''}`}
                        onClick={el === 'Rating' ? () => {
                          setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                          const sorted = [...customers].sort((a, b) => {
                            const aRating = a.rating ?? 0;
                            const bRating = b.rating ?? 0;
                            return sortOrder === 'asc' ? aRating - bRating : bRating - aRating;
                          });
                          setCustomers(sorted);
                        } : undefined}

                      >
                        <div className="flex items-center">
                          <Typography
                            variant="small"
                            className="text-[11px] font-bold uppercase text-black"
                          >
                            {el === 'Zone' ? (
                              <Popover placement="bottom-start">
                                <PopoverHandler>
                                  <div className="flex items-center cursor-pointer">
                                    <Typography variant="small" className="text-[11px] font-bold uppercase mr-1 text-black">
                                      {zoneFilter === 'All' ? 'Zone' : `Zone: ${zoneFilter}`}
                                    </Typography>
                                    <FaFilter className="text-black text-xs" />
                                  </div>
                                </PopoverHandler>
                                <PopoverContent className="p-2 z-10 max-h-[540px] overflow-y-auto">
                                  {[{ value: 'All', label: 'All' }, ...serviceAreas.map((area) => ({ value: area?.name, label: area?.name }))].map((option) => (
                                    <div key={option.value} className="flex items-center mb-2">
                                      <Checkbox
                                        color="blue"
                                        checked={zoneFilter === option.value}
                                        onChange={() => {
                                          setZoneFilter(option.value);
                                          setPagination((prev) => ({ ...prev, currentPage: 1 }));
                                        }}
                                      />
                                      <Typography color="blue-gray" className="font-medium ml-2">
                                        {option.label}
                                      </Typography>
                                    </div>
                                  ))}
                                </PopoverContent>
                              </Popover>
                            ) : el}
                          </Typography>
                          {el === 'Rating' && (
                            sortOrder === 'asc' ? (
                              <ChevronUpIcon className="w-4 h-4 ml-1 text-black" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 ml-1 text-black" />
                            )
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-3 px-5">
                        <div className="flex justify-center items-center">
                          <Spinner className="h-12 w-12" />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map(
                    ({ id, firstName, lastName, phoneNumber, rating,zone }, key) => {
                      const className = `py-3 px-5 ${key === customers.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                        }`;

                      return (
                        <tr key={id}>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-black">
                              {id}
                            </Typography>
                          </td>
                          <td className={className}>
                            <div className="flex items-center gap-4">
                              <Link to={`/dashboard/customers/details/${id}`}>
                                <Typography
                                  variant="small"
                                  color="blue"
                                  className="font-semibold underline cursor-pointer"
                                >
                                  {firstName}
                                </Typography>
                              </Link>
                            </div>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-black"> 
                              {/* text-blue-gray-600 */}
                              {formatPhoneNumber(phoneNumber)}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-black">
                              <div className='flex'>
                                {rating}<StarIcon className="w-5 h-5 text-yellow-500" />                  
                              </div> 
                              </Typography>
                          </td>
                           <td className={className}>
                            <Typography className="text-xs font-semibold text-black"> 
                              {zone}
                              </Typography>
                          </td>
                          {/* <td className={className}>
                        <Chip
                          variant="gradient"
                          color={online ? "green" : "blue-gray"}
                          value={online ? "online" : "offline"}
                          className="py-0.5 px-2 text-[11px] font-medium w-fit"
                        />
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          
                        </Typography>
                      </td> */}
                          <td className={className}>
                            {/* <Button
                              as="a"
                              onClick={() => navigate(`/dashboard/customers/details/${id}`)}
                              className="text-xs font-semibold text-white mr-3"
                            >
                              View
                            </Button> */}
                            <Link to={`/dashboard/customers/edit/${id}`}>
                            <Button
                              className="text-xs font-semibold bg-[#1A73E8] text-white"
                            >
                              Edit
                            </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    }
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
            </CardBody>
          </>) : (
          <CardHeader variant="gradient" className={`mb-8 p-6 rounded-xl ${ColorStyles.bgColor}`}>
            <div className="flex justify-between items-center">
              <Typography variant="h6" color="white">
                No Customers
              </Typography>
              <Popover placement="bottom-start">
                <PopoverHandler>
                  <div className="flex items-center cursor-pointer">
                    <Typography variant="small" className="text-[11px] font-bold uppercase mr-1 text-white">
                      {zoneFilter === 'All' ? 'Zone' : `Zone: ${zoneFilter}`}
                    </Typography>
                    <FaFilter className="text-white text-xs" />
                  </div>
                </PopoverHandler>
                <PopoverContent className="p-2 z-10 max-h-[540px] overflow-y-auto">
                  {[{ value: 'All', label: 'All' }, ...serviceAreas.map((area) => ({ value: area?.name, label: area?.name }))].map((option) => (
                    <div key={option.value} className="flex items-center mb-2">
                      <Checkbox
                        color="blue"
                        checked={zoneFilter === option.value}
                        onChange={() => {
                          setZoneFilter(option.value);
                          setPagination((prev) => ({ ...prev, currentPage: 1 }));
                        }}
                      />
                      <Typography color="blue-gray" className="font-medium ml-2">
                        {option.label}
                      </Typography>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}

export default CustomerView;
