import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, STATE_LIST, THALUK_LIST, ColorStyles } from '@/utils/constants';
import { ACCOUNT_ADD_SCHEMA } from '@/utils/validations';
import { Button } from '@material-tailwind/react';
import { useNavigate } from "react-router-dom";
import LocationInput from './LocationInput';
import AccountCreationTabs from './AccountCreationTabs';

const AddAccountNew = () => {
    const [districtSearchText, setDistrictSearchText] = useState("");
    const [thalukSearchText, setThalukSearchText] = useState("");
    const [stateSearchText, setStateSearchText] = useState("");
    const navigate = useNavigate();
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSameAddress, setIsSameAddress] = useState(false);
    const [serviceAreas, setServiceAreas] = useState([]);

    const initialValues = {
        type: "",
        name: "",
        phoneNumber: "",
        email: "",
        source: "",
        address: "",
        street: "",
        thaluk: "",
        district: "",
        state: "",
        pincode: "",
    };

    useEffect(() => {
        const fetchGeoData = async () => {
            try {
                const response = await ApiRequestUtils.getWithQueryParam('/geo-markings', {
                    type: 'Service Area',
                });
                setServiceAreas(response?.data || []);
            } catch (error) {
                console.error('Error fetching service areas:', error);
            }
        };

        fetchGeoData();
    }, []);

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        // console.log('Form submission started with values:', values);
        try {
            const reqBody = {
                type: values?.type,
                name: values?.name,
                phoneNumber: values?.phoneNumber,
                email: values?.email,
                address: values?.address,
                street: values?.street,
                thaluk: values?.thaluk,
                district: values?.district,
                state: values?.state,
                pincode: values?.pincode,
                source: values?.source,
            }
            let data;
            data = await ApiRequestUtils.post(API_ROUTES.CREATE_ACCOUNT, reqBody);
            if (!data?.success && data?.code === 203) {
                return;
            }
            const accountId = data?.data?.id;
            if (data?.success && accountId) {
                navigate(`/dashboard/vendors/account/new/documents/${accountId}`);
                return;
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
        setSubmitting(false);
    };

    const districtOptions = [...new Set(
        serviceAreas
            .map((area) => area?.district || area?.name)
            .filter(Boolean)
    )].map((district) => ({
        id: district,
        name: district
    }));

    const thalukOptions = THALUK_LIST.map(thaluk => ({
        id: thaluk.value,
        name: thaluk.label
    }));

    const filteredDistricts = districtOptions.filter(district =>
        district.name.toLowerCase().includes(districtSearchText.toLowerCase())
    );

    const filteredThaluk = thalukOptions.filter(thaluk =>
        thaluk.name.toLowerCase().includes(thalukSearchText.toLowerCase())
    );

    const stateOptions = STATE_LIST.map(state => ({
        id: state.value,
        name: state.label
    }));

    const filteredState = stateOptions.filter(state =>
        state.name.toLowerCase().includes(stateSearchText.toLowerCase())
    );

    const searchLocations = async (query) => {
        if (query.length > 2) {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
                address: query
            });
            console.log("data", data)
            if (data?.success && data?.data) {
                setAddressSuggestions(data?.data)
            }
        } else {
            setAddressSuggestions([]);
        }
    };

    const handleGoogleAddressSelect = (place) => {
        if (!place || !place.formatted_address) {
            console.error("Google Address selection is invalid", place);
            return;
        }

        const parsedAddress = parseAddress(place.formatted_address);
        parsedAddress.pincode = extractPincode(place.address_components);

        setFieldValue("address", place.formatted_address);

        if (isSameAddress) {
            setFieldValue("street", parsedAddress.street);
            setFieldValue("thaluk", parsedAddress.taluk);
            setFieldValue("district", parsedAddress.district);
            setFieldValue("state", parsedAddress.state);
            setFieldValue("pincode", parsedAddress.pincode);
        }
    };

    const parseAddress = (address) => {
        if (!address || typeof address !== "string") {
            console.error("parseAddress received an undefined or invalid address");
            return {
                street: "",
                taluk: "",
                district: "",
                state: "",
                country: "",
                pincode: "",
            };
        }

        const parts = address.split(", ").reverse();
        return {
            street: parts[4] || "",
            taluk: parts[3] || "",
            district: parts[2] || "",
            state: parts[1] || "",
            country: parts[0] || "",
            pincode: "",
        };
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <AccountCreationTabs activeStage={1} />
            <div className="mb-4">
                <h2 className="text-2xl font-bold">Add new Account</h2>
                <span className='text-xs text-blue-gray-600 mt-1'>All fields are required</span>
            </div>
            <Formik
                initialValues={initialValues}
                validationSchema={ACCOUNT_ADD_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, dirty, isValid, setFieldValue, values, errors }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor="type" className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field as="select" name="type" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                        <option value="">Select Type</option>
                                        <option value="Individual">Owner cum Driver</option>
                                        <option value="Company">Travels</option>
                                    </Field>
                                    <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium text-gray-700">{values.type == 'driverWithVehicles' ? "Full Name" : 'Company Name'}</label>
                                    <Field type="text" name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Field type="text" name="phoneNumber" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                    <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                    <Field as="select" name="source" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                        <option value="">Select Type</option>
                                        <option value="Mobile App">Mobile App</option>
                                        <option value="Walk In">Walk In</option>
                                        <option value="Call">Call</option>
                                        <option value="Website">Website</option>
                                    </Field>
                                    <ErrorMessage name="source" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                    <Field type="email" name="email" className="p-2 w-full rounded-md border-2  shadow-sm border-gray-300" />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="address" className="text-sm font-medium text-gray-700">Current Address</label>
                                    <Field name="address">
                                        {({ field, form }) => (
                                            <LocationInput
                                                field={field}
                                                form={form}
                                                suggestions={addressSuggestions}
                                                onSearch={searchLocations}
                                                onSelect={handleGoogleAddressSelect}
                                            />
                                        )}
                                    </Field>
                                    <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                                </div>
                            </div>
                            <div className='space-y-2'>
                                <div className="flex items-center mt-2">
                                    <input
                                        type="checkbox"
                                        id="sameAddress"
                                        checked={isSameAddress}
                                        onChange={(e) => {
                                            setIsSameAddress(e.target.checked);
                                            if (e.target.checked) {
                                                const currentAddress = parseAddress(values.address);
                                                setFieldValue("street", currentAddress.street);
                                                setFieldValue("thaluk", currentAddress.taluk);
                                                setFieldValue("district", currentAddress.district);
                                                setFieldValue("state", currentAddress.state);
                                                setFieldValue("pincode", currentAddress.pincode);
                                            } else {
                                                setFieldValue("street", "");
                                                setFieldValue("thaluk", "");
                                                setFieldValue("district", "");
                                                setFieldValue("state", "");
                                                setFieldValue("pincode", "");
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    <label htmlFor="sameAddress" className="text-sm text-gray-700">
                                        Same as Current Address
                                    </label>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 mb-5">Permanent Address</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="street" className="text-sm font-medium text-gray-700">Street Name</label>
                                    <Field type="text" name="street" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="street" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="thaluk" className="text-sm font-medium text-gray-700">
                                        Thaluk
                                    </label>
                                    <select
                                        id="thaluk"
                                        name="thaluk"
                                        value={values.thaluk}
                                        onChange={(e) => setFieldValue("thaluk", e.target.value)}
                                        className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                                    >
                                        <option value="" disabled>Select Thaluk</option>
                                        {filteredThaluk.map((thaluk) => (
                                            <option key={thaluk.id} value={thaluk.id}>
                                                {thaluk.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMessage
                                        name="thaluk"
                                        component="div"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="district" className="text-sm font-medium text-gray-700">
                                        District
                                    </label>
                                    <select
                                        id="district"
                                        name="district"
                                        value={values.district}
                                        onChange={(e) => setFieldValue("district", e.target.value)}
                                        className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                                    >
                                        <option value="" disabled>Select District</option>
                                        {filteredDistricts.map((district) => (
                                            <option key={district.id} value={district.id}>
                                                {district.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMessage
                                        name="district"
                                        component="div"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="state" className="text-sm font-medium text-gray-700">
                                        State
                                    </label>
                                    <select
                                        id="state"
                                        name="state"
                                        value={values.state}
                                        onChange={(e) => setFieldValue("state", e.target.value)}
                                        className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                                    >
                                        <option value="" disabled>Select State</option>
                                        {filteredState.map((state) => (
                                            <option key={state.id} value={state.id}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMessage
                                        name="state"
                                        component="div"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</label>
                                    <Field type="text" name="pincode" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="pincode" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                            </div>
                        </div>
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
                                // color="blue-gray-50"
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

export default AddAccountNew;