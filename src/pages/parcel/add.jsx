import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, STATE_LIST, THALUK_LIST, KYC_PROCESS, ColorStyles } from '@/utils/constants';
import { parseAddressParts } from '@/utils/addressUtils';
import { Alert, Button, Dialog, DialogHeader, DialogBody, Typography, Card, CardBody, Input, List, ListItem, Spinner } from '@material-tailwind/react';
import { useNavigate, useParams } from "react-router-dom";

const LocationInput = ({ field, form, suggestions, onSearch, disabled, onSelect }) => {
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
                                const selectedText = getSuggestionText(suggestion);
                                form.setFieldValue(field.name, selectedText);
                                if (onSelect) onSelect(selectedText, suggestion);
                                setIsFocused(false);
                                form.validateField(field.name);
                            }}
                            className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
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

const ParcelAdd = (props) => {
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
        livePhoto: null,
        rc:null,
        vehiclePhoto: null,
        drivingLicenseImage: null,
        insurance: null,
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

    const onSubmit = async (values, { setSubmitting }) => {
        // console.log('Form submission started with values:', values);
        try {
            const pincodeVal = String(values?.pincode || "").trim();
            if (!/^\d+$/.test(pincodeVal)) {
                setAlert({ message: "Please enter a valid pincode", color: "red" });
                setSubmitting(false);
                return;
            }

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
                pincode: Number(pincodeVal),
                source: values?.source,
            }
            let data;
            data = await ApiRequestUtils.post(API_ROUTES.CREATE_ACCOUNT, reqBody);
            if (!data?.success && data?.code === 203) {
                setAlert({ message: 'Account already exists!', color: 'red' });
                setTimeout(() => setAlert(null), 5000);
            } else if (data?.success && Number.isInteger(Number(data?.data?.id)) && Number(data?.data?.id) > 0) {
                // navigate('/dashboard/vendors/account', {
                //     state: {
                //         accountAdded:  true,
                //         accountName: values.name
                //     }
                // });
                setOwnerAdded({
                    ownerId: Number(data?.data?.id),
                    value: true
                });
                setIsEditable(false);
            } else {
                setAlert({ message: data?.message || "Failed to create account", color: "red" });
                setTimeout(() => setAlert(null), 5000);
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
                        className={`text-xs font-semibold ${value ? 'text-green-500' : 'text-blue-500'}`}
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
                            multiple={name !== "livePhoto" && name !== "bankStatement" && name !== "insurance"}
                        />
                    </div>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    {value && (
                        <Typography
                            variant="small"
                            className="font-semibold underline cursor-pointer text-blue-900"
                            onClick={() => {
                                setModalData({
                                    image: fullDocVal?.image1,
                                    image2: fullDocVal?.image2,
                                    type: label
                                });
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

    const normalizeText = (value = "") =>
        String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

    const getMatchedOptionValue = (options, rawValue) => {
        if (!rawValue) return "";
        const target = normalizeText(rawValue);
        const exact = options.find((opt) => normalizeText(opt.name) === target);
        if (exact) return exact.id;
        const partial = options.find(
            (opt) =>
                normalizeText(opt.name).includes(target) ||
                target.includes(normalizeText(opt.name))
        );
        return partial ? partial.id : "";
    };

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
            if (!files || files.length === 0) {
                setLoading(false);
                return;
            }
            const accountIdNum = Number(ownerAdded?.ownerId);
            if (!Number.isInteger(accountIdNum) || accountIdNum <= 0) {
                setAlert({ message: "Please create bike account first, then upload documents.", color: "red" });
                return;
            }

            // Determine document type based on label
            let type;
            switch (label) {
                case 'aadhaarImage':
                    type = KYC_PROCESS.AADHAAR;
                    break;
                case 'rc':
                    type = KYC_PROCESS.RC_COPY;
                    break;
                case 'drivingLicenseImage':
                    type = KYC_PROCESS.DRIVING_LICENSE;
                    break;
                case 'vehiclePhoto':
                    type = KYC_PROCESS.VEHICLE_PHOTO;
                    break;
                case 'panImage':
                    type = KYC_PROCESS.PAN;
                    break;
                case 'insurance':
                    type = KYC_PROCESS.INSURANCE;
                    break;
                default:
                    type = '';
            }

            const formData = new FormData();
            formData.append('type', type);
            formData.append('accountId', String(accountIdNum));
            
            // Handle single or multiple files
            const isSingleFile = label === "livePhoto" || label === "bankStatement" || label === "insurance";
            
            if (files[0]) {
                formData.append('image1', files[0]);
                formData.append('extImage1', files[0].name.split('.').pop());
                formData.append('fileTypeImage1', files[0].type);
            }
            
            if (files[1] && !isSingleFile) {
                formData.append('image2', files[1]);
                formData.append('extImage2', files[1].name.split('.').pop());
                formData.append('fileTypeImage2', files[1].type);
            }

            const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);

            console.log('Document upload response:', data);
            
            if (data?.success) {
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: {
                        image1: data?.data?.image1,
                        image2: data?.data?.image2,
                        id: data?.data?.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        User: data?.data?.User || null
                    },
                }));
                setAlert({ message: "Document uploaded successfully", color: "green" });
            } else {
                setAlert({ message: data?.message || "Failed to upload document", color: "red" });
            }
        } catch (err) {
            console.error("Error during image upload:", err);
            setAlert({ message: "Upload error occurred: " + (err.message || "Unknown error"), color: "red" });
        } finally {
            setLoading(false);
            setTimeout(() => setAlert(null), 5000);
        }
    };
    const handlePhotoUpload = async (e, setFieldValue, label) => {
        try {
            setLoading(true);
            const files = e.target.files;
            if (!files || files.length === 0) {
                setLoading(false);
                return;
            }
            const accountIdNum = Number(ownerAdded?.ownerId);
            if (!Number.isInteger(accountIdNum) || accountIdNum <= 0) {
                setAlert({ message: "Please create bike account first, then upload documents.", color: "red" });
                return;
            }

            // Determine document type based on label
            let type;
            switch (label) {
                case 'livePhoto':
                    type = KYC_PROCESS.LIVE_PHOTO;
                    break;
                case 'bankStatement':
                    type = KYC_PROCESS.BANK_STATEMENT;
                    break;
                default:
                    type = '';
            }

            const formData = new FormData();
            formData.append('type', type);
            formData.append('accountId', String(accountIdNum));
            
            // Handle single file (live photo and bank statement are single files)
            if (files[0]) {
                formData.append('image1', files[0]);
                formData.append('extImage1', files[0].name.split('.').pop());
                formData.append('fileTypeImage1', files[0].type);
            }

            const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);

            console.log('Document upload response:', data);
            
            if (data?.success) {
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: {
                        image1: data?.data?.image1,
                        id: data?.data?.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        User: data?.data?.User || null
                    },
                }));
                setAlert({ message: "Document uploaded successfully", color: "green" });
            } else {
                setAlert({ message: data?.message || "Failed to upload document", color: "red" });
            }
        } catch (err) {
            console.error("Error during image upload:", err);
            setAlert({
                message: "An error occurred while uploading the photo.",
                color: "red",
            });
        } finally {
            setLoading(false);
            setTimeout(() => setAlert(null), 5000);
        }
    };


    const handleGoogleAddressSelect = (addressText, place) => {
        const resolvedAddress =
            addressText ||
            place?.formatted_address ||
            place?.fullText ||
            place?.title ||
            '';

        if (!resolvedAddress) {
            console.error("Google Address selection is invalid", place);
            return;
        }

        const parsedAddress = parseAddress(resolvedAddress, place?.address_components);

        setFieldValue("address", resolvedAddress);

        if (isSameAddress) {
            setFieldValue("street", parsedAddress.street);
            setFieldValue("thaluk", getMatchedOptionValue(thalukOptions, parsedAddress.taluk));
            setFieldValue("district", getMatchedOptionValue(districtOptions, parsedAddress.district));
            setFieldValue("state", getMatchedOptionValue(stateOptions, parsedAddress.state));
            setFieldValue("pincode", parsedAddress.pincode);
        }
    };

    const parseAddress = (address, addressComponents = []) => parseAddressParts({
        addressText: address,
        addressComponents,
    });


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
            <h2 className="text-2xl font-bold mb-4">Add new Vehicles Account</h2>
            <Formik
                initialValues={initialValues}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, dirty, isValid, setFieldValue, values, errors, touched }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor="type" className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field as="select" disabled={!isEditable} name="type" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                        <option value="">Select the Service Type</option>
                                        <option value="Parcel">Bike</option>
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
                                    <Field as="select" disabled={!isEditable} name="source" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
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
                                                setFieldValue("thaluk", getMatchedOptionValue(thalukOptions, currentAddress.taluk));
                                                setFieldValue("district", getMatchedOptionValue(districtOptions, currentAddress.district));
                                                setFieldValue("state", getMatchedOptionValue(stateOptions, currentAddress.state));
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
                                        className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
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
                                        className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
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
                                        className="p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
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
                                onClick={() => { navigate('/dashboard/vendors/account/parcel/list'); }}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                // color="blue-gray-50"
                                onClick={handleSubmit}
                                disabled={!dirty || !isValid || !/^\d+$/.test(String(values?.pincode || "").trim())}
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
                                                   
                                                    <DocumentUpload
                                                        label="Driving License Image"
                                                        value={imagePreviews.drivingLicenseImage?.image1}
                                                        name="drivingLicenseImage"
                                                        onChange={(e) => handleImageUpload(e, setFieldValue, "drivingLicenseImage")}
                                                        setModalData={setModalData}
                                                        fullDocVal={imagePreviews.drivingLicenseImage}
                                                        image2={imagePreviews.drivingLicenseImage?.image2}
                                                    />
                                                    <DocumentUpload
                                                    label="Aadhaar Image"
                                                    value={imagePreviews.aadhaarImage?.image1}
                                                    name="aadhaarImage"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "aadhaarImage")}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.aadhaarImage}
                                                    image2={imagePreviews.aadhaarImage?.image2}
                                                    />
                                                    
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
                                    onClick={() => navigate('/dashboard/vendors/account/parcel/list')}
                                    className={`my-6 mx-2 ${ColorStyles.backButton}`}
                                >
                                    Back
                                </Button>
                                <Button
                                    fullWidth
                                    color='black'
                                    onClick={() => navigate(`/dashboard/vendors/account/parcel/edit/${ownerAdded.ownerId}`)}
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
                                {modalData.image && (
                                    modalData.image.toLowerCase().endsWith(".pdf") ? (
                                        <iframe
                                            src={modalData.image}
                                            title="Document PDF"
                                            className="w-full rounded-lg shadow-md"
                                            style={{ height: "45vh" }}
                                            onError={() => {
                                                console.error('Failed to load PDF:', modalData.image);
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={modalData.image}
                                            alt="Document"
                                            className="rounded-lg shadow-md"
                                            style={{ width: "45%", height: "45vh", objectFit: "contain" }}
                                            onError={(e) => {
                                                console.error('Failed to load image:', modalData.image);
                                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                                            }}
                                        />
                                    )
                                )}
                                {modalData.image2 && (
                                    modalData.image2.toLowerCase().endsWith(".pdf") ? (
                                        <iframe
                                            src={modalData.image2}
                                            title="Document PDF 2"
                                            className="rounded-lg shadow-md"
                                            style={{ height: "45vh", width: "45%" }}
                                            onError={() => {
                                                console.error('Failed to load PDF 2:', modalData.image2);
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={modalData.image2}
                                            alt="Document 2"
                                            className="rounded-lg shadow-md"
                                            style={{ height: "45vh", width: "45%", objectFit: "contain" }}
                                            onError={(e) => {
                                                console.error('Failed to load image 2:', modalData.image2);
                                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                                            }}
                                        />
                                    )
                                )}
                            </div>

                            <div className="flex justify-center mt-4">
                                {modalData.image && (
                                    <a
                                        href={modalData.image}
                                        download={`document-${modalData.type || 'image'}-1`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                                        onClick={(e) => {
                                            // Fallback: if download fails, open in new tab
                                            if (!modalData.image || modalData.image === '') {
                                                e.preventDefault();
                                                alert('Document URL not available');
                                                return;
                                            }
                                            // Try to trigger download
                                            const link = document.createElement('a');
                                            link.href = modalData.image;
                                            link.download = `document-${modalData.type || 'image'}-1`;
                                            link.target = '_blank';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        Download Image 1
                                    </a>
                                )}
                                {modalData.image2 && (
                                    <a
                                        href={modalData.image2}
                                        download={`document-${modalData.type || 'image'}-2`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={(e) => {
                                            // Fallback: if download fails, open in new tab
                                            if (!modalData.image2 || modalData.image2 === '') {
                                                e.preventDefault();
                                                alert('Document URL not available');
                                                return;
                                            }
                                            // Try to trigger download
                                            const link = document.createElement('a');
                                            link.href = modalData.image2;
                                            link.download = `document-${modalData.type || 'image'}-2`;
                                            link.target = '_blank';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
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

export default ParcelAdd;
