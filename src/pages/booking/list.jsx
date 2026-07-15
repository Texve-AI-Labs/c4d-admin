import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Card,
    CardBody,
    Typography,
    Button,
    Chip,
    Popover,
    PopoverHandler,
    PopoverContent,
    Checkbox,
    IconButton,
    Spinner,
} from "@material-tailwind/react";
import { FaArrowRight, FaFilter, FaChartBar, FaClipboardList,FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaUsers, FaSync, FaPhone, FaUser } from 'react-icons/fa';
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, BOOKING_STATUS, ColorStyles } from "@/utils/constants";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import moment from "moment";
import { useBookingQuerySummary } from "./hooks/useBookingQuerySummary";
import { useBookingSummaryRealtime } from "./hooks/useBookingSummaryRealtime";
import { useRealtimeEvents } from "@/context/realtimeEvents";
// import DateRangeFilter from './DateRangeFilter';

const isBrowser = () => typeof window !== 'undefined';

const toStorageScope = (pathname = '') => {
    const normalized = String(pathname || '').toLowerCase();
    const scope = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return scope || 'dashboard_booking';
};

const getBookingFiltersKey = (pathname) => `bookingFilters_${toStorageScope(pathname)}`;
const getBookingSearchKey = (pathname) => `bookingSearchId_${toStorageScope(pathname)}`;
const LEGACY_BOOKING_FILTERS_KEY = 'bookingListFilters';
const LEGACY_BOOKING_SEARCH_KEY = 'bookingSearchId';
const getDateFilterFromTab = (tab) =>
    tab === 'TODAY' ? 'Today' : tab === 'REMAINING' ? 'Future' : tab === 'CUSTOM_DATE' ? 'Custom date' : 'All';

const getItemSafe = (key) => {
    if (!isBrowser()) return null;
    try {
        return sessionStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting sessionStorage key "${key}":`, error);
        return null;
    }
};

const setItemSafe = (key, value) => {
    if (!isBrowser()) return;
    try {
        sessionStorage.setItem(key, value);
    } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
    }
};

const getLocalItemSafe = (key) => {
    if (!isBrowser()) return null;
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting localStorage key "${key}":`, error);
        return null;
    }
};

const loadBookingFilters = ({ filtersKey, setActiveTab, setStatusFilter, setServiceTypeFilter, setSourceFilter, setTripCoordinatorFilter, setZoneFilter, setDateFilter, setCustomDateFrom, setCustomDateTo, setPagination, setFiltersLoaded }) => {
    try {
        let storedFilters = getItemSafe(filtersKey);
        if (!storedFilters) {
            const legacyFilters = getItemSafe(LEGACY_BOOKING_FILTERS_KEY);
            if (legacyFilters) {
                storedFilters = legacyFilters;
                setItemSafe(filtersKey, legacyFilters);
            }
        }
        if (!storedFilters) {
            setFiltersLoaded(true);
            return;
        }

        const parsed = JSON.parse(storedFilters);

        const restoredActiveTab = parsed.activeTab || 'ALL_BOOKINGS';
        setActiveTab(restoredActiveTab);
        if (Array.isArray(parsed.statusFilter)) setStatusFilter(parsed.statusFilter);
        if (Array.isArray(parsed.serviceTypeFilter)) setServiceTypeFilter(parsed.serviceTypeFilter);
        if (Array.isArray(parsed.sourceFilter)) setSourceFilter(parsed.sourceFilter);
        if (Array.isArray(parsed.tripCoordinatorFilter)) setTripCoordinatorFilter(parsed.tripCoordinatorFilter);
        if (Array.isArray(parsed.zoneFilter)) setZoneFilter(parsed.zoneFilter);
        // Keep date filter strictly derived from active tab to avoid UI/API mismatch.
        setDateFilter(getDateFilterFromTab(restoredActiveTab));
        if (parsed.customDateFrom) setCustomDateFrom(parsed.customDateFrom);
        if (parsed.customDateTo) setCustomDateTo(parsed.customDateTo);
        if (typeof parsed.currentPage === 'number') {
            setPagination((prev) => ({
                ...prev,
                currentPage: parsed.currentPage,
            }));
        }
    } catch (error) {
        console.error('Error loading booking list filters from sessionStorage:', error);
    } finally {
        setFiltersLoaded(true);
    }
};

        const getInitialActiveTab = (filtersKey) => {
            try {
                const storedFilters = getItemSafe(filtersKey);
                if (!storedFilters) {
                    const legacyFilters = getItemSafe(LEGACY_BOOKING_FILTERS_KEY);
                    if (!legacyFilters) return "ALL_BOOKINGS";
                    const parsedLegacy = JSON.parse(legacyFilters);
                    return parsedLegacy.activeTab || "ALL_BOOKINGS";
                }
                const parsed = JSON.parse(storedFilters);
                return parsed.activeTab || "ALL_BOOKINGS";
            } catch (error) {
                console.error('Error reading initial activeTab from sessionStorage:', error);
                return "ALL_BOOKINGS";
            }
        };

export function BookingsList({  onRegisterRefresh , customerId = 0, searchBookingId = '', bookingStage, onAssignDriver, onSelectBooking, type, setIsOpen = false, onTypeChange }) {
    const navigate = useNavigate();
    const location = useLocation();
    const bookingFeatures = useMemo(() => {
        const features = [];
        const normalizedType = String(type || "").toUpperCase();
        const normalizedPath = String(location.pathname || "").toLowerCase();

        if (normalizedType === "RETURN_TRIPS" || normalizedPath.includes("/booking/list/returntrips")) {
            features.push("RETURN_TRIPS");
        }
        if (normalizedType === "BIKE" || normalizedPath.includes("/dashboard/bike-taxi")) {
            features.push("BIKE");
        }

        return features;
    }, [type, location.pathname]);
    const hasFeature = (feature) => bookingFeatures.includes(feature);
    const bookingFiltersKey = getBookingFiltersKey(location.pathname);
    const bookingSearchKey = getBookingSearchKey(location.pathname);
    const [bookingsList, setBookingsList] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [activeTab, setActiveTab] = useState(() => getInitialActiveTab(bookingFiltersKey));
    const [statusFilter, setStatusFilter] = useState(['All']);
    const [serviceTypeFilter, setServiceTypeFilter] = useState(['All']);
    const [sourceFilter, setSourceFilter] = useState(['All']);
    const [tripCoordinatorFilter, setTripCoordinatorFilter] = useState(['All']);
    const [zoneFilter, setZoneFilter] = useState(['All']);
    const [showPickedBooking, setShowPickedBooking] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 15,
    });
    const [nameSortConfig, setNameSortConfig] = useState({ key: 'firstName', direction: 'ascending' });
    const [loading, setLoading] = useState(true);
    const [loadingStates, setLoadingStates] = useState({});
    const [userId, setUserId] = useState(null);  
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedBookingForReassign, setSelectedBookingForReassign] = useState(null);
    const [showSupportApprovalModal, setShowSupportApprovalModal] = useState(false);
    const [selectedBookingForSupportApproval, setSelectedBookingForSupportApproval] = useState(null);
    const [supportApprovalDecision, setSupportApprovalDecision] = useState('END_TRIP');
    const [supportApprovalReasonDetails, setSupportApprovalReasonDetails] = useState('');
    const [counts, setCounts] = useState({ endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount:"0", uniqueCustomerPerDayBookingCount:"0"});
    const [dateFilter, setDateFilter] = useState('All');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [isManualDateFilter, setIsManualDateFilter] = useState(false);
    const [filtersLoaded, setFiltersLoaded] = useState(false);
    const [effectiveSearchId, setEffectiveSearchId] = useState(searchBookingId);
    const [serviceAreas, setServiceAreas] = useState([]);
    const [onlineDrivers, setOnlineDrivers] = useState([]);
    const [selectedHour, setSelectedHour] = useState(moment().hour()); 
    const [selectedDriver, setSelectedDriver] = useState(null); 
    const [selectedTime, setSelectedTime] = useState(moment().format(' hh:mm A')); 
    const [totalDriverCount, setTotalDriverCount] = useState(0);
    const [showDriverHours, setShowDriverHours] = useState(false);
    const [isCustomDatePopoverOpen, setIsCustomDatePopoverOpen] = useState(false);
    const [followupLoading, setFollowupLoading] = useState({});
    const [allUsers, setAllUsers] = useState([]); 
    const latestRequestRef = useRef(0);
    const summaryRequestRef = useRef(0);
    const { updateHomeTotalPendings, updateInquiryTotalPendings } = useRealtimeEvents();

    const getInquiryTypeFromPath = (pathname = "") => {
        const path = String(pathname || "").toLowerCase();
        if (path.startsWith("/dashboard/booking/list/rides")) return "RIDES";
        if (path.startsWith("/dashboard/booking/list/rentals")) return "RENTAL";
        if (path.startsWith("/dashboard/booking/list/cabbooking")) return "CAB_BOOKING";
        if (path.startsWith("/dashboard/booking/list/carwash")) return "CAR_WASH";
        if (path.startsWith("/dashboard/booking/list/actingdriver")) return "DRIVER";
        if (path.startsWith("/dashboard/booking/list/parcel")) return "PARCEL";
        if (path.startsWith("/dashboard/booking/list/returntrips")) return "RETURN_TRIPS";
        if (path.startsWith("/dashboard/auto")) return "AUTO";
        if (path.startsWith("/dashboard/bike-taxi")) return "BIKE";
        if (path.startsWith("/dashboard/booking/list")) return "ALL_CABS";
        return "";
    };

// useEffect(() => {
//     try {
//         const normalizedPath = String(location.pathname || "").toLowerCase();
//         const getInquiryTypeFromPath = (path) => {
//             if (path.startsWith("/dashboard/auto")) return "AUTO";
//             if (path.startsWith("/dashboard/booking/list/rides")) return "RIDES";
//             if (path.startsWith("/dashboard/booking/list/rentals")) return "RENTAL";
//             if (path.startsWith("/dashboard/booking/list/cabbooking")) return "CAB";
//             if (path.startsWith("/dashboard/booking/list/carwash")) return "CAR_WASH";
//             if (path.startsWith("/dashboard/booking/list/actingdriver")) return "DRIVER";
//             if (path.startsWith("/dashboard/booking/list/parcel")) return "PARCEL";
//             if (path.startsWith("/dashboard/booking/list")) return "ALL_CABS";
//             return "";
//         };
//         const normalizeType = (rawType) => {
//             const value = String(rawType || "").trim().toUpperCase();
//             if (value === "CAB_BOOKING") return "CAB";
//             return value;
//         };
//         const isHomeBookingView = normalizedPath === "/dashboard/booking" && (!type || String(type).trim() === "");
//         const isAllInquiriesView =
//             normalizedPath.startsWith("/dashboard/booking/list") ||
//             normalizedPath.startsWith("/dashboard/auto");
//         const totalPendings = String(counts?.totalPendings ?? "0");
//         const inquiryType = getInquiryTypeFromPath(normalizedPath) || normalizeType(type) || "ALL_CABS";

//         if (isHomeBookingView) {
//             sessionStorage.setItem("totalPendings", totalPendings);
//             sessionStorage.setItem("bookingCounts", JSON.stringify(counts || {}));
//             window.dispatchEvent(
//                 new CustomEvent("booking-count-updated", {
//                     detail: { scope: "home", totalPendings },
//                 })
//             );
//         }

//         if (isAllInquiriesView) {
//             const key = `sidebar.inquiries.${inquiryType}.totalPendings`;
//             sessionStorage.setItem(key, totalPendings);
//             window.dispatchEvent(
//                 new CustomEvent("booking-count-updated", {
//                     detail: { scope: "all-inquiries", totalPendings, inquiryType },
//                 })
//             );
//         }
//     } catch (error) {
//         console.error("Error syncing booking counts to sessionStorage:", error);
//     }
// }, [counts, location.pathname, type]);

useEffect(() => {
  const storedUser = getLocalItemSafe('loggedInUser');
  if (storedUser) {
    const userData = JSON.parse(storedUser);     
    setUserId(userData.id); 
  } else {
    console.warn('No loggedInUser found in localStorage');
  }
}, []);

useEffect(() => {
  if (onlineDrivers.length > 0) {
    const driverData = onlineDrivers.find(driver => {
      const driverTime = moment(driver.date_time).hour();
      return driverTime === selectedHour;
    });
    setSelectedDriver(driverData || { count: 0 });
    // Keep initial time as 12:08 unless a box is clicked
  } else {
    setSelectedDriver({ count: 0 });
  }
}, [onlineDrivers, selectedHour]);

useEffect(() => {
    const fetchAllUsers = async () => {
        try {
            const response = await ApiRequestUtils.get(API_ROUTES.GET_ALL_USERS);
            if (response?.success) {
                setAllUsers(response?.data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    
    fetchAllUsers();
}, []);

    useEffect(() => {
        setFiltersLoaded(false);
        loadBookingFilters({
            filtersKey: bookingFiltersKey,
            setActiveTab,
            setStatusFilter,
            setServiceTypeFilter,
            setSourceFilter,
            setTripCoordinatorFilter,
            setZoneFilter,
            setDateFilter,
            setCustomDateFrom,
            setCustomDateTo,
            setPagination,
            setFiltersLoaded,
        });
    }, [bookingFiltersKey]);

    useEffect(() => {
        if (!filtersLoaded) return;
        try {
            const filtersToStore = {
                activeTab,
                statusFilter,
                serviceTypeFilter,
                sourceFilter,
                tripCoordinatorFilter,
                zoneFilter,
                dateFilter,
                customDateFrom,
                customDateTo,
                currentPage: pagination.currentPage,
            };
            setItemSafe(bookingFiltersKey, JSON.stringify(filtersToStore));
        } catch (error) {
            console.error('Error saving booking list filters to sessionStorage:', error);
        }
    }, [filtersLoaded, bookingFiltersKey, activeTab, statusFilter, serviceTypeFilter, sourceFilter, tripCoordinatorFilter, zoneFilter, dateFilter, customDateFrom, customDateTo, pagination.currentPage]);

    useEffect(() => {
        const stored = getItemSafe(bookingSearchKey) || getItemSafe(LEGACY_BOOKING_SEARCH_KEY) || '';
        const newEffective = searchBookingId || stored;
        setEffectiveSearchId(newEffective);
        if (newEffective) {
            setItemSafe(bookingSearchKey, newEffective);
        } else if (!searchBookingId) {
            setItemSafe(bookingSearchKey, '');
        }
    }, [searchBookingId, bookingSearchKey]);
    const handleToggleDriverHours = () => {
  setShowDriverHours(true);
};
    
    const handleHourSelect = (hour) => {
  setSelectedHour(hour);
  const driverData = onlineDrivers.find(driver => moment(driver.date_time).hour() === hour);
  setSelectedDriver(driverData || { count: 0 });
  setSelectedTime(driverData ? moment(driverData.date_time).format(' hh:mm A') : moment().format(' hh:mm A'));
  setShowDriverHours(false); // Hide the popup after selection
};

const {fetchBookingSummary,buildSummaryQueryParams} = useBookingQuerySummary({pagination,statusFilter,sourceFilter,tripCoordinatorFilter,zoneFilter,effectiveSearchId,activeTab,dateFilter,customDateFrom,customDateTo,customerId,type,summaryRequestRef,setCounts,});
const fetchServiceAreas = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
            if (response?.success) {
                const areas = response.data.filter(area => area.type === 'Service Area');
                setServiceAreas(areas);
            }
        } catch (err) {
            console.error("Failed to load service areas for filter:", err);
        }
    };

    useEffect(() => {
        fetchServiceAreas();
    }, []);
    // useEffect(() => {
    //     if (isReturnTripsList && activeTab !== "TODAY") {
    //         setActiveTab("TODAY");
    //         setDateFilter("Today");
    //         setIsCustomDatePopoverOpen(false);
    //     }
    // }, [isReturnTripsList, activeTab]);
const handleTabChange = (value) => {
    if (typeof value !== 'string') {
        console.warn('Unexpected value in handleTabChange:', value);
        return;
    }
    if (value !== activeTab) {
        // console.log('Tab changed to:', value);
        setActiveTab(value);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        // Reset all filters when switching tabs
        const resetStatusFilter = ['All'];
        const resetServiceTypeFilter = ['All'];
        const resetSourceFilter = ['All'];
        const resetTripCoordinatorFilter = ['All'];
        const resetZoneFilter = ['All'];
        setStatusFilter(resetStatusFilter);
        setServiceTypeFilter(resetServiceTypeFilter);
        setSourceFilter(resetSourceFilter);
        setTripCoordinatorFilter(resetTripCoordinatorFilter);
        setZoneFilter(resetZoneFilter);
                setCustomDateFrom('');
                setCustomDateTo('');
        setDateFilter(getDateFilterFromTab(value));

            if (value === 'CUSTOM_DATE') {
                setIsCustomDatePopoverOpen(true);
            } else {
                setIsCustomDatePopoverOpen(false);
            }
        }
    };

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'status') {
            setStatusFilter(prev => {
                if (value === 'All') {
                    return ['All'];
                } else {
                    const newFilter = prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev.filter(item => item !== 'All'), value];
                    return newFilter.length === 0 ? ['All'] : newFilter;
                }
            });
        } else if (filterType === 'serviceType') {
            setServiceTypeFilter(prev => {
                if (value === 'All') {
                    return ['All'];
                } else {
                    const newFilter = prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev.filter(item => item !== 'All'), value];
                    return newFilter.length === 0 ? ['All'] : newFilter;
                }
            });
        }
        else if (filterType === 'source') {
            setSourceFilter(prev => {
                if (value === 'All') {
                    return ['All'];
                } else {
                    const newFilter = prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev.filter(item => item !== 'All'), value];
                    return newFilter.length === 0 ? ['All'] : newFilter;
                }
            })
        }         
        else if (filterType === 'tripCoordinator') {
            setTripCoordinatorFilter(prev => {
                if (value === 'All') {
                    return ['All'];
                } else {
                    const newFilter = prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev.filter(item => item !== 'All'), value];
                    return newFilter.length === 0 ? ['All'] : newFilter;
                }
            });
        }
        else if (filterType === 'zone') {
            setZoneFilter(prev => {
                if (value === 'All') {
                    return ['All'];
                } else {
                    const newFilter = prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev.filter(item => item !== 'All'), value];
                    return newFilter.length === 0 ? ['All'] : newFilter;
                }
            });
        }
    };
    const FilterPopover = ({ title, options, selectedFilters, onFilterChange, customContent }) => (
        <Popover placement="bottom-start">
            <PopoverHandler>
                <div className="flex items-center cursor-pointer">
                    <Typography variant="small" className="text-[11px] font-bold uppercase mr-1 text-white">
                        {title}
                    </Typography>
                    <FaFilter className="text-white text-xs" />
                </div>
            </PopoverHandler>
            <PopoverContent className="p-2 z-10 max-h-[540px] overflow-y-auto">
                {customContent ? (
                    customContent
                ) : (
                    options.map((option) => (
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
                    ))
                )}
            </PopoverContent>
        </Popover>
    );

    const paramsPassed = location.state;

    useEffect(() => {
        if (activeTab && onTypeChange) {
            onTypeChange(activeTab);
        }
    }, [activeTab ,onTypeChange]);

    const getBookingsList = async (page = 1) => {
        // For custom date tab, only hit API when both dates are selected
        if (activeTab === 'CUSTOM_DATE' && (!customDateFrom || !customDateTo)) {return;}
        const currentRequestId = ++latestRequestRef.current;
        setLoading(true);
    try {
      const filterType = {
    type: activeTab,
    source: sourceFilter,
    tripCoordinator: tripCoordinatorFilter,
    zone: zoneFilter.includes('All') ? ['All'] : zoneFilter,
};

// Only add status-related fields if NOT "All"
if (!statusFilter.includes('All')) {
    filterType.status = statusFilter;
    filterType.tripStatus = statusFilter.includes('COMPLETED') ? true : statusFilter.includes('ENDED') ? false : undefined;
}
        // Calculate startDate and endDate based on dateFilter
        let startDate = '';
        let endDate = '';

        if (activeTab === 'TODAY') {
            const today = moment().format('YYYY-MM-DD');
            startDate = today;
            endDate = today;
        } else if (activeTab === 'REMAINING') {
            const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
            startDate = tomorrow;
            endDate = "";
        } else if (dateFilter === 'Last 7 days') {
            startDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
            endDate = moment().format('YYYY-MM-DD');
        } else if (activeTab === 'CUSTOM_DATE') {
            startDate = customDateFrom;
            endDate = customDateTo;
        } else {
            // All bookings (no date filter)
            startDate = '';
            endDate = '';
        }
        
        const queryParams = {
            "customerId": customerId,
            'type': type ? type : '',
            'page': page,
            'limit': pagination.itemsPerPage,
            'filterType': JSON.stringify(filterType),
            'bookingNumber': effectiveSearchId,
        };
        
        // Add date parameters if they exist
        if (startDate) {
            queryParams.startDate = startDate;
        }
        if (endDate) {
            queryParams.endDate = endDate;
        }
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_BOOKINGS, queryParams);
        if (currentRequestId !== latestRequestRef.current) {
            return;
        }
        if (data?.success) {
            if (data?.data?.length > 0) {
            setBookingsList(data?.data);
            setPagination({
                currentPage: data?.pagination?.currentPage || 1,
                totalPages: data?.pagination?.totalPages || 1,
                totalItems: data?.pagination?.totalItems || 0,
                itemsPerPage: data?.pagination?.itemsPerPage || 20,
            });
                setCounts(data?.counts || { endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount: "0", uniqueCustomerPerDayBookingCount:"0" });
                setOnlineDrivers(data?.onlineDrivers || []);
                setTotalDriverCount(data?.totalDrivers || 0);
                setSelectedBookingId(null);
            } 
            else {
                setBookingsList([]);
                setOnlineDrivers([]);
                setCounts({ endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount: "0", uniqueCustomerPerDayBookingCount:"0" });
            }
        } 
        else {
            console.error('API request failed:', data?.message);
            setBookingsList([]);
            setOnlineDrivers([]);
            setCounts({ endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount: "0", uniqueCustomerPerDayBookingCount:"0" });
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookingsList([]);
        setOnlineDrivers([]);
        setCounts({ endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount: "0", uniqueCustomerPerDayBookingCount:"0" });
    } finally {
        if (currentRequestId !== latestRequestRef.current) {
            return;
        }
        setLoading(false);
        }
    };

            const handleOnClick = async (bookingId) => {
            if (!userId) {
                console.error('No userId available');
                return;
            }
            try {
                setLoadingStates(prev => ({ ...prev, [bookingId]: true }));
                const data = await UpdateOwnerShip(bookingId, userId);
                if (data?.success) {
                    await getBookingsList(pagination.currentPage);
                }
            } catch (error) {
                console.error('Error updating ownership:', error);
                setLoadingStates(prev => ({ ...prev, [bookingId]: false }));
            }
            };

            const UpdateOwnerShip = async (bookingId, userId) => {
                try {
                const data = await ApiRequestUtils.update(API_ROUTES.PUT_OWNER_SHIP, {
                    bookingId,
                    userId,
                });
                // console.log('UpdateOwnerShip API response:', data);
                setLoadingStates(prev => ({ ...prev, [bookingId]: false }));
                return data;
                } catch (error) {
                console.error('UpdateOwnerShip Error:', error);
                setLoadingStates(prev => ({ ...prev, [bookingId]: false }));
                }
            };
  
             useEffect(() => {
                    if (onRegisterRefresh) {
                    onRegisterRefresh(() => handleRefresh);
                    }
                }, [onRegisterRefresh]);
    useEffect(() => {
        if (!filtersLoaded) {
            return;
        }
        // Skip automatic API call if we're in the middle of a manual date filter operation
        if (isManualDateFilter) {
            setIsManualDateFilter(false);
            return;
        }
        
        getBookingsList(pagination.currentPage);
        // const intervalId = setInterval(() => {
        //     getBookingsList(pagination.currentPage);
        // }, 10000);

        // return () => clearInterval(intervalId);
    }, [customerId, effectiveSearchId, bookingStage, type, pagination.currentPage, activeTab, statusFilter, sourceFilter, tripCoordinatorFilter, zoneFilter, dateFilter, customDateFrom, customDateTo, filtersLoaded]);

    useBookingSummaryRealtime({filtersLoaded,activeTab,customDateFrom,customDateTo,buildSummaryQueryParams,fetchBookingSummary,pagination,customerId,effectiveSearchId,type,statusFilter,sourceFilter,tripCoordinatorFilter,zoneFilter,dateFilter});

    useEffect(() => {
        const totalPendings = Number(counts?.totalPendings || 0);
        const normalizedPath = String(location.pathname || "").toLowerCase();
        const inferredInquiryType = getInquiryTypeFromPath(normalizedPath);
        const normalizedType = String(type || inferredInquiryType || "ALL_CABS").toUpperCase();

        if (normalizedPath === "/dashboard/booking") {
            updateHomeTotalPendings(totalPendings);
            return;
        }

        if (normalizedPath.startsWith("/dashboard/booking/list") || normalizedPath.startsWith("/dashboard/auto")) {
            updateInquiryTotalPendings(normalizedType, totalPendings);
        }
         if (normalizedPath.startsWith("/dashboard/booking/list") || normalizedPath.startsWith("/dashboard/bike-taxi")) {
            updateInquiryTotalPendings(normalizedType, totalPendings);
        }
    }, [counts?.totalPendings, location.pathname, type, updateHomeTotalPendings, updateInquiryTotalPendings]);

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
                    variant={i === pagination.currentPage ? "filled" : "outlined"}
                    className={`mx-1 ${ColorStyles.bgColor} text-white`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </Button>
            );
        }
        return buttons;
    };

    const onEndTrip = async (bookingId, driverId) => {
        const reqBody = {
            status: BOOKING_STATUS.ENDED,
            bookingId: bookingId,
            driverId: driverId,
            driverStatus: 'ACTIVE'
        };
        const data = await ApiRequestUtils.update(API_ROUTES.UPATE_ADMIN_BOOKINGS, reqBody);
        if (data?.success) {
            navigate("/dashboard/booking");
        }
    }
    const onAssignDriverHandler = (data) => {
        setShowPickedBooking(data?.id);
        onAssignDriver(data);
        setSelectedBookingId(data.id);
        setIsOpen(true)
    };
    const onAssignParcelVehicleHandler = (data, parcelVehicleType) => {
        const bookingData = {
            ...data,
            serviceType: "PARCEL",
            parcelVehicleType,
            subZoneId: data?.subZoneId,
        };
        onAssignDriverHandler(bookingData);
    };
    const onReassignParcelVehicleHandler = (data, parcelVehicleType) => {
        const bookingData = {
            ...data,
            serviceType: "PARCEL",
            parcelVehicleType,
            subZoneId: data?.subZoneId,
        };
        setSelectedBookingForReassign(bookingData);
        setShowReassignModal(true);
    };
    const onRequestDriverHandler = (data, requestDriver) => {
        setShowPickedBooking(data?.id);
        data.requestType = requestDriver;
        onAssignDriver(data);
        setSelectedBookingId(data.id);
        setIsOpen(true)
    };

    const onSupportApprovalHandler = (data) => {
        setSelectedBookingForSupportApproval(data);
        setSupportApprovalDecision('END_TRIP');
        setSupportApprovalReasonDetails('');
        setShowSupportApprovalModal(true);
    };

    const submitSupportApproval = async () => {
        if (!selectedBookingForSupportApproval?.id) return;

        const payload = {
            bookingId: selectedBookingForSupportApproval.id,
            reasonKey: 'OTHER',
            otherReasonDetails: supportApprovalReasonDetails?.trim() || 'Support confirmed manually',
            decision: supportApprovalDecision,
        };

        try {
            setLoading(true);
            const response = await ApiRequestUtils.post(API_ROUTES.SUPPORT_END_LOACTION, payload);
            if (response?.success) {
                setShowSupportApprovalModal(false);
                setSelectedBookingForSupportApproval(null);
                setSupportApprovalDecision('END_TRIP');
                setSupportApprovalReasonDetails('');
                await getBookingsList(pagination.currentPage);
            } else {
                console.error('Support approval update failed:', response?.message);
            }
        } catch (error) {
            console.error('Error submitting support approval:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookingSelect = (data, event) => {
        setSelectedBookingId(data.id);
        if (onSelectBooking) {
            event?.preventDefault?.();
            onSelectBooking(data);
        }
    }

    const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }
    const handleSort = (key) => {
        let direction = 'ascending';
        let isNameSort = key === 'firstName';

        if (isNameSort) {
            if (nameSortConfig.key === key && nameSortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            setNameSortConfig({ key, direction });
        } else {
            if (sortConfig.key === key && sortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            setSortConfig({ key, direction });
        }

        const sortedBookings = [...bookingsList].sort((a, b) => {
            if (key === 'created_at') {
                return direction === 'ascending'
                    ? new Date(a[key]) - new Date(b[key])
                    : new Date(b[key]) - new Date(a[key]);
            } else if (key === 'firstName') {
                const aValue = a.Customer?.firstName?.toLowerCase() || '';
                const bValue = b.Customer?.firstName?.toLowerCase() || '';
                if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
                return 0;
            }
            return 0;
        });
        setBookingsList(sortedBookings);
    };
    const tripCoordinatorOptions = [
        { value: 'All', label: 'All' },
        ...allUsers
            .filter(user => user?.id && user?.name)
            .map(user => ({ value: user.id, label: user.name }))
            .sort((a, b) => a.label.localeCompare(b.label))
    ];

    const allTabLabel =
        type === "" ? "All Bookings" : type === "RENTAL" ? "All Rentals" : type === "RIDES" ? "All Rides" : type === "CAB" ? "All Cab" : type === "DRIVER" ? "All Driver" : type === "AUTO" ? "All Auto" :type === "BIKE" ? 'All Bike Taxi': "All Bookings";
    const isCompactFeatureList = hasFeature("BIKE");
    const tableHeaders = isCompactFeatureList
        ? [
            // "Service Type", "Booking Type", "Package Type", 
            "Booking ID", "Customer Name", "Driver Name", "Source", "Booking Date", "Created Date", "Zone", "Status"]
        : [
            // "Service Type", "Booking Type", "Package Type", 
            "Booking ID", "Customer Name", "Driver Name", "Source", "Booking Date", "Created Date", "Zone", "Status", "Trip Owner", "Follow Up", "Support Approval", "Assign Captain"];

    const tabs = useMemo(
        () =>
            isCompactFeatureList
        ? [
            { label: allTabLabel, value:'ALL_BOOKINGS'},
            { label: 'Today', value: 'TODAY' },
            { label: 'Custom date', value: 'CUSTOM_DATE' }
        ]
        : [
            { label: allTabLabel, value:'ALL_BOOKINGS'},
            { label: 'Today', value: 'TODAY' },
            { label: 'Future', value: 'REMAINING' },
            { label: 'Custom date', value: 'CUSTOM_DATE' },
                  ],
        [bookingFeatures, allTabLabel, isCompactFeatureList]
    );
    const tabValues = useMemo(() => tabs.map((tab) => tab.value), [tabs]);

    useEffect(() => {
        if (!tabValues.includes(activeTab)) {
            const fallbackTab = tabValues[0] || 'ALL_BOOKINGS';
            setActiveTab(fallbackTab);
            setDateFilter(getDateFilterFromTab(fallbackTab));
        }
    }, [activeTab, tabValues]);

    const handleTabKeyDown = (event, value) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleTabChange(value);
            return;
        }
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

        event.preventDefault();
        const currentIndex = tabValues.indexOf(value);
        if (currentIndex < 0) return;

        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + delta + tabValues.length) % tabValues.length;
        const nextTab = tabValues[nextIndex];
        handleTabChange(nextTab);
    };

    const handleRefresh = () => {
        // Set manual filter flag to prevent useEffect conflicts
        setIsManualDateFilter(true);
        const refreshedTab = isCompactFeatureList ? 'TODAY' : 'ALL_BOOKINGS';
        
        // Reset all filters to their default state
        setStatusFilter(['All']);
        setSourceFilter(['All']);
        setTripCoordinatorFilter(['All']);
        setServiceTypeFilter(['All']);
        setZoneFilter(['All']);
        setActiveTab(refreshedTab);
        setDateFilter(getDateFilterFromTab(refreshedTab));
        setCustomDateFrom('');
        setCustomDateTo('');
        setIsCustomDatePopoverOpen(false);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setEffectiveSearchId('');
        sessionStorage.removeItem(bookingSearchKey);
        sessionStorage.removeItem(LEGACY_BOOKING_SEARCH_KEY);
        const today = moment().format('YYYY-MM-DD');
        const startDate = refreshedTab === 'TODAY' ? today : '';
        const endDate = refreshedTab === 'TODAY' ? today : '';
        triggerFilteredAPICall(
            startDate,
            endDate,
            1,
            ['All'],
            ['All'],
            ['All'],
            ['All'],
            ['All'],
            '',
            refreshedTab
        );
    };

//     // Date filtering implementation
//    const handleDateFilter = () => {
//     console.log('Date filter applied:', {
//         filter: dateFilter,
//         customFrom: customDateFrom,
//         customTo: customDateTo
//     });
    
//     if (dateFilter === 'Custom date' && (!customDateFrom || !customDateTo)) {
//         console.warn('Please select both From and To dates');
//         return;
//     }
    
//     setIsManualDateFilter(true);
//     setPagination((prev) => ({ ...prev, currentPage: 1 }));
//     triggerFilteredAPICall(customDateFrom, customDateTo, 1);
// };

    // Function to trigger API call with specific dates (bypasses state timing issues)
   const triggerFilteredAPICall = async (startDate, endDate, page = 1, statusFilterParam = statusFilter, sourceFilterParam = sourceFilter, tripCoordinatorFilterParam = tripCoordinatorFilter, serviceTypeFilterParam = serviceTypeFilter, zoneFilterParam = zoneFilter, effectiveSearchIdParam = effectiveSearchId, activeTabParam = activeTab) => {
        const currentRequestId = ++latestRequestRef.current;
        setLoading(true);
        
        // Clear existing data to show loading state
        setBookingsList([]);
        
        try {
            const filterType = {
                type: activeTabParam,
                source: sourceFilterParam,
                tripCoordinator: tripCoordinatorFilterParam,
                zone: zoneFilterParam.includes('All') ? ["All"] : zoneFilterParam,
            };

            // Match getBookingsList behavior: never send sentinel "All" for enum status filter.
            if (!statusFilterParam.includes('All')) {
                filterType.status = statusFilterParam;
                filterType.tripStatus = statusFilterParam.includes('COMPLETED')
                    ? true
                    : statusFilterParam.includes('ENDED')
                        ? false
                        : undefined;
            }
            
            const queryParams = {
                "customerId": customerId,
                'type': type ? type : '',
                'page': page,
                'limit': pagination.itemsPerPage,
                'filterType': JSON.stringify(filterType),
                'bookingNumber': effectiveSearchIdParam,
            };
            
            // Add date parameters
            if (startDate) {
                queryParams.startDate = startDate;
            }
            if (endDate) {
                queryParams.endDate = endDate;
            }
            
            // console.log('Triggering API call with dates:', { startDate, endDate, queryParams });
            
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_BOOKINGS, queryParams);
            if (currentRequestId !== latestRequestRef.current) {
                return;
            }
            if (data?.success) {
                if (data?.data?.length > 0) {
                    setBookingsList(data?.data);
                    setPagination({
                        currentPage: data?.pagination?.currentPage || 1,
                        totalPages: data?.pagination?.totalPages || 1,
                        totalItems: data?.pagination?.totalItems || 0,
                        itemsPerPage: data?.pagination?.itemsPerPage || 20,
                    });
                    setCounts(data?.counts || { endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount:"0", uniqueCustomerPerDayBookingCount:"0" });
                    setSelectedBookingId(null);
                } else {
                    setBookingsList([]);
                    setCounts({ endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount:"0", uniqueCustomerPerDayBookingCount:"0" });
                }
            } else {
                console.error('API request failed:', data?.message);
                setBookingsList([]);
                setCounts({ endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount:"0", uniqueCustomerPerDayBookingCount:"0" });
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookingsList([]);
            setCounts({ endedCount: "0", quotedCount: "0", totalBookingCount: "0", confirmedCount: "0", supportCount:"0", uniqueCustomerPerDayBookingCount:"0" });
        } finally {
            if (currentRequestId !== latestRequestRef.current) {
                return;
            }
            setLoading(false);
        }
    };

    const handleFollowupClick = async (bookingId, currentFollowup) => {
        const nextStatus = currentFollowup === 'NONE' ? 'FOLLOWUP' : currentFollowup === 'FOLLOWUP' ? 'FOLLOWUP_COMPLETED' : 'FOLLOWUP_COMPLETED';
        try {
            setFollowupLoading((prev) => ({ ...prev, [bookingId]: true }));
            const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_FOLLOWUP, { bookingId, followup: nextStatus, userId });
            if (response?.success) {
                await getBookingsList(pagination.currentPage);
            } else {
                console.error('Follow-up update failed:', response?.message);
            }
        } catch (error) {
            console.error('Error updating follow-up:', error);
        } finally {
            setFollowupLoading((prev) => ({ ...prev, [bookingId]: false }));
        }
    };

    function getFollowup(status) {
        switch (status) {
            case 'NONE': return 'Call Back';
            case 'FOLLOWUP': return 'Call Back Complete';
            case 'FOLLOWUP_COMPLETED': return 'Call Back Completed';
            default: return 'Call Back';
        }
    }

    return (
        <div className="flex flex-col bg-white rounded-xl shadow-lg" >
            {/* Status Cards Section */}
            <div className="w-full px-4 py-3 md:px-6 lg:px-8">
                <div className="relative">
                    {/* Booking Status Count Section */}
                    <div className="absolute top-0  right-0 flex gap-4 justify-end">
                        
                        <button
                            className={`bg-red-600 hover:bg-red-300 text-white px-2 py-2 rounded-lg text-sm shadow-lg ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
                            disabled={loading}
                            onClick={() => {
                                handleRefresh();
                            }}
                        >
                            <span className="flex items-center gap-2">
                                {loading ? (
                                    <Spinner className="h-4 w-4" />
                                ) : (
                                <img src="/img/refresh.png" alt="Refresh" className="w-4 h-4" />
                                )}
                                Refresh
                            </span>
                        </button>
                    </div>
                
                    {/* Status Cards Grid */}
                        <div className="grid grid-cols-1 py-12 sm:grid-cols-2 md:grid-cols-7 gap-2">
                            {[
                                // { key: 'totalBookingCount', label: 'Total Enquiry', icon: FaChartBar, color: 'bg-blue-50 text-blue-900', chipColor: 'bg-blue-600 text-white' },
                                { key: 'uniqueCustomerPerDayBookingCount', label: 'Total Unique Enquiry', icon: FaChartBar, color: 'bg-blue-50 text-blue-900', chipColor: 'bg-blue-600 text-white' },
                                { key: 'quotedCount', label: 'Quoted', icon: FaClipboardList, color: 'bg-yellow-50 text-yellow-900', chipColor: 'bg-yellow-600 text-white' },
                                { key: 'confirmedCount', label: 'Confirmed', icon: FaCalendarAlt, color: 'bg-purple-50 text-purple-900', chipColor: 'bg-purple-600 text-white' },
                                { key: 'endedCount', label: 'Trip Completed', icon: FaCheckCircle, color: 'bg-green-50 text-green-900', chipColor: 'bg-green-600 text-white' },
                                { key: 'supportCount', label: 'Support Cancelled', icon: FaExclamationTriangle, color: 'bg-red-50 text-red-900', chipColor: 'bg-red-600 text-white' },
                            ].map((item, index) => {
                                const IconComponent = item.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`p-2 rounded-lg shadow-md flex flex-col items-center justify-center min-w-[80px] ${item.color}`}
                                    >
                                        <Typography variant="small" className="text-xs font-medium mb-1 text-center w-full">
                                            {item.label}
                                        </Typography>
                                        <div className="flex items-center justify-center w-full">
                                            <Typography variant="h6" className="font-bold text-2xl">
                                                {counts?.[item.key] ?? "0"}
                                            </Typography>
                                        </div>
                                    </div>
                                );
                            })}
                        <div className="bg-gradient-to-r from-blue-100 to-blue-100 text-blue-900 p-2 rounded-lg shadow-md flex flex-col items-center justify-center min-w-[120px]">
                            <div className="flex items-center justify-center mb-1 w-full">
                            <Typography variant="small" className="font-bold text-xs text-blue-900">
                                    Total Drivers
                            </Typography>
                        </div>
                            <div className='flex gap-2 items-center'>
                                <Typography variant="h3" className="font-bold text-2xl text-blue-900">{totalDriverCount}</Typography>
                                {/* <FaUsers className="w-5 h-5 mr-2 text-blue-900" /> */}
                            </div>
                            
                    {/* Hourly Online Drivers Section */}
                    {/* <div className="bg-white p-4 rounded-2xl shadow-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <Typography variant="h6" className="text-gray-900 text-sm">
                                Hourly Online Drivers
                            </Typography>
                            <Button
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                                onClick={handleToggleDriverHours}
                            >
                                Select Slot
                            </Button>
                        </div> */}
                        </div>
                        <div className="bg-gradient-to-r from-green-100 to-green-100 text-green-900 p-2 rounded-lg text-center flex flex-col items-end min-w-[120px]">
                            <div className="flex items-center justify-center w-full">
                                <Typography variant="small" className="font-bold text-xs text-green-900">Online at {String(selectedHour).padStart(2, '0')}:00</Typography>
                                {/* <FaSync className="w-4 h-4 mr-2 text-green-900" /> */}
                            </div>
                            <div className="flex items-center justify-center w-full">
                                <Typography variant="h3" className="font-bold text-2xl text-green-900">{selectedDriver?.count || 0}</Typography>
                            </div>
                            {/* <Typography variant="small" className="mt-1 font-medium text-xs text-green-900">Updated: {selectedTime}</Typography> */}
                        </div>
                    </div>
                </div>                    
                        {/* {showDriverHours && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-7xl ml-36">
                                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const startHour = i;
                                            const endHour = (i + 1) % 24;
                                            const timeRange = `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
                                            const driverCount = onlineDrivers.find(driver => {
                                                const driverTime = moment(driver.date_time).hour();
                                                return driverTime === startHour;
                                            });

                                            return (
                                                <div
                                                    key={i}
                                                    className={`bg-gray-100 text-gray-800 p-2 rounded text-center cursor-pointer ${selectedHour === i ? 'border-2 border-black' : ''}`}
                                                    onClick={() => handleHourSelect(i)}
                                                >
                                                    <Typography variant="small" className="text-xs font-bold mb-1">
                                                        {timeRange}
                                                    </Typography>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                                            onClick={() => setShowDriverHours(false)}
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )} */}
                        {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2">
                            <div className="bg-blue-400 bg-gradient-to-br from-blue-500 to-blue-800 text-white p-2 rounded-lg text-center flex flex-col items-center">
                                <div className="flex items-center mb-1">
                                    <FaUsers className="w-6 h-6 mr-1 text-white" />
                                    <Typography variant="small" className="text-white font-bold text-xs">
                                        Total Drivers
                                    </Typography>
                                </div>
                                <Typography variant="h3" className="font-bold text-xl">{totalDriverCount}</Typography>
                            </div>
                            <div className="bg-green-600 bg-gradient-to-br from-green-600 to-green-800 text-white p-2 rounded-lg text-center flex flex-col items-center">
                                <div className="flex items-center">
                                    <FaSync className="w-5 h-5 mr-1 text-white" />
                                    <Typography variant="small" className="font-bold text-xs">Online at {String(selectedHour).padStart(2, '0')}:00</Typography>
                                </div>
                                <Typography variant="h3" className="font-bold text-xl">{selectedDriver?.count || 0}</Typography>
                                <Typography variant="small" className="mt-1 font-medium text-xs text-white">Last Updated: {selectedTime}</Typography>
                            </div>
                        </div>
                    </div>
                </div>
            </div > */}
            </div>
            {/* <div className='px-3 py-3'>
                <Typography variant="h5" className='text-gray-900'>
                    {type == "" ? 'All Bookings' : type == "RENTAL" ? 'Rentals' : type == "RIDES" ? 'Rides' : type == "CAB" ? 'Cab' : type == "CAR_WASH" ? 'Car Wash' : type == 'DRIVER' ? 'Driver' : type == 'AUTO' ? 'Auto' : type == 'PARCEL' ? 'Parcel' : 'Bookings'}
                </Typography>
            </div> */}
            <Card>
                {/* <div className='absolute right-10 -top-10'>
                    <button
                        className="bg-primary-400 hover:bg-primary-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2"
                        onClick={handleRefresh}
                    >
                        <img src="/img/refresh.png" alt="Refresh" className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                </div> */}
                <CardBody className='pt-0'>
                    <div className="bg-gray-300 z-0 mb-4 rounded-lg">
                    <div className="flex w-full items-center">
                        <div className="flex w-full p-1" role="tablist" aria-label="Booking date tabs">
                            {tabs.map(({ label, value }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleTabChange(value)}
                                    onKeyDown={(event) => handleTabKeyDown(event, value)}
                                    role="tab"
                                    aria-selected={activeTab === value}
                                    className={`cursor-pointer flex-1 text-center px-3 py-1 rounded-md ${
                                        activeTab === value
                                            ? 'bg-gray-50 shadow-sm text-black'
                                            : 'text-black hover:bg-gray-200'
                                    }`}
                                >
                    <div className="flex items-center justify-center w-full gap-1">
                                    <Typography variant="small" className="font-bold">
                                        {label}
                                    </Typography>
                        {value === 'CUSTOM_DATE' && (
                            <Popover placement="bottom-start" open={isCustomDatePopoverOpen} handler={setIsCustomDatePopoverOpen}>
                                <PopoverHandler>
                                    <div className="flex items-center cursor-pointer ml-2">
                                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                                    </div>
                                </PopoverHandler>
                                <PopoverContent className="p-4 z-10 bg-white shadow-lg rounded-lg">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2">
                                            <Typography variant="small" className="text-gray-600">
                                                From:
                                            </Typography>
                                            <input
                                                type="date"
                                                value={customDateFrom}
                                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                                // max={customDateTo || undefined}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Typography variant="small" className="text-gray-600">
                                                To:
                                            </Typography>
                                           <input
                                                type="date"
                                                value={customDateTo}
                                                onChange={(e) => setCustomDateTo(e.target.value)}
                                                onBlur={() => {
                                                    if (customDateFrom && customDateTo) {
                                                    setIsCustomDatePopoverOpen(false);
                                                    }
                                                }}
                                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                className="px-3 py-1 ml-4 border border-gray-300 rounded-md text-sm"
                                                // min={customDateFrom || undefined}
                                                />
                                        </div>
                                        {/* <Button
                                            size="sm"
                                            className="bg-primary text-white hover:bg-primary-600 flex items-center gap-2"
                                            onClick={handleDateFilter}
                                            disabled={!customDateFrom || !customDateTo}
                                        >
                                            <FaFilter className="w-4 h-4" />
                                            Apply
                                        </Button> */}
                                    </div>
                                </PopoverContent>
                            </Popover>
                                )}
                    </div>
                </button>
            ))}
        </div>
                            </div>
                        </div>
                        <div className='overflow-x-scroll px-0 pt-0 pb-2'>



                            
                            {loading ? (
                    <div className="flex justify-center items-center h-screen">
                        <Spinner className="h-12 w-12" />
                    </div>
                        ) : (
                            <>
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr>
                                            {tableHeaders.map((el) => ( // , "Owner" => cd before Source Type

                                                <th
                                                    key={el}
                                                    className={`border-b border-blue-gray-50 py-3 px-5 text-left ${ColorStyles.bgColor}`}
                                                >
                                                    {el === "Service Type" && type === "" ? (
                                                        <FilterPopover
                                                            title={el}
                                                            options={[
                                                                { value: 'All', label: 'All' },
                                                                { value: 'DRIVER', label: 'Acting Driver' },
                                                                { value: 'CAR_WASH', label: 'Car Wash' },
                                                                { value: 'CAB', label: 'Cab' }
                                                            ]}
                                                            selectedFilters={serviceTypeFilter}
                                                            onFilterChange={(value) => handleFilterChange('serviceType', value)}
                                                        />
                                                    ) : el === "Created Date" ? (
                                                        <th
                                                            onClick={() => handleSort('created_at')}
                                                            className="border-blue-gray-50 py-3 text-left cursor-pointer flex items-center"
                                                        >
                                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                                                                Created Date
                                                            </Typography>
                                                            {sortConfig.key === 'created_at' && (
                                                                sortConfig.direction === 'ascending' ? (
                                                                    <ChevronUpIcon className="w-5 h-5 mx-1 text-white" />
                                                                ) : (
                                                                    <ChevronDownIcon className="w-5 h-5 ml-1 text-white" />
                                                                )
                                                            )}
                                                        </th>
                                                    ) : el === "Zone" ? (
                                                            <FilterPopover
                                                                title={el}
                                                                options={[
                                                                    { value: 'All', label: 'All' },
                                                                    ...serviceAreas.map(area => ({
                                                                        value: area.name,
                                                                        label: area.name
                                                                    }))
                                                                ]}
                                                                selectedFilters={zoneFilter}
                                                                onFilterChange={(value) => handleFilterChange('zone', value)}
                                                            />
                                                    ) : el === "Status" ? (
                                                        <FilterPopover
                                                            title={el}
                                                            options={[
                                                                { value: 'All', label: 'All' },
                                                                { value: 'QUOTED', label: 'Quoted' },
                                                                { value: 'BOOKING_ACCEPTED', label: 'Driver Accepted' },
                                                                { value: 'CONFIRMED', label: 'Booking Confirmed' },
                                                                { value: 'REQUEST_DRIVER', label: 'Request Driver' },
                                                                { value: 'STARTED', label: 'Started' },
                                                                { value: 'END_OTP', label: 'End OTP' },
                                                                { value: 'ENDED', label: 'Ended' },
                                                                { value: 'CUSTOMER_CANCELLED', label: 'Customer Cancelled' },
                                                                { value: 'SUPPORT_CANCELLED', label: 'Support Cancelled' },
                                                                { value: 'COMPLETED', label: 'Completed' },
                                                            ]}
                                                            selectedFilters={statusFilter}
                                                            onFilterChange={(value) => handleFilterChange('status', value)}
                                                        />
                                                    ) : el === "Source" ? (
                                                        <FilterPopover
                                                            title={el}
                                                            options={[
                                                                { value: 'All', label: 'All' },
                                                                { value: 'Walk In', label: 'Walk In' },
                                                                { value: 'Mobile App', label: 'Mobile App' },
                                                                { value: 'Website', label: 'Website' },
                                                                { value: 'Call', label: 'Call' },
                                                            ]}
                                                            selectedFilters={sourceFilter}
                                                            onFilterChange={(value) => handleFilterChange('source', value)}
                                                        />
                                                    )
                                                        : el === "Customer Name" ? (
                                                            <div
                                                                onClick={() => handleSort('firstName')}
                                                                className="cursor-pointer flex items-center"
                                                            >
                                                                <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                                                                    Customer Name
                                                                </Typography>
                                                                {nameSortConfig.key === 'firstName' && (
                                                                    nameSortConfig.direction === 'ascending' ? (
                                                                        <ChevronUpIcon className="w-5 h-5 mx-1 text-white" />
                                                                    ) : (
                                                                        <ChevronDownIcon className="w-5 h-5 ml-1 text-white" />
                                                                    )
                                                                )}
                                                            </div>
                                                        ) : el === 'Driver Name' ? (
                                                            <div
                                                                onClick={() => handleSort('firstName')}
                                                                className="cursor-pointer flex items-center"
                                                            >
                                                                <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                                                                    Driver Name
                                                                </Typography>
                                                                {nameSortConfig.key === 'firstName' && (
                                                                    nameSortConfig.direction === 'ascending' ? (
                                                                        <ChevronUpIcon className="w-5 h-5 mx-1 text-white" />
                                                                    ) : (
                                                                        <ChevronDownIcon className="w-5 h-5 ml-1 text-white" />
                                                                    )
                                                                )}
                                                            </div>
                                                        ) :
                                                            // el === "Booking Date" ? (
                                                            //             <FilterPopover
                                                            //                 title={el}
                                                            //                 customContent={
                                                            //                    <DateRangeFilter onFilterChange={(values) => handleFilterChange('dateRange', values)} />
                                                            //                 }
                                                            //             />
                                                                el === "Trip Owner" ? (
                                                                    <FilterPopover
                                                                        title={el}
                                                                        options={tripCoordinatorOptions}
                                                                        selectedFilters={tripCoordinatorFilter}
                                                                        onFilterChange={(value) => handleFilterChange('tripCoordinator', value)}
                                                                    />
                                                                ) : (
                                                                <Typography variant="medium" className="text-[11px] font-bold uppercase text-white">
                                                                    {el}
                                                                </Typography>
                                                            )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingsList.length === 0 && (
                                            <tr>
                                                <td colSpan={tableHeaders.length} className="p-5 text-center text-gray-700 font-medium">
                                                    No Bookings
                                                </td>
                                            </tr>
                                        )}
                                        {showReassignModal && (
                                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                            <div className="bg-white/95 p-6 rounded-lg max-w-md w-full h-80">
                                            
                                            <Typography className="text-2xl font-extrabold text-center mb-1 mt-10 ">
                                                Are you sure you want to reassign? 
                                            </Typography>
                                            <div className="flex justify-center gap-3">
                                               
                                                <Button
                                                className={`${ColorStyles.bgStatusColor} text-white w-28 mt-14`}
                                                onClick={() => {
                                                    onRequestDriverHandler(selectedBookingForReassign, 'DRIVER');
                                                    setShowReassignModal(false);
                                                    setSelectedBookingForReassign(null);
                                                }}
                                                >
                                                Yes
                                                </Button>
                                                 <Button
                                                variant="outlined"
                                                onClick={() => { setShowReassignModal(false);
                                                                //  setSelectedBookingForReassign(null);
                                                                        }}
                                                className={" text-white w-28 mt-14 bg-black"}
                                                >
                                                No
                                                </Button>
                                            </div>
                                            </div>
                                        </div>
                                        
                                        )}
                                        {showSupportApprovalModal && (
                                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                                <div className="bg-white/95 p-6 rounded-lg max-w-lg w-full">
                                                    <Typography className="text-2xl font-extrabold text-center mb-4">
                                                        Support Approval
                                                    </Typography>
                                                    <div className="space-y-4">
                                                        <div className='hidden'>
                                                            <Typography className="text-sm font-semibold mb-2">
                                                                Reason Key
                                                            </Typography>
                                                            <input
                                                                type="text"
                                                                value="OTHER"
                                                                readOnly
                                                                className="border border-gray-300 px-4 py-2 rounded-md w-full bg-gray-100"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Typography className="text-sm font-semibold mb-2">
                                                                Different Drop Location Reason
                                                            </Typography>
                                                            <textarea
                                                                value={supportApprovalReasonDetails}
                                                                onChange={(e) => setSupportApprovalReasonDetails(e.target.value)}
                                                                placeholder="Enter support reason details"
                                                                className="border border-gray-300 px-4 py-2 rounded-md w-full min-h-[110px]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Typography className="text-sm font-semibold mb-2">
                                                                Decision
                                                            </Typography>
                                                            <select
                                                                value={supportApprovalDecision}
                                                                onChange={(e) => setSupportApprovalDecision(e.target.value)}
                                                                className="border border-gray-300 px-4 py-2 rounded-md w-full"
                                                            >
                                                                <option value="END_TRIP">END TRIP</option>
                                                                <option value="CONTINUE_TRIP">CONTINUE TRIP</option>
                                                                {/* <option value="SUPPORT_END_LOACTION">SUPPORT_END_LOACTION</option> */}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-center gap-3 mt-6">
                                                        <Button
                                                            className={`${ColorStyles.bgStatusColor} text-white w-32`}
                                                            onClick={submitSupportApproval}
                                                            disabled={!supportApprovalReasonDetails?.trim()}
                                                        >
                                                            Submit
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            className="text-white w-32 bg-black"
                                                            onClick={() => {
                                                                setShowSupportApprovalModal(false);
                                                                setSelectedBookingForSupportApproval(null);
                                                                setSupportApprovalReasonDetails('');
                                                                setSupportApprovalDecision('END_TRIP');
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {bookingsList
                                            .filter(booking =>
                                                (statusFilter.includes('All') ||
                                                (statusFilter.includes('COMPLETED') && booking.status === 'ENDED'  && booking.tripStatus === true) ||
                                                (statusFilter.includes('ENDED') && booking.status === 'ENDED' && booking.tripStatus === false) ||
                                                (statusFilter.includes(booking.status) && booking.status !== 'ENDED'))
                                                &&
                                                (serviceTypeFilter.includes('All') || serviceTypeFilter.includes(booking.serviceType)) &&
                                                (sourceFilter.includes('All') || sourceFilter.includes(booking.source)) &&
                                                (tripCoordinatorFilter.includes('All') || tripCoordinatorFilter.includes(booking.User?.id)) &&
                                                (zoneFilter.includes('All') || zoneFilter.includes(booking.zone))
                                            )
                                            .map((data, key) => {
                                               const isSelected = data.id === selectedBookingId;
                                                    const className = `p-3 ${key === bookingsList.length - 1
                                                        ? "mb-4"
                                                        : "border-b border-blue-gray-50"} ${
                                                        data?.isSosCalled == true ? 'bg-red-500 text-white'
                                                        : data?.requiresSupportApproval ? 'bg-orange-300'
                                                        : isSelected ? 'bg-primary-50'
                                                        : "hover:bg-gray-50"
                                                    } transition-colors duration-200`;
                                                    const hasAssignedDriver = Boolean(data?.Driver?.id || data?.driverId);
                                                    const hasAssignedVehicle = Boolean(data?.Cab?.id || data?.cabId || data?.Auto?.id || data?.autoId || data?.Parcel?.id || data?.parcelId);
                                                    const hasAssignedDriverOrCab = Boolean(hasAssignedDriver ||(hasAssignedVehicle && ['BOOKING_ACCEPTED', 'QUOTED', 'CONFIRMED'].includes(data?.status))
                                                    );
                                                    // const bookingTypeValue = data?.bookingType || data?.type || activeTab || '-';
                                                    // const packageTypeValue = data?.packageType || data?.packageName || '-';

                                                return (
                                                    <tr key={data?.id} className={className}>
                                                        {/* <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.serviceType ? data.serviceType : '-'}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {bookingTypeValue}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {packageTypeValue}
                                                            </Typography>
                                                        </td> */}
                                                        <td className={className}>
                                                            <div className="flex items-center">
                                                                <Link
                                                                    to={`/dashboard/confirm-booking?bookingId=${encodeURIComponent(
                                                                            data?.id
                                                                        )}&customerId=${encodeURIComponent(
                                                                            data?.customerId || data?.Customer?.id || customerId || 0
                                                                        )}&fromPath=${encodeURIComponent(
                                                                            location.pathname
                                                                        )}`}
                                                                    onClick={(event) => handleBookingSelect(data, event)}
                                                                >
                                                                    <Typography
                                                                        variant="small"
                                                                        color="blue"
                                                                        className="font-semibold underline cursor-pointer"
                                                                    >
                                                                        {data?.bookingNumber}
                                                                    </Typography> 
                                                                </Link>
                                                            </div>
                                                        </td>
                                                        <td className={className}>
                                                            <div className="flex flex-col">
                                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.Customer?.firstName ? data?.Customer?.firstName : '-'}
                                                                </Typography>
                                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.Customer?.phoneNumber ? data?.Customer?.phoneNumber : '-'}
                                                                </Typography>
                                                            </div>
                                                            </td>
                                                        {/* <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.Customer?.phoneNumber ? data?.Customer?.phoneNumber : '-'}
                                                            </Typography>
                                                        </td> */}
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.Driver?.firstName ? data?.Driver?.firstName : '-'}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.source ? data?.source : '-'}
                                                            </Typography>
                                                        </td>
                                                        {/* <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.sourceType ? data?.sourceType : '-'}
                                                            </Typography>
                                                        </td> */}
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {/* {formatDate(data?.fromDate) HH:mm:ss.SSSZ} */}
                                                                {moment(data?.fromDate).format('DD-MM-YYYY / hh:mm A')}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {moment(data?.created_at).format('DD-MM-YYYY / hh:mm A')}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.zone ? data?.zone : '-'}
                                                            </Typography>
                                                        </td>
                                                        {/* <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                            {data?.ownership === "ASSIGNED_TO_SUPPORT" ? (
                                                            <div>Assigned To Support</div>
                                                            ) : data?.ownership}

                                                            </Typography>
                                                            </td> 
                                                        <td className={className}>
                                                            {data?.status == "STARTED" ?
                                                                <Chip
                                                                    variant="gradient"
                                                                    color={"blue"}
                                                                    value={"ON TRIP"}
                                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                                />
                                                                : data?.status == "ENDED" ?
                                                                    <Chip
                                                                        variant="gradient"
                                                                        color={"green"}
                                                                        value={"COMPLETED"}
                                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                                    />
                                                                    : data?.status == "CANCELLED" ?
                                                                        <Chip
                                                                            variant="gradient"
                                                                            color={"red"}
                                                                            value={"CANCELLED"}
                                                                            className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                                        />
                                                                        : data?.status == "INITIATED" && (data?.Driver?.id || data?.Cab?.id) ?
                                                                            < Chip
                                                                                variant="gradient"
                                                                                value={"BOOKED"}
                                                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                                            />

                                                                            :
                                                                            <Chip
                                                                                variant="gradient"
                                                                                // color={online ? "green" : "blue-gray"}
                                                                                value={"INITIATED"}
                                                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                                            />
                                                            }
                                                        </td> */}
                                                        <td>
                                                            <Chip
                                                                variant="ghost"
                                                                // color={"blue"}
                                                              value={data?.status == "CONFIRMED" ? "BOOKING CONFIRMED" : data?.status === "BOOKING_ACCEPTED" ? "DRIVER_ACCEPTED":data?.status === "BOOKING_REJECTED" ? "REQUEST_DRIVER" : data?.status === "ENDED" && data?.tripStatus === true ? "Completed" : data?.status === "QUOTED" && data?.followup === "FOLLOWUP" ? "Follow Up" : data?.status === "QUOTED" && data?.followup === "FOLLOWUP_COMPLETED" ? "Call Back Completed" : data?.status}
                                                                className={`py-0.5 px-2 text-[11px] font-medium w-fit ${
                                                                    data?.status === "QUOTED" ? "bg-yellow-600 text-white ":
                                                                    data?.status === "REQUEST_DRIVER" ? "bg-orange-600 text-white" :
                                                                    data?.status === "CONFIRMED" ? "bg-green-600 text-white" : 
                                                                    data?.status === "BOOKING_REJECTED" ? "bg-blue-gray-900 text-white":
                                                                    data?.status === "BOOKING_ACCEPTED" ? "bg-green-600 text-white":
                                                                    data?.status === "CUSTOMER_CANCELLED" ? "bg-gray-600 text-white": 
                                                                    data?.status === "ENDED" ? "bg-green-600 text-white" :
                                                                    data?.status === "STARTED" ? "bg-primary   text-white":
                                                                    data?.status === "INITIATED"? "bg-gray-600   text-white":
                                                                    data?.status === "END_OTP" ? "bg-gray-600   text-white":
                                                                    data?.status ===  "DRIVER_ON_THE_WAY" ? "bg-primary   text-white":
                                                                    data?.status === "DRIVER_REACHED" ? "bg-yellow-600  text-white":
                                                                    data?.status === "PAYMENT_REQUESTED" ? "bg-green-600  text-white":
                                                                    "bg-primary  text-white"
                                                                    
                                                                }`}
                                                            />
                                                        </td>
                                                       {!isCompactFeatureList && (
                                                    <td className={className}>
                                                            {data?.userId ? (
                                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                                {data?.User?.name}
                                                                </Typography>
                                                            ) : (
                                                                <Button
                                                                fullWidth
                                                                className="text-xs font-semibold text-white"
                                                                onClick={() => handleOnClick(data.id)}
                                                                disabled={loadingStates[data.id]}
                                                            >
                                                                {loadingStates[data.id] ? (
                                                                    <Spinner className="h-4 w-4" />
                                                                ) : (
                                                                    'Assign To Me'
                                                                )}
                                                                </Button>
                                                            )}
                                                        </td>
                                                        )}
                                                        {!isCompactFeatureList && (
                                                        <td className={className}>
                                                            <button
                                                                className={`text-xs font-semibold text-white flex items-center justify-center gap-2 rounded-sm px-2 py-2 ${(data?.followup || 'NONE') === 'NONE'
                                                                    ? 'bg-blue-500'
                                                                    : (data?.followup || 'NONE') === 'FOLLOWUP'
                                                                        ? 'bg-yellow-600'
                                                                        : 'bg-green-600'
                                                                    } ${data?.userId && data?.User && data?.status === 'QUOTED' && !followupLoading[data.id] && (data?.followup || 'NONE') !== 'FOLLOWUP_COMPLETED' ? '' : 'bg-blue-gray-100'}`}
                                                                onClick={() => handleFollowupClick(data.id, (data?.followup || 'NONE'))}
                                                                disabled={
                                                                    !(data?.userId && data?.User && data?.status === 'QUOTED') ||
                                                                    followupLoading[data.id] ||
                                                                    (data?.followup || 'NONE') === 'FOLLOWUP_COMPLETED'
                                                                }
                                                            >
                                                                {/* {followupLoading[data.id] ? (
                                                                    <Spinner className="h-6 w-6" />
                                                                ) : (
                                                                    <FaPhone className="w-6 h-6 rotate-90" />
                                                                )} */}
                                                        {getFollowup(data?.followup || 'NONE')}
                                                            </button>
                                                            </td>
                                                        )}
                                                        {!isCompactFeatureList && (
                                                            <td className={className}>
                                                                {data?.requiresSupportApproval ? (
                                                                    <Button
                                                                        fullWidth
                                                                        onClick={() => onSupportApprovalHandler(data)}
                                                                        className="text-xs font-semibold text-white flex-wrap bg-orange-600 hover:bg-orange-700"
                                                                    >
                                                                        Support Approval
                                                                    </Button>
                                                                ) : (
                                                                    <Typography className="text-xs font-semibold text-blue-gray-500 text-center">
                                                                        -
                                                                    </Typography>
                                                                )}
                                                            </td>
                                                        )}
                                                        
                                                        {!isCompactFeatureList && (
                                                        <td className={className}>
                                                            {/* {data?.status === 'STARTED' &&
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => onEndTrip(data?.id, data?.Driver?.id)}
                                                                    className="text-xs font-semibold text-white"
                                                                >
                                                                    End Trip
                                                                </Button>
                                                            } */}
                                                                {['RIDES', 'RENTAL','AUTO'].includes(data?.serviceType) && ([ 'CONFIRMED','REQUEST_DRIVER'].includes(data?.status) || (data?.status == "REQUEST_DRIVER" && (data?.serviceType == "RIDES" || data?.serviceType == "RENTAL" || data?.serviceType =="DRIVER"))) && data?.pickupLat && data?.pickupLong && (!data?.Driver?.id && !data?.Cab?.id) && 
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => onRequestDriverHandler(data, 'REQUEST_ALL')}
                                                                    className={`text-xs font-semibold text-blue-gray-900 flex-wrap mb-1 ${ColorStyles.bgStatusColor}`}
                                                                    disabled={data?.User == null}
                                                                >
                                                                    Request {data?.serviceType === "AUTO"
                                                                                ? "Auto"
                                                                                : data?.serviceType === "DRIVER"
                                                                                ? "Captain"
                                                                                // : data?.serviceType === "PARCEL"
                                                                                // ? "Bike"
                                                                                : "Cab"}
                                                                </Button>
                                                            }
                                                            {data?.status === "BOOKING_REJECTED" ? (
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => onAssignDriverHandler(data)}
                                                                    className={`text-xs font-semibold text-blue-gray-900 flex-wrap ${ColorStyles.bgStatusColor}`}
                                                                    disabled={data?.User == null}
                                                                >
                                                                    Assign Return Trips
                                                                </Button>
                                                            ) : data?.serviceType !== "PARCEL" && (['CONFIRMED'].includes(data?.status) || (data?.status == "REQUEST_DRIVER" && (data?.serviceType == "RIDES" || data?.serviceType == "RENTAL" || data?.serviceType == "DRIVER" || data?.serviceType == "AUTO"))) && data?.pickupLat && data?.pickupLong && (!data?.Driver?.id && !data?.Cab?.id) &&
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => onAssignDriverHandler(data)}
                                                                    className={`text-xs font-semibold text-blue-gray-900 flex-wrap ${ColorStyles.bgStatusColor}`}
                                                                    disabled={data?.User == null}
                                                                >
                                                                    Assign {data?.serviceType === "AUTO"
                                                                                ? "Auto"
                                                                                : data?.serviceType === "DRIVER"
                                                                                ? "Captain"
                                                                                : "Cab"}
                                                                </Button>
                                                            }
                                                            {data?.serviceType !== "PARCEL" && (['QUOTED', 'CONFIRMED', 'BOOKING_ACCEPTED'].includes(data?.status)) && (data?.Driver?.id || data?.Cab?.id) && // need to add permission from redux
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => {
                                                                    setSelectedBookingForReassign(data);
                                                                    setShowReassignModal(true);
                                                                    }}
                                                                    className={`text-xs font-semibold text-blue-gray-900 flex-wrap ${ColorStyles.bgStatusColor}`}
                                                                    disabled={data?.User == null}
                                                                >
                                                                    ReAssign {data?.serviceType === "AUTO"
                                                                                ? "Auto"
                                                                                : data?.serviceType === "DRIVER"
                                                                                ? "Captain"
                                                                                : "Cab"}
                                                                </Button>
                                                            }
                                                            {data?.serviceType === "PARCEL" && ['CONFIRMED', 'REQUEST_DRIVER'].includes(data?.status) && data?.pickupLat && data?.pickupLong && !hasAssignedDriverOrCab &&
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => onAssignParcelVehicleHandler(data, String(data?.parcelVehicleType || "BIKE").toUpperCase() === "AUTO" ? "AUTO" : "BIKE")}
                                                                    className={`text-xs font-semibold text-blue-gray-900 flex-wrap ${ColorStyles.bgStatusColor}`}
                                                                    disabled={data?.User == null}
                                                                >
                                                                    Assign {String(data?.parcelVehicleType || "BIKE").toUpperCase() === "AUTO" ? "Auto" : "Bike"}
                                                                </Button>
                                                            }
                                                            {data?.serviceType === "PARCEL" && (['QUOTED', 'CONFIRMED', 'BOOKING_ACCEPTED'].includes(data?.status)) && hasAssignedDriverOrCab &&
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => onReassignParcelVehicleHandler(data, data?.parcelVehicleType === "AUTO" ? "AUTO" : "BIKE")}
                                                                    className={`text-xs font-semibold text-blue-gray-900 flex-wrap ${ColorStyles.bgStatusColor}`}
                                                                    disabled={data?.User == null}
                                                                >
                                                                    ReAssign {data?.parcelVehicleType === "AUTO" ? "Auto" : "Bike"}
                                                                </Button>
                                                            }
                                                            {data?.status === 'ASSIGNED_TO_SUPPORT' && data?.pickupLat && data?.pickupLong && (!data?.Driver?.id && !data?.Cab?.id) &&
                                                                <Button
                                                                    fullWidth
                                                                    onClick={() => onAssignDriverHandler(data)}
                                                                    className={`text-xs font-semibold text-blue-gray-900 flex-wrap ${ColorStyles.bgStatusColor}`}
                                                                    disabled={data?.User == null}
                                                                >
                                                                    Assign {data?.serviceType === "AUTO"
                                                                                ? "Auto"
                                                                                : data?.serviceType === "DRIVER"
                                                                                ? "Captain"
                                                                                : data?.serviceType === "PARCEL" ? (String(data?.parcelVehicleType || "BIKE").toUpperCase() === "AUTO" ? "Auto" : "Bike")
                                                                                : "Cab"}
                                                                   
                                                                </Button>
                                                            }
                                                        </td>
                                                        )}
                                               </tr>
                        );
                                            }
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
                            </>
                        )}
                        </div>
                    </CardBody>
                </Card>
            
        </div>
    );
}

export default BookingsList;
