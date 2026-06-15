import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import MasterPriceLog from './MasterPriceLog';
import RidesPeakHourTableDetails from './RidesPeakHourTableDetails';
import PremiumPriceDetails from '@/components/PremiumPriceDetails';
import DemandPriceTable from './DemandPrice';
import { Typography } from "@material-tailwind/react";

const PriceDetails = () => {
    const [initialValues, setInitialValues] = useState(null);
    const [serviceAreas, setServiceAreas] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();
    const [peakHours, setPeakHours] = useState([])
    const [demandRules, setDemandRules] = useState([]);
    const [premiumConfig ,setPremiumConfig] = useState({});

    useEffect(() => {
        fetchGeoData();
        fetchPriceDetails();
    }, []);

    const fetchGeoData = async () => {
        try {
            const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
            const filteredAreas = response.data.filter((area) => area.type === 'Service Area');
            setServiceAreas(filteredAreas);
        } catch (error) {
            console.error('Error fetching GEO_MARKINGS_LIST:', error);
        }
    };

    const fetchPriceDetails = async () => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${id}`);
            if (data?.success) {
                setInitialValues({
                    baseFare: data?.data?.baseFare,
                    baseKm: data?.data?.baseKm,
                    baseFareSuv: data?.data?.baseFareSuv,
                    baseFareSedan: data?.data?.baseFareSedan,
                    baseFareMVP: data?.data?.baseFareMVP,
                    ratePerKm: data?.data?.kilometerPrice,
                    ratePerKmMVP: data?.data?.kilometerPriceMVP,
                    ratePerKmSedan: data?.data?.kilometerPriceSedan,
                    ratePerKmSuv: data?.data?.kilometerPriceSuv,
                    // ratePerMin: data?.data?.minCharge,
                    additionalMin: data?.data?.additionalMinCharge,
                    rateParameter: data?.data?.rateParameter,
                    surchargePercentage: data?.data?.surChargePercentage,
                    nightHoursFrom: convertToTimeFormat(data?.data?.nightHoursFrom),
                    nightHoursTo: convertToTimeFormat(data?.data?.nightHoursTo),
                    nightCharge: data?.data?.nightCharge,
                    cancellationMins: Utils.convertTimeFormatToMinutes(data?.data?.cancelMins),
                    cancellationCharge: data?.data?.cancelCharge,
                    status: data.data.status == 1 ? "ACTIVE": 'IN_ACTIVE',
                    zone: data?.data?.zone || '',
                    freeExtraMinutes: data?.data?.freeExtraMinutes || '',
                    driverCancelMins: Utils.convertTimeFormatToMinutes(data?.data?.driverCancelMins) || '',
                    driverFreeCancellationsPerDay: data?.data?.driverFreeCancellationsPerDay || '',
                    driverCancellationCharge: data?.data?.driverCancellationCharge || ''
                });
                setPeakHours(data.data.peakHours);
                setPremiumConfig(data.data.premiumConfig);
                setDemandRules(data.data.demandRules|| []);
            }
        } catch (error) {
            console.error("Error fetching price details:", error);
        }
    };

    const convertToTimeFormat = (timeString) => {
        return timeString ? timeString.slice(0, 5) : "";
    };

    return (
        <div className="p-4 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Rides Pricing Details</h2>
            <Formik initialValues={initialValues} enableReinitialize>
                {() => (
                    <Form className="space-y-7">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Field type="text" name="zone" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            {/* <div>
                                <label className="text-sm font-medium text-gray-700">Rate Per Min</label>
                                <Field type="number" name="ratePerMin" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Additional Min Charge</label>
                                <Field type="number" name="additionalMin" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div> */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Field type="text" name="status" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100 font-semibold" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Surcharge Percentage</label>
                                <Field type="number" name="surchargePercentage" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Base KM</label>
                                <Field type="number" name="baseKm" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                <Field type="number" name="freeExtraMinutes" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Charge</label>
                                <Field type="number" name="nightCharge" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Mins</label>
                                <Field type="number" name="cancellationMins" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Charge</label>
                                <Field type="number" name="cancellationCharge" disabled className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Night Hours</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <Field type="time" name="nightHoursFrom" disabled className="p-3 rounded-md border-gray-300 bg-gray-100" />
                                    <span className="text-gray-600">to</span>
                                    <Field type="time" name="nightHoursTo" disabled className="p-3 rounded-md border-gray-300 bg-gray-100" />
                                </div>
                            </div>
                        </div>

                        {/* Your Requested Table - Base Fare + Rate Per Km */}
                        <div className="mt-10">
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
                                    <tbody className="bg-white divide-y ">
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6  font-medium text-gray-800">MINI</td>
                                            <td className="px-6 py-1 ">
                                                <Field type="number" name="baseFare" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKm" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td>
                                            
                                            {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td> */}
                                             <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 hover:bg-gray-100">
                                            <td className="px-6 py-1 font-medium text-gray-800">SEDAN</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareSedan" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmSedan" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td>
                                            {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td> */}
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-1 font-medium text-gray-800">SUV</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareSuv" disabled className=" p-1 rounded-md bg-gray-50" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmSuv" disabled className=" p-1 rounded-md bg-gray-50" />
                                            </td>
                                            {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td> */}
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 hover:bg-gray-100">
                                            <td className="px-6 py-1 font-medium text-gray-800">MUV</td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="baseFareMVP" disabled className=" p-1 rounded-md bg-gray-50" />
                                            </td>
                                            <td className="px-6 py-1">
                                                <Field type="number" name="ratePerKmMVP" disabled className=" p-1 rounded-md bg-gray-50" />
                                            </td>
                                            {/* <td className="px-6 py-1">
                                                <Field type="number" name="ratePerMin" disabled className=" p-1  rounded-md bg-gray-50" />
                                            </td> */}
                                            <td className="px-6 py-1">
                                                <Field type="number" name="additionalMin" disabled className=" p-1  rounded-md bg-gray-50" />
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
                                                disabled
                                            />
                                        </td>
                                        <td className="border p-2">
                                            <Field
                                                type="number"
                                                name="driverFreeCancellationsPerDay"
                                                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                                disabled
                                            />
                                        </td>
                                        <td className="border p-2">
                                            <Field
                                                type="number"
                                                name="driverCancellationCharge"
                                                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                                                disabled
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <RidesPeakHourTableDetails priceData={peakHours}/>
                        <DemandPriceTable demandRules={demandRules}/>
                        <PremiumPriceDetails premiumData={premiumConfig}/>
                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className={`my-6 mx-2 ${ColorStyles.backButton}`}>
                                Back
                            </Button>
                            <Button fullWidth className={`my-6 mx-2  border-2 border-gray-400 rounded-xl ${
                                ColorStyles.editButton
                            }`} onClick={()=>navigate(`/dashboard/finance/master-price/rides-edit/${id}`)}>
                                Edit
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
            <MasterPriceLog id={id}/>
        </div>
    );
};

export default PriceDetails;
