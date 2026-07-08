import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button,Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Utils } from '@/utils/utils';

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
    zone: Yup.string().required('Zone is required'),
    baseFare: Yup.number().required('Base Fare is required'),
    baseKm: Yup.number().required('Base Km is required'),
    ratePerKm: Yup.number().required('Rate Per Km is required'),
    ratePerMin: Yup.number().required('Rate Per Min is required'),
    additionalMin: Yup.number().required('Additional Min Charge is required'),
    // rateParameter: Yup.string().required('Rate Parameter is required'),
    surchargePercentage: Yup.number().required('Surcharge Percentage is required'),
    nightHoursFrom: Yup.string().required('Night start time is required'),
    nightHoursTo: Yup.string().required('Night end time is required'),
    nightCharge: Yup.number().required('Night Charge is required'),
    waitingMins: Yup.number().required('Waiting Minutes is required'),
    waitingCharge: Yup.number().required('Waiting Charge is required'),
    cancellationMins: Yup.number().required('Cancellation Minutes is required'),
    cancellationCharge: Yup.number().required('Cancellation Charge is required'),
});

const BikeMasterPriceTableAdd = () => {
    const [serviceAreas, setServiceAreas] = useState([]);
    const navigate = useNavigate();

    // Fetch service areas
    const fetchGeoData = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(
                API_ROUTES.GEO_MARKINGS_LIST,
                {}
            );
            const filteredAreas = response.data.filter(
                (area) => area.type === 'Service Area'
            );
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
        baseFare: '',
        baseKm: '',
        ratePerKm: '',
        ratePerMin: '',
        additionalMin: '',
        // rateParameter: null,
        surchargePercentage: '',
        nightHoursFrom: '',
        nightHoursTo: '',
        nightCharge: '',
        waitingMins: '',
        waitingCharge: '',
        cancellationMins: '',
        cancellationCharge: '',
        status: 'ACTIVE',
        zone: '',
        freeExtraMinutes: '',
        driverCancelMins:'',
        driverFreeCancellationsPerDay:'',
        driverCancellationCharge:'',
    };

    const onSubmit = async (values, { setSubmitting }) => {
        try {
            const reqBody = {
                 type: "Bike",
                serviceType: 'BIKE',
                zone: values.zone,
                status: values.status === 'ACTIVE' ? 1 : 0,

                baseFare: Number(values.baseFare),
                baseKm: Number(values.baseKm),
                kilometerPrice: Number(values.ratePerKm),
                minCharge: Number(values.ratePerMin),

                // rateParameter: values.rateParameter || null,
                additionalMinCharge: Number(values.additionalMin),

                surChargePercentage: Number(values.surchargePercentage),

                nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom),
                nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo),

                nightCharge: Number(values.nightCharge),
                waitingMins: Utils.convertMinutesToTimeFormat(values.waitingMins),
                waitingCharge: Number(values.waitingCharge),

                cancelMins: Utils.convertMinutesToTimeFormat(values.cancellationMins),
                cancelCharge: Number(values.cancellationCharge),
                freeExtraMinutes: Number(values.freeExtraMinutes),
                driverCancelMins: Utils.convertMinutesToTimeFormat(values.driverCancelMins),
                driverFreeCancellationsPerDay: Number(values.driverFreeCancellationsPerDay),
                driverCancellationCharge: Number(values.driverCancellationCharge),
            };

            console.log('Bike Package Payload:', reqBody);

            const data = await ApiRequestUtils.post(
                API_ROUTES.BIKE_MASTERPRICE_TABLE_ADD,
                reqBody
            );

            if (data?.success) {
                navigate('/dashboard/finance/master-price');
            }
        } catch (error) {
            console.error('Error saving bike package:', error);
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Add Bike Package Pricing</h2>

            <Formik
                initialValues={initialValues}
                validationSchema={PRICE_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ handleSubmit, setFieldValue, isValid, dirty,errors }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <p>Form Errors (Debug):</p><p>{JSON.stringify(errors, null, 2)}</p>                         <pre>{JSON.stringify(errors, null, 2)}</pre>
                            {/* Zone */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Zone
                                </label>
                                <Select
                                    options={ZONE_OPTIONS}
                                    onChange={(selectedOption) =>
                                        setFieldValue('zone', selectedOption.value)
                                    }
                                    placeholder="Select Zone"
                                    className="w-full"
                                />
                                <ErrorMessage
                                    name="zone"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <Select
                                    options={STATUS_OPTIONS}
                                    onChange={(selectedOption) =>
                                        setFieldValue('status', selectedOption.value)
                                    }
                                    defaultValue={STATUS_OPTIONS[0]}
                                    className="w-full"
                                />
                            </div>

                            {/* Rate Parameter */}
                            {/* <div className="hidden">
                                <label className="text-sm font-medium text-gray-700">
                                    Rate Parameter
                                </label>
                                <Select
                                    options={RATE_PARAMETER_OPTIONS}
                                    onChange={(selectedOption) =>
                                        setFieldValue(
                                            'rateParameter',
                                            selectedOption.value
                                        )
                                    }
                                    placeholder="Select Rate Parameter"
                                    className="w-full"
                                />
                                <ErrorMessage
                                    name="rateParameter"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div> */}

                            {/* Surcharge */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Surcharge Percentage
                                </label>
                                <Field
                                    type="number"
                                    name="surchargePercentage"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="surchargePercentage"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Base Km
                                </label>
                                <Field
                                    type="number"
                                    name="baseKm"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="baseKm"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Free Extra Minutes
                                </label>
                                <Field
                                    type="number"
                                    name="freeExtraMinutes"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="freeExtraMinutes"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            {/* Night Hours */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Night Hours (10:00 PM - 06:00 AM)
                                </label>
                                <div className="flex items-center">
                                    <Field
                                        type="time"
                                        name="nightHoursFrom"
                                        className="p-2 w-full rounded-l-md border-gray-300 shadow-sm"
                                    />
                                    <span className="px-3 py-2 bg-gray-100 border-t border-b border-gray-300">
                                        to
                                    </span>
                                    <Field
                                        type="time"
                                        name="nightHoursTo"
                                        className="p-2 w-full rounded-r-md border-gray-300 shadow-sm"
                                    />
                                </div>
                                <ErrorMessage
                                    name="nightHoursFrom"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                                <ErrorMessage
                                    name="nightHoursTo"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            {/* Night Charge */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Night Charge
                                </label>
                                <Field
                                    type="number"
                                    name="nightCharge"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="nightCharge"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            {/* Waiting Minutes */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Waiting Minutes
                                </label>
                                <Field
                                    type="number"
                                    name="waitingMins"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="waitingMins"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            {/* Waiting Charge */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Waiting Charge
                                </label>
                                <Field
                                    type="number"
                                    name="waitingCharge"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="waitingCharge"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            {/* Cancellation Minutes */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Cancellation Minutes
                                </label>
                                <Field
                                    type="number"
                                    name="cancellationMins"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="cancellationMins"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>

                            {/* Cancellation Charge */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Cancellation Charge
                                </label>
                                <Field
                                    type="number"
                                    name="cancellationCharge"
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                />
                                <ErrorMessage
                                    name="cancellationCharge"
                                    component="div"
                                    className="text-red-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Pricing Table (Mini Only - API Supported) */}
                        <div className="mt-12">
                            <div className="overflow-x-auto rounded-lg shadow border border-gray-300">
                                <table className="min-w-full">
                                    <thead className="bg-blue-600">
                                        <tr>
                                           
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                                                Base Fare
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                                                Rate Per Km
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                                                Rate Per Min
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                                                Additional Min Charge
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        <tr>
                                          
                                            <td className="px-6 py-3">
                                                <Field
                                                    type="number"
                                                    name="baseFare"
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                                <ErrorMessage
                                                    name="baseFare"
                                                    component="div"
                                                    className="text-red-500 text-xs"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <Field
                                                    type="number"
                                                    name="ratePerKm"
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                                <ErrorMessage
                                                    name="ratePerKm"
                                                    component="div"
                                                    className="text-red-500 text-xs"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <Field
                                                    type="number"
                                                    name="ratePerMin"
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                                <ErrorMessage
                                                    name="ratePerMin"
                                                    component="div"
                                                    className="text-red-500 text-xs"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <Field
                                                    type="number"
                                                    name="additionalMin"
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                                <ErrorMessage
                                                    name="additionalMin"
                                                    component="div"
                                                    className="text-red-500 text-xs"
                                                />
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
                            <Button
                                fullWidth
                                onClick={() =>
                                    navigate('/dashboard/finance/master-price')
                                }
                                className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
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

export default BikeMasterPriceTableAdd;