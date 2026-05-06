import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles, KYC_PROCESS } from '@/utils/constants';
import {
    Alert, Button, Card, CardBody, Typography, Input, List, ListItem, Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
} from '@material-tailwind/react';
import { useNavigate, useLocation } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import { CAB_ADD_SCHEMA } from '@/utils/validations';
import LocationInput from "@/components/LocationInput";
import CabDocuments from '../cab/CabDocuments';



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

const DocumentUpload = ({ label, value, name, onChange, status, hideAction, isUploading, onView }) => {
    const statusLabel = status === "PENDING" ? "UPLOADED" : (status || "UPLOADED");
    return (
        <tr>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <Typography className="text-xs font-semibold text-blue-gray-600">{label}</Typography>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <Typography className={`text-xs font-semibold ${isUploading ? 'text-blue-600' : !value ? 'text-primary-500' : status === 'APPROVED' ? 'text-green-500' : status === 'DECLINED' ? 'text-red-500' : 'text-amber-600'
                    }`}>
                    {isUploading ? "UPLOADING..." : (!value ? "NO DOCUMENTS" : statusLabel)}
                </Typography>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                {!hideAction && (
                    <div className="flex items-center gap-2">
                        <label htmlFor={name} className="inline-block text-center text-white border border-gray-400 bg-black rounded-lg px-4 py-1 cursor-pointer">
                            Upload
                        </label>
                        <input
                            type="file"
                            accept="image/*, application/pdf"
                            id={name}
                            name={name}
                            onChange={onChange}
                            className="hidden"
                            multiple={name !== "insurance" && name !== "permit" && name !== "livePhoto"}
                        />
                    </div>
                )}
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                {value && (
                    <Typography
                        variant="small"
                        className="font-semibold underline cursor-pointer text-primary-900"
                        onClick={onView}
                    >
                        View/Download
                    </Typography>
                )}
            </td>
        </tr>
    );
};

const CabAddNew = () => {
    const [cabVal, setCabVal] = useState({});
    const [alert, setAlert] = useState(false);
    const [packageDetails, setPackageDetails] = useState([]);
    const [driverAddressSuggestions, setDriverAddressSuggestions] = useState([]);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [accountRelatedDrivers, setAccountRelatedDrivers] = useState([]);
    const [carType, setCarType] = useState([]);
    const [selectedCarType, setSelectedCarType] = useState('');
    const navigate = useNavigate();
    const [showCarTypeError, setShowCarTypeError] = useState(false);
    const [uploadingDocs, setUploadingDocs] = useState({});
    const [loading, setLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState({
        drivingLicenseImage: null,
        rc: null,
        vehiclePhoto: null,
        insurance: null,
        permit: null,
    });
    const [docModalData, setDocModalData] = useState(null);
    const location = useLocation();
    const { ownerName = "", type = "", accountId = "" } = location.state || {};



    useEffect(() => {
        if (!accountId) {
            navigate("/dashboard/vendors/account/add/new/step-1");
        }
    }, [accountId, navigate]);


    const orderPackages = (packages, type) => {
        return packages.sort((a, b) => {
            if (type === 'Local') {
                const hoursA = parseInt(a.period);
                const hoursB = parseInt(b.period);
                return hoursA - hoursB;
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
            const ridesPackagePrices = packageData.filter(val => val.zone === 'Vellore' && val.type === 'Rides');

            setPackageDetails([
                ...intercityPackage,
                ...outstationPackage,
                ...ridesPackagePrices
            ]);
        }
    };

    useEffect(() => {
        getCarTypes();
        getPackageListDetails();
        getAccountRelatedDrivers(accountId);
    }, [accountId]);

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
        accountId: accountId,
        driverName: cabVal?.driverName || "",
        phoneNumber: cabVal?.phoneNumber || "",
        driverAddress: cabVal?.driverAddress || "",
        licenseNumber: cabVal?.driverLicense || "",
        carType: cabVal?.carType || "",
        packages: cabVal?.packages || [],
        prices: [],
    };

    const searchLocations = async (query, type = "owner") => {
        if (query.length > 2) {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
                address: query,
            });
            if (data?.success && data?.data) {
                if (type === "driver") {
                    setDriverAddressSuggestions(data.data);
                } else {
                    setAddressSuggestions(data.data);
                }
            }
        } else {
            if (type === "driver") {
                setDriverAddressSuggestions([]);
            } else {
                setAddressSuggestions([]);
            }
        }
    };

    const handleGoogleAddressSelect = (selectedAddress, setFieldValue, fieldName = "address") => {
        if (!selectedAddress || typeof selectedAddress !== "string") return;
        setFieldValue(fieldName, selectedAddress);
    };

    const getDocumentByType = (proofs = [], type) => {
        return proofs.find((proof) => proof.type === type) || null;
    };

    const fetchExistingProofs = async () => {
        try {
            if (!accountId) return;
            const res = await ApiRequestUtils.get(`${API_ROUTES.GET_ACCOUNT_BY_ID}/${accountId}`);
            const proofs = res?.data?.data?.Proofs || [];
            setImagePreviews((prev) => ({
                ...prev,
                drivingLicenseImage: getDocumentByType(proofs, KYC_PROCESS.DRIVING_LICENSE) || prev.drivingLicenseImage,
                rc: getDocumentByType(proofs, KYC_PROCESS.RC_COPY) || prev.rc,
                vehiclePhoto: getDocumentByType(proofs, KYC_PROCESS.VEHICLE_PHOTO) || prev.vehiclePhoto,
                insurance: getDocumentByType(proofs, KYC_PROCESS.INSURANCE) || prev.insurance,
                permit: getDocumentByType(proofs, KYC_PROCESS.PERMIT) || prev.permit,
            }));
        } catch (error) {
            console.error("Error fetching existing proofs:", error);
        }
    };

    useEffect(() => {
        fetchExistingProofs();
    }, [accountId]);

    const handleImageUpload = async (e, setFieldValue, label) => {
        try {
            setUploadingDocs((prev) => ({ ...prev, [label]: true }));
            const files = e.target.files;
            if (!files || files.length === 0) return;
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            const maxSize = 10 * 1024 * 1024;

            if (files.length > 2) return;
            for (let i = 0; i < files.length; i++) {
                if (!allowedTypes.includes(files[i].type) || files[i].size > maxSize) return;
            }

            const typeMap = {
                drivingLicenseImage: KYC_PROCESS.DRIVING_LICENSE,
                rc: KYC_PROCESS.RC_COPY,
                vehiclePhoto: KYC_PROCESS.VEHICLE_PHOTO,
                insurance: KYC_PROCESS.INSURANCE,
                permit: KYC_PROCESS.PERMIT,
            };

            const formData = new FormData();
            formData.append('image1', files[0]);
            formData.append('extImage1', files[0].name.split('.').pop());
            formData.append('fileTypeImage1', files[0].type);
            if (files[1] && label !== "insurance" && label !== "permit") {
                formData.append('image2', files[1]);
                formData.append('extImage2', files[1].name.split('.').pop());
                formData.append('fileTypeImage2', files[1].type);
            }
            formData.append('type', typeMap[label]);
            formData.append('accountId', accountId);

            const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
            if (data?.success) {
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: {
                        image1: data?.data?.image1 || prev[label]?.image1,
                        image2: data?.data?.image2 || prev[label]?.image2,
                        id: data?.data?.id || prev[label]?.id,
                        status: data?.data?.status || prev[label]?.status,
                    }
                }));
                setFieldValue(label, files);
            } else if (data?.code === 203) {
                setAlert({ message: data?.message || "Document already exists", color: "red" });
                await fetchExistingProofs();
            }
        } catch (err) {
            console.error("Error uploading document:", err);
        } finally {
            setUploadingDocs((prev) => ({ ...prev, [label]: false }));
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
            }
            return 0;
        });

        return (
            <div className="mb-8">
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
                setAlert({ message: 'Cab already exists', color: 'red' });
                // setTimeout(() => setAlert(null), 2000);
                resetForm();
            }
            if (!resp?.success && resp?.code === 401) {
                setAlert({ message: 'Driver with this phone number already exists', color: 'red' });
                resetForm();
            }
            else if (resp?.success && resp?.code === 200) {
                setAlert({ message: 'Cab Added Successfully', color: 'green' }, () => {
                    navigate(`/dashboard/vendors/account/details/${cabDetails?.accountId}`);
                });
            }

        } catch (error) {
            console.error('Error creating driver and car:', error);
        }
        setSubmitting(false);
    };
    useEffect(() => {
        let timeoutId;
        if (alert?.message === 'Cab Added Successfully') {
            timeoutId = setTimeout(() => {
                setAlert(null);
                console.log('Navigating to:', `/dashboard/vendors/account/details/${accountId}`);
                navigate(`/dashboard/vendors/account/details/${accountId}`);
            }, 2000);
        }
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [alert, accountId, navigate]);
    const currentDate = () => {
        return (new Date()).toISOString().split('T')[0];
    };
      const handlePhotoUpload = async (e, setFieldValue, label) => {
    try {
      setLoading(true);
      const file = e.target.files[0];
      if (!file) {
        setLoading(false);
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 10 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        setAlert({ message: "Invalid file type. Please upload JPG, PNG, or PDF.", color: "red" });
        setLoading(false);
        return;
      }
      if (file.size > maxSize) {
        setAlert({ message: "File size exceeds 10MB limit.", color: "red" });
        setLoading(false);
        return;
      }

      setFieldValue(label, file);

      const type = label === "livePhoto" ? KYC_PROCESS.LIVE_PHOTO : "";
      const formData = new FormData();
      formData.append("image1", file);
      formData.append("extImage1", file.name.split(".").pop());
      formData.append("fileTypeImage1", file.type);
      formData.append("type", type);
      formData.append("accountId", ownerAdded?.ownerId);

      const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
      if (data?.success) {
        setImagePreviews((prev) => ({
          ...prev,
          [label]: {
            image1: data?.data?.image1 || prev[label]?.image1,
            id: data?.data?.id,
          },
        }));
      } else if (data?.code === 203) {
        setAlert({ message: `${label} already uploaded for this account.`, color: "amber" });
        await fetchExistingProofs();
      } else {
        setAlert({ message: data?.message || "Failed to upload photo. Please try again.", color: "red" });
      }
    } catch (err) {
      setAlert({ message: "An error occurred while uploading the photo.", color: "red" });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

    return (
        <div className="p-4">
            {alert && <div className='mb-2'>
                <Alert
                    color={alert.color}
                    className='py-3 px-6 rounded-xl'
                >
                    {alert.message}
                </Alert>
            </div>}
            <h2 className="text-2xl font-bold mb-4">Add New Cab New</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={CAB_ADD_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, errors, dirty, isValid, handleChange, setFieldValue, touched }) => (
                    <Form className="space-y-4">

                        <div className="grid grid-cols-2 gap-4 bg-[#ffffff] border-2 border-bg-gray-300 rounded-[28px] p-6 md:p-8">
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
                                            suggestions={addressSuggestions}
                                            onSearch={searchLocations}
                                            onSelect={(selectedAddress) => handleGoogleAddressSelect(selectedAddress, form.setFieldValue, "address")}
                                        />
                                    )}
                                </Field>
                                <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="insurance" className="text-sm font-medium text-gray-700">Insurance Expiry Date</label>
                                <Field type="date" name="insurance" className="p-2 w-full rounded-xl border-2 border-gray-300" min={currentDate()} ></Field>
                                <ErrorMessage name="insurance" component="div" className="text-red-500 text-sm" />
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
                                <Field type="text" name="seater" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="luggage" className="text-sm font-medium text-gray-700">Luggage</label>
                                <Field type="text" name="luggage" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                <ErrorMessage name="luggage" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">Year of Model</label>
                                <Field type="text" name="modelYear" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
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
                                        <Field type="text" name="driverName" className="p-2 w-full rounded-md border-gray-300" />
                                        <ErrorMessage name="driverName" component="div" className="text-red-500 text-sm" />
                                    </div>}
                                    {values?.assignOrAddDriver === 'Add' && <div>
                                        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <Field type="tel" name="phoneNumber" className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
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
                                                    type="driver"
                                                    onSelect={(selectedAddress) => handleGoogleAddressSelect(selectedAddress, form.setFieldValue, "driverAddress")}
                                                />
                                            )}
                                        </Field>
                                        <ErrorMessage name="driverAddress" component="div" className="text-red-500 text-sm" />
                                    </div>}
                                    {values?.assignOrAddDriver === 'Add' && <div>
                                        <label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">License Number</label>
                                        <Field type="text" name="licenseNumber" className="p-2 w-full rounded-md border-gray-300" maxLength={16} />
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
                        {Boolean(accountId) && (
                            <div>
                                {loading ? (
                                    <div className="flex justify-center items-center h-screen">
                                        <Spinner className="h-12 w-12" />
                                    </div>
                                ) : (
                                    <div className="mt-6">
                                        <div className="flex flex-row justify-between px-2 mb-2">
                                            <Typography variant="h3" className="text-2xl font-bold text-blue-gray-800">
                                                Document Upload
                                            </Typography>
                                        </div>
                                        <Card>
                                            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                                                <table className="w-full min-w-[640px] table-auto">
                                                    <thead>
                                                        <tr>
                                                            {["Type", "Status", "Action", ""].map((el, index) => (
                                                                <th key={index} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                                        {el}
                                                                    </Typography>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <CabDocuments
                                                            DocumentUpload={DocumentUpload}
                                                            imagePreviews={imagePreviews}
                                                            setFieldValue={setFieldValue}
                                                            handleImageUpload={handleImageUpload}
                                                            handlePhotoUpload={handlePhotoUpload}
                                                            setModalData={setDocModalData}
                                                        />

                                                    </tbody>
                                                </table>
                                            </CardBody>
                                        </Card>
                                    </div>
                                )}


                            </div>
                        )}
                        {values.packages.length > 0 && (<div className='hidden'>
                            <div>
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
                        </div>
                        )}
                        {docModalData && (
                            <Dialog open={Boolean(docModalData)} handler={() => setDocModalData(null)} size="md">
                                <DialogHeader>
                                    <div className="flex justify-between items-center w-full">
                                        <Typography variant="h6">Document Details</Typography>
                                        <button className="text-gray-600 hover:text-gray-900" onClick={() => setDocModalData(null)}>
                                            X
                                        </button>
                                    </div>
                                </DialogHeader>
                                <DialogBody divider>
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className={`flex ${docModalData.image2 ? "flex-row space-x-6" : "flex-col"} justify-center`}>
                                            {docModalData.image1 && <iframe src={docModalData.image1} className="w-full rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />}
                                            {docModalData.image2 && <iframe src={docModalData.image2} className="rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />}
                                        </div>
                                        <div className="flex justify-center mt-4">
                                            <a href={docModalData.image1} download target="_blank" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700" rel="noreferrer">
                                                Download Image 1
                                            </a>
                                            {docModalData.image2 && (
                                                <a href={docModalData.image2} download target="_blank" className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700" rel="noreferrer">
                                                    Download Image 2
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </DialogBody>
                            </Dialog>
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