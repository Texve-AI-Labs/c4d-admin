import React, { useEffect, useRef, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Button, Typography } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import MasterPriceLog from './MasterPriceLog';
import RidesPeakHourTableEdit from './RidesPeakHourTableEdit';

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

const CATEGORY_OPTIONS = [
    { value: 'AUTO_SAVER', label: 'Auto Saver' },
    { value: 'AUTO_PLUS', label: 'Auto Plus' },
];

const CAR_TYPE_OPTIONS = [
    { value: 'AUTO', label: 'Auto' },
];

const numberField = (label) => Yup.number()
    .required(`${label} is required`)
    .min(0, `${label} must be greater than or equal to 0`);

const categoryPricingSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    carTypes: Yup.array().of(Yup.string().required('Car Type is required')).min(1, 'Car Type is required').required('Car Type is required'),
    pricing: Yup.object().shape({
        baseKm: numberField('Base Km'),
        baseFare: numberField('Base Fare'),
        kilometerPrice: numberField('Kilometer Price'),
        minCharge: numberField('Min Charge'),
        extraPrice: numberField('Extra Price'),
        extraKmPrice: numberField('Extra Km Price'),
        nightCharge: numberField('Night Charge'),
        nightHoursFrom: Yup.string().required('Night Hours From is required'),
        nightHoursTo: Yup.string().required('Night Hours To is required'),
        waitingMins: numberField('Waiting Minutes'),
        waitingCharge: numberField('Waiting Charge'),
        freeExtraMinutes: numberField('Free Extra Minutes'),
        additionalMinCharge: numberField('Additional Min Charge'),
        surChargePercentage: numberField('Surcharge Percentage'),
        peakHours: Yup.array().of(
            Yup.object().shape({
                start: Yup.string().required('Start time is required'),
                end: Yup.string().required('End time is required'),
                kilometerPrice: numberField('Peak Kilometer Price'),
            })
        ),
    }).required('Pricing is required'),
});

const getCategoryLabel = (value) => CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value;
const getCarTypeLabel = (value) => CAR_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;

const PRICE_SCHEMA = Yup.object().shape({
    serviceType: Yup.string().required('Service Type is required'),
    type: Yup.string().required('Type is required'),
    zone: Yup.string().required('Zone is required'),
    status: Yup.string().required('Status is required'),
    categoryPricings: Yup.array()
        .of(categoryPricingSchema)
        .min(1, 'At least one category pricing is required')
        .test('unique-category-car-types', function (items = []) {
            const seen = new Set();

            for (const item of items) {
                if (!item?.category || !Array.isArray(item?.carTypes)) continue;

                for (const carType of item.carTypes) {
                    const key = `${item.category}:${carType}`;
                    if (seen.has(key)) {
                        return this.createError({ message: `${getCategoryLabel(item.category)} + ${getCarTypeLabel(carType)} already exists` });
                    }
                    seen.add(key);
                }
            }

            return true;
        })
        .required('Category pricing is required'),
});

const emptyCategoryPricing = {
    category: '',
    carTypes: [],
    pricing: {
        baseKm: '',
        baseFare: '',
        kilometerPrice: '',
        minCharge: '',
        extraPrice: '',
        extraKmPrice: '',
        nightCharge: '',
        nightHoursFrom: '',
        nightHoursTo: '',
        waitingMins: '',
        waitingCharge: '',
        freeExtraMinutes: '',
        additionalMinCharge: '',
        surChargePercentage: 0,
        peakHours: [],
    },
};

const pricingNumberFields = [
    ['Base Km', 'baseKm'],
    ['Base Fare', 'baseFare'],
    ['Kilometer Price', 'kilometerPrice'],
    ['Min Charge', 'minCharge'],
    ['Extra Price', 'extraPrice'],
    ['Extra Km Price', 'extraKmPrice'],
    ['Night Charge', 'nightCharge'],
    ['Waiting Minutes', 'waitingMins'],
    ['Waiting Charge', 'waitingCharge'],
    ['Free Extra Minutes', 'freeExtraMinutes'],
    ['Additional Min Charge', 'additionalMinCharge'],
    ['Surcharge Percentage', 'surChargePercentage'],
];

const cloneCategoryPricing = () => JSON.parse(JSON.stringify(emptyCategoryPricing));
const toNumber = (value) => Number(value || 0);
const toTimeValue = (timeString) => timeString ? String(timeString).slice(0, 5) : '';
const FormLevelError = ({ error }) => (
    typeof error === 'string' ? <div className="text-red-500 text-sm">{error}</div> : null
);

const parseMaybeJson = (value, fallback) => {
    if (Array.isArray(value) || (value && typeof value === 'object')) return value;
    if (typeof value !== 'string') return fallback;

    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
};

const normalizePricing = (pricing = {}) => ({
    baseKm: pricing.baseKm ?? '',
    baseFare: pricing.baseFare ?? '',
    kilometerPrice: pricing.kilometerPrice ?? '',
    minCharge: pricing.minCharge ?? '',
    extraPrice: pricing.extraPrice ?? '',
    extraKmPrice: pricing.extraKmPrice ?? '',
    nightCharge: pricing.nightCharge ?? '',
    nightHoursFrom: toTimeValue(pricing.nightHoursFrom),
    nightHoursTo: toTimeValue(pricing.nightHoursTo),
    waitingMins: Utils.convertTimeFormatToMinutes(pricing.waitingMins) ?? '',
    waitingCharge: pricing.waitingCharge ?? '',
    freeExtraMinutes: pricing.freeExtraMinutes ?? '',
    additionalMinCharge: pricing.additionalMinCharge ?? '',
    surChargePercentage: pricing.surChargePercentage ?? 0,
    peakHours: Array.isArray(pricing.peakHours) ? pricing.peakHours : [],
});

const normalizeCategoryPricings = (priceData = {}) => {
    if (Array.isArray(priceData.categoryPricings) && priceData.categoryPricings.length > 0) {
        return priceData.categoryPricings.map((item) => ({
            category: item.category || '',
            carTypes: parseMaybeJson(item.carTypes, []),
            pricing: normalizePricing(parseMaybeJson(item.pricing, {})),
        }));
    }

    if (priceData.category || priceData.pricing) {
        return [{
            category: priceData.category || '',
            carTypes: parseMaybeJson(priceData.carTypes, []),
            pricing: normalizePricing(parseMaybeJson(priceData.pricing, {})),
        }];
    }

    return [cloneCategoryPricing()];
};

const buildCategoryPricingsPayload = (categoryPricings) => categoryPricings.map((categoryPricing) => ({
    category: categoryPricing.category,
    carTypes: categoryPricing.carTypes,
    pricing: {
        baseKm: toNumber(categoryPricing.pricing.baseKm),
        baseFare: toNumber(categoryPricing.pricing.baseFare),
        kilometerPrice: toNumber(categoryPricing.pricing.kilometerPrice),
        minCharge: toNumber(categoryPricing.pricing.minCharge),
        extraPrice: toNumber(categoryPricing.pricing.extraPrice),
        extraKmPrice: toNumber(categoryPricing.pricing.extraKmPrice),
        nightCharge: toNumber(categoryPricing.pricing.nightCharge),
        nightHoursFrom: categoryPricing.pricing.nightHoursFrom,
        nightHoursTo: categoryPricing.pricing.nightHoursTo,
        waitingMins: Utils.convertMinutesToTimeFormat(categoryPricing.pricing.waitingMins),
        waitingCharge: toNumber(categoryPricing.pricing.waitingCharge),
        freeExtraMinutes: toNumber(categoryPricing.pricing.freeExtraMinutes),
        additionalMinCharge: toNumber(categoryPricing.pricing.additionalMinCharge),
        surChargePercentage: toNumber(categoryPricing.pricing.surChargePercentage),
        peakHours: categoryPricing.pricing.peakHours.map((peakHour) => ({
            start: peakHour.start,
            end: peakHour.end,
            kilometerPrice: toNumber(peakHour.kilometerPrice),
        })),
    },
}));

const buildAutoPackagePayload = (values, packageId) => {
    return {
        packageId: Number(packageId),
        serviceType: values.serviceType,
        type: values.type,
        zone: values.zone,
        status: values.status === 'ACTIVE' ? 1 : 0,
        categoryPricings: buildCategoryPricingsPayload(values.categoryPricings),
    };
};

const AutoMasterPriceEdit = () => {
    const [initialValues, setInitialValues] = useState(null);
    const initialValuesRef = useRef(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) fetchPriceDetails(id);
    }, [id]);

    const fetchPriceDetails = async (packageId) => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${packageId}`);
            if (data?.success) {
                const priceData = data.data || {};
                const values = {
                    serviceType: priceData.serviceType || 'AUTO',
                    type: priceData.type || 'Auto',
                    zone: priceData.zone || '',
                    status: priceData.status === 'ACTIVE' || Number(priceData.status) === 1 ? 'ACTIVE' : 'INACTIVE',
                    categoryPricings: normalizeCategoryPricings(priceData),
                };

                initialValuesRef.current = values;
                setInitialValues(values);
            }
        } catch (error) {
            console.error('Error fetching auto price details:', error);
        }
    };

    const hasFormChanged = (values) => JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);

    const onSubmit = async (values) => {
        try {
            const reqBody = buildAutoPackagePayload(values, id);

            const response = await ApiRequestUtils.post(API_ROUTES.AUTO_PRICE_EDIT, reqBody);
            if (response?.success) {
                navigate('/dashboard/finance/master-price');
            }
        } catch (error) {
            console.error('Error updating auto price details:', error?.response?.data || error);
        }
    };

    return (
        <div className="p-4 mx-auto bg-white">
            <h2 className="text-2xl font-bold mb-4">Auto Pricing Edit</h2>
            <Formik initialValues={initialValues} validationSchema={PRICE_SCHEMA} onSubmit={onSubmit} enableReinitialize>
                {({ handleSubmit, setFieldValue, isValid, values, errors }) => (
                    <Form className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Service Type</label>
                                <Field type="text" name="serviceType" disabled className="p-2 w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm" />
                                <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Type</label>
                                <Field type="text" name="type" disabled className="p-2 w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm" />
                                <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Field type="text" name="zone" disabled className="p-2 w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm" />
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Select
                                    options={STATUS_OPTIONS}
                                    value={STATUS_OPTIONS.find((option) => option.value === values?.status) || null}
                                    onChange={(selectedOption) => setFieldValue('status', selectedOption?.value || '')}
                                    placeholder="Select Status"
                                    className="w-full"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                        </div>

                        <FieldArray name="categoryPricings">
                            {({ push, remove }) => (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-lg font-semibold">Category Pricings</Typography>
                                        <Button type="button" className="bg-black text-white" onClick={() => push(cloneCategoryPricing())}>
                                            Add Category
                                        </Button>
                                    </div>
                                    <FormLevelError error={errors.categoryPricings} />

                                    {values?.categoryPricings?.map((categoryPricing, index) => (
                                        <div key={index} className="border border-gray-300 rounded-lg p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Typography className="font-semibold">Category Pricing</Typography>
                                                {values.categoryPricings.length > 1 ? (
                                                    <Button type="button" className="bg-red-500 text-white" onClick={() => remove(index)}>
                                                        Remove
                                                    </Button>
                                                ) : null}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Category</label>
                                                    <Select
                                                        options={CATEGORY_OPTIONS}
                                                        value={CATEGORY_OPTIONS.find((option) => option.value === categoryPricing.category) || null}
                                                        onChange={(selectedOption) => setFieldValue(`categoryPricings.${index}.category`, selectedOption?.value || '')}
                                                        placeholder="Select Category"
                                                        className="w-full"
                                                    />
                                                    <ErrorMessage name={`categoryPricings.${index}.category`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Car Types</label>
                                                    <Select
                                                        isMulti
                                                        options={CAR_TYPE_OPTIONS}
                                                        value={CAR_TYPE_OPTIONS.filter((option) => categoryPricing.carTypes.includes(option.value))}
                                                        onChange={(selectedOptions) => setFieldValue(`categoryPricings.${index}.carTypes`, selectedOptions ? selectedOptions.map((option) => option.value) : [])}
                                                        placeholder="Select Car Types"
                                                        className="w-full"
                                                    />
                                                    <ErrorMessage name={`categoryPricings.${index}.carTypes`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                {pricingNumberFields.map(([label, name]) => (
                                                    <div key={name}>
                                                        <label className="text-sm font-medium text-gray-700">{label}</label>
                                                        <Field type="number" name={`categoryPricings.${index}.pricing.${name}`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                        <ErrorMessage name={`categoryPricings.${index}.pricing.${name}`} component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Night Hours</label>
                                                    <div className="flex items-center">
                                                        <Field type="time" name={`categoryPricings.${index}.pricing.nightHoursFrom`} className="p-2 w-full rounded-l-md border-2 border-gray-300 shadow-sm" />
                                                        <span className="px-3 py-2 bg-gray-100 border-t border-b border-gray-300">to</span>
                                                        <Field type="time" name={`categoryPricings.${index}.pricing.nightHoursTo`} className="p-2 w-full rounded-r-md border-2 border-gray-300 shadow-sm" />
                                                    </div>
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.nightHoursFrom`} component="div" className="text-red-500 text-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.nightHoursTo`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                            </div>
                                            <RidesPeakHourTableEdit
                                                initialPriceData={categoryPricing.pricing.peakHours}
                                                onUpdate={(data) => setFieldValue(`categoryPricings.${index}.pricing.peakHours`, data)}
                                                title="Peak Hours Table"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </FieldArray>

                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                                Cancel
                            </Button>
                            <Button fullWidth color="blue" onClick={handleSubmit} disabled={!hasFormChanged(values) || !isValid} className="my-6 mx-2">
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>

            <div className="mt-12">
                <MasterPriceLog id={id} />
            </div>
        </div>
    );
};

export default AutoMasterPriceEdit;
