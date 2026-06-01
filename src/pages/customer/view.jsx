import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Alert,
  Spinner
} from "@material-tailwind/react";
import CustomerSearch from "@/components/CustomerSearch";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon, StarIcon } from '@heroicons/react/24/solid';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function CustomerView() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [alert, setAlert] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('All');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    search: '',
    forSearch:false
  });

  const location = useLocation();

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


  const getCustomers = useCallback(
    debounce((searchQuery) => {
      setPagination((prev) => ({
        ...prev,
        currentPage: 1,
        search: searchQuery
      }));
    }, 1000),
    [pagination.itemsPerPage] 
  );

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
      <CustomerSearch onSearch={getCustomers} />
      <div className="flex justify-end">
        <div className="w-full sm:w-72">
          <label htmlFor="zoneFilter" className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
          <select
            id="zoneFilter"
            value={zoneFilter}
            onChange={handleZoneFilterChange}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="All">All</option>
            {serviceAreas.map((area) => (
              <option key={area?.id || area?.name} value={area?.name || ''}>
                {area?.name || ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Card>
        {customers.length > 0 ? (
          <>
            <CardHeader variant="gradient" className={`mb-8 p-6 rounded-xl ${ColorStyles.bgColor}`}>
              <div className="flex justify-between items-center">
                <Typography variant="h6" color="white">
                  Customers List
                </Typography>
                {/* <Button
                  size="sm"
                  className='bg-red-500 text-white'
                  onClick={handleExportExcel}
                  disabled={loading}
                >
                  {loading ? 'Exporting...' : 'Export to Excel'}
                </Button> */}
              </div>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {["ID","Name", "Phone Number","Rating","Zone", ""].map((el) => (
                      <th
                        key={el}
                        className="border-b border-blue-gray-50 py-3 px-5 text-left cursor-pointer"
                        onClick={() => {
                          setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                          const sorted = [...customers].sort((a, b) => {
                            const aRating = a.rating ?? 0;
                            const bRating = b.rating ?? 0;
                            return sortOrder === 'asc' ? aRating - bRating : bRating - aRating;
                          });
                          setCustomers(sorted);
                        }}

                      >
                        <div className="flex items-center">
                          <Typography
                            variant="small"
                            className="text-[11px] font-bold uppercase text-black"
                          >
                            {el}
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
          <CardHeader variant="gradient"  className={`mb-8 p-6 ${ColorStyles.bgColor}`}>
            <Typography variant="h6" color="white">
              No Customers
            </Typography>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}

export default CustomerView;
