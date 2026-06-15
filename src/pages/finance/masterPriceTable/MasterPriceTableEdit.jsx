import React, { useEffect, useState, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import Select from 'react-select';
import RidesPeakHourTableEdit from './RidesPeakHourTableEdit';
import PremiumPriceDetailsEdit from '@/components/PremiumPriceDetailsEdit';
import { Typography } from '@material-tailwind/react';
import DemandPriceEdit from './DemandPriceEdit';

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
    baseFare: Yup.number().required('Base Fare Mini is required'),
    baseKm: Yup.number().required('Base Km is required'),
    baseFareMVP: Yup.number().required('Base Fare MUV is required'),
    baseFareSedan: Yup.number().required('Base Fare Sedan is required'),
    baseFareSuv: Yup.number().required('Base Fare Suv is required'),
    ratePerKm: Yup.number().required('Rate Per Km Mini is required'),
    ratePerKmMVP: Yup.number().required('Rate Per Km MUV is required'),
    ratePerKmSuv: Yup.number().required('Rate Per Km Suv is required'),
    ratePerKmSedan: Yup.number().required('Rate Per Km Sedan is required'),
    // ratePerMin: Yup.number().required('Rate Per Min is required'),
    additionalMin: Yup.number().required('Additional Min is required'),
    rateParameter: Yup.string().required('Rate Parameter is required'),
    surchargePercentage: Yup.number().required('Surcharge Percentage is required'),
    // nightHours: Yup.number().required('Night Hours is required'),
    nightCharge: Yup.number().required('Night Charge is required'),
    cancellationMins: Yup.number().required('Cancellation Mins is required'),
    cancellationCharge: Yup.number().required('Cancellation Charge is required'),
    status: Yup.string().required('Status is required'),
    zone: Yup.string().required('Zone is required'), // Added zone validation
});

const PriceEdit = () => {
    const [initialValues, setInitialValues] = useState(null);
    const [serviceAreas, setServiceAreas] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();
    const [peakHours, setPeakHours] = useState([]);
    const [demandRules, setDemandRules] = useState([]);
    const [premiumConfig ,setPremiumConfig] = useState({});
    const initialPeakHoursRef = useRef([]);
    const initialPremiumRef = useRef({});
    const initialDemandPriceRef = useRef([]); 

    useEffect(() => {
        fetchPriceDetails();
    }, []);

    const fetchPriceDetails = async () => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${id}`);
            if (data?.success) {
                setInitialValues({
                    baseFare: data.data.baseFare,
                    baseKm: data.data.baseKm,
                    baseFareMVP: data.data.baseFareMVP,
                    baseFareSedan: data.data.baseFareSedan,
                    baseFareSuv: data.data.baseFareSuv,
                    ratePerKm: data.data.kilometerPrice,
                    ratePerKmMVP: data.data.kilometerPriceMVP,
                    ratePerKmSedan: data.data.kilometerPriceSedan,
                    ratePerKmSuv: data.data.kilometerPriceSuv,
                    // ratePerMin: data.data.minCharge,
                    additionalMin: data.data.additionalMinCharge,
                    rateParameter: data.data.rateParameter,
                    surchargePercentage: data.data.surChargePercentage,
                    nightHoursFrom: convertToTimeFormat(data?.data?.nightHoursFrom),
                    nightHoursTo: convertToTimeFormat(data?.data?.nightHoursTo),
                    nightCharge: data.data.nightCharge,
                    cancellationMins: Utils.convertTimeFormatToMinutes(data.data.cancelMins),
                    cancellationCharge: data.data.cancelCharge,
                    status: data.data.status == 1 ? "ACTIVE": 'IN_ACTIVE',
                    zone: data.data.zone || '',
                    freeExtraMinutes: data.data.freeExtraMinutes || '',
                    driverCancelMins: Utils.convertTimeFormatToMinutes(data.data.driverCancelMins) || '',
                    driverFreeCancellationsPerDay: data.data.driverFreeCancellationsPerDay || '',
                    driverCancellationCharge: data.data.driverCancellationCharge || ''
                });
                setPeakHours(data.data.peakHours || []);
                initialPeakHoursRef.current = data.data.peakHours;
                setDemandRules(data.data.demandRules || []);
                initialDemandPriceRef.current = data.data.demandRules || [];
                initialPremiumRef.current = data.data.premiumConfig;
                setPremiumConfig(data.data.premiumConfig || []);

            }
        } catch (error) {
            console.error("Error fetching price details:", error);
        }
    };

    const convertToTimeFormat = (timeString) => {
        return timeString ? timeString.slice(0, 5) : "";
    };

    const hasPeakHoursChanged = () => {
        return JSON.stringify(peakHours) !== JSON.stringify(initialPeakHoursRef.current);
    };
    const hasPremiumConfig = () => {
        return JSON.stringify(premiumConfig) !== JSON.stringify(initialPremiumRef.current);
    }
    const hasDemandPriceChanged = () => {
        return JSON.stringify(demandRules) !== JSON.stringify(initialDemandPriceRef.current);
    }

    const onSubmit = async (values) => {
        try {
            const reqBody = {
                packageId:Number(id),
                baseKm: Number(values.baseKm),
                baseFare: Number(values.baseFare),
                baseFareMVP: Number(values.baseFareMVP),
                baseFareSuv: Number(values.baseFareSuv),
                baseFareSedan: Number(values.baseFareSedan),
                kilometerPrice: Number(values.ratePerKm),
                kilometerPriceSedan: Number(values.ratePerKmSedan),
                kilometerPriceSuv: Number(values.ratePerKmSuv),
                kilometerPriceMVP: Number(values.ratePerKmMVP),
                // minCharge: Number(values.ratePerMin),
                additionalMinCharge: Number(values.additionalMin),
                freeExtraMinutes: Number(values.freeExtraMinutes),
                rateParameter: values.rateParameter,
                surChargePercentage: Number(values.surchargePercentage),
                nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom),
                nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo),
                nightCharge: Number(values.nightCharge),
                cancelMins: Utils.convertMinutesToTimeFormat(values.cancellationMins),
                cancelCharge: Number(values.cancellationCharge),
                status: values.status == 'ACTIVE' ? 1 : 0,
                serviceType:'RIDES',
                peakHours: peakHours,
                demandRules: demandRules,
                premiumConfig:premiumConfig,
                zone: values.zone,
                driverCancelMins: Utils.convertMinutesToTimeFormat(values.driverCancelMins),
                driverFreeCancellationsPerDay: Number(values.driverFreeCancellationsPerDay),
                driverCancellationCharge: Number(values.driverCancellationCharge)
            };
            // console.log("Request Body for Update:", reqBody);
            const response = await ApiRequestUtils.update(API_ROUTES.RIDES_PRICE_EDIT, reqBody);
            if (response?.success) {
                navigate('/dashboard/finance/master-price', { state: { priceUpdated: true } });
            }
        } catch (error) {
            console.error("Error updating price details:", error);
        }
    };

    return (
        <div className="p-4 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Rides Pricing Details</h2>
            <Formik initialValues={initialValues} validationSchema={PRICE_SCHEMA} onSubmit={onSubmit} enableReinitialize>
                {({ handleSubmit, setFieldValue, isValid, dirty, values }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Field
                                    type="text"
                                    name="zone"
                                    disabled
                                    className="p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-200"
                                />
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                            </div>
                            {/* <div>
                                <label className="text-sm font-medium text-gray-700">Base Fare Mini</label>
                                <Field type="number" name="baseFare" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="baseFare" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Base Fare Sedan</label>
                                <Field type="number" name="baseFareSedan" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="baseFareSedan" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                            <label className="text-sm font-medium text-gray-700">Base Fare SUV</label>
                                <Field type="number" name="baseFareSuv" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="baseFareSuv" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Base Fare MUV</label>
                                <Field type="number" name="baseFareMVP" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="baseFareMVP" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rate Per Km Mini</label>
                                <Field type="number" name="ratePerKm" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="ratePerKm" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rate Per Km Sedan</label>
                                <Field type="number" name="ratePerKmSedan" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="ratePerKmSedan" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rate Per Km SUV</label>
                                <Field type="number" name="ratePerKmSuv" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="ratePerKmSuv" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rate Per Km MUV</label>
                                <Field type="number" name="ratePerKmMVP" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="ratePerKmMVP" component="div" className="text-red-500 text-sm" />
                            </div> */}
                            {/* <div>
                                <label className="text-sm font-medium text-gray-700">Rate Per Min</label>
                                <Field type="number" name="ratePerMin" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="ratePerMin" component="div" className="text-red-500 text-sm" />
                            </div> */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Select
                                    options={STATUS_OPTIONS}
                                    onChange={(selectedOption) => setFieldValue('status', selectedOption.value)}
                                    value={STATUS_OPTIONS.find(option => option.value === values?.status)}
                                    placeholder="Select Status"
                                    className="w-full"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                            {/* <div>
                                <label className="text-sm font-medium text-gray-700">Rate Per Min</label>
                                <Field type="number" name="ratePerMin" className="p-2 w-full rounded-md border-gray-300" />
                            </div> */}
                            {/* <div>
                                <label className="text-sm font-medium text-gray-700">Additional Min</label>
                                <Field type="number" name="additionalMin" className="p-2 w-full rounded-md border-gray-300" />
                            </div> */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Surcharge Percentage</label>
                                <Field type="number" name="surchargePercentage" className="p-2 w-full rounded-md border-gray-300" />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Base Km</label>
                                <Field type="number" name="baseKm" className="p-2 w-full rounded-md border-gray-300" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">freeExtraMinutes</label>
                                <Field type="number" name="freeExtraMinutes" className="p-2 w-full rounded-md border-gray-300" />
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
                                <label className="text-sm font-medium text-gray-700">Night Charge</label>
                                <Field type="number" name="nightCharge" className="p-2 w-full rounded-md border-gray-300" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Mins</label>
                                <Field type="number" name="cancellationMins" className="p-2 w-full rounded-md border-gray-300" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Charge</label>
                                <Field type="number" name="cancellationCharge" className="mt-1 p-3 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="cancellationCharge" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                           
                        </div>

                        {/* Beautiful Table - Same as Details Page */}
                        <div className="mt-12">
                            <div className="overflow-x-auto rounded-lg shadow border border-gray-300">
                                <table className="min-w-full">
                                    <thead className="bg-blue-600">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Car Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Base Fare</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Rate Per Km</th>
                                            {/* <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Rate Per Min</th> */}
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Additional Min Charge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-1 font-medium text-gray-800">MINI</td>
                                            <td className="px-6 py-1">
                                                <Field
                                                    type="number"
                                                    name="baseFare"
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <ErrorMessage name="baseFare" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field
                                                    type="number"
                                                    name="ratePerKm"
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <ErrorMessage name="ratePerKm" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerMin" component="div" className="text-red-500 text-xs mt-1" />
                                            </td> */}
                                            <td className="px-6 py-1 border">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="additionalMin" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 hover:bg-gray-100">
                                            <td className="px-6 py-1 font-medium text-gray-800">SEDAN</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareSedan" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="baseFareSedan" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmSedan" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerKmSedan" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerMin" component="div" className="text-red-500 text-xs mt-1" />
                                            </td> */}
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="additionalMin" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-1 font-medium text-gray-800">SUV</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareSuv" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="baseFareSuv" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmSuv" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerKmSuv" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerMin" component="div" className="text-red-500 text-xs mt-1" />
                                            </td> */}
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="additionalMin" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 hover:bg-gray-100">
                                            <td className="px-6 py-1 font-medium text-gray-800">MUV</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareMVP" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="baseFareMVP" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmMVP" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerKmMVP" component="div" className="text-red-500 text-xs mt-1" />
                                            </td>
                                            {/* {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="ratePerMin" component="div" className="text-red-500 text-xs mt-1" />
                                            </td> */}
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" className="w-full p-2 border border-gray-300 rounded-md" />
                                                <ErrorMessage name="additionalMin" component="div" className="text-red-500 text-xs mt-1" />
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
                    <DemandPriceEdit demandRules={demandRules} setDemandRules={setDemandRules} />
                        <RidesPeakHourTableEdit initialPriceData={peakHours} onUpdate={(data)=> setPeakHours(data)}/>
                        <PremiumPriceDetailsEdit initialPremiumData={premiumConfig} onUpdate={(data)=> setPremiumConfig(data) } />
                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                                Cancel
                            </Button>
                            <Button fullWidth color="blue" onClick={handleSubmit} disabled={!(dirty || hasPeakHoursChanged() || hasPremiumConfig() || hasDemandPriceChanged()) || !isValid} className="my-6 mx-2">
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default PriceEdit;
