import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Button, Typography, Input, List, ListItem} from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { REASSIGN_DRIVER } from '@/utils/validations';

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

const ReassignDriver = () => {
    const [cabVal, setCabVal] = useState({});
    const [driverAddressSuggestions, setDriverAddressSuggestions] = useState([]);
    const [accountRelatedDrivers, setAccountRelatedDrivers] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false); 

    const getAccountRelatedDrivers = async (accountId) => {
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ACCOUNT_RELATED_DRIVERS, {
            accountId: accountId
        });

        if (data?.success && data?.data.length > 0) {
            setAccountRelatedDrivers(data?.data);
        }
    }

    useEffect(() => {
        fetchItem(id);
    }, [id]);

    const fetchItem = async (itemId) => {
        try{
        const data = await ApiRequestUtils.get(API_ROUTES.GET_CAB_BY_ID + `${itemId}`);
        if(data?.data) {
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
        ownerName: cabVal?.result?.Account ? cabVal?.result?.Account?.name : "",
        driverId: cabVal?.result?.Drivers[0]?.id || "",
        carNumber: cabVal?.result?.carNumber || "",
        address: cabVal?.result?.curAddress || "",
        insurance: cabVal?.result?.insurance || "",
        withDriver: cabVal?.result?.withDriver || "",
        assignOrAddDriver: "Assign",
        driverName: cabVal?.result?.driverName || "",
        phoneNumber: cabVal?.result?.phoneNumber || "",
        driverAddress: cabVal?.result?.driverAddress || "",
        licenseNumber: cabVal?.result?.driverLicense || "",
        notify: cabVal?.result?.notify || "",
        packages: cabVal?.result?.packages || "",
        carType: cabVal?.result?.carType || "",
        prices: cabVal?.price ? cabVal?.price.filter((el) => cabVal?.result?.packages.includes(el.packageId)) : [],
        image1: cabVal?.result?.Proofs ? cabVal?.result?.Proofs[0]?.image1 : '',
        insuranceImg : cabVal?.result?.Proofs ? cabVal?.result?.Proofs[1]?.image1:'',
        fullDocVal : cabVal?.result?.Proofs ? cabVal?.result?.Proofs : '',
    };

    const searchLocations = async (query, type) => {
        if (query.length > 2) {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
                address: query
            });
            if (data?.success && data?.data) {
                if (type === 'owner') {
                    setDriverAddressSuggestions([]); 
                } else {
                    setDriverAddressSuggestions(data?.data);
                }
            }
        } else {
            setDriverAddressSuggestions([]);
        }
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const cabDetails = {
                name: values.name,
                ownerPhoneNumber: "+91" + values.ownerPhoneNumber,
                carNumber: values.carNumber,
                curAddress: values.address,
                company: values.company,
                withDriver: values.withDriver,
                driverName: values.driverName,
                phoneNumber: values.phoneNumber,
                driverAddress: values.driverAddress,
                driverLicense: values.licenseNumber,
                notify: values.notify,
                insurance: values.insurance,
                packages: values.packages,
                carType: values.carType,
                cabId: id
            };
            if (!cabDetails?.driverName) {
                cabDetails['driverId'] = values?.driverId
            }
            const formData = new FormData();
            
            if (cabVal?.result?.Proofs) {
                formData.append('documentId', cabVal?.result?.Proofs[0]?.id);
            }

            if (cabVal?.result?.Proofs) {
                formData.append('documentIdInsurance', cabVal?.result?.Proofs[1]?.id);
            }

            formData.append('cabDetails', JSON.stringify(cabDetails));
            formData.append('prices', JSON.stringify(values.prices));

            const data = await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_CAB, formData);
            if (data?.success) {
                navigate(`/dashboard/vendors/account/details/${cabVal?.result?.Account?.id}`, {
                    state: {
                        cabAdded: true,
                        cabName: data?.data?.name
                    }
                });
            } else {
                throw new Error(data?.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating cab:', error);
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Reassign Driver</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={REASSIGN_DRIVER}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, errors, dirty, isValid, handleChange, setFieldValue }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">Cab Name</label>
                                <Field type="text" name="name" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" disabled/>
                                <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Owner Name</label>
                                <Field type="text" name="ownerName" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <label htmlFor="carNumber" className="text-sm font-medium text-gray-700">Car Number</label>
                                <Field type="text" name="carNumber" className="p-2 w-full rounded-md border-gray-300 border" maxLength={15} disabled/>
                                <ErrorMessage name="carNumber" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Car Type</p>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="carType" value="Sedan" className="form-radio" disabled/>
                                        <span className="ml-2">Sedan</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="carType" value="SUV" className="form-radio" disabled/>
                                        <span className="ml-2">SUV</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="carType" value="Hatchback" className="form-radio" disabled/>
                                        <span className="ml-2">Hatchback</span>
                                    </label>
                                </div>
                                <ErrorMessage name="carType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">With Driver</p>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="withDriver" value="Yes" className="form-radio" 
                                            onChange={e => {
                                                handleChange(e);
                                                setFieldValue('driverName', values.driverName, true);
                                                setFieldValue('phoneNumber', values.phoneNumber, true);
                                                setFieldValue('driverAddress', values.driverAddress, true);
                                                setFieldValue('licenseNumber', values.licenseNumber, true);
                                            }} />
                                        <span className="ml-2">Yes</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="withDriver" value="No" className="form-radio"
                                            onChange={e => {
                                                handleChange(e);
                                                setFieldValue('driverName', '', true);
                                                setFieldValue('phoneNumber', '', true);
                                                setFieldValue('driverAddress','', true);
                                                setFieldValue('licenseNumber','' , true);
                                            }} />
                                        <span className="ml-2">No</span>
                                    </label>
                                </div>
                                <ErrorMessage name="preference" component="div" className="text-red-500 text-sm" />
                            </div>
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
                            </div>

                        <div className='flex flex-row'>
                            <Button
                                fullWidth
                                onClick={() => { navigate(`/dashboard/vendors/account/details/${cabVal?.result?.Account?.id}`)}}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                color="black"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !isValid}
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

export default ReassignDriver;
