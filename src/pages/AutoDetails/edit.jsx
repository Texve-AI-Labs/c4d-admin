import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Button, Card, Alert, CardBody, Typography, Input, List, ListItem } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
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
                <List className="w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {suggestions.map((suggestion, index) => (
                        <ListItem
                            key={index}
                            onClick={() => {
                                form.setFieldValue(field.name, getSuggestionText(suggestion));
                                setIsFocused(false);
                            }}
                            className="hover:bg-gray-100 cursor-pointer"
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

const validationSchema = Yup.object({
    modelYear: Yup.string()
        .required('Year of Model is required')
        .matches(/^\d{4}$/, 'Model Year must be a 4-digit year')
        .test('is-valid-year', 'Model Year cannot be in the future', (value) => {
            if (!value) return true;
            const currentYear = new Date().getFullYear();
            return parseInt(value, 10) <= currentYear;
        }),
});

const EditAuto = () => {
    const [cabVal, setCabVal] = useState({});
    const [alert, setAlert] = useState(null);
    const [packageDetails, setPackageDetails] = useState([]);
    const [ownerAddressSuggestions, setOwnerAddressSuggestions] = useState([]);
    const [driverAddressSuggestions, setDriverAddressSuggestions] = useState([]);
    const [accountRelatedDrivers, setAccountRelatedDrivers] = useState([]);
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [blockedReason, setBlockedReason] = useState('');

    const getAccountRelatedDrivers = async (accountId) => {
        try {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ACCOUNT_RELATED_DRIVERS, {
                accountId: accountId,
            });
            if (data?.success && data?.data.length > 0) {
                setAccountRelatedDrivers(data?.data);
            }
        } catch (error) {
            console.error('Error fetching account-related drivers:', error);
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

    const getPackageListDetails = async () => {
        try {
            const data = await ApiRequestUtils.get(API_ROUTES.PACKAGE_CABS_LIST);
            if (data?.success) {
                const packageData = data?.data.map((option) => {
                    const suffix = option.type === 'Local' ? 'hr' : option.type === 'Outstation' ? 'd' : '';
                    return {
                        ...option,
                        period: `${option.period} ${suffix}`,
                    };
                });
                const intercityPackage = orderPackages(packageData.filter((val) => val.type === 'Local'), 'Local');
                const outstationPackage = packageData.filter((val) => val.type === 'Outstation' && val.period === '1 d');
                const carWashPackage = orderPackages(packageData.filter((val) => val.type === 'CarWash'), 'CarWash');
                const ridesPackage = packageData.filter((val) => val.type === 'Rides');
                setPackageDetails([...intercityPackage, ...outstationPackage, ...carWashPackage, ...ridesPackage]);
            }
        } catch (error) {
            console.error('Error fetching package list:', error);
        }
    };

    useEffect(() => {
        getPackageListDetails();
        if (id) {
            fetchItem(id);
        }
    }, [id]);

    const fetchItem = async (itemId) => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.GET_AUTO_BY_ID}${itemId}`);
            if (data?.data) {
                setCabVal(data.data);
                setBlockedReason(data.data?.result?.blockedReason || '');
                if (data.data?.result?.Account?.id) {
                    getAccountRelatedDrivers(data.data?.result?.Account?.id);
                }
            } else {
                console.error('No cab data received');
                navigate('/dashboard/vendors/account/allVehicles');
            }
        } catch (error) {
            console.error('Error fetching cab:', error);
            navigate('/dashboard/vendors/account/allVehicles');
        }
    };

    const initialValues = {
        name: cabVal?.result?.name || '',
        ownerName: cabVal?.result?.Account ? cabVal?.result?.Account?.name : '',
        autoNumber: cabVal?.result?.autoNumber || '',
        address: cabVal?.result?.curAddress || '',
        accountId: cabVal?.result?.Account?.id || '',
        driverName: '',
        phoneNumber: '',
        driverAddress: '',
        licenseNumber: '',
        carType: cabVal?.result?.carType || '',
        vehicleType: cabVal?.result?.vehicleType || '',
        seater: cabVal?.result?.seater || '',
        luggage: cabVal?.result?.luggage || '',
        modelYear: cabVal?.result?.modelYear || '',
        autoId: cabVal?.result?.id || '',
        status: cabVal?.result?.status || '',
        blockedReason: cabVal?.result?.blockedReason || '',
    };

    const searchLocations = async (query, type) => {
        if (query.length > 2) {
            try {
                const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
                    address: query,
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
            } catch (error) {
                console.error('Error searching locations:', error);
            }
        } else {
            if (type === 'owner') {
                setOwnerAddressSuggestions([]);
            } else {
                setDriverAddressSuggestions([]);
            }
        }
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSubmitting(true);

        if (values.status === 'BLOCKED' && !blockedReason.trim()) {
            setAlert({
                message: 'Please enter a reason for blocking',
                color: 'red',
            });
            setTimeout(() => setAlert(null), 5000);
            setIsSubmitting(false);
            setSubmitting(false);
            return;
        }

        try {
            const autoDetails = {
                
      accountId: values.accountId,
      name: values.name,
      company: values.ownerName,
      autoNumber: values.autoNumber,
      curAddress: values.address,
      insurance: values.insurance,
      vehicleType: values.vehicleType,
      seater: values.seater,
      modelYear: values.modelYear,
      curLatitude: '',
      curLongitude: '',
      autoId:values.autoId,
      status:values.status,
    };
            

            // const res = {
            //     autoDetails: JSON.stringify(autoDetails),
               
            // };

            console.log('Submitting cab details:', autoDetails); // Debugging log

            const resp = await ApiRequestUtils.update(API_ROUTES.UPDATE_AUTO_DETAILS, autoDetails);
            console.log('API Response:', resp); // Debugging log

            if (!resp?.success && resp?.code === 401) {
                setAlert({ message: 'Driver with this phone number already exists', color: 'red' });
            } else if (!resp?.success && resp?.code === 203) {
                setAlert({ message: 'Auto already exists', color: 'red' });
                resetForm();
            } else if (resp?.success && resp?.code === 200) {
                setAlert({ message: 'Auto Updated Successfully', color: 'green' });
            }
        } catch (error) {
            console.error('Error updating cab:', error);
            setAlert({ message: 'Failed to update Auto. Please try again.', color: 'red' });
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const currentDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    useEffect(() => {
        let timeoutId;
        if (alert?.message === 'Auto Updated Successfully') {
            timeoutId = setTimeout(() => {
                setAlert(null);
                navigate(`/dashboard/vendors/account/autoView/details/${cabVal?.result?.Account?.id}`);
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
            {alert && (
                <div className="mb-2">
                    <Alert color={alert.color} className="py-3 px-6 rounded-xl">
                        {alert.message}
                    </Alert>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Update Auto</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ values, errors, isValid, handleSubmit }) => (
                    <Form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Hidden autoId field (Fix for API error) */}
                        <Field type="hidden" name="autoId" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Vehicle Name
                                </label>
                                <Field
                                    type="text"
                                    name="name"
                                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                                />
                                <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                            </div>
                            <div>
                                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
                                    Owner Name
                                </label>
                                <Field
                                    type="text"
                                    name="ownerName"
                                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                                />
                                <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm my-1" />
                            </div>
                            <div>
                                <label htmlFor="autoNumber" className="text-sm font-medium text-gray-700">
                                    Auto Number
                                </label>
                                <Field
                                    type="text"
                                    name="autoNumber"
                                    className="p-2 w-full rounded-md border-gray-300"
                                    maxLength={10}
                                />
                                <ErrorMessage name="autoNumber" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="address" className="text-sm font-medium text-gray-700">
                                    Address
                                </label>
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
                                <label htmlFor="insurance" className="text-sm font-medium text-gray-700">
                                    Insurance Expiry Date
                                </label>
                                <Field
                                    type="date"
                                    name="insurance"
                                    className="p-2 w-full rounded-xl border-2 border-gray-300"
                                    min={currentDate()}
                                />
                                <ErrorMessage name="insurance" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">
                                    Vehicle Type
                                </label>
                                <Field
                                    type="text"
                                    name="vehicleType"
                                    className="p-2 w-full rounded-md border-gray-300"
                                    maxLength={10}
                                />
                                <ErrorMessage name="vehicleType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="seater" className="text-sm font-medium text-gray-700">
                                    Seater
                                </label>
                                <Field
                                    type="text"
                                    name="seater"
                                    className="p-2 w-full rounded-md border-gray-300"
                                    maxLength={10}
                                />
                                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">
                                    Year of Model
                                </label>
                                <Field
                                    type="text"
                                    name="modelYear"
                                    className="p-2 w-full rounded-md border-gray-300"
                                    maxLength={10}
                                />
                                <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                                    Driver Status
                                </label>
                                <Field
                                    as="select"
                                    name="status"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                >
                                    <option value="">Select status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="IN_ACTIVE">In_Active</option>
                                    <option value="BLOCKED">Blocked</option>
                                </Field>
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                                {values.status === 'BLOCKED' && (
                                    <div className="mt-2">
                                        <label htmlFor="blockedReason" className="text-sm font-medium text-gray-700">
                                            Block Reason
                                        </label>
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
                        <div className="flex flex-row">
                            <Button
                                fullWidth
                                onClick={() => navigate(`/dashboard/vendors/account/autoView/details/${cabVal?.result?.Account?.id}`)}
                                className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                color="black"
                                type="submit"
                                className="my-6 mx-2 bg-[#1A73E8]"
                                disabled={isSubmitting || !isValid}
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

export default EditAuto;
