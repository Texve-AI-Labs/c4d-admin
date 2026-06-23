import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { useEffect, useState, useCallback, useRef } from "react";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Popover,
  PopoverHandler,
  PopoverContent,
  Checkbox,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Spinner,
} from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import moment from "moment";

const DOC_VERIFICATION_PENDING_FILTERS_KEY = "docVerificationPendingFilters";
const isBrowser = () => typeof window !== "undefined";

const getItemSafe = (key) => {
  if (!isBrowser()) return null;
  try {
    return sessionStorage.getItem(key);
  } catch (err) {
    console.error(`Error reading sessionStorage key "${key}":`, err);
    return null;
  }
};

const setItemSafe = (key, value) => {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(key, value);
  } catch (err) {
    console.error(`Error writing sessionStorage key "${key}":`, err);
  }
};

const removeItemSafe = (key) => {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing sessionStorage key "${key}":`, err);
  }
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function PendingDocList() {
  const [accounts, setAccounts] = useState([]);
  const [typeFilter, setTypeFilter] = useState(["All"]);
  const [searchQuery, setSearchQuery] = useState(() => {
    const stored = getItemSafe(DOC_VERIFICATION_PENDING_FILTERS_KEY);
    if (!stored) return "";
    try {
      const parsed = JSON.parse(stored);
      return parsed.searchQuery || parsed.search || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(() => {
    const stored = getItemSafe(DOC_VERIFICATION_PENDING_FILTERS_KEY);
    if (!stored) {
      return {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 15,
        search: "",
      };
    }
    try {
      const parsed = JSON.parse(stored);
      return {
        currentPage: parsed.currentPage || 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 15,
        search: parsed.search || "",
      };
    } catch {
      return {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 15,
        search: "",
      };
    }
  });
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const navigate = useNavigate();
  const latestRequestIdRef = useRef(0);
  const prevSearchRef = useRef('');
  const resolveAccountType = (record = {}) => {
    const serviceType = record["Account.serviceType"];
    if (record["Register.id"] || record["Driver.id"] || serviceType == null || serviceType === "") return "Driver";
    if (serviceType === "Company") return "Account";
    if (serviceType === "Individual") return "Cab";
    if (serviceType === "Auto") return "Auto";
    if(serviceType === "Parcel") return "Parcel";
    return "";
  };

    const fetchDoc = async (page = 1, searchQuery = '', showLoader = true) => {
      const requestId = ++latestRequestIdRef.current;
      if(showLoader) setLoading(true); 
    try {
      const normalizedTypeFilter = Array.from(
        new Set(
          (Array.isArray(typeFilter) ? typeFilter : []).map((value) => {
            if (value === "All") return "";
            if (value === "") return "";
            if (value === "Account") return "Company";
            if (value === "Cab") return "Individual";
            if (value === "Driver") return "";
            return value;
          })
        )
      );
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_DOCUMENT_DETAILS_LIST + '/' + 'Pending',{
        page: page,
        limit: pagination.itemsPerPage,
        search:searchQuery.trim(),
        serviceType: JSON.stringify(normalizedTypeFilter),
      });
      if (requestId !== latestRequestIdRef.current) return;
      if (data?.success) {
        setAccounts(data?.data);
        setPagination({
          currentPage: page,
          totalPages: data?.pagination?.totalPages || 1,
          totalItems: data?.pagination?.totalItems || 0,
          itemsPerPage: data?.pagination?.itemsPerPage || 15,
          search:searchQuery.trim(),
        });
      }
      } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

    useEffect(() => {
      const stored = getItemSafe(DOC_VERIFICATION_PENDING_FILTERS_KEY);
      if (!stored) {
        setFiltersLoaded(true);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.typeFilter)) setTypeFilter(parsed.typeFilter);
        if (parsed.currentPage !== undefined || parsed.search !== undefined) {
          setPagination((prev) => ({
            ...prev,
            currentPage: parsed.currentPage || 1,
            search: parsed.search || "",
          }));
        }
        if (parsed.searchQuery !== undefined) {
          setSearchQuery(parsed.searchQuery || "");
        }
      } catch (err) {
        console.error("Failed to load pending document filters", err);
      } finally {
        setFiltersLoaded(true);
      }
    }, []);

    useEffect(() => {
      if (!filtersLoaded) return;
      const data = {
        typeFilter,
        currentPage: pagination.currentPage,
        search: pagination.search,
        searchQuery,
      };
      setItemSafe(DOC_VERIFICATION_PENDING_FILTERS_KEY, JSON.stringify(data));
    }, [filtersLoaded, typeFilter, pagination.currentPage, pagination.search, searchQuery]);

    const getDetails = useCallback(
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
    if (!filtersLoaded) return;
    const searchChanged = prevSearchRef.current !== (pagination.search || '');
    prevSearchRef.current = pagination.search || '';
    fetchDoc(pagination.currentPage, pagination.search, !searchChanged);
  }, [filtersLoaded, pagination.currentPage, pagination.itemsPerPage, pagination.search, typeFilter]);

  useEffect(() => {
    if (searchQuery.trim() === pagination.search) return;
    getDetails(searchQuery.trim());
  }, [searchQuery, pagination.search]);

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

  const handleRefresh = () => {
    setSearchQuery('');
    setTypeFilter(['All']);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 15,
      search: '',
    });
    removeItemSafe(DOC_VERIFICATION_PENDING_FILTERS_KEY);
  };

  // const getDetails = async (searchQuery) => {
  //   if (searchQuery && searchQuery.trim() !== "") {
  //     const query = searchQuery.toLowerCase().trim();

  //     const filteredAccounts = allAccounts.filter((acc) => {
  //       const name  = (acc['Register.firstName'] || acc['Driver.firstName'] || acc['Account.name'] || acc['Cab.name'] || "").toLowerCase();
  //       const phone = acc["Register.phoneNumber"] || acc["Driver.phoneNumber"] || acc["Account.phoneNumber"] || acc["Cab.phoneNumber"] || "";
  //       const phoneNumberWithoutCountryCode = phone.startsWith("+91") ? phone.slice(3) : phone;
  //       return (
  //         name.startsWith(query) ||
  //         phone.startsWith(query) ||
  //         phoneNumberWithoutCountryCode.startsWith(query)
  //       );
  //     });
  //     setAccounts(filteredAccounts);
  //   } else {
  //     setAccounts(allAccounts);
  //   }
  // };

  const handleFilterChange = (value) => {
    setTypeFilter((prev) => {
      if (value === "All") return ["All"];
      const newFilter = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev.filter((item) => item !== "All"), value];
      return newFilter.length === 0 ? ["All"] : newFilter;
    });
  };

  const onClickName = ( id , type) =>{
    return navigate(`/dashboard/doc-verification/pending/documents-details/${id}`,{
      state :{type:type},
    })
  }

  const FilterPopover = ({ title, options }) => (
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
              checked={typeFilter.includes(option.value)}
              onChange={() => handleFilterChange(option.value)}
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
        <div className="flex items-center justify-between">
          <div className="relative flex-grow max-w-[500px]">
            <input
              type="text"
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Search Document"
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value)}}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="ml-4">
            <button
              className="bg-primary-400 text-white px-4 py-2 rounded-2xl flex items-center gap-2 hover:bg-primary-500"
              onClick={() => handleRefresh()}
              disabled={loading}
            >
              {loading ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <img src="/img/refresh.png" alt="Refresh" className="w-4 h-4" />
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
      <Card>
         {(loading || accounts.length > 0) ? (
          <>
            <CardHeader
              variant="gradient"
              // color="gray"
              className={`mb-8 p-6 flex-1 justify-between items-center ${ColorStyles.bgColor}`}
            >
              <div className="flex justify-between">
              <Typography variant="h6" color="white">
                 Pending Documents List
              </Typography>
               <Typography variant="h6" color="white">
                {pagination.totalItems}
              </Typography>
              
              </div>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {[
                      "Full Name",
                      "Phone Number",
                      "Type",
                      "Source",
                      "Created Date",
                      "KYC Status",
                    ].map((el, index) => (
                      <th
                        key={index}
                        className="border-b border-blue-gray-50 py-3 px-5 text-left"
                      >
                        {el==='Type' ? (
                          <FilterPopover
                            title={el}
                            options={[
                              { value: "All", label: "All" },
                              // { value: null, label: "Driver" },
                              { value: "Company", label: "Account" },
                              { value: "Individual", label: "Cab" },
                              { value: "Auto", label: "Auto" },
                              { value: "Parcel", label: "Parcel" },
                            ]}
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
                    ): (accounts.map((data, key) => {
                        const className = `py-3 px-3 ${
                          key === accounts.length - 1 ? "" : "border-b border-blue-gray-50"
                        }`;

                        const status = data.isComplete ? "APPROVED" : "PENDING";
                        const name  = data['Register.firstName'] || data['Driver.firstName'] || data['Account.name'] || data['Cab.name'] || "";
                        const displayType = resolveAccountType(data);
                        const nameType = displayType === "Cab" ? "Account" : displayType;
                        const number = (() => {
                          const rawNumber = data["Register.phoneNumber"] || data["Driver.phoneNumber"] || data["Account.phoneNumber"] || data["Cab.phoneNumber"] || "";
                          return rawNumber ? rawNumber.startsWith("+91") ? rawNumber : `+91${rawNumber}`: "";
                        })();
                        const source = data["Driver.source"] || data["Account.source"];
                        const id = data["Cab.id"] ? data["Cab.id"] : data["Driver.id"] ?  data["Driver.id"] : data["Account.id"] ? data["Account.id"] : data["Register.id"] ? data["Register.id"] : data.id;
                        return (
                            <tr key={data?.id || key}>
                              <td className={className}>
                                <div className="flex items-center gap-4">
                                  <div onClick={() => onClickName(id, nameType)}>
                                    <Typography 
                                      variant="small"
                                      color="blue"
                                      className="font-semibold underline cursor-pointer">
                                      {name}
                                    </Typography>
                                  </div>
                                </div>
                              </td>
                              <td className={className}>
                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                  {number}
                                </Typography>
                              </td>
                              <td className={className}>
                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                  {displayType}
                                </Typography>
                              </td>
                              <td className={className}>
                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                  {source}
                                </Typography>
                              </td>
                              <td className={className}>
                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                  {moment(data?.latest_created_at).format("DD-MM-YYYY")}
                                </Typography>
                              </td>
                              <td className={className}>
                                <Typography
                                variant="ghost"
                                  className={`px-2 w-fit rounded-xl text-xs font-semibold ${data.isComplete ? "bg-green-100 text-green-500" : "bg-primary-100 text-primary-500"}`}
                                >
                                  {status}
                                </Typography>
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
          </>):(
          <CardHeader variant="gradient"  className={`mb-8 p-6 ${ColorStyles.bgColor}`}>
            <Typography variant="h6" color="white">
              No Documents
            </Typography>
          </CardHeader>
        )
      }
      </Card>
    </div>
  );
}
