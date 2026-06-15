import React, { useEffect, useRef, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import Select from 'react-select';
import DemandPriceEdit from './DemandPriceEdit';

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

const DRIVER_SCHEMA = Yup.object().shape({
    zone: Yup.string().required('Zone is required'),
    serviceType: Yup.string().required('Service Type is required'),
    type: Yup.string().required('Type is required'),
    period: Yup.number().required('Period is required'),
    price: Yup.number().required('Price is required'),
    priceMVP: Yup.number().required('Price MUV is required'),
    // dropPrice: Yup.number().required('Drop Price is required'),
    nightCharge: Yup.number().required('Night Charge is required'),
    cancelCharge: Yup.number().required('Cancel Charge is required'),
    extraPrice: Yup.number().required('Extra Price is required'),
    status: Yup.string().required('Status is required'),

});

const DriverMasterPriceTableEdit = () => {
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const navigate = useNavigate();
    const [demandRules, setDemandRules] = useState([]);
    const initialDemandPriceRef = useRef([]);

    useEffect(() => {
        fetchDriverDetails(id);
        console.log(id);
    }, [id]);


    const fetchDriverDetails = async (id) => {
        if (!id) return;
        try {
            const data = await ApiRequestUtils.get(API_ROUTES.GET_PACKAGE_DETAIL + `${id}`);
            if (data?.success) {
                setInitialValues({
                    packageId: data?.data?.id,

                    serviceType: data.data.serviceType,
                    type: data.data.type,
                    period: data.data.period,
                    price: data.data.price,
                    priceMVP: data.data.priceMVP,

                    waitingMins: Utils.convertTimeFormatToMinutes(data.data.waitingMins),
                    waitingCharge: data.data.waitingCharge,
                    dropPrice: data.data.dropPrice,
                    additionalMinCharge: data.data.additionalMinCharge,
                    freeExtraMinutes: data.data.freeExtraMinutes,

                    extraPrice: data.data.extraPrice,
                    nightHoursFrom: convertToTimeFormat(data.data.nightHoursFrom) || '00:00',
                    nightHoursTo: convertToTimeFormat(data.data.nightHoursTo) || '00:00',
                    nightCharge: data.data.nightCharge,

                    cancelMins: Utils.convertTimeFormatToMinutes(data.data.cancelMins),
                    cancelCharge: data.data.cancelCharge,

                    baseFare:data.data.baseFare,
                    kilometer:data.data.kilometer,
                    extraKmPrice:data.data.extraKmPrice,
                    dropPriceAbove:data.data.dropPriceAbove,

                    zone : data.data.zone,

                    status: Number(data.data.status) === 1 ? "ACTIVE" : "INACTIVE",
                });
                setDemandRules(data.data.demandRules || []);
                initialDemandPriceRef.current = data.data.demandRules || [];
            }
            
        } catch (error) {
            console.error("Error fetching price details:", error);
        } finally {
            setLoading(false);
        }
    };

    const convertToTimeFormat = (timeString) => {
        return timeString ? timeString.slice(0, 5) : "";
    };
    const hasDemandPriceChanged = () => {
        return JSON.stringify(demandRules) !== JSON.stringify(initialDemandPriceRef.current);
    };
    const onSubmit = async (values) => {
        try {
            const reqdata = {
                packageId: Number(id),
                zone: String(values.zone),
                serviceType: String(values.serviceType),
                type: String(values.type),
                period: Number(values.period),
                priceMVP: Number(values.priceMVP),
                price: Number(values.price),

                waitingMins: Utils.convertMinutesToTimeFormat(values.waitingMins),
                waitingCharge: Number(values.waitingCharge),
                additionalMinCharge: Number(values.additionalMinCharge),
                freeExtraMinutes: Number(values.freeExtraMinutes),
                extraPrice: Number(values.extraPrice),
                extraKmPrice:Number(values.extraKmPrice),
                dropPrice: Number(values.dropPrice),

                nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom),
                nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo),
                nightCharge: Number(values.nightCharge),

                cancelMins: Utils.convertMinutesToTimeFormat(values.cancelMins),
                cancelCharge: Number(values.cancelCharge),
                dropPriceAbove:Number(values.dropPriceAbove),
                kilometer : Number(values.kilometer),

                status: values.status === 'ACTIVE' ? 1 : 0,
                demandRules: demandRules,
            };

            // Include Outstation-specific fields
            if (values.type === 'Outstation') {
                reqdata.baseFare = Number(values.baseFare);
                reqdata.kilometer = Number(values.kilometer);
                reqdata.extraKmPrice = Number(values.extraKmPrice);
            }

            let response;
            if (values.type === 'Local') {
                response = await ApiRequestUtils.post(API_ROUTES.ACTING_DRIVER_EDIT_LOCAL_PACKAGE, reqdata);
            } else if (values.type === 'Outstation') {
                response = await ApiRequestUtils.post(API_ROUTES.ACTING_DRIVER_EDIT_OUTSTATION_PACKAGE, reqdata);
            }

            if (response?.success) {
                navigate(`/dashboard/finance/master-price/`);
            }
        } catch (error) {
            console.error("Error updating price details:", error);
        }
    };

    // Loading state
    if (loading || !initialValues) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 mx-auto">
                <h2 className="text-2xl font-bold mb-4">Edit Driver Details</h2>

                <Formik
                    initialValues={initialValues}
                    onSubmit={onSubmit}
                    validationSchema={DRIVER_SCHEMA}
                    enableReinitialize >
                    {({ handleSubmit, isValid, dirty, errors, setFieldValue, values }) => (
                        <Form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* <pre>{JSON.stringify(errors, null, 2)}</pre> */}
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
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field type="string" name="serviceType" disabled className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                    <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Trip Type</label>
                                    <Field type="text" name="type" disabled className="p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-200" />
                            </div>
 

                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Hours</label>
                                <div className="flex items-center gap-2">
                                    <Field type="time" name="nightHoursFrom" className="p-2 rounded border" />
                                    <span>to</span>
                                    <Field type="time" name="nightHoursTo" className="p-2 rounded border" />
                                </div>
                            </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Food Charges</label>
                                    <Field type="number" name="dropPriceAbove" className="p-2 w-full rounded-md" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                    <Field type="number" name="freeExtraMinutes" className="p-2 w-full rounded-md" />
                                </div>
                             {/* Outstation Base Fare */}
                       
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Select
                                    options={STATUS_OPTIONS}
                                    onChange={(opt) => setFieldValue('status', opt.value)}
                                    value={STATUS_OPTIONS.find(o => o.value === values.status)}
                                    placeholder="Select Status"
                                    className="w-full"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-xs" />
                            </div>
                        </div>

                        {/* Editable Table */}
                         {values?.type === 'Local' && (
                        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md">
                            <table className="min-w-full bg-white border border-gray-300 text-center">
                                <thead>
                                    <tr className="bg-blue-600 text-white">
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Package </th>
                                        <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Price</th>
                                        {/* <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Price(MUV)</th> */}
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Kilometer</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Additional Mins</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Additional Mins Price</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Extra KM Price</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Free Waiting (mins)</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Waiting Charge</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Night Charge</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Cancel Mins</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Cancel Charge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-2 py-3 border"><Field type="number" name="period" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="price" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="priceMVP" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="kilometer" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="additionalMinCharge" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="extraPrice" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="extraKmPrice" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="waitingMins" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="waitingCharge" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="nightCharge" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="cancelMins" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="cancelCharge" className="w-full text-center border rounded p-1" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                         )}
                         {values?.type === 'Outstation' && (
                            <div className="mt-8 overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                            <table className="min-w-full bg-white border border-gray-300 text-center">
                            <thead className="text-center">
                                <tr className="bg-blue-600">
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Base Hours</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Base KM</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Base Fare</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Extra hour charge</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Extra KM rate</th>
                                   
                                    {/* <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Food Charges</th> */}
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Night Charges</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Drop-only charge</th>
                                   
                                </tr>
                            </thead>

                            <tbody>
                                <tr className="bg-white hover:bg-gray-50 transition-all text-center text-gray-800 font-medium">
                                    
                                    <td className="px-2 py-3 border"><Field type="number" name="period" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="kilometer" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="price" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="additionalMinCharge" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="extraKmPrice" className="w-full text-center border rounded p-1" /></td>
                                        {/* <td className="px-2 py-3 border"><Field type="number" name="dropPriceAbove" className="w-full text-center border rounded p-1" /></td> */}
                                        <td className="px-2 py-3 border"><Field type="number" name="nightCharge" className="w-full text-center border rounded p-1" /></td>
                                        <td className="px-2 py-3 border"><Field type="number" name="dropPrice" className="w-full text-center border rounded p-1" /></td>
                                   
                                </tr>
                            </tbody>
                            </table>


                            </div>
                        )}

                       

                        {/* Buttons */}
                            <DemandPriceEdit demandRules={demandRules} setDemandRules={setDemandRules} />
                            <div className="flex flex-row">
                                <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className={`my-6 mx-2 ${ColorStyles.backButton}`}>
                                    Back
                                </Button>
                                <Button fullWidth color="blue" onClick={handleSubmit} disabled={!(dirty || hasDemandPriceChanged()) || !isValid} className="my-6 mx-2">
                                    Save Changes
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

        </>
    )
}
export default DriverMasterPriceTableEdit;
