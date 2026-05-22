import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Alert, Button } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import { Typography } from "@material-tailwind/react";

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

const PRICE_SCHEMA = Yup.object().shape({
    baseKm: Yup.number().required('Base Km is required'),
    baseFare: Yup.number().required('Base Fare is required'),
    ratePerKm: Yup.number().required('Rate Per Km is required'),
    ratePerMin: Yup.number().required('Rate Per Min is required'),
    additionalMin: Yup.number().required('Additional Min is required'),
    rateParameter: Yup.string().required('Rate Parameter is required'),
    surchargePercentage: Yup.number().required('Surcharge Percentage is required'),
    nightCharge: Yup.number().required('Night Charge is required'),
    cancellationMins: Yup.number().required('Cancellation Mins is required'),
    cancellationCharge: Yup.number().required('Cancellation Charge is required'),
    status: Yup.string().required('Status is required'),
    zone: Yup.string().required('Zone is required'),
});

const PriceAdd = () => {
    const [serviceAreas, setServiceAreas] = useState([]);
    const navigate = useNavigate();

    // Fetch service areas
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

    // Map service areas to react-select options
    const ZONE_OPTIONS = serviceAreas.map((area) => ({
        value: area.name,
        label: area.name,
    }));

    const initialValues = {
        baseFare: '',
        baseKm: '',
        baseFareSuv:'',
        baseFareSedan:'',
        baseFareMVP: '',
        ratePerKm: '',
        ratePerKmSuv:'',
        ratePerKmSedan:'',
        ratePerKmMVP: '',
        ratePerMin: '',
        additionalMin: '',
        rateParameter: '',
        surchargePercentage: '',
        nightHoursFrom: '',
        nightHoursTo: '',
        nightCharge: '',
        cancellationMins: '',
        cancellationCharge: '',
        status: 'ACTIVE',
        zone: '',
        freeExtraMinutes:'',
        driverCancelMins:'',
        driverFreeCancellationsPerDay:'',
        driverCancellationCharge:''
    };

    const onSubmit = async (values, { setSubmitting }) => {
        try {
            console.log('Submitted Price Data:', values);
            const reqBody = {
                'baseKm': values.baseKm,
                'baseFare': values.baseFare,
                'baseFareMVP': values.baseFareMVP,
                'baseFareSedan':values.baseFareSedan,
                'baseFareSuv':values.baseFareSuv,
                'kilometerPrice': values.ratePerKm,
                'kilometerPriceSuv':values.ratePerKmSuv,
                'kilometerPriceSedan':values.ratePerKmSedan,
                'kilometerPriceMVP': values.ratePerKmMVP,
                'minCharge': values.ratePerMin,
                'rateParameter': values.rateParameter,
                'additionalMinCharge': values.additionalMin,
                'freeExtraMinutes':values.freeExtraMinutes,
                'surChargePercentage': values.surchargePercentage,
                'nightHoursFrom': Utils.formatTimeWithSeconds(values.nightHoursFrom),
                'nightHoursTo': Utils.formatTimeWithSeconds(values.nightHoursTo),
                'nightCharge': values.nightCharge,
                'cancelMins': Utils.convertMinutesToTimeFormat(values.cancellationMins),
                'cancelCharge': values.cancellationCharge,
                'type': 'Rides',
                'serviceType': 'RIDES',
                'period': 'Rides',
                'status': values.status == "ACTIVE" ? 1 : 0,
                'zone': values.zone,

                'driverCancelMins': Utils.convertMinutesToTimeFormat(values.driverCancelMins),
                'driverFreeCancellationsPerDay': values.driverFreeCancellationsPerDay,
                'driverCancellationCharge': values.driverCancellationCharge
            }
            const data = await ApiRequestUtils.post(API_ROUTES.ADD_RIDES_PRICE_TABLE, reqBody);
            if (data?.success) {
                navigate('/dashboard/finance/master-price')
            }
        } catch (error) {
            console.error('Error saving price details:', error);
            // setAlert({ message: 'Error saving data', color: 'red' });
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto">
            {/* {alert && (
                <div className='mb-2'>
                    <Alert color={alert.color} className='py-3 px-6 rounded-xl'>
                        {alert.message}
                    </Alert>
                </div>
            )} */}
            <h2 className="text-2xl font-bold mb-4">Add Pricing Details</h2>
            <Formik initialValues={initialValues} validationSchema={PRICE_SCHEMA} onSubmit={onSubmit} enableReinitialize>
                {({ handleSubmit, setFieldValue, isValid, dirty }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Select
                                    options={ZONE_OPTIONS}
                                    onChange={(selectedOption) => setFieldValue('zone', selectedOption.value)}
                                    placeholder="Select Zone"
                                    className="w-full"
                                />
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Select
                                    options={STATUS_OPTIONS}
                                    onChange={(selectedOption) => setFieldValue('status', selectedOption.value)}
                                    defaultValue={STATUS_OPTIONS[0]}
                                    placeholder="Select Status"
                                    className="w-full"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rate Parameter</label>
                                <Select
                                    options={RATE_PARAMETER_OPTIONS}
                                    onChange={(selectedOption) => setFieldValue('rateParameter', selectedOption.value)}
                                    placeholder="Select Rate Parameter"
                                    className="w-full"
                                />
                                <ErrorMessage name="rateParameter" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Surcharge Percentage</label>
                                <Field type="number" name="surchargePercentage" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="surchargePercentage" component="div" className="text-red-500 text-sm" />
                            </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Base Km</label>
                                <Field type="number" name="baseKm" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="baseKm" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Hours (10:00 PM - 06:00 AM)</label>
                                <div className="flex items-center">
                                    <Field
                                        type="time"
                                        name="nightHoursFrom"
                                        min="22:00"
                                        max="23:59"
                                        className="p-2 w-full rounded-l-md border-gray-300 shadow-sm"
                                    />
                                    <span className="px-3 py-2 bg-gray-100 border-t border-b border-gray-300">to</span>
                                    <Field
                                        type="time"
                                        name="nightHoursTo"
                                        min="05:00"
                                        max="08:00"
                                        className="p-2 w-full rounded-r-md border-gray-300 shadow-sm"
                                    />
                                </div>
                                <ErrorMessage name="nightHoursFrom" component="div" className="text-red-500 text-sm" />
                                <ErrorMessage name="nightHoursTo" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                <Field type="number" name="freeExtraMinutes" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="freeExtraMinutes" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Charge</label>
                                <Field type="number" name="nightCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="nightCharge" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Mins</label>
                                <Field type="number" name="cancellationMins" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="cancellationMins" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Charge</label>
                                <Field type="number" name="cancellationCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="cancellationCharge" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                        </div>

                        {/* Beautiful Pricing Table - Exact same as Edit page */}
                        <div className="mt-12">
                            <div className="overflow-x-auto rounded-lg shadow border border-gray-300">
                                <table className="min-w-full">
                                    <thead className="bg-blue-600">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Car Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Base Fare</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Rate Per Km</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Rate Per Min</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Additional Min Charge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-1 font-medium text-gray-800">MINI</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFare" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="baseFare" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKm" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerKm" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 hover:bg-gray-100">
                                            <td className="px-6 py-1 font-medium text-gray-800">SEDAN</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareSedan" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmSedan" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-1 font-medium text-gray-800">SUV</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareSuv" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmSuv" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 hover:bg-gray-100">
                                            <td className="px-6 py-1 font-medium text-gray-800">MUV</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareMVP" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmMVP" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className='overflow-x-auto m-2'>
                            <Typography className='font-semibold'>Driver Cancellation</Typography>
                            <table className="w-full border border-collapse text-sm text-center">
                                <thead>
                                    <tr className="bg-primary  text-white">
                                        <th>Driver Cancel Mins</th>
                                        <th>Driver Free Cancellations Per Day</th>
                                        <th>Driver Cancellation Charge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border p-2">
                                            <Field
                                                type="number"
                                                name="driverCancelMins"
                                                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                            />
                                        </td>
                                        <td className="border p-2">
                                            <Field
                                                type="number"
                                                name="driverFreeCancellationsPerDay"
                                                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                            />
                                        </td>
                                        <td className="border p-2">
                                            <Field
                                                type="number"
                                                name="driverCancellationCharge"
                                                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                                Cancel
                            </Button>
                            <Button fullWidth  onClick={handleSubmit} disabled={!dirty || !isValid} className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}>
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
