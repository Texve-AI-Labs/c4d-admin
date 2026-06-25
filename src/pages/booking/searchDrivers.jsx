import React, { useEffect, useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Chip,
    Button,
    Checkbox,
    Popover,
    PopoverHandler,
    PopoverContent,
    Progress,
    Spinner,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import DriverSearch from '@/components/DriverSearch';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import ConfirmBooking from './confirmBooking';
import { ColorStyles } from '@/utils/constants';
import { FaFilter } from 'react-icons/fa';

export function SearchDrivers(props) {
    const [drivers, setDrivers] = useState([]);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [loading, setLoading] = useState(false);
    const [loadingRides, setLoadingRides] = useState(false);
    const [statusCheckedDriverIds, setStatusCheckedDriverIds] = useState([]);
    const [checkingStatusDriverIds, setCheckingStatusDriverIds] = useState([]);
    const [cabTypeFilter, setCabTypeFilter] = useState(['All']);
    const [checkingAllStatus, setCheckingAllStatus] = useState(false);
    const [seconds, setSeconds] = useState(30);
    const parcelVehicleType = props?.bookingData?.parcelVehicleType || "BIKE";
    const parcelSubZoneId =  props?.bookingData?.subZoneId || null;
    const shouldIncludeParcelSubZone = Boolean(parcelSubZoneId) && parcelVehicleType !== "AUTO";
    const isParcelAuto = props?.bookingData?.serviceType === "PARCEL" && parcelVehicleType === "AUTO";
    const showParcelSubZone = props?.bookingData?.serviceType === "PARCEL" && parcelVehicleType === "BIKE";
    const parcelVehicleLabel = isParcelAuto ? "Auto" : "Bike";
    const parcelVehiclePlural = isParcelAuto ? "Autos" : "Bikes";
    const bookingStatus = String(
        props?.bookingData?.status ||
        props?.bookingData?.fullData?.status ||
        drivers?.[0]?.fullData?.status ||
        ''
    ).toUpperCase();
    const isBookingAccepted = bookingStatus === "BOOKING_ACCEPTED" || (
        props?.bookingData?.requestType === "REQUEST_ALL" && drivers.length > 0
    );
    const laterButtonLabel = isBookingAccepted
        ? "Go To List"
        : props?.bookingData?.serviceType !== "DRIVER"
            ? "Assign Cab Later"
            : "Assign Captain Later";
    const assignButtonLabel = isBookingAccepted
        ? "Go To List"
        : props?.bookingData?.serviceType === "AUTO"
            ? "Assign Auto"
            : props?.bookingData?.serviceType === "PARCEL"
                ? `Assign ${parcelVehicleLabel}`
                : props?.bookingData?.serviceType !== "DRIVER"
                    ? "Assign Cab"
                    : "Assign Captain";

    const checkPresence = async (driverId, rowId) => {
        setCheckingStatusDriverIds((prev) => [...prev, driverId]);

        try {
            const ids = Array.isArray(driverId) ? driverId : [driverId];
            const result = await ApiRequestUtils.post(API_ROUTES.CHECK_PRESENCE, { driverId: ids });
            // console.log("Checking presence for driver ID:", ids);

            setTimeout(async () => {
                await getDriversList();
                setCheckingStatusDriverIds(prev => prev.filter(id => id !== driverId));
                setStatusCheckedDriverIds(prev => [...prev, driverId]);
            }, 30000);
        } catch (error) {
            console.error("Error checking presence:", error);
            setCheckingStatusDriverIds(prev => prev.filter(id => id !== driverId));
        }
    };

    const CountdownTimer = ({ duration = 30 }) => {
  const [seconds, setSeconds] = useState(duration);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  return <span>{seconds}</span>;
};

    const checkAllStatus = async () => {
        const driversToCheck = drivers.filter(
            (driver) => 
                driver.Drivers?.length > 0 && 
                !statusCheckedDriverIds.includes(driver.Drivers[0]?.id) &&
                driver.status === "ACTIVE"
        );

        if (driversToCheck.length === 0) {
            console.log("No drivers available to check status");
            return;
        }

        setCheckingAllStatus(true);
        setCheckingStatusDriverIds(driversToCheck.map(d => d.Drivers[0].id));
        
        try {
            const allDriverIds = driversToCheck.flatMap(driver =>
                driver.Drivers.map(d => d.id)
            );
            // console.log("Checking presence for driver IDs:", allDriverIds);
            await ApiRequestUtils.post(API_ROUTES.CHECK_PRESENCE, {
                driverId: allDriverIds
            });


            setTimeout(async () => {
                await getDriversList();
                setStatusCheckedDriverIds(prev => [
                    ...prev,
                    ...driversToCheck.map(d => d.Drivers[0].id)
                ]);
                setCheckingStatusDriverIds([]);
                setCheckingAllStatus(false);
                console.log("All driver statuses checked");
            }, 30000);
        
        } catch (error) {
            console.error("Error checking presence:", error);
            setCheckingStatusDriverIds([]);
            setCheckingAllStatus(false);
        }
    };
//     const AnimatedProgress = ({ duration = 30000 }) => {
//   const [progress, setProgress] = useState(0);

//   useEffect(() => {
//     let startTime = null;
//     let animationFrameId = null;

//     const animate = (timestamp) => {
//       if (!startTime) startTime = timestamp;
//       const elapsed = timestamp - startTime;
//       const newProgress = Math.min((elapsed / duration) * 100, 100);
//       setProgress(newProgress);

//       if (elapsed < duration) {
//         animationFrameId = requestAnimationFrame(animate);
//       }
//     };

//     animationFrameId = requestAnimationFrame(animate);

//     return () => {
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, [duration]);

//   return <Progress value={progress} size="sm" color="blue" className="w-16 inline-block ml-1" />;
// };


    const getDriversList = async (searchQuery = '') => {
        setLoading(true);
        try {
            if (searchQuery !== '') {
                const isNumeric = /^\d+$/.test(searchQuery);
                const pattern = isNumeric ? `^\\+91${searchQuery}` : searchQuery;
                const regex = new RegExp(pattern, 'i');
                const filtredOptions = drivers.filter((option) => {
                    if (isNumeric) {
                        return regex.test(option.phoneNumber);
                    } else {
                        const nameField = props.bookingData.serviceType === 'DRIVER' ? option.firstName : option.name;
                        return regex.test(nameField);
                    }
                });
                setDrivers(filtredOptions);
            } else if (props.bookingData.serviceType === 'RIDES' && props.bookingData.requestType === 'REQUEST_ALL') {
                setLoadingRides(true);
                try {
                    let data = {
                        'bookingId': props.bookingData.id,
                        'customerId': props.bookingData.CustomerId
                    }
                    let requestDriver = await ApiRequestUtils.post(API_ROUTES.GET_RIDES_CAB_DRIVERS, data);
                    if (requestDriver?.success) {
                        setDrivers([]);
                        setTimeout(async () => {
                            console.log("30 seconds passed. Checking driver availability...");
                            let checkDriverStatus = await ApiRequestUtils.get(API_ROUTES.RIDES_DRIVER_LIST + '/' + props.bookingData.id);
                            if (checkDriverStatus?.data?.length > 0) {
                                const formattedDrivers = checkDriverStatus.data.map((item) => ({
                                    id: item.cabId,
                                    name: item.Driver?.Cab?.name || 'N/A',
                                    driverName: item.Driver?.firstName || 'N/A',
                                    status: item.Shift?.availability === "AVAILABLE" ? "ACTIVE" : "INACTIVE",
                                    carType: item.Driver?.Cab?.carType || '',
                                    phoneNumber: item.Driver?.phoneNumber || '',
                                    priceOffered: item.offerPrice || item.driverPrice || 0,
                                    tripCount: item.Driver?.totalRides || 0,
                                    Drivers: [{ id: item.DriverId }],
                                    fullData: item,
                                    curAddress: item.Shift?.curAddress?.name || '',
                                    travelDistance: item.travelDistance || '',
                                    travelDuration: item.travelDuration || 0,
                                    intercityCount: item.localCount || 0,
                                    outstationCount: item.outstationCount || 0,
                                }));
                                console.log("Formatted Drivers:", formattedDrivers);
                                setDrivers(formattedDrivers);
                            } else {
                                console.log("No driver found.");
                                setDrivers([]);
                            }
                            setLoadingRides(false);
                        }, 30000);
                    } else {
                        setLoadingRides(false);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error("Error in sendDriverRequest:", error);
                }
            } else if (props.bookingData.serviceType === 'RENTAL' && props.bookingData.requestType == 'REQUEST_ALL') {
                setLoadingRides(true);
                try {
                    let data = {
                        bookingId: props.bookingData.id,
                        customerId: props.bookingData.CustomerId,
                        lat: props?.bookingData?.pickupLat,
                        long: props?.bookingData?.pickupLong,
                        distance: 0,
                        type: "Both",
                        packageId: props?.bookingData?.packageId,
                    }
                    let requestDriver = await ApiRequestUtils.post(API_ROUTES.GET_RENTAL_CAB_DRIVERS, data);
                    if (requestDriver?.success) {
                        setDrivers([]);
                        setTimeout(async () => {
                            console.log("30 seconds passed. Checking driver availability...");
                            let checkDriverStatus = await ApiRequestUtils.get(API_ROUTES.RIDES_DRIVER_LIST + '/' + props.bookingData.id);
                            if (checkDriverStatus?.data?.length > 0) {
                                const formattedDrivers = checkDriverStatus.data.map((item) => ({
                                    id: item.Driver?.Cab?.id,
                                    name: item.Driver?.Cab?.name || 'N/A',
                                    driverName: item.Driver?.firstName || 'N/A',
                                    status: item.Shift?.availability === "AVAILABLE" ? "ACTIVE" : "INACTIVE",
                                    carType: item.Driver?.Cab?.carType || '',
                                    phoneNumber: item.Driver?.phoneNumber || '',
                                    priceOffered: item.offerPrice || item.driverPrice || 0,
                                    tripCount: item.Driver?.totalRides || 0,
                                    Drivers: [{ id: item.DriverId }],
                                    fullData: item,
                                    curAddress: item.Shift?.curAddress?.name || '',
                                    travelDistance: item.travelDistance || '',
                                    travelDuration: item.travelDuration || 0,
                                    intercityCount: item.localCount || 0,
                                    outstationCount: item.outstationCount || 0,
                                }));
                                setDrivers(formattedDrivers);
                            } else {
                                console.log("No driver found.");
                                setDrivers([]);
                            }
                            setLoadingRides(false);
                        }, 30000);
                    } else {
                        setLoadingRides(false);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error("Error in sendDriverRequest:", error);
                }
            } else if (props.bookingData.serviceType === 'AUTO' && props.bookingData.requestType === 'REQUEST_ALL') {
                setLoadingRides(true);
                try {
                    let data = {
                        bookingId: props.bookingData.id,
                        distance: 1, // Adjust if distance is available in bookingData
                        customerId: props.bookingData.CustomerId
                    };
                    let requestDriver = await ApiRequestUtils.post('/search/auto', data);
                    if (requestDriver?.success) {
                        setDrivers([]);
                        setTimeout(async () => {
                            console.log("30 seconds passed. Checking driver availability...");
                            let checkDriverStatus = await ApiRequestUtils.get(API_ROUTES.RIDES_DRIVER_LIST + '/' + props.bookingData.id);
                            if (checkDriverStatus?.data?.length > 0) {
                                const formattedDrivers = checkDriverStatus.data.map((item) => ({
                                    id: item.cabId || item.Driver?.Cab?.id || item.id,
                                    name: item.Driver?.Cab?.name || item.name || 'N/A',
                                    driverName: item.Driver?.firstName || 'N/A',
                                    status: item.Shift?.availability === "AVAILABLE" ? "ACTIVE" : "INACTIVE",
                                    carType: item.Driver?.Cab?.carType || 'AUTO',
                                    phoneNumber: item.Driver?.phoneNumber || '',
                                    priceOffered: item.offerPrice || item.driverPrice || 0,
                                    tripCount: item.Driver?.totalRides || 0,
                                    Drivers: [{ id: item.DriverId || item.Driver?.id }],
                                    fullData: item,
                                    curAddress: item.Shift?.curAddress?.name || item.curAddress || '',
                                    travelDistance: item.travelDistance || '',
                                    travelDuration: item.travelDuration || 0,
                                    intercityCount: item.localCount || 0,
                                    outstationCount: item.outstationCount || 0,
                                }));
                                console.log("Formatted Drivers for AUTO:", formattedDrivers);
                                setDrivers(formattedDrivers);
                            } else {
                                console.log("No driver found.");
                                setDrivers([]);
                            }
                            setLoadingRides(false);
                        }, 30000);
                    } else {
                        setLoadingRides(false);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error("Error in sendDriverRequest for AUTO:", error);
                }
            } else if (props.bookingData.serviceType === 'PARCEL' && props.bookingData.requestType === 'REQUEST_ALL') {
                setLoadingRides(true);
                try {
                    let data = {
                        bookingId: props.bookingData.id,
                        distance: 0,
                        customerId: props.bookingData.CustomerId,
                        serviceType: "PARCEL",
                        parcelVehicleType,
                        ...(shouldIncludeParcelSubZone ? { subZoneId: parcelSubZoneId } : {}),
                    };
                    let requestDriver = await ApiRequestUtils.post('/search/parcel', data);
                    if (requestDriver?.success) {
                        setDrivers([]);
                        setTimeout(async () => {
                            console.log("30 seconds passed. Checking driver availability...");
                            let checkDriverStatus = await ApiRequestUtils.get(API_ROUTES.RIDES_DRIVER_LIST + '/' + props.bookingData.id);
                            if (checkDriverStatus?.data?.length > 0) {
                                const formattedDrivers = checkDriverStatus.data.map((item) => ({
                                    id: item.cabId || item.Driver?.Cab?.id || item.id,
                                    name: item.Driver?.Cab?.name || item.name || 'N/A',
                                    driverName: item.Driver?.firstName || 'N/A',
                                    status: item.Shift?.availability === "AVAILABLE" ? "ACTIVE" : "INACTIVE",
                                    phoneNumber: item.Driver?.phoneNumber || '',
                                    priceOffered: item.offerPrice || item.driverPrice || 0,
                                    tripCount: item.Driver?.totalRides || 0,
                                    Drivers: [{ id: item.DriverId || item.Driver?.id }],
                                    fullData: item,
                                    curAddress: item.Shift?.curAddress?.name || item.curAddress || '',
                                    travelDistance: item.travelDistance || '',
                                    travelDuration: item.travelDuration || 0,
                                }));
                                console.log(`Formatted Drivers for ${parcelVehicleLabel}:`, formattedDrivers);
                                setDrivers(formattedDrivers);
                            } else {
                                console.log("No driver found.");
                                setDrivers([]);
                            }
                            setLoadingRides(false);
                        }, 30000);
                    } else {
                        setLoadingRides(false);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error(`Error in sendDriverRequest for ${parcelVehicleLabel}:`, error);
                }
            } else {
                let data;
                if (props.bookingData.serviceType === 'DRIVER') {
                    let api = API_ROUTES.GET_DRIVERS_PACKAGE;
                    let queryObj = {
                        latitude: props?.bookingData?.pickupLat,
                        longitude: props?.bookingData?.pickupLong,
                        type: props?.bookingData?.packageType,
                    }
                    data = await ApiRequestUtils.getWithQueryParam(api, queryObj);
                } else if (props.bookingData.serviceType === 'AUTO') {
                    setLoadingRides(false);
                    data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_AUTO_PACKAGE, {
                        latitude: props?.bookingData?.pickupLat,
                        longitude: props?.bookingData?.pickupLong,
                    });
                } else if (props.bookingData.serviceType === 'PARCEL') {
                    setLoadingRides(false);
                    data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_BIKE_PACKAGE, {
                        latitude: props?.bookingData?.pickupLat,
                        longitude: props?.bookingData?.pickupLong,
                        bookingId: props.bookingData.id,
                        serviceType: "PARCEL",
                        parcelVehicleType,
                        ...(shouldIncludeParcelSubZone ? { subZoneId: parcelSubZoneId } : {}),
                    });
                    // console.log("Bike Package Data:", data);
                }
                else {
                    data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_CABS_PACKAGE, {
                        latitude: props?.bookingData?.pickupLat,
                        longitude: props?.bookingData?.pickupLong,
                    });
                }
                if (data?.success) {
                    let driverData = data?.data
                    let filteredDrivers = driverData.map((val) => ({ ...val, fullData: val }))
                    setDrivers(filteredDrivers);
                } else {
                    setDrivers([]);
                }
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);

        const sortedDrivers = [...drivers].sort((a, b) => {
            if (!a[field] && !b[field]) return 0;
            if (!a[field]) return 1;
            if (!b[field]) return -1;

            const aValue = ['intercityCount', 'outstationCount', 'distance'].includes(field)
                ? Number(a[field])
                : a[field];
            const bValue = ['intercityCount', 'outstationCount', 'distance'].includes(field)
                ? Number(b[field])
                : b[field];

            if (newDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        setDrivers(sortedDrivers);
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />;
    };

    useEffect(() => {
        if (props?.bookingData) {
            getDriversList();
        }
    }, [props.bookingData]);

    const onAssignDriver = async (service, driverId, cabDriverId, fullData) => {
        if (service == "RENTAL" && props?.bookingData?.requestType == 'REQUEST_ALL') {
            const reqBody = {
                bookingId: fullData.BookingId,
                status: 'BOOKING_ACCEPTED',
                driverId: cabDriverId,
                shiftId: fullData.ShiftId,
                cabId: driverId,
                offerPrice: fullData.offerPrice,
                estimatedDistance: fullData.estimatedDistance,
                estimatedMin: fullData.estimatedMin,
                packageId: fullData.package,
                // fromWebportal: true,
            };
            const data = await ApiRequestUtils.update(API_ROUTES.CONFIRM_RENTAL_BOOKING, reqBody);
            if (data?.success) {
                props?.onNext();
            } else if (
                data?.code === 403 &&
                data?.error === "Selected Cab is not available. Please choose another Cab."
            ) {
                const updatedDriverList = await ApiRequestUtils.get(`${API_ROUTES.RIDES_DRIVER_LIST}/${bookingId}`);
                if (updatedDriverList?.data?.length > 0) {
                    const formattedDrivers = updatedDriverList.data.map((item) => ({
                        id: item.Driver?.Cab?.id,
                        name: item.Driver?.firstName || 'N/A',
                        status: item.Shift?.availability === "AVAILABLE" ? "ACTIVE" : "INACTIVE",
                        carType: item.Driver?.Cab?.carType || '',
                        phoneNumber: item.Driver?.phoneNumber || '',
                        priceOffered: item.offerPrice || item.driverPrice || 0,
                        tripCount: item.Driver?.totalRides || 0,
                        Drivers: [{ id: item.DriverId }],
                        intercityCount: item.localCount || 0,
                        outstationCount: item.outstationCount || 0,
                    }));
                    setDrivers(formattedDrivers);
                } else {
                    setDrivers([]);
                    console.log("No drivers found.");
                }
            }
        } else if (service === "RENTAL") {
            const reqBody = {
                bookingId: props?.bookingData?.id,
                driverId: cabDriverId,
                status: 'BOOKING_ACCEPTED',
                packageId: props?.bookingData?.packageId,
                // from: 'WEBPORTAL',
                shiftId: fullData?.Shifts[0]?.id,
                cabId:fullData.Shifts[0].cabId,
                offerPrice: fullData.offerPrice || null,
                estimatedDistance: fullData.estimatedDistance || null,
                estimatedMin: fullData.estimatedMin || null,
                // packageId: fullData.package,
                // fromWebportal: true,
            }
            let data = await ApiRequestUtils.update(API_ROUTES.CONFIRM_RENTAL_BOOKING, reqBody);
            if (data?.success) {
                props?.onNext();
            }
        } 
        else if (service === "AUTO")
        {
            const reqBody = {
                bookingId: props?.bookingData?.id,
                status: 'BOOKING_ACCEPTED',
                driverId: cabDriverId,
                shiftId: fullData?.Shift?.id || fullData?.Shifts?.[0]?.id,
                autoId: fullData?.id,
                offerPrice: fullData?.offerPrice || 0,
                estimatedDistance: fullData?.travelDistance,
                estimatedMin: fullData?.travelDuration,
                zone: fullData?.Booking?.zone || props?.bookingData?.zone,
            };
            const data = await ApiRequestUtils.update(API_ROUTES.ASSIGN_AUTO, reqBody);
            if (data?.success) {
                props?.onNext();
            }           
        } else if (service === "PARCEL") {
            const baseReqBody = {
                bookingId: props?.bookingData?.id,
                driverId: cabDriverId || fullData?.DriverId || fullData?.driverId || fullData?.Driver?.id || fullData?.driver?.id,
                status: 'BOOKING_ACCEPTED',
                serviceType: "PARCEL",
                packageId: props?.bookingData?.packageId,
                shiftId:  fullData?.ShiftId || fullData?.shiftId || fullData?.Shift?.id || fullData?.Shifts?.[0]?.id,
                parcelVehicleType: parcelVehicleType,
                ...(shouldIncludeParcelSubZone ? { subZoneId: parcelSubZoneId } : {}),
            };
            let reqBody;
            if (parcelVehicleType === "AUTO") {
                reqBody = {
                    ...baseReqBody,
                    autoId: fullData?.autoId || fullData?.Auto?.id || fullData?.id,
                };
            }  else {
                reqBody = {
                    ...baseReqBody,
                parcelId: fullData?.parcelId || fullData?.Parcel?.id || fullData?.driver?.Parcel?.id || fullData?.Driver?.Parcel?.id || fullData?.id || driverId,
                };
            }
                let data = await ApiRequestUtils.update(API_ROUTES.CONFIRM_PARCEL_BOOKING, reqBody);
            if (data?.success) {
                props?.onNext();
            }           
        } else if (service != "RIDES") {
            const reqBody = {
                bookingId: props?.bookingData?.id,
            };
            if (service == "RIDES" || service == "RENTAL") {
                reqBody.cabId = driverId;
                reqBody.driverId = cabDriverId;
            } else {
                reqBody.driverId = cabDriverId;
            }
            const data = await ApiRequestUtils.update(API_ROUTES.UPATE_ADMIN_BOOKINGS, reqBody, props?.bookingData?.customerId);
            if (data?.success) {
                props?.onNext();
            }
        } else if (service == "RIDES") {
            const reqBody = {
                bookingId: props?.bookingData?.id,
                status: 'BOOKING_ACCEPTED',
                driverId: cabDriverId,
                shiftId: fullData?.Shift?.id || fullData?.Shifts?.[0]?.id,
                cabId: driverId,
                offerPrice: fullData?.offerPrice || 0,
                estimatedDistance: fullData?.travelDistance,
                estimatedMin: fullData?.travelDuration,
                zone: fullData?.Booking?.zone || props?.bookingData?.zone,
                // fromWebportal: true,
            };
            const data = await ApiRequestUtils.update(API_ROUTES.CONFIRM_RIDES_BOOKING, reqBody);
            if (data?.success) {
                props?.onNext();
            } else if (
                data?.code === 403 &&
                data?.error === "Selected Cab is not available. Please choose another Cab."
            ) {
                const updatedDriverList = await ApiRequestUtils.get(`${API_ROUTES.RIDES_DRIVER_LIST}/${bookingId}`);
                if (updatedDriverList?.data?.length > 0) {
                    const formattedDrivers = updatedDriverList.data.map((item) => ({
                        id: item.cabId,
                        name: item.Driver?.firstName || 'N/A',
                        status: item.Shift?.availability === "AVAILABLE" ? "ACTIVE" : "INACTIVE",
                        carType: item.Driver?.Cab?.carType || '',
                        phoneNumber: item.Driver?.phoneNumber || '',
                        priceOffered: item.offerPrice || item.driverPrice || 0,
                        tripCount: item.Driver?.totalRides || 0,
                        Drivers: [{ id: item.DriverId }],
                        intercityCount: item.localCount || 0,
                        outstationCount: item.outstationCount || 0,
                    }));
                    setDrivers(formattedDrivers);
                } else {
                    setDrivers([]);
                    console.log("No drivers found.");
                }
            }
        }
    };

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'carType') {
            setCabTypeFilter(prev => {
                const newFilter = value === 'All'
                    ? ['All']
                    : prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev.filter(item => item !== 'All'), value];
                return newFilter.length === 0 ? ['All'] : newFilter;
            });
        }
    };

    const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
        <Popover placement="bottom-start">
            <PopoverHandler>
                <div className="flex items-center cursor-pointer">
                    <Typography variant="small" className="text-[11px] font-bold uppercase mr-1 text-blue-gray-400">
                        {title}
                    </Typography>
                    <FaFilter className="text-gray-600 text-xs" />
                </div>
            </PopoverHandler>
            <PopoverContent className="p-2 z-50 bg-white shadow-lg">
                {options.map((option) => (
                    <div key={option.value} className="flex items-center mb-2">
                        <Checkbox
                            color="blue"
                            checked={selectedFilters.includes(option.value)}
                            onChange={() => onFilterChange('carType', option.value)}
                        />
                        <Typography color="blue-gray" className="font-medium ml-2">
                            {option.label}
                        </Typography>
                    </div>
                ))}
            </PopoverContent>
        </Popover>
    );
    useEffect(() => {
        if ( props.bookingData?.requestType === 'REQUEST_ALL' && drivers.length === 1  && drivers[0]?.fullData) 
            {
            const timer = setTimeout(() => {
                onAssignDriver(props.bookingData.serviceType,drivers[0].id,drivers[0].Drivers?.[0]?.id || drivers[0].fullData.DriverId,drivers[0].fullData);
            },2000);
            return () => clearTimeout(timer);
        }
    }, [drivers, props.bookingData?.requestType]);

    return (
        <>
            <ConfirmBooking bookingData={props.bookingData} hideAllNewButton={true} />
            {props?.bookingData?.serviceType === 'DRIVER' && (
                <div className="flex flex-col w-full gap-y-4">
                    <Card>
                        {loading ? (
                            <CardHeader variant="gradient" color="blue" className="mb-8 p-6">
                                <Typography variant="h6" color="white">
                                    {`Loading drivers....`}
                                </Typography>
                            </CardHeader>
                        ) : drivers.length > 0 ? (
                            <CardBody className="overflow-x-auto overflow-y-auto px-0 pt-0 pb-2">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            {["Name", "Phone Number", "Current Address", "Distance", "Local Count", "Outstation Count", "Status", "Assign/ReAssign"].map((el) => (
                                                <th
                                                    key={el}
                                                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                                >
                                                    <Typography
                                                        variant="small"
                                                        className="text-[11px] font-bold uppercase text-blue-gray-400 flex items-center cursor-pointer"
                                                        onClick={() => {
                                                            ['Local Count', 'Outstation Count', 'Distance'].includes(el) && handleSort(el === 'Local Count' ? 'localCount' : el === 'Distance' ? 'distance' : 'outstationCount')
                                                        }}
                                                    >
                                                        {el}
                                                        {['Local Count', 'Outstation Count', 'Distance'].includes(el) && <SortIcon field={el === 'Local Count' ? 'localCount' : el === 'Distance' ? 'distance' : 'outstationCount'} />}
                                                    </Typography>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.map(
                                            ({ id, firstName, name, Shifts, curAddress, status, phoneNumber, distance, localCount, outstationCount, Drivers }, key) => {
                                                const className = `py-3 px-5 ${key === drivers.length - 1
                                                    ? ""
                                                    : "border-b border-blue-gray-50"
                                                    }`;

                                                return (
                                                    <tr key={id}>
                                                        <td className={className}>
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <Typography
                                                                        variant="small"
                                                                        color="blue-gray"
                                                                        className="font-semibold"
                                                                    >
                                                                        {props?.bookingData?.serviceType == "CAB" ? name : firstName}
                                                                    </Typography>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {(props?.bookingData?.serviceType === "CAB" && Drivers?.[0]?.phoneNumber) ? Drivers?.[0]?.phoneNumber : phoneNumber}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className='text-xs font-semibold text-blue-gray-600'>
                                                                {Shifts?.[0]?.curAddress?.name || curAddress?.name}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {(props?.bookingData?.serviceType == "CAB" && Drivers?.[0]?.distance) ? `${Math.round(Drivers?.[0]?.distance)} km` : distance ? `${Math.round(distance)} km` : 'Unknown'}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {localCount}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {outstationCount}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Chip
                                                                variant="ghost"
                                                                color={status === "ACTIVE" ? "green" : "blue-gray"}
                                                                value={status === "ACTIVE" ? "Available" : "Not Available"}
                                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                            />
                                                            {status === 'ACTIVE' &&  props.bookingData.requestType !== 'REQUEST_ALL' &&
                                                                !statusCheckedDriverIds.includes(Drivers?.[0]?.id) && (
                                                                    checkingStatusDriverIds.includes(Drivers?.[0]?.id) ? (
                                                                       <div className='flex justify-center items-center'>
                                                                                <Spinner className="h-4 w-4" />
                                                                        </div>
                                                                    ) : (
                                                                        <Typography
                                                                            className="text-xs font-semibold text-primary-900 underline cursor-pointer"
                                                                            onClick={() => {checkPresence(props?.bookingData?.serviceType === 'DRIVER'? id : Drivers[0]?.id )                                                                            }}
                                                                        >
                                                                            Check Status
                                                                        </Typography>
                                                                    )
                                                                )}
                                                        </td>
                                                        <td className={className}>
                                                            {status === "ACTIVE" && <Button
                                                                as="a"
                                                                onClick={() => { onAssignDriver(props?.bookingData?.serviceType, id, props?.bookingData?.serviceType == 'DRIVER' ? id : Drivers[0]?.id) }}
                                                                className="text-xs font-semibold text-white bg-primary"
                                                            >
                                                                {assignButtonLabel}
                                                            </Button>}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </CardBody>) : (
                            <CardHeader variant="gradient" color="blue" className="mb-8 p-6">
                                <Typography variant="h6" color="white">
                                    {`No ${props?.bookingData?.serviceType == "CAB" ? 'cabs' : 'drivers'} Near By`}
                                </Typography>
                            </CardHeader>
                        )}
                    </Card>
                    <div className=''>
                        <Button
                            fullWidth
                            onClick={() => { props?.onNext() }}
                            className='text-white border-2 bg-primary rounded-xl'
                        >
                            {laterButtonLabel}
                        </Button>
                    </div>
                </div >
            )}
            {props?.bookingData?.serviceType !== 'DRIVER' && (
                <div className="flex flex-col w-full">
                    <Card>
                        {props.bookingData?.requestType === 'REQUEST_ALL' ? (
                            <CardBody className="py-16">
                                <div className="text-center max-w-md mx-auto">
                        {loadingRides ? (
                                        <div>
                                            <Spinner className="h-16 w-16 mx-auto mb-6" color="blue" />
                                <Typography variant="h5" color="blue-gray" className="mb-3">
                                Request Sent to Nearby Drivers
                                </Typography>
                                            <Typography color="gray" className="mb-6 text-lg">
                                                Waiting for a driver to accept...
                                            </Typography>
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="text-5xl font-bold text-blue-600">
                                                    <CountdownTimer duration={30} />
                                                </div>
                                                <Progress
                                                    value={((30 - seconds) / 30) * 100}
                                                    color="blue"
                                                    className="w-80 h-4"
                                                />
                                                <Typography color="gray" className="text-sm">
                                                    Please wait while drivers respond
                                                </Typography>
                                            </div>
                                        </div>
                                    ) : drivers.length > 0 ? (
                                        <div>
                                            <Typography variant="h4" color="green" className="mb-3 font-bold">
                                                Driver Accepted!
                                            </Typography>
                                            <Typography color="gray" className="mb-6">
                                                Great! A driver has accepted the ride.
                                            </Typography>
                                            {drivers[0] && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                                                    <Typography variant="lead" className="font-bold text-green-800">
                                                        {(drivers[0].driverName || drivers[0].name || 'Driver')}
                                                    </Typography>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <Typography variant="h4" color="red" className="mb-3 font-bold">
                                                No Response
                                            </Typography>
                                            <Typography color="gray" className="mb-6 max-w-sm">
                                                No driver accepted the request in 30 seconds.
                                            </Typography>
                                            {/* <Button color="blue" onClick={() => props?.onNext()}>
                                                Assign Manually
                                            </Button> */}
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        ) : ( loading ? (
                            <CardHeader variant="gradient" color="blue" className="mb-8 p-6">
                                <Typography variant="h6" color="white">
                                    {`Loading ${props.bookingData.serviceType=== "AUTO"
                                        ? "Autos"
                                        : props.bookingData.serviceType=== "PARCEL" ? parcelVehiclePlural
                                            : "Cabs"
                                        }...`}
                                </Typography>
                            </CardHeader>
                        ) : drivers.length > 0 ? (
                            <CardBody className="overflow-x-auto overflow-y-auto w-full px-0 pt-0 pb-2">
                                    <div className="flex justify-end mb-4">
                                        <Button
                                            color="red"
                                            size="sm"
                                            className="w-36"
                                            onClick={checkAllStatus}
                                            disabled={checkingAllStatus}
                                        >
                                            {checkingAllStatus ? (
                                                <div className="flex items-center justify-center">
                                                    <Spinner className="h-4 w-4 mr-2" />
                                                    {/* <AnimatedProgress duration={30000} /> */}
                                                    Checking...
                                                </div>
                                            ) : "Check All Status"}
                                        </Button>
                                    </div>
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            {[props.bookingData.serviceType === "AUTO" ? "Auto Name" : props.bookingData.serviceType === "PARCEL" ? `${parcelVehicleLabel} Name` : "Cab Name", "Driver Name", "Phone Number", "Current Address",
                                            ...(showParcelSubZone ? ["sub Zone"] : []),
                                            ...(props.bookingData?.serviceType !== "AUTO" && props.bookingData?.serviceType !== "PARCEL" ? ["Cab Type"] : []), 
                                            ...(props.bookingData?.serviceType !== "AUTO" && props.bookingData?.serviceType !== "PARCEL" ? ["Local Count"] : []),
                                            ...(props.bookingData?.serviceType !== "AUTO" && props.bookingData?.serviceType !== "PARCEL" ? ["Outstation Count"] : []), "Status", 
                                            ...(props.bookingData?.serviceType !== "PARCEL" ? ["Travel Distance", "Travel Duration"] : []), "Assign/Reassign"].map((el) => (
                                                    <th
                                                        key={el}
                                                        className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                                    >
                                                        {el === "Cab Type" ? (
                                                            <FilterPopover
                                                                title={el}
                                                                options={[
                                                                        { value: "All", label: "All" },
                                                                    { value: "MINI", label: "Mini" },
                                                                    { value: "Sedan", label: "Sedan" },
                                                                    { value: "SUV", label: "Suv" },
                                                                    { value: "MUV", label: "Muv" },
                                                                ]}
                                                                selectedFilters={cabTypeFilter}
                                                                onFilterChange={handleFilterChange}
                                                            />
                                                        ) : (
                                                            <Typography
                                                                variant="small"
                                                                className="text-[11px] font-bold uppercase text-blue-gray-400 flex items-center cursor-pointer"
                                                            >
                                                                {el}
                                                            </Typography>
                                                        )}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.filter(driver => cabTypeFilter.includes('All') || cabTypeFilter.includes(driver.carType)).map(
                                            ({ id, name, status, carType, Shifts, priceOffered, driver,curAddress, outstationCount, intercityCount, travelDistance, travelDuration, driverName, tripCount, subZoneName,firstName, phoneNumber, Drivers, fullData }, key) => {
                                                const className = `py-3 px-5 ${key === drivers.length - 1
                                                    ? ""
                                                    : "border-b border-blue-gray-50"
                                                    }`;
                                                const rowDriverId = props?.bookingData?.serviceType === "PARCEL"
                                                    ? (Drivers?.[0]?.id || fullData?.driverId || fullData?.DriverId || fullData?.driver?.id || fullData?.Driver?.id)
                                                    : Drivers?.[0]?.id;

                                                return (
                                                    <tr key={id}>
                                                        <td className={className}>
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <Typography
                                                                        variant="small"
                                                                        color="blue-gray"
                                                                        className="font-semibold"
                                                                    >
                                                                        {name || driver?.Parcel?.name}
                                                                    </Typography>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {(Drivers?.[0]?.firstName) ? Drivers?.[0]?.firstName : firstName || driverName}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {(Drivers?.[0]?.phoneNumber) ? Drivers?.[0]?.phoneNumber : phoneNumber}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {(Shifts?.[0]?.curAddress?.name || curAddress?.name) || curAddress}
                                                            </Typography>
                                                        </td>
                                                        {showParcelSubZone && (
                                                            <td className={className}>
                                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                    {subZoneName}
                                                                </Typography>
                                                            </td>
                                                        )}
                                                        {props.bookingData.serviceType !== "AUTO" && props.bookingData.serviceType !== "PARCEL" && (
                                                            <>
                                                            <td className={className}>
                                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                    {carType}
                                                                </Typography>
                                                            </td>
                                                        
                                                        {/* {props.bookingData.requestType == 'REQUEST_ALL' &&
                                                            <td className={className}>
                                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                    {priceOffered}
                                                                </Typography>
                                                            </td>
                                                        } */}
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {intercityCount}
                                                            </Typography>
                                                        </td>
                                                            <td className={className}>
                                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                    {outstationCount}
                                                                </Typography>
                                                            </td>
                                                        </>
                                                       )}
                                                        <td className={className}>
                                                            <Chip
                                                                variant="ghost"
                                                                color={status === "ACTIVE" ? "green" : "blue-gray"}
                                                                value={status === "ACTIVE" ? "Available" : "Not Available"}
                                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                            />
                                                            {status === 'ACTIVE' &&  props.bookingData.requestType !== 'REQUEST_ALL' &&
                                                                !statusCheckedDriverIds.includes(rowDriverId) && (
                                                                    checkingStatusDriverIds.includes(rowDriverId) ? (
                                                                        <div className='flex justify-center items-center'>
                                                                                <Spinner className="h-4 w-4" />
                                                                        </div>
                                                                    ) : (
                                                                        <Typography
                                                                            className="text-xs font-semibold text-primary-900 underline cursor-pointer"
                                                                            onClick={() => {
                                                                                if (rowDriverId) {
                                                                                    checkPresence(rowDriverId, id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            Check Status
                                                                        </Typography>
                                                                    )
                                                                )}
                                                        </td>
                                                        {props.bookingData?.serviceType !== "PARCEL" && (
                                                            <>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {travelDistance}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {travelDuration} Min.
                                                            </Typography>
                                                        </td>
                                                            </>
                                                        )}                                                        
                                                        <td className={className}>
                                                            <Button
                                                                as="a"
                                                                onClick={() => {
                                                                    const selectedDriverId = props?.bookingData?.serviceType == 'DRIVER'
                                                                        ? 0
                                                                        : props?.bookingData?.serviceType === "PARCEL"
                                                                            ? (Drivers?.[0]?.id || fullData?.DriverId || fullData?.driverId || fullData?.Driver?.id || fullData?.driver?.id)
                                                                            : Drivers?.[0]?.id;
                                                                    onAssignDriver(props?.bookingData?.serviceType, id, selectedDriverId, fullData);
                                                                }}
                                                                className="text-xs font-semibold text-white bg-primary"
                                                            >
                                                                {props.bookingData.serviceType === "AUTO" ? "Assign Auto" : props?.bookingData.serviceType === "PARCEL" ? `Assign ${parcelVehicleLabel}` : "Assign Cab"}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </CardBody>
                        ) : (
                            <CardHeader variant="gradient" color="blue" className="mb-8 p-6">
                                <Typography variant="h6" color="white">
                                    {`No ${props.bookingData.serviceType === "AUTO" ? "Autos" 
                                    : props.bookingData.serviceType == "PARCEL" ? parcelVehiclePlural : "Cabs"} Near By`}
                                </Typography>
                            </CardHeader>
                            )
                        )}
                    </Card>
                    <div className=''>
                        <Button
                            fullWidth
                            onClick={() => { props?.onNext() }}
                            className='text-white border-2 bg-primary rounded-xl'
                        >
                            {laterButtonLabel}
                        </Button>
                    </div>
                </div >
            )}
        </>
    );
}

export default SearchDrivers;
