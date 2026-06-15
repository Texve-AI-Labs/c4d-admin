import { useState, useEffect, useMemo  } from "react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from 'react-router-dom';
import { Utils } from '@/utils/utils';
import Select from 'react-select';
import { ParcelExpandableRow } from "./ParcelExpandableRow";

export function MasterPriceView() {
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
    const [parcelLocalPackageList, setParcelLocalPackageList] = useState([]);
    const navigate = useNavigate();
    const [serviceType, setServiceType] = useState("");
    const [ridesData, setRidesData] = useState([]);
    // const [rentalsData, setRentalsData] = useState([]);
    const [zone, setZone] = useState("");
    const [parcelSubService, setParcelSubService] = useState("BIKE");
    const [showParcelGeoError, setShowParcelGeoError] = useState(false);
    const [serviceAreas, setServiceAreas] = useState([]);
    const [subZones, setSubZones] = useState([]);

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

    useEffect(() => {
        fetchGeoData();
    }, []);

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

    const handleChange = async (selectedOption, field) => {
        if (field === 'serviceType') {
            const selectedServiceType = selectedOption.target.value;
        setServiceType(selectedServiceType);
        try {
            await fetchGeoData(selectedServiceType, parcelSubService, zone);
            if (selectedServiceType === 'DRIVER') {
                const data = await ApiRequestUtils.get(API_ROUTES.PACKAGES_LIST);
                if (data?.success) {
                        const filteredData = zone
                            ? data?.data.filter(item => item.zone === zone)
                            : data?.data;
                        setLocalPackageList(filteredData.filter(item => item.type === "Local" && item.serviceType === "DRIVER"));
                    setOutstationPackageList(filteredData.filter(item => item.type === "Outstation" && item.serviceType === "DRIVER"));
                }
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
                    const data = await ApiRequestUtils.get(API_ROUTES.PACKAGES_LIST);
                    if (data?.success) {
                        const filteredData = selectedZone
                            ? data?.data.filter(item => item.zone === selectedZone)
                            : data?.data;
                        setLocalPackageList(filteredData.filter(item => item.type === "Local" && item.serviceType === "DRIVER"));
                        setOutstationPackageList(filteredData.filter(item => item.type === "Outstation" && item.serviceType === "DRIVER"));
                    }
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
        navigate('/dashboard/finance/master-price/auto-add');     // ← add this block
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
            <div className='my-6'>
                <h3 className="text-3xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {[
                                        "Zone",
                                        "Service Type",
                                        "Trip Type",
                                        "Package (Hrs)",
                                        "Price",
                                        // "Price (MUV)",
                                        "Package KM",
                                        "Additional Mins Price",
                                        "Extra KM Price",
                                        "Free Waiting (mins)",
                                        "Waiting Charge",
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
                                {localPackageList.map(({ id, zone, serviceType, type, period, kilometer, priceMVP, additionalMinCharge, extraKmPrice, freeExtraMinutes, waitingCharge, nightCharge, cancelCharge, dropPriceAbove, cancelMins, price }, key) => {
                                    const className = `py-3 px-5 ${key === localPackageList.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                                    return (
                                        <tr key={id}>
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
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {priceMVP}
                                                </Typography>
                                            </td> */}
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {kilometer || "-"}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {additionalMinCharge || "-"}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {extraKmPrice || "-"}
                                                </Typography>
                                            </td>
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
        <div className='my-6'>
            <h3 className="text-3xl font-bold mb-4 ml-2">Outstation</h3>
            <Card>
                <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>
                                {[
                                    "Zone",
                                    "Service Type",
                                    "Trip Type",
                                    "Base Hours",
                                    "Base KM",
                                    "Base Fare",
                                    "Extra hour charge",
                                    "Extra KM rate",
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
                                    dropPrice, price, additionalMinCharge, dropPriceAbove, 
                                    nightCharge, extraKmPrice 
                                } = item;

                                const isLast = index === filteredOutstationList.length - 1;
                                const className = `py-3 px-5 ${isLast ? "" : "border-b border-blue-gray-50"}`;

                                return (
                                    <tr key={id}>
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
                                            <Link to={`/dashboard/finance/master-price/details/${id}`}>
                                                <Typography variant="small" color="blue" className="font-semibold underline cursor-pointer" >
                                                    {(period === '1' && extraCabType === '0') ? 'Custom Date' : period}
                                                </Typography>
                                            </Link>
                                        </td>
                                        <td className={className}>
                                            <div >
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {kilometer || '-'}
                                                </Typography>
                                            </div>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {price || '0'}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {additionalMinCharge || '-'}
                                            </Typography>
                                        </td>
                                        <td className={className}>
                                            <Typography className="text-xs font-semibold text-blue-gray-900">
                                                {extraKmPrice || '-'}
                                            </Typography>
                                        </td>
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
        return (
            <div className='my-6'>
                <h3 className="text-3xl font-bold mb-4 ml-2">Rides</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {[
                                        "Zone",
                                        "Rate Parameter",
                                        'Base KM',
                                        "Base Fare (Mini)",
                                        "Base Fare (Sedan)",
                                        "Base Fare (SUV)",
                                        "Base Fare (MUV)",
                                        "Rate Per KM (Mini,SUV,Sedan)",
                                        "Rate Per KM (MUV)",
                                        "Rate Per Min",
                                        "Surcharge Percentage",
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
                                {ridesData.map(({
                                    id,
                                    zone,
                                    baseKm,
                                    baseFare,
                                    baseFareSedan, 
                                    baseFareSuv,
                                    baseFareMVP,
                                    kilometerPrice,
                                    kilometerPriceMVP,
                                    rateParameter,
                                    minCharge,
                                    surChargePercentage,
                                    status,
                                }, key) => {
                                    const className = `py-3 px-5 ${key === ridesData?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                    return (
                                        <tr key={id}>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {zone}
                                                </Typography>
                                            </td>
                                            <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                <div className="flex items-center gap-4">
                                                    <Link to={`/dashboard/finance/master-price/rides-details/${id}`}>
                                                        <Typography
                                                            variant="small"
                                                            color="blue"
                                                            className="font-semibold underline cursor-pointer"
                                                        >
                                                            {rateParameter}
                                                        </Typography>
                                                    </Link>
                                                </div>
                                            </td>
                                             <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseKm}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseFare}
                                                </Typography>
                                            </td>
                                              <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseFareSedan}
                                                </Typography>
                                            </td>
                                              <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseFareSuv}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseFareMVP}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerPrice}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerPriceMVP}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {minCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {surChargePercentage}%
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
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };

    const renderLocalRentalsTable = () => {
        return (
            <div className='my-6'>
                <h3 className="text-3xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {[
                                        "Zone",
                                        "Type",
                                        "Package",
                                        'Base KM',
                                        "Base Fare",
                                        "Kilometer",
                                        "Kilometer Rate",
                                        "Additional Mins",
                                        "Additional KM Rate",
                                        "Night Charge",
                                        // "Toll Charge",
                                        // "Driver Charge",
                                        "Cancellation Mins",
                                        "Cancel Charge",
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
                                {localPackageList.map(({
                                    id,
                                    zone,
                                    type,
                                    carType,
                                    baseKm,
                                    baseFare,
                                    kilometerPrice,
                                    kilometer,
                                    additionalMinCharge,
                                    nightCharge,
                                    // driverCharge,
                                    // tollCharge,
                                    period,
                                    extraKmPrice,
                                    cancelMins,
                                    cancelCharge,
                                    status
                                }, key) => {
                                    const className = `py-3 px-5 ${key === localPackageList?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                    return (
                                        <tr key={id}>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {zone}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {type.toUpperCase()}
                                                </Typography>
                                            </td>
                                            <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                <div className="flex items-center gap-4">
                                                    <Link to={`/dashboard/finance/master-price/rentals-details/${id}`}>
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
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseKm}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseFare}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometer}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerPrice}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {additionalMinCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {extraKmPrice}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {nightCharge}
                                                </Typography>
                                            </td>
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {tollCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {driverCharge}
                                                </Typography>
                                            </td> */}
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {cancelMins}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {cancelCharge}
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
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };
    const renderOutstationRentalsTable = () => {
        return (
            <div className='my-2'>
                <h3 className="text-3xl font-bold mb-4 ml-2">OutStation</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {[
                                        "Zone",
                                        "Type",
                                        "Package",
                                        "Base Km",
                                        "Base Fare",
                                        // "Kilometer",
                                        // "Hours Limit",
                                        "kilometer Round Price",
                                        "kilometer Round Price MVP",
                                        "kilometer Round Price Suv",
                                        "kilometer Round Price Sedan",
                                        "Kilometer Rate",
                                        "Additional Mins",
                                        "Additional KM Rate",
                                        "Night Charge",
                                        "Toll Charge",
                                        "Driver Charge",
                                        "Cancellation Mins",
                                        "Cancel Charge",
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
                                {outstationPackageList.map(({
                                    id,
                                    zone,
                                    type,
                                    carType,
                                    baseKm,
                                    baseFare,
                                    kilometerPrice,
                                    // kilometer,
                                    // hourLimit,
                                    kilometerRoundPrice,
                                    kilometerRoundPriceMVP,
                                    kilometerRoundPriceSuv,
                                    kilometerRoundPriceSedan,
                                    additionalMinCharge,
                                    nightCharge,
                                    driverCharge,
                                    tollCharge,
                                    period,
                                    extraKmPrice,
                                    cancelMins,
                                    cancelCharge,
                                    status
                                }, key) => {
                                    const className = `py-3 px-5 ${key === outstationPackageList?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                    return (
                                        <tr key={id}>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-900">
                                                    {zone}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {type.toUpperCase()}
                                                </Typography>
                                            </td>
                                            <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                <div className="flex items-center gap-4">
                                                    <Link to={`/dashboard/finance/master-price/rentals-details/${id}`}>
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
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseKm}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseFare}
                                                </Typography>
                                            </td>
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometer}
                                                </Typography>
                                            </td> */}
                                            {/* <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {hourLimit}
                                                </Typography>
                                            </td> */}
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerPrice}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerRoundPrice}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerRoundPriceMVP}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerRoundPriceSuv}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerRoundPriceSedan}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {additionalMinCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {extraKmPrice}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {nightCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {tollCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {driverCharge}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {cancelMins}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {cancelCharge}
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
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };
    const LocalParcelTable = () => {
        const hideSubZoneColumn = parcelPackageRows.length > 0
            && parcelPackageRows.every((row) => normalizeVehicleType(row.parcelVehicleType) === "AUTO");
        const parcelTableHeaders = hideSubZoneColumn
            ? ["Zone", "Base Fare", "Base Km", "Kilometer Price", "Actions"]
            : ["Zone", "Sub Zone", "Base Fare", "Base Km", "Kilometer Price", "Actions"];
        return (
            <div className='my-6'>
                <h3 className="text-3xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
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
        return (
            <div className='my-6'>
                <h3 className="text-3xl font-bold mb-4 ml-2">Local</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 rounded-2xl">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {[
                                        "zone",
                                        "Type",
                                        "Base Fare",
                                        "base Km",
                                        "Kilometer Rate",
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
                                {autoLocalPackageList.map(({
                                    zone,
                                    id,
                                    type,
                                    baseFare,
                                    baseKm,
                                    kilometerPrice,
                                    status
                                }, key) => {
                                    const className = `py-3 px-5 ${key === autoLocalPackageList?.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                    return (
                                        <tr key={id}>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {zone}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    <Link to={`/dashboard/finance/master-price/auto-edit/${id}`} className="cursor-pointer underline text-blue-600">
                                                        {type.toUpperCase()}
                                                    </Link>
                                                </Typography>
                                            </td>
                                            
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseFare}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {baseKm}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {kilometerPrice}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {status == 1 ? 'Active' : 'InActive'}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Link to={`/dashboard/finance/master-price/auto-edit/${id}`} className={`px-3 py-1 rounded-lg inline-block ${ColorStyles.editButton}`}>
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                        
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
            <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
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
                                </select>
                                {serviceType === "" && <div className="text-red-500 text-sm mt-1">Please select a service type</div>}
                            </div>
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
            {serviceType === 'PARCEL' && parcelLocalPackageList && parcelLocalPackageList.length > 0 ? (
                <div>{LocalParcelTable()}</div>
            ): (<></>)}
            
        </>

    );
};
