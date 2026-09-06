import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@material-tailwind/react';
import Select from 'react-select';
import { Utils } from "@/utils/utils";
import MasterPriceLog from "../masterPriceTable/MasterPriceLog";
import DemandPriceTable from "../masterPriceTable/DemandPrice";

export function MasterPriceDetailsAndEdit() {
    const navigate = useNavigate();
    const [masterPriceDetails, setMasterPriceDetails] = useState();
    const [initialValues, setInitialValues] = useState({});
    const [demandRules, setDemandRules] = useState([]);
    const { id } = useParams();
    
    useEffect(() => {
        if (id) {
            fetchItem(id);
        }
    }, [id]);
    const fetchItem = async (itemId) => {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_PACKAGE_DETAIL + `${itemId}`);
        if (data?.success) {
            setInitialValues({
                serviceType: data?.data?.serviceType || '',
                zone: data?.data?.zone || '',
                type: data?.data?.type || '',
                period: data?.data?.period || '',
                price: data.data.price,
                priceMVP: data.data.priceMVP || '',
                priceSuv: data.data.priceSuv || '',
                priceSedan: data.data.priceSedan || '',
                waitingMins: Utils.convertTimeFormatToMinutes(data?.data?.waitingMins) || '',
                waitingCharge: data?.data?.waitingCharge || '',
                dropPrice: data?.data?.dropPrice || '',
                additionalMinCharge: data?.data?.additionalMinCharge || '',
                additionalMinChargeMVP: data?.data?.additionalMinChargeMVP || '',
                additionalMinChargeSuv: data?.data?.additionalMinChargeSuv || '',
                additionalMinChargeSedan: data?.data?.additionalMinChargeSedan || '',
                nightHoursFrom: data?.data?.nightHoursFrom || '00:00',
                nightHoursTo: data?.data?.nightHoursTo || '00:00',
                nightCharge: data?.data?.nightCharge || '',
                cancelMins: Utils.convertTimeFormatToMinutes(data?.data?.cancelMins) || '',
                cancelCharge: data?.data?.cancelCharge || '',
                freeExtraMinutes:data?.data?.freeExtraMinutes || 0,

                baseFare:data?.data?.baseFare || '',
                dropPriceAbove:data?.data?.dropPriceAbove || 0,
                bookingType: data?.data?.bookingType || 'DROP ONLY',

                status: Number(data.data.status) === 1 ? "ACTIVE" : "INACTIVE",
            })
            setDemandRules(data?.data?.demandRules || []);
        }
        setMasterPriceDetails(data?.data);
    };

    const handleSubmit = async (values) => {
        try {
            const masterpriceList = {
                serviceType: values.serviceType,
                type: values.type,
                period: values.period,
                price: values.price,
                priceMVP: values.priceMVP,
                priceSuv: values.priceSuv,
                priceSedan: values.priceSedan,
                dropPrice: values.dropPrice,
                nightCharge: values.nightCharge,
                cancelCharge: Number(values.cancelCharge || 0),
                cancelMins: Utils.convertMinutesToTimeFormat(values.cancelMins),
                waitingMins: Utils.convertMinutesToTimeFormat(values.waitingMins),
                waitingCharge: values.waitingCharge,
                nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom),
                nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo),
                additionalMinCharge: values.additionalMinCharge,
                additionalMinChargeMVP: values.additionalMinChargeMVP,
                additionalMinChargeSuv: values.additionalMinChargeSuv,
                additionalMinChargeSedan: values.additionalMinChargeSedan,
                status: values.status === 'Active' ? 1 : 0,
                dropPriceAbove:values.dropPriceAbove,
                zone: values.zone,
                freeExtraMinutes:values.freeExtraMinutes || 0,
                bookingType: values.bookingType || 'DROP ONLY',
            };
            if (values.type === 'Outstation') {
                masterpriceList['baseFare'] = values.baseFare;
            }
            console.log('masterpriceList -> ', masterpriceList);
            let data;

            if (values.type === 'Local') {
                data = await ApiRequestUtils.post(API_ROUTES.ACTING_DRIVER_ADD_LOCAL_PACKAGE, masterpriceList);
            } else {
                data = await ApiRequestUtils.post(API_ROUTES.ACTING_DRIVER_ADD_OUTSTAION_PACKAGE, masterpriceList);
            }
            if (data?.success) {
                navigate('/dashboard/finance/master-price');
            }
        } catch (err) {
            console.log('ERROR IN SUBMIT :', err)
        }
    };
    return (
        <div className="p-4 bg-white">

            <h2 className="text-2xl font-bold mb-4">Master Price Details</h2>
            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ handleSubmit, values, setFieldValue, errors, isValid, dirty }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Field
                                    type="text"
                                    name="zone"
                                    disabled
                                    className="p-2 w-full rounded-md border-gray-300 bg-gray-200"
                                />
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Service Type</label>
                                <Field type="string" name="serviceType" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Trip Type</label>
                                <Field type="string" name="type" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Booking Type</label>
                                <Field type="string" name="bookingType" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Base Hours</label>
                                <Field type="number" name="period" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
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
                                        disabled

                                    />
                                    <span className="px-3 py-2 bg-gray-100 border-t border-b border-gray-300">to</span>
                                    <Field
                                        type="time"
                                        name="nightHoursTo"
                                        min="05:00"
                                        max="08:00"
                                        className="p-2 w-full rounded-r-md border-gray-300 shadow-sm"
                                        disabled

                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Food Charges</label>
                                <Field type="number" name="dropPriceAbove" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                <Field type="number" name="freeExtraMinutes" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Waiting Time</label>
                                <Field type="number" name="waitingMins" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Waiting Charges Apply After</label>
                                <Field type="number" name="waitingCharge" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Mins</label>
                                <Field type="number" name="cancelMins" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Charge</label>
                                <Field type="number" name="cancelCharge" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Charge</label>
                                <Field type="number" name="nightCharge" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            {values?.type === 'Outstation' && ( <>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Drop-only charge</label>
                                <Field type="number" name="dropPrice" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                            </div>
                            </>)}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Field type="string" name="status" disabled className="p-2 w-full rounded-md border-gray-300 bg-gray-200" />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                            
                        </div>
                        {values?.type === 'Local' && (
                        <div className="mt-8 overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                            <table className="min-w-full bg-white border border-gray-300 text-center">
                            <thead className="text-center whitespace-nowrap">
                                <tr className="bg-blue-600">
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Car Type</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Base Fare</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Additional Mins price</th>
                                </tr>
                            </thead>

                            <tbody className=" whitespace-nowrap">
                                {/* Mini */}
                                <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Mini</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.price || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinCharge || '-'}</td>
                                </tr>
                                {/* Sedan */}
                                <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Sedan</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.priceSedan || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinChargeSedan || '-'}</td>
                                </tr>
                                {/* Suv */}
                                <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Suv</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.priceSuv || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinChargeSuv || '-'}</td>
                                </tr>
                                {/* MVP */}
                                  <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Muv</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.priceMVP || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinChargeMVP || '-'}</td>
                                </tr>
                            </tbody>
                            </table>


                            </div>
                        )} 
                        {values?.type === 'Outstation' && (
                            <div className="mt-8 overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                            <table className="min-w-full bg-white border border-gray-300 text-center">
                            <thead className="text-center  whitespace-nowrap">
                                <tr className="bg-blue-600">
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Car Type</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Base Fare</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Additional Mins price</th>
                                   
                                </tr>
                            </thead>

                            <tbody className=" whitespace-nowrap">
                                <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Mini</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.price || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinCharge || '-'}</td>
                                   
                                </tr>
                                    <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Sedan</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.priceSedan || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinChargeSedan || '-'}</td>
                                </tr>
                                {/* Suv */}
                                <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Suv</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.priceSuv || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinChargeSuv || '-'}</td>
                                </tr>
                                {/* MVP */}
                                  <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    <td className="px-4 py-4 border border-gray-300">Muv</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.priceMVP || "-"}</td>
                                    <td className="px-4 py-4 border border-gray-300">{values.additionalMinChargeMVP || '-'}</td>
                                </tr>
                            </tbody>
                            </table>


                            </div>
                        )}
                        {(values?.serviceType === 'AUTO' || values?.serviceType === 'DRIVER') && (
                            <DemandPriceTable demandRules={demandRules} />
                        )}
                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className={`my-6 mx-2 ${ColorStyles.backButton}`}>
                                Back
                            </Button>
                            <Button fullWidth className={`my-6 mx-2  border-2 border-gray-400 rounded-xl ${ColorStyles.editButton}`} onClick={() => navigate(`/dashboard/finance/master-price/driver-edit/${id}`)}>
                                Edit
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
            <MasterPriceLog id={id}/>
        </div>
    );
}