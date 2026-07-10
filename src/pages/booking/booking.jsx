import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Button,
    Card,
    Typography,
} from "@material-tailwind/react";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Utils } from '../../utils/utils';
import { API_ROUTES, ColorStyles,BOOKING_TERMS_AND_CONDITIONS, BOOKING_TERMS_AND_CONDITIONS_FOR_RIDES } from '../../utils/constants';
import { BOOKING_DETAILS_SCHEMA } from '../../utils/validations';
import { ApiRequestUtils } from '../../utils/apiRequestUtils';
import moment from 'moment';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BookingsList, SearchDrivers } from '.';
import SearchableDropdown from '@/components/SearchableDropdown';
import CustomerAdd from '../customer/add';
import SelectLocation from './selectLocation';
import BookingItem from "./confirmBooking"
import { BOOKING_FEATURES } from '../../utils/constants';
import {buildAdminDiscountPayload,isAdminDiscountEffective,buildAdminDiscountFromQuoteMeta,sanitizeAdminDiscountValue} from './utils/adminDiscount';
import { normalizeQuoteRef } from './utils/quoteRef';
import { useAdminDiscountNotifier } from './hooks/useAdminDiscountNotifier';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import EditBooking from './editBooking';
import DistanceExceedModal from '@/components/DistanceExceedModal';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { PlusIcon } from '@heroicons/react/24/outline';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const useLuggageAndSeaterLogic = (carType, setFieldValue, luggageCapacityMap = {}) => {
    useEffect(() => {
        const normalizedCarType = String(carType || '').toLowerCase();
        const apiLuggageValue = Number(luggageCapacityMap?.[normalizedCarType]);
        const luggageValue = Number.isFinite(apiLuggageValue) && apiLuggageValue > 0 ? apiLuggageValue : '';

        if (carType === 'Mini' || carType === 'Sedan') {
            setFieldValue('luggage', luggageValue);
            setFieldValue('seaterCapacity', '5');
        } else if (carType === 'SUV' || carType === 'MUV') {
            setFieldValue('luggage', luggageValue);
            setFieldValue('seaterCapacity', '7');
        } else {
            setFieldValue('luggage', '');
            setFieldValue('seaterCapacity', '');
        }
    }, [carType, setFieldValue, luggageCapacityMap]);
};
// Format date to YYYY-MM-DD for input's min attribute
const minsToHHMM = (totalMins)=> {
        const hrs = Math.floor(totalMins / 60);
        const mins = Math.round(totalMins % 60);          // round to nearest minute
        return `${hrs} hrs : ${mins.toString().padStart(2, "0")} mins`;
        };

const toTitleLabel = (value = '') =>
    String(value || '')
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

const toStorageScope = (pathname = '') => {
    const normalized = String(pathname || '').toLowerCase();
    const scope = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return scope || 'dashboard_booking';
};
const LEGACY_BOOKING_SEARCH_KEY = 'bookingSearchId';

const getSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') return suggestion;
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.fullText || suggestion.title || suggestion.subtitle || '';
};

const getSuggestionPlaceId = (suggestion) => {
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.placeId || suggestion.place_id || suggestion.id || '';
};

const makeAddressPayload = (name, placeId) => ({
    name,
    ...(placeId ? { placeId } : {}),
});

const getSuggestionTitle = (suggestion) => {
    if (typeof suggestion === 'string') {
        const [firstPart] = suggestion.split(',');
        return (firstPart || suggestion).trim();
    }
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.title || suggestion.fullText || '';
};

const getAdminDiscountUpdatedTs = (item = {}) =>
    new Date(item?.updatedAt || item?.updated_at || item?.approvedAt || item?.approved_at || item?.createdAt || item?.created_at || 0).getTime();

const Booking = (props) => {
    const [loading, setLoading] = useState(false);
    const [packageTypeSelectedData, setPackageTypeSelectedData] = useState([]);
    const [bookingTimes, setBookingTimes] = useState([]);
    const [bookingTimesForDay, setBookingTimesForDay] = useState([]);
    const [range, setRange] = useState({});
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [customerData, setCustomerData] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(0);
    const [showQuickCreateCustomer, setShowQuickCreateCustomer] = useState(false);
    const [bookingStage, setBookingStage] = useState(0);
    const [bookingData, setBookingData] = useState();
    const [bookingView, setBookingView] = useState(false);
    const [editBooking, setEditBooking] = useState();
    const [customerNumber, setCustomerNumber] = useState('');
    const [addCustomerNumber, setAddCustomerNumber] = useState('');
    const [searchBookingId, setSearchBookingId] = useState('');
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [driverSuggestions, setDriverSuggestions] = useState([]);
    const [luggageCapacityMap, setLuggageCapacityMap] = useState({});
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropLocation, setDropLocation] = useState(null);
    const [driverPickUpLocation, setDriverPickUpLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 12.906374, lng: 80.226452 });
    const [mapZoom, setMapZoom] = useState(10);
    const mapRef = useRef(null);
    const [quoteDetails, setQuoteDetails] = useState(null);
    const [quoteMeta, setQuoteMeta] = useState(null);
    const approvedHistoryRefreshKeyRef = useRef('');
    const approvedStatusSyncTimerRef = useRef(null);
    const adminStatusSyncInFlightRef = useRef(false);
    const lastAdminStatusSyncAtRef = useRef(0);
    const { handleAdminDiscountDecision } = useAdminDiscountNotifier({
        quoteMeta,
        setQuoteMeta,
        setQuoteDetails,
        onApprovedStatus: ({ quoteRef, status }) => {
            const normalizedQuoteRef = normalizeQuoteRef(quoteRef || '');
            if (!normalizedQuoteRef) return;
            const normalizedStatus = String(status || '').toUpperCase();

            // Optimistic UI update for immediate feedback on notification receipt.
            setQuoteMeta((prev) => ({
                ...(prev || {}),
                quoteRef: normalizedQuoteRef || prev?.quoteRef || '',
                adminDiscount: {
                    ...(prev?.adminDiscount || {}),
                    status: normalizedStatus,
                },
            }));
            setQuoteDetails((prev) => ({
                ...(prev || {}),
                quoteRef: normalizedQuoteRef || prev?.quoteRef || '',
                adminDiscount: {
                    ...(prev?.adminDiscount || {}),
                    status: normalizedStatus,
                },
            }));

            const approvedKey = `${normalizedQuoteRef}:${normalizedStatus}`;
            if (approvedHistoryRefreshKeyRef.current === approvedKey) return;
            approvedHistoryRefreshKeyRef.current = approvedKey;
            if (approvedStatusSyncTimerRef.current) {
                clearTimeout(approvedStatusSyncTimerRef.current);
            }
            approvedStatusSyncTimerRef.current = setTimeout(() => {
                syncAdminDiscountStatus(normalizedQuoteRef);
            }, 1500);
        },
        enabled: BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW,
    });
    const [bookingType, setBookingType] = useState(props.typeProp || '');
    const [discountDetails, setDiscountDetails] = useState(null);
    const [driverEndLocation, setDriverEndLocation] = useState(null);
    const [driverEndSuggestions, setDriverEndSuggestions] = useState([]);
    const [editBookingView, setEditBookingView] = useState(false);
    const [distanceExceedModal, setDistanceExceedModal] = useState(false);
    const [outstationDistanceModal, setOutstationDistanceModal] = useState(false);
    const [cityLimitExceedModal, setCityLimitExceedModal] = useState(false);
    const [zoneErrorModal, setZoneErrorModal] = useState({ show: false, text: '', title: '' });
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [formikActions, setFormikActions] = useState({});
    const [serviceAreas, setServiceAreas] = useState([]);
    const [premiumServicesMap, setPremiumServicesMap] = useState({})
    const [services, setServices] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [currentServiceType, setCurrentServiceType] = useState('');
    const [currentPackageType, setCurrentPackageType] = useState('');
    const [dropTaxiDistanceExceedModal, setDropTaxiDistanceExceedModal] = useState(false);
    const [dropTaxiModalContent, setDropTaxiModalContent] = useState("Booking not available for the selected route. Try outstation service.");
    const [quotationLogs, setQuotationLogs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const adminStatusSyncKeyRef = useRef('');
    const adminStatusAppliedTsRef = useRef(0);
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || "{}");
    const loggedInUserId = loggedInUser.id || 0;
    const loggedInUserRole = String(loggedInUser?.role || loggedInUser?.userType || '').toUpperCase();
    const isSuperUser = String(loggedInUser?.role || loggedInUser?.userType || '').toUpperCase() === 'SUPER_USER';
     const [refreshFn, setRefreshFn] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const bookingSearchKey = `bookingSearchId_${toStorageScope(location.pathname)}`;



  const fetchGeoData = async () => {
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
      const filteredAreas = response.data.filter((area) => area.type === 'Service Area');
      setServiceAreas(filteredAreas);
      if (response.premiumServices) {
      setPremiumServicesMap(response.premiumServices);
    //   console.log("Premium Services Map Loaded:", response.premiumServices);
    }
    //   console.log('Available service areas:', filteredAreas);
    } catch (error) {
      console.error('Error fetching GEO_MARKINGS_LIST:', error);
    }
  };

  useEffect(() => {
    fetchGeoData();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setBookingStage(0);
      setBookingView(false);
      setEditBookingView(false);
      setEditBooking(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    const storedSearchId = sessionStorage.getItem(bookingSearchKey) || sessionStorage.getItem(LEGACY_BOOKING_SEARCH_KEY) || '';
    if (storedSearchId) {
      sessionStorage.setItem(bookingSearchKey, storedSearchId);
    }
    if (storedSearchId) {
      setSearchBookingId((prev) => prev || storedSearchId);
      setSearchText((prev) => prev || storedSearchId);
    }
  }, [bookingSearchKey]);

  useEffect(() => {
    if (selectedAreaId) {
      const selectedArea = serviceAreas.find((area) => area.id === parseInt(selectedAreaId));
      const newServices = (selectedArea ? selectedArea.services : []);
      setServices(newServices);
    //   console.log('Services for selected area:', newServices);
      setCurrentServiceType('');
    } else {
      setServices([]);
      setCurrentServiceType('');
    }
  }, [selectedAreaId, serviceAreas]);

    const fetchData = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_CUSTOMERS,{
                forSearch:true
            });
            setCustomerData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const params = location.state;

    const syncAdminDiscountStatus = useCallback(async (quoteRefValue) => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const quoteRef = normalizeQuoteRef(quoteRefValue || quoteMeta?.quoteRef || '');
        if (!quoteRef) return;
        const now = Date.now();
        if (adminStatusSyncInFlightRef.current) return;
        if (now - lastAdminStatusSyncAtRef.current < 1200) return;
        adminStatusSyncInFlightRef.current = true;
        lastAdminStatusSyncAtRef.current = now;

        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_DISCOUNT_STATUS, { quoteRef });
            const latest = response?.data && typeof response.data === 'object' ? response.data : null;
            if (!latest) return;
            const latestStatus = String(latest?.status || '').toUpperCase();
            if (!latestStatus) return;
            const latestTs = getAdminDiscountUpdatedTs(latest);
            if (latestTs && latestTs <= adminStatusAppliedTsRef.current) return;

            const latestKey = `${quoteRef}:${latestStatus}:${latest?.id || latest?.discountId || ''}`;
            if (adminStatusSyncKeyRef.current === latestKey) return;
            adminStatusSyncKeyRef.current = latestKey;
            if (latestTs) {
                adminStatusAppliedTsRef.current = latestTs;
            }

            setQuoteMeta((prev) => ({
                ...(prev || {}),
                quoteRef: quoteRef || prev?.quoteRef || '',
                adminDiscount: {
                    ...(prev?.adminDiscount || {}),
                    ...latest,
                    status: latestStatus,
                },
            }));

            setQuoteDetails((prev) => ({
                ...(prev || {}),
                quoteRef: quoteRef || prev?.quoteRef || '',
                adminDiscount: {
                    ...(prev?.adminDiscount || {}),
                    ...latest,
                    status: latestStatus,
                },
            }));
        } catch (error) {
            console.error('Failed to sync admin discount status by quoteRef:', error);
        } finally {
            adminStatusSyncInFlightRef.current = false;
        }
    }, [quoteMeta?.quoteRef]);

    useEffect(() => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const quoteRef = normalizeQuoteRef(quoteMeta?.quoteRef || '');
        if (!quoteRef) return;
        const currentStatus = String(quoteMeta?.adminDiscount?.status || quoteDetails?.adminDiscount?.status || '').toUpperCase();
        if (currentStatus && currentStatus !== 'PENDING') return;
        syncAdminDiscountStatus(quoteRef);
    }, [quoteMeta?.quoteRef, quoteMeta?.adminDiscount?.status, quoteDetails?.adminDiscount?.status, syncAdminDiscountStatus]);

    useEffect(() => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const onFocusSync = () => {
            const quoteRef = normalizeQuoteRef(quoteMeta?.quoteRef || '');
            const currentStatus = String(quoteMeta?.adminDiscount?.status || quoteDetails?.adminDiscount?.status || '').toUpperCase();
            if (currentStatus && currentStatus !== 'PENDING') return;
            if (quoteRef) {
                syncAdminDiscountStatus(quoteRef);
            }
        };
        window.addEventListener('focus', onFocusSync);
        return () => window.removeEventListener('focus', onFocusSync);
    }, [quoteMeta?.quoteRef, quoteMeta?.adminDiscount?.status, quoteDetails?.adminDiscount?.status, syncAdminDiscountStatus]);

    useEffect(() => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const onAdminDiscountStatus = (event) => {
            const detail = event?.detail || {};
            const status = String(detail?.status || '').toUpperCase();
            if (status !== 'APPROVED' && status !== 'AUTO_APPROVED' && status !== 'REJECTED') return;

            const eventQuoteRef = normalizeQuoteRef(detail?.quoteRef || '');
            const currentQuoteRef = normalizeQuoteRef(quoteMeta?.quoteRef || '');
            if (eventQuoteRef && currentQuoteRef && eventQuoteRef !== currentQuoteRef) return;

            const targetQuoteRef = eventQuoteRef || currentQuoteRef;
            if (!targetQuoteRef) return;
            syncAdminDiscountStatus(targetQuoteRef);
        };

        window.addEventListener('admin-discount-status', onAdminDiscountStatus);
        return () => window.removeEventListener('admin-discount-status', onAdminDiscountStatus);
    }, [quoteMeta?.quoteRef, syncAdminDiscountStatus]);

    useEffect(() => () => {
        if (approvedStatusSyncTimerRef.current) {
            clearTimeout(approvedStatusSyncTimerRef.current);
        }
    }, []);

    useEffect(() => {
        if (params?.editBooking) {
            const bookingToEdit = params.editBooking;
            setBookingData(bookingToEdit);
            setEditBooking(bookingToEdit);
            setBookingStage(0);
            setBookingView(false);
            setEditBookingView(true);
            setShowQuickCreateCustomer(false);
            setIsOpen(true);

            const { editBooking: _ignoredEditBooking, ...rest } = params;
            const nextState = Object.keys(rest || {}).length ? rest : undefined;
            navigate(location.pathname, { replace: true, state: nextState });
        }
    }, [params, navigate, location.pathname]);

    const getPackageListDetails = useCallback(async (serviceType, zone) => {
  try {
    // console.log('Fetching packages with:', { serviceType, zone });
	    if (!serviceType) {
	      setPackageTypeSelectedData([]);
          setLuggageCapacityMap({});
	      return;
	    }

    const serviceTypeMap = {
      'RENTAL_DROP_TAXI': 'RENTAL',
      'RENTAL_HOURLY_PACKAGE': 'RENTAL',
    };
    const mappedServiceType = serviceTypeMap[serviceType] || serviceType;
    // console.log('Mapped serviceType:', mappedServiceType);

    // AUTO / PARCEL bookings do not use package list; skip silently
    if (mappedServiceType === 'AUTO' || mappedServiceType === 'PARCEL') {
      setPackageTypeSelectedData([]);
      setLuggageCapacityMap({});
      return;
    }

    if (!['DRIVER', 'RENTAL', 'RIDES'].includes(mappedServiceType)) {
      console.error('Invalid serviceType:', mappedServiceType);
      setPackageTypeSelectedData([]);
      setLuggageCapacityMap({});
      return;
    }

    const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ZONE_PACKAGE_LIST, {
      serviceType: mappedServiceType,
      zone: zone || '',
    });

    // console.log('Raw API response:', JSON.stringify(data, null, 2));

    if (data?.success && Array.isArray(data?.data)) {
      setPackageTypeSelectedData(data.data);
      setLuggageCapacityMap(data?.luggageCapacity || {});
    //   console.log('Package list fetched:', data.data);
    } else {
      console.error('Failed to fetch package list or data is not an array:', data?.message || 'No message provided');
      setPackageTypeSelectedData([]);
      setLuggageCapacityMap({});
    }
  } catch (error) {
    console.error('Error fetching package list:', error.message || error);
    setPackageTypeSelectedData([]);
    setLuggageCapacityMap({});
  }
}, []);

useEffect(() => {
//   console.log('useEffect for package list:', { selectedAreaId, currentServiceType, currentPackageType });
  if (!selectedAreaId || !currentServiceType) {
    // console.log('Skipping getPackageListDetails: missing selectedAreaId or currentServiceType');
    setPackageTypeSelectedData([]);
    return;
  }
  const selectedArea = serviceAreas.find((area) => area.id === parseInt(selectedAreaId));
  const zone = selectedArea ? selectedArea.name : '';
//   console.log('Calling getPackageListDetails with:', { serviceType: currentServiceType, zone });
  getPackageListDetails(currentServiceType, zone);

  if (params?.bookingDetails?.packageType === 'Outstation' && params?.bookingDetails?.fromDate && params?.bookingDetails?.toDate) {
    setRange({ startDate: params?.bookingDetails?.fromDate, endDate: params?.bookingDetails?.toDate });
  }
}, [selectedAreaId, currentServiceType, currentPackageType, getPackageListDetails, params, serviceAreas]);
    const handleTypeChange = (type) => {
        setBookingType(type);
    };
    const searchBookings = useCallback(
        debounce(async (search) => {
            if (search.length < 3) {
                setSearchResults([]);
                return;
            }

            try {
                // console.log("BOOKINGTYPE", bookingType);
                const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_BOOKINGS_BY_NUMBER, {
                    search,
                    type: bookingType || 'ALL_BOOKINGS',
                });
                if (data?.success && data?.data) {
                    setSearchResults(data.data);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('Error searching bookings:', error);
                setSearchResults([]);
            }
        }, 300),
        [bookingType]
    );

const addQuotationLog = (values, quoteDetails, bookingId = null) => {
    const adminDiscount = quoteDetails?.adminDiscount || {};
    const newLog = {
        userId: loggedInUserId,
        bookingId: bookingId || 0,
    //   ...((values?.serviceType === 'DRIVER' || values?.serviceType === 'RENTAL_HOURLY_PACKAGE') && {
    //         packageId: values.packageSelected ? Number(values.packageSelected) : 0
    //     }),
        pickupAddress: {
            name: values.pickupAddress || '',
            placeId: values.pickupPlaceId || '',
            lat: values.pickupLocation?.lat || 0,
            lng: values.pickupLocation?.lng || 0,
        },
        dropAddress: values.dropAddress ? {
            name: values.dropAddress,
            placeId: values.dropPlaceId || '',
            lat: values.dropLocation?.lat || 0,
            lng: values.dropLocation?.lng || 0,
        } : {},
        amount: quoteDetails?.amount?.estimatedPrice === "0" || quoteDetails?.amount?.estimatedPrice === 0
            ? (quoteDetails?.amount?.packageDetails?.price || 0)
            : (quoteDetails?.amount?.estimatedPrice || 0),
        discount: quoteDetails?.discount?.percentage || 0,   
        discountAmount: (quoteDetails.amount?.estimatedPrice) - ( quoteDetails.amount?.estimatedPrice * quoteDetails.discount?.percentage/100) || 0,
        adminDiscount: adminDiscount ? {
            status: adminDiscount?.status || '',
            discountType: adminDiscount?.discountType || '',
            discountValue: adminDiscount?.discountValue ?? 0,
            discountAmount: adminDiscount?.discountAmount ?? 0,
            remarks: adminDiscount?.remarks || '',
            quoteRef: adminDiscount?.quoteRef || quoteDetails?.quoteRef || '',
        } : {},
        ...((values?.serviceType != 'RIDES') && {
               startDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString() || '',
           }),
         
        ...( (values?.serviceType != 'RENTAL_DROP_TAXI' && values?.serviceType != 'RIDES'&& values?.serviceType != 'AUTO' && values?.packageTypeSelected != 'Local' &&(values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation' && values.tripType === 'Round Trip') && !(values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation' && values.tripType === 'Drop Only'))&& 
        { endDate: moment(`${values?.toDate} ${values?.toTime}`, "YYYY-MM-DD HH:mm:ss").toISOString() || null}
         ),

         serviceType: values?.serviceType == "RENTAL_DROP_TAXI" ? 'DROP TAXI': values?.serviceType === "RENTAL_HOURLY_PACKAGE"? "HOURLY PACKAGE" : values?.serviceType === "RENTAL"? "OUTSTATION": values?.serviceType || '',
        cabType: values?.carType || '', 
        ...((values?.serviceType ==="PARCEL")) && {
	    parcelVehicleType: values?.parcelVehicleType || '',
        subZoneId: values?.subZoneId || 0,
        // weightRange: values?.weightRange || '',
        orderType: values?.orderType || '',
        orderTypeOther: values?.orderTypeOther || ''
        }        	    
    };
    setQuotationLogs((prevLogs) => [...prevLogs, newLog]);
};
  const getQuoteOutstationDetails = async (values) => {
        const isRentalOutstationRoundTrip =
            values?.serviceType === 'RENTAL' &&
            values?.packageTypeSelected === 'Outstation' &&
            values?.tripType === 'Round Trip';
        const isDropTaxiOutstation = values?.serviceType === 'RENTAL_DROP_TAXI';

        // For Outstation Round Trip and Drop Taxi: check distance BEFORE estimation
        if (isRentalOutstationRoundTrip || isDropTaxiOutstation) {
            const distanceOk = await calculateDistance(values);
            if (!distanceOk) {
                if (isRentalOutstationRoundTrip) {
                setOutstationDistanceModal(true);
                } else if (isDropTaxiOutstation) {
                    setDropTaxiDistanceExceedModal(true);
                }
                setIsButtonDisabled(false);
                return;
            }
        }

        const zoneData = await zoneCheckUpFun(values);
        // console.log("frist",zoneData)
        let actualZone = '';
        if (zoneData.success && zoneData.serviceArea) {
            actualZone = zoneData.serviceArea.name;
            // console.log('Outstation Zone', actualZone);
        } else {
            console.error('Error getting zone for outstation');
            return;
        }
        const serviceTypeMap = {
          'RENTAL_DROP_TAXI': 'RENTAL',
          'RENTAL_HOURLY_PACKAGE': 'RENTAL',
        };
        const mappedServiceType = serviceTypeMap[values?.serviceType] || values?.serviceType;
        const quoteData = {
            serviceType: values?.serviceType == "RENTAL_DROP_TAXI" ? 'RENTAL' : values?.serviceType || mappedServiceType,
            customerId: values?.customerId?.id,
            userId: loggedInUserId || undefined,
            role: loggedInUserRole || undefined,
            packageType: 'Outstation',
            fromDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
            // carType: values?.carType != "Sedan" ? values?.carType.toUpperCase() : values?.carType,
             carType: values.serviceType === 'DRIVER' ? 'Mini' : values.carType || '',
            pickupLat: values?.pickupLocation?.lat,
            pickupLong: values?.pickupLocation?.lng,
            driverStartLat: values?.driverPickUpLocation?.lat,
            driverStartLong: values?.driverPickUpLocation?.lng,
            driverEndLat: values?.driverEndLocation?.lat || null,
            driverEndLong: values?.driverEndLocation?.lng || null,
            dropLat: values?.dropLocation?.lat,
            dropLong: values?.dropLocation?.lng,
            acType: values?.acType?.toUpperCase(),
            zone: actualZone,
            isPremiumService : values?.isPremiumService ? true : false
        };
        if (values?.serviceType !== 'RENTAL_HOURLY_PACKAGE' && values?.serviceType !== 'AUTO') {
            quoteData.bookingType = values?.tripType ? values.tripType.toUpperCase() : '';
        }
        const isDriverOutstation = values?.serviceType === 'DRIVER' && values?.packageTypeSelected === 'Outstation' && values?.serviceType === 'RENTAL';
        const isRoundTripCustom =
            isDriverOutstation &&
            values?.tripType === 'Round Trip' &&
            values?.packageSelected === 'custom_date';
        if (!isDriverOutstation || isRoundTripCustom) {
            quoteData.toDate = moment(`${values?.toDate} ${values?.toTime}`, "YYYY-MM-DD HH:mm:ss").toISOString();
        }
        if (values?.serviceType === 'DRIVER' && values?.packageTypeSelected === 'Outstation'  && values?.packageSelected !== 'custom_date') {
            quoteData.packageType = 'Outstation';
            quoteData.packageId = Number(values.packageSelected);
            quoteData.period = Number(values.packageSelected);
        }
        if (values?.serviceType === 'RENTAL_DROP_TAXI') {
            quoteData.serviceFor = 'RENTAL_DROP_TAXI';
        }
        else if (values?.serviceType === 'RENTAL_HOURLY_PACKAGE') {
            quoteData.serviceFor = 'RENTAL_HOURLY_PACKAGE';
        }
        else if (values?.serviceType === 'RENTAL') {
            quoteData.serviceFor = 'RENTAL';
        }
        else if(values?.serviceType === 'DRIVER') {
            quoteData.serviceFor = 'DRIVER';
        }
        const adminDiscountPayload = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW ? buildAdminDiscountPayload(values) : null;
        if (adminDiscountPayload) {
            quoteData.adminDiscount = adminDiscountPayload;
        }
        const data = await ApiRequestUtils.post(API_ROUTES.GET_QUOTE_OUTSTATION, quoteData);
        // console.log("QOYTEE DATA", data);
        if (data.success) {
            setQuoteDetails(data?.data);
            setDiscountDetails(data?.data);
            setQuoteMeta({
                quoteRef: data?.data?.quoteRef || '',
                adminDiscount: data?.data?.adminDiscount || null,
            });
            // Add to quotationLogs
            addQuotationLog(values, data?.data);
        }
        // console.log("QUOTE DETAILS", quoteDetails);
    };

  const zoneCheckUpFun = async (val) => {
    const serviceTypeMap = {
        'RIDES':'RIDES',
        'RENTAL_DROP_TAXI': 'RENTAL',
        'RENTAL_HOURLY_PACKAGE':'RENTAL',
        // 'DRIVER':'ACTING DRIVER'
    };
    const mappedServiceType = serviceTypeMap[val.serviceType] || val.serviceType;

    const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ZONE_PACKAGE_LIST, {
        serviceType: mappedServiceType,
        lat: val.pickupLocation.lat,
        long: val.pickupLocation.lng,
    });
    return data;
};
   const getQuoteRides = async (val, setFieldValue) => {
    let checkDistance = true;
    let checkCityLimit = true;

    if (val.serviceType === 'RIDES' || val.serviceType === 'AUTO') {
        checkDistance = await calculateDistance(val);
        checkCityLimit = await calcluateCityLimit(val);
    }

    if (!checkDistance) {
        if (val.serviceType === 'RIDES' || val.serviceType === 'AUTO') {
            setDistanceExceedModal(true);
        }
        setFieldValue?.('pickupAddress', '');
        setFieldValue?.('dropAddress', '');
        setIsButtonDisabled(false);
        return;
    } else if (!checkCityLimit) {
        setCityLimitExceedModal(true);
        setFieldValue?.('pickupAddress', '');
        setFieldValue?.('dropAddress', '');
        setIsButtonDisabled(false);
        return;
    }
    
    const serviceTypeMap = {
      'RENTAL_HOURLY_PACKAGE': 'RENTAL',
    };
    const mappedServiceType = serviceTypeMap[val.serviceType] || val.serviceType;

    let actualZone = serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';
    
    const zoneData = await zoneCheckUpFun(val);
    //  console.log("secondZone",zoneData)
    if (!zoneData.success || !zoneData.serviceArea) {
        const errorText = (() => {
            if (val.serviceType === 'RIDES') {
                return "Selected locations are outside the service area. Please choose a nearby pickup or drop location to continue.";
            } else if (val.serviceType === 'RENTAL_DROP_TAXI') {
                return "Selected locations are outside the service area. Please choose a nearby pickup location.";
            } else if (val.serviceType === 'RENTAL') {
                return "Selected locations are outside the service area. Please choose a nearby pickup location.";
            }
            return zoneData.error || 'Service not available in this area.';
        })();
        
        setZoneErrorModal({ 
            show: true, 
            text: errorText, 
            title: zoneData.title || 'Oops!' 
        });
        setFieldValue?.('pickupAddress', '');
        setIsButtonDisabled(false);
        return;
        
    }
   
    actualZone = zoneData.serviceArea.name;
    // console.log('Zone changed to', actualZone);

        const quoteDate = {
            serviceType: val.serviceType === 'RENTAL_HOURLY_PACKAGE' ? 'RENTAL' : val.serviceType || mappedServiceType,
            customerId: val?.customerId?.id,
            userId: loggedInUserId || undefined,
            role: loggedInUserRole || undefined,
            // bookingType: val?.tripType ? val.tripType.toUpperCase() : '',
            serviceFor: val.serviceType === 'RENTAL_HOURLY_PACKAGE' ? 'RENTAL_HOURLY_PACKAGE' : val.serviceType,
            packageType:'Local',
            fromDate: moment(`${val?.rideDate} ${val?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
            carType: val.serviceType === 'DRIVER' ? 'Mini' : val.carType || '',
            pickupLat: val?.pickupLocation?.lat,
            pickupLong: val?.pickupLocation?.lng,
            driverStartLat: val?.driverPickUpLocation?.lat,
            driverStartLong: val?.driverPickUpLocation?.lng,
            dropLat: val?.dropLocation?.lat,
            dropLong: val?.dropLocation?.lng,
        //     driverEndLat: values?.driverEndLocation?.lat || null,
        // driverEndLong: values?.driverEndLocation?.lng || null,
            zone: actualZone,
            isPremiumService : val?.isPremiumService ? true : false
        };
        if (val.serviceType === 'RENTAL_HOURLY_PACKAGE' || val?.serviceType === 'DRIVER') {
            quoteDate.period = packageTypeSelectedData.find(pkg => pkg.id === Number(val.packageSelected))?.period || '';
        }
        if (val?.serviceType !== 'RENTAL_HOURLY_PACKAGE' && val?.serviceType !== 'AUTO' &&  val?.serviceType !== 'RIDES') {
            quoteDate.bookingType = val?.tripType ? val.tripType.toUpperCase() : '';
        }
        const adminDiscountPayload = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW ? buildAdminDiscountPayload(val) : null;
        if (adminDiscountPayload) {
            quoteDate.adminDiscount = adminDiscountPayload;
        }
        const data = await ApiRequestUtils.post(API_ROUTES.GET_QUOTE_OUTSTATION, quoteDate);
        // console.log("QUOTE DATA", data);
        if (data?.success) {
            setQuoteDetails(data?.data)
            setDiscountDetails(data?.data);
            setQuoteMeta({
                quoteRef: data?.data?.quoteRef || '',
                adminDiscount: data?.data?.adminDiscount || null,
            });
            addQuotationLog(val, data?.data);
        }
    }

    const getQuoteParcel = async (val, setFieldValue) => {
        let actualZone = serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';

        const zoneData = await zoneCheckUpFun(val);
        if (!zoneData.success || !zoneData.serviceArea) {
            const errorText = "Selected locations are outside the service area. Please choose a nearby pickup or drop location to continue.";
            setZoneErrorModal({
                show: true,
                text: errorText,
                title: zoneData.title || 'Oops!'
            });
            setFieldValue?.('pickupAddress', '');
            setFieldValue?.('dropAddress', '');
            setIsButtonDisabled(false);
            return;
        }

        actualZone = zoneData.serviceArea.name;

        const quoteData = {
            serviceType: 'PARCEL',
            serviceFor: 'PARCEL',
            customerId: val?.customerId?.id,
            userId: loggedInUserId || undefined,
            role: loggedInUserRole || undefined,
            fromDate: moment(`${val?.rideDate} ${val?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
            pickupLat: val?.pickupLocation?.lat,
            pickupLong: val?.pickupLocation?.lng,
            dropLat: val?.dropLocation?.lat,
            dropLong: val?.dropLocation?.lng,
            zone: actualZone,
            parcelVehicleType: val?.parcelVehicleType || 'BIKE',
            // weightRange: val?.weightRange || '',
            orderType: val?.orderType || null,
            orderTypeOther: val?.orderType === 'Others' ? (val?.orderTypeOther || '') : null,
            deliveryType: 'DOOR_DELIVERY',
        };
        const adminDiscountPayload = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW ? buildAdminDiscountPayload(val) : null;
        if (adminDiscountPayload) {
            quoteData.adminDiscount = adminDiscountPayload;
        }

        const data = await ApiRequestUtils.post(API_ROUTES.GET_QUOTE_OUTSTATION, quoteData);
        if (data?.success) {
            setQuoteDetails(data?.data);
            setDiscountDetails(data?.data);
            setQuoteMeta({
                quoteRef: data?.data?.quoteRef || '',
                adminDiscount: data?.data?.adminDiscount || null,
            });
            addQuotationLog(val, data?.data);
        }
    };

    useEffect(() => {
        setBookingTimes(Utils.generateBookingTimes());
        fetchData();
        if (params && params.refreshData) {
            setShowQuickCreateCustomer(false);
        }
        if (params && params.customerPhoneNumber !== undefined) {
            setAddCustomerNumber(params.customerPhoneNumber);
            setCustomerNumber(params.customerPhoneNumber);
            setSelectedCustomer(params.selectCustomer);
        }
    }, [params]);

    useEffect(() => {
        if (params?.bookingDetails?.packageType === "Outstation" && params?.bookingDetails?.fromDate && params?.bookingDetails?.toDate) {
            setRange({ startDate: params?.bookingDetails?.fromDate, endDate: params?.bookingDetails?.toDate })
        }
    }, []);
    const initialValues = {
        packageTypeSelected: 'Local',
        rideTime: '',
        rideDate: moment().format('YYYY-MM-DD'),
        carSelected: {},
        packageSelected: "",
        fromDate: "",
        toDate: "",
        customerId: '',
        serviceType: '',
        cabType: '',
        pickupPlaceId: '',
        dropPlaceId: '',
        driverPickUpAddress: '',
        driverPickUpLocation: null,
        driverPickUpPlaceId: '',
        luggage:'',
        seaterCapacity:'',
        sourceType: '',
        isPremiumService : '',
        driverEndAddress: '',
        driverEndLocation: null,
        driverEndPlaceId: '',
        isPickupSameAsDriverStart: false,
        parcelVehicleType: 'BIKE',
        // weightRange: 'W_0_7',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        senderName: '',
        senderPhone: '',
        senderAddress: '',
        orderType: '',
        orderTypeOther: '',
        deliveryInstructions: '',
        adminDiscountType: '',
        adminDiscountValue: '',
        adminDiscountRemarks: '',
    };

    const handleDateChange = (dates, setFieldValue, handleChange, rideDate) => {
        const [start, end] = dates;
        setFieldValue('fromDate', start);
        setFieldValue('toDate', end);
        setFieldValue('packageSelected', '0')
        if (start && end) {
            setRange({ startDate: start, endDate: end });
            setDatePickerVisible(false);
        }
        let startDate = moment(start).format("DD-MM-YYYY");
        if (rideDate != startDate) {
            setFieldValue('rideDate', moment(start).format("YYYY-MM-DD"));
            setBookingTimesForDay(Utils.generateBookingTimesForDay(moment(start).format("YYYY-MM-DD")));
        }
    };

    const countDaysBetween = (date1, date2) => {
        //console.log("countDaysBetween", date1, date2);
        const timeDiff = date2.getTime() - date1.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    };

    let days, daysText;
    if (range.startDate && range.endDate) {
        days = countDaysBetween(range.startDate, range.endDate);
        daysText = days == 1 ? '1 Day' : days == 1 ? '2 Days and 1 Night' : `${days} Days and ${days - 1} Nights`;
    }

    const calculateDistance = async (values) => {
    const calculateDistance = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DISTANCE_CHECKING, {
        pickupLat: values.pickupLocation.lat,
        pickupLong: values.pickupLocation.lng,
        dropLat: values.dropLocation?.lat,
        dropLong: values.dropLocation?.lng,
        serviceType: values.serviceType === 'RENTAL_DROP_TAXI' ? "RENTAL" : values.serviceType,
    });

    if (calculateDistance?.success) {
        if (values.serviceType === "RIDES") {
            return calculateDistance?.data?.showAlert; // Existing logic for RIDES
        } else if (values.serviceType === "AUTO") {
            return calculateDistance?.data?.showAlert;
        } else if (values.serviceType === "RENTAL" && values.packageTypeSelected === 'Outstation' && values.tripType === 'Round Trip') {
            const showAlert = calculateDistance?.data?.showAlert;
            return showAlert !== undefined ? showAlert : true;
        } else if (values.serviceType ==='RENTAL_DROP_TAXI') {
                const rawDistance = calculateDistance?.data?.estimatedDistance || calculateDistance?.data?.kilometer;
                const distance = rawDistance ? parseFloat(rawDistance) : 0;
                const showAlert = calculateDistance?.data?.showAlert;
                if (distance > 300) {
                    setDropTaxiModalContent("Booking not available for the selected route. Try outstation service.");
                    return false;
                }
                if (showAlert === false) {
                    setDropTaxiModalContent("Try our Local Ride, it s faster and more affordable for short distances!");
                    return false;
                }
                return true;
        }
    }
    return true;
};

    const calcluateCityLimit = async (values) => {
        let calculateDistance = await ApiRequestUtils.getWithQueryParam(API_ROUTES.CITY_LIMIT_CHECKING, {
            pickupLat: values.pickupLocation.lat,
            pickupLong: values.pickupLocation.lng,
            dropLat: values.dropLocation?.lat,
            dropLong: values.dropLocation?.lng,
        });
        if (calculateDistance?.success) {
            return calculateDistance?.cityLimit;
        }
        return false;
    };

const sendQuotationLogs = async (bookingId, userId, fallbackSubZoneId = null) => {
    try {
        if (!Array.isArray(quotationLogs) || quotationLogs.length === 0) {
            return;
        }
        // Update bookingId and ensure userId is included in all logs
        const updatedLogs = quotationLogs.map(log => ({
            ...log,
            bookingId: bookingId || 0, // Update with actual bookingId
            userId: userId || log.userId || 0, // Use provided userId or fallback to log's userId
            subZoneId: Number(log?.subZoneId || 0) > 0
                ? Number(log.subZoneId)
                : (Number(fallbackSubZoneId || 0) > 0 ? Number(fallbackSubZoneId) : 0),
        }));
        const response = await ApiRequestUtils.post(API_ROUTES.POST_QUOTATION_LOG, updatedLogs);
        if (response?.success) {
            // console.log('Quotation logs sent successfully:', response);
            setQuotationLogs([]); // Clear the logs after successful submission
        } else {
            console.error('Failed to send quotation logs:', response?.message);
        }
    } catch (error) {
        console.error('Error sending quotation logs:', error);
    }
};

    const onParcelSubmitHandler = async (values, formikBag) => {
        if (isButtonDisabled) return false;
        setIsButtonDisabled(true);

        try {
            const resolveLocationByAddress = async (address,placeId) => {
                if (!address) return null;
                try {
                    const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_LATLONG, { address,placeId });
                    if (data?.success && data?.data?.lat && data?.data?.lng) {
                        return { lat: data.data.lat, lng: data.data.lng };
                    }
                } catch (err) {
                    console.error('Failed to resolve address to lat/lng:', err);
                }
                return null;
            };

            const pickupAddress = values.pickupAddress || values.senderAddress;
            const dropAddress = values.dropAddress || values.receiverAddress;
            let pickupLocation = values.pickupLocation;
            let dropLocation = values.dropLocation;

            if ((!pickupLocation?.lat || !pickupLocation?.lng) && pickupAddress) {
                pickupLocation = await resolveLocationByAddress(pickupAddress);
            }
            if ((!dropLocation?.lat || !dropLocation?.lng) && dropAddress) {
                dropLocation = await resolveLocationByAddress(dropAddress);
            }

            if (!pickupAddress || !dropAddress || !pickupLocation || !dropLocation) {
                formikBag.setStatus({ submit: 'Please enter valid sender and receiver address.' });
                return false;
            }

            const parcelValues = {  
                ...values,
                pickupAddress,
                dropAddress,
                pickupLocation,
                dropLocation,
            };

            const zoneCheckUp = await zoneCheckUpFun(parcelValues);
            if (!zoneCheckUp.success || !zoneCheckUp.serviceArea) {
                const errorText = "Selected locations are outside the service area. Please choose a nearby pickup or drop location to continue.";
                setZoneErrorModal({ show: true, text: errorText, title: zoneCheckUp.title || 'Oops!' });
                return false;
            }

            const actualZone = zoneCheckUp.serviceArea.name || serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';
            const bookingData = {
                serviceType: 'PARCEL',
                parcelDirection:'RECEIVER',
                deliveryType:'DOOR_DELIVERY',
                source: 'Call',
                sourceType: values.sourceType,
                ...((values.sourceType === "Others" || values.sourceType === "Offline Ads") && {
                    otherSourceType: values.otherSourceType?.trim() || null
                }),
                customerId: values?.customerId?.id,
                pickupLat: pickupLocation?.lat,
                pickupLong: pickupLocation?.lng,
                pickupAddress: makeAddressPayload(pickupAddress, values.pickupPlaceId),
                dropLat: dropLocation?.lat,
                dropLong: dropLocation?.lng,
                dropAddress: makeAddressPayload(dropAddress, values.dropPlaceId),
                zone: actualZone,
                landmark: values.landmark || '',
                parcelVehicleType: values.parcelVehicleType || 'BIKE',
                // weightRange: values.weightRange,
                receiverName: values.receiverName || '',
                receiverPhone: values.receiverPhone || '',
                receiverAddress: values.receiverAddress || '',
                senderName: values.senderName || '',
                senderPhone: values.senderPhone || '',
                senderAddress: values.senderAddress || '',
                orderType: values.orderType || null,
                orderTypeOther: values.orderType === 'Others' ? (values.orderTypeOther || '') : null,
                deliveryInstructions: values.deliveryInstructions || '',
                fromDate: moment(`${values.rideDate} ${values.rideTime || '00:00'}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
            };
            if (quoteMeta?.quoteRef) {
                bookingData.quoteRef = quoteMeta.quoteRef;
            }
            const adminDiscountFromQuote = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
                ? buildAdminDiscountFromQuoteMeta(quoteMeta?.adminDiscount)
                : null;
            if (adminDiscountFromQuote) {
                bookingData.adminDiscount = adminDiscountFromQuote;
            }
            const data = await ApiRequestUtils.post(API_ROUTES.ADD_SUPPORT_PARCEL_BOOKING, bookingData, values?.customerId?.id);
            if (data?.success) {
                const createdBooking = data?.data?.result || data?.data;
                setIsOpen(false);
                setBookingData(createdBooking);
                if (createdBooking?.id) {
                    await sendQuotationLogs(createdBooking.id, loggedInUserId, createdBooking?.subZoneId || null);
                }
                const targetBookingId = createdBooking?.id;
                const targetCustomerId = createdBooking?.customerId || values?.customerId?.id || 0;
                const targetQuoteRef = normalizeQuoteRef(
                    createdBooking?.quoteRef ||
                    data?.data?.quoteRef ||
                    bookingData?.quoteRef ||
                    quoteMeta?.quoteRef ||
                    ''
                );
                const confirmBookingSearchParams = new URLSearchParams({
                    bookingId: String(targetBookingId || 0),
                    customerId: String(targetCustomerId),
                    fromPath: location.pathname,
                });
                if (targetQuoteRef) {
                    confirmBookingSearchParams.set("quoteRef", targetQuoteRef);
                }
                navigate(`/dashboard/confirm-booking?${confirmBookingSearchParams.toString()}`, {
                    state: {
                        quoteRef: targetQuoteRef,
                    },
                });
                formikBag.resetForm();
                setSelectedCustomer(0);
                setSearchBookingId('');
                return true;
            } else {
                formikBag.setStatus({ submit: data?.message || 'Failed to create parcel booking. Please try again.' });
                return false;
            }
        } catch (error) {
            console.error('Error in onParcelSubmitHandler:', error);
            formikBag.setStatus({ submit: 'An error occurred while creating parcel booking. Please try again.' });
            return false;
        } finally {
            setIsButtonDisabled(false);
            formikBag.setSubmitting(false);
    }
};
    const onRideSubmitHandler = async (values, formikBag) => {
        if (isButtonDisabled) return false;
        setIsButtonDisabled(true);

        try {
            let zoneCheckUp = await zoneCheckUpFun(values);
            let checkDistance = await calculateDistance(values);
            let checkCityLimit = await calcluateCityLimit(values);

            let actualZone = '';
            if (values.serviceType === 'RIDES') {
                if (!zoneCheckUp.success || !zoneCheckUp.serviceArea) {
                    const errorText = "Selected locations are outside the service area. Please choose a nearby pickup or drop location to continue.";
                    setZoneErrorModal({ show: true, text: errorText, title: zoneCheckUp.title || 'Oops!' });
                    setIsButtonDisabled(false);
                    return false;
                }
                actualZone = zoneCheckUp.serviceArea.name;
                // console.log("third Zone",actualZone)
            } else {
                actualZone = serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';
            }

            if (!checkDistance) {
                setDistanceExceedModal(true);
                setIsButtonDisabled(false);
                return false;
            } else if (!checkCityLimit) {
                setCityLimitExceedModal(true);
                setIsButtonDisabled(false);
                return false;
            }

        const bookingData = {
            pickupLat: values.pickupLocation.lat,
            pickupLong: values.pickupLocation.lng,
            pickupAddress: makeAddressPayload(values.pickupAddress, values.pickupPlaceId),
            dropLat: values.dropLocation?.lat,
            dropLong: values.dropLocation?.lng,
            dropAddress: makeAddressPayload(values.dropAddress, values.dropPlaceId),
            driverStartLat: values.driverPickUpLocation?.lat,
            driverStartLong: values.driverPickUpLocation?.lng,
            driverStartAddress: makeAddressPayload(values.driverPickUpAddress, values.driverPickUpPlaceId),
            source: 'Call',
            carType: values.carType,
            sourceType: values.sourceType,
            ...((values.sourceType === "Others" || values.sourceType === "Offline Ads") && {
                otherSourceType: values.otherSourceType?.trim() || null
            }),
            serviceType:values.serviceType,
            zone: actualZone,  
            landmark: values.landmark || '',
            fromDate: moment(`${values.rideDate} ${values.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
            isPremiumService : values?.isPremiumService ? true : false
        }
        if (quoteMeta?.quoteRef) {
            bookingData.quoteRef = quoteMeta.quoteRef;
        }
        const adminDiscountFromQuote = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
            ? buildAdminDiscountFromQuoteMeta(quoteMeta?.adminDiscount)
            : null;
        if (adminDiscountFromQuote) {
            bookingData.adminDiscount = adminDiscountFromQuote;
        }
        let data = await ApiRequestUtils.post(API_ROUTES.ADD_NEW_RIDES_BOOKING, bookingData, values.customerId?.id);
        if (data?.success) {
            setIsOpen(false);
            setBookingData(data?.data);
             await sendQuotationLogs(data?.data?.id, loggedInUserId);
            navigate('/dashboard/booking');
            formikBag.resetForm();
            setSelectedCustomer(0);
            setSearchBookingId('');
            return true;
        } else {
            // console.log("Error in creating new booking");
            formikBag.setStatus({ submit: data?.message || 'Failed to create booking. Please try again.' });
            return false;
        }
    } catch (err) {
        // console.log("ERROR IN RIDES BOOKING", err);
        formikBag.setStatus({ submit: 'An error occurred. Please try again.' });
        return false;
    } finally {
        setIsButtonDisabled(false);
        formikBag.setSubmitting(false); // Ensure form is not stuck in submitting state
    }
};

 const onAutoSubmitHandler = async (values, formikBag) => {
       let zoneCheckUp = await zoneCheckUpFun(values)
            let actualZone = '';
            if (values.serviceType === 'AUTO') {
                if (!zoneCheckUp.success || !zoneCheckUp.serviceArea) {
                    const errorText = "Selected locations are outside the service area. Please choose a nearby pickup or drop location to continue.";
                    setZoneErrorModal({ show: true, text: errorText, title: zoneCheckUp.title || 'Oops!' });
                    setIsButtonDisabled(false);
                    return false;
                }
                actualZone = zoneCheckUp.serviceArea.name;
                // console.log("third Zone",actualZone)
            } else {
                actualZone = serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';
            }
        const bookingData = {
            pickupLat: values.pickupLocation.lat,
            pickupLong: values.pickupLocation.lng,
            pickupAddress: makeAddressPayload(values.pickupAddress, values.pickupPlaceId),
            dropLat: values.dropLocation?.lat,
            dropLong: values.dropLocation?.lng,
            dropAddress: makeAddressPayload(values.dropAddress, values.dropPlaceId),
            // bookingType: 'DROP ONLY',
            source: values.source || 'Call',
            sourceType: values.sourceType,
            driverStartLat: values.driverPickUpLocation?.lat,
            driverStartLong: values.driverPickUpLocation?.lng,
            driverStartAddress: makeAddressPayload(values.driverPickUpAddress, values.driverPickUpPlaceId),
            driverEndLat: values.driverEndLocation?.lat || null,
            zone: actualZone, 
            landMark: values.landMark || '',
            isPremiumService : values?.isPremiumService ? true : false,
            fromDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
        };
        if (quoteMeta?.quoteRef) {
            bookingData.quoteRef = quoteMeta.quoteRef;
        }
        const adminDiscountFromQuote = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
            ? buildAdminDiscountFromQuoteMeta(quoteMeta?.adminDiscount)
            : null;
        if (adminDiscountFromQuote) {
            bookingData.adminDiscount = adminDiscountFromQuote;
        }

        try {
            // console.log('AUTO Booking Payload:', bookingData);
            const data = await ApiRequestUtils.post(API_ROUTES.ADD_NEW_AUTO_BOOKING, bookingData,values?.customerId?.id,
       );
            if (data?.success) {
                setIsOpen(false);
                setBookingData(data?.data);
                await sendQuotationLogs(data?.data?.id, loggedInUserId);
                return true;
            } else {
                formikBag?.setStatus({
                    submit: data?.message || 'Failed to create AUTO booking. Please check pickup date/time and try again.',
                });
                return false;
            }
        } catch (error) {
            console.error('Error in onAutoSubmitHandler:', {
                error: error.message,
                stack: error.stack,
            });
            formikBag?.setStatus({
                submit: 'An error occurred while creating AUTO booking. Please try again.',
            });
            return false;
        }
    };

   const onSubmitHandler = async (values, formikBag) => {
    const serviceTypeMap = {
        'RENTAL_DROP_TAXI': 'RENTAL',
        'RENTAL_HOURLY_PACKAGE': 'RENTAL'
    };
    const mappedServiceType = serviceTypeMap[values.serviceType] || values.serviceType;
    try {

    const isRentalOutstationRoundTrip =
        values.serviceType === 'RENTAL' &&
        values.packageTypeSelected === 'Outstation' &&
        values.tripType === 'Round Trip';

    if (values.serviceType === 'RENTAL_DROP_TAXI' || isRentalOutstationRoundTrip) {
        const checkDistance = await calculateDistance(values);
        if (!checkDistance) {
            if (isRentalOutstationRoundTrip) {
                setOutstationDistanceModal(true);
            } else {
            setDropTaxiDistanceExceedModal(true); // Show the DropTaxi distance exceed modal
            }
            setIsButtonDisabled(false);
            return false;
        }
    }

    const zoneData = await zoneCheckUpFun(values);
    let actualZone = serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';
    if (zoneData.success && zoneData.serviceArea) {
        actualZone = zoneData.serviceArea.name;
        // console.log('Zone for booking', actualZone);
    }

        const selectedPackage = packageTypeSelectedData.find(
            (pkg) => pkg.id === Number(values?.packageSelected)
        );

        const period =
            values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation'
                ? (values.packageSelected && values.packageSelected !== 'custom_date' ? Number(values.packageSelected) : '')
                : (values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'DRIVER'
                    ? selectedPackage?.period || ''
                    : '');

        const bookingData = {
            carId: values?.carSelected?.id,
            packageId: values?.packageSelected === "0" || values?.packageSelected === "custom_date" ? 0 : Number(values?.packageSelected),
            packageType: values?.packageTypeSelected,
            date: values?.rideDate,
            time: values?.rideTime,
            // fromDate: values.fromDate,
            customerId: values.customerId?.id,
            adminBooking: true,
            serviceType: values.serviceType || "AUTO",
            cabType: values.cabType,
            ...((values?.serviceType !== 'RENTAL_HOURLY_PACKAGE' && values?.serviceType !== 'AUTO') && {
                bookingType: values?.tripType?.toUpperCase() || '',
            }),
            // acType: values?.acType?.toUpperCase(),
            ...(values.acType ? { acType: values.acType.toUpperCase() } : {}),
            // transmissionType: values.transmissionType,
            // ...(values.transmissionType ? { transmissionType: values.transmissionType } : {}),
            carType: values.serviceType === 'DRIVER' ? 'Mini' : values.carType || '',
            fromDate: moment(`${values.rideDate} ${values.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
            pickupLat: values.pickupLocation.lat,
            pickupLong: values.pickupLocation.lng,
            pickupAddress: {
                name: values.pickupAddress,
                placeId: values.pickupPlaceId || '',
            },
            driverStartLat: values.driverPickUpLocation?.lat,
            driverStartLong: values.driverPickUpLocation?.lng,
            driverStartAddress: makeAddressPayload(values.driverPickUpAddress, values.driverPickUpPlaceId),
            source: 'Call',
            sourceType: values.sourceType,
            ...((values.sourceType === "Others" || values.sourceType === "Offline Ads") && {
             otherSourceType: values.otherSourceType?.trim() || null
            }),
            luggage: values.luggage,
            seaterCapacity:values.seaterCapacity,
            landmark: values.landmark || '',
            period,
            serviceType: values.serviceType || mappedServiceType,
            zone: actualZone,
            isPremiumService : values?.isPremiumService ? true : false
        };
        if (quoteMeta?.quoteRef) {
            bookingData.quoteRef = quoteMeta.quoteRef;
        }
        const adminDiscountFromQuote = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
            ? buildAdminDiscountFromQuoteMeta(quoteMeta?.adminDiscount)
            : null;
        if (adminDiscountFromQuote) {
            bookingData.adminDiscount = adminDiscountFromQuote;
        }
        if(values.serviceType !== "RENTAL_HOURLY_PACKAGE" )
        {
            bookingData.dropLat= values.dropLocation?.lat;
            bookingData.dropLong= values.dropLocation?.lng;
            bookingData.dropAddress= values.dropLocation ? {
                name: values.dropAddress
            } : null;

            if (values.driverEndLocation) {
                bookingData.driverEndLat = values.driverEndLocation.lat;
                bookingData.driverEndLong = values.driverEndLocation.lng;
                bookingData.driverEndAddress = makeAddressPayload(values.driverEndAddress, values.driverEndPlaceId);
            }

            if (values.driverPickUpAddress) {
                bookingData.driverStartAddress = makeAddressPayload(values.driverPickUpAddress, values.driverPickUpPlaceId);
            }
        }
       if (values.serviceType !== "RENTAL_DROP_TAXI") {
           if (values.driverEndLocation) {
               bookingData.driverEndLat = values.driverEndLocation.lat;
               bookingData.driverEndLong = values.driverEndLocation.lng;
               bookingData.driverEndAddress = makeAddressPayload(values.driverEndAddress, values.driverEndPlaceId);
           }
       }

        if (values.toDate && values.toTime) {
            bookingData.toDate = moment(`${values.toDate} ${values.toTime}`, "YYYY-MM-DD HH:mm:ss").toISOString()
        };
        let data;
        data = await ApiRequestUtils.post(values.serviceType == "DRIVER" ? API_ROUTES.ADD_NEW_BOOKING : API_ROUTES.ADD_NEW_RENTAL_BOOKING, bookingData, values?.customerId?.id);
        if (data?.success) {
            setIsOpen(false);
        await sendQuotationLogs(data?.data?.result?.id, loggedInUserId);
            if (params?.bookingDetails) {
                const targetBookingId = data?.data?.result?.id || params?.bookingDetails?.id;
                const targetCustomerId = values?.customerId?.id || params?.bookingDetails?.customerId || 0;
                const targetQuoteRef = normalizeQuoteRef(
                    data?.data?.result?.quoteRef ||
                    data?.data?.quoteRef ||
                    bookingData?.quoteRef ||
                    quoteMeta?.quoteRef ||
                    ''
                );
                const confirmBookingSearchParams = new URLSearchParams({
                    bookingId: String(targetBookingId || 0),
                    customerId: String(targetCustomerId),
                    fromPath: location.pathname,
                });
                if (targetQuoteRef) {
                    confirmBookingSearchParams.set("quoteRef", targetQuoteRef);
                }
                navigate(`/dashboard/confirm-booking?${confirmBookingSearchParams.toString()}`, {
                    state: {
                        quoteRef: targetQuoteRef,
                    },
                });
            } else {
                setBookingStage(1);
                setRange({ startDate: new Date(values?.fromDate), endDate: new Date(values?.toDate) })
                setBookingData(data?.data);
            }
            return true;
        } else {
            const submitMessage = data?.message || 'Failed to create booking. Please check pickup date/time and try again.';
            formikBag?.setStatus({
                submit: submitMessage,
            });
            return false;
        }
    } catch (error) {
        console.error('Error in onSubmitHandler:', error);
        const submitMessage = 'An error occurred while creating booking. Please try again.';
        formikBag?.setStatus({
            submit: submitMessage,
        });
        return false;
        }
    };

    function convertTimeFormat(time) {
        let [hours, minutes, seconds] = time.split(':');
        hours = parseInt(hours);
        const period = hours >= 12 ? 'p.m.' : 'a.m.';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${period}`;
    };

    const onAssignDriver = (data) => {
        setBookingData(data);
        setBookingStage(2);
        setBookingView(false);
        setEditBooking();
        setSelectedCustomer(0);
        setSearchBookingId('');
    };

    const onEditBooking = async (data) => {
        // console.log('ON EDIT BOOKING :', data);
        setEditBooking(data);
        setBookingStage(0);
        setEditBookingView(true);
        setBookingView(false);
    };

    const onEditBackPress = () => {
        setEditBookingView(false);
        setIsOpen(false);
    };

    const onSelectBooking = (data) => {
        const targetBookingId = data?.id;
        const targetCustomerId = data?.customerId || data?.Customer?.id || 0;
        const targetQuoteRef = normalizeQuoteRef(
            data?.quoteRef ||
            data?.paymentDetails?.adminDiscount?.quoteRef ||
            data?.adminDiscount?.quoteRef ||
            ''
        );
        const confirmBookingSearchParams = new URLSearchParams({
            bookingId: String(targetBookingId || 0),
            customerId: String(targetCustomerId),
            fromPath: location.pathname,
        });
        if (targetQuoteRef) {
            confirmBookingSearchParams.set("quoteRef", targetQuoteRef);
        }
        navigate(`/dashboard/confirm-booking?${confirmBookingSearchParams.toString()}`, {
            state: {
                quoteRef: targetQuoteRef,
            },
        });
                // console.log('selecting booking', data);
        // setBookingStage(4);
        // setBookingData(data);
        // setBookingView(true);
        // setEditBooking();
        // setEditBookingView(false);
    };

    const onConfirmBooking = () => {
        setBookingStage(0);
        setBookingView(false);
        //console.log("LIST", bookingStage);
    };

    // if (loading) {
    //     return (
    //         <div className="flex justify-center items-center h-screen">
    //             <Spinner className="h-12 w-12" />
    //         </div>
    //     );
    // }
    const onCancelBookingView = () => { }

    const resetPackageValues = (setFieldValue, newServiceType) => {
        // Clear location-related fields
        // setFieldValue('pickupAddress', '');
        // setFieldValue('pickupLocation', null);
        // setFieldValue('pickupPlaceId', '');
        setFieldValue('dropAddress', '');
        setFieldValue('dropLocation', null);
        setFieldValue('dropPlaceId', '');
        setFieldValue('driverPickUpAddress', '');
        setFieldValue('driverPickUpLocation', null);
        setFieldValue('driverPickUpPlaceId', '');
        setFieldValue('driverEndAddress', '');
        setFieldValue('driverEndLocation', null);
        setFieldValue('driverEndPlaceId', '');
        setFieldValue('isPickupSameAsDriverStart', false);
        setFieldValue('parcelVehicleType', 'BIKE');
        // setFieldValue('weightRange', 'W_0_7');
        setFieldValue('receiverName', '');
        setFieldValue('receiverPhone', '');
        setFieldValue('receiverAddress', '');
        setFieldValue('senderName', '');
        setFieldValue('senderPhone', '');
        setFieldValue('senderAddress', '');
        setFieldValue('orderType', '');
        setFieldValue('orderTypeOther', '');
        setFieldValue('deliveryInstructions', '');

        // Clear vehicle / service-related fields
        setFieldValue('carType', newServiceType === 'DRIVER' ? 'Mini' : '');
        // setFieldValue('cabType', '');
        // setFieldValue('luggage', '');
        // setFieldValue('seaterCapacity', '');
        setFieldValue('acType', '');
        // setFieldValue('transmissionType', '');

        // Clear package selection
        setFieldValue('packageSelected', '');

        if (newServiceType === 'CAR_WASH') {
            setFieldValue('packageTypeSelected', 'CarWash');
        } else if (newServiceType === 'DRIVER') {
            setFieldValue('packageTypeSelected', 'Local');
            setFieldValue('tripType', 'Drop Only');
            setFieldValue('packageTypeSelected', 'Outstation');
            setFieldValue('tripType', 'Round Trip');
        } else if (newServiceType === 'RENTAL_HOURLY_PACKAGE') {
            setFieldValue('packageTypeSelected', 'Local');
            setFieldValue('tripType', 'Drop Only');
        } else if (newServiceType === 'RENTAL') {
            setFieldValue('packageTypeSelected', 'Outstation');
            setFieldValue('tripType', 'Round Trip');
            setFieldValue('acType', 'Ac');
        } else if (newServiceType === 'RENTAL_DROP_TAXI') {
            setFieldValue('packageTypeSelected', 'Outstation');
            setFieldValue('tripType', 'Drop Only');
            setFieldValue('acType', 'Ac');
        } else {
            setFieldValue('packageTypeSelected', '');
        }

        // Clear package date range
        setFieldValue('fromDate', '');
        setFieldValue('toDate', '');
        setRange({});
        setDatePickerVisible(false);
    };

    const searchLocations = async (query, isPickup, type) => {
        if (query.length > 2) {
            try {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
            if (data?.success && data?.data) {
                if (isPickup) {
                    setPickupSuggestions(data?.data);
                } else if (type === 'driver') {
                    setDriverSuggestions(data?.data);
                }else if (type === 'driverEnd') {
                    setDriverEndSuggestions(data?.data);  // New
                } else {
                    setDropSuggestions(data?.data);
                }
            } else {
                setPickupSuggestions([]);
                setDriverSuggestions([]);
                setDropSuggestions([]);
                setDriverEndSuggestions([]);
            }
        } catch (error) {
            console.error('Error searching locations:', error);
            setPickupSuggestions([]);
            setDriverSuggestions([]);
            setDropSuggestions([]);
            }
        } else {
            setPickupSuggestions([]);
            setDriverSuggestions([]);
            setDropSuggestions([]);
            setDriverEndSuggestions([]);
        }
    };

   const handleSelectLocation = async (address,placeId, isPickup, type, setFieldValue, values) => {
    const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_LATLONG, { address,placeId });
    if (data?.success) {
        const location = { lat: data.data.lat, lng: data.data.lng };
        if (isPickup) {
            setFieldValue("pickupAddress", address);
            setFieldValue("pickupPlaceId", placeId || "");
            setFieldValue("pickupLocation", location);
            setPickupLocation(location);
            setPickupSuggestions([]);
            if (values?.serviceType === 'PARCEL') {
                setFieldValue("senderAddress", address);
            }

            // Check zone for pickup location
            const zoneData = await zoneCheckUpFun({ 
                serviceType: values.serviceType || currentServiceType,
                pickupLocation: location 
            });
            if (zoneData.success && zoneData.serviceArea) {
                const newArea = serviceAreas.find(area => area.name === zoneData.serviceArea.name);
                if (newArea && newArea.id !== parseInt(selectedAreaId)) {
                    setSelectedAreaId(newArea.id);
                    setFieldValue("serviceTypeArea", newArea.id);
                    getPackageListDetails(currentServiceType, newArea.name);
                }
            } else {
                const errorText = (() => {
                    if (values.serviceType === 'RIDES') {
                        return "Selected locations are outside the service area. Please choose a nearby pickup location to continue.";
                    } else if (values.serviceType === 'RENTAL_DROP_TAXI') {
                        return "Selected locations are outside the service area. Please choose a nearby pickup location.";
                    } else if (values.serviceType === 'RENTAL') {
                        return "Selected locations are outside the service area. Please choose a nearby pickup location.";
                    }
                    return zoneData.error || 'Service not available in this area.';
                })();
                
                setZoneErrorModal({ 
                    show: true, 
                    text: errorText, 
                    title: zoneData.title || 'Oops!' 
                });
                setFieldValue("pickupAddress", "");
                setFieldValue("pickupLocation", null);
                setPickupLocation(null);
            }
        } else if (type === 'driver') {
            setFieldValue("driverPickUpAddress", address);
            setFieldValue("driverPickUpPlaceId", placeId || "");
            setFieldValue("driverPickUpLocation", location);
            setDriverPickUpLocation(location);
            setDriverSuggestions([]);
        }else if (type === 'driverEnd') {  // NEW
            setFieldValue("driverEndAddress", address);
            setFieldValue("driverEndPlaceId", placeId || "");
            setFieldValue("driverEndLocation", location);
            setDriverEndLocation(location);
            setDriverEndSuggestions([]);
        } 
        else {
            setFieldValue("dropAddress", address);
            setFieldValue("dropPlaceId", placeId || "");
            setFieldValue("dropLocation", location);
            setDropLocation(location);
            setDropSuggestions([]);
            if (values?.serviceType === 'PARCEL') {
                setFieldValue("receiverAddress", address);
            }
        }
    }
};

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY_UAT,
    });

    const validationCheckForDriver = (val) => {
        if (!val || val.serviceType !== "DRIVER") { return false; }

        // const currentDate = new Date(); 
        // const rideDate = val.rideDate ? new Date(val.rideDate) : null;
        // if (!rideDate || rideDate <= currentDate) { return true; }

        if (val.packageTypeSelected === "Local") {
            if (!val.packageSelected) { return true; } return false;
        }

        if (val.packageTypeSelected === "Local" && val.tripType === "Drop Only") {
            if (!val.dropLocation) { return true; } return false;
        }

        // if (val.packageTypeSelected === "Outstation" && val.tripType === "Drop Only") {
        //     if (!val.dropLocation) { return true; } return false;
        // }

        if (val.packageTypeSelected === "Outstation" && val.tripType === "Round Trip") {
            if (!val.dropLocation || !val.toDate || !val.toTime) { return true; } return false;
        }

        return false;
    };

    const validationCheckForDriverRental = (val) => {
        if (!val || val.serviceType !== "RENTAL") { return false; }

        if (val.packageTypeSelected == "Outstation" && val.tripType === "Drop Only") {
            if (!val.dropLocation) { return true; } return false;
        }
        if (val.packageTypeSelected == "Outstation") {
            if (!val.acType) { return true; } return false;
        }
    }
    // const handlePickupMarkerDragEnd = useCallback((event) => {
    //     const newLat = event.latLng.lat();
    //     const newLng = event.latLng.lng();
    //     setPickupLocation({ lat: newLat, lng: newLng });

    //     // Fetch the address using Geocoding API
    //     const geocoder = new window.google.maps.Geocoder();
    //     geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
    //         if (status === 'OK' && results[0]) {
    //             setPickupAddress(results[0].formatted_address);
    //             setFieldValue("pickupAddress", results[0].formatted_address);
    //         } else {
    //             setPickupAddress('Address not found');
    //         }
    //     });
    // }, []);

    // const handleDropMarkerDragEnd = useCallback((event) => {
    //     const newLat = event.latLng.lat();
    //     const newLng = event.latLng.lng();
    //     setDropLocation({ lat: newLat, lng: newLng });

    //     // Fetch the address using Geocoding API
    //     const geocoder = new window.google.maps.Geocoder();
    //     geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
    //         if (status === 'OK' && results[0]) {
    //             setFieldValue("dropAddress", results[0].formatted_address);
    //             setDropAddress(results[0].formatted_address);
    //         } else {
    //             setDropAddress('Address not found');
    //         }
    //     });
    // }, []);

    const getStatusDisplay = (status) => {
        const statusLower = status?.toLowerCase();

        switch (statusLower) {
            case 'started':
                return (
                    <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
                        On Trip
                    </span>
                );
            case 'ended':
                if (bookingData?.tripStatus === true) {
                return (
                    <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
                        Completed
                    </span>
                );
            }
            return (
                <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
                    ENDED
                </span>
            );
            case 'customer_cancelled':
                return (
                    <span className="mx-3 px-2 py-1 text-white bg-gray-600 rounded-md text-sm font-medium">
                        Cancelled
                    </span>
                );
                case 'cancelled':
                return (
                    <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
                       Customer Cancelled
                    </span>
                );
            case 'initiated':
                if (bookingData?.Driver?.id || bookingData?.Cab?.id) {
                    return (
                        <span className="mx-3 px-2 py-1 text-white bg-gray-600 rounded-md text-sm font-medium">
                            Booked
                        </span>
                    );
                }
                case 'quoted':
                return (
                    <span className="mx-3 px-2 py-1 text-white bg-yellow-600 rounded-md text-sm font-medium">
                        QUOTED
                    </span>
                );

                case 'confirmed':
                    return(
                        <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
                        CONFIRMED
                    </span>
                    );
                case 'request_driver':
                   return(
                        <span className="mx-3 px-2 py-1 text-white bg-orange-600 rounded-md text-sm font-medium">
                        REQUEST DRIVER
                    </span>
                    );
                case 'booking_accepted':
                   return(
                        <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
                        DRIVER ACCEPTED
                    </span>
                    );
                case 'end_otp':
                   return(
                        <span className="mx-3 px-2 py-1 text-white bg-gray-600 rounded-md text-sm font-medium">
                        END OTP
                    </span>
                    );
                case 'driver_on_the_way':
                   return(
                        <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
                        DRIVER ON THE WAY
                    </span>
                    );
                case 'driver_reached':
                   return(
                        <span className="mx-3 px-2 py-1 text-white bg-yellow-600 rounded-md text-sm font-medium">
                        DRIVER REACHED
                    </span>
                    );
                case 'payment_requested':
                   return(
                        <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
                        PAYMENT REQUESTED
                    </span>
                    );
                      case 'support_cancelled':
                   return(
                        <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
                        SUPPORT CANCELLED
                    </span>
                    );
            default:
                return null;
        }
    };

    const serviceDisplayNames = {
        DRIVER: "Acting Driver",
        RIDES: "Local Rides",
        RENTAL_DROP_TAXI: "Drop Taxi",
        RENTAL_HOURLY_PACKAGE: "Hourly Package",
        RENTAL: "Outstation",
        AUTO : "Auto",
        PARCEL: "Parcel",
    };
const cancelChargeApplicable = quoteDetails?.cancelCharge?.cancelChargeApplicable === true;
const cancelChargeAmount = cancelChargeApplicable ? Number(quoteDetails?.cancelCharge?.cancelCharge || 0) : 0;
const systemDiscountAmount = Number(quoteDetails?.discount?.amount || 0);
const systemDiscountPercentage = Number(quoteDetails?.discount?.percentage || 0);
const useSystemAmountDiscount = systemDiscountAmount > 0;
const useSystemPercentDiscount = !useSystemAmountDiscount && systemDiscountPercentage > 0;
const totalestimationfare =
  useSystemAmountDiscount
    ? Number(quoteDetails?.amount?.estimatedPrice || 0) - systemDiscountAmount
    : useSystemPercentDiscount
      ? Number(quoteDetails?.amount?.estimatedPrice || 0) -
        (Number(quoteDetails?.amount?.estimatedPrice || 0) * (systemDiscountPercentage / 100))
      : Number(quoteDetails?.amount?.estimatedPrice || 0);

const adminDiscountAmountOnTotal =
  String(quoteDetails?.adminDiscount?.discountType || '').toUpperCase() === 'PERCENTAGE'
    ? totalestimationfare * (Number(quoteDetails?.adminDiscount?.discountValue || 0) / 100)
    : Number(quoteDetails?.adminDiscount?.discountAmount || 0);
const walletAmountApplied = Number(quoteDetails?.walletAmount || quoteDetails?.amount?.walletAmount || quoteDetails?.value?.walletAmount || 0);

const finalEstimatedFare = (totalestimationfare - adminDiscountAmountOnTotal) - walletAmountApplied;
const adminDiscountType = String(quoteDetails?.adminDiscount?.discountType || '').toUpperCase();
const adminDiscountValueDisplay = adminDiscountType === 'PERCENTAGE'
    ? `${Math.round(Number(quoteDetails?.adminDiscount?.discountValue || 0))} %`
    : `₹ ${Math.round(Number(quoteDetails?.adminDiscount?.discountValue || 0))}`;
const isQuoteAdminDiscountEffective = isAdminDiscountEffective(String(quoteDetails?.adminDiscount?.status || '').toUpperCase());
const isAdminDiscountPresent = Number(quoteDetails?.adminDiscount?.discountValue || 0) > 0;
const hasNormalDiscount = useSystemAmountDiscount || useSystemPercentDiscount;
const hasEffectiveAdminDiscount = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && isAdminDiscountPresent;
// const finalTotalLabel = hasNormalDiscount || hasEffectiveAdminDiscount
//     ? (cancelChargeApplicable ? "Final Total (After Discounts + Cancel Charge):" : "Final Total (After Discounts):")
//     : (cancelChargeApplicable ? "Final Total (After Cancel Charge):" : "Final Total:");
const finalTotalAfterDiscounts =
    BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && isAdminDiscountPresent
        ? finalEstimatedFare
        : totalestimationfare;
const finalTotalAfterDiscountsWithCancelCharge =
    finalTotalAfterDiscounts + (cancelChargeApplicable ? cancelChargeAmount : 0);
const isPeakHour = quoteDetails?.amount?.fareBreakdown?.isPeakHour === true;
const priceDetailsCardClass = isPeakHour
    ? "border rounded-xl bg-amber-50 p-4"
    : "border rounded-xl bg-gray-200 p-4";


    return (
        <div className='flex flex-row space-x-6 justify-between w-full'>
            <div className='w-full'>
                <div className='py-2  rounded-xl flex justify-between bg-white mb-2'>
                    {customerData && (
                        <div className="p-2 flex w-[40%] flex-col relative">
                            <input
                                type="text"
                                className="relative w-full py-2 px-8 border  rounded-xl text-sm bg-gray-100 pr-10"
                                placeholder="Search by customer number or booking ID"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    searchBookings(e.target.value);
                                }}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            {(searchText || searchBookingId) && (
                                <button
                                    type="button"
                                    // className="bg-white text-gray-500 hover:text-gray-700"
                                    aria-label="Clear search"
                                    onClick={() => { setSearchText(''); 
                                                    searchBookings('');
                                                    setSearchBookingId(''); 
                                                    setSelectedCustomer(0);
                                                    setSearchResults([]); 
                                                    
                                                    sessionStorage.removeItem(bookingSearchKey);
                                                    sessionStorage.removeItem(LEGACY_BOOKING_SEARCH_KEY);
                                                   if (refreshFn) refreshFn();
                                                   
                                                }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    X
                                </button>
                            )}
                            {searchResults.length > 0 && (
                                <ul className="absolute top-full left-0 w-full border rounded-lg bg-white mt-2 max-h-60 overflow-y-auto z-10">
                                    {searchResults.map((result, index) => (
                                        <li
                                            key={index}
                                            className="p-2 cursor-pointer hover:bg-gray-100"
                                            onClick={() => {
                                                if (result?.type == 'booking') {
                                                    setSelectedCustomer(0);
                                                    setSearchBookingId(result?.bookingNumber);
                                                    setSearchText(result?.bookingNumber);
                                                } else {
                                                    const label = [result?.firstName, result?.phoneNumber].filter(Boolean).join(' - ');
                                                    setSearchText(label.trim());
                                                    setSelectedCustomer(result?.id);
                                                    setSearchBookingId('');
                                                }
                                                setSearchResults([]);
                                            }}
                                        >
                                            {result?.type == 'booking' ? result?.bookingNumber : [result?.firstName, result?.phoneNumber].filter(Boolean).join(' - ')}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    {/* {customerData && <div className="p-2 flex w-[40%]">
                        <SearchableDropdown
                            searchVal={setCustomerNumber}
                            addVal={addCustomerNumber}
                            selected={editBooking?.customerId} 
                            options={customerData} 
                            onSelect={(val) => {
                                setSelectedCustomer(val.id);
                            }}
                            setSearchBookingId={(value) => {setSearchBookingId(value)}}
                        />
                    </div>} */}
                    {String(props.typeProp || "").toUpperCase() !== "RETURN_TRIPS" &&
                        !String(location.pathname || "").toLowerCase().includes("/booking/list/returntrips") && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className={`relative rounded-xl px-6 py-2 mr-2 text-sm w-40 h-10 mt-2 ${ColorStyles.addButtonColor}`}
                    >
                        <div className="absolute inset-y-0 left-0 flex items-center  pointer-events-none px-3">
                            <PlusIcon className="w-4 h-4 font-medium text-white space-x-3" />
                        Add New Booking
                        </div>
                    </button>
                    )}
                    

                </div>
                <BookingsList onRegisterRefresh={setRefreshFn}  customerId={selectedCustomer} searchBookingId={searchBookingId} setIsOpen={setIsOpen} bookingStage={bookingStage} onAssignDriver={onAssignDriver} onSelectBooking={onSelectBooking} type={props.typeProp} onTypeChange={handleTypeChange} />
            </div>
            <div>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 w-full" 
                    onClick={(e) => {
                        e.stopPropagation();
                    }}>
                        <div className="bg-black-gray-500 rounded-2xl  h-screen p-2 w-[75%]  shadow-lg relative" onClick={(e) => e.stopPropagation()}>
                                <div className='justify-end items-end  absolute -right-6'>
                                    <button
                                        onClick={
                                            () => {
                                                setIsOpen(false);
                                                onConfirmBooking();
                                                setSelectedCustomer(0);
                                                setEditBookingView();
                                                setEditBooking();
                                                setQuoteDetails();
                                                setQuoteMeta(null);
                                                setSearchBookingId('');
                                                setShowQuickCreateCustomer(false);
                                            }
                                        }
                                        className="h-8 w-8 rounded-full bg-red-600 text-white shadow-lg flex items-center justify-center border border-red-700 hover:bg-red-700 transition-colors"
                                    >
                                        X
                                    </button>
                                </div>
                            <div className="flex-1 bg-surface-muted rounded-xl max-h-screen overflow-y-auto overflow-x-hidden shadow p-4">
                                {/* max-h-screen overflow-y-auto shadow p-4 */}

                                {!showQuickCreateCustomer && !editBookingView && <div className='text-2xl font-bold mb-8'>
                                    <Typography variant="h5" className='text-gray-900'>
                                        {/* ${bookingData?.Customer?.firstName ? `- ${bookingData?.Customer?.firstName}` : ''} */}
                                        <div className="flex items-center">
                                            {bookingView ? (
                                                <>
                                                    {`Booking Details - ${bookingData?.bookingNumber}`}
                                                    {bookingData?.status && getStatusDisplay(bookingData.status)}
                                                    {bookingData?.serviceType &&
                                                        <div className={`rounded-md text-white text-sm font-semibold mr-2 ${bookingData?.serviceType ? 'bg-red-300' : 'bg-gray-400' }`}>
                                                            <Typography className='font-semibold text-sm px-1 py-1 text-white'>
                                                                {bookingData?.serviceType === 'DRIVER' ? 'ACTING DRIVER' : bookingData?.serviceType == "RIDES" ? 'Local Rides' : bookingData?.packageType == "Local" ? 'Hourly Package' : bookingData?.bookingType == "DROP ONLY" ? 'Drop Taxi' : bookingData?.serviceType == 'AUTO' ? 'Auto' :  'Outstation'}
                                                            </Typography>
                                                        </div>}
                                                    {bookingData?.isPremiumService === true &&
                                                    <div className={`rounded-md text-white text-sm font-semibold ${bookingData?.isPremiumService ? 'bg-deep-purple-700' : 'bg-gray-400'}`}>
                                                        <Typography className='font-semibold text-sm px-1 py-1 text-white'>
                                                            {bookingData?.isPremiumService ? "PREMIUM" : ""}
                                                        </Typography>
                                                    </div>}
                                                </>
                                            ) : (bookingStage === 0 ? 'New Booking' :  bookingStage === 1 ? 'New Booking' :  bookingData?.requestType === 'REQUEST_ALL' ? `Request Cab - ${bookingData?.bookingNumber}` :  bookingData?.serviceType === 'RENTAL' ? `Assign Cab - ${bookingData?.bookingNumber}` : `Assign Captain - ${bookingData?.bookingNumber}`)}
                                        </div>
                                    </Typography>
                                </div>}
                                {showQuickCreateCustomer && <CustomerAdd isQuickCreate={true} customerNumber={customerNumber} />}
                                {!showQuickCreateCustomer && !bookingView && <>
                                    {(bookingStage === 0 || bookingStage === 1) && <Formik
                                        initialValues={initialValues}
                                        validate={Utils.validateRideAndReturnDateTime}
                                        onSubmit={async (values, formikBag) => {
                                            setFormikActions(formikBag); // Store Formik actions for modals
                                            let submitSuccess = false;
                                            if (values.submitType === "rides") {
                                                submitSuccess = await onRideSubmitHandler(values, formikBag);
                                            } 
                                            else if (values.submitType === "auto") {
                                                submitSuccess = await onAutoSubmitHandler(values, formikBag);
                                            } else if (values.submitType === "parcel") {
                                                submitSuccess = await onParcelSubmitHandler(values, formikBag);
                                            } else {
                                                submitSuccess = await onSubmitHandler(values, formikBag);
                                            }
                                            if (!submitSuccess) {
                                                return;
                                            }
                                            setLoading(true);
                                            setRange({});
                                            setLoading(false);
                                            setQuoteDetails();
                                            setQuoteMeta(null);
                                            setSelectedCustomer(0);
                                            setSearchBookingId('');
                                        }}
                                        validationSchema={BOOKING_DETAILS_SCHEMA}
                                        validateOnMount={true}
                                        enableReinitialize={true}
                                    >
                                       {({ handleSubmit, values, setFieldValue, isValid, dirty, handleChange, errors, status }) => {
                                            const getCurrentPremiumOptions = () => {
                                                return premiumServicesMap[values?.serviceType] || [];
                                            };
                                            const {
                                                driverContinueDisabled,
                                                ridesContinueDisabled,
                                                autoContinueDisabled,
                                                parcelContinueDisabled,
                                                rentalContinueDisabled,
                                                hourlyContinueDisabled,
                                                dropTaxiContinueDisabled,
                                            } = Utils.getBookingContinueDisabledStates({
                                                values,
                                                dirty,
                                                isValid,
                                                quoteDetails,
                                                selectedCustomer,
                                                isButtonDisabled,
                                                validationCheckForDriver,
                                                validationCheckForDriverRental,
                                            });
                                            const showContinueHint =
                                                (values.serviceType === 'DRIVER' || values.serviceType === 'CAR_WASH') ? driverContinueDisabled :
                                                values.serviceType === 'RIDES' ? ridesContinueDisabled :
                                                values.serviceType === 'AUTO' ? autoContinueDisabled :
                                                values.serviceType === 'PARCEL' ? parcelContinueDisabled :
                                                values.serviceType === 'RENTAL' ? rentalContinueDisabled :
                                                values.serviceType === 'RENTAL_HOURLY_PACKAGE' ? hourlyContinueDisabled :
                                                values.serviceType === 'RENTAL_DROP_TAXI' ? dropTaxiContinueDisabled :
                                                false;
                                            const continueHint = Utils.getBookingContinueHint({
                                                values,
                                                errors,
                                                dirty,
                                                isValid,
                                                quoteDetails,
                                                selectedCustomer,
                                                isButtonDisabled,
                                                validationCheckForDriver,
                                                validationCheckForDriverRental,
                                            });
                                            const estimationReady = Utils.isBookingReadyForEstimation(values, selectedCustomer);
                                            const continueReady = Utils.isBookingReadyForContinue(
                                                values,
                                                selectedCustomer,
                                                quoteDetails,
                                                validationCheckForDriver,
                                                validationCheckForDriverRental
                                            );
                                                    useLuggageAndSeaterLogic(values.carType, setFieldValue, luggageCapacityMap);
                                        useEffect(() => {
                                        if (values.serviceType === 'RENTAL_HOURLY_PACKAGE' && values.pickupLocation?.lat && values.pickupLocation?.lng) {
                                            zoneCheckUpFun(values).then(zoneData => {
                                            if (zoneData.success && zoneData.serviceArea) {
                                                const newZone = zoneData.serviceArea.name;
                                                const selectedArea = serviceAreas.find(area => area.name === newZone);
                                                
                                                // Only fetch package list and reset packageSelected if the zone has changed
                                                if (selectedArea && selectedArea.id !== parseInt(selectedAreaId)) {
                                                setSelectedAreaId(selectedArea.id);
                                                setFieldValue('serviceTypeArea', selectedArea.id);
                                                getPackageListDetails(values.serviceType, newZone);
                                                setFieldValue('packageSelected', ''); // Reset only if zone changes
                                                }
                                            } else {
                                                setPackageTypeSelectedData([]);
                                                setFieldValue('packageSelected', '');
                                            }
                                            });
                                        }
                                        }, [values.serviceType, values.pickupLocation?.lat, values.pickupLocation?.lng, selectedAreaId, serviceAreas, getPackageListDetails, setFieldValue]);

                                                    return (
                                                        <Form>


                                                {customerData  && !editBookingView && <div className="p-2 flex">
                                                   <SearchableDropdown 
                                                        searchVal={setCustomerNumber} 
                                                        addVal={addCustomerNumber} 
                                                        selected={selectedCustomer} // Use selectedCustomer instead of editBooking?.customerId
                                                        options={customerData} 
                                                        onSelect={(val) => {
                                                            setFieldValue('customerId', val);
                                                            setSelectedCustomer(val?.id || 0);
                                                        }}
                                                    />

                                                    {!editBookingView && <Button
                                                        className="ml-3 w-1/2"
                                                        fullWidth
                                                        color="blue"
                                                        onClick={() => { setShowQuickCreateCustomer(true) }}>
                                                        Add New
                                                    </Button>}
                                                </div>}
                                                {!editBookingView && ( <div className="flex-1 mb-4">
                                                        <div>
                                                            <Typography variant="h6" className="mb-2">
                                                                Service Pickup Area
                                                            </Typography>
                                                           <Field
                                                                as="select"
                                                                name="serviceTypeArea"
                                                                className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                onChange={(e) => {
                                                                    const selectedValue = e.target.value;
                                                                    // console.log('Selected area value:', selectedValue);
                                                                    setFieldValue('serviceTypeArea', selectedValue, false);
                                                                    setSelectedAreaId(selectedValue);
                                                                    resetPackageValues(setFieldValue, values.serviceType);

                                                                    // Fetch new packages for the current serviceType without resetting fields
                                                                    if (values.serviceType) {
                                                                    const selectedArea = serviceAreas.find((area) => area.id === parseInt(selectedValue));
                                                                    const zone = selectedArea ? selectedArea.name : '';
                                                                    getPackageListDetails(values.serviceType, zone);
                                                                    }

                                                                    setFieldValue('serviceTypeArea', selectedValue, true);
                                                                }}
                                                                >
                                                                <option value="" label="Select a Service Pickup Area" />
                                                                {serviceAreas.map((area) => (
                                                                    <option key={area.id} value={area.id}>
                                                                    {area.name}
                                                                    </option>
                                                                ))}
                                                            </Field>
                                                            
                                                            <ErrorMessage name="serviceTypeArea" component="div" className="text-red-500 text-sm" />
                                                        </div>
                                                    </div>
                                                )}
                                                {!editBookingView && ( <div className="flex-1 mb-4">
                                                    <div>
                                                        <Typography variant="h6" className="mb-2">
                                                            Service Type
                                                        </Typography>
                                                        <Field as="select" name="serviceType" className="p-2 w-full rounded-xl border-2 border-gray-300" onChange={(e) => {
                                                                    const selectedValue = e.target.value;
                                                                    // console.log('Selected service value:', selectedValue);
                                                                    setFieldValue('serviceType', selectedValue, false);
                                                                    setCurrentServiceType(selectedValue);
                                                                    setQuoteDetails(null);
                                                                    setQuoteMeta(null);
                                                                    resetPackageValues(setFieldValue, selectedValue);
                                                                    setFieldValue('serviceType', selectedValue, true);
                                                                }}
                                                                disabled={!selectedAreaId}
                                                        >
                                                            <option value="" label="Service Type" />
                                                            {services.map((service) => (
                                                                <option key={service} value={service}>
                                                                    {serviceDisplayNames[service] || service}
                                                                </option>
                                                            ))}
                                                        </Field>
                                                        <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                </div>)}
                                                {(values.serviceType === 'DRIVER' || values.serviceType === 'RENTAL' || (values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'RENTAL_DROP_TAXI')) && (
                                                    <div className='space-y-3 my-3'>
                                                        <div className={`grid grid-cols-2 gap-4 ${values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'RENTAL_DROP_TAXI' ? 'hidden' : ''}`}>
                                                            {(values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'DRIVER') && <Button
                                                                color={values.packageTypeSelected === 'Local' ? 'blue' : 'gray'}
                                                                onClick={() => {
                                                                    if (values.packageTypeSelected !== 'Local') {
                                                                        setFieldValue('packageTypeSelected', 'Local');
                                                                        setFieldValue('packageSelected', '');
                                                                        setRange({});
                                                                        setFieldValue('fromDate', '');
                                                                        setFieldValue('toDate', '');
                                                                        if (values.serviceType === 'DRIVER' && values.packageSelected === 'Local') {
                                                                            setFieldValue('tripType', 'Drop Only');
                                                                        }
                                                                    }
                                                                }}
                                                                disabled={bookingStage === 1}
                                                                variant={values?.packageTypeSelected === 'Local' ? 'filled' : 'outlined'}
                                                            >
                                                                Local
                                                            </Button>}
                                                            {(values.serviceType === 'RENTAL' || values.serviceType === 'DRIVER' || values.serviceType === 'RENTAL_DROP_TAXI') &&
                                                                <Button
                                                                    color={values.packageTypeSelected === 'Outstation' ? 'blue' : 'gray'}
                                                                    onClick={() => {
                                                                        if (values.packageTypeSelected !== 'Outstation') {
                                                                            setFieldValue('packageTypeSelected', 'Outstation');
                                                                            setFieldValue('packageSelected', '');
                                                                            setRange({});
                                                                            setFieldValue('fromDate', '');
                                                                            setFieldValue('toDate', '');
                                                                            if (values.serviceType === 'DRIVER' && values.packageSelected === 'Outstation') {
                                                                                setFieldValue('tripType', 'Round Trip');
                                                                            }
                                                                        }
                                                                    }}
                                                                    disabled={bookingStage === 1}
                                                                    variant={values?.packageTypeSelected === 'Outstation' ? 'filled' : 'outlined'}
                                                                >
                                                                    Outstation
                                                                </Button>}
                                                        </div>
                                                        {((values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation') || (values.serviceType === 'RENTAL_HOURLY_PACKAGE' && values.packageTypeSelected === 'Local') || (values.serviceType === 'RENTAL_DROP_TAXI' && values.packageTypeSelected === 'Outstation') || (values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation')) && (
                                                            <div className={values.serviceType === 'DRIVER' ? 'hidden' : ['RENTAL', 'RENTAL_HOURLY_PACKAGE', 'RENTAL_DROP_TAXI'].includes(values.serviceType) ? 'hidden' : ''}>
                                                                <Typography className="text-sm font-medium text-black-700">Trip Type</Typography>
                                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                                    {(values.serviceType === 'RENTAL_DROP_TAXI' ||
                                                                        values.serviceType === 'DRIVER' ||
                                                                        values.serviceType === 'RENTAL_HOURLY_PACKAGE') && (
                                                                            <Button
                                                                                color={values.tripType === 'Drop Only' ? 'blue' : 'gray'}
                                                                                onClick={() => setFieldValue('tripType', 'Drop Only')}
                                                                                variant={values?.tripType === 'Drop Only' ? 'filled' : 'outlined'}
                                                                            >
                                                                                Drop Only
                                                                            </Button>
                                                                        )}
                                                                    {(values.serviceType === 'RENTAL' || values.serviceType === 'DRIVER') && (
                                                                        <Button
                                                                            color={values.tripType === 'Round Trip' ? 'blue' : 'gray'}
                                                                            onClick={() => setFieldValue('tripType', 'Round Trip')}
                                                                            variant={values?.tripType === 'Round Trip' ? 'filled' : 'outlined'}
                                                                        >
                                                                            Round Trip
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                <div className='flex mt-2 space-x-3'>
                                                {(values?.serviceType === 'RENTAL' || values?.serviceType === 'RENTAL_HOURLY_PACKAGE' || values?.serviceType === 'RENTAL_DROP_TAXI') && (
                                                    <div className="flex gap-2">
                                                        <div>
                                                            <div className="mt-3 flex gap-3">
                                                                {(values?.isPremiumService ||
                                                                            values?.serviceType === 'RENTAL' ||
                                                                            values?.serviceType === 'RENTAL_DROP_TAXI') && (
                                                                                <div className="w-full">
                                                                                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                                                                                        <Field
                                                                                            type="checkbox"
                                                                                            name="isPremiumService"
                                                                                            className="h-5 w-5 text-primary-600 rounded"
                                                                                            onChange={(e) => {
                                                                                                setFieldValue('isPremiumService', e.target.checked);
                                                                                                if (!e.target.checked) {
                                                                                                    setFieldValue('carType', ''); // reset when disabled
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <span className="text-sm font-medium text-gray-700">Enable Premium Service</span>
                                                                                    </label>
                                                                                </div>
                                                                            )}
                                                                            </div>
                                                                                <div>
                                                                    {values?.isPremiumService && (
                                                                        <div className="w-full mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                                            <p className="text-sm font-semibold text-blue-900 mb-3">
                                                                                Premium Options Available:
                                                                            </p>
                                                                            {getCurrentPremiumOptions().length > 0 ? (
                                                                <div className="flex gap-4">
                                                                                    {getCurrentPremiumOptions().map((premium, index) => (
                                                                                        <label key={index} className="flex items-center space-x-2 cursor-pointer">
                                                                                            <Field
                                                                                                type="radio"
                                                                                                name="carType"
                                                                                                value={premium.carType}
                                                                                                className="h-4 w-4 text-primary-600"
                                                                                                onChange={(e) => setFieldValue('carType', e.target.value)}
                                                                                            />
                                                                                            <span className="text-gray-800 font-medium">
                                                                                                {premium.label}
                                                                                            </span>
                                                                                        </label>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-sm text-gray-600 italic">
                                                                                    No premium options available for {values?.serviceType}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        <div className='pt-2'>
                                                        {!values?.isPremiumService && ( <>
                                                                <label className="text-sm font-medium text-black-700">Car Type <span className='text-red-500 text-sm'>*</span></label>
                                                                <div className='pt-3 grid grid-cols-6 gap-3'>
                                                                {(values?.serviceType === 'RENTAL' || values?.serviceType === 'RENTAL_HOURLY_PACKAGE' || values?.serviceType === 'RENTAL_DROP_TAXI') && (
                                                                    ['Mini', 'Sedan', 'SUV', 'MUV'].map((carType) => (
                                                                        <label key={carType} className="flex items-center space-x-2">
                                                                            <Field
                                                                                type="radio"
                                                                                name="carType"
                                                                                value={carType}
                                                                                className="h-4 w-4 text-primary-600"
                                                                                onChange={(e) => {
                                                                                    setFieldValue('carType', e.target.value);
                                                                                }}
                                                                            />
                                                                            <span className="text-black-700">{carType}</span>
                                                                        </label>
                                                                    )))}
                                                                </div>
                                                                {['RENTAL', 'RENTAL_HOURLY_PACKAGE', 'RENTAL_DROP_TAXI'].includes(values.serviceType) && errors.carType && (
                                                                    <div className="text-red-500 text-sm mt-1">
                                                                        {errors.carType}
                                                                    </div>
                                                                )}
                                                            </>)}
                                                            </div>
                                                            </div>
                                                            {/* {(values.serviceType === 'DRIVER') && (
                                                                <div className='pt-4'>
                                                                    <label className="text-sm font-medium text-black-700">Transmission Type</label>
                                                                    <div className="flex gap-2 pt-3">
                                                                        {['Manual', 'Automatic'].map((transType) => (
                                                                            <label key={transType} className="flex items-center space-x-2">
                                                                                <Field
                                                                                    type="radio"
                                                                                    name="transmissionType"
                                                                                    value={transType}
                                                                                    className="h-4 w-4 text-primary-600"
                                                                                />
                                                                                <span className="text-black-700">{transType}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                    <ErrorMessage name="transmissionType" component="div" className="text-red-500 text-sm mt-1" />
                                                                </div>
                                                            )} */}
                                                                </div>
                                                        )}
                                                        </div>
                                                    </div>

                                                )}
                                                {(((values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_DROP_TAXI') && values.packageTypeSelected === 'Outstation')) && (
                                                    <div>
                                                        <Typography className="text-sm font-medium text-black-700">AC Type</Typography>
                                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                                            <Button
                                                                color={values.acType === 'Ac' ? 'blue' : 'gray'}
                                                                onClick={() => setFieldValue('acType', 'Ac')}
                                                                variant={values?.acType === 'Ac' ? 'filled' : 'outlined'}
                                                            >
                                                                AC
                                                            </Button>

                                                            <Button
                                                                color={values.acType === 'Non Ac' ? 'blue' : 'gray'}
                                                                onClick={() => setFieldValue('acType', 'Non Ac')}
                                                                variant={values?.acType === 'Non Ac' ? 'filled' : 'outlined'}
                                                            >
                                                                NON AC
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                               
                                                                                                {values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation'  && (
                                                    <div className="flex-1 mb-4">
                                                        <div>
                                                            <Typography variant="h6" className="mb-2">
                                                                Choose a package
                                                            </Typography>
                                                            <Field
                                                                as="select"
                                                                disabled={bookingStage === 1}
                                                                name="packageSelected"
                                                                className="p-2 w-full rounded-xl border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                                                value={values.packageSelected}
                                                                onChange={(e) => {
                                                                    const selectedId = e.target.value;
                                                                    setFieldValue('packageSelected', selectedId);
                                                                    if (selectedId === 'custom_date') {
                                                                        setRange({});
                                                                        return;
                                                                    }

                                                                    const selectedPackage = packageTypeSelectedData.find(
                                                                        (pkg) => pkg.id === Number(selectedId)
                                                                    );

                                                                    if (selectedPackage) {
                                                                        const period = Number(selectedPackage.period) || 0;

                                                                        
                                                                        let baseMoment;
                                                                        let baseDateStr = values.rideDate;
                                                                        let baseTimeStr = values.rideTime;

                                                                        if (values.rideDate && values.rideTime) {
                                                                            baseMoment = moment(`${values.rideDate} ${values.rideTime}`, 'YYYY-MM-DD HH:mm');
                                                                        } else {
                                                                            baseMoment = moment();
                                                                            baseDateStr = baseMoment.format('YYYY-MM-DD');
                                                                            baseTimeStr = baseMoment.format('HH:mm');
                                                                            setFieldValue('rideDate', baseDateStr);
                                                                            setFieldValue('rideTime', baseTimeStr);
                                                                        }

                                                                        
                                                                        if (values.tripType === 'Round Trip' && period > 0) {
                                                                            const start = baseMoment.toDate();

                                                                            
                                                                            const extraType = (selectedPackage.extraCabType || '').toString().toLowerCase();
                                                                            let endMoment;
                                                                            if (extraType.includes('hour')) {
                                                                                
                                                                                const hours = parseInt(extraType, 10) || period;
                                                                                endMoment = baseMoment.clone().add(hours, 'hours');
                                                                            } else {
                                                                                
                                                                                endMoment = baseMoment.clone().add(period, 'days');
                                                                            }

                                                                            const end = endMoment.toDate();
                                                                            const endDateStr = endMoment.format('YYYY-MM-DD');
                                                                            const endTimeStr = endMoment.format('HH:mm');

                                                                            setFieldValue('fromDate', baseDateStr);
                                                                            setFieldValue('toDate', endDateStr);
                                                                            setFieldValue('toTime', endTimeStr);
                                                                            setRange({ startDate: start, endDate: end });
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Select Package</option>
                                                                {packageTypeSelectedData
                                                                    .filter((item) => item.serviceType === 'DRIVER' && item.type === 'Outstation' && !(item.extraCabType === '0' || item.extraCabType === 0))
                                                                    .map((item) => {
                                                                        const label = item.extraCabType === '0' || item.extraCabType === 0 ? '1 Day' : (item.extraCabType || `${item.period} Days`);
                                                                        return (
                                                                            <option key={item.id} value={item.id}> {label} </option>
                                                                        );
                                                                    })}
                                                                    {values.tripType === 'Round Trip' && (
                                                                    <option value="custom_date">Custom Date</option>
                                                                    )}
                                                            </Field>
                                                            <ErrorMessage name="packageSelected" component="div" className="text-red-500 text-sm" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className='grid grid-cols-2 mt-2 space-x-3'>
                                                    {(values.serviceType === 'DRIVER' || values.serviceType === 'CAR_WASH' || values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'RENTAL_DROP_TAXI' || values.serviceType === 'RIDES' || values.serviceType === 'AUTO' || values.serviceType === 'PARCEL') && (
                                                        <div className="flex-1 mb-2">
                                                            <Typography variant="h6" className="mb-2">
                                                                Pickup Date & Time
                                                            </Typography>
                                                            <Field
                                                                type="datetime-local"
                                                                name="rideDateTime"
                                                                disabled={bookingStage === 1}
                                                                className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                value={values.rideDate && values.rideTime  ? `${values.rideDate}T${values.rideTime}` : ''}
                                                                min={Utils.getNowDateTimeLocalInput()}
                                                                 onClick={(e) => {
                                                                if (e.target.showPicker) e.target.showPicker();
                                                                    }}
                                                                onChange={(e) => {
                                                                    const selectedDateTime = e.target.value;
                                                                    const formattedDate = moment(selectedDateTime).format('YYYY-MM-DD');
                                                                    const formattedTime = moment(selectedDateTime).format('HH:mm');

                                                                    setFieldValue('rideDate', formattedDate);
                                                                    setFieldValue('rideTime', formattedTime);

                                                                    setBookingTimesForDay(Utils.generateBookingTimesForDay(new Date(formattedDate)));

                                                                    if (formattedDate !== values.fromDate) {
                                                                        setRange({});
                                                                        setFieldValue('fromDate', '');
                                                                        setFieldValue('toDate', '');
                                                                    }
                                                                }}
                                                            />
                                                            <ErrorMessage name="rideDateTime" component="div" className="text-red-500 text-sm" />
                                                        </div>
                                                    )}

                                                    {(
                                                        (values.serviceType === 'RENTAL' &&
                                                            values.packageTypeSelected === 'Outstation' &&
                                                            values.tripType === 'Round Trip') ||
                                                        (values.serviceType === 'DRIVER' &&
                                                            values.packageTypeSelected === 'Outstation' &&
                                                            values.tripType === 'Round Trip' &&
                                                            values.packageSelected === 'custom_date')
                                                    ) && (
                                                        <div className="flex-1 mb-2">
                                                            <Typography variant="h6" className="mb-2">
                                                                Return Date & Time
                                                            </Typography>
                                                            <Field
                                                                type="datetime-local"
                                                                name="returnDateTime"
                                                                disabled={bookingStage === 1}
                                                                className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                value={values.toDate && values.toTime ? `${values.toDate}T${values.toTime}` : ''}
                                                                min={values.rideDate && values.rideTime? `${values.rideDate}T${values.rideTime}` : `${moment().format('YYYY-MM-DD')}T00:00`}
                                                                 onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                                onChange={(e) => {
                                                                    const selectedDateTime = e.target.value;
                                                                    const formattedDate = moment(selectedDateTime).format('YYYY-MM-DD');
                                                                    const formattedTime = moment(selectedDateTime).format('HH:mm');

                                                                    setFieldValue('toDate', formattedDate);
                                                                    setFieldValue('toTime', formattedTime);

                                                                    if (moment(formattedDate).isBefore(values.rideDate)) {
                                                                        setFieldValue('toTime', '');
                                                                    }
                                                                }}
                                                            />
                                                            <ErrorMessage name="returnDateTime" component="div" className="text-red-500 text-sm" />
                                                        </div>
                                                    )}
                                                </div>

                                                {(values.serviceType === 'DRIVER' || values.serviceType === 'CAR_WASH' || values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_HOURLY_PACKAGE') && values.packageTypeSelected == 'Local' &&
                                                    <div className="flex-1 mb-4">
                                                        <div>
                                                            <Typography variant="h6" className="mb-2">
                                                                Choose a package
                                                            </Typography>
                                                            <Field as="select" disabled={bookingStage === 1} name="packageSelected" className="p-2 w-full rounded-xl border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50" value={values.packageSelected}
                                                                onChange={(e) => {
                                                                    setFieldValue('packageSelected', e.target.value);
                                                                    if (values.packageTypeSelected === 'Outstation' && values.fromDate && values.toDate) {
                                                                        setDatePickerVisible(false);
                                                                        setRange({});
                                                                        handleChange('fromDate')("");
                                                                        handleChange('toDate')("")
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Select Package</option>
                                                                {packageTypeSelectedData
                                                                    .filter((item) => {
                                                                        if (values.serviceType === 'CAR_WASH') {
                                                                            return item.type === 'CarWash';
                                                                        }
                                                                        else if (values.serviceType === 'DRIVER') {
                                                                            return item.serviceType === 'DRIVER' && item.type === 'Local' && item.status === '1';
                                                                        }
                                                                        else if (values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_HOURLY_PACKAGE') {
                                                                            return item.serviceType === 'RENTAL'  && item.type === 'Local' && item.status === '1';
                                                                        }
                                                                        const isLocal = values.packageTypeSelected === 'Local';

                                                                        if (isLocal) {
                                                                        return item.type === 'Local' && [2, 4, 6, 8].includes(item.period);
                                                                        }
                                                                    })
                                                                    .map((item) => (
                                                                        <option key={item.id} value={item.id}>
                                                                            {/* {item.period} {values.packageTypeSelected === 'Outstation' ? 'd' : values.packageTypeSelected === 'Local' ? 'hr' : ''} */}
                                                                            {values.serviceType === 'CAR_WASH'
                                                                                ? (
                                                                                    <span>
                                                                                        <span className="text-base">{item.period}</span>
                                                                                        <span className="text-sm"> - {item.description}</span>
                                                                                    </span>
                                                                                )
                                                                                : (`${item.period} ${values.packageTypeSelected === 'Outstation' ? 'd' : 'hr'}`)
                                                                            }
                                                                        </option>
                                                                    ))}
                                                            </Field>
                                                            <ErrorMessage name="packageSelected" component="div" className="text-red-500 text-sm" />
                                                        </div>
                                                    </div>
                                                }


                                                {/* {(values.serviceType === 'DRIVER' || values.serviceType === 'CAB') && values.packageTypeSelected === "Outstation" && (
                                    <div className="space-y-4 mb-4">
                                        <Typography variant="h6" className="text-center">OR</Typography>
                                        <Button
                                            fullWidth
                                            color="blue"
                                            disabled={bookingStage === 1}
                                            onClick={() => setDatePickerVisible(!datePickerVisible)}
                                        >
                                            Select Date Range
                                        </Button>
                                        {datePickerVisible && (
                                            <div className='w-full'>
                                                <DatePicker
                                                    selected={values.fromDate}
                                                    onChange={(dates) => {
                                                        //console.log(values.rideDate, " ", dates.start)
                                                        handleDateChange(dates, setFieldValue, handleChange, values.rideDate)
                                                    }}
                                                    startDate={values.fromDate}
                                                    endDate={values.toDate}
                                                    selectsRange
                                                    inline
                                                    className="w-full h-full"
                                                    minDate={new Date()}
                                                />
                                            </div>
                                        )}
                                        {(range.startDate && range.endDate) && (
                                            <Card className="p-4">
                                                <div className="grid grid-cols-2 gap-4 mb-2">
                                                    <div>
                                                        <Typography>Departure</Typography>
                                                        <Typography variant="h4">{new Date(range.startDate).getDate()}</Typography>
                                                        <Typography>{new Date(range.startDate).toLocaleString('default', { month: 'short' })}</Typography>
                                                    </div>
                                                    <div>
                                                        <Typography>Return</Typography>
                                                        <Typography variant="h4">{new Date(range.endDate).getDate()}</Typography>
                                                        <Typography>{new Date(range.endDate).toLocaleString('default', { month: 'short' })}</Typography>
                                                    </div>
                                                </div>
                                                <Typography variant='h6'>
                                                    Selected Date: {countDaysBetween(range.startDate, range.endDate)} days
                                                </Typography>
                                                <Typography variant='h6'>
                                                    Total Amount: ₹ {countDaysBetween(range.startDate, range.endDate) * 1000}
                                                </Typography>
                                            </Card>
                                        )}
                                    </div>
                                )} */}
                                                {(values.serviceType === 'RIDES' || values.serviceType === 'AUTO') &&  (
                                                    <div className="mt-6">
                                                        <div className="mt-3 space-y-5">
                                                            <div className="flex items-center space-x-3 ml-2">
                                                                <Field
                                                                    type="checkbox"
                                                                    name="isPremiumService"
                                                                    className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                                                                    onChange={(e) => {
                                                                        setFieldValue('isPremiumService', e.target.checked);
                                                                        if (!e.target.checked) {
                                                                            setFieldValue('carType', '');
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-sm font-medium text-gray-700">Enable Premium Service</span>
                                                            </div>
                                                            {values?.isPremiumService && (
                                                                <div className="w-full mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                                    <p className="text-sm font-semibold text-blue-900 mb-3">
                                                                        Premium Options Available:
                                                                    </p>
                                                                    {getCurrentPremiumOptions().length > 0 ? (
                                                                        <div className="flex gap-4">
                                                                            {getCurrentPremiumOptions().map((premium, index) => (
                                                                                <label key={index} className="flex items-center space-x-2 cursor-pointer">
                                                                                    <Field
                                                                                        type="radio"
                                                                                        name="carType"
                                                                                        value={premium.carType}
                                                                                        className="h-4 w-4 text-primary-600"
                                                                                        onChange={(e) => setFieldValue('carType', e.target.value)}
                                                                                    />
                                                                                    <span className="text-gray-800 font-medium">
                                                                                        {premium.label}
                                                                                    </span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-600 italic">
                                                                            No premium options available for {values?.serviceType}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {!values.isPremiumService && values.serviceType && ["RIDES"].includes(values.serviceType) && (
                                                                <>
                                                                <div className='ml-2'>
                                                                    <label className="text-sm font-medium text-black-700">Car Type <span className='text-red-500 text-sm'>*</span></label>
                                                                <div className="flex gap-6 mt-2">
                                                                    {['Mini', 'Sedan'].map((carType) => (
                                                                        <label key={carType} className="flex items-center space-x-2 cursor-pointer">
                                                                            <Field
                                                                                type="radio"
                                                                                name="carType"
                                                                                value={carType}
                                                                                className="h-4 w-4 text-primary-600"
                                                                                onChange={(e) => {
                                                                                    setFieldValue('carType', e.target.value);
                                                                                }}
                                                                            />
                                                                            <span className="text-black-700">{carType}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                                {values.serviceType === 'RIDES' && errors.carType && (
                                                                    <div className="text-red-500 text-sm mt-1">
                                                                        {errors.carType}
                                                                    </div>
                                                                )}
                                                            </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className='grid grid-cols-1'>
                                                    {values.serviceType === 'PARCEL' && (
                                                        <div className="p-2 space-y-2">
                                                            <label className="block text-sm font-medium text-black-700">
                                                                Parcel Vehicle Type
                                                            </label>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {[
                                                                    { value: 'BIKE', label: 'Bike', image: '/img/multiple_bike.jpg' },
                                                                    { value: 'AUTO', label: 'Auto', image: '/img/auto.png' },
                                                                ].map((opt) => {
                                                                    const isSelected = values.parcelVehicleType === opt.value;
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            onClick={() => setFieldValue('parcelVehicleType', opt.value)}
                                                                            className={`rounded-xl border-2 p-2 text-left transition ${isSelected ? 'border-blue-500 ring-1 ring-blue-300 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <img
                                                                                    src={opt.image}
                                                                                    alt={opt.label}
                                                                                    className="h-10 w-10 rounded-md object-cover border border-gray-200"
                                                                                />
                                                                                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(values.tripType || values.serviceType == 'RIDES' || values.serviceType == 'RENTAL' || values.serviceType == 'RENTAL_HOURLY_PACKAGE' || values.serviceType == 'AUTO' || values.serviceType == 'PARCEL') && 
                                                    (<div className="p-2 space-y-2">
                                                        <label className="block text-sm font-medium text-black-700">
                                                            Customer Pickup Location <span className="text-red-500">*</span>
                                                        </label>
                                                      <div className="relative">
                                                        <Field
                                                        type="text"
                                                        name="pickupAddress"
                                                        className="p-2 w-full rounded-xl border-2 border-gray-300 pr-10"
                                                        placeholder="Enter pickup location"
                                                        onChange={(e) => {
                                                            setFieldValue("pickupAddress", e.target.value);
                                                            setFieldValue("pickupLocation", null);
                                                            setFieldValue("pickupPlaceId", "");
                                                            if (values.serviceType === 'PARCEL') {
                                                                setFieldValue("senderAddress", e.target.value);
                                                            }
                                                            searchLocations(e.target.value, true);
                                                        }}
                                                        />
                                                        {values.pickupAddress && (
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-2 text-gray-500 hover:text-black"
                                                            onClick={() => {
                                                            setFieldValue("pickupAddress", "");
                                                            setFieldValue("pickupLocation", null);
                                                            setFieldValue("pickupPlaceId", "");
                                                           
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                        )}
                                                    </div>
                                                        {pickupSuggestions.length > 0 && (
                                                            <ul className="border rounded-lg bg-white mt-2">
                                                                {pickupSuggestions.map((suggestion, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                                                    onClick={() => handleSelectLocation(getSuggestionText(suggestion), getSuggestionPlaceId(suggestion), true, null, setFieldValue,values)}
                                                                >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-black">{getSuggestionTitle(suggestion)}</span>
                                                                            {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                                                                                <span className="text-xs text-gray-600">{getSuggestionText(suggestion)}</span>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        <ErrorMessage name="pickupAddress" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                )}
                                                    <div className="p-2 space-y-2 space-x-3">
                                                        {((values.packageSelected && values.tripType == "Local" && values.serviceType !== 'RENTAL_HOURLY_PACKAGE') || (values.packageSelected && values.tripType == "Round Trip" && values.serviceType !== 'CAR_WASH') || (values.packageTypeSelected == 'Outstation') || (values.serviceType == 'RIDES' || values.serviceType =='AUTO' || values.serviceType == 'PARCEL')) && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-black-700">Drop Location<span className="text-red-500">*</span></label>
                                                                <div className="relative">
                                                                <Field
                                                                    type="text"
                                                                    name="dropAddress"
                                                                    className="p-2  mt-2 w-full rounded-xl border-2 border-gray-300"
                                                                    placeholder="Enter drop location"
                                                                    onChange={(e) => {
                                                                        setFieldValue("dropAddress", e.target.value);
                                                                        setFieldValue("dropLocation", null);
                                                                        setFieldValue("dropPlaceId", "");
                                                                        if (values.serviceType === 'PARCEL') {
                                                                            setFieldValue("receiverAddress", e.target.value);
                                                                        }
                                                                        searchLocations(e.target.value, false);
                                                                    }}
                                                                />
                                                                  {values.dropAddress && (
                                                                    <button
                                                                        type="button"
                                                                        className="absolute right-3 top-4 text-gray-500 hover:text-black"
                                                                        onClick={() => {
                                                                        setFieldValue("dropAddress", "");
                                                                        setFieldValue("dropLocation", null);
                                                                        setFieldValue("dropPlaceId", "");
                                                                        }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                    )}
                                                                </div>
                                                                {dropSuggestions.length > 0 && (
                                                                    <ul className="border rounded-lg bg-white mt-2">
                                                                        {dropSuggestions.map((suggestion, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                                                    onClick={() => {
                                                                                    handleSelectLocation(getSuggestionText(suggestion), getSuggestionPlaceId(suggestion), false, null, setFieldValue,values);
                                                                                }}
                                                                            >
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold text-black">{getSuggestionTitle(suggestion)}</span>
                                                                                    {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                                                                                        <span className="text-xs text-gray-600">{getSuggestionText(suggestion)}</span>
                                                                                    )}
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>

                                                        )}
                                                    </div>
                                                   {(values.serviceType === 'DRIVER' || values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'RENTAL_DROP_TAXI' ? 'visible' : '') && (
                                                                    <div className="p-2 space-y-2">
                                                                        <label className="block text-sm font-medium text-black-700">
                                                                            Luggage
                                                                        </label>
                                                                        <Field
                                                                            type="number"
                                                                            name="luggage"
                                                                            className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                            placeholder="Luggage Count (Auto-filled)"
                                                                            disabled={true}
                                                                            value={values.luggage}
                                                                        />
                                                                        <ErrorMessage name="luggage" component="div" className="text-red-500 text-sm" />
                                                                    </div>
                                                                )}
                                                                {(values.serviceType === 'DRIVER' || values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'RENTAL_DROP_TAXI' ? 'visible' : '') && (
                                                                    <div className="p-2 space-y-2">
                                                                        <label className="block text-sm font-medium text-black-700">
                                                                            Seater Capacity
                                                                        </label>
                                                                        <Field
                                                                            type="text"
                                                                            name="seaterCapacity"
                                                                            className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                            placeholder="Seater Capacity (Auto-filled)"
                                                                            disabled={true}
                                                                            value={values.seaterCapacity}
                                                                        />
                                                                       
                                                                        <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
                                                                    </div>
                                                                )}
                                                    {(values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_DROP_TAXI' || values.serviceType === 'RIDES' || values.serviceType === 'AUTO') && (
                                                        <div className="p-2 space-y-2">
                                                            <div className="flex items-center gap-3">
                                                            <label className="block text-sm font-medium text-black-700">
                                                            {values.serviceType === 'AUTO' ? 'Auto' : 'Cab'} Starting Point 
                                                            {(values.serviceType === 'RENTAL' && values.packageTypeSelected === "Outstation") && (
                                                                <span className="text-red-500">*</span>
                                                            )}
                                                            </label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="samePickupAsStart"
                                                                        checked={values.isPickupSameAsDriverStart}
                                                                        onChange={(e) => {
                                                                            setFieldValue("isPickupSameAsDriverStart", e.target.checked);
                                                                            if (e.target.checked) {
                                                                                setFieldValue("driverPickUpAddress", values.pickupAddress);
                                                                                setFieldValue("driverPickUpLocation", values.pickupLocation);
                                                                                setFieldValue("driverPickUpPlaceId", values.pickupPlaceId || "");
                                                                                setDriverPickUpLocation(values.pickupLocation || null);
                                                                                setDriverSuggestions([]);
                                                                            } else {
                                                                                setFieldValue("driverPickUpAddress", "");
                                                                                setFieldValue("driverPickUpLocation", null);
                                                                                setFieldValue("driverPickUpPlaceId", "");
                                                                                setDriverPickUpLocation(null);
                                                                                setDriverSuggestions([]);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <label htmlFor="samePickupAsStart" className="text-sm text-gray-700 cursor-pointer">
                                                                        Same as Pickup Address
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div className="relative">
                                                            <Field
                                                                type="text"
                                                                name="driverPickUpAddress"
                                                                className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                placeholder="Enter driver pickup location "
                                                                onChange={(e) => {
                                                                    setFieldValue("driverPickUpAddress", e.target.value);
                                                                    setFieldValue("driverPickUpLocation", null);
                                                                    setFieldValue("driverPickUpPlaceId", "");
                                                                    searchLocations(e.target.value, false,'driver');
                                                                }}
                                                            />
                                                              {values.driverPickUpAddress && (
                                                                <button
                                                                    type="button"
                                                                    className="absolute right-3 top-2 text-gray-500 hover:text-black"
                                                                    onClick={() => {
                                                                    setFieldValue("driverPickUpAddress", "");
                                                                    setFieldValue("driverPickUpLocation", null);
                                                                    setFieldValue("driverPickUpPlaceId", "");
                                                                   
                                                                    }}
                                                                >
                                                                    ✕
                                                                </button>
                                                                )}
                                                            </div>
                                                            {driverSuggestions.length > 0 && (
                                                                <ul className="border rounded-lg bg-white mt-2">
                                                                    {driverSuggestions.map((suggestion, index) => (
                                                                    <li
                                                                        key={index}
                                                                        className="p-2 cursor-pointer hover:bg-gray-100"
                                                                            onClick={() => handleSelectLocation(getSuggestionText(suggestion), getSuggestionPlaceId(suggestion), false, 'driver', setFieldValue,values)}
                                                                    >
                                                                            <div className="flex flex-col">
                                                                                <span className="font-bold text-black">{getSuggestionTitle(suggestion)}</span>
                                                                                {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                                                                                    <span className="text-xs text-gray-600">{getSuggestionText(suggestion)}</span>
                                                                                )}
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                             {values.serviceType === 'RENTAL' && values.packageTypeSelected === "Outstation" && (
                                                            <ErrorMessage name="driverPickUpAddress" component="div" className="text-red-500 text-sm" />
                                                             )}
                                                        </div>)}
                                                        
                                                    {/* Driver Ending Point - Show only for Drop-only trips */}
                                                   {values.serviceType === 'RENTAL' && values.packageTypeSelected === "Outstation" && (
                                                    <div className=" p-2 space-y-2">
                                                        <div className='flex '>
                                                        <label className="block text-sm font-medium text-black-700">
                                                            Cab Ending Point <span className="text-red-500">*</span>
                                                        </label>

                                                        {/* Checkbox to copy from starting point */}
                                                        <div className="flex items-center ml-3 gap-2 mb-2">
                                                            <input
                                                                type="checkbox"
                                                                id="sameAsStart"
                                                                checked={values.driverEndAddress === values.driverPickUpAddress && values.driverPickUpAddress !== ""}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        // Copy starting point to ending point
                                                                        setFieldValue("driverEndAddress", values.driverPickUpAddress);
                                                                        setFieldValue("driverEndLocation", values.driverPickUpLocation); // if you store lat/lng too
                                                                        setFieldValue("driverEndPlaceId", values.driverPickUpPlaceId || "");
                                                                        setFieldValue("driverEndSuggestions([])", []); // Clear suggestions
                                                                    } else {
                                                                        // Clear ending point when unchecked
                                                                        setFieldValue("driverEndAddress", "");
                                                                        setFieldValue("driverEndLocation", null);
                                                                        setFieldValue("driverEndPlaceId", "");
                                                                    }
                                                                }}
                                                            />
                                                            <label htmlFor="sameAsStart" className="text-sm text-gray-700 cursor-pointer">
                                                                Same as Driver Starting Point
                                                            </label>
                                                        </div>
                                                        </div>

                                                        {/* Ending point input - disabled when checkbox is checked */}
                                                        <div className="relative">
                                                        <Field
                                                            type="text"
                                                            name="driverEndAddress"
                                                            className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                            placeholder="Where should driver go after dropping customer?"
                                                            disabled={values.driverEndAddress === values.driverPickUpAddress && values.driverPickUpAddress !== ""}
                                                            onChange={(e) => {
                                                                setFieldValue("driverEndAddress", e.target.value);
                                                                setFieldValue("driverEndLocation", null);
                                                                setFieldValue("driverEndPlaceId", "");
                                                                searchLocations(e.target.value, false, 'driverEnd');
                                                            }}
                                                        />
                                                         {values.driverEndAddress && (
                                                                <button
                                                                    type="button"
                                                                    className="absolute right-3 top-2 text-gray-500 hover:text-black"
                                                                    onClick={() => {
                                                                    setFieldValue("driverEndAddress", "");
                                                                    setFieldValue("driverEndLocation", null);
                                                                    setFieldValue("driverEndPlaceId", "");
                                                                   
                                                                    }}
                                                                >
                                                                    ✕
                                                                </button>
                                                                )}
                                                            </div>

                                                        {driverEndSuggestions.length > 0 && (
                                                            <ul className="border rounded-lg bg-white mt-2 max-h-40 overflow-y-auto z-10">
                                                                {driverEndSuggestions.map((suggestion, index) => (
                                                                        <li
                                                                            key={index}
                                                                            className="p-2 cursor-pointer hover:bg-gray-100"
                                                                        onClick={() => {
                                                                            const selectedAddress = getSuggestionText(suggestion);
                                                                            handleSelectLocation(selectedAddress, getSuggestionPlaceId(suggestion), false, 'driverEnd', setFieldValue, values);
                                                                            // Uncheck the "same as start" when user selects different location
                                                                            if (selectedAddress !== values.driverPickUpAddress) {
                                                                                document.getElementById('sameAsStart').checked = false;
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-black">{getSuggestionTitle(suggestion)}</span>
                                                                            {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                                                                                <span className="text-xs text-gray-600">{getSuggestionText(suggestion)}</span>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        <ErrorMessage name="driverEndAddress" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                )}
                                                 {/* Source Type Field for all services */}
                                                {values.serviceType && (
                                                    <>
                                                        {values.serviceType === 'PARCEL' && (
                                                            <div className="p-2 space-y-3">
                                                                {/* <label className="text-sm font-medium text-gray-700">
                                                                    Weight Range <span className="text-red-500">*</span>
                                                                </label>
                                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                                    {[
                                                                        ...(values.parcelVehicleType === 'AUTO' ? [{ value: 'W_8_40', label: '8 to 40 Kg' }] : [{ value: 'W_0_7', label: '0 to 7 Kg' }]),
                                                                    ].map((opt) => (
                                                                        <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
                                                                            <Field
                                                                                type="radio"
                                                                                name="weightRange"
                                                                                value={opt.value}
                                                                                className="h-4 w-4 text-primary-600"
                                                                            />
                                                                            <span className="text-sm text-gray-800">{opt.label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                                <ErrorMessage name="weightRange" component="div" className="text-red-500 text-sm" /> */}

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-700">Sender Name <span className="text-red-500">*</span> </label>
                                                                        <Field
                                                                            type="text"
                                                                            name="senderName"
                                                                            placeholder="Enter sender name"
                                                                            className="mt-1 p-2 w-full rounded-md border-2 border-gray-300"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-700">Sender Phone <span className="text-red-500">*</span></label>
                                                                        <input
                                                                            type="text"
                                                                            name="senderPhone"
                                                                            placeholder="Enter sender phone"
                                                                            className="mt-1 p-2 w-full rounded-md border-2 border-gray-300"
                                                                            value={values.senderPhone ?? ''}
                                                                            onChange={(e) => {
                                                                                const raw = String(e.target.value || '');
                                                                                const digitsOnly = raw.replace(/\D/g, '');
                                                                                setFieldValue('senderPhone', digitsOnly.slice(0, 10));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-2">
                                                                        <label className="text-sm font-medium text-gray-700">Sender Address</label>
                                                                        <Field
                                                                            type="text"
                                                                            name="senderAddress"
                                                                            placeholder="Enter sender address"
                                                                            className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 "
                                                                            disabled={true}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-700">Receiver Name <span className="text-red-500">*</span></label>
                                                                        <Field
                                                                            type="text"
                                                                            name="receiverName"
                                                                            placeholder="Enter receiver name"
                                                                            className="mt-1 p-2 w-full rounded-md border-2 border-gray-300"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-700">Receiver Phone <span className="text-red-500">*</span></label>
                                                                        <input
                                                                            type="text"
                                                                            name="receiverPhone"
                                                                            placeholder="Enter receiver phone"
                                                                            className="mt-1 p-2 w-full rounded-md border-2 border-gray-300"
                                                                            value={values.receiverPhone ?? ''}
                                                                            onChange={(e) => {
                                                                                const raw = String(e.target.value || '');
                                                                                const digitsOnly = raw.replace(/\D/g, '');
                                                                                setFieldValue('receiverPhone', digitsOnly.slice(0, 10));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-2">
                                                                        <label className="text-sm font-medium text-gray-700">Receiver Address</label>
                                                                        <Field
                                                                            type="text"
                                                                            name="receiverAddress"
                                                                            placeholder="Enter receiver address"
                                                                            className="mt-1 p-2 w-full rounded-md border-2 border-gray-300"
                                                                            disabled={true}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="pt-2">
                                                                    <label className="text-sm font-medium text-gray-700">Order Type</label>
                                                                    <Field
                                                                        as="select"
                                                                        name="orderType"
                                                                        className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                                                    >
                                                                        <option value="">Select Order Type</option>
                                                                        <option value="Food">Food</option>
                                                                        <option value="Medicines">Medicines</option>
                                                                        <option value="Electronics">Electronics</option>
                                                                        <option value="Documents">Documents</option>
                                                                        <option value="Groceries">Groceries</option>
                                                                        <option value="Clothes">Clothes</option>
                                                                        <option value="Others">Others</option>
                                                                    </Field>
                                                                </div>

                                                                {values.orderType === 'Others' && (
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-700">Order Type Other</label>
                                                                        <Field
                                                                            type="text"
                                                                            name="orderTypeOther"
                                                                            placeholder="Enter other order type"
                                                                            className="mt-1 p-2 w-full rounded-md border-2 border-gray-300"
                                                                        />
                                                                    </div>
                                                                )}

                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-700">Delivery Instructions</label>
                                                                    <Field
                                                                        as="textarea"
                                                                        name="deliveryInstructions"
                                                                        placeholder="Enter delivery instructions"
                                                                        rows={3}
                                                                        className="mt-1 p-2 w-full rounded-md border-2 border-gray-300"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    <div className="p-2 space-y-2 ">
                                                        <label htmlFor="sourceType" className="text-sm font-medium text-gray-700">Source Type <span className="text-red-500">*</span></label>
                                                        <Field as="select" name="sourceType" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                                            <option value="">Select Source Type</option>
                                                            <option value="Facebook">Facebook</option>
                                                            <option value="Instagram">Instagram</option>
                                                            <option value="Influencer Reels">Influencer Reels</option>
                                                            <option value="WhatsApp">WhatsApp</option>
                                                            <option value="Google">Google</option>
                                                            <option value="YouTube">YouTube</option>
                                                            <option value="Justdial">Justdial</option>
                                                            <option value="Paper Notice">Paper Notice</option>
                                                            <option value="On Field">On Field</option>
                                                            <option value="Existing Customer">Existing Customer</option>
                                                            <option value="Referral">Referral</option>
                                                            <option value="Reddit">Reddit</option>
                                                            <option value="Offline Ads">Offline Ads</option>
                                                            <option value="Others">Others</option>
                                                        </Field>
                                                       {(values.sourceType === "Offline Ads" || values.sourceType === "Others") && (
                                                            <Field
                                                                type="text"
                                                                name="otherSourceType"
                                                                placeholder="Please specify the source"
                                                                className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm 
                                                                focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 mt-2"
                                                            />
                                                            )}

                                                        <ErrorMessage name="sourceType" component="div" className="text-red-500 text-sm" />
                                                {values.sourceType === "Others" && (
                                                    <ErrorMessage name="otherSourceType" component="div" className="text-red-500 text-sm" />
                                                )}
                                                    </div>
                                                    <div className="p-2 space-y-2 ">
                                                        <label htmlFor="landmark" className="text-sm font-medium text-gray-700">
                                                            Landmark (Optional) 
                                                        </label>
                                                        <Field
                                                            type="text"
                                                            name="landmark"
                                                            placeholder="Enter nearby landmark (helps driver find easily)"
                                                            className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm 
                                                                     focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                                        />
                                                        <ErrorMessage name="landmark" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && values.serviceType && quoteDetails && (
                                                        <div className="mt-4 p-3 border border-gray-300 rounded-xl bg-white">
                                                            <Typography variant="h6" className="mb-2">Admin Discount (Optional)</Typography>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-black-700">Discount Type</label>
                                                                    <Field
                                                                        as="select"
                                                                        name="adminDiscountType"
                                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                    >
                                                                        <option value="">Select type</option>
                                                                        <option value="PERCENTAGE">PERCENTAGE</option>
                                                                        {/* <option value="AMOUNT">AMOUNT</option> */}
                                                                    </Field>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-black-700">Discount Value  <span className="text-red-500">value min 0.01 max 5</span></label>
                                                                    <Field
                                                                        type="number"
                                                                        name="adminDiscountValue"
                                                                        min="0"
                                                                        step="0.01"
                                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                        placeholder="Enter value"
                                                                        onChange={(e) => setFieldValue('adminDiscountValue', sanitizeAdminDiscountValue(e.target.value))}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-black-700">Remarks</label>
                                                                    <Field
                                                                        type="text"
                                                                        name="adminDiscountRemarks"
                                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                                        placeholder="Optional remarks"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    </>
                                                )}
                                                </div>
                                                
                                              {values.serviceType == 'DRIVER' && values.packageTypeSelected !== 'Outstation' && quoteDetails && (
                                                    <Card className="my-6">
                                                        <div className={priceDetailsCardClass}>
                                                        <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-center">
                                                            <span>Estimated Price Details</span>
                                                            {isPeakHour && (
                                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                                                                    Peak Hrs
                                                                </span>
                                                            )}
                                                        </h2>
                                                        <hr className="my-2 border border-black" />
                                                        <div className="mt-4">
                                                            <div className="flex justify-between">
                                                            <Typography color="gray" variant="h6">Package:</Typography>
                                                            <Typography>
                                                                {packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected))?.period || ""} hr
                                                            </Typography>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Typography color="gray" variant="h6">KM:</Typography>
                                                                <Typography>
                                                                    {Number(quoteDetails.amount?.distanceEstimated).toFixed(2) || 0} kms
                                                                </Typography>
                                                            </div>
                                                            {/* <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">Car Type:</Typography>
                                                                                <Typography>
                                                                                    {values.carType || quoteDetails.amount?.carType || ''}
                                                                                </Typography>
                                                                            </div> */}
                                                            <div className="flex justify-between">
                                                                <Typography color="gray" variant="h6">Base Fare:</Typography>
                                                                <Typography>
                                                                    ₹ {quoteDetails.amount?.fareBreakdown?.baseFare}
                                                            </Typography>
                                                        </div>
                                                                        {/* <div className="flex justify-between">
                                                                        <Typography color="gray" variant="h6">Estimated Fare</Typography>
                                                                        <Typography>
                                                                            ₹ {(() => {
                                                                            const selectedPackage = packageTypeSelectedData.find((pkg) => pkg.id === Number(values.packageSelected));
                                                                            if (!selectedPackage) return "";

                                                                                let amount = 0;
                                                                            switch (values.carType?.toUpperCase()) {
                                                                                case "MINI":
                                                                                        amount = Number(selectedPackage.price || 0);
                                                                                        break;
                                                                                case "SEDAN":
                                                                                        amount = Number(selectedPackage.price || 0);
                                                                                        break;
                                                                                case "SUV":
                                                                                        amount = Number(selectedPackage.price || 0);
                                                                                        break;
                                                                                case "MUV":
                                                                                        amount = Number(selectedPackage.priceMVP || 0);
                                                                                        break;
                                                                                default:
                                                                                return "";
                                                                            }

                                                                                if (!amount || Number.isNaN(amount)) {
                                                                                    return "";
                                                                                }
                                                                                return Math.round(amount);
                                                                            })()}
                                                                        </Typography>
                                                                        </div> */}
                                                                        {quoteDetails.amount?.gst_amount > 0 && (
                                                                         <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">TAX Amount:</Typography>
                                                                                <Typography>
                                                                                     ₹ {Math.round(quoteDetails.amount?.gst_amount || '')}
                                                                                </Typography>
                                                                            </div>
                                                                        )}
                                                                            {quoteDetails.amount?.fareBreakdown?.nightCharge > 0 && 
                                                                            <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">Night Charge :</Typography>
                                                                                <Typography>
                                                                                     ₹ {(quoteDetails.amount?.fareBreakdown?.nightCharge || 0)}
                                                                                </Typography>
                                                                            </div>
                                                                            }
                                                                             <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">Final Estimate Fare:</Typography>
                                                                                <Typography>
                                                                                    ₹ {quoteDetails.amount?.fare_after_gst || ''}
                                                                                </Typography>
                                                                            </div>
                                                                            {quoteDetails?.walletApplicable === true  && (
                                                                                    <>
                                                                                    <div className="flex justify-between">
                                                                                            <Typography color="gray" variant="h6">Wallet Amount Applied:</Typography>
                                                                                            <Typography>
                                                                                                ₹ {Math.round(
                                                                                                    quoteDetails?.walletAmount ||
                                                                                                    quoteDetails?.amount?.walletAmount ||
                                                                                                    quoteDetails?.value?.walletAmount ||
                                                                                                    0
                                                                                                )}
                                                                                            </Typography>
                                                                                            </div>
                                                                                            <div className="flex justify-between">                                                                                       
                                                                                            <Typography color="gray" variant="h6">Final Estimated Fare after Wallet Deduction:</Typography>
                                                                                            <Typography>
                                                                                                ₹ {Math.max(0, Math.round(Number(quoteDetails?.amount?.estimatedPrice || 0) - Number(quoteDetails?.walletAmount || quoteDetails?.amount?.walletAmount || quoteDetails?.value?.walletAmount || 0)))}
                                                                                            </Typography>                        
                                                                                            </div>                                                                
                                                                                    </>
                                                                                )}
                                                                        {useSystemPercentDiscount && <>
                                                                        <div className='flex justify-between'>
                                                                          <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                                                <Typography>
                                                                                    {quoteDetails.discount?.percentage} %
                                                                            </Typography>
                                                                        </div>
                                                                        <div className='flex justify-between'>
                                                                            <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                                <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                                    ₹ {Math.max(0, Math.round(totalestimationfare))}
                                                                            </Typography>
                                                                        </div>

                                                                        </>}
                                                                            {useSystemAmountDiscount && (
                                                                            <>                   
                                                                            <div className='flex justify-between'>                                                             
                                                                                    <Typography color="gray" variant="h6">Discount Applied:</Typography>
                                                                                    <Typography>
                                                                                        ₹ {Math.round(quoteDetails.discount?.amount)}
                                                                                    </Typography>
                                                                                    </div>
                                                                                <div className='flex justify-between'> 
                                                                                    <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                                <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                                    ₹ {Math.max(0, Math.round(totalestimationfare))}
                                                                            </Typography>
                                                                            </div>
                                                                                
                                                                            </>)}
                                                                            {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && quoteDetails.adminDiscount?.discountValue > 0 &&
                                                                            (
                                                                                <>
                                                                                <div className='flex justify-between'>
                                                                                    <Typography color="gray" variant="h6">Admin Discount Applied:</Typography>
                                                                                    <Typography>
                                                                                        {adminDiscountValueDisplay}
                                                                                    </Typography>
                                                                                </div>
                                                                                <div className='flex justify-between'>
                                                                                    <Typography color="gray" variant="h6">Admin Discount Applied After Total estimated Fare:</Typography>
                                                                                    <Typography>
                                                                                        ₹ {Math.max(0, Math.round(finalEstimatedFare))}
                                                                                    </Typography>
                                                                                </div>
                                                                            </>)
                                                                            }
                                                                            {cancelChargeApplicable && (
                                                                                <div className='flex justify-between'>
                                                                                    <Typography color="gray" variant="h6">Cancel Charge Added:</Typography>
                                                                                    <Typography>Yes (₹ {Math.round(cancelChargeAmount)})</Typography>
                                                                                </div>
                                                                            )}
                                                                            {/* <div className='flex justify-between'>
                                                                                <Typography color="gray" variant="h6">{finalTotalLabel} check</Typography>
                                                                                <Typography>₹ {Math.max(0, Math.round(finalTotalAfterDiscountsWithCancelCharge))}</Typography>
                                                                            </div> */}
                                                                    </div>
                                                                    </div>
                                                                </Card>
                                                                )}
                                                    {quoteDetails && (values.serviceType !== 'DRIVER' || (values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation')) && 
                                                    <Card className="my-6">
                                                        <div className={priceDetailsCardClass}>
                                                            <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-center">
                                                                <span>Estimated Price Details</span>
                                                                {isPeakHour && (
                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                                                                        Peak Hrs
                                                                    </span>
                                                                )}
                                                            </h2>
                                                            <hr className="my-2 border border-black" />
                                                            <div className="mt-4">
                                                                <>
                                                                    {values?.serviceType === 'RENTAL_HOURLY_PACKAGE' ? (
                                                                        <div className="space-y-3">
                                                                            <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">Package Period:</Typography>
                                                                                <Typography>
                                                                                    {quoteDetails.amount?.packageDetails?.period || ''} hours
                                                                                </Typography>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">Car Type:</Typography>
                                                                                <Typography>
                                                                                    {quoteDetails.amount?.carType || ''}
                                                                                </Typography>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">Package Price:</Typography>
                                                                                <Typography>
                                                                                    ₹ {Math.round((() => {
                                                                                        const selectedPackage = packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected));
                                                                                        if (!selectedPackage) return 0;
                                                                                        switch (quoteDetails.amount?.carType?.toUpperCase()) {
                                                                                            case "MINI": return selectedPackage.price || 0;
                                                                                            case "SEDAN": return selectedPackage.priceSedan || 0;
                                                                                            case "SUV": return selectedPackage.priceSuv || 0;
                                                                                            case "MUV": return selectedPackage.priceMVP || 0;
                                                                                            default: return 0;
                                                                                        }
                                                                                        })())}
                                                                                </Typography>
                                                                            </div>
                                                                            {quoteDetails.amount?.gst_amount > 0 && (
                                                                              <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">TAX Amount:</Typography>
                                                                                <Typography>
                                                                                   ₹ {Math.round(quoteDetails.amount?.gst_amount || '')}
                                                                                </Typography>
                                                                            </div>
                                                                            )}
                                                                            <div className="flex justify-between">
                                                                                <Typography color="gray" variant="h6">Estimate Fare:</Typography>
                                                                                <Typography>
                                                                                    {quoteDetails.amount?.fare_after_gst|| ''}
                                                                                </Typography>
                                                                            </div>
                                                                            {quoteDetails?.walletApplicable === true  && (
                                                                                    <>
                                                                                    <div className="flex justify-between">
                                                                                            <Typography color="gray" variant="h6">Wallet Amount Applied</Typography>
                                                                                            <Typography>
                                                                                                ₹ {Math.round(
                                                                                                    quoteDetails?.walletAmount ||                                                                                                    
                                                                                                    0
                                                                                                )}
                                                                                            </Typography>
                                                                                            </div>
                                                                                        <div className="flex justify-between">
                                                                                            <Typography color="gray" variant="h6">Final Estimated Fare after Wallet Deduction : </Typography>
                                                                                            <Typography>₹ {Math.max(0, Math.round(Number(quoteDetails?.amount?.estimatedPrice || 0) - Number(quoteDetails?.walletAmount || quoteDetails?.amount?.walletAmount || quoteDetails?.value?.walletAmount || 0)))}</Typography>
                                                                                    </div>
                                                                                    </>
                                                                                )}
                                                                            {useSystemPercentDiscount && (
                                                                                <>
                                                                                    <div className="flex justify-between">
                                                                                        <Typography color="gray" variant="h6">Discount Applied:</Typography>
                                                                                        <Typography>
                                                                                            {quoteDetails.discount?.percentage} %
                                                                                        </Typography>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <Typography color="gray" variant="h6">Kilometer :</Typography>
                                                                                        <Typography>{quoteDetails?.amount?.packageDetails?.kilometer} Kms</Typography>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <Typography color="gray" variant="h6">Total Estimated Fare:</Typography>
                                                                                        <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                                            {/* ₹ {(quoteDetails.amount?.packageDetails?.price) - (quoteDetails.amount?.packageDetails?.price * quoteDetails?.discount?.percentage / 100)} */}
                                                                                            ₹ {(() => {
                                                                                                const carType = quoteDetails?.amount?.carType?.toUpperCase();
                                                                                                const pkg = quoteDetails?.amount?.packageDetails;
                                                                                                const price = carType === 'MINI' ? Number(pkg?.price) :
                                                                                                            carType === 'MUV' ? Number(pkg?.priceMVP) :
                                                                                                            carType === 'SUV' ? Number(pkg?.priceSuv) :
                                                                                                            carType === 'SEDAN' ? Number(pkg?.priceSedan) : 0;
                                                                                                if (!price) return 'N/A';
                                                                                                const discounted = price - (price * (Number(quoteDetails?.discount?.percentage) || 0) / 100);
                                                                                                return Math.round(discounted);
                                                                                            })()}

                                                                                            {/* {(() => {
                                                                                                const packagePrice = Number(quoteDetails.amount?.packageDetails?.price) || 0;
                                                                                                const discountPercentage = Number(quoteDetails.discount?.percentage) || 0;
                                                                                                return packagePrice - (packagePrice * discountPercentage / 100);
                                                                                            })()} */}
                                                                                        </Typography>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        {useSystemAmountDiscount && (
                                                                            <>       
                                                                            <div className='flex justify-between'>                                                                        
                                                                                    <Typography color="gray" variant="h6">Discount Applied:</Typography>
                                                                                    <Typography>
                                                                                        ₹ {Math.round(quoteDetails.discount?.amount)}
                                                                                    </Typography>
                                                                                </div> 
                                                                                    <div className='flex justify-between'>
                                                                                    <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                                <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                                    ₹ {Math.max(0, Math.round(totalestimationfare))}
                                                                            </Typography>
                                                                            </div>
                                                                                
                                                                            </>)}
                                                                            {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && quoteDetails.adminDiscount?.discountValue > 0 &&
                                                                            (
                                                                                <>
                                                                                <div className='flex justify-between'>
                                                                                    <Typography color="gray" variant="h6">Admin Discount Applied:</Typography>
                                                                                    <Typography>
                                                                                        {adminDiscountValueDisplay}
                                                                                    </Typography>
                                                                                </div>
                                                                                 <div className='flex justify-between'>
                                                                                    <Typography color="gray" variant="h6">Admin Discount Applied After Total estimated Fare:</Typography>
                                                                                    <Typography>
                                                                                        ₹ {Math.max(0, Math.round(finalEstimatedFare))}
                                                                                    </Typography>
                                                                                </div>
                                                                            </>)
                                                                            }
                                                                        {cancelChargeApplicable && (
                                                                            <div className='flex justify-between'>
                                                                                <Typography color="gray" variant="h6">Cancel Charge Added:</Typography>
                                                                                <Typography>Yes (₹ {Math.round(cancelChargeAmount)})</Typography>
                                                                            </div>
                                                                        )}
                                                                        {/* <div className='flex justify-between'>
                                                                            <Typography color="gray" variant="h6">{finalTotalLabel}</Typography>
                                                                            <Typography>₹ {Math.max(0, Math.round(finalTotalAfterDiscountsWithCancelCharge))}</Typography>
                                                                        </div> */}
                                                                        </div>
                                                                    ) : (
                                                                    <div className="grid grid-cols-2 justify-between">
                                                                        {quoteDetails?.amount?.isPremiumFare && (
                                                                            <>
                                                                                <Typography color="gray" variant="h6">Car Service</Typography>
                                                                                <Typography className='font-semibold'> {quoteDetails.amount?.isPremiumFare ? "Premium Car Service" : "Not a Premium Car Services "}</Typography>
                                                                            </>
                                                                        )}
                                                                        {quoteDetails?.amount?.isPremiumFare && (
                                                                            <>
                                                                                <Typography color="gray" variant="h6">Premium Car Type</Typography>
                                                                                <Typography> {quoteDetails.amount?.premiumDetails?.appliedCarType}</Typography>
                                                                            </>
                                                                        )}

                                                                    {values?.serviceType === 'PARCEL' && (
                                                                        <>
                                                                            <Typography color="gray" variant="h6">Parcel Vehicle Type</Typography>
                                                                            <Typography>
                                                                                {toTitleLabel(quoteDetails.amount?.parcelVehicleType || values.parcelVehicleType || '')}
                                                                            </Typography>
                                                                            <Typography color="gray" variant="h6">Zone Rule</Typography>
                                                                            <Typography>
                                                                                {toTitleLabel(quoteDetails.amount?.fareBreakdown?.zoneRule || values.zoneRule || '')}
                                                                            </Typography>
                                                                            {quoteDetails.amount?.pricingDetails?.surcharges?.weight > 0 && (
                                                                                <>
                                                                                    <Typography color="gray" variant="h6">Surcharges weight</Typography>
                                                                                    <Typography>
                                                                                        {quoteDetails.amount?.pricingDetails?.surcharges?.weight}
                                                                                    </Typography>
                                                                                </>)}
                                                                            {quoteDetails.amount?.pricingDetails?.surcharges?.weather > 0 && (
                                                                                <>
                                                                                    <Typography color="gray" variant="h6">Surcharges weather</Typography>
                                                                                    <Typography>
                                                                                        {quoteDetails.amount?.pricingDetails?.surcharges?.weather}
                                                                                    </Typography>
                                                                                </>)}
                                                                            {quoteDetails.amount?.pricingDetails?.surcharges?.handling > 0 && (
                                                                                <>
                                                                                    <Typography color="gray" variant="h6">Surcharges handling</Typography>
                                                                                    <Typography>
                                                                                        {quoteDetails.amount?.pricingDetails?.surcharges?.handling}
                                                                                    </Typography>
                                                                                </>)}
                                                                            {quoteDetails.amount?.pricingDetails?.surcharges?.night > 0 && (
                                                                                <>
                                                                                    <Typography color="gray" variant="h6">Surcharges night</Typography>
                                                                                    <Typography>
                                                                                        {quoteDetails.amount?.pricingDetails?.surcharges?.night}
                                                                                    </Typography>
                                                                                </>)}
                                                                            {quoteDetails.amount?.pricingDetails?.surcharges?.zone > 0 && (
                                                                                <>
                                                                                    <Typography color="gray" variant="h6">Surcharges zone</Typography>
                                                                                    <Typography>
                                                                                        {quoteDetails.amount?.pricingDetails?.surcharges?.zone}
                                                                                    </Typography>
                                                                                </>)}
                                                                        </>)}
                                                                          {values?.serviceType !== 'DRIVER' && values?.serviceType !== 'RENTAL_DROP_TAXI' && (
                                                                            <>
                                                                        <Typography color="gray" variant="h6">Per Km Rate</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(quoteDetails.amount?.kilometerPriceVal)}
                                                                        </Typography></>)}
                                                                        {values?.serviceType !== 'DRIVER' && values?.serviceType !== 'AUTO' && values?.serviceType !=='RIDES' &&( <>
                                                                        <Typography color="gray" variant="h6">Pick up to Drop  Kilometer {quoteDetails.amount?.driverWithin > 0 && (<> + Driver Km For Pickup Location </>)}</Typography>
                                                                        <Typography>                                                                            
                                                                            {(quoteDetails.amount?.estimatedDistance > 0 ?  quoteDetails.amount?.estimatedDistance : quoteDetails.amount?.distanceEstimated)} Kms {quoteDetails.amount?.driverWithin > 0 && (<> + {Number(quoteDetails.amount.driverWithin).toFixed(1)} Kms</>)} 
                                                                        </Typography></>)}
                                                                         {(values?.serviceType == 'AUTO' || values?.serviceType == 'RIDES') && ( 
                                                                            <>
                                                                            <Typography color="gray" variant="h6">Pick up to Drop  Kilometer + Driver Km For Pickup Location</Typography>
                                                                            <Typography>
                                                                                {(quoteDetails.amount?.distanceEstimated)} Kms {quoteDetails.amount?.driverWithin > 0 && (<> + {Number(quoteDetails.amount.driverWithin).toFixed(1)} Kms</>)}
                                                                            </Typography></>)}
                                                                         { values?.serviceType === 'RENTAL' &&  ( <>
                                                                        
                                                                        <Typography color="gray" variant="h6">Drop Location to Driver End Point(KM)</Typography>
                                                                             
                                                                        <Typography>
                                                                           {Number(quoteDetails.amount?.driverEndPoint).toFixed(2)} Kms
                                                                        </Typography>
                                                                        </>)}
                                                                        { values?.serviceType === 'RIDES' && ( <>
                                                                        
                                                                        <Typography color="gray" variant="h6">Estimate Time</Typography>
                                                                             
                                                                        <Typography>
                                                                            {quoteDetails.amount?.displayTime}
                                                                        </Typography>
                                                                        </>)}
                                                                        {values?.serviceType === "RENTAL_DROP_TAXI"  && ( <>
                                                                        <Typography color="gray" variant="h6">Estimate Time</Typography>
                                                                        <Typography>
                                                                            {quoteDetails.amount?.hoursEstimated}
                                                                        </Typography>
                                                                        </>)}
                                                                        {values?.serviceType === "RENTAL"  && ( <>
                                                                        <Typography color="gray" variant="h6">Estimate Time</Typography>
                                                                        <Typography>
                                                                          {minsToHHMM(quoteDetails.amount?.distanceEstimated)}
                                                                        </Typography>
                                                                        </>)}
                                                                      {values?.serviceType !=='DRIVER' && (
                                                                        <>
                                                                        <Typography color="gray" variant="h6">Base Fare upto {quoteDetails.amount?.baseKm} Kilometer</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(quoteDetails.amount?.baseFare)}
                                                                        </Typography>
                                                                        </>)}
                                                                    {values?.serviceType === 'DRIVER' && values?.packageTypeSelected === 'Outstation' && (
                                                                        <>
                                                                            {/* <Typography color="gray" variant="h6">Car Type:</Typography>
                                                                            <Typography>
                                                                                {values.carType || quoteDetails.amount?.carType || ''}
                                                                            </Typography> */}
                                                                            <Typography color="gray" variant="h6">Base Fare</Typography>
                                                                            <Typography>
                                                                                ₹ {Number(quoteDetails.amount?.fareBreakdown?.baseFare).toFixed(2)}
                                                                            </Typography>
                                                                            <Typography color="gray" variant="h6">KM</Typography>
                                                                            <Typography>
                                                                                 {Number(quoteDetails?.amount?.distanceEstimated || 0).toFixed(2)}Kms
                                                                            </Typography>                                                                            
                                                                            {quoteDetails.amount?.fareBreakdown?.dropCharge > 0 && <>
                                                                                <Typography color="gray" variant="h6">Drop Charge</Typography>
                                                                                <Typography>
                                                                                    ₹ {Number(quoteDetails.amount?.fareBreakdown?.dropCharge).toFixed(2)}
                                                                                </Typography>
                                                                            </>}
                                                                            {quoteDetails.amount?.fareBreakdown?.foodCharge > 0 && <>
                                                                                <Typography color="gray" variant="h6">Food Charge</Typography>
                                                                                <Typography>
                                                                                    ₹ {Number(quoteDetails.amount?.fareBreakdown?.foodCharge).toFixed(2)}
                                                                                </Typography>
                                                                            </>}
                                                                            {quoteDetails.amount?.fareBreakdown?.nightCharge > 0 && <>
                                                                                <Typography color="gray" variant="h6">Night Charge</Typography>
                                                                                <Typography>
                                                                                    ₹ {Number(quoteDetails.amount?.fareBreakdown?.nightCharge).toFixed(2)}
                                                                                </Typography>
                                                                            </>}
                                                                        </>)}
                                                                        {/* {quoteDetails.amount.driverWithin > 0 && values.serviceType !== 'DRIVER' &&
                                                                        <>
                                                                        <Typography color="gray" variant="h6">Driver Km For Pickup Location</Typography>
                                                                        <Typography>
                                                                            {quoteDetails.amount.driverWithin + ' Km'}
                                                                        </Typography>
                                                                        </>
                                                                        } */}
                                                                        {(quoteDetails.amount?.isPremiumFare !== true) && (values?.serviceType === 'RIDES' || values?.serviceType === "RENTAL" || values?.serviceType === "RENTAL_DROP_TAXI" || values?.serviceType === "RENTAL_HOURLY_PACKAGE") && (
                                                                            <>
                                                                            <Typography color="gray" variant="h6">Car Type:</Typography>
                                                                        <Typography>
                                                                            {quoteDetails.amount?.carType || ''}
                                                                        </Typography>   
                                                                        </>)}
                                                                        
                                                                        {quoteDetails.amount?.isPrimeLocation === true && quoteDetails.amount?.rideSurchargeAmount > 0 && 
                                                                        <>
                                                                        <Typography color="gray" variant="h6">Surcharge Applied</Typography>
                                                                            <Typography>
                                                                                ₹ {Math.round(quoteDetails.amount?.rideSurchargeAmount)}
                                                                            </Typography>
                                                                        </>
                                                                        }
                                                                    {quoteDetails.amount?.gst_amount > 0 && (
                                                                        <>
                                                                         <Typography color="gray" variant="h6">TAX Amount</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(quoteDetails.amount?.gst_amount)}
                                                                        </Typography>
                                                                    </>)}
                                                                        <Typography color="gray" variant="h6">Estimated Fare</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(quoteDetails.amount?.estimatedPrice)}
                                                                        </Typography>
                                                                        {quoteDetails?.walletApplicable === true 
                                                                            && (
                                                                            <>                                                                                                                                                                    
                                                                                <Typography color="gray" variant="h6">Wallet Amount Applied</Typography>
                                                                                <Typography>
                                                                                    ₹ {Math.round(walletAmountApplied)}
                                                                                </Typography>                                                                                                                                                                                                                                    
                                                                                <Typography color="gray" variant="h6">Final Estimated Fare after Wallet Deduction :</Typography>
                                                                                <Typography>₹ {Math.max(0, Math.round(Number(quoteDetails?.amount?.estimatedPrice || 0) - walletAmountApplied))}</Typography>
                                                                            
                                                                            </>)                                                                                
                                                                            }
                                                                        {useSystemPercentDiscount && <>
                                                                        
                                                                          <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                                                <Typography>
                                                                                    {quoteDetails.discount?.percentage} %
                                                                            </Typography>
                                                                            <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                                <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                                    ₹ {Math.max(0, Math.round(totalestimationfare))}
                                                                            </Typography>

                                                                        </>}
                                                                        {useSystemAmountDiscount && (
                                                                            <>                                                                                
                                                                                    <Typography color="gray" variant="h6">Discount Applied:</Typography>
                                                                                    <Typography>
                                                                                        ₹ {Math.round(quoteDetails.discount?.amount)}
                                                                                    </Typography>
                                                                                    <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                                <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                                    ₹ {Math.max(0, Math.round(totalestimationfare))}
                                                                            </Typography>
                                                                                
                                                                            </>)}    
                                                                                {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && quoteDetails.adminDiscount?.discountValue > 0 &&
                                                                            (
                                                                                <>
                                                                                {/* <div className='flex justify-between'> */}
                                                                                    <Typography color="gray" variant="h6">Admin Discount Applied:</Typography>
                                                                                    <Typography>
                                                                                         {adminDiscountValueDisplay}
                                                                                    </Typography>
                                                                                {/* </div> */}
                                                                                 {/* <div className='flex justify-between'> */}
                                                                                    <Typography color="gray" variant="h6">Admin Discount Applied After Total estimated Fare:</Typography>
                                                                                    <Typography>
                                                                                       ₹ {Math.max(0, Math.round(finalEstimatedFare))}

                                                                                    </Typography>
                                                                                {/* </div> */}
                                                                            </>)
                                                                            }                                                                                                                                                                                                                
                                                                        {cancelChargeApplicable && (
                                                                            <>
                                                                                <Typography color="gray" variant="h6">Cancel Charge Added</Typography>
                                                                                <Typography>Yes (₹ {Math.round(cancelChargeAmount)})</Typography>
                                                                            </>
                                                                        )}
                                                                        {/* <>
                                                                            <Typography color="gray" variant="h6">{finalTotalLabel}</Typography>
                                                                            <Typography>₹ {Math.max(0, Math.round(finalTotalAfterDiscountsWithCancelCharge))}</Typography>
                                                                        </> */}
                                                                        {/* <Typography color="gray" variant="h6">Extra Km Price</Typography>
                                                                        <Typography>
                                                                            ₹ {quoteDetails.amount.extraKmPrice}
                                                                        </Typography> */}
                                                                        {/* <Typography color="gray" variant="h6">difference Days</Typography>
                                                                        <Typography>
                                                                            ₹ {quoteDetails.amount.differenceDays}
                                                                        </Typography> */}
                                                                        {/* <Typography color="gray" variant="h6">driver Charge</Typography>
                                                                        <Typography>
                                                                            ₹ {quoteDetails.amount.driverCharge}
                                                                        </Typography> */}
                                                                    </div>
                                                                    )}
                                                                </>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                }

                                                {/* {values.pickupAddress && isLoaded && (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '50%' }}
                                        center={mapCenter}
                                        zoom={mapZoom}
                                        onLoad={(map) => {
                                            mapRef.current = map;
                                        }}
                                    >
                                        {pickupLocation && (
                                            <Marker
                                                position={pickupLocation}
                                                draggable={true}
                                                icon={{
                                                    url: '/img/Pickup-Location.png',
                                                    scaledSize: new window.google.maps.Size(40, 40),
                                                }}
                                                onDragEnd={handlePickupMarkerDragEnd}
                                            />
                                        )}
                                        {dropLocation && (
                                            <Marker
                                                position={dropLocation}
                                                draggable={true}
                                                icon={{
                                                    url: '/img/Drop-Location.png',
                                                    scaledSize: new window.google.maps.Size(40, 40)
                                                }}
                                                onDragEnd={handleDropMarkerDragEnd}
                                            />
                                        )}
                                    </GoogleMap>
                                )} */}
                                                {values.serviceType === 'RENTAL_HOURLY_PACKAGE' && quoteDetails && (
                                                    <div className="mb-5 space-y-4 shadow-md shadow-gray-700 bg-white rounded-xl p-4">
                                                        <Typography className="font-roboto-medium text-lg text-gray-900">
                                                            Things to Know Before You Confirm:
                                                        </Typography>
                                                        <div className="space-y-2">
                                                            <Typography className=" text-sm text-gray-700">
                                                                • Toll, parking, permit charges, and state taxes are excluded.
                                                            </Typography>
                                                                        <Typography className=" text-sm text-gray-700">
                                                                • The first additional <span className="font-bold text-black">
                                                                    {quoteDetails.expectedPackageDetails?.freeExtraMinutes}
                                                                                </span> minutes over customer <span className="font-bold text-black">{packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected))?.period || ''} hours </span>, trip time are free. After that, customer will be charged <span className="font-bold text-black">₹{(() => {
                                                                    const selectedPackage = packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected));
                                                                    return selectedPackage ? (
                                                                        values.carType === 'Mini' ? selectedPackage.additionalMinCharge :
                                                                            values.carType === 'Sedan' ? selectedPackage.additionalMinChargeSedan :
                                                                                values.carType === 'SUV' ? selectedPackage.additionalMinChargeSuv :
                                                                                    selectedPackage.additionalMinChargeMVP
                                                                    ) : '';
                                                                })()}</span> per minute.
                                                            </Typography>
                                                            {quoteDetails?.amount?.fareBreakdown?.gst_percentage > 0 && (
                                                                <>
                                                             <Typography className="text-sm text-gray-700">
                                                                • The estimated price includes  <span className="font-bold text-black">{values.gst_percentage || '0'}%</span> tax.
                                                            </Typography>
                                                            </>)}
                                                            <Typography className=" text-sm text-gray-700">
                                                                • For every extra kilometer <span className="font-bold text-black">₹ {(() => {
                                                                    const selectedPackage = packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected));
                                                                if (!selectedPackage) return '';
                                                                const price =
                                                                        values.carType === 'Mini' ? selectedPackage.extraKmPrice :
                                                                            values.carType === 'Sedan' ? selectedPackage.extraKmPrice :
                                                                                values.carType === 'SUV' ? selectedPackage.extraKmPrice :
                                                                                    selectedPackage.extraKmPrice;
                                                                return Math.round(Number(price || 0));
                                                                })()}</span> will be charged.
                                                            </Typography>
                                                            <Typography className=" text-sm text-gray-700">
                                                                • Night charge of <span className="font-bold text-black">₹ {packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected))?.nightCharge || ''}</span> will be charged after {convertTimeFormat(packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected))?.nightHoursFrom || '')}.
                                                            </Typography>
                                                            <Typography className=" text-sm text-gray-700">
                                                                • Hourly Packages are available only for Local services.
                                                            </Typography>
                                                            <Typography className=" text-sm text-gray-700">
                                                                • If the driver’s start or end point is under 2 km, no charge is added; charges apply only when it is above 2 km.
                                                            </Typography>
                                                            {Number(values.luggage) > 0 && (
                                                                <Typography className=" text-sm text-gray-700">
                                                                    • Only {values.luggage} Additional luggage is allowed; extra luggage may incur additional charges.
                                                                </Typography>
                                                            )}
                                                        </div>
                                                        <div className="border border-gray-300 bg-yellow-600 rounded-xl p-2">
                                                            <Typography
                                                                className=" text-center text-sm text-gray-700"
                                                            >
                                                                {BOOKING_TERMS_AND_CONDITIONS}
                                                            </Typography>
                                                        </div>
                                                    </div>

                                                )}
                                                {values.serviceType == 'RENTAL_DROP_TAXI' && quoteDetails && (
                                                    <div className="mb-5 space-y-4 shadow-md shadow-gray-700 bg-white rounded-xl p-4">
                                                        <Typography className="font-roboto-medium text-lg text-gray-900">
                                                            Things to Know Before You Confirm:
                                                        </Typography>
                                                        <div className="space-y-2">
                                                            <Typography className="text-sm text-gray-700">
                                                                • Toll, parking, permit charges, and state taxes are excluded.
                                                            </Typography>
                                                            <Typography className="text-sm text-gray-700">
                                                                • For Every extra kilometer <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.extraKmPrice || '')}</span> will be charged.
                                                            </Typography> 
                                                             <Typography className="text-sm text-gray-700">
                                                                • The first additional <span className="font-bold text-black">
                                                                                {quoteDetails.expectedPackageDetails?.freeExtraMinutes}</span> minutes over customer estimated trip time are free. After that, customer will be charged <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.fareBreakdown?.extraHours?.rate || '')}</span> per minute.
                                                            </Typography>
                                                            <Typography className="text-sm text-gray-700">
                                                                • A Driver starting  Points <span className="font-bold text-black">{Number(quoteDetails.amount?.driverWithin).toFixed(2) || ''}</span> Kms.
                                                            </Typography>
                                                            {quoteDetails.amount?.gst_percentage > 0 && (
                                                            <Typography className="text-sm text-gray-700">
                                                                • The estimated price includes  <span className="font-bold text-black">{quoteDetails.amount?.gst_percentage|| '0'}%</span> tax.
                                                            </Typography>
                                                            )}

                                                            {quoteDetails.amount?.driverCharge > 0 && (
                                                            <Typography className=" text-sm text-gray-700">
                                                                • Driver Night Stay charge <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.driverCharge || '0')}</span>
                                                            </Typography>
                                                            )}
                                                            {quoteDetails.amount?.extraNightCharge > 0 && (
                                                             <Typography className="text-sm text-gray-700">
                                                                • Night Charge of <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.extraNightCharge)}</span> applies if the trip extends past{' '}
                                                            </Typography>
                                                            )}                                                            
                                                            {quoteDetails.amount?.rideSurchargeAmount > 0 && (
                                                                <Typography className=" text-sm text-gray-700">
                                                                    • A surcharge of <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.rideSurchargeAmount)}</span> applies for prime locations.
                                                                </Typography>
                                                            )}
                                                             <Typography className=" text-sm text-gray-700">
                                                                • If the driver’s start or end point is under 2 km, no charge is added; charges apply only when it is above 2 km.
                                                            </Typography>
                                                            {Number(values.luggage) > 0 && (
                                                                <Typography className=" text-sm text-gray-700">
                                                                    • Only {values.luggage} Additional luggage is allowed; extra luggage may incur additional charges.
                                                                </Typography>
                                                            )}
                                                        </div>
                                                        <div className="border border-gray-300 bg-yellow-600 rounded-xl p-2">
                                                            <Typography
                                                                className="text-center text-sm text-gray-700"
                                                            >
                                                                {BOOKING_TERMS_AND_CONDITIONS}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                )}
                                                {(values.serviceType == 'RIDES' || values.serviceType == 'AUTO') && quoteDetails &&(
                                                    <div className="mb-5 space-y-4 shadow-md shadow-gray-700 bg-white rounded-xl p-4">
                                                        <Typography className="font-roboto-medium text-lg text-gray-900">
                                                            Things to Know Before You Confirm:
                                                        </Typography>
                                                     <div className="border border-gray-300 bg-yellow-600 rounded-xl p-2">
                                                            <Typography
                                                                className="text-center text-sm text-gray-700"
                                                            >
                                                                
                                                                
                                                                
                                                                {BOOKING_TERMS_AND_CONDITIONS_FOR_RIDES}
                                                            </Typography>
                                                        </div>
                                                        </div>
                                                )}

                                                 {values.serviceType == 'RENTAL' && quoteDetails && (
                                                    <div className="mb-5 space-y-4 shadow-md shadow-gray-700 bg-white rounded-xl p-4">
                                                        <Typography className="font-medium text-lg text-gray-900">
                                                            Things to Know Before You Confirm:
                                                        </Typography>
                                                        <div className="space-y-2">
                                                            <Typography className=" text-sm text-gray-700">
                                                                • Toll, parking, permit charges, and state taxes are excluded.
                                                            </Typography>
                                                            <Typography className=" text-sm text-gray-700">
                                                                • For every extra kilometer <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.extraKmPrice || '')}</span> will be charged.  
                                                            </Typography>
                                                               <Typography className="text-sm text-gray-700">
                                                                The first additional <span className="font-bold text-black">
                                                                                {quoteDetails.expectedPackageDetails?.freeExtraMinutes}</span> minutes over customer estimated trip time are free. After that, customer will be charged <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.fareBreakdown?.extraHours?.rate || '')}</span> per minute.
                                                            </Typography>
                                                            <Typography className=" text-sm text-gray-700">
                                                                • A Driver starting  Points <span className="font-bold text-black">{Number(quoteDetails.amount?.driverWithin).toFixed(2)|| '2'}</span> Kms.
                                                            </Typography>
                                                            {quoteDetails.amount?.driverCharge > 0 && (
                                                            <Typography className=" text-sm text-gray-700">
                                                                • Driver Night Stay charge <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.driverCharge || '0')}</span>.
                                                            </Typography>
                                                            )}
                                                            {quoteDetails.amount?.gst_percentage > 0 && (
                                                             <Typography className="text-sm text-gray-700">
                                                                • The estimated price includes  <span className="font-bold text-black">{quoteDetails.amount?.gst_percentage|| '0'}%</span> tax.
                                                            </Typography>
                                                            )}
                                                            {quoteDetails.amount?.extraNightCharge > 0 && (
                                                             <Typography className="text-sm text-gray-700">
                                                                • Night Charge of <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.extraNightCharge)}</span> applies if the trip extends past{' '}.
                                                            </Typography>
                                                            )}
                                                            {Number(values.luggage) > 0 && (
                                                                <Typography className=" text-sm text-gray-700">
                                                                    • Only {values.luggage} Additional luggage is allowed; extra luggage may incur additional charges.
                                                            </Typography>
                                                            )}
                                                            {quoteDetails.amount?.rideSurchargeAmount > 0 && (
                                                                <Typography className=" text-sm text-gray-700">
                                                                    • A surcharge of <span className="font-bold text-black">₹ {Math.round(quoteDetails.amount?.rideSurchargeAmount)}</span> applies for prime locations.
                                                                </Typography>
                                                            )}
                                                             <Typography className=" text-sm text-gray-700">
                                                                • If the driver’s start or end point is under 2 km, no charge is added; charges apply only when it is above 2 km.
                                                            </Typography>
                                                        </div>
                                                        <div className="border border-gray-300 bg-yellow-600 rounded-xl p-2">
                                                            <Typography
                                                                className=" text-center text-sm text-gray-700"
                                                            >
                                                                {BOOKING_TERMS_AND_CONDITIONS}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* <div>Form Errors (Debug):</div><div>{JSON.stringify(errors, null, 2)}</div> */}

                                                {(values?.serviceType=="RENTAL" && values.packageTypeSelected == 'Outstation') &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteOutstationDetails(values)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }
                                                 {(values?.serviceType=="DRIVER" && values.packageTypeSelected == 'Outstation') &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteOutstationDetails(values)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }
                                                 {values.serviceType == 'RENTAL_DROP_TAXI' &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteOutstationDetails(values)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }

                                                {values.serviceType == 'RIDES' &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteRides(values, setFieldValue)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }

                                                {values.serviceType == 'RENTAL_HOURLY_PACKAGE' &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteRides(values, setFieldValue)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }
                                                {values.serviceType == 'DRIVER' && values.packageTypeSelected == 'Local' &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteRides(values, setFieldValue)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }
                                                 {values.serviceType == 'AUTO' &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteRides(values, setFieldValue)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }
                                                {values.serviceType == 'PARCEL' &&
                                                    <Button fullWidth className='my-6 mx-2' disabled={!estimationReady} onClick={() => getQuoteParcel(values, setFieldValue)}>
                                                        Check Estimated Price
                                                    </Button>
                                                }
                                                {quoteMeta?.quoteRef && (
                                                    <div className="mt-3 p-3 rounded-xl border border-gray-200 bg-white">
                                                        <Typography className="text-sm text-gray-800">
                                                            Quote Ref: <span className="font-semibold">{quoteMeta.quoteRef}</span>
                                                        </Typography>
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && quoteMeta?.adminDiscount?.status && (
                                                            <Typography className="text-sm text-gray-800 mt-1">
                                                                Admin Discount Status: <span className="font-semibold">{quoteMeta.adminDiscount.status}</span>
                                                            </Typography>
                                                        )}
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && quoteMeta?.adminDiscount?.discountType && (
                                                            <Typography className="text-sm text-gray-800 mt-1">
                                                                Admin Discount Type: <span className="font-semibold">{quoteMeta.adminDiscount.discountType}</span>
                                                            </Typography>
                                                        )}
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && quoteMeta?.adminDiscount?.discountValue !== undefined && quoteMeta?.adminDiscount?.discountValue !== null && (
                                                            <Typography className="text-sm text-gray-800 mt-1">
                                                                Admin Discount Value: <span className="font-semibold">{quoteMeta.adminDiscount.discountValue}</span>
                                                            </Typography>
                                                        )}
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && quoteMeta?.adminDiscount?.discountAmount !== undefined && quoteMeta?.adminDiscount?.discountAmount !== null && (
                                                            <Typography className="text-sm text-gray-800 mt-1">
                                                                Admin Discount Amount: <span className="font-semibold">₹ {Math.round(Number(quoteMeta.adminDiscount.discountAmount || 0))}</span>
                                                            </Typography>
                                                        )}
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW &&
                                                            (quoteDetails?.adminDiscount?.requiresApproval === true || quoteMeta?.adminDiscount?.requiresApproval === true) &&
                                                            String(quoteMeta?.adminDiscount?.status || quoteDetails?.adminDiscount?.status || "").toUpperCase() === "PENDING" && (
                                                            <Typography className="text-sm text-yellow-800 mt-1">
                                                                Awaiting SUPER_USER approval.
                                                            </Typography>
                                                        )}
                                                        {/* {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isSuperUser && quoteMeta?.adminDiscount?.status === 'PENDING' && (
                                                            <div className="mt-2 flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    color="green"
                                                                    onClick={() => handleAdminDiscountDecision('approve')}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    color="red"
                                                                    onClick={() => handleAdminDiscountDecision('reject')}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        )} */}
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && !isAdminDiscountEffective(quoteMeta?.adminDiscount?.status) && quoteMeta?.adminDiscount && (
                                                            <Typography className="text-xs text-gray-600 mt-1">
                                                                Pending/rejected admin discount is not treated as effective in final amount.
                                                            </Typography>
                                                        )}
                                                    </div>
                                                )}
                                                {(status?.submit || errors?.submit) && (
                                                    <div className="mt-3 p-3 rounded-xl border border-red-200 bg-red-50">
                                                        <Typography className="text-sm text-red-700">
                                                            {status?.submit || errors?.submit}
                                                        </Typography>
                                                    </div>
                                                )}
                                                {showContinueHint && continueHint && (
                                                    <div className="mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
                                                        <Typography className="text-sm text-amber-800">
                                                            {continueHint}
                                                        </Typography>
                                                    </div>
                                                )}
                                                

                                                {bookingStage === 0 && (values.serviceType === 'DRIVER' || values.serviceType === 'CAR_WASH') && <Button
                                                    fullWidth
                                                    color="blue"
                                                    onClick={() => {
                                                        setFieldValue("submitType", "default");
                                                        handleSubmit();
                                                    }}
                                                    disabled={!continueReady || driverContinueDisabled}
                                                    className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                                                >
                                                    Continue
                                                </Button>}
                                                {(values.serviceType == 'RIDES') &&
                                                    <Button
                                                        fullWidth
                                                        color="blue"
                                                        onClick={() => {
                                                            setFieldValue("submitType", "rides");
                                                            handleSubmit();
                                                        }}
                                                        disabled={!continueReady || ridesContinueDisabled}
                                                        className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                                                    >
                                                        Continue
                                                    </Button>
                                                }
                                                {(values.serviceType == 'AUTO') &&
                                                    <Button
                                                        fullWidth
                                                        color="blue"
                                                        onClick={() => {
                                                            setFieldValue("submitType", "auto");
                                                            handleSubmit();
                                                        }}
                                                        disabled={!continueReady || autoContinueDisabled}
                                                        className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                                                    >
                                                        Continue
                                                    </Button>
                                                }
                                                {(values.serviceType == 'PARCEL') &&
                                                    <Button
                                                        fullWidth
                                                        color="blue"
                                                        onClick={() => {
                                                            setFieldValue("submitType", "parcel");
                                                            handleSubmit();
                                                        }}
                                                        disabled={!continueReady || parcelContinueDisabled}
                                                        className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                                                    >
                                                        Continue
                                                    </Button>
                                                }
                                                <div className='p-3'>
                                                    {values.serviceType == 'RENTAL' &&
                                                        <Button
                                                            fullWidth
                                                            color="blue"
                                                            onClick={() => {
                                                                setFieldValue("submitType", "rental");
                                                                handleSubmit();
                                                            }}
                                                            disabled={!continueReady || rentalContinueDisabled}
                                                            className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                                                        >
                                                            Continue
                                                        </Button>
                                                    }
                                                    {values.serviceType == 'RENTAL_HOURLY_PACKAGE' &&
                                                        <Button
                                                            fullWidth
                                                            color="blue"
                                                            onClick={() => {
                                                                setFieldValue("submitType", "rental");
                                                                handleSubmit();
                                                            }}
                                                            disabled={!continueReady || hourlyContinueDisabled}
                                                            className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                                                        >
                                                            Continue
                                                        </Button>
                                                    }
                                                    {values.serviceType == 'RENTAL_DROP_TAXI' &&
                                                        <Button
                                                            fullWidth
                                                            color="blue"
                                                            onClick={() => {
                                                                setFieldValue("submitType", "rental");
                                                                handleSubmit();
                                                            }}
                                                            disabled={!continueReady || dropTaxiContinueDisabled}
                                                            className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                                                        >
                                                            Continue
                                                        </Button>
                                                    }
                                                </div>
                                           </Form>
                                                    );
                                                }}
                                            </Formik>
                                        }
                                    {bookingStage === 2 && bookingData && (
                                        <SearchDrivers bookingData={bookingData} onNext={() => {
                                            setBookingStage(0);
                                            setBookingData(null);
                                            setIsOpen(false);
                                        }} />
                                    )}
                                </>}
                                {bookingView && <>
                                    <BookingItem bookingData={bookingData} setIsOpen={() => setIsOpen(false)} onCancel={onCancelBookingView} onAssignDriver={onAssignDriver} onEdit={onEditBooking} onConfirm={onConfirmBooking} />
                                </>}
                                {editBookingView &&
                                    <EditBooking bookingData={bookingData} setIsOpen={() => setIsOpen(false)} editCancel={onEditBackPress} />
                                }
                            </div>
                        </div>
                    </div>
                )}
              
                <DistanceExceedModal isVisible={dropTaxiDistanceExceedModal} onClose={() => { setDropTaxiDistanceExceedModal(false); formikActions.setFieldValue?.('dropAddress', ''); formikActions.setFieldValue?.('pickupAddress', '');}}title="Going a bit far?" content={dropTaxiModalContent}/>
                <DistanceExceedModal isVisible={distanceExceedModal} onClose={() => { setDistanceExceedModal(false); formikActions.setFieldValue?.('dropAddress', ''); formikActions.setFieldValue?.('pickupAddress', '');}} title="Going a bit far?" content="Rides above 15 km are allowed only through DropTaxi or Outstation service." />
                <DistanceExceedModal isVisible={outstationDistanceModal} onClose={() => { setOutstationDistanceModal(false); formikActions.setFieldValue?.('dropAddress', ''); formikActions.setFieldValue?.('pickupAddress', ''); }} title="Going a bit far?" content="Try our Local Ride, it’s faster and more affordable for short" />
                <DistanceExceedModal isVisible={cityLimitExceedModal} onClose={() => { setCityLimitExceedModal(false); formikActions.setFieldValue?.('dropAddress', ''); formikActions.setFieldValue?.('pickupAddress', ''); }} title="Oops!" content="We currently serve only Vellore, Kanchipuram, Tiruvannamalai. Try another pickup location nearby." />
                
                {zoneErrorModal.show && (
                  <DistanceExceedModal 
                    isVisible={zoneErrorModal.show} 
                    onClose={() => { 
                      setZoneErrorModal({ show: false }); 
                      formikActions.setFieldValue?.('pickupAddress', ''); 
                    }} 
                    title={zoneErrorModal.title} 
                    content={zoneErrorModal.text}
                  />
                )}
            </div>
        </div>
    );
};

export default Booking; 
