import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, THALUK_LIST, STATE_LIST, KYC_PROCESS, ColorStyles } from '@/utils/constants';
import { Alert, Button, Card, CardBody, Typography, Input, List, ListItem, Dialog, DialogHeader, DialogBody,Spinner , DialogFooter,} from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import { DRIVER_SCHEMA } from '@/utils/validations';
import { parseAddressParts } from '@/utils/addressUtils';
import Select from 'react-select';
import moment from "moment";


const LocationInput = ({ field, form, suggestions, onSearch, onSelect }) => {
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
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="pr-10"
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

const DriverEdit = () => {
    const [driverVal, setDriverVal] = useState({});
    const [alert, setAlert] = useState(null);
    const [packageDetails, setPackageDetails] = useState([]);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState({
        aadhaarImage: null,
        policeClearance: null,
        livePhoto: null,
        drivingLicenseImage: null,
        consentForm: null,
        panImage: null
    });
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [modalData, setModalData] = useState(null);
    const [isSameAddress, setIsSameAddress] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serviceAreas, setServiceAreas] = useState([]);


    const currentDate = () => {
        return (new Date()).toISOString().split('T')[0];
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
        const data = await ApiRequestUtils.get(API_ROUTES.PACKAGES_LIST);
        if (data?.success) {
            const packageData = data?.data.map(option => {
                const suffix = option.type === 'Local' ? 'hr' : option.type === 'Outstation' ? 'd' : '';
                return {
                    ...option,
                    period: `${option.period} ${suffix}`, // Append 'hr' or 'd'
                };
            });
            const intercityPackage = orderPackages(packageData.filter(val => val.type === 'Local'), 'Local');
            const outstationPackage = packageData.filter(val => { return val.type === 'Outstation' && val.period === '1 d' });
            const carWashPackage = orderPackages(packageData.filter(val => val.type === 'CarWash'), 'CarWash');
            setPackageDetails([...intercityPackage, ...outstationPackage, ...carWashPackage]);
        }
    };

    useEffect(() => {
        getPackageListDetails();
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

    const fetchItem = async (itemId) => {
        try {
            const data = await ApiRequestUtils.get(API_ROUTES.GET_DRIVERS_ADMIN + `${itemId}`);
            if (data?.data) {
                setDriverVal(data.data);
                setImagePreviews({
                    aadhaarImage: getDocumentByType(data?.data?.result?.Proofs, KYC_PROCESS.AADHAAR),
                    drivingLicenseImage: getDocumentByType(data?.data?.result?.Proofs, KYC_PROCESS.DRIVING_LICENSE),
                    policeClearance: getDocumentByType(data?.data?.result?.Proofs, KYC_PROCESS.POLICE_CLEARANCE),
                    consentForm: getDocumentByType(data?.data?.result?.Proofs, KYC_PROCESS.CONSENT_FORM),
                    livePhoto: getDocumentByType(data?.data?.result?.Proofs, KYC_PROCESS.LIVE_PHOTO),
                    panImage: getDocumentByType(data?.data?.result?.Proofs, KYC_PROCESS.PAN)
                });
            } else {
                console.error('No driver data received');
                navigate('/dashboard/vendors/account/drivers');
            }
        } catch (error) {
            console.error('Error fetching driver:', error);
            navigate('/dashboard/vendors/account/drivers');
        }
    };

    const initialValues = {
        salutation: driverVal?.result?.salutation || "",
        firstName: driverVal?.result?.firstName || "",
        fatherName: driverVal?.result?.fatherName || "",
        motherName: driverVal?.result?.motherName || "",
        dateOfBirth: driverVal?.result?.dob || "",
        age: driverVal?.result?.age || "",
        status: driverVal?.result?.status || "",
        // driverExperience: driverVal?.driverExperience || "",
        phoneNumber: driverVal?.result?.phoneNumber ? driverVal?.result?.phoneNumber.replace(/^(\+91)/, '') : "",
        license: driverVal?.result?.license || "",
        licenseType: driverVal?.result?.licenseType || "",
        licenseExpiryDate: driverVal?.result?.licenseExpiry || "",
        professionalLicense: driverVal?.result?.professionalLicense || "",
        policeClearanceCertificate: driverVal?.result?.policeCertificate || "",
        address: driverVal?.result?.address || "",
        streetName: driverVal?.result?.street || "",
        thaluk: driverVal?.result?.thaluk || "",
        district: driverVal?.result?.district || "",
        state: driverVal?.result?.state || "",
        pinCode: driverVal?.result?.pincode || "",
        reference1: driverVal?.result?.reference1 || "",
        phoneNumber1: driverVal?.result?.reference1_phone ? driverVal?.result?.reference1_phone.replace(/^(\+91)/, '') : "",
        reference2: driverVal?.result?.reference2 || "",
        phoneNumber2: driverVal?.result?.reference2_phone ? driverVal?.result?.reference2_phone.replace(/^(\+91)/, '') : "",
        transmissionType: driverVal?.result?.transmissionType || "",
        // carType: driverVal?.result?.carType || "",
        // packages: driverVal?.result?.packages || "",
        //wallet: driverVal?.result?.wallet || "",
        // prices: driverVal?.price ? driverVal?.price.filter((el) => driverVal?.result?.packages?.includes(el.packageId)) : [],
        withOwner: driverVal?.result?.Account ? "Yes" : "No",
        ownerName: driverVal?.result?.Account?.name || "",
        jobType: driverVal?.result?.jobType || "",
        source: driverVal?.result?.source || "",
        serviceType: driverVal?.result?.serviceType || "",
    };
    
    const [showBlockedReason, setShowBlockedReason] = useState(false);
const [blockedReason, setBlockedReason] = useState('');
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
                                    {["Package", "Price", "Extra Price", "Extra KM Price", "Night Charge", "Cancel Charge", "Cab Type"].map((el) => (
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
                                        {['price', 'extraPrice', 'extraKmPrice', 'nightCharge', 'cancelCharge', 'extraCabType'].map((field) => (
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
        console.log('onSubmit :', values)
        setIsSubmitting(true);
        try {
            const driverDetails = {
                salutation: values.salutation,
                firstName: values.firstName,
                fatherName: values.fatherName || "",
                motherName: values.motherName || "",
                dob: values.dateOfBirth || "",
                age: values.age || "",
                // driverExperience: values.driverExperience || "",
                status: values.status || "",...(values.status === 'BLOCKED' && { blockedReason: blockedReason }),
                phoneNumber: "+91" + values.phoneNumber,
                license: values.license,
                licenseType: values.licenseType || "",
                licenseExpiry: values.licenseExpiryDate || "",
                professionalLicense: values.professionalLicense || "No",
                policeCertificate: values.policeClearanceCertificate || "No",
                address: values.address,
                street: values.streetName || "",
                thaluk: values.thaluk,
                district: values.district,
                state: values.state,
                country: "India",
                pincode: values.pinCode || "",
                reference1: values.reference1 || "",
                reference1_phone: values.phoneNumber1 || "",
                reference2: values.reference2 || "",
                reference2_phone: values.phoneNumber2 || "",
                transmissionType: values.transmissionType,
                packages: values.packages,
                // carType: values.carType,
                //wallet: values.wallet,
                driverId: id,
                source: values.source,
                serviceType: values.serviceType,
            };
            
            let driverData = { driverDetails }
            //return;
            const data = await ApiRequestUtils.update(API_ROUTES.UPDATE_DRIVER, driverData);
            console.log('data in driver add :', data);
            if (data?.success) {
                navigate('/dashboard/vendors/account/drivers', {
                    state: {
                        driverUpdated: true,
                        driverName: data?.data?.firstName || values.firstName
                    }
                });
            } else {
                throw new Error(data?.message || 'Update failed');
            }
        } catch (error) {
            // console.error('Error updating driver:', error);
            // alert(error.message || 'Failed to update driver. Please try again.');
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
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

    const stateOptions = STATE_LIST.map(state => ({
        id: state.value,
        name: state.label
    }));

    const getDocumentByType = (value, type) => {
        return value.find(proof => proof.type === type) || "";
    };


    const handleOpenDocument = (documentUrl) => {
        window.open(documentUrl, "_blank", "noopener,noreferrer");
    };

    const DocumentUpload = ({ label, value, name, onChange, setModalData, fullDocVal, image2 }) => {
        return (
            <tr>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-600">{label}</Typography>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography
                        className={`text-xs font-semibold ${value ? "text-green-500" : "text-primary-500"}`}
                    >
                        {value ? "UPLOADED" : "NO DOCUMENTS"}
                    </Typography>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                        {moment(fullDocVal?.created_at).format("DD-MM-YYYY")}
                    </Typography>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-600">{fullDocVal?.User?.name}</Typography>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                        {value === "UPLOADED" ? moment(fullDocVal?.updated_at).format("DD-MM-YYYY") : ""}
                    </Typography>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor={name}
                            className="inline-block text-center text-white border border-gray-400 bg-primary rounded-lg px-4 py-1 cursor-pointer"
                        >
                            Update
                        </label>
                        <input
                            type="file"
                            accept="image/*, application/pdf"
                            id={name}
                            name={name}
                            onChange={onChange}
                            className="hidden"
                            multiple={name !== "livePhoto"}
                        />
                    </div>
                </td>
                <td className="py-3 px-5 border-b border-blue-gray-50">
                    {value && (
                        <Typography
                            variant="small"
                            className="font-semibold underline cursor-pointer text-primary-900"
                            onClick={() => {
                                if (label === 'Live Photo') {
                                    setModalData({
                                        image: fullDocVal?.image1
                                    })
                                }
                                else {
                                    setModalData({
                                        image: fullDocVal?.image1,

                                        image2: fullDocVal?.image2
                                    });
                                }

                                // console.log(image2)
                            }}

                        >
                            View/Download
                        </Typography>
                    )}
                </td>
            </tr>
        );
    };

    const handleImageUpload = async (e, setFieldValue, label, docId) => {
        try {
            setLoading(true);
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            const maxSize = 10 * 1024 * 1024; // 10MB
            const files = e.target.files;

            if (files.length > 2) {
                setLoading(false);
                alert("You can upload a maximum of two documents.");
                return;
            }

            const uploadedFiles = [];
            const previews = {};

            for (let i = 0; i < files.length; i++) {
                setLoading(false);
                if (!allowedTypes.includes(files[i].type)) {
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
                    previews[`image${i + 1}`] = reader.result;
                    setImagePreviews((prev) => ({
                        ...prev,
                        [label]: {
                            ...prev[label],
                            ...previews,
                        },
                    }));
                };
                reader.readAsDataURL(file);
            }

            //setFieldValue(label, uploadedFiles);

            const type = label === 'aadhaarImage' ? KYC_PROCESS.AADHAAR :
                label === 'drivingLicenseImage' ? KYC_PROCESS.DRIVING_LICENSE :
                    label === 'consentForm' ? KYC_PROCESS.CONSENT_FORM :
                        label === 'panImage' ? KYC_PROCESS.PAN : '';


            // Create FormData
            const formData = new FormData();
            formData.append("type", type);
            formData.append("driverId", driverVal?.result?.id);

            if (files[0]) {
                formData.append("image1", files[0]);
                formData.append("extImage1", files[0].name.split(".").pop());
                formData.append("fileTypeImage1", files[0].type);
            }
            if (files[1]) {
                formData.append("image2", files[1]);
                formData.append("extImage2", files[1].name.split(".").pop());
                formData.append("fileTypeImage2", files[1].type);
            }

            let data;
            if (docId) {
                setLoading(true)
                formData.append("documentId", docId);
                data = await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_PHOTO, formData);
                //console.log("Document Updated:", data);
            } else {
                setLoading(true)
                data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
                //console.log("New Document Uploaded:", data);
            }

            if (data?.success) {
                setLoading(false);
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: {
                        image1: data?.data?.image1 || prev[label]?.image1,
                        image2: data?.data?.image2 || prev[label]?.image2,
                        id: data?.data?.id,
                    },
                }));
            }
            else {
                setLoading(false);
                setAlert({
                    message: data?.message || "Failed to upload document. Please try again.",
                    color: "red",
                });
                setTimeout(() => setAlert(null), 5000);
            }
        } catch (err) {
            console.error("Error during image upload:", err);
        }
    };
    const handlePhotoUpload = async (e, setFieldValue, label, docId) => {
        try {
            setLoading(true);
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            const maxSize = 10 * 1024 * 1024; // 10MB
            const file = e.target.files[0];

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
                    [label]: reader.result, // Update the specific preview
                }));
            };
            reader.readAsDataURL(file);

            const type = label === 'livePhoto' ? KYC_PROCESS.LIVE_PHOTO : '';
            const formData = new FormData();

            formData.append("driverId", driverVal?.result?.id);
            formData.append('image1', file);
            formData.append('extImage1', file.name.split('.')[1]);
            formData.append('fileTypeImage1', file.type);
            formData.append('type', type);
            formData.append("documentId", docId);
            let data;
            if (docId) {
                data = await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_PHOTO, formData);
                // console.log("Document Updated:", data);
            }
            else {
                data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
                // console.log("New Document Uploaded:", data);
            }

            if (data?.success) {
                setLoading(false);
                setImagePreviews((prev) => ({
                    ...prev,
                    [label]: {
                        image1: data?.data?.image1 || prev[label]?.image1,
                        id: data?.data?.id,
                    },
                }));
            }
            else {
                setLoading(false);
                setAlert({
                    message: data?.message || "Failed to upload photo. Please try again.",
                    color: "red",
                });
                setTimeout(() => setAlert(null), 5000);
            }


            // console.log('DATA IN DOC UPDATE :', data);
        }
        catch (err) {
            setAlert({
                message: "An error occurred while uploading the photo.",
                color: "red",
            });
            setTimeout(() => setAlert(null), 5000);
        }
    }

    const parseAddress = (address, addressComponents = []) => parseAddressParts({
        addressText: address,
        addressComponents,
    });


    const extractPincode = (addressComponents) => {
        const pincodeObj = addressComponents.find((comp) =>
            comp.types.includes("postal_code")
        );
        return pincodeObj ? pincodeObj.long_name : "";
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
            setFieldValue("streetName", parsedAddress.street);
            setFieldValue("thaluk", parsedAddress.taluk);
            setFieldValue("district", parsedAddress.district);
            setFieldValue("state", parsedAddress.state);
            setFieldValue("pinCode", parsedAddress.pincode);
        }
    };

    return (
        <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-7xl">
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <Spinner className="h-12 w-12" />
                </div>
            ) : (
                <>
            {alert && (
                <div className="mb-2">
                    <Alert
                        color={alert.color}
                        className="py-3 px-6 rounded-xl"
                    >
                        {alert.message}
                    </Alert>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Update Driver</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={DRIVER_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, errors, dirty, isValid, handleChange, setFieldValue }) => (
                    <Form className="space-y-4">
                        <div className='grid grid-cols-1 gap-7'>
                            <div className='grid grid-cols-2 gap-7'>
                            <div>
                                <label htmlFor="salutation" className="text-sm font-medium text-gray-700">Salutation</label>
                                <Field as="select" name="salutation" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select salutation</option>
                                    <option value="Mr">Mr</option>
                                    <option value="Mrs">Mrs</option>
                                    <option value="Miss">Miss</option>
                                    <option value="Others">Others</option>
                                </Field>
                                <ErrorMessage name="salutation" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">Full Name</label>
                                <Field type="text" name="firstName" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <label htmlFor="fatherName" className="text-sm font-medium text-gray-700">Father / Guardian Name</label>
                                <Field type="text" name="fatherName" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="fatherName" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Date of Birth</label>
                                <Field type="date" name="dateOfBirth" className="p-2 w-full rounded-xl border-2 border-gray-300" value={values.dateOfBirth} max={currentDate()}
                                    onChange={(e) => {
                                        setFieldValue('dateOfBirth', e.target.value);

                                        if (e.target.value) {
                                            const today = new Date();
                                            const birthDate = new Date(e.target.value);
                                            let age = today.getFullYear() - birthDate.getFullYear();
                                            const monthDiff = today.getMonth() - birthDate.getMonth();

                                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                                age--;
                                            }
                                            setFieldValue('age', age);
                                        } else {
                                            setFieldValue('age', '');
                                        }
                                    }}
                                />
                                <ErrorMessage name="dateOfBirth" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="age" className="text-sm font-medium text-gray-700">Age</label>
                                <Field type="text" name="age" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" disabled />
                                <ErrorMessage name="age" component="div" className="text-red-500 text-sm my-1" />
                            </div>
                           <div>
                                <label htmlFor="status" className="text-sm font-medium text-gray-700">Driver Status</label>
                                <Field as="select" name="status" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                 onChange={(e) => {
                                        setFieldValue('status', e.target.value);
                                          if (e.target.value === 'BLOCKED') {
                                               setShowBlockedReason(true);
                                           }
                                           else {
                                           setBlockedReason(''); 
                                        }
                                       }}>                   
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
                                required
                             />
                               </div>
                                 )}

                            </div>
                        
                           

                            
                            {/* <div>
                                <label htmlFor="driverExperience" className="text-sm font-medium text-gray-700">Driver Experience</label>
                                <Field type="text" name="driverExperience" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="driverExperience" component="div" className="text-red-500 text-sm my-1" />
                            </div> */}
                            <div>
                                <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                <Field type="tel" name="phoneNumber" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="license" className="text-sm font-medium text-gray-700">License Number</label>
                                <Field type="text" name="license" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={16} />
                                <ErrorMessage name="license" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">License Type</p>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="licenseType" value="type1" className="form-radio" />
                                        <span className="ml-2">White Board</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="licenseType" value="type2" className="form-radio" />
                                        <span className="ml-2">Yellow Board</span>
                                    </label>
                                </div>
                                <ErrorMessage name="mode" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="licenseExpiryDate" className="text-sm font-medium text-gray-700">License Expiry Date</label>
                                <Field type="date" name="licenseExpiryDate" className="p-2 w-full rounded-xl border-2 border-gray-300"  ></Field>
                                <ErrorMessage name="licenseExpiryDate" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Preference</p>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="transmissionType" value="Automatic" className="form-radio" />
                                        <span className="ml-2">Automatic</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field type="radio" name="transmissionType" value="Manual" className="form-radio" />
                                        <span className="ml-2">Manual</span>
                                    </label>
                                </div>
                                <ErrorMessage name="transmissionType" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                <Field as="select" name="source" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select Source</option>
                                    <option value="Walk In">Walk In</option>
                                    <option value="Mobile App">Mobile App</option>
                                    <option value="Website">Website</option>
                                    <option value="Call">Call</option>
                                </Field>
                                <ErrorMessage name="source" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Service Type</p>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <Field
                                            type="radio"
                                            name="serviceType"
                                            value="DRIVER"
                                            className="form-radio"
                                        />
                                        <span className="ml-2">Acting Driver</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field
                                            type="radio"
                                            name="serviceType"
                                            value="DRIVER_WITH_CAB"
                                            className="form-radio"
                                        />
                                        <span className="ml-2">Driver With Vehicle</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <Field
                                            type="radio"
                                            name="serviceType"
                                            value="OWNER"
                                            className="form-radio"
                                        />
                                        <span className="ml-2">OWNER</span>
                                    </label>
                                </div>
                                <ErrorMessage
                                    name="serviceType"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="address" className="text-sm font-medium text-gray-700">Current address</label>
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
                        </div>

                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="sameAddress"
                                checked={isSameAddress}
                                onChange={(e) => {
                                    setIsSameAddress(e.target.checked);
                                    if (e.target.checked) {
                                        const currentAddress = parseAddress(values.address);

                                        setFieldValue("streetName", currentAddress.street);
                                        setFieldValue("thaluk", currentAddress.taluk);
                                        setFieldValue("district", currentAddress.district);
                                        setFieldValue("state", currentAddress.state);
                                        setFieldValue("pinCode", currentAddress.pincode);
                                    } else {
                                        setFieldValue("streetName", "");
                                        setFieldValue("thaluk", "");
                                        setFieldValue("district", "");
                                        setFieldValue("state", "");
                                        setFieldValue("pinCode", "");
                                    }
                                }}
                                className="mr-2"
                            />
                            <label htmlFor="sameAddress" className="text-sm text-gray-700">
                                Same as Current Address
                            </label>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-800 mb-5">Permanent Address</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="streetName" className="text-sm font-medium text-gray-700">Street Name</label>
                                    <Field type="text" name="streetName" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="streetName" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="thaluk" className="text-sm font-medium text-gray-700">
                                        Thaluk
                                    </label>
                                    <select
                                        id="thaluk"
                                        name="thaluk"
                                        value={values.thaluk}
                                        onChange={(e) => setFieldValue('thaluk', e.target.value)}
                                        className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                                    >
                                        <option value="" disabled>Select Thaluk</option>
                                        {thalukOptions.map((thaluk) => (
                                            <option key={thaluk.id} value={thaluk.id}>
                                                {thaluk.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMessage name="thaluk" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="district" className="text-sm font-medium text-gray-700">
                                        District
                                    </label>
                                    <select
                                        id="district"
                                        name="district"
                                        value={values.district}
                                        onChange={(e) => setFieldValue('district', e.target.value)}
                                        className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                                    >
                                        <option value="" disabled>Select District</option>
                                        {districtOptions.map((district) => (
                                            <option key={district.id} value={district.id}>
                                                {district.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMessage name="district" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="state" className="text-sm font-medium text-gray-700">
                                        State
                                    </label>
                                    <select
                                        id="state"
                                        name="state"
                                        value={values.state}
                                        onChange={(e) => setFieldValue('state', e.target.value)}
                                        className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                                    >
                                        <option value="" disabled>Select State</option>
                                        {stateOptions.map((state) => (
                                            <option key={state.id} value={state.id}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMessage name="state" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="pinCode" className="text-sm font-medium text-gray-700">Pincode</label>
                                    <Field type="text" name="pinCode" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="pinCode" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="reference1" className="text-sm font-medium text-gray-700">Reference 1</label>
                                    <Field type="text" name="reference1" className="p-2 w-full rounded-md border-2 border-gray-300" />
                                    <ErrorMessage name="reference1" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber1" className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Field type="tel" name="phoneNumber1" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                    <ErrorMessage name="phoneNumber1" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="reference2" className="text-sm font-medium text-gray-700">Reference 2</label>
                                    <Field type="text" name="reference2" className="p-2 w-full rounded-md border-2 border-gray-300" />
                                    <ErrorMessage name="reference2" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber2" className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Field type="tel" name="phoneNumber2" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                    <ErrorMessage name="phoneNumber2" component="div" className="text-red-500 text-sm" />
                                </div>

                                {/* <div>
                                    <label htmlFor="packages" className="text-sm font-medium text-gray-700">Package</label>
                                    <Multiselect
                                        options={packageDetails}
                                        displayValue="period"
                                        selectedValues={packageDetails.filter(option => values.packages.includes(option.id))}
                                        onSelect={(selectedList) => {
                                            setFieldValue("packages", selectedList.map(item => item.id));
                                            const newPrices = selectedList.filter((el) => !values.packages.includes(el.id)).map(item => ({
                                                packageId: item.id,
                                                period: item.period,
                                                price: item.price,
                                                extraPrice: item.extra_price,
                                                extraKmPrice: item.extraKmPrice,
                                                nightCharge: item.nightCharge,
                                                cancelCharge: item.cancelCharge,
                                                extraCabType: item.extraCabType
                                            }));
                                            setFieldValue("prices", [...values.prices, ...newPrices]);
                                        }}
                                        onRemove={(selectedList) => {
                                            setFieldValue("packages", selectedList.map(item => item.id));
                                            setFieldValue("prices", values.prices.filter(price =>
                                                selectedList.some(item => item.id === price.packageId)
                                            ));
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
                                </div> */}
                            </div>
                            <div className="mt-6">
                                <div className="flex flex-row justify-between px-2 mb-2">
                                    <Typography variant="h3" className="text-2xl font-bold text-blue-gray-800">
                                        Documents
                                    </Typography>
                                </div>
                                <Card>
                                    <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                                        <table className="w-full min-w-[640px] table-auto">
                                            <thead>
                                                <tr>
                                                    {["Type", "KYC Status", "Created At", "Verfied By", "Verified At", "Action", "View Details"].map((el, index) => (
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
                                                    label="Aadhaar Image"
                                                    value={imagePreviews.aadhaarImage?.image1}
                                                    name="aadhaarImage"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "aadhaarImage", imagePreviews?.aadhaarImage?.id)}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.aadhaarImage}
                                                    image2={imagePreviews.aadhaarImage?.image2}
                                                />
                                                {/* <DocumentUpload
                                                label="Police Clearance Certificate"
                                                value={imagePreviews.policeClearance?.image1}
                                                name="policeClearance"
                                                onChange={(e) => handleImageUpload(e, setFieldValue, "policeClearance",imagePreviews?.policeClearance?.id)}
                                                setModalData={setModalData}
                                                fullDocVal={imagePreviews.policeClearance}
                                            /> */}
                                                <DocumentUpload
                                                    label="Driving License Image"
                                                    value={imagePreviews.drivingLicenseImage?.image1}
                                                    name="drivingLicenseImage"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "drivingLicenseImage", imagePreviews?.drivingLicenseImage?.id)}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.drivingLicenseImage}
                                                    image2={imagePreviews.drivingLicenseImage?.image2}
                                                />
                                                {/* <DocumentUpload
                                                    label="Pan Image"
                                                    value={imagePreviews.panImage?.image1}
                                                    name="panImage"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "panImage", imagePreviews?.panImage?.id)}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.panImage}
                                                    image2={imagePreviews.panImage?.image2}
                                                /> */}
                                                {/* <DocumentUpload
                                                    label="Consent Form Image"
                                                    value={imagePreviews.consentForm?.image1}
                                                    name="consentForm"
                                                    onChange={(e) => handleImageUpload(e, setFieldValue, "consentForm", imagePreviews?.consentForm?.id)}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.consentForm}
                                                /> */}
                                                <DocumentUpload
                                                    label="Live Photo"
                                                    value={imagePreviews.livePhoto?.image1}
                                                    name="livePhoto"
                                                    onChange={(e) => handlePhotoUpload(e, setFieldValue, "livePhoto", imagePreviews?.livePhoto?.id)}
                                                    setModalData={setModalData}
                                                    fullDocVal={imagePreviews.livePhoto}
                                                />
                                            </tbody>
                                        </table>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                        {/* {values.packages.length > 0 && (
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
                            </div>
                        )} */}
                        <div className='grid grid-cols-2 gap-7'>
                            <Button
                                fullWidth
                                onClick={() => navigate(`/dashboard/vendors/account/drivers`)}
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
                                {modalData.image.endsWith(".pdf") ? (
                                    <iframe
                                        src={modalData.image}
                                        className="w-full rounded-lg shadow-md"
                                        style={{ height: "45vh" }}
                                    />
                                ) : (
                                    <img
                                        src={modalData.image}
                                        alt="Document"
                                        className="rounded-lg shadow-md"
                                        style={{ width: "45%", height: "45vh", objectFit: "contain" }}
                                    />
                                )}
                                {modalData.image2 && (
                                    modalData.image2.toLowerCase().endsWith(".pdf") ? (
                                        <iframe
                                            src={modalData.image2}
                                            className="rounded-lg shadow-md"
                                            style={{ height: "45vh", width: "45%" }}
                                        />
                                    ) : (
                                        <img
                                            src={modalData.image2}
                                            alt="Document"
                                            className="rounded-lg shadow-md"
                                            style={{ height: "45vh", width: "45%", objectFit: "contain" }}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                        <div className="flex justify-center mt-4">
                            <a
                                href={modalData.image}
                                download="doucument.pdf"
                                target='_blank'
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
                    </DialogBody>
                </Dialog>
            )}
            </>)}
        </div>
    );
};

export default DriverEdit;
