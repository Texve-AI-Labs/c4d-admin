import React, { useState, useEffect } from 'react';
// import Select from 'react-select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, STATE_LIST, THALUK_LIST, KYC_PROCESS, ColorStyles } from '@/utils/constants';
import { ACCOUNT_ADD_SCHEMA } from '@/utils/validations';
import { Alert, Button, Dialog, DialogHeader, DialogBody, Typography, Card, CardBody, Input, List, ListItem, Spinner } from '@material-tailwind/react';
import { useNavigate, useParams } from "react-router-dom";
import Select from 'react-select'

const LocationInput = ({ field, form, suggestions, onSearch, disabled, onSelect }) => {
    const [isFocused, setIsFocused] = useState(false);
    const getPrimaryLabel = (suggestion) => {
        if (typeof suggestion === 'string') return suggestion;
        if (suggestion && typeof suggestion === 'object') {
            return suggestion.title || suggestion.name || suggestion.label || '';
        }
        return '';
    };
    const getSuggestionLabel = (suggestion) => {
        if (typeof suggestion === 'string') return suggestion;
        if (suggestion && typeof suggestion === 'object') {
            return (
                suggestion.fullText ||
                suggestion.name ||
                suggestion.address ||
                suggestion.label ||
                suggestion.title ||
                suggestion.subtitle ||
                suggestion.formatted_address ||
                suggestion.description ||
                suggestion.display_name ||
                ''
            );
        }
        return '';
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
                    onSearch(e.target.value);
                    form.setFieldTouched(field.name, true, false);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    field.onBlur(e);
                    setTimeout(() => setIsFocused(false), 200);
                    form.validateField(field.name);
                }}
                className="pr-10"
                disabled={disabled}
            />
            {suggestions.length > 0 && isFocused && (
                <List className="w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {suggestions.map((suggestion, index) => (
                        <ListItem
                            key={index}
                            onClick={() => {
                                const selectedValue = getSuggestionLabel(suggestion);
                                form.setFieldValue(field.name, selectedValue);
                                onSelect(suggestion);
                                setIsFocused(false);
                                form.validateField(field.name);
                            }}
                            className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
                        >
                            <div className="flex flex-col">
                                <Typography variant="small" className="font-semibold text-gray-900">
                                    {getPrimaryLabel(suggestion) || getSuggestionLabel(suggestion)}
                                </Typography>
                                {typeof suggestion === 'object' && suggestion?.fullText ? (
                                    <Typography variant="small" className="text-gray-600 text-xs">
                                        {suggestion.fullText}
                                    </Typography>
                                ) : null}
                            </div>
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
};

const AccountAdd = (props) => {
    const [districtSearchText, setDistrictSearchText] = useState("");
    const [thalukSearchText, setThalukSearchText] = useState("");
    const [stateSearchText, setStateSearchText] = useState("");
    const [alert, setAlert] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [modalData, setModalData] = useState(null);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSameAddress, setIsSameAddress] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serviceAreas, setServiceAreas] = useState([]);
    const [ownerAdded, setOwnerAdded] = useState({
        ownerId: "",
        value: false
    });
    const [isEditable, setIsEditable] = useState(true);
    const [imagePreviews, setImagePreviews] = useState({
        aadhaarImage: null,
        policeClearance: null,
        livePhoto: null,
        drivingLicenseImage: null,
        vehiclePhoto: null,
        consentForm: null,
        panImage: null,
        bankStatementImage: null,
        insurance: null,
        permit: null,
    });

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
                const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS, {
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
                setAlert({ message: 'Account already exists!', color: 'red' });
                setTimeout(() => setAlert(null), 5000);
                resetForm();
            } else {
                // navigate('/dashboard/vendors/account', {
                //     state: {
                //         accountAdded:  true,
                //         accountName: values.name
                //     }
                // });
                setOwnerAdded({
                    ownerId: data?.data?.id,
                    value: true
                });
                setIsEditable(false);
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


    const DocumentUpload = ({ label, value, name, onChange, setModalData, fullDocVal }) => {
        return (
            <tr>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-600">{label}</Typography>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography
                        className={`text-xs font-semibold ${value ? 'text-green-500' : 'text-primary-500'}`}
                    >
                        {value ? "UPLOADED" : "NO DOCUMENTS"}
                    </Typography>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor={name}
                            className="inline-block text-center text-white border border-gray-400 bg-black rounded-lg px-4 py-1 cursor-pointer"
                        >
                            Upload
                        </label>
                        <input
                            type="file"
                            accept="image/*, application/pdf"
                            id={name}
                            name={name}
                            onChange={onChange}
                            className="hidden"
                            multiple={name !== "livePhoto" && name !== "bankStatement" && name !== "insurance" && name !== "permit"}
                        />
                    </div>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    {value && (
                        <Typography
                            variant="small"
                            className="font-semibold underline cursor-pointer text-primary-900"
                            onClick={() => {
                                if (label === 'Live Photo' || label === 'Bank Statement' || label === 'Insurance' || label === 'Permit') {
                                    setModalData({
                                        image1: fullDocVal?.image1
                                    });
                                }
                                else {
                                    setModalData({
                                        image1: fullDocVal?.image1,
                                        image2: fullDocVal?.image2,
                                    });
                                }
                            }}
                        >
                            View/Download
                        </Typography>
                    )}
                </td>


            </tr>
        );
    };

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

    const handleImageUpload = async (e, setFieldValue, label) => {
        try {
            setLoading(true);
            const files = e.target.files;
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (files.length > 2) {
                setLoading(false);
                alert("You can upload a maximum of two documents.");
                return;
            }

            const uploadedFiles = [];
            const previews = {};

            for (let i = 0; i < files.length; i++) {
                if (!allowedTypes.includes(files[i].type)) {
                    setLoading(false);
                    setAlert({
                        message: "Invalid file type. Please upload JPG, PNG, or PDF.",
                        color: "red",
                    });
                    setTimeout(() => setAlert(null), 5000);
                    return;
                }
                if (files[i].size > maxSize) {
                    setLoading(false);
                    setAlert({
                        message: "File size exceeds 10MB limit.",
                        color: "red",
                    });
                    setTimeout(() => setAlert(null), 5000);
                    return;
                }
                const file = files[i];
                uploadedFiles.push(file);

                const reader = new FileReader();
                reader.onloadend = () => {
                    previews[label] = reader.result;
                    setImagePreviews((prev) => ({ ...prev, ...previews }));
                };
                reader.readAsDataURL(file);

                setFieldValue(label, uploadedFiles);
            }

            let type = "";
            switch (label) {
                case "aadhaarImage":
                    type = KYC_PROCESS.AADHAAR;
                    break;
                case "rc":
                    type = KYC_PROCESS.RC_COPY;
                    break;
                case "drivingLicenseImage":
                    type = KYC_PROCESS.DRIVING_LICENSE;
                    break;
                case "vehiclePhoto":
                    type = KYC_PROCESS.VEHICLE_PHOTO;
                    break;
                case "panImage":
                    type = KYC_PROCESS.PAN;
                    break;
                case "insurance":
                    type = KYC_PROCESS.INSURANCE;
                    break;
                case "permit":
                    type = KYC_PROCESS.PERMIT;
                    break;
                default:
                    break;
            }
            const formData = new FormData();
            const isSingleFileDoc = label === "insurance" || label === "permit";

            formData.append('image1', files[0]);
            formData.append('extImage1', files[0].name.split('.').pop());
            formData.append('fileTypeImage1', files[0].type);
            if (files[1] && !isSingleFileDoc) {
            formData.append('image2', files[1]);
            formData.append('extImage2', files[1].name.split('.').pop());
            formData.append('fileTypeImage2', files[1].type);
            }
            formData.append('type', type);
            formData.append('accountId', ownerAdded?.ownerId);

            const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);

            console.log('DATA IN DOC INSERT :', data);

            if (data?.success) {
                // console.log(data);
                setLoading(false);
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: {
                        image1: data?.data?.image1 || prev[label]?.image1,
                        image2: data?.data?.image2 || prev[label]?.image2,
                        id: data?.data?.id,
                    }
                }))
            }
            else {
                setLoading(false);
                setAlert({
                    message: data?.message || "Failed to upload document. Please try again.",
                    color: "red",
                });
                setTimeout(() => setAlert(null), 5000);
            }
        }
        catch (err) {
            console.log("ERR - >", err);
        }
    };
    const handlePhotoUpload = async (e, setFieldValue, label) => {
        try {
            setLoading(true);
            const file = e.target.files[0];
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!allowedTypes.includes(file.type)) {
                setLoading(false);
                setAlert({
                    message: "Invalid file type. Please upload JPG, PNG, or PDF.",
                    color: "red",
                });
                setTimeout(() => setAlert(null), 5000);
                return;
            }
            if (file.size > maxSize) {
                setLoading(false);
                setAlert({
                    message: "File size exceeds 10MB limit.",
                    color: "red",
                });
                setTimeout(() => setAlert(null), 5000);
                return;
            }

            setFieldValue(label, file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: reader.result,
                }));
            };
            reader.readAsDataURL(file);

            const type = label === 'livePhoto' ? KYC_PROCESS.LIVE_PHOTO : label === 'bankStatement' ? KYC_PROCESS.BANK_STATEMENT : '';

            const formData = new FormData();

            formData.append('image1', file);
            formData.append('extImage1', file.name.split('.').pop());
            formData.append('fileTypeImage1', file.type);
            formData.append('type', type);
            formData.append('accountId', ownerAdded?.ownerId);

            const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);

            console.log('DATA IN DOC INSERT :', data);


            if (data?.success) {
                setLoading(false);
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: {
                        image1: data?.data?.image1 || prev[label]?.image1,
                        id: data?.data?.id,
                    }
                }))
            }
            else {
                setLoading(false);
                setAlert({
                    message: data?.message || "Failed to upload photo. Please try again.",
                    color: "red",
                });
                setTimeout(() => setAlert(null), 5000);
            }
        } catch (err) {
            setAlert({
                message: "An error occurred while uploading the photo.",
                color: "red",
            });
            setTimeout(() => setAlert(null), 5000);
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
        <div className="p-4">
            {alert && (
                <div className='mb-2'>
                    <Alert
                        color={alert.color}
                        className='py-3 px-6 rounded-xl'
                    >
                        {alert.message}
                    </Alert>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Add new Account</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={ACCOUNT_ADD_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, dirty, isValid, setFieldValue, values, errors, touched }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor="type" className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field as="select" disabled={!isEditable} name="type" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                        <option value="">Select Type</option>
                                        <option value="Individual">Owner cum Driver</option>
                                        <option value="Company">Travels</option>
                                    </Field>
                                    <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium text-gray-700">{values.type == 'driverWithVehicles' ? "Full Name" : 'Company Name'}</label>
                                    <Field type="text" name="name" disabled={!isEditable} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Field type="text" name="phoneNumber" disabled={!isEditable} className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                    <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                    <Field as="select" disabled={!isEditable} name="source" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
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
                                    <Field type="email" name="email" disabled={!isEditable} className="p-2 w-full rounded-md border-2  shadow-sm border-gray-300" />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="address" className="text-sm font-medium text-gray-700">Current Address</label>
                                    <Field name="address" disabled={!isEditable}>
                                        {({ field, form }) => (
                                            <LocationInput
                                                field={field}
                                                form={form}
                                                suggestions={addressSuggestions}
                                                onSearch={searchLocations}
                                                disabled={!isEditable}
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
                                        disabled={!isEditable}
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
                                    <Field type="text" name="street" disabled={!isEditable} className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
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
                                        disabled={!isEditable}
                                        className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
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
                                        disabled={!isEditable}
                                        onChange={(e) => setFieldValue("district", e.target.value)}
                                        className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
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
                                        disabled={!isEditable}
                                        onChange={(e) => setFieldValue("state", e.target.value)}
                                        className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
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
                                    <Field type="text" disabled={!isEditable} name="pincode" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                    <ErrorMessage name="pincode" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                            </div>
                        </div>
                        {!ownerAdded.value && <div className='flex flex-row'>
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
                        </div>}
                        {ownerAdded.value && (
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
                                                        <th
                                                            key={index}
                                                            className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                                        >
                                                            <Typography
                                                                variant="small"
                                                                className="text-[11px] font-bold uppercase text-blue-gray-400"
                                                            >
                                                                {el}
                                                            </Typography>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                    {values.type === "Individual" && (
                                                    <DocumentUpload
                                                        label="Driving License Image"
                                                        value={imagePreviews.drivingLicenseImage?.image1}
                                                        name="drivingLicenseImage"
                                                        onChange={(e) => handleImageUpload(e, setFieldValue, "drivingLicenseImage")}
                                                        setModalData={setModalData}
                                                        fullDocVal={imagePreviews.drivingLicenseImage}
                                                        image2={imagePreviews.drivingLicenseImage?.image2}
                                                    />
                                                    )}
                                                    <DocumentUpload
                                                    label="Aadhaar Image"
                                                    value={imagePreviews.aadhaarImage?.image1}
                                                    name="aadhaarImage"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "aadhaarImage")}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.aadhaarImage}
                                                    image2={imagePreviews.aadhaarImage?.image2}
                                                    />
                                                    {values.type !== "Company" && values.type !== "Individual" && (
                                                    <DocumentUpload
                                                        label="PAN Image"
                                                        value={imagePreviews.panImage?.image1}
                                                        name="panImage"
                                                        onChange={(e) => handleImageUpload(e, setFieldValue, "panImage")}
                                                        setModalData={setModalData}
                                                        fullDocVal={imagePreviews.panImage}
                                                        image2={imagePreviews.panImage?.image2}
                                                    />
                                                    )}
                                                    <DocumentUpload
                                                    label="Live Photo"
                                                    value={imagePreviews.livePhoto?.image1}
                                                    name="livePhoto"
                                                    onChange={(e) => handlePhotoUpload(e, setFieldValue, "livePhoto")}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.livePhoto}
                                                    image2={imagePreviews.livePhoto?.image2}
                                                    />
                                                    <DocumentUpload
                                                    label="RC"
                                                    value={imagePreviews.rc?.image1}
                                                    name="rc"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "rc")}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.rc}
                                                    image2={imagePreviews.rc?.image2}
                                                    />
                                                    <DocumentUpload
                                                    label="Vehicle Photo"
                                                    value={imagePreviews.vehiclePhoto?.image1}
                                                    name="vehiclePhoto"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "vehiclePhoto")}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.vehiclePhoto}
                                                    image2={imagePreviews.vehiclePhoto?.image2}
                                                    />
                                                    <DocumentUpload
                                                        label="Insurance"
                                                        value={imagePreviews.insurance?.image1}
                                                        name="insurance"
                                                        onChange={(e) => handleImageUpload(e, setFieldValue, "insurance")}
                                                        setModalData={setModalData}
                                                        fullDocVal={imagePreviews.insurance}
                                                    />
                                                    <DocumentUpload
                                                        label="Permit"
                                                        value={imagePreviews.permit?.image1}
                                                        name="permit"
                                                        onChange={(e) => handleImageUpload(e, setFieldValue, "permit")}
                                                        setModalData={setModalData}
                                                        fullDocVal={imagePreviews.permit}
                                                    />
                                                    {values.type !== "Company" && values.type !== "Individual" && (
                                                    <DocumentUpload
                                                        label="Bank Statement"
                                                        value={imagePreviews.bankStatement?.image1}
                                                        name="bankStatement"
                                                        onChange={(e) => handlePhotoUpload(e, setFieldValue, "bankStatement")}
                                                        setModalData={setModalData}
                                                        fullDocVal={imagePreviews.bankStatement}
                                                        image2={imagePreviews.bankStatement?.image2}
                                                    />
                                            )}
                                        </tbody>
                                        </table>
                                    </CardBody>
                                </Card>
                            </div>
                                )}
                            </div>
                            )}
                        {ownerAdded.value &&
                            <div className='flex flex-row'>
                                <Button
                                    fullWidth
                                    onClick={() => navigate('/dashboard/vendors/account')}
                                    className={`my-6 mx-2 ${ColorStyles.backButton}`}
                                >
                                    Back
                                </Button>
                                <Button
                                    fullWidth
                                    color='black'
                                    onClick={() => navigate(`/dashboard/vendors/account/edit/${ownerAdded.ownerId}`)}
                                    className='my-6 mx-2'
                                >
                                    Edit
                                </Button>
                            </div>
                        }
                    </Form>
                )}
            </Formik>
            {modalData && (
                <Dialog open={Boolean(modalData)} handler={() => setModalData(null)} size="md">
                    <DialogHeader>
                        <div className="flex justify-between items-center w-full">
                            <Typography variant="h6">Document Details</Typography>
                            <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => setModalData(null)}
                            >
                                X
                            </button>
                        </div>
                    </DialogHeader>
                    <DialogBody divider>
                        <div className="flex flex-col items-center space-y-3">
                            <div className={`flex ${modalData.image2 ? "flex-row space-x-6" : "flex-col"} justify-center`}>
                                {modalData.image1 && (
                                    <iframe
                                        src={modalData.image1}
                                        className="w-full rounded-lg shadow-md"
                                        style={{ height: "45vh", width: "45%" }}
                                    />
                                )}
                                {modalData.image2 && (
                                    <iframe
                                        src={modalData.image2}
                                        className="rounded-lg shadow-md"
                                        style={{ height: "45vh", width: "45%" }}
                                    />
                                )}
                            </div>


                            <div className="flex justify-center mt-4">
                                <a
                                    href={modalData.image1}
                                    download
                                    target="_blank"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                                >
                                    Download Image 1
                                </a>
                                {modalData.image2 && (
                                    <a
                                        href={modalData.image2}
                                        download
                                        target="_blank"
                                        className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                                    >
                                        Download Image 2
                                    </a>
                                )}
                            </div>
                        </div>
                    </DialogBody>
                </Dialog>
            )}
        </div>
    );
};

export default AccountAdd;
