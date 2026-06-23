import React, { useEffect, useState, useCallback, useRef} from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Popover,
  PopoverHandler,
  PopoverContent,
  Checkbox,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import moment from "moment";
import { FaFilter } from "react-icons/fa";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function VehiclesList({ id = 0 }) {
  const [vehicleList, setVehicleList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(["All"]);
  const [subScriptionStatusFilter, setSubScriptionStatusFilter] = useState(["All"]);
  const [typeFilter, setTypeFilter] = useState(["All"]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
    search:'',
  });
  const prevSearchRef = useRef('');
  const [statusCheckedDriverIds, setStatusCheckedDriverIds] = useState([]);
  const navigate = useNavigate();

  const checkPresence = async (id)=>{
      try{
         const result = await ApiRequestUtils.post(API_ROUTES.CHECK_PRESENCE,{driverId:id});
      }
      catch(error){
  
      }
      finally{
        setStatusCheckedDriverIds(prev => [...prev, id]);
      }
    }

  const fetchCabList = async (page = 1, searchQuery = '', showLoader = false) => {
    if(showLoader) setLoading(true);
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_VEHICLESLIST, {
        id: id,
        page: page,
        limit: pagination.itemsPerPage,
        search:searchQuery.trim(),
      });
      if (data?.success) {
        setVehicleList(data.data || []);
        setPagination({
          currentPage: page,
          totalPages: data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
          search:searchQuery.trim(),
        });
      } else {
        console.error('API request failed:', data?.message);
      }
    } catch (error) {
      console.error('Error fetching vehicle list:', error);
    } finally {
      setLoading(false); 
    }
  };

  const getVehicles = useCallback(
    debounce((searchQuery) => {
      setPagination((prev) => ({
        ...prev,
        currentPage:1,
        search:searchQuery,
      }))
    },1000),
    []
  )

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== (pagination.search || '');
    prevSearchRef.current = pagination.search || '';
    fetchCabList(pagination.currentPage,pagination.search, !searchChanged);
  }, [id, pagination.currentPage, pagination.itemsPerPage, pagination.search]);

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

// const filteredVehicles = vehicleList.filter((vehicle) => {
//   const matchesSearch = ['name', 'carNumber', 'driverName'].some((field) => {
//     if (field === 'carNumber') {
//       const fieldValue = vehicle[field]?.toString().replace(/\s/g, '');
//       const query = searchQuery.replace(/\s/g, '');
//       return fieldValue?.includes(query);
//     } else {
//       const fieldValue = vehicle[field]?.toString().toLowerCase();
//       const query = searchQuery.toLowerCase();
//       return fieldValue?.includes(query);
//     }
//   });

//   const status = vehicle.Drivers[0]?.status || '';
//   const carType = vehicle.carType || '';
//     const subscriptionStatus = vehicle.subscriptionStatus || '';

//   return (
//     matchesSearch &&
//     (statusFilter.includes('All') || statusFilter.includes(status)) &&
//     (typeFilter.includes('All') || typeFilter.includes(carType))&&
//     (subScriptionStatusFilter.includes('All') || subScriptionStatusFilter.includes(subscriptionStatus) )
// );
// })

  const handleFilterChange = (filterType, value) => {
    if (filterType === "Drivers") {
      setStatusFilter((prev) => {
        if (value === "All") return ["All"];
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== "All"), value];
        return newFilter.length === 0 ? ["All"] : newFilter;
      });
    } else if (filterType === "carType") {
      setTypeFilter((prev) => {
        if (value === "All") return ["All"];
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== "All"), value];
        return newFilter.length === 0 ? ["All"] : newFilter;
      });
    }  else if(filterType === "subscriptionStatus") {
      setSubScriptionStatusFilter((prev) => {
        if (value === "All") return ["All"];
        const newFilter = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev.filter((item) => item !== "All"), value];
        return newFilter.length === 0 ? ["All"] : newFilter;
      });
    }
  };

  const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <div className="flex items-center cursor-pointer">
          <Typography
            variant="small"
            className="text-[11px] font-bold uppercase text-black mr-1"
          >
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



  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
        <div className="relative flex-grow max-w-[500px]">
          <input
            type="text"
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search vehicle"
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value);
                              getVehicles(e.target.value);
            }}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      <Card>
        {vehicleList.length > 0 ? (
          <>
            <CardHeader variant="gradient" className="mb-8 p-6 flex justify-between items-center bg-primary">
              <Typography variant="h6" color="white">All Cab List</Typography>
              <Typography variant="h6" color="white">{pagination.totalItems} Cab{pagination.totalItems !== 1 ? 's' : ''} found</Typography>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {["Driver Name", "Cab Name", "Phone Number","Vehicle Type", "Vehicle Number", "Address","Registration Date", "Available Status", "Subscription Status"].map((el) => (
                      <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                        {el === "Vehicle Type" ? (
                          <FilterPopover
                            title={el}
                            options={[
                              { value: "All" , label: "All"}, 
                              { value: "MINI", label: "Mini" },
                              { value: "MUV", label: "Muv" },
                              { value: "Sedan", label: "Sedan" },
                              { value: "SUV", label: "Suv" },
                            ]}
                            selectedFilters={typeFilter}
                            onFilterChange={(value) => handleFilterChange("carType", value)}
                          />
                        ) : el === "Subscription Status" ? (
                          <FilterPopover
                            title={el}
                            options={[
                              { value: "All" , label: "All"},
                              { value: "ACTIVE", label: "Active" },
                              { value: "IN_ACTIVE", label: "In_Active" },
                            ]}
                            selectedFilters={subScriptionStatusFilter}
                            onFilterChange={(value) => handleFilterChange("subscriptionStatus", value)}
                          />
                        ) : el === "Available Status" ? (
                          <FilterPopover
                            title={el}
                            options={[
                              { value: "All", label: "All" },
                              { value: "ACTIVE", label: "Active" },
                              { value: "IN_ACTIVE", label: "In_Active" },
                            ]}
                            selectedFilters={statusFilter}
                            onFilterChange={(value) => handleFilterChange("Drivers", value)}
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
                      <td colSpan={9} className="py-3 px-5">
                        <div className="flex justify-center items-center">
                          <Spinner className="h-12 w-12" />
                        </div>
                      </td>
                    </tr>
                  ) : (
                  vehicleList.filter(name => 
                    (statusFilter.includes('All') || statusFilter.includes(name?.Drivers[0]?.status)) &&
                    (typeFilter.includes('All') || typeFilter.includes(name?.carType))&&
                    (subScriptionStatusFilter.includes('All') || subScriptionStatusFilter.includes(name?.subscriptionStatus) )
                  ).map(
                    ({ id, driverName, name, vehicleType, carType, type, assigned,firstName,driverAddress,curAddress,Account, carNumber, Drivers, subscriptionStatus, phoneNumber,status, created_at }) => (                      
                    <tr key={id}>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">{Drivers[0]?.firstName || driverName || Account?.name || ''}</Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Link
                          className="underline cursor-pointer text-primary-600"
                          to={`/dashboard/vendors/account/allVehicles/details/${id}`}
                        >
                          <Typography className="text-xs font-semibold text-primary-600">{name}</Typography>
                        </Link>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">{Drivers?.[0]?.phoneNumber?.name || Drivers?.[0]?.phoneNumber || phoneNumber || "-"}</Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">{carType}</Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">{carNumber}</Typography>
                      </td>
                        <td className="py-3 px-5 border-b border-blue-gray-50">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                              {Drivers?.[0]?.curAddress?.name || Drivers?.[0]?.curAddress ||  driverAddress || curAddress || 'N/A'}
                          </Typography>
                        </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {moment(created_at).format('DD-MM-YYYY / hh:mm A')}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Chip
                          variant="ghost"
                          color={Drivers[0]?.status === "ACTIVE" ? "green" : "blue-gray"}
                          value={Drivers[0]?.status === "ACTIVE" ? "Active" : "In_Active"}
                          className="py-0.5 px-2 text-[11px] font-medium w-fit"
                        />
                         {Drivers[0]?.status === "ACTIVE" && statusCheckedDriverIds.indexOf(Drivers[0]?.id)==-1 &&  <Typography
                          className="text-xs font-semibold text-primary-900 underline cursor-pointer"
                          onClick={()=>checkPresence(Drivers[0]?.id)}
                        >
                          Check Status
                        </Typography>}
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Chip
                          variant="ghost"
                          color={subscriptionStatus === "ACTIVE" ? "green" : "blue-gray"}
                          value={subscriptionStatus === "ACTIVE" ? "Active" : "In_Active"}
                          className="py-0.5 px-2 text-[11px] font-medium w-fit"
                        />
                      </td>
                    </tr>
                  )))}
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
          </>
        ) : (
          <CardHeader variant="gradient" className="mb-8 p-6 bg-primary">
            <Typography variant="h6" color="white">No Vehicles Available</Typography>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}