import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Button, Card, Typography, CircularProgress, Spinner } from "@material-tailwind/react";
import { Formik, Field, ErrorMessage } from 'formik';
import { Utils } from '../../utils/utils';
import * as Yup from 'yup';
import moment from 'moment';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, BOOKING_FEATURES } from '@/utils/constants';
import SearchableDropdown from '@/components/SearchableDropdown';
import DistanceExceedModal from '@/components/DistanceExceedModal';
import { buildAdminDiscountPayload, isAdminDiscountEffective } from './utils/adminDiscount';
import { useAdminDiscountNotifier } from './hooks/useAdminDiscountNotifier';

const getSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') return suggestion;
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.fullText || suggestion.title || suggestion.subtitle || '';
};

const getSuggestionTitle = (suggestion) => {
    if (typeof suggestion === 'string') {
        const [firstPart] = suggestion.split(',');
        return (firstPart || suggestion).trim();
    }
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.title || suggestion.fullText || '';
};

const normalizeQuoteRef = (value) => {
    const parsed = String(value ?? '').trim();
    if (!parsed) return '';
    const lowered = parsed.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined') return '';
    return parsed;
};

const getAdminDiscountUpdatedTs = (item = {}) =>
    new Date(item?.updatedAt || item?.updated_at || item?.approvedAt || item?.approved_at || item?.createdAt || item?.created_at || 0).getTime();

const EditBooking = (props) => {
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState(null);
    const [packageTypeSelectedData, setPackageTypeSelectedData] = useState([]);
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [mapCenter, setMapCenter] = useState({ lat: 12.906374, lng: 80.226452 });
    const [mapZoom, setMapZoom] = useState(10);
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropLocation, setDropLocation] = useState(null);
    const mapRef = useRef(null);
    const [quoteDetails, setQuoteDetails] = useState(null);
    const [quoteMeta, setQuoteMeta] = useState(null);
    const [customerData, setCustomerData] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerNumber, setCustomerNumber] = useState('');
    const [serviceAreas, setServiceAreas] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [currentServiceType, setCurrentServiceType] = useState('');
    const [discountDetails, setDiscountDetails] = useState(null);
    const [driverSuggestions, setDriverSuggestions] = useState([]);
    const [distanceExceedModal, setDistanceExceedModal] = useState(false);
    const [cityLimitExceedModal, setCityLimitExceedModal] = useState(false);
    const [zoneErrorModal, setZoneErrorModal] = useState({ show: false, text: '', title: '' });
    const [dropTaxiDistanceExceedModal, setDropTaxiDistanceExceedModal] = useState(false);
    const [driverPickUpLocation, setDriverPickUpLocation] = useState(null);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [serviceAreaLoading, setServiceAreaLoading] = useState(false);
    const [packagesLoading, setPackagesLoading] = useState(false);
    const [premiumServicesMap, setPremiumServicesMap] = useState({});
    const [driverEndLocation, setDriverEndLocation] = useState(null);
    const [driverEndAddress, setDriverEndAddress] = useState('');
    const [driverEndSuggestions, setDriverEndSuggestions] = useState([]);
    const [quotationLogs, setQuotationLogs] = useState([]);
    const approvedStatusSyncTimerRef = useRef(null);
    const approvedHistoryRefreshKeyRef = useRef('');
    const adminStatusSyncInFlightRef = useRef(false);
    const lastAdminStatusSyncAtRef = useRef(0);
    const adminStatusSyncKeyRef = useRef('');
    const adminStatusAppliedTsRef = useRef(0);

    const quoteEstimatedPrice = Number(quoteDetails?.value?.estimatedPrice || quoteDetails?.amount?.estimatedPrice || 0);
    const systemDiscountAmount = Number(quoteDetails?.discount?.amount || 0);
    const systemDiscountPercentage = Number(quoteDetails?.discount?.percentage || 0);
    const totalEstimatedFareAfterSystemDiscount =
        systemDiscountAmount > 0
            ? quoteEstimatedPrice - systemDiscountAmount
            : quoteEstimatedPrice - (quoteEstimatedPrice * (systemDiscountPercentage / 100));
    const adminDiscountType = String(quoteDetails?.adminDiscount?.discountType || '').toUpperCase();
    const isQuoteAdminDiscountEffective = isAdminDiscountEffective(String(quoteDetails?.adminDiscount?.status || '').toUpperCase());
    const adminDiscountAmountOnTotal =
        adminDiscountType === 'PERCENTAGE'
            ? totalEstimatedFareAfterSystemDiscount * (Number(quoteDetails?.adminDiscount?.discountValue || 0) / 100)
            : Number(quoteDetails?.adminDiscount?.discountAmount || 0);
    const finalEstimatedFareAfterAdminDiscount = totalEstimatedFareAfterSystemDiscount - adminDiscountAmountOnTotal;
    const adminDiscountValueDisplay =
        adminDiscountType === 'PERCENTAGE'
            ? `${Math.round(Number(quoteDetails?.adminDiscount?.discountValue || 0))} %`
            : `₹ ${Math.round(Number(quoteDetails?.adminDiscount?.discountValue || 0))}`;
    const isQuoteAdminDiscountPending = String(quoteDetails?.adminDiscount?.status || '').toUpperCase() === 'PENDING';
    const existingAdminDiscount =
        bookingData?.currentAdminDiscount ||
        bookingData?.paymentDetails?.adminDiscount ||
        bookingData?.adminDiscount ||
        null;
    const existingAdminDiscountStatus = String(existingAdminDiscount?.status || '').toUpperCase();
    const isExistingAdminDiscountLocked = isAdminDiscountEffective(existingAdminDiscountStatus);

    const syncAdminDiscountStatus = useCallback(async (quoteRefValue) => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const quoteRef = normalizeQuoteRef(quoteRefValue || quoteMeta?.quoteRef || quoteDetails?.quoteRef || bookingData?.quoteRef || '');
        if (!quoteRef) return;

        const now = Date.now();
        if (adminStatusSyncInFlightRef.current) return;
        if (now - lastAdminStatusSyncAtRef.current < 500) return;
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
            if (latestTs) adminStatusAppliedTsRef.current = latestTs;

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
            console.error('Failed to sync admin discount status in edit booking:', error);
        } finally {
            adminStatusSyncInFlightRef.current = false;
        }
    }, [quoteMeta?.quoteRef]);

    useAdminDiscountNotifier({
        quoteMeta,
        setQuoteMeta,
        setQuoteDetails,
        enabled: BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW,
        pendingToastTitle: 'Admin Discount Request Sent',
        pendingToastTextBuilder: ({ quoteRef }) => `Quote: ${quoteRef}. Request sent for SUPER_USER approval.`,
        onApprovedStatus: ({ quoteRef, status }) => {
            const normalizedQuoteRef = normalizeQuoteRef(quoteRef || '');
            if (!normalizedQuoteRef) return;
            const normalizedStatus = String(status || '').toUpperCase();

            // Optimistic update for immediate fare recalculation in edit screen.
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
    });

    useEffect(() => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const quoteRef = normalizeQuoteRef(quoteMeta?.quoteRef || quoteDetails?.quoteRef || bookingData?.quoteRef || '');
        if (!quoteRef) return;

        const currentStatus = String(quoteMeta?.adminDiscount?.status || quoteDetails?.adminDiscount?.status || '').toUpperCase();
        if (currentStatus && currentStatus !== 'PENDING') return;

        syncAdminDiscountStatus(quoteRef);
    }, [
        bookingData?.quoteRef,
        quoteDetails?.quoteRef,
        quoteDetails?.adminDiscount?.status,
        quoteMeta?.quoteRef,
        quoteMeta?.adminDiscount?.status,
        syncAdminDiscountStatus,
    ]);

    useEffect(() => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const onFocusSync = () => {
            const quoteRef = normalizeQuoteRef(quoteMeta?.quoteRef || quoteDetails?.quoteRef || bookingData?.quoteRef || '');
            const currentStatus = String(quoteMeta?.adminDiscount?.status || quoteDetails?.adminDiscount?.status || '').toUpperCase();
            if (currentStatus && currentStatus !== 'PENDING') return;
            if (quoteRef) syncAdminDiscountStatus(quoteRef);
        };
        window.addEventListener('focus', onFocusSync);
        return () => window.removeEventListener('focus', onFocusSync);
    }, [
        bookingData?.quoteRef,
        quoteDetails?.quoteRef,
        quoteDetails?.adminDiscount?.status,
        quoteMeta?.quoteRef,
        quoteMeta?.adminDiscount?.status,
        syncAdminDiscountStatus,
    ]);

    useEffect(() => () => {
        if (approvedStatusSyncTimerRef.current) {
            clearTimeout(approvedStatusSyncTimerRef.current);
        }
    }, []);

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || "{}");
    const loggedInUserId = loggedInUser.id || 0;

    const EDIT_BOOKING_SCHEMA = Yup.object().shape({
        sourceType: Yup.string().required('Source Type is required'),
    });

    const addQuotationLog = (values, quoteDetails) => {
        const newLog = {
            userId: loggedInUserId,
            bookingId: bookingData?.id || 0,
            pickupAddress: {
                name: values.pickupAddress || '',
                lat: values.pickupLocation?.lat || 0,
                lng: values.pickupLocation?.lng || 0,
            },
            dropAddress: values.dropAddress ? {
                name: values.dropAddress,
                lat: values.dropLocation?.lat || 0,
                lng: values.dropLocation?.lng || 0,
            } : {},
            amount: quoteDetails?.amount?.estimatedPrice === "0" || quoteDetails?.amount?.estimatedPrice === 0
                ? (quoteDetails?.amount?.packageDetails?.price || 0)
                : (quoteDetails?.amount?.estimatedPrice || 0),
            discount: quoteDetails?.discount?.percentage || 0,
            discountAmount: (quoteDetails.amount?.estimatedPrice) - (quoteDetails.amount?.estimatedPrice * quoteDetails.discount?.percentage / 100) || 0,
            ...((values?.serviceType !== 'RIDES') && {
                startDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString() || '',
            }),
            ...((values?.serviceType !== 'RENTAL_DROP_TAXI' && values?.serviceType !== 'RIDES' && values?.serviceType !== 'AUTO' && values?.packageTypeSelected !== 'Local' && (values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation' && values.tripType === 'Round Trip') && !(values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation' && values.tripType === 'Drop Only')) &&
                { endDate: moment(`${values?.toDate} ${values?.toTime}`, "YYYY-MM-DD HH:mm:ss").toISOString() || null }
            ),
            serviceType: values?.serviceType == "RENTAL_DROP_TAXI" ? 'DROP TAXI' : values?.serviceType === "RENTAL_HOURLY_PACKAGE" ? "HOURLY PACKAGE" : values?.serviceType === "RENTAL" ? "OUTSTATION" : values?.serviceType || '',
            cabType: values?.carType || '',
        };
        setQuotationLogs((prevLogs) => [...prevLogs, newLog]);
    };

    const sendQuotationLogs = async (bookingId, userId) => {
        try {
            const updatedLogs = quotationLogs.map(log => ({
                ...log,
                bookingId: bookingId || 0,
                userId: userId || log.userId || 0,
            }));
            const response = await ApiRequestUtils.post(API_ROUTES.POST_QUOTATION_LOG, updatedLogs);
            if (response?.success) {
                console.log('Quotation logs sent successfully:', response);
                setQuotationLogs([]);
            } else {
                console.error('Failed to send quotation logs:', response?.message);
            }
        } catch (error) {
            console.error('Error sending quotation logs:', error);
        }
    };

    const fetchData = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_CUSTOMERS, {
                forSearch: true
            });
            setCustomerData(response.data);
        } catch (error) {
            console.error('Error fetching customer data:', error);
        }
    };

    const fetchGeoData = async () => {
        try {
            setServiceAreaLoading(true);
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
            const filteredAreas = response.data.filter((area) => area.type === 'Service Area');
            setServiceAreas(filteredAreas);
            if (response.premiumServices) {
                setPremiumServicesMap(response.premiumServices);
    //   console.log("Premium Services Map Loaded:", response.premiumServices);
            }
        } catch (error) {
            console.error('Error fetching GEO_MARKINGS_LIST:', error);
        } finally {
            setServiceAreaLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
        fetchGeoData();
        if (props.bookingData) {
            getBookingDetailsById(props.bookingData.id, props.bookingData.customerId);
        }
    }, [props.bookingData]);

    useEffect(() => {
        if (selectedAreaId) {
            const selectedArea = serviceAreas.find((area) => area.id === parseInt(selectedAreaId));
            const newServices = selectedArea ? selectedArea.services : [];
            setServices(newServices);
            setCurrentServiceType('');
        } else {
            setServices([]);
            setCurrentServiceType('');
        }
    }, [selectedAreaId, serviceAreas]);

    useEffect(() => {
        if (bookingData?.customerId) {
            setSelectedCustomer(bookingData.customerId);
            const customer = customerData.find(c => c.id === bookingData.customerId);
            if (customer) {
                setCustomerNumber(customer.phoneNumber || '');
            }
        }
    }, [bookingData, customerData]);

    const getBookingDetailsById = async(bookingId, customerId) =>{
        try{
            const data = await ApiRequestUtils.get(API_ROUTES.GET_CONFIRMATION_BOOKING_BY_ID + "/" + bookingId, customerId);
        if(data.success){
                setBookingData(data?.data);
                if (BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) {
                    const adminDiscountFromBooking =
                        data?.data?.currentAdminDiscount ||
                        data?.data?.paymentDetails?.adminDiscount ||
                        data?.data?.adminDiscount ||
                        null;
                    setQuoteMeta({
                        quoteRef: data?.data?.quoteRef || '',
                        adminDiscount: adminDiscountFromBooking,
                    });
                }
                // console.log("dtaaa", data?.data)
            }
        }
        catch{
                console.error('loader is not working')
            }
            finally {
            setLoading(false);
        }
    };

    const getPackageListDetails = useCallback(async (serviceType, zone) => {
        try {
            setPackagesLoading(true);
            const serviceTypeMap = {
                'RENTAL_DROP_TAXI': 'RENTAL',
                'RENTAL_HOURLY_PACKAGE': 'RENTAL',
            };
            const mappedServiceType = serviceTypeMap[serviceType] || serviceType;

            // AUTO bookings don't use package-based pricing; skip without logging an error
            if (mappedServiceType === 'AUTO') {
                setPackageTypeSelectedData([]);
                return;
            }

            if (!['DRIVER', 'RENTAL', 'RIDES'].includes(mappedServiceType)) {
                console.error('Invalid serviceType:', mappedServiceType);
                setPackageTypeSelectedData([]);
                return;
            }

            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ZONE_PACKAGE_LIST, {
                serviceType: mappedServiceType,
                zone: zone || '',
            });

            if (data?.success && Array.isArray(data?.data)) {
                setPackageTypeSelectedData(data?.data);
            } else {
                console.error('Failed to fetch package list or data is not an array:', data?.message || 'No message provided');
                setPackageTypeSelectedData([]);
            }
        } catch (error) {
            console.error('Error fetching package list:', error.message || error);
            setPackageTypeSelectedData([]);
        } finally {
            setPackagesLoading(false);
        }
    }, []);

const getQuoteOutstationDetails = async (values) => {
    const zoneData = await zoneCheckUpFun(values);
    let actualZone = '';
    if (zoneData.success && zoneData.serviceArea) {
        actualZone = zoneData.serviceArea.name;
    } else {
        console.error('Error getting zone for outstation');
        actualZone = serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';
    }

    const serviceTypeMap = {
        'RENTAL_DROP_TAXI': 'RENTAL',
        'RENTAL_HOURLY_PACKAGE': 'RENTAL',
    };
    const mappedServiceType = serviceTypeMap[values?.serviceType] || values?.serviceType;
    const quoteData = {
        serviceType: values?.serviceType == "RENTAL_DROP_TAXI" ? 'RENTAL' : values?.serviceType || mappedServiceType,
        customerId: values?.customerId?.id,
        packageType: 'Outstation',
        fromDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
            // carType: values?.carType != "Sedan" ? values?.carType.toUpperCase() : values?.carType,
        carType: values?.serviceType === 'DRIVER' ? 'Mini' : values?.carType,
        pickupLat: values?.pickupLocation?.lat ? values?.pickupLocation?.lat : bookingData?.pickupLat,
        pickupLong: values?.pickupLocation?.lng ? values?.pickupLocation?.lng : bookingData?.pickupLong,
            driverStartLat: values?.driverPickUpLocation?.lat,
            driverStartLong: values?.driverPickUpLocation?.lng,
        dropLat: values?.dropLocation?.lat ? values?.dropLocation?.lat : bookingData?.dropLat,
        dropLong: values?.dropLocation?.lng ? values?.dropLocation?.lng : bookingData?.dropLong,
        acType: values?.acType?.toUpperCase(),
        zone: actualZone,
            isPremiumService : values?.isPremiumService ? true : false
    };
    if (values?.serviceType !== 'RENTAL_HOURLY_PACKAGE' && values?.serviceType !== 'AUTO') {
        quoteData.bookingType = values?.tripType ? values.tripType.toUpperCase() : '';
    }
    const isDriverOutstation = values?.serviceType === 'DRIVER' && values?.packageTypeSelected === 'Outstation';
        const isRoundTripCustom =
            isDriverOutstation &&
        values?.tripType === 'Round Trip' &&
        values?.packageSelected === 'custom_date';
    if (!isDriverOutstation || isRoundTripCustom) {
        quoteData.toDate = moment(`${values?.toDate} ${values?.toTime}`, "YYYY-MM-DD HH:mm:ss").toISOString();
    }
        if (values?.serviceType === 'DRIVER' && values?.packageTypeSelected === 'Outstation' && values?.packageSelected && values?.packageSelected !== 'custom_date') {
        quoteData.packageType = 'Outstation';
        quoteData.packageId = Number(values.packageSelected);
        quoteData.period = Number(values.packageSelected);
    }
    if(values?.serviceType !== 'DRIVER')
        {
            quoteData.driverStartLat= values.driverPickUpLocation?.lat,
                quoteData.driverStartLong=values.driverPickUpLocation?.lng,
                    quoteData.driverStartAddress= {
                name: values.driverPickUpAddress,
            }
        }        
    if (values?.serviceType === 'RENTAL_DROP_TAXI') {
        quoteData.serviceFor = 'RENTAL';
        }
        else if (values?.serviceType === 'RENTAL') {
        quoteData.serviceFor = 'RENTAL';
        }
        else if (values?.serviceType === 'DRIVER') {
        quoteData.serviceFor = 'DRIVER';
    }
    const adminDiscountPayload = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
        ? (
            isExistingAdminDiscountLocked
                ? buildAdminDiscountPayload({
                    adminDiscountType: existingAdminDiscount?.discountType,
                    adminDiscountValue: existingAdminDiscount?.discountValue,
                    adminDiscountRemarks: existingAdminDiscount?.remarks,
                })
                : buildAdminDiscountPayload(values)
        )
        : null;
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
        addQuotationLog(values, data?.data);
    }
};
    const initialValues = {
        serviceType: bookingData?.serviceType || '',
        packageTypeSelected: bookingData?.packageType || '',
        tripType: bookingData?.bookingType == "DROP ONLY" ? "Drop Only" : "Round Trip" || '',
        transmissionType : bookingData?.transmissionType || '',
        packageSelected: bookingData?.packageId ? bookingData?.packageId : '',
        customerId: bookingData?.customerId ? bookingData?.customerId?.id : '',
        carType: bookingData?.carType ? bookingData?.carType : '',
        pickupAddress: bookingData?.pickupAddress?.name || '',
        dropAddress: bookingData?.dropAddress?.name || '',
        rideDate: bookingData?.fromDate ? moment(bookingData.fromDate).format('YYYY-MM-DD') : '',
        rideTime: bookingData?.fromDate ? moment(bookingData.fromDate).format('HH:mm') : '',
        toDate: bookingData?.toDate ? moment(bookingData.toDate).format('YYYY-MM-DD') : '',
        toTime: bookingData?.toDate ? moment(bookingData.toDate).format('HH:mm') : '',
        acType: bookingData?.acType?.toUpperCase(),
        zone: bookingData?.zone || '',
        driverPickUpAddress: bookingData?.driverStartAddress?.name || '',
        driverPickUpLocation: bookingData?.driverStartLat && bookingData?.driverStartLong ? {
            lat: bookingData.driverStartLat,
            lng: bookingData.driverStartLong
        } : null,
        driverEndAddress: bookingData?.driverEndAddress?.name || '',
        driverEndLocation: bookingData?.driverEndLat && bookingData?.driverEndLong
            ? { lat: bookingData.driverEndLat, lng: bookingData.driverEndLong }
            : null,
        luggage: '',
        seaterCapacity: '',
        sourceType: bookingData?.sourceType || '',
        ...((bookingData?.sourceType === "Others" || bookingData?.sourceType === "Offline Ads") && {
            otherSourceType: bookingData?.otherSourceType?.trim() || null
        }),
        isPremiumService : bookingData?.isPremiumService || false,
        adminDiscountType: existingAdminDiscount?.discountType || '',
        adminDiscountValue:
            existingAdminDiscount?.discountValue !== undefined &&
            existingAdminDiscount?.discountValue !== null
                ? String(existingAdminDiscount.discountValue)
                : '',
        adminDiscountRemarks: existingAdminDiscount?.remarks || '',
    };



    const getQuoteRides = async (values, setFieldValue) => {
            let checkDistance = true;
            let checkCityLimit = true;

            if (values.serviceType === 'RIDES' || values.serviceType === 'AUTO') {
                checkDistance = await calculateDistance(values);
                checkCityLimit = await calcluateCityLimit(values);
            } else if (values.serviceType === 'RENTAL_DROP_TAXI') {
                checkDistance = await calculateDistance(values);
            }

            if (!checkDistance) {
                if (values.serviceType === 'RIDES' || values.serviceType === 'AUTO') {
                    setDistanceExceedModal(true);
                } else if (values.serviceType === 'RENTAL_DROP_TAXI') {
                    setDropTaxiDistanceExceedModal(true);
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
                'RENTAL_DROP_TAXI': 'RENTAL',
                'RENTAL_HOURLY_PACKAGE': 'RENTAL',
            };
            const mappedServiceType = serviceTypeMap[values.serviceType] || values.serviceType;

            let actualZone = serviceAreas.find(area => area.id === parseInt(selectedAreaId))?.name || '';

            const zoneData = await zoneCheckUpFun(values);
            if (!zoneData.success || !zoneData.serviceArea) {
                setZoneErrorModal({ show: true, text: zoneData.error || 'Service not available in this area.', title: zoneData.title || 'Oops!' });
                setFieldValue?.('pickupAddress', '');
            setIsButtonDisabled(false);
                return;
            }

            actualZone = zoneData.serviceArea.name;

            const quoteDate = {
                serviceType: values.serviceType === 'RENTAL_HOURLY_PACKAGE' ? 'RENTAL' : values.serviceType || mappedServiceType,
                customerId: values?.customerId?.id,
                serviceFor: values.serviceType === 'RENTAL_HOURLY_PACKAGE' ? 'RENTAL_HOURLY_PACKAGE' : values.serviceType,
                packageType: 'Local',
                fromDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
                carType: values.serviceType === 'DRIVER' ? 'Mini' : values.carType || '',
                period: values.serviceType === 'RENTAL'|| values.serviceType === 'DRIVER' ? packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected))?.period || '' : '',
                pickupLat: values?.pickupLocation?.lat ? values?.pickupLocation?.lat : bookingData?.pickupLat,
                pickupLong: values?.pickupLocation?.lng ? values?.pickupLocation?.lng : bookingData?.pickupLong,
                dropLat: values?.dropLocation?.lat ? values?.dropLocation?.lat : bookingData?.dropLat,
                dropLong: values?.dropLocation?.lng ? values?.dropLocation?.lng : bookingData?.dropLong,
                zone: actualZone,
            // driverLat: values?.driverPickUpLocation?.lat,
            // driverLong: values?.driverPickUpLocation?.lng,
                driverStartLat: values.driverPickUpLocation?.lat,
                driverStartLong: values.driverPickUpLocation?.lng,
                driverStartAddress: {
                    name: values.driverPickUpAddress,
                },
            isPremiumService : values?.isPremiumService ? true : false

            };
            const isHourlyPackageSelection =
                values?.serviceType === 'RENTAL_HOURLY_PACKAGE' ||
                (values?.serviceType === 'RENTAL' && values?.packageTypeSelected == 'Local');

            if (!isHourlyPackageSelection && values?.serviceType !== 'AUTO' && values?.serviceType !== 'RIDES') {
                quoteDate.bookingType = values?.tripType ? values.tripType.toUpperCase() : '';
            }
            const adminDiscountPayload = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
                ? (
                    isExistingAdminDiscountLocked
                        ? buildAdminDiscountPayload({
                            adminDiscountType: existingAdminDiscount?.discountType,
                            adminDiscountValue: existingAdminDiscount?.discountValue,
                            adminDiscountRemarks: existingAdminDiscount?.remarks,
                        })
                        : buildAdminDiscountPayload(values)
                )
                : null;
            if (adminDiscountPayload) {
                quoteDate.adminDiscount = adminDiscountPayload;
            }
            const data = await ApiRequestUtils.post(API_ROUTES.GET_QUOTE_OUTSTATION, quoteDate);
            if (data?.success) {
                setQuoteDetails(data?.data);
                setDiscountDetails(data?.data);
                setQuoteMeta({
                    quoteRef: data?.data?.quoteRef || '',
                    adminDiscount: data?.data?.adminDiscount || null,
                });
                addQuotationLog(values, data?.data);
            }
    };

    useEffect(() => {
        if (!selectedAreaId || !currentServiceType) {
            setPackageTypeSelectedData([]);
            return;
        }
        const selectedArea = serviceAreas.find((area) => area.id === parseInt(selectedAreaId));
        const zone = selectedArea ? selectedArea.name : '';
        getPackageListDetails(currentServiceType, zone);
    }, [selectedAreaId, currentServiceType, getPackageListDetails, serviceAreas]);

    useEffect(() => {
        if (bookingData && serviceAreas.length > 0) {
            setCurrentServiceType(bookingData.serviceType);
            // Set initial service area if available from booking data
            const bookingZone = bookingData.zone;
            if (bookingZone) {
                const area = serviceAreas.find(area => area.name === bookingZone);
                if (area) {
                    setSelectedAreaId(area.id);
                }
            }
            // Set driver pickup location if available
            if (bookingData.driverStartLat && bookingData.driverStartLong) {
                setDriverPickUpLocation({
                    lat: bookingData.driverStartLat,
                    lng: bookingData.driverStartLong
                });
            }
            if (bookingData.driverEndLat && bookingData.driverEndLong) {
                setDriverEndLocation({
                    lat: bookingData.driverEndLat,
                    lng: bookingData.driverEndLong
                });
                setDriverEndAddress(bookingData.driverEndAddress?.name || '');
            }
        }
    }, [bookingData, serviceAreas]);

    const zoneCheckUpFun = async (val) => {
        const serviceTypeMap = {
            'RIDES': 'RIDES',
            'RENTAL_DROP_TAXI': 'RENTAL',
            'RENTAL_HOURLY_PACKAGE': 'RENTAL',
        };
        const mappedServiceType = serviceTypeMap[val.serviceType] || val.serviceType;

        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ZONE_PACKAGE_LIST, {
            serviceType: mappedServiceType,
            lat: val.pickupLocation?.lat || bookingData?.pickupLat,
            long: val.pickupLocation?.lng || bookingData?.pickupLong,
        });
        return data;
    };

    const calculateDistance = async (values) => {
        const calculateDistance = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DISTANCE_CHECKING, {
            pickupLat: values.pickupLocation?.lat || bookingData?.pickupLat,
            pickupLong: values.pickupLocation?.lng || bookingData?.pickupLong,
            dropLat: values?.dropLocation?.lat || bookingData?.dropLat,
            dropLong: values?.dropLocation?.lng || bookingData?.dropLong,
            serviceType: values.serviceType === 'RENTAL_DROP_TAXI' ? "RENTAL" : values.serviceType,
        });

        if (calculateDistance?.success) {
            if (values.serviceType === "RIDES") {
                // Backend returns showAlert flag for RIDES
                return calculateDistance?.data?.showAlert;
            } else if (values.serviceType === "AUTO") {
                // Backend returns kilometer for AUTO; apply 15 km limit
                return calculateDistance?.data?.showAlert;
            } else if (values.serviceType === 'RENTAL_DROP_TAXI') {
                const distance = calculateDistance?.data?.estimatedDistance || 0;
                return distance <= 300;
            }
        }
        // For other service types (like RENTAL_HOURLY_PACKAGE), return true to skip distance check
        return true;
    };

    const calcluateCityLimit = async (values) => {
        let calculateDistance = await ApiRequestUtils.getWithQueryParam(API_ROUTES.CITY_LIMIT_CHECKING, {
            pickupLat: values.pickupLocation?.lat || bookingData?.pickupLat,
            pickupLong: values.pickupLocation?.lng || bookingData?.pickupLong,
            dropLat: values?.dropLocation?.lat || bookingData?.dropLat,
            dropLong: values?.dropLocation?.lng || bookingData?.dropLong,
        });
        if (calculateDistance?.success) {
            return calculateDistance?.cityLimit;
        }
        return false;
    };
    const searchLocations = async (query, isPickup, type) => {
        if (query.length > 2) {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
            if (data?.success && data?.data) {
                if (isPickup) {
                    setPickupSuggestions(data?.data);
                } else if (type === 'driver') {
                    setDriverSuggestions(data?.data);
                }
                else if (type === 'driverEnd') {
                    setDriverEndSuggestions(data?.data);
                }
                else {
                    setDropSuggestions(data?.data);
                }
            }
        } else {
            setPickupSuggestions([]);
            setDriverSuggestions([]);
            setDropSuggestions([]);
            setDriverEndSuggestions([]);
        }
    };

    const handleSelectLocation = async (address, isPickup, type, setFieldValue, values) => {
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_LATLONG, { address });
        if (data?.success) {
            const location = { lat: data.data.lat, lng: data.data.lng };
            if (isPickup) {
                setFieldValue("pickupAddress", address);
                setFieldValue("pickupLocation", location);
                setPickupLocation(location);
                setPickupSuggestions([]);

                // Automatic service area detection for pickup location
                if (values && values.serviceType) {
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
                        setZoneErrorModal({
                            show: true,
                            text: zoneData.error || 'Service not available in this area.',
                            title: zoneData.title || 'Oops!'
                        });
                        setFieldValue("pickupAddress", "");
                        setFieldValue("pickupLocation", null);
                        setPickupLocation(null);
                    }
                }
            }
            else if (type === 'driver') {
                setFieldValue("driverPickUpAddress", address);
                setFieldValue("driverPickUpLocation", location);
                setDriverPickUpLocation(location);
                setDriverSuggestions([]);
            }
            else if (type === 'driverEnd') {
                setFieldValue("driverEndAddress", address);
                setFieldValue("driverEndLocation", location);
                setDriverEndLocation(location);
                setDriverEndSuggestions([]);
            }
            else {
                setFieldValue("dropAddress", address);
                setFieldValue("dropLocation", location);
                setDropLocation(location);
                setDropSuggestions([]);
            }
        }
    };

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

    const onBackPressHandler = async () => {
        props.editCancel()
    };

    function convertTimeFormat(time) {
        let [hours, minutes, seconds] = time.split(':');
        hours = parseInt(hours);

        const period = hours >= 12 ? 'p.m.' : 'a.m.';
        hours = hours % 12 || 12;

        return `${hours}:${minutes} ${period}`;
    }

    // Luggage and seater capacity logic based on car type
    const useLuggageAndSeaterLogic = (carType, setFieldValue) => {
        useEffect(() => {
            if (carType === 'Mini' || carType === 'Sedan') {
                setFieldValue('luggage', 1);
                setFieldValue('seaterCapacity', '5');
            } else if (carType === 'SUV' || carType === 'MUV') {
                setFieldValue('luggage', 2);
                setFieldValue('seaterCapacity', '7');
            } else {
                setFieldValue('luggage', '');
                setFieldValue('seaterCapacity', '');
            }
        }, [carType, setFieldValue]);
    };

    const editSubmit = async (values) => {
        let data;
        let editBookingData;
        const updateQuoteRef = quoteMeta?.quoteRef || quoteDetails?.quoteRef || bookingData?.quoteRef || undefined;
        const updateAdminDiscountPayload = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
            ? (
                isExistingAdminDiscountLocked
                    ? buildAdminDiscountPayload({
                        adminDiscountType: existingAdminDiscount?.discountType,
                        adminDiscountValue: existingAdminDiscount?.discountValue,
                        adminDiscountRemarks: existingAdminDiscount?.remarks,
                    })
                    : buildAdminDiscountPayload(values)
            )
            : null;
            if (values.submitType == "default") {
                const selectedPackage = packageTypeSelectedData.find(
                    (pkg) => pkg.id === Number(values?.packageSelected)
                );
            const period = values?.serviceType === 'DRIVER' && values?.packageTypeSelected === 'Outstation'? (values?.packageSelected && values?.packageSelected !== 'custom_date' ? Number(values?.packageSelected) : ''): (values?.serviceType === 'RENTAL_HOURLY_PACKAGE' || values?.serviceType === 'DRIVER'? selectedPackage?.period || '' : '');
                const isHourlyPackageSelection =
                    values?.serviceType === 'RENTAL_HOURLY_PACKAGE' ||
                    (values?.serviceType === 'RENTAL' && values?.packageTypeSelected == 'Local');

                data = {
                    packageId: values?.packageSelected === "0" || values?.packageSelected === "custom_date" ? 0 : Number(values?.packageSelected),
                    packageType: values?.packageTypeSelected,
                    customerId: bookingData?.Customer?.id,
                    bookingId: bookingData?.id,
                    adminBooking: true,
                    serviceType: values?.serviceType,
                    ...((!isHourlyPackageSelection && values?.serviceType !== 'AUTO') && {
                        bookingType: values?.tripType?.toUpperCase() || '',
                    }),
                transmissionType : values?.transmissionType ? values?.transmissionType : bookingData?.transmissionType,
                    carType: values?.serviceType === 'DRIVER' ? 'Mini' : (values?.carType ? values?.carType : bookingData?.carType),
                    fromDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
                    pickupLat: values?.pickupLocation?.lat ? values?.pickupLocation?.lat : bookingData?.pickupLat,
                    pickupLong: values?.pickupLocation?.lng ? values?.pickupLocation?.lng : bookingData?.pickupLong,
                    pickupAddress: {
                        name: values?.pickupAddress ? values?.pickupAddress : bookingData?.pickupAddress?.name
                    },
                    driverStartLat: values.driverPickUpLocation?.lat || bookingData?.driverStartLat || null,
                    driverStartLong: values.driverPickUpLocation?.lng || bookingData?.driverStartLong || null,
                    driverStartAddress: values.driverPickUpAddress
                        ? { name: values.driverPickUpAddress }
                        : bookingData?.driverStartAddress
                            ? { name: bookingData.driverStartAddress.name }
                            : null,
               driverEndLat : values.driverEndLocation?.lat || null,
                driverEndLong : values.driverEndLocation?.lng || null,
                driverEndAddress : values.driverEndAddress ? { name: values.driverEndAddress } : null,
                    dropLat: null,
                    dropLong: null,
                    dropAddress: null,
                    toDate: null,
                    period,
                    acType: values?.acType.toUpperCase(),
                    sourceType: values?.sourceType,
                    ...((values?.sourceType === "Others" || values?.sourceType === "Offline Ads") && {
                        otherSourceType: values?.otherSourceType?.trim() || null
                    }),
                    zone: values?.zone,
                isPremiumService : values?.isPremiumService ? true : false
                };
            // console.log("DADADA", values)
                if (values.packageTypeSelected == 'Outstation' && values?.tripType?.toUpperCase() == 'ROUND TRIP') {
                    data.toDate = moment(`${values.toDate} ${values.toTime}`, "YYYY-MM-DD HH:mm:ss").toISOString();
                }
                const isLocalDropOnly = values.packageTypeSelected == 'Local' && values?.tripType?.toUpperCase() == 'DROP ONLY';
                if (!isLocalDropOnly && !isHourlyPackageSelection) {
                    data.dropLat = values?.dropLocation?.lat ? values?.dropLocation?.lat : bookingData?.dropLat
                    data.dropLong = values?.dropLocation?.lng ? values?.dropLocation?.lng : bookingData?.dropLong
                    data.dropAddress = values?.dropLocation ? { name: values?.dropAddress } : bookingData?.dropAddress ? {
                        name: values?.dropAddress ? values?.dropAddress : bookingData?.dropAddress?.name
                    } : null
                } else if (isHourlyPackageSelection) {
                    delete data.dropLat;
                    delete data.dropLong;
                    delete data.dropAddress;
                }
                if (updateAdminDiscountPayload) {
                    data.adminDiscount = updateAdminDiscountPayload;
                }
                if (updateQuoteRef) {
                    data.quoteRef = updateQuoteRef;
                }
                editBookingData = await ApiRequestUtils.update(API_ROUTES.UPDATE_BOOKING, data);
            } else if (values.submitType == 'rides') {
                data = {
                    customerId: bookingData?.Customer?.id,
                    bookingId: bookingData?.id,
                    pickupLat: values?.pickupLocation?.lat ? values?.pickupLocation?.lat : bookingData?.pickupLat,
                    pickupLong: values?.pickupLocation?.lng ? values?.pickupLocation?.lng : bookingData?.pickupLong,
                    pickupAddress: {
                        name: values?.pickupAddress ? values?.pickupAddress : bookingData?.pickupAddress?.name
                    },
                    driverStartLat: values.driverPickUpLocation?.lat,
                    driverStartLong: values.driverPickUpLocation?.lng,
                    driverStartAddress: {
                        name: values.driverPickUpAddress,
                    },
                    carType: values?.carType,
                    sourceType: values?.sourceType,
                    ...((values?.sourceType === "Others" || values?.sourceType === "Offline Ads") && {
                        otherSourceType: values?.otherSourceType?.trim() || null
                    }),
                    fromDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
                    zone: values?.zone,
                isPremiumService : values?.isPremiumService ? true : false
                }

            // console.log("DADADAD", data)
                data.dropLat = values?.dropLocation?.lat ? values?.dropLocation?.lat : bookingData?.dropLat
                data.dropLong = values?.dropLocation?.lng ? values?.dropLocation?.lng : bookingData?.dropLong
                data.dropAddress = {
                    name: values?.dropAddress ? values?.dropAddress : bookingData?.dropAddress?.name
                }
                if (updateAdminDiscountPayload) {
                    data.adminDiscount = updateAdminDiscountPayload;
                }
                if (updateQuoteRef) {
                    data.quoteRef = updateQuoteRef;
                }

                editBookingData = await ApiRequestUtils.update(API_ROUTES.UPDATE_RIDES_BOOKING, data);
            } else if (values.submitType == 'auto') {
                data = {
                    customerId: bookingData?.Customer?.id,
                    bookingId: bookingData?.id,
                    pickupLat: values?.pickupLocation?.lat ? values?.pickupLocation?.lat : bookingData?.pickupLat,
                    pickupLong: values?.pickupLocation?.lng ? values?.pickupLocation?.lng : bookingData?.pickupLong,
                    pickupAddress: {
                        name: values?.pickupAddress ? values?.pickupAddress : bookingData?.pickupAddress?.name
                    },
                    dropLat: values?.dropLocation?.lat ? values?.dropLocation?.lat : bookingData?.dropLat,
                    dropLong: values?.dropLocation?.lng ? values?.dropLocation?.lng : bookingData?.dropLong,
                    dropAddress: {
                        name: values?.dropAddress ? values?.dropAddress : bookingData?.dropAddress?.name
                    },
                    fromDate: moment(`${values?.rideDate} ${values?.rideTime}`, "YYYY-MM-DD HH:mm:ss").toISOString(),
                isPremiumService : values?.isPremiumService ? true : false,
                    car_Type: values?.carType || '',
                sourceType: values?.sourceType|| '',
                    ...((values?.sourceType === "Others" || values?.sourceType === "Offline Ads") && {
                        otherSourceType: values?.otherSourceType?.trim() || null
                    }),
                }
                if (updateAdminDiscountPayload) {
                    data.adminDiscount = updateAdminDiscountPayload;
                }
                if (updateQuoteRef) {
                    data.quoteRef = updateQuoteRef;
                }
                editBookingData = await ApiRequestUtils.update(API_ROUTES.UPDATE_RIDES_BOOKING, data);
            }
            if (editBookingData.success) {
                await sendQuotationLogs(editBookingData.data?.result?.id || bookingData?.id, loggedInUserId);
                props.editCancel();
            }
    }

    return (
        <div className="p-4 mx-auto">
            {loading ? (
                <div className="flex justify-center">
                    <Spinner className="h-12 w-12" />
                </div>
            ) : (
                <>

                    <div className='pb-4'>
                        <Typography variant="h5" className='text-gray-900'>
                            Edit Booking - {bookingData?.bookingNumber}
                        </Typography>
                    </div>
                    <Formik
                        initialValues={initialValues}
                        onSubmit={editSubmit}
                        validationSchema={EDIT_BOOKING_SCHEMA}
                        enableReinitialize
                    >
                        {({ handleSubmit, setFieldValue, values, dirty, isValid }) => {
                            const getCurrentPremiumOptions = () => {
                                if (values?.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation' && values?.tripType === 'Drop Only') {
                                    return premiumServicesMap['RENTAL_DROP_TAXI'] || [];
                                }
                                if (values?.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation' && values?.tripType === 'Round Trip') {
                                    return premiumServicesMap['RENTAL'] || [];
                                }
                                if (values?.serviceType === 'RENTAL_DROP_TAXI') {
                                    return premiumServicesMap['RENTAL_DROP_TAXI'] || [];
                                }
                                return premiumServicesMap[values?.serviceType] || [];
                            };
                            useLuggageAndSeaterLogic(values.carType, setFieldValue);
                    return(
                                <> {customerData && (
                                    <div className="p-2 flex mb-4 pointer-events-none">
                                        <SearchableDropdown
                                            searchVal={setCustomerNumber}
                                            addVal={customerNumber}
                                            selected={selectedCustomer}
                                            options={customerData}
                                            onSelect={(val) => {
                                                setFieldValue('customerId', val);
                                                setSelectedCustomer(val.id);
                                            }}
          
                                        />
                                    </div>
                                )}

                                    <div className="flex-1 mb-4">
                                        <div>
                                            <Typography variant="h6" className="mb-2">
                                                Service Area
                                            </Typography>
                                            {serviceAreaLoading ? (
                                                <div className="flex justify-center items-center p-4">
                                                    <Spinner className="h-6 w-6" />
                                                </div>
                                            ) : (
                                                <Field as="select"
                                                    disabled
                                                    name="serviceArea"
                                                    value={selectedAreaId || ''}
                                                    onChange={(e) => {
                                                        const areaId = e.target.value;
                                                        setSelectedAreaId(areaId);
                                                        setFieldValue('serviceArea', areaId);
                                                    }}
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                >
                                                    <option value="">Select Service Area</option>
                                                    {serviceAreas.map((area) => (
                                                        <option key={area.id} value={area.id}>
                                                            {area.name}
                                                        </option>
                                                    ))}
                                                </Field>
                                            )}
                                            <ErrorMessage name="serviceArea" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                        <div>
                                            <Typography variant="h6" className="mb-2">
                                                Service Type
                                            </Typography>
                                            <Field as="select" name="serviceType" disabled className="p-2 w-full rounded-xl border-2 border-gray-300">
                                                <option value="">Service Type</option>
                                                <option value="DRIVER">Driver</option>
                                                <option value="RENTAL">Rentals</option>
                                                <option value="RIDES">Rides</option>
                                                <option value="AUTO">Auto</option>
                                            </Field>
                                            <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && values.serviceType && (
                                            <div className="mt-4 p-3 border border-gray-300 rounded-xl bg-white">
                                                <Typography variant="h6" className="mb-2">Admin Discount (Optional)</Typography>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-black-700">Discount Type</label>
                                                        <Field
                                                            as="select"
                                                            name="adminDiscountType"
                                                            disabled={isExistingAdminDiscountLocked}
                                                            className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                        >
                                                            <option value="">Select type</option>
                                                            <option value="PERCENTAGE">PERCENTAGE</option>
                                                        </Field>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-black-700">Discount Value</label>
                                                        <Field
                                                            type="number"
                                                            name="adminDiscountValue"
                                                            disabled={isExistingAdminDiscountLocked}
                                                            min="0"
                                                            step="0.01"
                                                            className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                            placeholder="Enter value"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-black-700">Remarks</label>
                                                        <Field
                                                            type="text"
                                                            name="adminDiscountRemarks"
                                                            disabled={isExistingAdminDiscountLocked}
                                                            className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                            placeholder="Optional remarks"
                                                        />
                                                    </div>
                                                </div>
                                                {isExistingAdminDiscountLocked && (
                                                    <Typography className="text-xs text-gray-600 mt-2">
                                                        Admin discount is already approved and locked for editing.
                                                    </Typography>
                                                )}
                                            </div>
                                        )}
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
                                            </div>
                                        )}
                                    </div>
                                    {bookingData?.serviceType !== "RIDES" && bookingData?.serviceType !== "AUTO" && <>
                                        <div className='space-y-3 my-3'>
                                            <div className={values.serviceType === 'RENTAL' ? 'hidden' : 'grid grid-cols-2 gap-4 mt-2'}>
                                                <Button
                                                    color={values.packageTypeSelected === 'Local' ? 'blue' : 'gray'}
                                                    onClick={() => {
                                                        if (values.packageTypeSelected !== 'Local') {
                                                            setFieldValue('packageTypeSelected', 'Local');
                                                            setFieldValue('packageSelected', '');
                                                            setFieldValue('fromDate', '');
                                                            setFieldValue('toDate', '');
                                                        }
                                                    }}
                                                    variant={values?.packageTypeSelected === 'Local' ? 'filled' : 'outlined'}
                                                    disabled
                                                >
                                                    Local
                                                </Button>
                                                <Button
                                                    color={values.packageTypeSelected === 'Outstation' ? 'blue' : 'gray'}
                                                    onClick={() => {
                                                        if (values.packageTypeSelected !== 'Outstation') {
                                                            setFieldValue('packageTypeSelected', 'Outstation');
                                                            setFieldValue('packageSelected', '');
                                                            setFieldValue('fromDate', '');
                                                            setFieldValue('toDate', '');
                                                        }
                                                    }}
                                                    disabled
                                                    variant={values?.packageTypeSelected === 'Outstation' ? 'filled' : 'outlined'}
                                                >
                                                    Outstation
                                                </Button>
                                            </div>
                                            <div className={(values.serviceType === 'RENTAL' || (values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Local')) ? 'hidden' : ''}>
                                                <Typography className="text-sm font-medium text-black">Trip Type</Typography>
                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    {(values?.serviceType !== 'RENTAL') && (<Button
                                                        color={values.tripType === 'Drop Only' ? 'blue' : 'gray'}
                                                        onClick={() => setFieldValue('tripType', 'Drop Only')}
                                                        variant={values?.tripType === 'Drop Only' ? 'filled' : 'outlined'}
                                                        disabled
                                                    >
                                                        Drop Only
                                                    </Button>)}
                                                    <Button
                                                        color={values.tripType === 'Round Trip' ? 'blue' : 'gray'}
                                                        onClick={() => setFieldValue('tripType', 'Round Trip')}
                                                        variant={values?.tripType === 'Round Trip' ? 'filled' : 'outlined'}
                                                        disabled
                                                    >
                                                        Round Trip
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className='grid grid-cols-1 mt-2 space-x-3'>
                                                {(
                                                    values?.isPremiumService ||
                                                    values?.serviceType === 'RENTAL_DROP_TAXI' ||
                                            (values?.serviceType === 'RENTAL'  && values.packageTypeSelected === 'Outstation' &&
                                                        (values?.tripType === 'Round Trip' || values?.tripType === 'Drop Only'))
                                                ) && (

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

                                            <div>
                                    {!values?.isPremiumService && ( <>    
                                                    <label className="text-sm font-medium text-black-700">Car Type</label>
                                                    <div className="flex gap-4">
                                                        {['Mini', 'Sedan', 'SUV', 'MUV'].map((carType) => (
                                                            <label key={carType} className="flex items-center space-x-2">
                                                                <Field
                                                                    type="radio"
                                                                    name="carType"
                                                                    value={carType}
                                                                    className="h-4 w-4 text-primary-600"
                                                                />
                                                                <span className="text-black-700">{carType}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <ErrorMessage name="carType" component="div" className="text-red-500 text-sm mt-1" />
                                                </>)}
                                            </div>


                                            {(values?.serviceType !== 'RENTAL') && (<div>
                                                <label className="text-sm font-medium text-black-700">Transmission Type</label>
                                                <div className="grid grid-cols-8 mt-2">
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
                                            )}
                                        </div>
                                        {((values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation')) && (
                                            <div>
                                                <Typography className="text-sm font-medium text-black-700">AC Type</Typography>
                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    <Button
                                                        color={values.acType === 'AC' ? 'blue' : 'gray'}
                                                        onClick={() => setFieldValue('acType', 'AC')}
                                                        variant={values?.acType === 'AC' ? 'filled' : 'outlined'}
                                                    >
                                                        AC
                                                    </Button>

                                                    <Button
                                                        color={values.acType === 'N0N AC' ? 'blue' : 'gray'}
                                                        disabled
                                                        onClick={() => setFieldValue('acType', 'NON AC')}
                                                        variant={values?.acType === 'NON AC' ? 'filled' : 'outlined'}
                                                    >
                                                        NON AC
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4 mb-2">
                                            <div className="flex-1 mb-2">
                                                <Typography variant="h6" className="mb-2">
                                                    Pickup Date & Time
                                                </Typography>
                                                <Field
                                                    type="datetime-local"
                                                    name="rideDateTime"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    value={values.rideDate ? `${values.rideDate}T${values.rideTime}` : ''}
                                                    min={`${moment().format('YYYY-MM-DD')}T00:00`}
                                                    onClick={(e) => {
                                                        if (e.target.showPicker) e.target.showPicker();
                                                    }}
                                                    onChange={(e) => {
                                                        const selectedDateTime = e.target.value;
                                                        const formattedDate = moment(selectedDateTime).format('YYYY-MM-DD');
                                                        const formattedTime = moment(selectedDateTime).format('HH:mm');

                                                        setFieldValue('rideDate', formattedDate);
                                                        setFieldValue('rideTime', formattedTime);

                                                        if (formattedDate !== values.fromDate) {
                                                            setFieldValue('fromDate', '');
                                                            setFieldValue('toDate', '');
                                                        }
                                                    }}
                                                />
                                            </div>
                            {((values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation' && values.tripType === 'Round Trip') || (values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation' && values.tripType === 'Round Trip' && values.packageSelected === 'custom_date')) && ( <div className="flex-1 mb-2">
                                                <Typography variant="h6" className="mb-2">Return Date & Time</Typography>
                                                <Field
                                                    type="datetime-local"
                                                    name="toDateTime"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    value={values.toDate ? `${values.toDate}T${values.toTime}` : ''}
                                                    min={`${values.rideDate || moment().format('YYYY-MM-DD')}T00:00`}
                                                    onChange={(e) => {
                                                        const selectedDateTime = e.target.value;
                                                        const formattedDate = moment(selectedDateTime).format('YYYY-MM-DD');
                                                        const formattedTime = moment(selectedDateTime).format('HH:mm');

                                                        setFieldValue('toDate', formattedDate);
                                                        setFieldValue('toTime', formattedTime);
                                                    }}
                                                />
                                            </div>)}
                                        </div>
                                        {values.packageTypeSelected == 'Local' && <div className="flex-1 mb-4">
                                            <div>
                                                <Typography variant="h6" className="mb-2">
                                                    Choose a package
                                                </Typography>
                                                <Field as="select" name="packageSelected" className="p-2 w-full rounded-xl border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50" value={values.packageSelected}
                                                    onChange={(e) => {
                                                        setFieldValue('packageSelected', e.target.value);
                                                        if (values.packageTypeSelected === 'Outstation' && values.fromDate && values.toDate) {
                                                            setDatePickerVisible(false);
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
                                                            else if (values.serviceType === 'RENTAL' && values.tripType === 'Local') {
                                                                return item.serviceType === 'RENTAL' && item.type === 'Local';
                                                            }
                                                            return values.packageTypeSelected === item.type;
                                                        })
                                                        .map((item) => (
                                                            <option key={item.id} value={item.id}>
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
                                        </div>}
                                        {values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Outstation' && (
                                            <div className="flex-1 mb-4">
                                                <div>
                                                    <Typography variant="h6" className="mb-2">
                                                        Choose a package
                                                    </Typography>
                                                    <Field
                                                        as="select"
                                                        name="packageSelected"
                                                        className="p-2 w-full rounded-xl border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                                        value={values.packageSelected}
                                                        onChange={(e) => {
                                                            const selectedId = e.target.value;
                                                            setFieldValue('packageSelected', selectedId);
                                                            if (selectedId === 'custom_date') {
                                                                setFieldValue('fromDate', '');
                                                                setFieldValue('toDate', '');
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Select Package</option>
                                                        {packageTypeSelectedData
                                                            .filter(
                                                                (item) =>
                                                                    item.serviceType === 'DRIVER' &&
                                                                    item.type === 'Outstation' &&
                                                                    !(item.extraCabType === '0' || item.extraCabType === 0)
                                                            )
                                                            .map((item) => {
                                                                const label =
                                                                    item.extraCabType ||
                                                                    `${item.period} Days`;
                                                                return (
                                                                    <option key={item.id} value={item.id}>
                                                                        {label}
                                                                    </option>
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
                                        <div className="flex  gap-2 ">
                                            <div className="flex-1 p-2 space-y-2">
                                                <label className="block text-sm font-medium text-black-700">
                                                    Pickup Location <span className="text-red-500">*</span>
                                                </label>
                                                <Field
                                                    type="text"
                                                    name="pickupAddress"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    placeholder="Enter pickup location"
                                                    onChange={(e) => {
                                                        setFieldValue("pickupAddress", e.target.value);
                                                        setFieldValue("pickupLocation", null);
                                                        searchLocations(e.target.value, true);
                                                    }}
                                                />
                                                {pickupSuggestions.length > 0 && (
                                                    <ul className="border rounded-lg bg-white mt-2">
                                                        {pickupSuggestions.map((suggestion, index) => (
                                                            <li
                                                                key={index}
                                                                className="p-2 cursor-pointer hover:bg-gray-100"
                                                                onClick={() => {
                                                                    handleSelectLocation(getSuggestionText(suggestion), true, null, setFieldValue, values);
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
                                            {(values.tripType !== 'Drop Only' || values.packageTypeSelected === 'Outstation') && !(values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Local') && (<div className="flex-1 p-2 space-y-2">
                                                <label className="block text-sm font-medium text-black-700">Drop Location<span className="text-red-500">*</span></label>
                                                <Field
                                                    type="text"
                                                    name="dropAddress"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    placeholder="Enter drop location (Optional)"
                                                    onChange={(e) => {
                                                        setFieldValue("dropAddress", e.target.value);
                                                        setFieldValue("dropLocation", null);
                                                        searchLocations(e.target.value, false);
                                                    }}
                                                />
                                                {dropSuggestions.length > 0 && (
                                                    <ul className="border rounded-lg bg-white mt-2">
                                                        {dropSuggestions.map((suggestion, index) => (
                                                            <li
                                                                key={index}
                                                                className="p-2 cursor-pointer hover:bg-gray-100"
                                                                onClick={() => {
                                                                    handleSelectLocation(getSuggestionText(suggestion), false, null, setFieldValue, values);
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
                                            </div>)}
                                        </div>
                                        {(values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation' || values.serviceType === 'RIDES') && (
                                            <div className="p-2 space-y-2">
                                                <label className="block text-sm font-medium text-black-700">
                                                    Cab Starting Point
                                                </label>
                                                <Field
                                                    type="text"
                                                    name="driverPickUpAddress"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    placeholder="Enter driver pickup location (Optional)"
                                                    onChange={(e) => {
                                                        setFieldValue("driverPickUpAddress", e.target.value);
                                                        setFieldValue("driverPickUpLocation", null);
                                                        searchLocations(e.target.value, false, 'driver');
                                                    }}
                                                />
                                                {driverSuggestions.length > 0 && (
                                                    <ul className="border rounded-lg bg-white mt-2">
                                                        {driverSuggestions.map((suggestion, index) => (
                                                            <li
                                                                key={index}
                                                                className="p-2 cursor-pointer hover:bg-gray-100"
                                                                onClick={() => handleSelectLocation(getSuggestionText(suggestion), false, 'driver', setFieldValue, values)}
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
                                            </div>)}
                                          {(values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Outstation' ) && (
                                            <div className="p-2 space-y-2">
                                                <label className="block text-sm font-medium text-black-700">
                                                    Cab Ending Point
                                                </label>
                                                <Field
                                                    type="text"
                                                    name="driverEndAddress"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    placeholder="Enter driver pickup location (Optional)"
                                                    onChange={(e) => {
                                                        setFieldValue("driverEndAddress", e.target.value);
                                                        setFieldValue("driverEndLocation", null);
                                                        searchLocations(e.target.value, false, 'driverEnd');
                                                    }}
                                                />
                                                {driverEndSuggestions.length > 0 && (
                                                    <ul className="border rounded-lg bg-white mt-2 max-h-48 overflow-y-auto">
                                                        {driverEndSuggestions.map((suggestion, index) => (
                                                            <li
                                                                key={index}
                                                                className="p-2 cursor-pointer hover:bg-gray-100"
                                                                onClick={() => handleSelectLocation(getSuggestionText(suggestion), false, 'driverEnd', setFieldValue, values)}
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
                                            </div>)}

                                        {/* Add luggage and seater capacity fields */}
                                        {(values.serviceType === 'DRIVER' || values.serviceType === 'RENTAL' || values.serviceType === 'RENTAL_HOURLY_PACKAGE' || values.serviceType === 'RENTAL_DROP_TAXI') && (
                                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                                                        value={values.luggage || ''}
                                                    />
                                                    <ErrorMessage name="luggage" component="div" className="text-red-500 text-sm" />
                                                </div>
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
                                                        value={values.seaterCapacity || ''}
                                                    />
                                                    <ErrorMessage name="seaterCapacity" component="div" className="text-red-500 text-sm" />
                                                </div>
                                            </div>
                                        )}
                                {/* Source Type Field for all services */}
                                        {values.serviceType && (
                                            <div className="space-y-2 mb-4">
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
                                        )}
                                        {values.packageSelected && values.packageTypeSelected == 'Local' && (values.serviceType == 'DRIVER' || values.serviceType == 'RENTAL')
                                            &&
                                            (quoteDetails&& <Card className="my-6">
                                                <div className="border rounded-xl bg-gray-200 p-4">
                                                    <h2 className="text-2xl font-bold text-center">Estimated Price Details</h2>
                                                    <hr className="my-2 border border-black" />
                                                    <div className="mt-4">
                                                        <div className="flex justify-between">
                                                            <Typography color="gray" variant="h6">Package:</Typography>
                                                            <Typography>
                                                                {packageTypeSelectedData.find(pkg => pkg.id === Number(values.packageSelected))?.period || ""} hr
                                                            </Typography>
                                                        </div>
                                                        <>
                                                            <div className="flex justify-between">
                                                                <Typography color="gray" variant="h6">Car Type:</Typography>
                                                                <Typography>
                                                                    {values.carType || bookingData?.carType || ''}
                                                                </Typography>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Typography color="gray" variant="h6">Estimated Fare</Typography>
                                                                <Typography>
                                                                    {values.packageSelected && values.packageTypeSelected === 'Local' ? (
                                                                        values.serviceType === 'DRIVER' ? (
                                                                            `₹${(() => {
                                                                                const selectedPackage = packageTypeSelectedData.find((pkg) => pkg.id === Number(values.packageSelected));
                                                                                if (!selectedPackage) return 'N/A';
                                                                                const raw =
                                                                                    ['MINI', 'SEDAN', 'SUV'].includes(values.carType?.toUpperCase())
                                                                                        ? selectedPackage.price
                                                                                        : values.carType?.toUpperCase() === 'MUV'
                                                                                            ? selectedPackage.priceMVP
                                                                                            : null;

                                                                                const num = Number(raw);
                                                                                if (!Number.isFinite(num)) return 'N/A';
                                                                                return Math.round(num);
                                                                            })()}`
                                                                        ) : values.serviceType === 'RENTAL' ? (
                                                                            `₹${(() => {
                                                                                const selectedPackage = packageTypeSelectedData.find((pkg) => pkg.id === Number(values.packageSelected));
                                                                                if (!selectedPackage) return 'N/A';
                                                                                const car = values.carType?.toUpperCase();
                                                                            const raw = car === 'MINI'  ? selectedPackage.price : 
                                                                                    car === 'SEDAN' ? selectedPackage.priceSedan :
                                                                                        car === 'SUV'   ? selectedPackage.priceSuv :
                                                                                        car === 'MUV'   ? selectedPackage.priceMVP :
                                                                                                null;

                                                                                const num = Number(raw);
                                                                                if (!Number.isFinite(num)) return 'N/A';
                                                                                return Math.round(num);
                                                                            })()}`
                                                                        ) : 'N/A'
                                                                    ) : 'N/A'}
                                                                </Typography>
                                                            </div>
                                                {quoteDetails?.walletApplicable === true  && (
                                                        <>
                                                            <div className="flex justify-between">
                                                                <Typography color="gray" variant="h6">Wallet Amount Applied</Typography>
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
                                                                <Typography color="gray" variant="h6">Final Estimated Fare after Wallet Deduction</Typography>
                                                                <Typography>
                                                                    ₹ {Math.max(
                                                                        0,
                                                                        Math.round(
                                                                            Number(quoteDetails?.amount?.estimatedPrice || quoteDetails?.value?.estimatedPrice || 0) -
                                                                            Number(
                                                                                quoteDetails?.walletAmount ||
                                                                                quoteDetails?.amount?.walletAmount ||
                                                                                quoteDetails?.value?.walletAmount ||
                                                                                0
                                                                            )
                                                                        )
                                                                    )}
                                                                </Typography>
                                                            </div>
                                                        </>
                                                    )}
                                                        </>
                                                    </div>
                                                </div>
                                            </Card>)}
                                        {quoteDetails &&  !(values.serviceType === 'DRIVER' && values.packageTypeSelected === 'Local' )&&!(values.serviceType === 'RENTAL' && values.packageTypeSelected === 'Local' )&&
                                            <Card className="my-6">
                                                <div className="border rounded-xl bg-gray-200 p-4">
                                                    <h2 className="text-2xl font-bold text-center">Estimated Price Details</h2>
                                                    <hr className="my-2 border border-black" />
                                                    <div className="mt-4">
                                                        <>
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
                                                                {values?.serviceType !== 'DRIVER' && values?.serviceType !== 'RENTAL_DROP_TAXI' && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Per Km Rate</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(quoteDetails.value?.kilometerPriceVal || quoteDetails.amount?.kilometerPriceVal)}
                                                                        </Typography></>)}
                                                                {values?.serviceType !== 'DRIVER' && (<>
                                                                    <Typography color="gray" variant="h6">Pick up to Drop  Kilometer + Driver Km For Pickup Locationn</Typography>
                                                                    <Typography>
                                                                        {Number(quoteDetails.amount?.estimatedDistance).toFixed(1)} Kms {quoteDetails.amount?.driverWithin > 0 && (<> + {Number(quoteDetails.amount.driverWithin).toFixed(1)} Kms</>)}
                                                                    </Typography>

                                                                </>)}
                                                                {values?.serviceType !== 'DRIVER' &&
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Base Fare upto {quoteDetails.value?.baseKm || quoteDetails.amount?.baseKm} Kilometer</Typography>
                                                                        <Typography>
                                                                            ₹   {Math.round(quoteDetails.amount?.baseFare)}
                                                                        </Typography>
                                                                    </>}

                                                                {(quoteDetails.amount?.isPremiumFare !== true) && (values?.serviceType === "RENTAL" || values?.serviceType === "RENTAL_DROP_TAXI" || values?.serviceType === "RENTAL_HOURLY_PACKAGE") && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Car Type:</Typography>
                                                                        <Typography>
                                                                            {quoteDetails.amount?.carType || ''}
                                                                        </Typography>
                                                                    </>
                                                                )}

                                                                {quoteDetails.amount?.isPrimeLocation === true && quoteDetails.amount?.rideSurchargeAmount > 0 &&
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Surcharge Applied</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(quoteDetails.amount?.rideSurchargeAmount)}
                                                                        </Typography>
                                                                    </>
                                                                }
                                                                {values?.serviceType === 'DRIVER' && (
                                                                    <>
                                                                     <Typography color="gray" variant="h6">Car Type</Typography>
                                                                        <Typography>
                                                                           {values.carType || bookingData?.carType || ''}
                                                                        </Typography>
                                                                        <Typography color="gray" variant="h6">Base Fare</Typography>
                                                                        <Typography>
                                                                            ₹ {Number(quoteDetails.amount?.fareBreakdown?.baseFare).toFixed(2)}
                                                                        </Typography>
                                                                        <Typography color="gray" variant="h6">KM</Typography>
                                                                        <Typography>
                                                                            ₹ {Number(quoteDetails?.amount?.distanceEstimated || 0).toFixed(2)}
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
                                                                <Typography color="gray" variant="h6">Estimated Fare</Typography>
                                                                <Typography>
                                                                    ₹ {Math.round(quoteDetails.amount?.fare_before_gst)}
                                                                </Typography>
                                                                {quoteDetails.amount?.gst_amount > 0 && (
                                                                    <>
                                                                    <Typography color="gray" variant="h6">TAX Amount</Typography>
                                                                    <Typography>
                                                                        ₹ {Math.round(quoteDetails.amount?.gst_amount)}
                                                                    </Typography>
                                                               
                                                                <Typography color="gray" variant="h6">Final Estimated Fare</Typography>
                                                                <Typography>
                                                                    ₹ {Math.round(quoteDetails.amount?.estimatedPrice)}
                                                                </Typography>
                                                                {quoteDetails?.walletApplicable === true  && (
                                                                        <>
                                                                            <div className="flex justify-between items-start gap-3">
                                                                                <Typography color="gray" variant="h6">Wallet Amount Applied</Typography>
                                                                                <Typography>
                                                                                    ₹ {Math.round(
                                                                                        quoteDetails?.walletAmount ||
                                                                                        quoteDetails?.amount?.walletAmount ||
                                                                                        quoteDetails?.value?.walletAmount ||
                                                                                        0
                                                                                    )}
                                                                                </Typography>
                                                                            </div>
                                                                            <div className="flex justify-between items-start gap-3">
                                                                                <Typography color="gray" variant="h6">Final Estimated Fare after Wallet Deduction</Typography>
                                                                                <Typography>
                                                                                    ₹ {Math.max(
                                                                                        0,
                                                                                        Math.round(
                                                                                            Number(quoteDetails?.amount?.estimatedPrice || quoteDetails?.value?.estimatedPrice || 0) -
                                                                                            Number(
                                                                                                quoteDetails?.walletAmount ||
                                                                                                quoteDetails?.amount?.walletAmount ||
                                                                                                quoteDetails?.value?.walletAmount ||
                                                                                                0
                                                                                            )
                                                                                        )
                                                                                    )}
                                                                                </Typography>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                 </>)}
                                                                {quoteDetails.discount?.percentage > 0 && <>

                                                                    <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                                    <Typography>
                                                                        {quoteDetails.discount?.percentage} %
                                                                    </Typography>
                                                                    <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                    <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                        {/* {quoteDetails.discount?.percentage} % - ₹ {quoteDetails.amount?.estimatedPrice} */}
                                                                        ₹ {Math.round(quoteDetails.amount?.estimatedPrice) - (quoteDetails.amount?.estimatedPrice * quoteDetails.discount?.percentage / 100)}
                                                                    </Typography>

                                                                </>}
                                                                {quoteDetails.discount?.amount > 0 && <>

                                                                    <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                                    <Typography>
                                                                        ₹ {Math.round(quoteDetails.discount?.amount)}
                                                                    </Typography>
                                                                    <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                    <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                        ₹ {Math.round(quoteDetails.amount?.estimatedPrice) - Math.round(quoteDetails.discount?.amount)}
                                                                    </Typography>

                                                                </>}
                                                                {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && quoteDetails?.adminDiscount?.discountValue > 0 && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Admin Discount Applied:</Typography>
                                                                        <Typography>{adminDiscountValueDisplay}</Typography>
                                                                        <Typography color="gray" variant="h6">Admin Discount Applied After Total estimated Fare:</Typography>
                                                                        <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                            ₹ {Math.max(0, Math.round(finalEstimatedFareAfterAdminDiscount))}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                                {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && !isQuoteAdminDiscountEffective && isQuoteAdminDiscountPending && quoteDetails?.adminDiscount?.discountValue > 0 && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Admin Discount Requested:</Typography>
                                                                        <Typography>{adminDiscountValueDisplay} (Awaiting approval)</Typography>
                                                                    </>
                                                                )}
                                                            </div>

                                                        </>
                                                    </div>
                                                </div>
                                            </Card>
                                        }





                                        {values.packageTypeSelected == 'Outstation' && values.serviceType === 'RENTAL' &&
                                <Button fullWidth className='my-6 mx-2 bg-primary' onClick={() => getQuoteOutstationDetails(values)}>
                                    Check Estimated Price
                                            </Button>
                                        }


                                        {values.serviceType == 'DRIVER' && values.packageTypeSelected == 'Outstation' &&
                    <Button fullWidth className='my-6 mx-2 bg-primary' onClick={() => getQuoteOutstationDetails(values)}>
                        Check Estimated Price
                                            </Button>
                                        }
                                         {(values.serviceType == 'DRIVER' || values?.serviceType =="RENTAL") && values.packageTypeSelected == 'Local' &&
                    <Button fullWidth className='my-6 mx-2 bg-primary' onClick={() => getQuoteRides(values)}>
                        Check Estimated Price
                                            </Button>
                                        }
                                        <div className="flex justify-center my-6 gap-4">
                                            <Button
                                                color="gray"
                                                onClick={onBackPressHandler}
                                                className='my-6 mx-2 '
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                color="blue"
                                                onClick={() => {
                                                    setFieldValue("submitType", "default");
                                        handleSubmit()
                                                }}
                                    disabled={!dirty || !isValid || (!values.rideDate && !values.toDate) || (!values.pickupAddress && !values.dropAddress)}
                                                className='my-6 mx-2'
                                            >
                                    Confirm Booking
                                            </Button>
                                        </div>
                                    </>}
                                    {bookingData?.serviceType == "RIDES" &&
                                        <>
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
                                                    {!values.isPremiumService && (
                                                        <>
                                                            <div className='ml-2'>
                                                                <label className="text-sm font-medium text-black-700">Car Type</label>
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
                                                                <ErrorMessage name="carType" component="div" className="text-red-500 text-sm mt-1" />
                                                            </div>
                                                        </>
                                                    )}
                                                    {values.serviceType && (
                                                        <div className="space-y-2 mb-4">
                                                <label htmlFor="sourceType" className="text-sm font-medium text-gray-700">
                                                    Source Type <span className="text-red-500">*</span>
                                                </label>
                                                            <Field
                                                                as="select"
                                                                name="sourceType"
                                                                className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                                            >
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
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 mb-2">
                                                <Typography variant="h6" className="mb-2">
                                                    Pickup Date & Time
                                                </Typography>
                                                <Field
                                                    type="datetime-local"
                                                    name="rideDateTime"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    value={values.rideDate ? `${values.rideDate}T${values.rideTime}` : ''}
                                                    min={`${moment().format('YYYY-MM-DD')}T00:00`}
                                                    onClick={(e) => {
                                                        if (e.target.showPicker) e.target.showPicker();
                                                    }}
                                                    onChange={(e) => {
                                                        const selectedDateTime = e.target.value;
                                                        const formattedDate = moment(selectedDateTime).format('YYYY-MM-DD');
                                                        const formattedTime = moment(selectedDateTime).format('HH:mm');

                                                        setFieldValue('rideDate', formattedDate);
                                                        setFieldValue('rideTime', formattedTime);

                                                        if (formattedDate !== values.fromDate) {
                                                            setFieldValue('fromDate', '');
                                                            setFieldValue('toDate', '');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex  gap-2 ">
                                                <div className="flex-1 p-2 space-y-2">
                                                    <label className="block text-sm font-medium text-black-700">
                                                        Customers Pickup Location <span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="pickupAddress"
                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                        placeholder="Enter pickup location"
                                                        onChange={(e) => {
                                                            setFieldValue("pickupAddress", e.target.value);
                                                            setFieldValue("pickupLocation", null);
                                                            searchLocations(e.target.value, true);
                                                        }}
                                                    />
                                                    {pickupSuggestions.length > 0 && (
                                                        <ul className="border rounded-lg bg-white mt-2">
                                                            {pickupSuggestions.map((suggestion, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                                                    onClick={() => {
                                                                        handleSelectLocation(getSuggestionText(suggestion), true, null, setFieldValue, values);
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
                                                <div className="flex-1 p-2 space-y-2">
                                                    <label className="block text-sm font-medium text-black-700">Drop Location<span className="text-red-500">*</span></label>
                                                    <Field
                                                        type="text"
                                                        name="dropAddress"
                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                        placeholder="Enter drop location (Optional)"
                                                        onChange={(e) => {
                                                            setFieldValue("dropAddress", e.target.value);
                                                            setFieldValue("dropLocation", null);
                                                            searchLocations(e.target.value, false);
                                                        }}
                                                    />
                                                    {dropSuggestions.length > 0 && (
                                                        <ul className="border rounded-lg bg-white mt-2">
                                                            {dropSuggestions.map((suggestion, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                                                    onClick={() => {
                                                                        handleSelectLocation(getSuggestionText(suggestion), false, null, setFieldValue, values);
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
                                            </div>
                                            <div className="flex-1 p-2 space-y-2">
                                                <label className="block text-sm font-medium text-black-700">
                                                    Cab Starting Point
                                                </label>
                                                <Field
                                                    type="text"
                                                    name="driverPickUpAddress"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    placeholder="Enter driver pickup location (Optional)"
                                                    onChange={(e) => {
                                                        setFieldValue("driverPickUpAddress", e.target.value);
                                                        setFieldValue("driverPickUpLocation", null);
                                                        searchLocations(e.target.value, false, 'driver');
                                                    }}
                                                />
                                                {driverSuggestions.length > 0 && (
                                                    <ul className="border rounded-lg bg-white mt-2">
                                                        {driverSuggestions.map((suggestion, index) => (
                                                            <li
                                                                key={index}
                                                                className="p-2 cursor-pointer hover:bg-gray-100"
                                                                onClick={() => handleSelectLocation(getSuggestionText(suggestion), false, 'driver', setFieldValue, values)}
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
                                            {/* Quote details for RIDES */}
                                            {quoteDetails &&
                                                <Card className="my-6">
                                                    <div className="border rounded-xl bg-gray-200 p-4">
                                                        <h2 className="text-2xl font-bold text-center">Estimated Price Details</h2>
                                                        <hr className="my-2 border border-black" />
                                                        <div className="mt-4">
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
                                                                <Typography color="gray" variant="h6">Per Km Rate</Typography>
                                                                <Typography>
                                                                    ₹ {Math.round(quoteDetails.value?.kilometerPriceVal || quoteDetails.amount?.kilometerPriceVal)}
                                                                </Typography>
                                                                <Typography color="gray" variant="h6">Pick up to Drop  Kilometer + Driver Km For Pickup Location</Typography>
                                                                <Typography>
                                                                    {(quoteDetails.amount?.estimatedDistance).toFixed(1)} Kms {quoteDetails.amount?.driverWithin > 0 && (<> + {Number(quoteDetails.amount.driverWithin).toFixed(1)} Kms</>)}
                                                                </Typography>
                                                                {values?.serviceType === 'RIDES' && (<>

                                                                    <Typography color="gray" variant="h6">Estimate Time</Typography>

                                                                    <Typography>
                                                                        {quoteDetails.amount?.displayTime}
                                                                    </Typography>
                                                                </>)}
                                                                {quoteDetails.amount?.isPremiumFare !== true && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Car Type:</Typography>
                                                                        <Typography>
                                                                            {quoteDetails.amount?.carType || ''}
                                                                        </Typography>
                                                                    </>)}

                                                                <Typography color="gray" variant="h6">Base Fare upto {quoteDetails.amount?.baseKm} Kilometer</Typography>
                                                                <Typography>
                                                                    ₹ {Math.round(quoteDetails.value?.baseFare || quoteDetails.amount?.baseFare)}
                                                                </Typography>


                                                                {(quoteDetails.value?.rideSurchargeAmount > 0 || quoteDetails.amount?.rideSurchargeAmount > 0) && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Surcharge Applied</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(quoteDetails.value?.rideSurchargeAmount || quoteDetails.amount?.rideSurchargeAmount)}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                                <Typography color="gray" variant="h6">Estimated Fare</Typography>
                                                                <Typography>
                                                                    ₹ {Math.round(quoteDetails.amount?.fare_before_gst)}
                                                                </Typography>
                                                                {quoteDetails.amount?.gst_amount > 0 && (<>
                                                                    <Typography color="gray" variant="h6">TAX Amount</Typography>
                                                                    <Typography>
                                                                        ₹ {Math.round(quoteDetails.amount?.gst_amount)}
                                                                    </Typography>
                                                                </>)}
                                                                <Typography color="gray" variant="h6">Final Estimated Fare</Typography>
                                                                <Typography>
                                                                    ₹ {Math.round(quoteDetails.value?.estimatedPrice || quoteDetails.amount?.estimatedPrice)}
                                                                </Typography>
                                                                {(quoteDetails?.walletApplicable === true ||
                                                                    quoteDetails?.amount?.walletApplicable === true ||
                                                                    quoteDetails?.value?.walletApplicable === true) && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Wallet Amount Applied</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(
                                                                                quoteDetails?.walletAmount ||
                                                                                quoteDetails?.amount?.walletAmount ||
                                                                                quoteDetails?.value?.walletAmount ||
                                                                                0
                                                                            )}
                                                                        </Typography>
                                                                        <Typography color="gray" variant="h6">Final Estimated Fare after Wallet Deduction</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.max(
                                                                                0,
                                                                                Math.round(
                                                                                    Number(quoteDetails?.amount?.estimatedPrice || quoteDetails?.value?.estimatedPrice || 0) -
                                                                                    Number(
                                                                                        quoteDetails?.walletAmount ||
                                                                                        quoteDetails?.amount?.walletAmount ||
                                                                                        quoteDetails?.value?.walletAmount ||
                                                                                        0
                                                                                    )
                                                                                )
                                                                            )}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                                {quoteDetails.discount?.percentage > 0 && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                                        <Typography>
                                                                            {quoteDetails.discount?.percentage} %
                                                                        </Typography>
                                                                        <Typography color="gray" variant="h6">Total Estimated Fare</Typography>
                                                                        <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                            ₹ {Math.round((quoteDetails.value?.estimatedPrice || quoteDetails.amount?.estimatedPrice) - ((quoteDetails.value?.estimatedPrice || quoteDetails.amount?.estimatedPrice) * quoteDetails.discount?.percentage / 100))}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                                {quoteDetails.discount?.amount > 0 && <>
                                                                    <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                                    <Typography>
                                                                        ₹ {Math.round(quoteDetails.discount?.amount)}
                                                                    </Typography>
                                                                    <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                                    <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                        ₹ {Math.round((quoteDetails.amount?.estimatedPrice) - (quoteDetails.discount?.amount))}
                                                                    </Typography>
                                                                </>}
                                                                {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && quoteDetails?.adminDiscount?.discountValue > 0 && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Admin Discount Applied:</Typography>
                                                                        <Typography>{adminDiscountValueDisplay}</Typography>
                                                                        <Typography color="gray" variant="h6">Admin Discount Applied After Total estimated Fare:</Typography>
                                                                        <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                            ₹ {Math.max(0, Math.round(finalEstimatedFareAfterAdminDiscount))}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                                {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && !isQuoteAdminDiscountEffective && isQuoteAdminDiscountPending && quoteDetails?.adminDiscount?.discountValue > 0 && (
                                                                    <>
                                                                        <Typography color="gray" variant="h6">Admin Discount Requested:</Typography>
                                                                        <Typography>{adminDiscountValueDisplay} (Awaiting approval)</Typography>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            }

                                            {bookingData?.serviceType == 'RIDES' &&
                                                <Button fullWidth className='my-6 mx-2 bg-primary' onClick={() => getQuoteRides(values, setFieldValue)}>
                                                    Check Estimated Price
                                                </Button>
                                            }
                                            <div className="flex justify-center my-6 gap-4">
                                                <Button
                                                    color="gray"
                                                    onClick={onBackPressHandler}
                                                    className='my-6 mx-2'
                                                >
                                                    Back
                                                </Button>
                                                <Button
                                                    color="blue"
                                                    onClick={() => {
                                                        setFieldValue("submitType", "rides");
                                                        handleSubmit()
                                                    }}
                                                    disabled={!(values.pickupAddress && values.dropAddress) || isButtonDisabled}
                                                    className='my-6 mx-2'
                                                >
                                        Confirm Booking
                                                </Button>
                                            </div>
                                        </>
                                    }
                                    {bookingData?.serviceType == "AUTO" && (
                                        <>
                                            {values.serviceType && (
                                                <div className="space-y-2 mb-4">
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
                                            )}

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
                                            <div className="mt-3">
                                                <Typography variant="h6" className="mb-2">
                                                    Pickup Date & Time
                                                </Typography>
                                                <Field
                                                    type="datetime-local"
                                                    name="rideDateTime"
                                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                    value={values.rideDate ? `${values.rideDate}T${values.rideTime}` : ''}
                                                    min={`${moment().format('YYYY-MM-DD')}T00:00`}
                                                    onClick={(e) => {
                                                        if (e.target.showPicker) e.target.showPicker();
                                                    }}
                                                    onChange={(e) => {
                                                        const selectedDateTime = e.target.value;
                                                        const formattedDate = moment(selectedDateTime).format('YYYY-MM-DD');
                                                        const formattedTime = moment(selectedDateTime).format('HH:mm');

                                                        setFieldValue('rideDate', formattedDate);
                                                        setFieldValue('rideTime', formattedTime);

                                                        if (formattedDate !== values.fromDate) {
                                                            setFieldValue('fromDate', '');
                                                            setFieldValue('toDate', '');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 p-2 space-y-2">
                                                    <label className="block text-sm font-medium text-black-700">
                                                        Pickup Location <span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="pickupAddress"
                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                        placeholder="Enter pickup location"
                                                        onChange={(e) => {
                                                            setFieldValue("pickupAddress", e.target.value);
                                                            setFieldValue("pickupLocation", null);
                                                            searchLocations(e.target.value, true);
                                                        }}
                                                    />
                                                    {pickupSuggestions.length > 0 && (
                                                        <ul className="border rounded-lg bg-white mt-2">
                                                            {pickupSuggestions.map((suggestion, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                                                    onClick={() => {
                                                                        handleSelectLocation(getSuggestionText(suggestion), true, null, setFieldValue, values);
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
                                                <div className="flex-1 p-2 space-y-2">
                                                    <label className="block text-sm font-medium text-black-700">
                                                        Drop Location (Delivery Address) <span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="dropAddress"
                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                        placeholder="Enter delivery address"
                                                        onChange={(e) => {
                                                            setFieldValue("dropAddress", e.target.value);
                                                            setFieldValue("dropLocation", null);
                                                            searchLocations(e.target.value, false);
                                                        }}
                                                    />
                                                    {dropSuggestions.length > 0 && (
                                                        <ul className="border rounded-lg bg-white mt-2">
                                                            {dropSuggestions.map((suggestion, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                                                    onClick={() => {
                                                                        handleSelectLocation(getSuggestionText(suggestion), false, null, setFieldValue, values);
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
                                            </div>
                                        </>
                                    )}
                                    {values.serviceType === 'AUTO' && quoteDetails &&
                                        <Card className="my-6">
                                            <div className="border rounded-xl bg-gray-200 p-4">
                                                <h2 className="text-2xl font-bold text-center">Estimated Price Details</h2>
                                                <hr className="my-2 border border-black" />
                                                <div className="mt-4">
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
                                                        <Typography color="gray" variant="h6">Per Km Rate</Typography>
                                                        <Typography>
                                                            ₹ {Math.round(quoteDetails.value?.kilometerPriceVal || quoteDetails.amount?.kilometerPriceVal)}
                                                        </Typography>
                                                        <Typography color="gray" variant="h6">Pick up to Drop  Kilometer + Driver Km For Pickup Location</Typography>
                                                        <Typography>
                                                            {(quoteDetails.amount?.distanceEstimated)} Kms {quoteDetails.amount?.driverWithin > 0 && (<> + {Number(quoteDetails.amount.driverWithin).toFixed(1)} Kms</>)}
                                                        </Typography>
                                                        <Typography color="gray" variant="h6">Base Fare upto {quoteDetails.amount?.baseKm} Kilometer</Typography>
                                                        <Typography>
                                                            ₹ {Math.round(quoteDetails.value?.baseFare || quoteDetails.amount?.baseFare)}
                                                        </Typography>


                                                        {(quoteDetails.value?.rideSurchargeAmount > 0 || quoteDetails.amount?.rideSurchargeAmount > 0) && (
                                                            <>
                                                                <Typography color="gray" variant="h6">Surcharge Applied</Typography>
                                                                <Typography>
                                                                    ₹ {Math.round(quoteDetails.value?.rideSurchargeAmount || quoteDetails.amount?.rideSurchargeAmount)}
                                                                </Typography>
                                                            </>
                                                        )}

                                                        <Typography color="gray" variant="h6">Estimated Fare</Typography>
                                                        <Typography>
                                                            ₹ {Math.round(quoteDetails.amount?.fare_before_gst)}
                                                        </Typography>
                                                        {quoteDetails?.walletApplicable === true && (
                                                            <>
                                                                    
                                                                        <Typography color="gray" variant="h6">Wallet Amount Applied</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.round(
                                                                                quoteDetails?.walletAmount ||
                                                                                quoteDetails?.amount?.walletAmount ||
                                                                        quoteDetails?.value?.walletAmount ||
                                                                        0
                                                                    )} </Typography>
                                                                
                                                                
                                                                    
                                                                        <Typography color="gray" variant="h6">Final Estimated Fare after Wallet Deduction</Typography>
                                                                        <Typography>
                                                                            ₹ {Math.max(
                                                                                0,
                                                                                Math.round(
                                                                                    Number(quoteDetails?.amount?.estimatedPrice || quoteDetails?.value?.estimatedPrice || 0) -
                                                                                    Number(
                                                                                        quoteDetails?.walletAmount ||
                                                                                        quoteDetails?.amount?.walletAmount ||
                                                                                        quoteDetails?.value?.walletAmount ||
                                                                                        0
                                                                                    )
                                                                                )
                                                                            )}
                                                                        </Typography>
                                                                    
                                                            </>
                                                        )}
                                                        {quoteDetails.amount?.gst_amount > 0 && (<>
                                                            <Typography color="gray" variant="h6">TAX Amount</Typography>
                                                            <Typography>
                                                                ₹ {Math.round(quoteDetails.amount?.gst_amount)}
                                                            </Typography>
                                                        
                                                        <Typography color="gray" variant="h6">Final Estimated Fare</Typography>
                                                        <Typography>
                                                            ₹ {Math.round(quoteDetails.value?.estimatedPrice || quoteDetails.amount?.estimatedPrice)}
                                                        </Typography>
                                                        </>)}
                                                        {quoteDetails.discount?.percentage > 0 && (
                                                            <>
                                                                <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                                <Typography>
                                                                    {quoteDetails.discount?.percentage} %
                                                                </Typography>
                                                                <Typography color="gray" variant="h6">Total Estimated Fare</Typography>
                                                                <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                    ₹ {Math.round((quoteDetails.value?.estimatedPrice || quoteDetails.amount?.estimatedPrice) - ((quoteDetails.value?.estimatedPrice || quoteDetails.amount?.estimatedPrice) * quoteDetails.discount?.percentage / 100))}
                                                                </Typography>
                                                            </>
                                                        )}
                                                        {quoteDetails.discount?.amount > 0 && <>

                                                            <Typography color="gray" variant="h6">Discount Applied</Typography>
                                                            <Typography>
                                                                ₹ {Math.round(quoteDetails.discount?.amount)}
                                                            </Typography>
                                                            <Typography color="gray" variant="h6">Total estimated Fare</Typography>
                                                            <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                ₹ {Math.round((quoteDetails.amount?.estimatedPrice) - (quoteDetails.discount?.amount))}
                                                            </Typography>

                                                        </>}
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && isQuoteAdminDiscountEffective && quoteDetails?.adminDiscount?.discountValue > 0 && (
                                                            <>
                                                                <Typography color="gray" variant="h6">Admin Discount Applied:</Typography>
                                                                <Typography>{adminDiscountValueDisplay}</Typography>
                                                                <Typography color="gray" variant="h6">Admin Discount Applied After Total estimated Fare:</Typography>
                                                                <Typography className='font-roboto-medium text-lg text-gray-900'>
                                                                    ₹ {Math.max(0, Math.round(finalEstimatedFareAfterAdminDiscount))}
                                                                </Typography>
                                                            </>
                                                        )}
                                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && !isQuoteAdminDiscountEffective && isQuoteAdminDiscountPending && quoteDetails?.adminDiscount?.discountValue > 0 && (
                                                            <>
                                                                <Typography color="gray" variant="h6">Admin Discount Requested:</Typography>
                                                                <Typography>{adminDiscountValueDisplay} (Awaiting approval)</Typography>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    }
                                    {bookingData?.serviceType == 'AUTO' &&
                                                <Button fullWidth className='my-6 mx-2 bg-primary' onClick={() => getQuoteRides(values, setFieldValue)}>
                                                    Check Estimated Price
                                        </Button>
                                    }
                                {bookingData?.serviceType == "AUTO" &&                                 <div className="flex justify-center my-6 gap-4">
                                        <Button
                                            color="gray"
                                            onClick={onBackPressHandler}
                                            className='my-6 mx-2 '
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            color="blue"
                                            onClick={() => {
                                                setFieldValue("submitType", "auto");
                                                handleSubmit()
                                            }}
                                    disabled={!dirty || !isValid || (!values.pickupAddress && !values.dropAddress)}
                                            className='my-6 mx-2'
                                        >
                                    Confirm Booking
                                        </Button>
                                    </div>}
                                </>
                            )
                        }}
                    </Formik>
                </>)}
            <DistanceExceedModal isVisible={dropTaxiDistanceExceedModal} onClose={() => { setDropTaxiDistanceExceedModal(false); }} title="Going a bit far?" content="You can choose Outstation within 300km only for the DropTaxi service." />
            <DistanceExceedModal isVisible={distanceExceedModal} onClose={() => { setDistanceExceedModal(false); }} title="Going a bit far?" content="Rides above 15 km are allowed only through DropTaxi or Outstation service." />
            <DistanceExceedModal isVisible={cityLimitExceedModal} onClose={() => { setCityLimitExceedModal(false); }} title="Oops!" content="We currently serve only Vellore, Kanchipuram, Tiruvannamalai. Try another pickup location nearby." />
            <DistanceExceedModal isVisible={zoneErrorModal.show} onClose={() => { setZoneErrorModal({ show: false }); }} title={zoneErrorModal.title} content={zoneErrorModal.text} />
        </div>
    );
};

export default EditBooking;
