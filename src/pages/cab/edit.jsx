import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Button, Card,Alert, CardBody, Typography, Input, List, ListItem, Dialog, DialogHeader, DialogBody } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import { CAB_SCHEMA } from '@/utils/validations';
import moment from 'moment';

const LocationInput = ({ field, form, suggestions, onSearch, type }) => {
    const [isFocused, setIsFocused] = useState(false);

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

    useEffect(() => {
        form.validateField(field.name);
    }, []);

    return (
        <div className="relative">
            <Input
                type="text"
                placeholder="Enter address"
                {...field}
                onChange={(e) => {
                    form.setFieldValue(field.name, e.target.value);
                    onSearch(e.target.value, type);
                    form.setFieldTouched(field.name, true, false);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    field.onBlur(e);
                    setTimeout(() => setIsFocused(false), 200);
                    form.validateField(field.name);
                }}
                className="pr-10"
            />
            {suggestions.length > 0 && isFocused && (
                <List className="w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ">
                    {suggestions.map((suggestion, index) => (
                        <ListItem
                            key={index}
                            onClick={() => {
                                form.setFieldValue(field.name, getSuggestionText(suggestion));
                                setIsFocused(false);
                            }}
                            className=" hover:bg-gray-100 cursor-pointer"
                        >
                            <div className="flex flex-col">
                                <Typography variant="small" className="font-bold text-black">
                                    {getSuggestionTitle(suggestion)}
                                </Typography>
                                {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                                    <Typography variant="small" className="text-xs text-gray-600">
                                        {getSuggestionText(suggestion)}
                                    </Typography>
                                )}
                            </div>
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
};

const CabEdit = () => {
    const [cabVal, setCabVal] = useState({});
    const [alert, setAlert] = useState(null);
    const [packageDetails, setPackageDetails] = useState([]);
    const [ownerAddressSuggestions, setOwnerAddressSuggestions] = useState([]);
    const [driverAddressSuggestions, setDriverAddressSuggestions] = useState([]);
    // const [accountOptions, setAccountOptions] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);
    const [insuranceImagePreview, setInsuranceImagePreview] = useState(null);
    const [accountRelatedDrivers, setAccountRelatedDrivers] = useState([]);
    const [carTypeOptions, setCarTypeOptions] = useState([]);
    const [selectedCarType, setSelectedCarType] = useState('');
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [blockedReason, setBlockedReason] = useState(cabVal?.result?.blockedReason || '');

    const getSelectedCarTypeLabel = (carType) => {
        if (carType === 'MINI') return 'Mini';
        if (carType === 'SUV') return 'SUV';
        if (carType === 'MUV') return 'MUV';
        if (carType === 'Sedan') return 'Sedan';
        return '';
    };

    // const getAccountNames = async () => {
    //     try {
    //         const data = await ApiRequestUtils.get(API_ROUTES.GET_ACCOUNT);
    //         if (data?.success) {
    //             setAccountOptions(data.data.map(account => ({
    //                 value: account.name,
    //                 label: account.name
    //             })));
    //         }
    //     } catch (error) {
    //         console.error('Error fetching account names:', error);
    //         setAlert({ message: 'Error fetching account names', color: 'red' });
    //     }
    // };

    const getAccountRelatedDrivers = async (accountId) => {
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ACCOUNT_RELATED_DRIVERS, {
            accountId: accountId
        });

        if (data?.success && data?.data.length > 0) {
            setAccountRelatedDrivers(data?.data);
        }
    }

    const getCarTypes = async () => {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_CAR_TYPE + "all");
        if (data?.success && data?.data.length > 0) {
            setCarTypeOptions(data?.data);
        }
    };

    function getNameById(id, obj) {
        for (const key in obj) {
            if (obj[key].id === id) {
                return obj[key].period;
            }
        }
        return null;
    }

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

        const intercityPackage = orderPackages(
            packageData.filter(val => val.zone === 'Vellore' && val.type === 'Local'),'Local');
        const outstationPackage = packageData.filter(val => val.zone === 'Vellore' && val.type === 'Outstation' && val.period === '1 d');
        const carWashPackage = orderPackages(packageData.filter(val => val.zone === 'Vellore' && val.type === 'CarWash'),'CarWash');
        const ridesPackage = packageData.filter(val => val.zone === 'Vellore' && val.type === 'Rides');

        setPackageDetails([
            ...intercityPackage,
            ...outstationPackage,
            ...carWashPackage,
            ...ridesPackage
        ]);
    }
};

    useEffect(() => {
        getCarTypes();
        getPackageListDetails();
        // getAccountNames();
        fetchItem(id);
    }, [id]);

    useEffect(() => {
        setSelectedCarType(getSelectedCarTypeLabel(cabVal?.result?.carType));
    }, [cabVal?.result?.carType]);

    const fetchItem = async (itemId) => {
        try {
            const data = await ApiRequestUtils.get(API_ROUTES.GET_CAB_BY_ID + `${itemId}`);
            if (data?.data) {
                setCabVal(data.data);
                getAccountRelatedDrivers(data?.data?.result?.Account?.id)
            } else {
                console.error('No cab data received');
                navigate('/dashboard/vendors/account/allVehicles');
            }
        } catch (error) {
            console.error('Error fetching driver:', error);
            navigate('/dashboard/vendors/account/allVehicles');
        }
    };

    const initialValues = {
        name: cabVal?.result?.name || "",
        ownerName: cabVal?.result?.Account ? cabVal?.result?.Account?.name : '',
        assignedTo: cabVal?.result?.assigned === 'Individual' ? 'Owner' : 'Driver',
        carNumber: cabVal?.result?.carNumber || "",
        address: cabVal?.result?.curAddress || "",
        insurance: cabVal?.result?.insurance || "",
        withDriver: cabVal?.result?.withDriver || "",
        assignOrAddDriver: "Assign",
        driverId: cabVal?.result?.Drivers[0] ? cabVal?.result?.Drivers[0].id : "",
        accountId: cabVal?.result?.Account?.id || "",
        driverName: "",
        phoneNumber: "",
        driverAddress: "",
        licenseNumber: "",
        carType: cabVal?.result?.carType || "",
        vehicleType: cabVal?.result?.vehicleType || "",
        seater: cabVal?.result?.seater || "",
        luggage: cabVal?.result?.luggage || "",
        modelYear: cabVal?.result?.modelYear || "",
        packages: cabVal?.result?.packages || [],
        prices: cabVal?.price ? cabVal?.price.filter((el) => cabVal?.result?.packages.includes(el.packageId)) : [],
        cabId: cabVal?.result?.id || '',
        status: cabVal?.result?.status || '',
        blockedReason: cabVal?.result?.blockedReason || '',
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
                                                {getNameById(priceItem.packageId, packageDetails)}
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
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <Card>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Package", "Base Fare", "Per Kilometer Rate", "Per Minute Rate"].map((el) => (
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
                                        {['baseFare', 'kilometerPrice', 'minCharge'].map((field) => (
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
        if (isSubmitting) return;
        setIsSubmitting(true);
         if (values.status === 'BLOCKED' && !blockedReason.trim()) {
        setAlert({
            message: "Please enter a reason for blocking",
            color: "red",
        });
        setTimeout(() => setAlert(null), 5000);
        return;
    }
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
                driverId: values.assignOrAddDriver == 'Add' ? '' : values.driverId,
                cabId: values.cabId,
                status: values?.status || '',
                 ...(values.status === 'BLOCKED' && { blockedReason: blockedReason }),
            }
            const prices = values.prices;
            let res = { cabDetails: JSON.stringify(cabDetails), prices: JSON.stringify(prices) };
            //console.log("RESSSSS", res);
            const resp = await ApiRequestUtils.update(API_ROUTES.UPDATE_CAB, res);
            console.log('CAB DATA :', resp);
            if (!resp?.success && resp?.code === 401) {
                console.log("Driver Existed");
                setAlert({ message: 'Driver with this phone number already exists', color: 'red' });
            }
      if (!resp?.success && resp?.code === 203) {
        setAlert({ message: 'Cab already exists', color: 'red' });
        // setTimeout(() => setAlert(null), 2000);
        resetForm();
      } else if (resp?.success && resp?.code === 200) {
        setAlert({ message: 'Cab Updated Successfully', color: 'green' });
      }
        } catch (error) {
            console.error('Error updating cab:', error);
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const currentDate = () => {
        return (new Date()).toISOString().split('T')[0];
    };


  useEffect(() => {
    let timeoutId;
    if (alert?.message === 'Cab Updated Successfully') {
      timeoutId = setTimeout(() => {
        setAlert(null);
        // console.log('Navigating to:', `/dashboard/vendors/account/details/${cabVal?.result?.Account?.id}`);
        navigate(`/dashboard/vendors/account/details/${cabVal?.result?.Account?.id}`);
      }, 5000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [alert, cabVal, navigate]);
  


    return (
        <div className="p-4 mx-auto">
                    {alert && <div className='mb-2'>
                        <Alert
                            color={alert.color}
                            className='py-3 px-6 rounded-xl'
                        >
                            {alert.message}
                        </Alert>
                    </div>}
            <h2 className="text-2xl font-bold mb-4">Update Cab</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={CAB_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, errors, dirty, isValid, handleChange, setFieldValue }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">Vehicle Name</label>
                                <Field type="text" name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                            </div>
                            <div>
                                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Owner Name</label>
                                <Field type="text" name="ownerName"  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <label htmlFor="carNumber" className="text-sm font-medium text-gray-700">Car Number</label>
                                <Field type="text"  name="carNumber" className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="carNumber" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="address" className="text-sm font-medium text-gray-700">Address</label>
                                <Field name="address">
                                    {({ field, form }) => (
                                        <LocationInput
                                            field={field}
                                            form={form}
                                            suggestions={ownerAddressSuggestions}
                                            onSearch={searchLocations}
                                            type="owner"
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
                                        <Field
                                            type="radio"
                                            name="carType"
                                            value="MINI"
                                            className="form-radio"
                                            onChange={(e) => {
                                                handleChange(e);
                                                setSelectedCarType("Mini");
                                            }}
                                        />
                                        <span className="ml-2">Mini</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field
                                            type="radio"
                                            name="carType"
                                            value="SUV"
                                            className="form-radio"
                                            onChange={(e) => {
                                                handleChange(e);
                                                setSelectedCarType("SUV");
                                            }}
                                        />
                                        <span className="ml-2">SUV</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field
                                            type="radio"
                                            name="carType"
                                            value="MUV"
                                            className="form-radio"
                                            onChange={(e) => {
                                                handleChange(e);
                                                setSelectedCarType("MUV");
                                            }}
                                        />
                                        <span className="ml-2">MUV</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field
                                            type="radio"
                                            name="carType"
                                            value="Sedan"
                                            className="form-radio"
                                            onChange={(e) => {
                                                handleChange(e);
                                                setSelectedCarType("Sedan");
                                            }}
                                        />
                                        <span className="ml-2">Sedan</span>
                                    </label>
                                </div>
                                <ErrorMessage name="carType" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">Vehicle Type</label>
                                <Field
                                    as="select"
                                    name="vehicleType"
                                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                >
                                    <option value="">Select Type</option>
                                    {carTypeOptions
                                        .filter((type) => type.carType === selectedCarType)
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
                                <Field type="text" name="seater" className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="luggage" className="text-sm font-medium text-gray-700">Luggage</label>
                                <Field type="text" name="luggage" className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="luggage" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">Year of Model</label>
                                <Field type="text" name="modelYear" className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="assignedTo" className="text-sm font-medium text-gray-700">Assigned To</label>
                                <Field as="select" disabled={cabVal?.result?.Account?.type == 'Individual'} name="assignedTo" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select Type</option>
                                    <option value="Driver">Driver</option>
                                    <option value="Owner">Owner</option>
                                </Field>
                                <ErrorMessage name="assignedTo" component="div" className="text-red-500 text-sm" />
                            </div>
                            {cabVal?.result?.Account?.type != 'Individual' &&
                                <div>
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
                                </div>
                            }
                            {values.withDriver === 'Yes' && (
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
                                            // onChange={(e) => {
                                            //     const selectedAccountId = e.target.value;
                                            //     console.log('selectedAccountId :', selectedAccountId)
                                            //     if (selectedAccountId) {
                                            //         getAccountRelatedDrivers(selectedAccountId);
                                            //     }
                                            // }}
                                            >
                                                <option value="">Select Driver</option>
                                                {accountRelatedDrivers.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.firstName} ({option.phoneNumber})
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
                                                    onSearch={searchLocations}
                                                    type="driver"
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
                                <label htmlFor="packages" className="text-sm font-medium text-gray-700">Package</label>
                                <Multiselect
                                    options={packageDetails}
                                    displayValue="period"
                                    selectedValues={packageDetails.filter(option => values.packages.includes(option.id))}
                                    onSelect={(selectedList) => {
                                        setFieldValue("packages", selectedList.map(item => item.id));
                                        const newPrices = selectedList.map(item => ({
                                            packageId: item.id,
                                            ...(item.type === 'Rides'
                                                ? {
                                                    baseFare: item.baseFare,
                                                    kilometerPrice: item.kilometerPrice,
                                                    minCharge: item.minCharge,
                                                    type: 'Rides',
                                                }
                                                : {
                                                    kilometer: item.kilometer,
                                                    baseFare: item.baseFare,
                                                    kilometerPrice: item.kilometerPrice,
                                                    additionalMinCharge: item.additionalMinCharge,
                                                    type: 'RENTAL',
                                                }
                                            )
                                        }));
                                        setFieldValue("prices", newPrices);
                                    }}
                                    onRemove={(selectedList, removedItem) => {
                                        setFieldValue("packages", selectedList.map(item => item.id));
                                        setFieldValue("prices", values.prices.filter(price => price.packageId !== removedItem.id));
                                    }}
                                    placeholder="Select options"
                                    className="w-full rounded-md border-gray-300"
                                    showCheckbox={true}
                                    style={{
                                        chips: {
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                        },
                                    }}
                                />
                            </div>
                                <div>
                                    <label htmlFor="status" className="text-sm font-medium text-gray-700">Driver Status</label>
                                    <Field as="select" name="status" className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                        <option value="">Select status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="IN_ACTIVE">In_Active</option>
                                        <option value="BLOCKED">Blocked</option>
                                    </Field>
                                    <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                                    {values.status === 'BLOCKED' && (
                                        <div className="mt-2">
                                            <label htmlFor="blockedReason" className="text-sm font-medium text-gray-700">Block Reason</label>
                                            <input
                                                type="text"
                                                id="blockedReason"
                                                value={blockedReason}
                                                onChange={(e) => setBlockedReason(e.target.value)}
                                                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                            />
                                        </div>
                                )}
                                </div>
                        </div>

                        {values.packages.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Price Details</h2>
                                {renderPriceTable(
                                    "LOCAL",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'Local';
                                    }),
                                    values,
                                    packageDetails
                                )}

                                {renderPriceTable(
                                    "OUTSTATION",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'Outstation';
                                    }),
                                    values,
                                    packageDetails
                                )}

                                {renderPriceTable(
                                    "CAR WASH",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'CarWash';
                                    }),
                                    values,
                                    packageDetails
                                )}

                                {renderRidesPriceTable(
                                    "RIDES",
                                    values.prices.filter(price => {
                                        const package_ = packageDetails.find(p => p.id === price.packageId);
                                        return package_?.type === 'Rides';
                                    }),
                                    values,
                                    packageDetails
                                )}
                            </div>
                        )}
                        <div className='flex flex-row'>
                            <Button
                                fullWidth
                                onClick={() => navigate(`/dashboard/vendors/account/details/${cabVal?.result?.Account?.id}`)}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                color="black"
                                onClick={handleSubmit}
                                // disabled={isSubmitting || !isValid}
                                className='my-6 mx-2 bg-primary'
                            >
                                Update
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default CabEdit;

// modify
