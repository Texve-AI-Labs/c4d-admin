import { Fragment, useState, useEffect, useMemo  } from "react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from 'react-router-dom';
import { Utils } from '@/utils/utils';
import Select from 'react-select';
import { ParcelExpandableRow } from "./ParcelExpandableRow";

const MASTER_PRICE_FILTER_STORAGE_KEY = "masterPriceViewFilters";
const EXPAND_ICON_PATH = "/img/expand.png";

const getStoredMasterPriceFilters = () => {
    if (typeof window === "undefined") return {};

    try {
        const storedFilters = window.sessionStorage.getItem(MASTER_PRICE_FILTER_STORAGE_KEY);
        return storedFilters ? JSON.parse(storedFilters) : {};
    } catch (error) {
        console.error("Error reading master price filters:", error);
        return {};
    }
};

export function MasterPriceView() {
    const [initialFilters] = useState(getStoredMasterPriceFilters);
    const normalizeText = (value) => String(value || "").trim().toLowerCase();
    const normalizeVehicleType = (value) => {
        const normalized = String(value || "").trim().toUpperCase();
        if (normalized === "AUTO" || normalized === "BIKE") return normalized;
        return "BIKE";
    };
    const parcelSubServiceOptions = [
        { value: "BIKE", label: "Bike" },
        { value: "AUTO", label: "Auto" },
    ];
    const [localPackageList, setLocalPackageList] = useState([]);
    const [outstationPackageList, setOutstationPackageList] = useState([]);
    const [autoLocalPackageList, setAutoLocalPackageList] = useState([]);
    const [bikeLocalPackageList, setBikeLocalPackageList] = useState([]);
    const [parcelLocalPackageList, setParcelLocalPackageList] = useState([]);
    const navigate = useNavigate();
    const [serviceType, setServiceType] = useState(initialFilters.serviceType || "");
    const [bookingType, setBookingType] = useState(initialFilters.bookingType || "");
    const [driverPackageList, setDriverPackageList] = useState([]);
    const [ridesData, setRidesData] = useState([]);
    // const [rentalsData, setRentalsData] = useState([]);
    const [zone, setZone] = useState(initialFilters.zone || "");
    const [parcelSubService, setParcelSubService] = useState(normalizeVehicleType(initialFilters.parcelSubService));
    const [showParcelGeoError, setShowParcelGeoError] = useState(false);
    const [serviceAreas, setServiceAreas] = useState([]);
    const [subZones, setSubZones] = useState([]);
    const [expandedRentalPeriods, setExpandedRentalPeriods] = useState({});

    const getRentalPeriodKey = (tableType, period) => `${tableType}:${period || "-"}`;
    const isRentalPeriodExpanded = (tableType, period) => expandedRentalPeriods[getRentalPeriodKey(tableType, period)] !== false;
    const toggleRentalPeriod = (tableType, period) => {
        const periodKey = getRentalPeriodKey(tableType, period);
        setExpandedRentalPeriods((previous) => ({
            ...previous,
            [periodKey]: previous[periodKey] === false,
        }));
    };
    const getPackageExpandKey = (tableType, packageId) => `${tableType}:package:${packageId || "-"}`;
    const isPackageExpanded = (tableType, packageId) => expandedRentalPeriods[getPackageExpandKey(tableType, packageId)] !== false;
    const togglePackageExpand = (tableType, packageId) => {
        const packageKey = getPackageExpandKey(tableType, packageId);
        setExpandedRentalPeriods((previous) => ({
            ...previous,
            [packageKey]: previous[packageKey] === false,
        }));
    };

    const applyDriverPackageFilter = (packages, selectedBookingType = bookingType) => {
        const filteredPackages = selectedBookingType
            ? packages.filter((item) => normalizeText(item.bookingType) === normalizeText(selectedBookingType))
            : packages;
        setLocalPackageList(filteredPackages.filter((item) => item.type === "Local" && item.serviceType === "DRIVER"));
        setOutstationPackageList(filteredPackages.filter((item) => item.type === "Outstation" && item.serviceType === "DRIVER"));
    };

    const fetchDriverPackageList = async (selectedZone = zone, selectedBookingType = bookingType) => {
        const query = { serviceType: "DRIVER" };
        if (selectedZone) query.zone = selectedZone;
        if (selectedBookingType) query.bookingType = selectedBookingType;

        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.PACKAGES_LIST, query);
        if (data?.success) {
            const driverRows = Array.isArray(data?.data) ? data.data : [];
            const filteredData = driverRows
                .filter((item) => !selectedZone || normalizeText(item.zone) === normalizeText(selectedZone))
                .filter((item) => item.serviceType === "DRIVER");
            setDriverPackageList(filteredData);
            applyDriverPackageFilter(filteredData, selectedBookingType);
        }
    };

    const fetchGeoData = async (selectedServiceType = "",selectedParcelSubService = parcelSubService, selectedZone = zone) => {
        try {
            const geoParams = selectedServiceType === "PARCEL" ? { parcelSubServices: selectedParcelSubService || "" } : {};
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, geoParams);
            const allGeo = Array.isArray(response?.data) ? response.data : [];
            const filteredAreas = allGeo.filter((area) => area.type === 'Service Area');
            const filteredSubZones = allGeo.filter((area) => area.type === "Zone" && area.description === "Zone");
            setServiceAreas(filteredAreas);
            setSubZones(filteredSubZones);
            if (selectedServiceType === "PARCEL") {
                if (!selectedZone) {
                    setShowParcelGeoError(allGeo.length === 0);
                } else {
                    const selectedArea = filteredAreas.find(
                        (area) => normalizeText(area.name) === normalizeText(selectedZone)
                    );
                    const zoneParcelSubServices = Array.isArray(selectedArea?.parcelSubServices) ? selectedArea.parcelSubServices : [];
                    setShowParcelGeoError(Boolean(selectedArea) && zoneParcelSubServices.length === 0);
                }
            } else {
                setShowParcelGeoError(false);
            }
        } catch (error) {
            console.error('Error fetching GEO_MARKINGS_LIST:', error);           
        } 
    };

    const ZONE_OPTIONS = serviceAreas.map((area) => ({
        value: area.name, 
        label: area.name, 
    }));

    const fetchParcelPackageList = async (selectedZone = zone, selectedParcelSubService = parcelSubService) => {
        const query = {};
        if (selectedZone) query.zone = selectedZone;
        if (selectedParcelSubService) query.parcelVehicleType = selectedParcelSubService;

        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.PARCEL_PACKAGE_LIST, query);
        if (data?.success) {
            const parcelRows = Array.isArray(data?.data) ? data.data : [];
            const filteredData = selectedZone ? parcelRows.filter((item) => normalizeText(item.zone) === normalizeText(selectedZone)) : parcelRows;
            setParcelLocalPackageList(filteredData.filter((item) => item.type === "Parcel" && item.serviceType === "PARCEL"));
        }
    };

    useEffect(() => {
        window.sessionStorage.setItem(MASTER_PRICE_FILTER_STORAGE_KEY, JSON.stringify({
            serviceType,
            zone,
            bookingType: serviceType === "DRIVER" ? bookingType : "",
            parcelSubService,
        }));
    }, [serviceType, zone, bookingType, parcelSubService]);

    useEffect(() => {
        const loadStoredFilters = async () => {
            await fetchGeoData(serviceType, parcelSubService, zone);
            if (!serviceType) return;

            try {
                if (serviceType === 'DRIVER') {
                    await fetchDriverPackageList(zone, bookingType);
                } else if (serviceType === 'RIDES') {
                    const data = await ApiRequestUtils.get(API_ROUTES.RIDES_PRICE_TABLE_LIST);
                    if (data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;
                        setRidesData(filteredData || []);
                    } else {
                        setRidesData([]);
                    }
                } else if (serviceType === 'AUTO') {
                    const data = await ApiRequestUtils.get(API_ROUTES.AUTO_PACKAGE_LIST, {
                        type: "Service area",
                    });
                    if (data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;
                        setAutoLocalPackageList(filteredData.filter(item => item.type === "Auto" && item.serviceType === "AUTO"));
                    }
                } else if (serviceType === 'BIKE') {
                    const data = await ApiRequestUtils.get(API_ROUTES.BIKE_PACKAGE_LIST, {
                        type: "Service area",
                    });
                    if (data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;
                        setBikeLocalPackageList(filteredData.filter(item => item.type === "Bike" && item.serviceType === "BIKE"));
                    }
                } else if (serviceType === 'PARCEL') {
                    await fetchParcelPackageList(zone, parcelSubService);
                } else if (serviceType === 'RENTAL') {
                    const data = await ApiRequestUtils.get(API_ROUTES.RENTALS_PRICE_DETAILS);
                    if(data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;
                        setLocalPackageList(filteredData.filter(item => item.type === "Local" && item.serviceType === "RENTAL"));
                        setOutstationPackageList(filteredData.filter(item => item.type === "Outstation" && item.serviceType === "RENTAL"));
                    }
                }
            } catch (err) {
                console.error("Error loading stored master price filters:", err);
            }
        };

        loadStoredFilters();
    }, []);

    const handleChange = async (selectedOption, field) => {
        if (field === 'serviceType') {
            const selectedServiceType = selectedOption.target.value;
        setServiceType(selectedServiceType);
        if (selectedServiceType !== "DRIVER") {
            setBookingType("");
            setDriverPackageList([]);
        }
        try {
            await fetchGeoData(selectedServiceType, parcelSubService, zone);
            if (selectedServiceType === 'DRIVER') {
                await fetchDriverPackageList(zone, "");
            } else if (selectedServiceType === 'RIDES') {
                const data = await ApiRequestUtils.get(API_ROUTES.RIDES_PRICE_TABLE_LIST);
                if (data?.success) {
                    const filteredData = zone
                        ? data?.data.filter(item => item.zone === zone)
                        : data?.data;
                    // console.log("FILTERED DATA", filteredData);
                    setRidesData(filteredData || []);
                    // console.log("RIDES DATA", filteredData || []);
                } else {
                    setRidesData([]);
                }
            }
            else if(selectedServiceType === 'AUTO') {
                const data = await ApiRequestUtils.get(API_ROUTES.AUTO_PACKAGE_LIST,{
                    type : "Service area",
                });
                 if (data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;                     
                     setAutoLocalPackageList(filteredData.filter(item => item.type === "Auto" && item.serviceType === "AUTO"));
                 }
                //  console.log("DADADADAD",data)
            }
            else if(selectedServiceType === 'BIKE') {
                const data = await ApiRequestUtils.get(API_ROUTES.BIKE_PACKAGE_LIST,{
                    type : "Service area",
                });
                 if (data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;                     
                     setBikeLocalPackageList(filteredData.filter(item => item.type === "Bike" && item.serviceType === "BIKE"));
                 }
                //  console.log("DADADADAD",data)
            }

             else if(selectedServiceType === 'PARCEL') {
                await fetchParcelPackageList(zone, parcelSubService);
            } 
           
            // else if (selectedServiceType === 'RENTAL') {
            //         if (data?.success) {
            //             const filteredData = zone
            //                 ? data?.data.filter(item => item.zone === zone)
            //                 : data?.data;
            //         setRidesData(filteredData);
            //         }
            // } 
            else if (selectedServiceType === 'RENTAL') {
                const data = await ApiRequestUtils.get(API_ROUTES.RENTALS_PRICE_DETAILS);
                if(data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;
                        setLocalPackageList(filteredData.filter(item => item.type === "Local" && item.serviceType === "RENTAL"));
                        setOutstationPackageList(filteredData.filter(item => item.type === "Outstation" && item.serviceType === "RENTAL"));
                }
                // setRentalsData(data?.data);
            }
        } catch (err) {
            console.error("Error fetching subscription data:", err);
            }
        } else if (field === 'zone') {
            const selectedZone = selectedOption ? selectedOption.value : '';
            setZone(selectedZone);
            try {
                if (serviceType === 'DRIVER') {
                    await fetchDriverPackageList(selectedZone, bookingType);
                } else if (serviceType === 'RIDES') {
                    const data = await ApiRequestUtils.get(API_ROUTES.RIDES_PRICE_TABLE_LIST);
                    if (data?.success) {
                        const filteredData = selectedZone
                            ? data?.data.filter(item => item.zone === selectedZone)
                            : data?.data;
                        setRidesData(filteredData);
                    }
                } else if (serviceType === 'RENTAL') {
                    const data = await ApiRequestUtils.get(API_ROUTES.RENTALS_PRICE_DETAILS);
                    if (data?.success) {
                        const filteredData = selectedZone
                            ? data?.data.filter(item => item.zone === selectedZone)
                            : data?.data;
                        setLocalPackageList(filteredData.filter(item => item.type === "Local" && item.serviceType === "RENTAL"));
                        setOutstationPackageList(filteredData.filter(item => item.type === "Outstation" && item.serviceType === "RENTAL"));
                    }
                } else if (serviceType === "PARCEL") {
                    await fetchGeoData("PARCEL", parcelSubService, selectedZone);
                    await fetchParcelPackageList(selectedZone, parcelSubService);
            }
        } catch (err) {
            console.error("Error fetching subscription data:", err);
        }
        } else if (field === 'bookingType') {
            const selectedBookingType = selectedOption.target.value;
            setBookingType(selectedBookingType);
            if (serviceType === "DRIVER") {
                await fetchDriverPackageList(zone, selectedBookingType);
            }
        } else if (field === 'parcelSubServices') {
            const selectedValue = normalizeVehicleType(selectedOption?.value || "");
            setParcelSubService(selectedValue);
            if (serviceType === "PARCEL") {
                await fetchGeoData("PARCEL", selectedValue, zone);
                await fetchParcelPackageList(zone, selectedValue);
        }
        }
    };

    const onHandleAddNew = async () => {
        if (serviceType === 'DRIVER') {
            navigate('/dashboard/finance/master-price/driver-add');
        } else if (serviceType === 'RIDES') {
            navigate('/dashboard/finance/master-price/rides-add');
        } else if (serviceType === 'RENTAL') {
            navigate('/dashboard/finance/master-price/rentals-add');
        }
        else if (serviceType === 'AUTO') {
        navigate('/dashboard/finance/master-price/auto-add');
        } else if (serviceType === 'BIKE') {
        navigate('/dashboard/finance/master-price/bike-add');     // ← add this block
        } else if (serviceType === 'PARCEL') {
            navigate('/dashboard/finance/master-price/parcel-add', {
                state: {
                    zone,
                    parcelVehicleType: parcelSubService || "BIKE",
                },
            });
    }
    };
    const parcelPackageRows = useMemo(() => {
    return (parcelLocalPackageList || []).map((pkg) => ({
        pkgId: pkg.id,
            zone: pkg.zone || "—",
            parcelVehicleType: normalizeVehicleType(pkg.parcelVehicleType),
            subZoneId: (pkg.subZoneId ?? pkg?.subZone?.id ?? "—"),
            subZoneName:
                pkg?.subZone?.name ||
                subZones.find((item) => Number(item.id) === Number(pkg.subZoneId ?? pkg?.subZone?.id))?.name ||
                "",
            baseFare: pkg.baseFare ?? "—",
            baseKm: pkg.baseKm ?? "—",
            kilometerPrice: pkg.kilometerPrice ?? "—",
            peakHour: pkg.peakHours || pkg.peakHour || [],
            parcelPricing: pkg.parcelPricing || {},
        }));
}, [parcelLocalPackageList, subZones]);

    const renderLocalPriceTable = () => {
        return (
            <div className='my-6 bg-white rounded-xl p-2'>
                <h3 className="text-xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="whitespace-nowrap">
                                    {[
                                        "Zone",
                                        "Service Type",
                                        "Trip Type",
                                        "Booking Type",
                                        "Base Hours",
                                        "Price (Mini)",
                                        "Price (Sedan)",
                                        "Price (Muv)",
                                        "Price (Suv)",
                                        // "Price (MUV)",
                                        // "Package KM",
                                        // "Additional Mins Price",
                                        // "Additional Mins Charge",
                                        // "Extra KM Price",
                                        "Free Extra (mins)",
                                        "Waiting Charges Apply After",
                                        "Night Charge",
                                        "Cancellation Mins",
                                        "Cancellation Charge",
                                        "Food Charges"
                                    ]
                                        .map((el, index) => (
                                            <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left pb-4 ${ColorStyles.bgColor}`}>
                                                <Typography
                                                    variant="small"
                                                    className="text-[11px] font-bold uppercase text-white"
                                                >
                                                    {el}
                                                </Typography>
                                            </th>
                                        ))
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {localPackageList.map(({ id, zone, serviceType, type, period, kilometer, priceMVP,priceSuv,priceSedan,bookingType, additionalMinCharge, extraKmPrice, extraPrice, freeExtraMinutes, waitingCharge, nightCharge, cancelCharge, dropPriceAbove, cancelMins, price }, key) => {
                                    const className = `py-3 px-5 ${key === localPackageList.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                                    return (
                                        <tr key={id}  className="whitespace-nowrap">
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {zone}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {serviceType}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {type}
                                                </Typography>
                                            </td>
                                             <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {bookingType}
                                                </Typography>
                                            </td>
                                            <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                <div className="flex items-center gap-4">
                                                    <Link to={`/dashboard/finance/master-price/details/${id}`}>
                                                        <Typography
                                                            variant="small"
                                                            color="blue"
                                                            className="font-semibold underline cursor-pointer"
                                                        >
                                                            {period}
                                                        </Typography>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {price}
                                                </Typography>
                                            </td>
                                             <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {priceSedan}
                                                </Typography>
                                            </td>
                                             <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {priceMVP}
                                                </Typography>
                                            </td>
                                             <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {priceSuv}
                                                </Typography>
                                            </td>
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {priceMVP}
                                                </Typography>
                                            </td> */}
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {kilometer || "-"}
                                                </Typography>
                                            </td> */}
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {additionalMinCharge || "-"}
                                                </Typography>
                                            </td> */}
                                             {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {extraPrice || "-"}
                                                </Typography>
                                            </td> */}
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {extraKmPrice || "-"}
                                                </Typography>
                                            </td> */}
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {freeExtraMinutes || "-"}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {waitingCharge || "-"}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {nightCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {Utils.convertTimeFormatToMinutes(cancelMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {cancelCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {dropPriceAbove || "-"}
                                                </Typography>
                                            </td>
                                        </tr>
                                    );

                                })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        )
    };

    const renderOutstationPriceTable = () => {
    const filteredOutstationList = outstationPackageList
        // .filter(item => item.type === "Outstation" && item.period !== "1")
        .sort((a, b) => {
            const periodA = parseInt(a.period, 10);
            const periodB = parseInt(b.period, 10);
            return periodA - periodB; 
        });

    return (
        <div className='my-6 bg-white rounded-xl p-2'>
            <h3 className="text-xl font-bold mb-4 ml-2">Outstation</h3>
            <Card>
                <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr className="whitespace-nowrap">
                                {[
                                    "Zone",
                                    "Service Type",
                                    "Trip Type",
                                    "Booking Type",
                                    "Base Hours",
                                    // "Base KM",
                                    "Price (Mini)",
                                    "Price (Sedan)",
                                    "Price (Muv)",
                                    "Price (Suv)",
                                    // "Additional Mins Price",
                                    // "Additional Mins Charge",
                                    // "Extra KM rate",
                                    "Food Charges",
                                    "Night Charges",
                                    "Drop-only charge"
                                ].map((el, index) => (
                                    <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left pb-4 ${ColorStyles.bgColor}`}>
                                        <Typography
                                            variant="small"
                                            className="text-[11px] font-bold uppercase text-white"
                                        >
                                            {el}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOutstationList.map((item, index) => {
                                const { 
                                    id, zone, serviceType, type, period, extraCabType ,kilometer,  
                                    dropPrice, price, additionalMinCharge, dropPriceAbove, bookingType,
                                    nightCharge, extraKmPrice, extraPrice,priceMVP, priceSuv, priceSedan 
                                } = item;

                                const isLast = index === filteredOutstationList.length - 1;
                                const className = `py-3 px-5 ${isLast ? "" : "border-b border-blue-gray-50"}`;

                                return (
                                    <tr key={id} className="whitespace-nowrap">
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {zone}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {serviceType}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <div >
                                                <Typography className="text-xs font-semibold text-blue-gray-900" >
                                                    {type}
                                                </Typography>
                                            </div>
                                        </td>
                                         <td className={className}>
                                            <div >
                                                <Typography className="text-xs font-semibold text-blue-gray-900" >
                                                    {bookingType}
                                                </Typography>
                                            </div>
                                        </td>
                                        <td className={className}>
                                            <Link to={`/dashboard/finance/master-price/details/${id}`}>
                                                <Typography variant="small" color="blue" className="font-semibold underline cursor-pointer" >
                                                    {(period === '1' && extraCabType === '0') ? 'Custom Date' : period}
                                                </Typography>
                                            </Link>
                                        </td>
                                        {/* <td className={className}>
                                            <div >
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {kilometer || '-'}
                                                </Typography>
                                            </div>
                                        </td> */}
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {price || '0'}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {priceSedan || '0'}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {priceMVP || '0'}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {priceSuv || '0'}
                                            </Typography>
                                        </td>
                                        {/* <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {additionalMinCharge || '-'}
                                            </Typography>
                                        </td>
                                         <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {extraPrice || '-'}
                                            </Typography>
                                        </td> */}
                                        {/* <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {extraKmPrice || '-'}
                                            </Typography>
                                        </td> */}
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {dropPriceAbove || '-'}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {nightCharge || '0'}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {dropPrice || '-'}
                                            </Typography>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* If no data after filter, show a message */}
                            {filteredOutstationList.length === 0 && (
                                <tr>
                                    <td colSpan="11" className="py-8 text-center text-gray-500">
                                        <Typography>No Outstation packages found (excluding 1-day trips)</Typography>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardBody>
            </Card>
        </div>
    );
};

    const renderRidesTable = () => {
        const formatValue = (value) => value ?? "-";
        const formatCategory = (value) => String(value || "-").replace(/_/g, " ");
        const formatCarTypes = (carTypes) => Array.isArray(carTypes) && carTypes.length ? carTypes.join(", ") : "-";
        const formatPeakHours = (peakHours) => {
            if (!Array.isArray(peakHours) || !peakHours.length) return "-";

            return peakHours
                .map((peakHour) => {
                    const start = peakHour.start || peakHour.from || peakHour.startTime || peakHour.fromTime || "-";
                    const end = peakHour.end || peakHour.to || peakHour.endTime || peakHour.toTime || "-";
                    return `${start} - ${end}`;
                })
                .join(", ");
        };
        const ridesCategoryRows = ridesData.flatMap((packageData) => {
            const categoryPricings = Array.isArray(packageData.categoryPricings) && packageData.categoryPricings.length
                ? packageData.categoryPricings
                : [{
                    id: `${packageData.id}-default`,
                    packageId: packageData.id,
                    category: packageData.rateParameter || "Default",
                    carTypes: [],
                    pricing: packageData,
                }];

            return categoryPricings.map((categoryPricing) => ({
                packageId: packageData.id,
                rowId: categoryPricing.id || `${packageData.id}-${categoryPricing.category}`,
                zone: packageData.zone,
                status: packageData.status,
                category: categoryPricing.category,
                carTypes: categoryPricing.carTypes,
                pricing: categoryPricing.pricing || {},
            }));
        });
        const ridesPackageGroups = Object.values(ridesCategoryRows.reduce((groups, row) => {
            const packageKey = row.packageId || "-";
            if (!groups[packageKey]) {
                groups[packageKey] = { packageId: row.packageId, rows: [] };
            }
            groups[packageKey].rows.push(row);
            return groups;
        }, {}));

        return (
            <div className='my-6 bg-white rounded-xl p-2'>
                <h3 className="text-xl font-bold mb-4 ml-2">Rides</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="whitespace-nowrap">
                                    {[
                                        "Expand",
                                        "Zone",
                                        "Category",
                                        "Car Types",
                                        "Base KM",
                                        "Base Fare",
                                        "KM Price",
                                        "Additional Min",
                                        "Free Extra Mins",
                                        "Waiting Mins",
                                        "Waiting Charge",
                                        "Night Hours",
                                        "Night Charge",
                                        "Cancel Mins",
                                        "Cancel Charge",
                                        "Peak Hours",
                                        "Status"
                                    ].map((el, index) => (
                                        <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left ${ColorStyles.bgColor}`}>
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-white"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ridesPackageGroups.map((group) => {
                                    const expanded = isPackageExpanded("rides", group.packageId);
                                    const visibleRows = expanded ? group.rows : group.rows.slice(0, 1);

                                    return (
                                    <Fragment key={`rides-package-${group.packageId}`}>
                                        {visibleRows.map(({ packageId, rowId, zone, status, category, carTypes, pricing }, key) => {
                                            const className = `py-3 px-5 ${key === visibleRows?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                            return (
                                                <tr key={rowId} className="whitespace-nowrap">
                                            <td className={className}>
                                                {key === 0 ? (
                                                    <button type="button" onClick={() => togglePackageExpand("rides", packageId)}>
                                                        <img
                                                            src={EXPAND_ICON_PATH}
                                                            alt={expanded ? "Collapse" : "Expand"}
                                                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                                                        />
                                                    </button>
                                                ) : null}
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {formatValue(zone)}
                                                </Typography>
                                            </td>
                                            <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                <div className="flex items-center gap-4">
                                                    <Link to={`/dashboard/finance/master-price/rides-details/${packageId}`}>
                                                        <Typography
                                                            variant="small"
                                                            color="blue"
                                                            className="font-semibold underline cursor-pointer"
                                                        >
                                                            {formatCategory(category)}
                                                        </Typography>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatCarTypes(carTypes)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseKm)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseFare)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.kilometerPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.additionalMinCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.freeExtraMinutes)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {`${formatValue(pricing.nightHoursFrom)} - ${formatValue(pricing.nightHoursTo)}`}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.nightCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatPeakHours(pricing.peakHours)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {status == 1 ? 'Active' : 'InActive'}
                                                </Typography>
                                            </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };

    const renderLocalRentalsTable = () => {
        const formatValue = (value) => value ?? "-";
        const formatCategory = (value) => String(value || "-").replace(/_/g, " ");
        const formatCarTypes = (carTypes) => Array.isArray(carTypes) && carTypes.length ? carTypes.join(", ") : "-";
        const formatPeakHours = (peakHours) => {
            if (!Array.isArray(peakHours) || !peakHours.length) return "-";

            return peakHours
                .map((peakHour) => {
                    const start = peakHour.start || peakHour.from || peakHour.startTime || peakHour.fromTime || "-";
                    const end = peakHour.end || peakHour.to || peakHour.endTime || peakHour.toTime || "-";
                    return `${start} - ${end}`;
                })
                .join(", ");
        };
        const formatStatus = (status) => status === 1 || status === "ACTIVE" ? "Active" : "InActive";
        const localRentalRows = localPackageList.flatMap((packageData) => {
            const categoryPricings = Array.isArray(packageData.categoryPricings) && packageData.categoryPricings.length
                ? packageData.categoryPricings
                : [{
                    id: `${packageData.id}-default`,
                    packageId: packageData.id,
                    category: packageData.type || "Local",
                    carTypes: packageData.carType ? [packageData.carType] : [],
                    pricing: packageData,
                }];

            return categoryPricings.map((categoryPricing) => {
                const pricing = categoryPricing.pricing || {};
                return {
                    packageId: packageData.id,
                    rowId: categoryPricing.id || `${packageData.id}-${categoryPricing.category}`,
                    zone: packageData.zone,
                    period: packageData.period,
                    status: categoryPricing.status || packageData.status,
                    category: categoryPricing.category,
                    carTypes: categoryPricing.carTypes,
                    pricing: pricing.common || pricing,
                    dropOnly: pricing.DROP_ONLY || {},
                    roundTrip: pricing.ROUND_TRIP || {},
                };
            });
        });
        const localRentalGroups = Object.values(localRentalRows.reduce((groups, row) => {
            const periodKey = formatValue(row.period);
            if (!groups[periodKey]) {
                groups[periodKey] = { period: row.period, rows: [] };
            }
            groups[periodKey].rows.push(row);
            return groups;
        }, {}));

        return (
            <div className='my-6 bg-white rounded-xl p-2'>
                <h3 className="text-xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="whitespace-nowrap">
                                    {[
                                        "Expand",
                                        "Zone",
                                        "Category",
                                        "Car Types",
                                        "Package",
                                        "Price",
                                        "Base KM",
                                        "Base Fare",
                                        "Kilometer",
                                        "KM Price",
                                        "AC KM Price",
                                        "Additional Min",
                                        "Free Extra Mins",
                                        "Waiting Mins",
                                        "Waiting Charge",
                                        "Night Hours",
                                        "Night Charge",
                                        "Driver Charge",
                                        "Cancellation Mins",
                                        "Cancel Charge",
                                        "Peak Hours",
                                        "Status"
                                    ].map((el, index) => (
                                        <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left ${ColorStyles.bgColor}`}>
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-white"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {localRentalGroups.map((group) => {
                                    const expanded = isRentalPeriodExpanded("local", group.period);
                                    const visibleRows = expanded ? group.rows : group.rows.slice(0, 1);

                                    return (
                                    <Fragment key={`local-rental-${formatValue(group.period)}`}>
                                        {visibleRows.map(({ packageId, rowId, zone, period, status, category, carTypes, pricing, dropOnly }, key) => {
                                            const className = `py-3 px-5 ${key === visibleRows?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                            return (
                                                <tr key={rowId} className="whitespace-nowrap">
                                            <td className={className}>
                                                {key === 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRentalPeriod("local", group.period)}
                                                        className="text-sm font-semibold text-blue-700 underline"
                                                    >
                                                        <img
                                                            src={EXPAND_ICON_PATH}
                                                            alt={expanded ? "Collapse" : "Expand"}
                                                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                                                        />
                                                    </button>
                                                ) : null}
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {formatValue(zone)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatCategory(category)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatCarTypes(carTypes)}
                                                </Typography>
                                            </td>
                                            <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                <div className="flex items-center gap-4">
                                                    <Link to={`/dashboard/finance/master-price/rentals-details/${packageId}`}>
                                                        <Typography
                                                            variant="small"
                                                            color="blue"
                                                            className="font-semibold underline cursor-pointer"
                                                        >
                                                            {formatValue(period)}
                                                        </Typography>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.price)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseKm)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseFare)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.kilometer)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.kilometerPrice ?? dropOnly.NON_AC?.kilometerPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(dropOnly.AC?.acKilometerPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.additionalMinCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.freeExtraMinutes)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {`${formatValue(pricing.nightHoursFrom)} - ${formatValue(pricing.nightHoursTo)}`}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.nightCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.driverCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatPeakHours(pricing.peakHours)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatStatus(status)}
                                                </Typography>
                                            </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };
    const renderOutstationRentalsTable = () => {
        const formatValue = (value) => value ?? "-";
        const formatCategory = (value) => String(value || "-").replace(/_/g, " ");
        const formatCarTypes = (carTypes) => Array.isArray(carTypes) && carTypes.length ? carTypes.join(", ") : "-";
        const formatPeakHours = (peakHours) => {
            if (!Array.isArray(peakHours) || !peakHours.length) return "-";

            return peakHours
                .map((peakHour) => {
                    const start = peakHour.start || peakHour.from || peakHour.startTime || peakHour.fromTime || "-";
                    const end = peakHour.end || peakHour.to || peakHour.endTime || peakHour.toTime || "-";
                    return `${start} - ${end}`;
                })
                .join(", ");
        };
        const formatStatus = (status) => status === 1 || status === "ACTIVE" ? "Active" : "InActive";
        const outstationRentalRows = outstationPackageList.flatMap((packageData) => {
            const categoryPricings = Array.isArray(packageData.categoryPricings) && packageData.categoryPricings.length
                ? packageData.categoryPricings
                : [{
                    id: `${packageData.id}-default`,
                    packageId: packageData.id,
                    category: packageData.type || "Outstation",
                    carTypes: packageData.carType ? [packageData.carType] : [],
                    pricing: packageData,
                }];

            return categoryPricings.map((categoryPricing) => {
                const pricing = categoryPricing.pricing || {};
                return {
                    packageId: packageData.id,
                    rowId: categoryPricing.id || `${packageData.id}-${categoryPricing.category}`,
                    zone: packageData.zone,
                    period: packageData.period,
                    status: categoryPricing.status || packageData.status,
                    category: categoryPricing.category,
                    carTypes: categoryPricing.carTypes,
                    common: pricing.common || pricing,
                    dropOnly: pricing.DROP_ONLY || {},
                    roundTrip: pricing.ROUND_TRIP || {},
                };
            });
        });
        const outstationRentalGroups = Object.values(outstationRentalRows.reduce((groups, row) => {
            const periodKey = formatValue(row.period);
            if (!groups[periodKey]) {
                groups[periodKey] = { period: row.period, rows: [] };
            }
            groups[periodKey].rows.push(row);
            return groups;
        }, {}));

        return (
            <div className='my-2 bg-white rounded-xl p-2'>
                <h3 className="text-xl font-bold mb-4 ml-2">OutStation</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="whitespace-nowrap">
                                    {[
                                        "Zone",
                                        "Category",
                                        "Car Types",
                                        "Package",
                                        "Base Km",
                                        "Base Fare",
                                        "Kilometer",
                                        "Drop KM Price",
                                        "Drop Extra KM",
                                        "Drop AC KM",
                                        "Drop AC Extra KM",
                                        "Round KM Price",
                                        "Round Extra KM",
                                        "Round AC KM",
                                        "Round AC Extra KM",
                                        "Additional Min",
                                        "Free Extra Mins",
                                        "Waiting Mins",
                                        "Waiting Charge",
                                        "Night Hours",
                                        "Night Charge",
                                        "Driver Charge",
                                        "Cancellation Mins",
                                        "Cancel Charge",
                                        "Peak Hours",
                                        "Status"
                                    ].map((el, index) => (
                                        <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left ${ColorStyles.bgColor}`}>
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {outstationRentalGroups.map((group) => {
                                    const expanded = isRentalPeriodExpanded("outstation", group.period);
                                    const visibleRows = expanded ? group.rows : group.rows.slice(0, 1);

                                    return (
                                    <Fragment key={`outstation-rental-${formatValue(group.period)}`}>
                                        {visibleRows.map(({ packageId, rowId, zone, period, status, category, carTypes, common, dropOnly, roundTrip }, key) => {
                                            const className = `py-3 px-5 ${key === visibleRows?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                            return (
                                                <tr key={rowId} className="whitespace-nowrap">
                                            <td className={className}>
                                                {key === 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRentalPeriod("outstation", group.period)}
                                                        className="text-sm font-semibold text-blue-700 underline"
                                                    >
                                                        <img
                                                            src={EXPAND_ICON_PATH}
                                                            alt={expanded ? "Collapse" : "Expand"}
                                                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                                                        />
                                                    </button>
                                                ) : null}
                                            </td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-900">{formatValue(zone)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatCategory(category)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatCarTypes(carTypes)}</Typography></td>
                                            <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                <Link to={`/dashboard/finance/master-price/rentals-details/${packageId}`}>
                                                    <Typography variant="small" color="blue" className="font-semibold underline cursor-pointer">
                                                        {formatValue(period)}
                                                    </Typography>
                                                </Link>
                                            </td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.baseKm)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.baseFare)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.kilometer)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(dropOnly.NON_AC?.kilometerPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(dropOnly.NON_AC?.extraKilometerPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(dropOnly.AC?.acKilometerPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(dropOnly.AC?.acExtraKilometerPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(roundTrip.NON_AC?.kilometerRoundPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(roundTrip.NON_AC?.extraKilometerRoundPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(roundTrip.AC?.acKilometerRoundPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(roundTrip.AC?.acExtraKilometerRoundPrice)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.additionalMinCharge)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.freeExtraMinutes)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.waitingMins)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.waitingCharge)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{`${formatValue(common.nightHoursFrom)} - ${formatValue(common.nightHoursTo)}`}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.nightCharge)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.driverCharge)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.cancelMins)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatValue(common.cancelCharge)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatPeakHours(common.peakHours)}</Typography></td>
                                            <td className={className}><Typography className="text-xs font-semibold text-blue-gray-600">{formatStatus(status)}</Typography></td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };
    const LocalParcelTable = () => {
        const hideSubZoneColumn = false;
        const parcelTableHeaders = ["Zone", "Sub Zone", "Base Fare", "Base Km", "Kilometer Price", "Actions"];
        return (
            <div className='my-6 bg-white rounded-xl p-2'>
                <h3 className="text-xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="whitespace-nowrap">
                                    {parcelTableHeaders.map((el, index) => (
                                        <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left ${ColorStyles.bgColor}`}>
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-white"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {parcelPackageRows.map((row, idx) => {
                                    const className = `py-3 px-5 ${idx === parcelPackageRows.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                                    return (
                                        <ParcelExpandableRow
                                            key={row.pkgId}
                                            row={row}
                                            className={className}
                                            hideSubZoneColumn={hideSubZoneColumn}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };
        const LocalAutoTable = () => {
        const formatValue = (value) => value ?? "-";
        const formatCategory = (value) => String(value || "-").replace(/_/g, " ");
        const formatCarTypes = (carTypes) => Array.isArray(carTypes) && carTypes.length ? carTypes.join(", ") : "-";
        const formatPeakHours = (peakHours) => {
            if (!Array.isArray(peakHours) || !peakHours.length) return "-";

            return peakHours
                .map((peakHour) => {
                    const start = peakHour.start || peakHour.from || peakHour.startTime || peakHour.fromTime || "-";
                    const end = peakHour.end || peakHour.to || peakHour.endTime || peakHour.toTime || "-";
                    return `${start} - ${end}`;
                })
                .join(", ");
        };
        const formatStatus = (status) => status === 1 || status === "ACTIVE" ? "Active" : "InActive";
        const autoCategoryRows = autoLocalPackageList.flatMap((packageData) => {
            const categoryPricings = Array.isArray(packageData.categoryPricings) && packageData.categoryPricings.length
                ? packageData.categoryPricings
                : [{
                    id: `${packageData.id}-default`,
                    packageId: packageData.id,
                    category: packageData.type || "Auto",
                    carTypes: ["Auto"],
                    pricing: packageData,
                }];

            return categoryPricings.map((categoryPricing) => ({
                packageId: packageData.id,
                rowId: categoryPricing.id || `${packageData.id}-${categoryPricing.category}`,
                zone: packageData.zone,
                status: categoryPricing.status || packageData.status,
                category: categoryPricing.category,
                carTypes: categoryPricing.carTypes,
                pricing: categoryPricing.pricing || {},
            }));
        });
        const autoPackageGroups = Object.values(autoCategoryRows.reduce((groups, row) => {
            const packageKey = row.packageId || "-";
            if (!groups[packageKey]) {
                groups[packageKey] = { packageId: row.packageId, rows: [] };
            }
            groups[packageKey].rows.push(row);
            return groups;
        }, {}));

        return (
            <div className='my-6 bg-white rounded-xl p-2'>
                <h3 className="text-xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="whitespace-nowrap">
                                    {[
                                        "Expand",
                                        "Zone",
                                        "Category",
                                        "Vehicle Type",
                                        "Base KM",
                                        "Base Fare",
                                        "KM Price",
                                        "Extra KM Price",
                                        "Additional Min",
                                        "Free Extra Mins",
                                        "Waiting Mins",
                                        "Waiting Charge",
                                        "Night Hours",
                                        "Night Charge",
                                        "Cancel Mins",
                                        "Cancel Charge",
                                        "Peak Hours",
                                        "Status",
                                        "Actions"
                                    ].map((el, index) => (
                                        <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left ${ColorStyles.bgColor}`}>
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-white"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {autoPackageGroups.map((group) => {
                                    const expanded = isPackageExpanded("auto", group.packageId);
                                    const visibleRows = expanded ? group.rows : group.rows.slice(0, 1);

                                    return (
                                    <Fragment key={`auto-package-${group.packageId}`}>
                                        {visibleRows.map(({ packageId, rowId, zone, status, category, carTypes, pricing }, key) => {
                                            const className = `py-3 px-5 ${key === visibleRows?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                            return (
                                                <tr key={rowId} className="whitespace-nowrap">
                                            <td className={className}>
                                                {key === 0 ? (
                                                    <button type="button" onClick={() => togglePackageExpand("auto", packageId)}>
                                                        <img
                                                            src={EXPAND_ICON_PATH}
                                                            alt={expanded ? "Collapse" : "Expand"}
                                                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                                                        />
                                                    </button>
                                                ) : null}
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(zone)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    <Link to={`/dashboard/finance/master-price/auto-edit/${packageId}`} className="cursor-pointer underline text-blue-600">
                                                        {formatCategory(category)}
                                                    </Link>
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatCarTypes(carTypes)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseKm)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseFare)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.kilometerPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.extraKmPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.additionalMinCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.freeExtraMinutes)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {`${formatValue(pricing.nightHoursFrom)} - ${formatValue(pricing.nightHoursTo)}`}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.nightCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatPeakHours(pricing.peakHours)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatStatus(status)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Link to={`/dashboard/finance/master-price/auto-edit/${packageId}`} className={`px-3 py-1 rounded-lg inline-block ${ColorStyles.editButton}`}>
                                                    Edit
                                                </Link>
                                            </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };
    const LocalBikeTable = () => {
        const formatValue = (value) => value ?? "-";
        const formatCategory = (value) => String(value || "-").replace(/_/g, " ");
        const formatCarTypes = (carTypes) => Array.isArray(carTypes) && carTypes.length ? carTypes.join(", ") : "-";
        const formatPeakHours = (peakHours) => {
            if (!Array.isArray(peakHours) || !peakHours.length) return "-";

            return peakHours
                .map((peakHour) => {
                    const start = peakHour.start || peakHour.from || peakHour.startTime || peakHour.fromTime || "-";
                    const end = peakHour.end || peakHour.to || peakHour.endTime || peakHour.toTime || "-";
                    return `${start} - ${end}`;
                })
                .join(", ");
        };
        const formatStatus = (status) => status === 1 || status === "ACTIVE" ? "Active" : "InActive";
        const bikeCategoryRows = bikeLocalPackageList.flatMap((packageData) => {
            const categoryPricings = Array.isArray(packageData.categoryPricings) && packageData.categoryPricings.length
                ? packageData.categoryPricings
                : [{
                    id: `${packageData.id}-default`,
                    packageId: packageData.id,
                    category: packageData.type || "Bike",
                    carTypes: ["Bike"],
                    pricing: packageData,
                }];

            return categoryPricings.map((categoryPricing) => ({
                packageId: packageData.id,
                rowId: categoryPricing.id || `${packageData.id}-${categoryPricing.category}`,
                zone: packageData.zone,
                status: categoryPricing.status || packageData.status,
                category: categoryPricing.category,
                carTypes: categoryPricing.carTypes,
                pricing: categoryPricing.pricing || {},
            }));
        });
        const bikePackageGroups = Object.values(bikeCategoryRows.reduce((groups, row) => {
            const packageKey = row.packageId || "-";
            if (!groups[packageKey]) {
                groups[packageKey] = { packageId: row.packageId, rows: [] };
            }
            groups[packageKey].rows.push(row);
            return groups;
        }, {}));

        return (
            <div className='my-6 bg-white rounded-xl p-2'>
                <h3 className="text-xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="whitespace-nowrap">
                                    {[
                                        "Expand",
                                        "Zone",
                                        "Category",
                                        "Vehicle Type",
                                        "Base KM",
                                        "Base Fare",
                                        "KM Price",
                                        "Extra KM Price",
                                        "Extra Price",
                                        "Additional Min",
                                        "Free Extra Mins",
                                        "Waiting Mins",
                                        "Waiting Charge",
                                        "Night Hours",
                                        "Night Charge",
                                        "Cancel Mins",
                                        "Cancel Charge",
                                        "Peak Hours",
                                        "Status",
                                        "Actions"
                                    ].map((el, index) => (
                                        <th key={index} className={`border-b border-blue-gray-50 py-3 px-5 text-left ${ColorStyles.bgColor}`}>
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-white"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bikePackageGroups.map((group) => {
                                    const expanded = isPackageExpanded("bike", group.packageId);
                                    const visibleRows = expanded ? group.rows : group.rows.slice(0, 1);

                                    return (
                                    <Fragment key={`bike-package-${group.packageId}`}>
                                        {visibleRows.map(({ packageId, rowId, zone, status, category, carTypes, pricing }, key) => {
                                            const className = `py-3 px-5 ${key === visibleRows?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                            return (
                                                <tr key={rowId} className="whitespace-nowrap">
                                            <td className={className}>
                                                {key === 0 ? (
                                                    <button type="button" onClick={() => togglePackageExpand("bike", packageId)}>
                                                        <img
                                                            src={EXPAND_ICON_PATH}
                                                            alt={expanded ? "Collapse" : "Expand"}
                                                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                                                        />
                                                    </button>
                                                ) : null}
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(zone)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    <Link to={`/dashboard/finance/master-price/bike-edit/${packageId}`} className="cursor-pointer underline text-blue-600">
                                                        {formatCategory(category)}
                                                    </Link>
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatCarTypes(carTypes)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseKm)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.baseFare)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.kilometerPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.extraKmPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.extraPrice)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.additionalMinCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.freeExtraMinutes)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.waitingCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {`${formatValue(pricing.nightHoursFrom)} - ${formatValue(pricing.nightHoursTo)}`}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.nightCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelMins)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatValue(pricing.cancelCharge)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatPeakHours(pricing.peakHours)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatStatus(status)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Link to={`/dashboard/finance/master-price/bike-edit/${packageId}`} className={`px-3 py-1 rounded-lg inline-block ${ColorStyles.editButton}`}>
                                                    Edit
                                                </Link>
                                            </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };
   
    return (
        <>
            <div className="p-4 border bg-white border-gray-300 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="relative flex-grow max-w-[860px]">
                        <div className="p-4 flex flex-row flex-wrap gap-5">
                            <div className="flex flex-col">
                                <label className="text-base font-medium text-gray-700">Select Zone:</label>
                                <Select
                                    options={ZONE_OPTIONS}
                                    value={zone ? { value: zone, label: zone } : null}
                                    onChange={(selectedOption) => handleChange(selectedOption, 'zone')}
                                    placeholder="Select Zone"
                                    className="w-[200px]"
                                />
                                {zone === "" && <div className="text-red-500 text-sm mt-1">Please select a zone</div>}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-base font-medium text-gray-700">Select Service Type:</label>
                                <select
                                    value={serviceType}
                                    onChange={(e) => handleChange(e, 'serviceType')}
                                    className="p-2 w-[200px] rounded-lg border-2 border-gray-300"
                                    disabled={!zone} // Disable if zone is not selected
                                >
                                    <option value="">Select Service Type</option>
                                    <option value="DRIVER">Acting Driver</option>
                                    <option value="RIDES">Rides</option>
                                    <option value="RENTAL">Rental</option>
                                    <option value="AUTO">Auto</option>
                                    <option value="PARCEL">Parcel</option>
                                    <option value="BIKE">Bike</option>
                                </select>
                                {serviceType === "" && <div className="text-red-500 text-sm mt-1">Please select a service type</div>}
                            </div>
                            {serviceType === "DRIVER" && (
                                <div className="flex flex-col">
                                    <label className="text-base font-medium text-gray-700">Select Booking Type:</label>
                                    <select
                                        value={bookingType}
                                        onChange={(e) => handleChange(e, 'bookingType')}
                                        className="p-2 w-[200px] rounded-lg border-2 border-gray-300"
                                    >
                                        <option value="">All Booking Types</option>
                                        <option value="ROUND TRIP">ROUND TRIP</option>
                                        <option value="DROP ONLY">DROP ONLY</option>
                                    </select>
                                </div>
                            )}
                            {serviceType === "PARCEL" && (
                                <div className="flex flex-col">
                                    <label className="text-base font-medium text-gray-700">Parcel Sub Services:</label>
                                    <Select
                                        isClearable
                                        options={parcelSubServiceOptions}
                                        value={parcelSubServiceOptions.find((item) => item.value === parcelSubService) || null}
                                        onChange={(selectedOption) => handleChange(selectedOption, 'parcelSubServices')}
                                        placeholder="Select Parcel Sub Services"
                                        className="w-[260px]"
                                    />                                   
                                </div>
                            )}
                        </div>
                    </div>
                    {serviceType && (
                    <button
                        onClick={onHandleAddNew}
                        className={`ml-4 px-4 py-2 rounded-2xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            ColorStyles.addButtonColor
                        }`}
                    >
                        Add new
                    </button>
                    )}
                </div>
            </div>
            {serviceType === "PARCEL" && showParcelGeoError ? (
                <div className="px-4 pb-4">
                    <p className="text-sm font-medium text-red-600" style={{ color: "red" }}>
                        Kindly add the Parcel Sub Services (such as Bike or Auto) to the Geo Markings.
                    </p>
                </div>
            ) : null}

            {serviceType === 'DRIVER' && localPackageList && localPackageList.length > 0 ? (
                <div className=''>
                    {renderLocalPriceTable()}
                </div>
            ) : (<>
            </>)}

            {serviceType === 'DRIVER' && outstationPackageList && outstationPackageList.length > 0 ? (
                <div className=''>
                    {renderOutstationPriceTable()}
                </div>
            ) : (<>
            </>)}

            {serviceType === 'RIDES' && ridesData && ridesData.length > 0 ? (
                <div>
                    {renderRidesTable()}
                </div>
            ) : <></>}

            {serviceType === 'RENTAL' && localPackageList && localPackageList.length > 0 ? (
                <div>
                    {renderLocalRentalsTable()}
                </div>
            ) : (<>
            </>)}
            {serviceType === "RENTAL" && outstationPackageList && outstationPackageList.length > 0 ? (
                <div>{renderOutstationRentalsTable()}</div>
            ) : (<>
            </>)}
            {serviceType === 'AUTO' && autoLocalPackageList && autoLocalPackageList.length > 0 ? (
                <div>{LocalAutoTable()}</div>
            ): (<></>)}
             {serviceType === 'BIKE' && bikeLocalPackageList && bikeLocalPackageList.length > 0 ? (
                <div>{LocalBikeTable()}</div>
            ): (<></>)}
            {serviceType === 'PARCEL' && parcelLocalPackageList && parcelLocalPackageList.length > 0 ? (
                <div>{LocalParcelTable()}</div>
            ): (<></>)}
            
        </>

    );
};
