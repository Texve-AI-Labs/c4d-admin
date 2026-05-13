import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Button, Alert, Input, List, ListItem, Typography } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';

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

const ParcelCabEdit = () => {
    const [parcelCabVal, setParcelCabVal] = useState({});
    const [alert, setAlert] = useState(null);
    const [ownerAddressSuggestions, setOwnerAddressSuggestions] = useState([]);
    const [serviceAreas, setServiceAreas] = useState([]);
    const [zones, setZones] = useState([]);
    const [serviceAreaFetchError, setServiceAreaFetchError] = useState('');
    const [zoneFetchError, setZoneFetchError] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchItem(id);
        fetchServiceAreas();
        fetchZones();
    }, [id]);

    const fetchItem = async (itemId) => {
        try {
            const data = await ApiRequestUtils.get(API_ROUTES.GET_PARCEL_CAB_BY_ID + `${itemId}`);
            if (data?.data) {
                setParcelCabVal(data.data);
            } else {
                console.error('No parcel cab data received');
                navigate('/dashboard/vendors/account/parcel');
            }
        } catch (error) {
            console.error('Error fetching parcel cab:', error);
            navigate('/dashboard/vendors/account/parcel');
        }
    };

    const fetchServiceAreas = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
                type: 'Service Area',
            });
            const allAreas = Array.isArray(response?.data) ? response.data : [];
            const filteredAreas = allAreas.filter((area) => area.type === 'Service Area');
            setServiceAreas(filteredAreas);
            setServiceAreaFetchError('');
        } catch (error) {
            console.error('Error fetching service areas:', error);
            setServiceAreaFetchError('Failed to fetch service areas. Please try again.');
        }
    };

    const fetchZones = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
                type: 'Zone',
            });
            const allZones = Array.isArray(response?.data) ? response.data : [];
            const filteredZones = allZones.filter((zone) => zone.type === 'Zone' && zone.description === 'Zone');
            setZones(filteredZones);
            setZoneFetchError('');
        } catch (error) {
            console.error('Error fetching zones:', error);
            setZoneFetchError('Failed to fetch zones. Please try again.');
        }
    };

    const SERVICE_AREA_OPTIONS = serviceAreas.map((area) => ({
        value: area.name,
        label: area.name,
        id: area.id,
    }));

    const ZONE_OPTIONS = zones.map((zone) => ({
        value: zone.name,
        label: zone.name,
        id: zone.id,
        parentId: zone.parent_id,
    }));

    const initialValues = {
        accountId: parcelCabVal?.result?.Account?.id || '',
        name: parcelCabVal?.result?.name || '',
        ownerName: parcelCabVal?.result?.Account ? parcelCabVal?.result?.Account?.name : '',
        vehicleNumber: parcelCabVal?.result?.vehicleNumber || '',
        address: parcelCabVal?.result?.curAddress || '',
        insurance: parcelCabVal?.result?.insurance || '',
        autoType: 'BIKE',
        seater: parcelCabVal?.result?.seater || '3',
        modelYear: parcelCabVal?.result?.modelYear || '',
        serviceArea: parcelCabVal?.result?.serviceArea || parcelCabVal?.result?.subZone?.parent?.name || '',
        subZoneId: parcelCabVal?.result?.subZoneId || parcelCabVal?.result?.subZone?.id || '',
        zoneDescription: parcelCabVal?.result?.subZone?.name || parcelCabVal?.result?.zoneDescription || parcelCabVal?.result?.zone || '',
    };

    const searchLocations = async (query, type) => {
        if (query.length > 2) {
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
                address: query,
            });
            if (data?.success && data?.data) {
                setOwnerAddressSuggestions(data?.data);
            }
        } else {
            setOwnerAddressSuggestions([]);
        }
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            if (!values.serviceArea) {
                setAlert({ message: 'Please select service area', color: 'red' });
                setIsSubmitting(false);
                setSubmitting(false);
                return;
            }
            if (!values.zoneDescription) {
                setAlert({ message: 'Please select zone', color: 'red' });
                setIsSubmitting(false);
                setSubmitting(false);
                return;
            }

            const payload = {
                accountId: values.accountId,
                name: values.name,
                company: values.ownerName,
                vehicleNumber: values.vehicleNumber,
                curAddress: values.address,
                insurance: values.insurance,
                vehicleType: 'BIKE',
                seater: values.seater,
                modelYear: values.modelYear,
                serviceArea: values.serviceArea,
                subZoneId: values.subZoneId,
                parcelId: parcelCabVal?.result?.id,
            };
            
            const resp = await ApiRequestUtils.update(API_ROUTES.UPDATE_PARCEL_CAB, payload);
            
            if (resp?.success) {
                setAlert({ message: 'Parcel Cab Updated Successfully', color: 'green' });
                setTimeout(() => {
                    navigate(`/dashboard/vendors/account/parcel/details/${values.accountId}`);
                }, 2000);
            } else {
                setAlert({ message: resp?.message || 'Failed to update parcel cab', color: 'red' });
            }
        } catch (error) {
            console.error('Error updating parcel cab:', error);
            setAlert({ message: 'Something went wrong!', color: 'red' });
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const currentDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    return (
        <div className="p-4 mx-auto">
            {alert && (
                <div className="mb-2">
                    <Alert color={alert.color} className="py-3 px-6 rounded-xl">
                        {alert.message}
                    </Alert>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Update Parcel Bike</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, errors, dirty, isValid, handleChange, setFieldValue }) => {
                    const selectedArea = serviceAreas.find((area) => area.name === values.serviceArea);
                    const filteredZoneOptions = ZONE_OPTIONS.filter(
                        (zone) => !selectedArea || !zone.parentId || zone.parentId === selectedArea.id
                    );
                    return (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Vehicle Name */}
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
                                <label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
                                    Bike Number
                                </label>
                                <Field
                                    type="text"
                                    name="vehicleNumber"
                                    className="p-2 w-full rounded-md border-gray-300"
                                    maxLength={10}
                                />
                                <ErrorMessage name="vehicleNumber" component="div" className="text-red-500 text-sm" />
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
                            <div className='hidden'>
                                <label className="text-sm font-medium text-gray-700">Bike Type</label>
                                <div className="space-x-4 mt-1">
                                    {['BIKE'].map((type) => (
                                        <label key={type} className="inline-flex items-center">
                                            <Field
                                                type="radio"
                                                name="autoType"
                                                value={type}
                                                className="mr-2"
                                                onChange={handleChange}
                                            />
                                            <span>{type}</span>
                                        </label>
                                    ))}
                                </div>
                                <ErrorMessage name="autoType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="seater" className="text-sm font-medium text-gray-700">
                                    Seater
                                </label>
                                <Field name="seater" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">
                                    Year of Model
                                </label>
                                <Field name="modelYear" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="serviceArea" className="text-sm font-medium text-gray-700">
                                    Service Area
                                </label>
                                <Select
                                    options={SERVICE_AREA_OPTIONS}
                                    value={SERVICE_AREA_OPTIONS.find((opt) => opt.value === values.serviceArea) || null}
                                    onChange={(opt) => {
                                        const selected = opt?.value || '';
                                        setFieldValue('serviceArea', selected);
                                        setFieldValue('subZoneId', '');
                                        setFieldValue('zoneDescription', '');
                                    }}
                                    placeholder="Select Service Area"
                                    className="w-full"
                                    name="serviceArea"
                                />
                                <ErrorMessage name="serviceArea" component="div" className="text-red-500 text-sm" />
                                {serviceAreaFetchError ? (
                                    <Typography variant="small" className="text-red-500 mt-1">
                                        {serviceAreaFetchError}
                                    </Typography>
                                ) : null}
                            </div>
                            <div>
                                <label htmlFor="zoneDescription" className="text-sm font-medium text-gray-700">
                                    Zone (Type: Zone / Description: Zone)
                                </label>
                                <Select
                                    options={filteredZoneOptions}
                                    value={filteredZoneOptions.find((opt) => opt.value === values.zoneDescription) || null}
                                    onChange={(opt) => {
                                        setFieldValue('zoneDescription', opt?.value || '');
                                        setFieldValue('subZoneId', opt?.id || '');
                                    }}
                                    placeholder="Select Zone"
                                    className="w-full"
                                    name="zoneDescription"
                                    isDisabled={!values.serviceArea}
                                />
                                <ErrorMessage name="zoneDescription" component="div" className="text-red-500 text-sm" />
                                {zoneFetchError ? (
                                    <Typography variant="small" className="text-red-500 mt-1">
                                        {zoneFetchError}
                                    </Typography>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex flex-row">
                            <Button
                                fullWidth
                                onClick={() => navigate('/dashboard/vendors/account/parcel/list')}
                                className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                color="black"
                                onClick={handleSubmit}
                                className="my-6 mx-2 bg-[#1A73E8]"
                            >
                                Update
                            </Button>
                        </div>
                    </Form>
                    );
                }}
            </Formik>
        </div>
    );
};

export default ParcelCabEdit;
