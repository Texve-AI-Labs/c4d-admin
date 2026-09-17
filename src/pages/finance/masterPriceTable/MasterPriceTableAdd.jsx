import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Button, Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import RidesPeakHourTableEdit from './RidesPeakHourTableEdit';

const RATE_PARAMETER_OPTIONS = [
    { value: 'RAINY_DAY', label: 'Rainy Day' },
    { value: 'PREMIUM_RIDE', label: 'Premium Ride' },
    { value: 'MID_TRIP_CANCELLATION', label: 'Mid Trip Cancellation' },
    { value: 'OFF_PEAK', label: 'Off Peak' },
    { value: 'DURING_PEAK', label: 'During Peak' },
    { value: 'NORMAL_RIDE', label: 'Normal Ride' },
];

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

const CATEGORY_OPTIONS = [
    { value: 'ECONOMY_GO', label: 'Economy Go' },
    { value: 'COMFORT', label: 'Comfort' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'PREMIUM_XL', label: 'Premium XL' },
];

const CAR_TYPE_OPTIONS = [
    { value: 'MINI', label: 'Mini' },
    { value: 'SEDAN', label: 'Sedan' },
    { value: 'SUV', label: 'Suv' },
    { value: 'MUV', label: 'Muv' },
];

const numberField = (label) => Yup.number()
    .required(`${label} is required`)
    .min(0, `${label} must be greater than or equal to 0`);

const categoryPricingSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    carTypes: Yup.array()
        .of(Yup.string().required('Car Type is required'))
        .min(1, 'Car Type is required')
        .required('Car Type is required'),
    pricing: Yup.object()
        .shape({
            baseKm: numberField('Base Km'),
            baseFare: numberField('Base Fare'),
            minCharge: numberField('Min Charge'),
            peakHours: Yup.array().of(
                Yup.object().shape({
                    start: Yup.string().required('Start time is required'),
                    end: Yup.string().required('End time is required'),
                    kilometerPrice: numberField('Kilometer Price'),
                })
            ),
            kilometerPrice: numberField('Kilometer Price'),
            nightCharge: numberField('Night Charge'),
            nightHoursFrom: Yup.string().required('Night Hours From is required'),
            nightHoursTo: Yup.string().required('Night Hours To is required'),
            waitingCharge: numberField('Waiting Charge'),
            freeExtraMinutes: numberField('Free Extra Minutes'),
            additionalMinCharge: numberField('Additional Min Charge'),
            surChargePercentage: numberField('Surcharge Percentage'),
        })
        .required('Pricing is required'),
});

const getCategoryLabel = (value) => CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value;
const getCarTypeLabel = (value) => CAR_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;

const PRICE_SCHEMA = Yup.object().shape({
    serviceType: Yup.string().required('Service Type is required'),
    type: Yup.string().required('Type is required'),
    zone: Yup.string().required('Zone is required'),
    rateParameter: Yup.string().required('Rate Parameter is required'),
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
                        return this.createError({
                            message: `${getCategoryLabel(item.category)} + ${getCarTypeLabel(carType)} already exists`,
                        });
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
        nightCharge: '',
        waitingCharge: '',
        freeExtraMinutes: '',
        additionalMinCharge: '',
        surChargePercentage: '',
        nightHoursFrom: '',
        nightHoursTo: '',
        peakHours: [],
    },
};

const cloneCategoryPricing = () => JSON.parse(JSON.stringify(emptyCategoryPricing));
const toNumber = (value) => Number(value || 0);
const FormLevelError = ({ error }) => (
    typeof error === 'string' ? <div className="text-red-500 text-sm">{error}</div> : null
);

const PriceAdd = () => {
    const [serviceAreas, setServiceAreas] = useState([]);
    const navigate = useNavigate();

    const fetchGeoData = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
            const filteredAreas = response.data.filter((area) => area.type === 'Service Area');
            setServiceAreas(filteredAreas);
        } catch (error) {
            console.error('Error fetching GEO_MARKINGS_LIST:', error);
        }
    };

    useEffect(() => {
        fetchGeoData();
    }, []);

    const ZONE_OPTIONS = serviceAreas.map((area) => ({
        value: area.name,
        label: area.name,
    }));

    const initialValues = {
        serviceType: 'RIDES',
        type: 'Rides',
        zone: '',
        rateParameter: 'NORMAL_RIDE',
        status: 'ACTIVE',
        categoryPricings: [cloneCategoryPricing()],
    };

    const onSubmit = async (values, { setSubmitting }) => {
        try {
            const reqBody = {
                serviceType: values.serviceType,
                type: values.type,
                zone: values.zone,
                rateParameter: values.rateParameter,
                status: values.status === 'ACTIVE' ? 1 : 0,
                categoryPricings: values.categoryPricings.map((categoryPricing) => ({
                    category: categoryPricing.category,
                    carTypes: categoryPricing.carTypes,
                    pricing: {
                        baseKm: toNumber(categoryPricing.pricing.baseKm),
                        baseFare: toNumber(categoryPricing.pricing.baseFare),
                        kilometerPrice: toNumber(categoryPricing.pricing.kilometerPrice),
                        minCharge: toNumber(categoryPricing.pricing.minCharge),
                        nightCharge: toNumber(categoryPricing.pricing.nightCharge),
                        waitingCharge: toNumber(categoryPricing.pricing.waitingCharge),
                        freeExtraMinutes: toNumber(categoryPricing.pricing.freeExtraMinutes),
                        additionalMinCharge: toNumber(categoryPricing.pricing.additionalMinCharge),
                        surChargePercentage: toNumber(categoryPricing.pricing.surChargePercentage),
                        nightHoursFrom: categoryPricing.pricing.nightHoursFrom,
                        nightHoursTo: categoryPricing.pricing.nightHoursTo,
                        peakHours: categoryPricing.pricing.peakHours.map((peakHour) => ({
                            start: peakHour.start,
                            end: peakHour.end,
                            kilometerPrice: toNumber(peakHour.kilometerPrice),
                        })),
                    },
                })),
            };
            // console.log("RIDES payload",reqBody)

            const data = await ApiRequestUtils.post(API_ROUTES.ADD_RIDES_PRICE_TABLE, reqBody);
            if (data?.success) {
                navigate('/dashboard/finance/master-price');
            }
        } catch (error) {
            console.error('Error saving price details:', error);
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto bg-white">
            <h2 className="text-2xl font-bold mb-4">Add Rides Pricing Details</h2>
            <Formik initialValues={initialValues} validationSchema={PRICE_SCHEMA} onSubmit={onSubmit} enableReinitialize>
                {({ handleSubmit, setFieldValue, isValid, dirty, values, errors }) => (
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
                                <Select
                                    options={ZONE_OPTIONS}
                                    value={ZONE_OPTIONS.find((option) => option.value === values.zone) || null}
                                    onChange={(selectedOption) => setFieldValue('zone', selectedOption?.value || '')}
                                    placeholder="Select Zone"
                                    className="w-full"
                                />
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Select
                                    options={STATUS_OPTIONS}
                                    value={STATUS_OPTIONS.find((option) => option.value === values.status) || null}
                                    onChange={(selectedOption) => setFieldValue('status', selectedOption?.value || '')}
                                    placeholder="Select Status"
                                    className="w-full"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rate Parameter</label>
                                <Select
                                    options={RATE_PARAMETER_OPTIONS}
                                    value={RATE_PARAMETER_OPTIONS.find((option) => option.value === values.rateParameter) || null}
                                    onChange={(selectedOption) => setFieldValue('rateParameter', selectedOption?.value || '')}
                                    placeholder="Select Rate Parameter"
                                    className="w-full"
                                />
                                <ErrorMessage name="rateParameter" component="div" className="text-red-500 text-sm" />
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

                                    {values.categoryPricings.map((categoryPricing, index) => (
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
                                                        onChange={(selectedOptions) => setFieldValue(
                                                            `categoryPricings.${index}.carTypes`,
                                                            selectedOptions ? selectedOptions.map((option) => option.value) : []
                                                        )}
                                                        placeholder="Select Car Types"
                                                        className="w-full"
                                                    />
                                                    <ErrorMessage name={`categoryPricings.${index}.carTypes`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Base Km</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.baseKm`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.baseKm`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Base Fare</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.baseFare`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.baseFare`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Kilometer Price</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.kilometerPrice`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.kilometerPrice`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Min Charge</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.minCharge`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.minCharge`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Night Charge</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.nightCharge`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.nightCharge`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Waiting Charge</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.waitingCharge`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.waitingCharge`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.freeExtraMinutes`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.freeExtraMinutes`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Additional Min Charge</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.additionalMinCharge`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.additionalMinCharge`} component="div" className="text-red-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Surcharge Percentage</label>
                                                    <Field type="number" name={`categoryPricings.${index}.pricing.surChargePercentage`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                                    <ErrorMessage name={`categoryPricings.${index}.pricing.surChargePercentage`} component="div" className="text-red-500 text-sm" />
                                                </div>
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
                            <Button fullWidth onClick={handleSubmit} disabled={!dirty || !isValid} className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}>
                                Continue
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default PriceAdd;