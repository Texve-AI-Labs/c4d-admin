import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Button, Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import RidesPeakHourTableEdit from './RidesPeakHourTableEdit';
import DemandPriceEdit from './DemandPriceEdit';

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

const CATEGORY_OPTIONS = [
    { value: 'BIKE', label: 'Bike' },
];

const CAR_TYPE_OPTIONS = [
    { value: 'Bike', label: 'Bike' },
    { value: 'Scooty', label: 'Scooty' },
];

const numberField = (label) => Yup.number()
    .required(`${label} is required`)
    .min(0, `${label} must be greater than or equal to 0`);

const categoryPricingSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    carTypes: Yup.array().of(Yup.string().required('Car Type is required')).length(1, 'Select one Car Type').required('Car Type is required'),
    pricing: Yup.object().shape({
        baseKm: numberField('Base Km'),
        baseFare: numberField('Base Fare'),
        kilometerPrice: numberField('Kilometer Price'),
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
        cancelMins: numberField('Cancellation Minutes'),
        cancelCharge: numberField('Cancellation Charge'),
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
        cancelMins: '',
        cancelCharge: '',
        peakHours: [],
    },
};

const pricingNumberFields = [
    ['Base Km', 'baseKm'],
    ['Base Fare', 'baseFare'],
    ['Kilometer Price', 'kilometerPrice'],
    ['Extra Price', 'extraPrice'],
    ['Extra Km Price', 'extraKmPrice'],
    ['Night Charge', 'nightCharge'],
    ['Waiting Minutes', 'waitingMins'],
    ['Waiting Charge', 'waitingCharge'],
    ['Free Extra Minutes', 'freeExtraMinutes'],
    ['Additional Min Charge', 'additionalMinCharge'],
    ['Cancellation Minutes', 'cancelMins'],
    ['Cancellation Charge', 'cancelCharge'],
];

const cloneCategoryPricing = () => JSON.parse(JSON.stringify(emptyCategoryPricing));
const cloneBikeCategoryPricing = () => ({
    ...cloneCategoryPricing(),
    category: 'BIKE',
    carTypes: ['BIKE'],
});
const toNumber = (value) => Number(value || 0);
const FormLevelError = ({ error }) => (
    typeof error === 'string' ? <div className="text-red-500 text-sm">{error}</div> : null
);

const buildCategoryPricingsPayload = (categoryPricings) => categoryPricings.map((categoryPricing) => ({
    category: categoryPricing.category,
    carTypes: categoryPricing.carTypes,
    pricing: {
        baseKm: toNumber(categoryPricing.pricing.baseKm),
        baseFare: toNumber(categoryPricing.pricing.baseFare),
        kilometerPrice: toNumber(categoryPricing.pricing.kilometerPrice),
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
        cancelMins: Utils.convertMinutesToTimeFormat(categoryPricing.pricing.cancelMins),
        cancelCharge: toNumber(categoryPricing.pricing.cancelCharge),
        peakHours: categoryPricing.pricing.peakHours.map((peakHour) => ({
            start: peakHour.start,
            end: peakHour.end,
            kilometerPrice: toNumber(peakHour.kilometerPrice),
        })),
    },
}));

const buildBikePackagePayload = (values) => {
    return {
        serviceType: values.serviceType,
        type: values.type,
        zone: values.zone,
        status: values.status === 'ACTIVE' ? 1 : 0,
        driverCancelMins: Utils.convertMinutesToTimeFormat(values.driverCancelMins),
        driverFreeCancellationsPerDay: toNumber(values.driverFreeCancellationsPerDay),
        driverCancellationCharge: toNumber(values.driverCancellationCharge),
        demandRules: values.demandRules || [],
        categoryPricings: buildCategoryPricingsPayload(values.categoryPricings),
    };
};

const BikeMasterPriceTableAdd = () => {
    const [serviceAreas, setServiceAreas] = useState([]);
    const navigate = useNavigate();

    const fetchGeoData = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
            const filteredAreas = Array.isArray(response?.data) ? response.data.filter((area) => area.type === 'Service Area') : [];
            setServiceAreas(filteredAreas);
        } catch (error) {
            console.error('Error fetching GEO_MARKINGS_LIST:', error);
        }
    };

    useEffect(() => {
        fetchGeoData();
    }, []);

    const zoneOptions = serviceAreas.map((area) => ({ value: area.name, label: area.name }));
    const initialValues = {
        serviceType: 'BIKE',
        type: 'Bike',
        zone: '',
        status: 'ACTIVE',
        driverCancelMins: '',
        driverFreeCancellationsPerDay: '',
        driverCancellationCharge: '',
        demandRules: [],
        categoryPricings: [cloneBikeCategoryPricing()],
    };

    const onSubmit = async (values, { setSubmitting }) => {
        try {
            const reqBody = buildBikePackagePayload(values);
            // console.log("BIKE PAYLOAD:- ",reqBody);
            const data = await ApiRequestUtils.post(API_ROUTES.BIKE_MASTERPRICE_TABLE_ADD, reqBody);
            if (data?.success) {
                navigate('/dashboard/finance/master-price');
            }
        } catch (error) {
            console.error('Error saving bike package:', error?.response?.data || error);
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto bg-white">
            <h2 className="text-2xl font-bold mb-4">Add Bike Pricing Details</h2>
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
                                    options={zoneOptions}
                                    value={zoneOptions.find((option) => option.value === values.zone) || null}
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
                        </div>

                        <div className="overflow-x-auto m-2">
                            <Typography className="font-semibold">Driver Cancellation</Typography>
                            <table className="w-full border border-collapse text-sm text-center">
                                <thead>
                                    <tr className="bg-primary text-white">
                                        <th>Driver Cancel Mins</th>
                                        <th>Driver Free Cancellations Per Day</th>
                                        <th>Driver Cancellation Charge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-100">
                                        <td className="border p-2">
                                            <Field type="number" name="driverCancelMins" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                            <ErrorMessage name="driverCancelMins" component="div" className="text-red-500 text-sm" />
                                        </td>
                                        <td className="border p-2">
                                            <Field type="number" name="driverFreeCancellationsPerDay" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                            <ErrorMessage name="driverFreeCancellationsPerDay" component="div" className="text-red-500 text-sm" />
                                        </td>
                                        <td className="border p-2">
                                            <Field type="number" name="driverCancellationCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                            <ErrorMessage name="driverCancellationCharge" component="div" className="text-red-500 text-sm" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <FieldArray name="categoryPricings">
                            {({ push, remove }) => (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-lg font-semibold">Category Pricings</Typography>
                                        <Button type="button" className="bg-black text-white" onClick={() => push(cloneBikeCategoryPricing())}>
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
                                                        options={CAR_TYPE_OPTIONS}
                                                        value={CAR_TYPE_OPTIONS.find((option) => categoryPricing.carTypes.includes(option.value)) || null}
                                                        onChange={(selectedOption) => setFieldValue(`categoryPricings.${index}.carTypes`, selectedOption ? [selectedOption.value] : [])}
                                                        placeholder="Select Car Type"
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
                        
                        <DemandPriceEdit
                            demandRules={values.demandRules}
                            setDemandRules={(data) => setFieldValue('demandRules', data)}
                        />                        

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

export default BikeMasterPriceTableAdd;
