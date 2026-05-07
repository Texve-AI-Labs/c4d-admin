import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Button, Card, CardBody, Typography } from '@material-tailwind/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import { CAB_ADD_SCHEMA } from '@/utils/validations';
import LocationInput from '@/pages/account/new/LocationInput';
import AccountCreationTabs from '@/pages/account/new/AccountCreationTabs';

const updatePricesForCarType = (carType, values, setFieldValue, packageDetails) => {
    if (values.packages.length === 0) return;

    const newPrices = values.prices.map(price => {
        const packageItem = packageDetails.find(p => p.id === price.packageId);

        if (!packageItem) return price;

        if (packageItem.type === 'Rides') {
            return {
                ...price,
                baseFare: carType === 'MINI' ? packageItem.baseFare :
                    carType === 'Sedan' ? packageItem.baseFareSedan :
                        carType === 'SUV' ? packageItem.baseFareSuv :
                            packageItem.baseFareMVP,
                kilometerPrice: carType === 'MINI' ? packageItem.kilometerPrice :
                    carType === 'Sedan' ? packageItem.kilometerPriceSedan :
                        carType === 'SUV' ? packageItem.kilometerPriceSuv :
                            packageItem.kilometerPriceMVP,
                minCharge: packageItem.minCharge
            };
        } else {
            return {
                ...price,
                baseFare: carType === 'MINI' ? packageItem.baseFare :
                    carType === 'Sedan' ? packageItem.baseFareSedan :
                        carType === 'SUV' ? packageItem.baseFareSuv :
                            packageItem.baseFareMVP,
                kilometerPrice: carType === 'MINI' ? packageItem.kilometerPrice :
                    carType === 'Sedan' ? packageItem.kilometerPriceSedan :
                        carType === 'SUV' ? packageItem.kilometerPriceSuv :
                            packageItem.kilometerPriceMVP,
                additionalMinCharge: carType === 'MINI' ? packageItem.additionalMinCharge :
                    carType === 'Sedan' ? packageItem.additionalMinChargeSedan :
                        carType === 'SUV' ? packageItem.additionalMinChargeSuv :
                            packageItem.additionalMinChargeMVP
            };
        }
    });

    setFieldValue("prices", newPrices);
};

const isPdfFile = (src = "") =>
    String(src).toLowerCase().includes(".pdf") || String(src).toLowerCase().startsWith("data:application/pdf");

const DocumentPreview = ({ src, zoom = 1, onZoomIn, onZoomOut }) => {
    if (!src) return null;
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (zoom <= 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || zoom <= 1) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isPdfFile(src)) {
        return (
            <div className="w-full">
                <div className="w-full flex justify-end gap-2 mb-2">
                    <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomOut}>-</Button>
                    <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomIn}>+</Button>
                </div>
                <div
                    className={`w-full h-[38vh] md:h-[44vh]  border border-gray-200 bg-white overflow-hidden ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        className="w-full h-full"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transformOrigin: "center center",
                        }}
                    >
                        <iframe
                            src={src}
                            className="w-full h-full pointer-events-none"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="w-full flex justify-end gap-2 mb-2">
                <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomOut}>-</Button>
                <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomIn}>+</Button>
            </div>
            <div
                className={`w-full h-[38vh] md:h-[44vh]  border border-gray-200 bg-white p-2 overflow-hidden ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img
                    src={src}
                    alt="Document preview"
                    className="w-full h-full object-contain select-none"
                    draggable={false}
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: "center center",
                    }}
                />
            </div>
        </div>
    );
};

const CabAddNew = () => {
    const [cabVal, setCabVal] = useState({});
    const [packageDetails, setPackageDetails] = useState([]);
    const [owneraddressSuggestions, setOwnerAddressSuggestions] = useState([]);
    const [driverAddressSuggestions, setDriverAddressSuggestions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [accountRelatedDrivers, setAccountRelatedDrivers] = useState([]);
    const [carType, setCarType] = useState([]);
    const [selectedCarType, setSelectedCarType] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    const [showCarTypeError, setShowCarTypeError] = useState(false);
    const [vehicleDocTypes, setVehicleDocTypes] = useState([]);
    const [existingVehicleDocsByType, setExistingVehicleDocsByType] = useState({});
    const [selectedVehicleDocType, setSelectedVehicleDocType] = useState("");
    const [previewZoom, setPreviewZoom] = useState({});
    const location = useLocation();
    const { ownerName, type, accountId, vehicleDocuments } = location.state || {};
    const effectiveAccountId = accountId || id;

    useEffect(() => {
        const fetchVehicleDocumentsData = async () => {
            if (!effectiveAccountId) return;
            try {
                const accountRes = await ApiRequestUtils.get(`${API_ROUTES.GET_ACCOUNT_BY_ID}/${effectiveAccountId}`);
                const accountData = accountRes?.data?.data || {};
                const proofs = accountData?.Proofs || [];

                const proofMap = {};
                proofs.forEach((proof) => {
                    if (proof?.type) {
                        proofMap[proof.type] = {
                            image1: proof.image1 || null,
                            image2: proof.image2 || null,
                        };
                    }
                });
                setExistingVehicleDocsByType(proofMap);

                const requiredDocsRes = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_REQUIRED_DOCUMENTS, {
                    subjectType: "ACCOUNT",
                    serviceType: type || accountData?.type || "Individual",
                });
                const requiredList = requiredDocsRes?.data?.vehicleRequiredDocuments || [];
                setVehicleDocTypes(requiredList);
                if (requiredList.length > 0) {
                    setSelectedVehicleDocType((prev) => prev || requiredList[0]);
                }
            } catch (error) {
                console.error("Failed to fetch vehicle documents data:", error);
            }
        };

        fetchVehicleDocumentsData();
    }, [effectiveAccountId, type]);

    const getAccountNames = async () => {
        try {
            const data = await ApiRequestUtils.get(API_ROUTES.GET_ACCOUNT);
            if (data?.success) {
                setAccountOptions(data.data.map(account => ({
                    value: account.id,
                    label: account.name
                })));
            }
        } catch (error) {
            console.error('Error fetching account names:', error);
        }
    };

    const orderPackages = (packages, type) => {
        return packages.sort((a, b) => {
            if (type === 'Local') {
                const hoursA = parseInt(a.period);
                const hoursB = parseInt(b.period);
                return hoursA - hoursB;
            } else if (type === 'CarWash') {
                const numberA = parseInt(a.period.match(/\d+/)[0]);
                const numberB = parseInt(b.period.match(/\d+/)[0]);
                return numberA - numberB;
            }
            return 0;
        });
    };

    const getAccountRelatedDrivers = async (accountId) => {
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ACCOUNT_RELATED_DRIVERS, {
            accountId: accountId
        });

        if (data?.success && data?.data.length > 0) {
            setAccountRelatedDrivers(data?.data);
        }
    };

    const getCarTypes = async (accountId) => {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_CAR_TYPE + "all");
        if (data?.success && data?.data.length > 0) {
            setCarType(data?.data);
        }
    };

    const getPackageListDetails = async () => {
        const data = await ApiRequestUtils.get(API_ROUTES.PACKAGE_CABS_LIST);
        if (data?.success) {
            const packageData = data?.data.map(option => {
                const suffix = option.zone === 'Vellore' ? (option.type === 'Local' ? 'hr' : option.type === 'Outstation' ? 'd' : option.type === 'Rides' ? 'Rides' : '') : '';
                return {
                    ...option,
                    period: `${option.zone === 'Vellore' && option.type !== 'Rides' ? option.period : ''} ${suffix}`.trim(),
                };
            });

            // Log only Vellore packages
            console.log("Vellore Packages:", packageData.filter(val => val.zone === 'Vellore'));

            const intercityPackage = orderPackages(packageData.filter(val => val.zone === 'Vellore' && val.type === 'Local'), 'Local');
            const outstationPackage = packageData.filter(val => val.zone === 'Vellore' && val.type === 'Outstation' && val.period === '1 d');
            const carWashPackage = orderPackages(packageData.filter(val => val.zone === 'Vellore' && val.type === 'CarWash'), 'CarWash');
            const ridesPackagePrices = packageData.filter(val => val.zone === 'Vellore' && val.type === 'Rides');

            setPackageDetails([
                ...intercityPackage,
                ...outstationPackage,
                ...carWashPackage,
                ...ridesPackagePrices
            ]);
        }
    };


    useEffect(() => {
        getCarTypes();
        getPackageListDetails();
        getAccountNames();
        if (effectiveAccountId) {
            getAccountRelatedDrivers(effectiveAccountId);
        }
    }, [effectiveAccountId]);


    const initialValues = {
        name: cabVal?.name || "",
        ownerName: ownerName ? ownerName : '',
        assignedTo: type == 'Individual' ? 'Owner' : 'Driver',
        carNumber: cabVal?.carNumber || "",
        address: cabVal?.curAddress || "",
        insurance: cabVal?.insurance || "",
        withDriver: cabVal?.withDriver || "",
        assignOrAddDriver: cabVal?.assignOrAddDriver || "",
        driverId: cabVal?.driverId || "",
        accountId: effectiveAccountId,
        driverName: cabVal?.driverName || "",
        phoneNumber: cabVal?.phoneNumber || "",
        driverAddress: cabVal?.driverAddress || "",
        licenseNumber: cabVal?.driverLicense || "",
        carType: cabVal?.carType || "",
        packages: cabVal?.packages || [],
        prices: [],
    };

    const searchLocations = async (query, type) => {
        if (query.length > 2) {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
                address: query
            });
            if (data?.success && data?.data) {
                if (type === 'owner') {
                    setOwnerAddressSuggestions(data?.data);
                    setDriverAddressSuggestions([]);
                } else {
                    setDriverAddressSuggestions(data?.data);
                    setOwnerAddressSuggestions([]);
                }
            }
        } else {
            if (type === 'owner') {
                setOwnerAddressSuggestions([]);
            } else {
                setDriverAddressSuggestions([]);
            }
        }
    };

    const renderPriceTable = (title, prices, values) => {
        if (prices.length === 0) return null;

        const sortedPrices = [...prices].sort((a, b) => {
            const packageA = packageDetails.find(p => p.id === a.packageId);
            const packageB = packageDetails.find(p => p.id === b.packageId);

            if (title === "LOCAL") {
                const hoursA = parseInt(packageA.period);
                const hoursB = parseInt(packageB.period);
                return hoursA - hoursB;
            } else if (title === "CAR WASH") {
                const numberA = parseInt(packageA.period.match(/\d+/)[0]);
                const numberB = parseInt(packageB.period.match(/\d+/)[0]);
                return numberA - numberB;
            }
            return 0;
        });

        return (
            <div className="mb-8 hidden">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Package", "Package KM", "Base Fare", "Rate Per KM", "Extra Mins Rate"].map((el) => (
                                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="h6" className="text-[12px] font-bold uppercase text-black">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPrices.map((priceItem) => (
                                    <tr key={priceItem.packageId}>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            <Typography variant="small" color="blue-gray" className="font-semibold">
                                                {priceItem.period}
                                            </Typography>
                                        </td>
                                        {['kilometer', 'baseFare', 'kilometerPrice', 'additionalMinCharge'].map((field) => (
                                            <td key={field} className="py-3 px-5 border-b border-blue-gray-50">
                                                <Field
                                                    name={`prices[${values.prices.indexOf(priceItem)}].${field}`}
                                                    type="number"
                                                    className="w-full p-1 text-xs border rounded"
                                                />
                                                <ErrorMessage
                                                    name={`prices[${values.prices.indexOf(priceItem)}].${field}`}
                                                    component="div"
                                                    className="text-red-500 text-xs"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };

    const renderRidesPriceTable = (title, prices, values, setFieldValue) => {
        if (prices.length === 0) return null;

        return (
            <div className="mb-8 hidden">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {[
                                        "Package",
                                        "Base Fare",
                                        "Per Kilometer Rate",
                                        "Per Minute Rate"
                                    ].map((el) => (
                                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="h6" className="text-[12px] font-bold uppercase text-black">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {prices.map((priceItem, index) => (
                                    <tr key={priceItem.packageId}>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            <Typography variant="small" color="blue-gray" className="font-semibold">
                                                Rides
                                            </Typography>
                                        </td>
                                        {[
                                            "baseFare",
                                            "kilometerPrice",
                                            "minCharge"
                                        ].map((field) => (
                                            <td key={field} className="py-3 px-5 border-b border-blue-gray-50">
                                                <Field
                                                    name={`prices[${values.prices.indexOf(priceItem)}].${field}`}
                                                    type="number"
                                                    className="w-full p-1 text-xs border rounded"
                                                />
                                                <ErrorMessage
                                                    name={`prices[${values.prices.indexOf(priceItem)}].${field}`}
                                                    component="div"
                                                    className="text-red-500 text-xs"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        );
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const cabDetails = {
                name: values.name,
                carNumber: values.carNumber,
                curAddress: values.address,
                insurance: values.insurance,
                carType: values.carType,
                vehicleType: values.vehicleType,
                seater: values.seater,
                luggage: values.luggage,
                modelYear: values.modelYear,
                assigned: values.assignedTo,
                withDriver: values.withDriver,
                driverName: values.driverName,
                phoneNumber: values.phoneNumber,
                driverAddress: values.driverAddress,
                driverLicense: values.licenseNumber,
                packages: values.packages,
                accountId: values.accountId,
                driverId: values.driverId,
            }
            const prices = values.prices;
            let res = { cabDetails: JSON.stringify(cabDetails), prices: JSON.stringify(prices) };
            const resp = await ApiRequestUtils.post(API_ROUTES.REGISTER_CAB, res);
            console.log('CAB DATA :', resp);
            if (!resp?.success && resp?.code === 203) {
                resetForm();
            }
            if (!resp?.success && resp?.code === 401) {
                resetForm();
            }
            else if (resp?.success && resp?.code === 200) {
                navigate(`/dashboard/vendors/account/new`);
            }

        } catch (error) {
            console.error('Error creating driver and car:', error);
        }
        setSubmitting(false);
    };
    const currentDate = () => {
        return (new Date()).toISOString().split('T')[0];
    };

    const getZoomKey = (docType, imageIndex) => `${docType || "UNKNOWN"}_${imageIndex}`;

    const getZoomValue = (docType, imageIndex) => {
        const key = getZoomKey(docType, imageIndex);
        return previewZoom[key] || 1;
    };

    const updateZoom = (docType, imageIndex, direction) => {
        const key = getZoomKey(docType, imageIndex);
        setPreviewZoom((prev) => {
            const current = prev[key] || 1;
            const next = direction === "in"
                ? Math.min(2.5, Number((current + 0.1).toFixed(2)))
                : Math.max(0.6, Number((current - 0.1).toFixed(2)));
            return { ...prev, [key]: next };
        });
    };

    return (
        <div className="p-4 mx-auto bg-white rounded-xl shadow-md">
            <AccountCreationTabs activeStage={4} />
            {/* <h2 className="text-2xl font-bold mb-4">Add New Cab New</h2> */}
            <Formik
                initialValues={initialValues}
                validationSchema={CAB_ADD_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, errors, dirty, isValid, handleChange, setFieldValue, touched }) => (
                    <Form className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">Vehicle Name</label>
                                <Field type="text" name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                            </div>
                            <div>
                                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Owner Name</label>
                                <Field type="text" name="ownerName" disabled className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Car Type</p>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="carType" value="MINI" className="form-radio" onChange={(e) => {
                                            handleChange(e);
                                            setSelectedCarType("Mini");
                                            updatePricesForCarType("MINI", values, setFieldValue, packageDetails);
                                        }} />
                                        <span className="ml-2">Mini</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="carType" value="Sedan" className="form-radio" onChange={(e) => {
                                            handleChange(e);
                                            setSelectedCarType("Sedan");
                                            updatePricesForCarType("Sedan", values, setFieldValue, packageDetails);
                                        }} />
                                        <span className="ml-2">Sedan</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="carType" value="SUV" className="form-radio" onChange={(e) => {
                                            handleChange(e);
                                            setSelectedCarType("SUV");
                                            updatePricesForCarType("SUV", values, setFieldValue, packageDetails);
                                        }} />
                                        <span className="ml-2">SUV</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="carType" value="MUV" className="form-radio" onChange={(e) => {
                                            handleChange(e);
                                            setSelectedCarType("MUV");
                                            updatePricesForCarType("MUV", values, setFieldValue, packageDetails);
                                        }} />
                                        <span className="ml-2">MUV</span>
                                    </label>
                                </div>
                                <ErrorMessage name="carType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">Vehicle Type</label>
                                <Field as="select" name="vehicleType" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select Type</option>
                                    {carType
                                        .filter((type) => type.carType == selectedCarType)
                                        .map((type) => (
                                            <option key={type.id} value={type.carModel}>
                                                {type.carModel}
                                            </option>
                                        ))}
                                </Field>
                                <ErrorMessage name="vehicleType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="seater" className="text-sm font-medium text-gray-700">Seater</label>
                                <Field type="text" name="seater" className="p-2 w-full border-2 rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="luggage" className="text-sm font-medium text-gray-700">Luggage</label>
                                <Field type="text" name="luggage" className="p-2 w-full border-2  rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="luggage" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">Year of Model</label>
                                <Field type="text" name="modelYear" className="p-2 w-full border-2 rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="assignedTo" className="text-sm font-medium text-gray-700">Assigned To</label>
                                <Field as="select" disabled={type == 'Individual'} name="assignedTo" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select Type</option>
                                    <option value="Driver">Driver</option>
                                    <option value="Owner">Owner</option>
                                </Field>
                                <ErrorMessage name="assignedTo" component="div" className="text-red-500 text-sm" />
                            </div>
                            {type != 'Individual' && values.assignedTo == 'Driver' && <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">With Driver</p>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="withDriver" value="Yes" className="form-radio"
                                            onChange={e => {
                                                handleChange(e);
                                            }} />
                                        <span className="ml-2">Yes</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="withDriver" value="No" className="form-radio"
                                            onChange={e => {
                                                handleChange(e);
                                            }} />
                                        <span className="ml-2">No</span>
                                    </label>
                                </div>
                                <ErrorMessage name="withDriver" component="div" className="text-red-500 text-sm" />
                            </div>}
                            {(values.withDriver === 'Yes' && values.assignedTo == 'Driver') && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Assign or Add Driver</p>
                                        <div className="space-x-4">
                                            <label className="inline-flex items-center">
                                                <Field type="radio" name="assignOrAddDriver" value="Assign" className="form-radio"
                                                    onChange={e => {
                                                        handleChange(e);
                                                        setFieldValue('driverId', values.driverId, true);
                                                    }} />
                                                <span className="ml-2">Assign</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <Field type="radio" name="assignOrAddDriver" value="Add" className="form-radio"
                                                    onChange={e => {
                                                        handleChange(e);
                                                    }} />
                                                <span className="ml-2">Add</span>
                                            </label>
                                        </div>
                                        <ErrorMessage name="assignOrAddDriver" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    {values?.assignOrAddDriver === 'Assign' && accountRelatedDrivers.length > 0 &&
                                        <div>
                                            <label htmlFor="driverId" className="text-sm font-medium text-gray-700">Driver</label>
                                            <Field
                                                as="select"
                                                name="driverId"
                                                className="p-2 w-full rounded-md border-gray-300 shadow-sm"

                                            >
                                                <option value="">Select Driver</option>
                                                {accountRelatedDrivers.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.firstName}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                        </div>
                                    }
                                    {values?.assignOrAddDriver === 'Add' && <div>
                                        <label htmlFor="driverName" className="text-sm font-medium text-gray-700">Driver Name</label>
                                        <Field type="text" name="driverName" className="p-2 w-full border-2 rounded-md border-gray-300" />
                                        <ErrorMessage name="driverName" component="div" className="text-red-500 text-sm" />
                                    </div>}
                                    {values?.assignOrAddDriver === 'Add' && <div>
                                        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <Field type="tel" name="phoneNumber" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                        <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                    </div>}
                                    {values?.assignOrAddDriver === 'Add' && <div>
                                        <label htmlFor="driverAddress" className="text-sm font-medium text-gray-700">Driver Address</label>
                                        <Field name="driverAddress">
                                            {({ field, form }) => (
                                                <LocationInput
                                                    field={field}
                                                    form={form}
                                                    suggestions={driverAddressSuggestions}
                                                    onSearch={(query) => searchLocations(query, "driver")}
                                                    onSelect={() => { }}
                                                />
                                            )}
                                        </Field>
                                        <ErrorMessage name="driverAddress" component="div" className="text-red-500 text-sm" />
                                    </div>}
                                    {values?.assignOrAddDriver === 'Add' && <div>
                                        <label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">License Number</label>
                                        <Field type="text" name="licenseNumber" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={16} />
                                        <ErrorMessage name="licenseNumber" component="div" className="text-red-500 text-sm" />
                                    </div>}
                                </>
                            )}
                            <div>
                                {showCarTypeError && (
                                    <div className="text-red-500 text-sm mt-1">
                                        Please select a car type before choosing packages
                                    </div>
                                )}
                                <label htmlFor="packages" className="text-sm font-medium text-gray-700">Package</label>
                                <Multiselect
                                    options={packageDetails}
                                    displayValue="period"
                                    selectedValues={packageDetails.filter(option => values.packages.includes(option.id))}
                                    onSelect={(selectedList) => {
                                        if (!values.carType) {
                                            setShowCarTypeError(true);
                                            return;
                                        }
                                        setShowCarTypeError(false);
                                        setFieldValue("packages", selectedList.map(item => item.id));

                                        const newPrices = selectedList.map(item => {
                                            const basePrice = {
                                                packageId: item.id,
                                                period: item.period,
                                                type: item.type
                                            };

                                            if (item.type === 'Rides') {
                                                return {
                                                    ...basePrice,
                                                    baseFare: values.carType === 'MINI' ? item.baseFare :
                                                        values.carType === 'Sedan' ? item.baseFareSedan :
                                                            values.carType === 'SUV' ? item.baseFareSuv :
                                                                item.baseFareMVP,
                                                    kilometerPrice: values.carType === 'MINI' ? item.kilometerPrice :
                                                        values.carType === 'Sedan' ? item.kilometerPriceSedan :
                                                            values.carType === 'SUV' ? item.kilometerPriceSuv :
                                                                item.kilometerPriceMVP,
                                                    minCharge: item.minCharge
                                                };
                                            } else {
                                                return {
                                                    ...basePrice,
                                                    kilometer: item.kilometer,
                                                    baseFare: values.carType === 'MINI' ? item.baseFare :
                                                        values.carType === 'Sedan' ? item.baseFareSedan :
                                                            values.carType === 'SUV' ? item.baseFareSuv :
                                                                item.baseFareMVP,
                                                    kilometerPrice: values.carType === 'MINI' ? item.kilometerPrice :
                                                        values.carType === 'Sedan' ? item.kilometerPriceSedan :
                                                            values.carType === 'SUV' ? item.kilometerPriceSuv :
                                                                item.kilometerPriceMVP,

                                                    additionalMinCharge: values.carType === 'MINI' ? item.additionalMinCharge :
                                                        values.carType === 'Sedan' ? item.additionalMinChargeSedan :
                                                            values.carType === 'SUV' ? item.additionalMinChargeSuv :
                                                                item.additionalMinChargeMVP
                                                };
                                            }
                                        });

                                        setFieldValue("prices", newPrices);
                                    }}
                                    onRemove={(selectedList, removedItem) => {
                                        setFieldValue("packages", selectedList.map(item => item.id));
                                        setFieldValue("prices", values.prices.filter(price => price.packageId !== removedItem.id));
                                    }}
                                    placeholder={!values.carType ? "Please select car type first" : "Select packages"}
                                    className="w-full rounded-md border-gray-300"
                                    showCheckbox={true}
                                    disabled={!values.carType}
                                    style={{
                                        chips: {
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                        },
                                    }}
                                />

                            </div>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">Vehicle Documents</p>
                            <Card>
                                <CardBody className="px-4 py-4">
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="lg:w-[26%] border border-blue-gray-100 rounded-lg overflow-hidden">
                                            <div className="px-3 py-2 border-b border-blue-gray-100 bg-blue-gray-50">
                                                <Typography className="text-xs font-bold uppercase text-blue-gray-500">Type</Typography>
                                            </div>
                                            {vehicleDocTypes.length === 0 ? (
                                                <div className="px-3 py-3">
                                                    <Typography className="text-sm text-blue-gray-500">No document types</Typography>
                                                </div>
                                            ) : (
                                                vehicleDocTypes.map((docType, idx) => (
                                                    <button
                                                        key={docType}
                                                        type="button"
                                                        onClick={() => setSelectedVehicleDocType(docType)}
                                                        className={`w-full text-left px-3 py-3 ${idx !== vehicleDocTypes.length - 1 ? "border-b border-blue-gray-100" : ""} ${selectedVehicleDocType === docType ? "bg-blue-50" : "bg-white hover:bg-blue-gray-50"}`}
                                                    >
                                                        <Typography className="text-sm font-semibold text-blue-gray-900">{docType}</Typography>
                                                    </button>
                                                ))
                                            )}
                                        </div>

                                        <div className="lg:w-[74%]">
                                            <div className="w-full max-w-4xl min-h-[72vh] border border-blue-gray-100 rounded-lg bg-white p-3">



                                                <div className="space-y-4">
                                                    <Typography className="text-xs font-semibold text-blue-gray-700">{selectedVehicleDocType}</Typography>
                                                    {existingVehicleDocsByType[selectedVehicleDocType]?.image1 ? (
                                                        <div className="max-h-[56vh] overflow-y-auto overflow-x-hidden pr-1">
                                                            <div className={`grid w-full gap-3 ${existingVehicleDocsByType[selectedVehicleDocType]?.image2 ? "grid-cols-2" : "grid-cols-1"}`}>
                                                                <DocumentPreview
                                                                    src={existingVehicleDocsByType[selectedVehicleDocType]?.image1}
                                                                    zoom={getZoomValue(selectedVehicleDocType, 1)}
                                                                    onZoomOut={() => updateZoom(selectedVehicleDocType, 1, "out")}
                                                                    onZoomIn={() => updateZoom(selectedVehicleDocType, 1, "in")}
                                                                />
                                                                {existingVehicleDocsByType[selectedVehicleDocType]?.image2 && (
                                                                    <DocumentPreview
                                                                        src={existingVehicleDocsByType[selectedVehicleDocType]?.image2}
                                                                        zoom={getZoomValue(selectedVehicleDocType, 2)}
                                                                        onZoomOut={() => updateZoom(selectedVehicleDocType, 2, "out")}
                                                                        onZoomIn={() => updateZoom(selectedVehicleDocType, 2, "in")}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-[38vh] md:h-[44vh] border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-500">
                                                            No document available
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 w-full mt-2">
                                                    <div>
                                                        <label htmlFor="carNumber" className="text-sm font-medium text-gray-700">Car Number</label>
                                                        <Field type="text" name="carNumber" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                                        <ErrorMessage name="carNumber" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="address" className="text-sm font-medium text-gray-700">Address</label>
                                                        <Field name="address">
                                                            {({ field, form }) => (
                                                                <LocationInput
                                                                    field={field}
                                                                    form={form}
                                                                    suggestions={owneraddressSuggestions}
                                                                    onSearch={(query) => searchLocations(query, "owner")}
                                                                    onSelect={() => { }}
                                                                />
                                                            )}
                                                        </Field>
                                                        <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 w-full mt-2">
                                                    <label htmlFor="insurance" className="text-sm font-medium text-gray-700">Insurance Expiry Date</label>
                                                    <Field type="date" name="insurance" className="p-2 w-full rounded-xl border-2 border-gray-300" min={currentDate()} />
                                                    <ErrorMessage name="insurance" component="div" className="text-red-500 text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                        {values.packages.length > 0 && (
                            <div className='hidden'>
                                <h2 className="text-2xl font-bold mb-4">Price Details</h2>
                                {renderPriceTable(
                                    "LOCAL",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'Local';
                                    }),
                                    values
                                )}

                                {renderPriceTable(
                                    "OUTSTATION",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'Outstation';
                                    }),
                                    values
                                )}

                                {renderPriceTable(
                                    "CAR WASH",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'CarWash';
                                    }),
                                    values
                                )}

                                {renderRidesPriceTable(
                                    "Rides",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'Rides';
                                    }),
                                    values,
                                    setFieldValue
                                )}
                            </div>
                        )}
                        <div className='flex flex-row'>
                            <Button
                                fullWidth
                                onClick={() => { navigate('/dashboard/vendors/account'); }}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                color="black"
                                onClick={handleSubmit}
                                disabled={!dirty || !isValid}
                                className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                            >
                                Continue
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default CabAddNew;