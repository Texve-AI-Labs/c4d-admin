import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles, KYC_PROCESS, STATE_LIST, THALUK_LIST } from '@/utils/constants';
import { Alert, Button, Input, List, ListItem, Dialog, DialogHeader, DialogBody, Typography, Card, CardBody, Spinner } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ACCOUNT_EDIT_SCHEMA } from '@/utils/validations';
import { parseAddressParts } from '@/utils/addressUtils';
import DownloadLinkButton from '@/components/DownloadLinkButton';
import moment from 'moment';

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
                }}
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

const DocumentUpload = ({ label, value, name, onChange, setModalData, fullDocVal }) => {
    return (
        <tr>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <Typography className="text-xs font-semibold text-blue-gray-600">{label}</Typography>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <Typography className={`text-xs font-semibold ${value ? "text-green-500" : "text-blue-500"}`}>
                    {value ? "UPLOADED" : "NO DOCUMENTS"}
                </Typography>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <Typography className="text-xs font-semibold text-blue-gray-600">
                    {fullDocVal?.created_at ? moment(fullDocVal?.created_at).format("DD-MM-YYYY") : "-"}
                </Typography>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <Typography className="text-xs font-semibold text-blue-gray-600">{fullDocVal?.User?.name || "-"}</Typography>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <Typography className="text-xs font-semibold text-blue-gray-600">
                    {fullDocVal?.updated_at ? moment(fullDocVal?.updated_at).format("DD-MM-YYYY") : "-"}
                </Typography>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                <div className="flex items-center gap-2">
                    <label htmlFor={name} className="inline-block text-center text-white border border-gray-400 bg-blue-600 rounded-lg px-4 py-1 cursor-pointer hover:bg-blue-700 transition-colors">
                        Update
                    </label>
                        <input
                            type="file"
                            accept="image/*, application/pdf"
                            id={name}
                            name={name}
                            onChange={onChange}
                            className="hidden"
                            multiple={name !== "livePhoto" && name !== "bankStatementImage" && name !== "insurranceImage"}
                        />
                </div>
            </td>
            <td className="py-3 px-5 border-b border-blue-gray-50">
                {value && (
                    <Typography
                        variant="small"
                        className="font-semibold underline cursor-pointer text-blue-600 hover:text-blue-800"
                        onClick={() => {
                            console.log('Viewing document:', fullDocVal);
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

const ParcelEdit = () => {
    const [accountVal, setAccountVal] = useState({});
    const [alert, setAlert] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [modalData, setModalData] = useState(null);
    const [isSameAddress, setIsSameAddress] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [serviceAreas, setServiceAreas] = useState([]);
    const [imagePreviews, setImagePreviews] = useState({
        aadhaarImage: null,
        livePhoto: null,
        drivingLicenseImage: null,
        panImage: null,
        rcImage: null,
        vehiclePhotoImage: null,
        bankStatementImage: null,
        insurranceImage: null,
    });

    useEffect(() => {
        fetchItem(id);
    }, [id]);

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

    const districtOptions = [...new Set(
        serviceAreas
            .map((area) => area?.district || area?.name)
            .filter(Boolean)
    )].map((district) => ({
        id: district,
        name: district,
    }));

    const getDocumentByType = (value, type) => {
        return value.find(proof => proof.type === type) || "";
    };

    const fetchItem = async (itemId) => {
        const data = await ApiRequestUtils.get(`${API_ROUTES.GET_ACCOUNT_BY_ID}/${itemId}`);
        setAccountVal(data?.data?.data);
        setImagePreviews({
            aadhaarImage: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.AADHAAR),
            drivingLicenseImage: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.DRIVING_LICENSE),
            livePhoto: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.LIVE_PHOTO),
            bankStatementImage: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.BANK_STATEMENT),
            panImage: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.PAN),
            rcImage: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.RC_COPY),
            vehiclePhotoImage: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.VEHICLE_PHOTO),
            insurranceImage: getDocumentByType(data?.data?.data?.Proofs || [], KYC_PROCESS.INSURANCE),
        });
    };

    const initialValues = {
        name: accountVal?.name || "",
        phoneNumber: accountVal?.phoneNumber ? accountVal?.phoneNumber.replace(/^(\+91)/, '') : "",
        type: accountVal?.type || "Parcel",
        email: accountVal?.email || "",
        street: accountVal?.street || "",
        address: accountVal?.address || "",
        source: accountVal?.source || "",
        thaluk: accountVal?.thaluk || "",
        district: accountVal?.district || "",
        state: accountVal?.state || "",
        pincode: accountVal?.pincode || "",
        ownerStatus: accountVal?.ownerStatus || ""
    };

    const handleImageUpload = async (e, setFieldValue, label, docId) => {
        try {
            setLoading(true);
            const files = e.target.files;
            if (!files || files.length === 0) {
                setLoading(false);
                return;
            }
            const accountIdNum = Number(accountVal?.id);
            if (!Number.isInteger(accountIdNum) || accountIdNum <= 0) {
                setAlert({ message: "Invalid account. Please refresh and try again.", color: "red" });
                return;
            }

            // Determine document type based on label
            let type;
            switch (label) {
                case 'aadhaarImage':
                    type = KYC_PROCESS.AADHAAR;
                    break;
                case 'rcImage':
                    type = KYC_PROCESS.RC_COPY;
                    break;
                case 'drivingLicenseImage':
                    type = KYC_PROCESS.DRIVING_LICENSE;
                    break;
                case 'vehiclePhotoImage':
                    type = KYC_PROCESS.VEHICLE_PHOTO;
                    break;
                case 'panImage':
                    type = KYC_PROCESS.PAN;
                    break;
                case 'livePhoto':
                    type = KYC_PROCESS.LIVE_PHOTO;
                    break;
                case 'bankStatementImage':
                    type = KYC_PROCESS.BANK_STATEMENT;
                    break;
                case 'insurranceImage':
                    type = KYC_PROCESS.INSURANCE;
                    break;
                default:
                    type = '';
            }

            const formData = new FormData();
            formData.append('type', type);
            formData.append('accountId', String(accountIdNum));
            
            // Handle single or multiple files
            const isSingleFile = label === "livePhoto" || label === "bankStatementImage" || label === "insurranceImage";
            
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

            let data;
            const documentIdNum = Number(docId);
            if (Number.isInteger(documentIdNum) && documentIdNum > 0) {
                // Update existing document
                formData.append('documentId', String(documentIdNum));
                data = await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_PHOTO, formData);
            } else {
                // Create new document
                data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
            }

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

    const searchLocations = async (query) => {
        if (query.length > 2) {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
                address: query
            });
            if (data?.success && data?.data) {
                setAddressSuggestions(data?.data)
            }
        } else {
            setAddressSuggestions([]);
        }
    };

    const onSubmit = async (values, { setSubmitting }) => {
        try {
            const accountIdNum = Number(accountVal?.id);
            if (!Number.isInteger(accountIdNum) || accountIdNum <= 0) {
                setAlert({ message: "Invalid account. Please refresh and try again.", color: "red" });
                setSubmitting(false);
                return;
            }
            const pincodeVal = String(values?.pincode ?? "").trim();
            if (!/^\d{6}$/.test(pincodeVal)) {
                setAlert({ message: "Please enter a valid 6-digit pincode", color: "red" });
                setSubmitting(false);
                return;
            }
            const formData = {
                type: values.type,
                name: values.name,
                phoneNumber: values.phoneNumber,
                email: values.email,
                address: values.address,
                street: values.street,
                thaluk: values.thaluk,
                district: values.district,
                state: values.state,
                pincode: Number(pincodeVal),
                source: values.source,
                accountId: accountIdNum,
                ownerStatus: values.ownerStatus,
                blockedReason: values?.ownerStatus === 'Blocked' ? values?.blockedReason : '',
            }
            await ApiRequestUtils.update(API_ROUTES.UPDATE_ACCOUNT, formData);
            navigate('/dashboard/vendors/account/parcel/list', {
                state: { accountUpdated: true, accountName: values.name }
            });
        } catch (error) {
            console.error('Error updating parcel account:', error);
        }
        setSubmitting(false);
    };

    const parseAddress = (address, addressComponents = []) => parseAddressParts({
        addressText: address,
        addressComponents,
    });

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner className="h-12 w-12" /></div>;
    }

    return (
        <div className="p-4 mx-auto">
            {alert && (
                <div className='mb-2'>
                    <Alert color={alert.color} className='py-3 px-6 rounded-xl'>
                        {alert.message}
                    </Alert>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Update Vehicle Account</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={ACCOUNT_EDIT_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, dirty, isValid, setFieldValue }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor="type" className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field as="select" name="type" disabled className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                        <option value="Parcel">Bike</option>
                                    </Field>
                                </div>
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Company Name</label>
                                    <Field type="text" name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Field type="text" name="phoneNumber" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                    <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                    <Field type="email" name="email" className="p-2 w-full rounded-md border-2 shadow-sm border-gray-300" />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                    <Field as="select" name="source" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                        <option value="">Select Source</option>
                                        <option value="Mobile App">Mobile App</option>
                                        <option value="Walk In">Walk In</option>
                                        <option value="Call">Call</option>
                                        <option value="Website">Website</option>
                                    </Field>
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
                                                onSelect={(place) => setFieldValue("address", place)}
                                            />
                                        )}
                                    </Field>
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
                                                const parsed = parseAddress(values.address);
                                                setFieldValue("street", parsed.street);
                                                setFieldValue("thaluk", parsed.taluk);
                                                setFieldValue("district", parsed.district);
                                                setFieldValue("state", parsed.state);
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    <label htmlFor="sameAddress" className="text-sm text-gray-700">
                                        Same as Current Address
                                    </label>
                                </div>
                                <div><p className="text-sm font-medium text-gray-800 mb-5">Permanent Address</p></div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="street" className="text-sm font-medium text-gray-700">Street Name</label>
                                    <Field type="text" name="street" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="thaluk" className="text-sm font-medium text-gray-700">Thaluk</label>
                                    <Field type="text" name="thaluk" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="district" className="text-sm font-medium text-gray-700">District</label>
                                    <Field as="select" name="district" className="p-2 w-full rounded-md border-gray-300 shadow-sm">
                                        <option value="">Select District</option>
                                        {districtOptions.map((district) => (
                                            <option key={district.id} value={district.id}>
                                                {district.name}
                                            </option>
                                        ))}
                                    </Field>
                                </div>
                                <div>
                                    <label htmlFor="state" className="text-sm font-medium text-gray-700">State</label>
                                    <Field type="text" name="state" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</label>
                                    <Field type="text" name="pincode" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="ownerStatus" className="text-sm font-medium text-gray-700">Owner Status</label>
                                    <Field as="select" name="ownerStatus" className="p-2 w-full rounded-md border-gray-300 shadow-sm">
                                        <option value="">Select status</option>
                                        <option value="Active">Active</option>
                                        <option value="InActive">In_Active</option>
                                        <option value="Blocked">Blocked</option>
                                    </Field>
                                    {values.ownerStatus === 'Blocked' && (
                                        <div className="mt-2">
                                            <Field type="text" name="blockedReason" placeholder="Block Reason" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <Typography variant="h3" className="text-2xl font-bold text-blue-gray-800 mb-2">Documents</Typography>
                            <Card>
                                <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                                    <table className="w-full min-w-[640px] table-auto">
                                        <thead>
                                            <tr>
                                                {["Type", "KYC Status", "Created At", "Verified By", "Verified At", "Action", "View Details"].map((el, index) => (
                                                    <th key={index} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                        <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
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
                                                onChange={(e) => handleImageUpload(e, setFieldValue, "drivingLicenseImage", imagePreviews?.drivingLicenseImage?.id)}
                                                setModalData={setModalData}
                                                fullDocVal={imagePreviews.drivingLicenseImage}
                                            />
                                            <DocumentUpload
                                                label="Aadhaar Image"
                                                value={imagePreviews.aadhaarImage?.image1}
                                                name="aadhaarImage"
                                                onChange={(e) => handleImageUpload(e, setFieldValue, "aadhaarImage", imagePreviews?.aadhaarImage?.id)}
                                                setModalData={setModalData}
                                                fullDocVal={imagePreviews.aadhaarImage}
                                            />
                                            <DocumentUpload
                                                label="Live Photo"
                                                value={imagePreviews.livePhoto?.image1}
                                                name="livePhoto"
                                                onChange={(e) => handleImageUpload(e, setFieldValue, "livePhoto", imagePreviews?.livePhoto?.id)}
                                                setModalData={setModalData}
                                                fullDocVal={imagePreviews.livePhoto}
                                            />
                                            <DocumentUpload
                                                label="RC Copy"
                                                value={imagePreviews.rcImage?.image1}
                                                name="rcImage"
                                                onChange={(e) => handleImageUpload(e, setFieldValue, "rcImage", imagePreviews?.rcImage?.id)}
                                                setModalData={setModalData}
                                                fullDocVal={imagePreviews.rcImage}
                                            />
                                            <DocumentUpload
                                                label="Vehicle Photo"
                                                value={imagePreviews.vehiclePhotoImage?.image1}
                                                name="vehiclePhotoImage"
                                                onChange={(e) => handleImageUpload(e, setFieldValue, "vehiclePhotoImage", imagePreviews?.vehiclePhotoImage?.id)}
                                                setModalData={setModalData}
                                                fullDocVal={imagePreviews.vehiclePhotoImage}
                                            />
                                            <DocumentUpload
                                                label="Insurance"
                                                value={imagePreviews.insurranceImage?.image1}
                                                name="insurranceImage"
                                                onChange={(e) => handleImageUpload(e, setFieldValue, "insurranceImage", imagePreviews?.insurranceImage?.id)}
                                                setModalData={setModalData}
                                                fullDocVal={imagePreviews.insurranceImage}
                                            />
                                        </tbody>
                                    </table>
                                </CardBody>
                            </Card>
                        </div>
                        
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
                                color="blue"
                                onClick={handleSubmit}
                                disabled={!dirty || !isValid}
                                className='my-6 mx-2'
                            >
                                Update
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
            {/* Document Preview Modal */}
            {modalData && (
                <Dialog open={Boolean(modalData)} handler={() => setModalData(null)} size="md">
                    <DialogHeader>
                        <div className="flex justify-between items-center w-full">
                            <Typography variant="h6">Document Details</Typography>
                            <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => {
                                    setModalData(null);
                                }}
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
                                    <DownloadLinkButton
                                        href={modalData.image}
                                        filename={`document-${modalData.type || 'image'}-1`}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                                        onMissingHref={() => alert('Document URL not available')}
                                    >
                                        Download Image 1
                                    </DownloadLinkButton>
                                )}
                                {modalData.image2 && (
                                    <DownloadLinkButton
                                        href={modalData.image2}
                                        filename={`document-${modalData.type || 'image'}-2`}
                                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        onMissingHref={() => alert('Document URL not available')}
                                    >
                                        Download Image 2
                                    </DownloadLinkButton>
                                )}
                            </div>
                        </div>
                    </DialogBody>
                </Dialog>
            )}
        </div>
    );
};

export default ParcelEdit;
