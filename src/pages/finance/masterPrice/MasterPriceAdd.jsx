import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-tailwind/react';
import { MASTERPRICE_ADD_SCHEME } from "@/utils/validations";
import { Utils } from "@/utils/utils";

export function MasterPriceAdd() {
    const navigate = useNavigate();
    const [serviceAreas, setServiceAreas] = useState([]);
    const initialValues = {
        serviceType: '',
        zone: '',
        type: '',
        period: '',
        waitingMins: '',
        waitingCharge: '',
        additionalMinCharge:'',
        additionalMinChargeMVP:'',
        additionalMinChargeSuv:'',
        additionalMinChargeSedan:'',
        nightHoursFrom: '00:00',
        nightHoursTo: '00:00',
        nightCharge: '',
        cancelMins: '',
        cancelCharge: '',
        active: "",
        price:'',
        priceMVP:'',
        priceSuv:'',
        priceSedan:'',
        dropPriceAbove:'',
        freeExtraMinutes:'',
        bookingType:'',
    };

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

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const masterpriceList = {
                serviceType: values.serviceType,
                type: values.type,
                period: values.period ,
                price: values.price,
                priceMVP: values.priceMVP || 0,
                priceSuv: values.priceSuv || 0,
                priceSedan: values.priceSedan || 0,
                dropPrice: values.dropPrice,
                nightCharge: values.nightCharge,
                cancelCharge: Number(values.cancelCharge || 0),
                cancelMins: Utils.convertMinutesToTimeFormat(values.cancelMins || '00:00:00') ,
                waitingMins: Utils.convertMinutesToTimeFormat(values.waitingMins ||'00:00:00') ,
                waitingCharge: values.waitingCharge || 0,
                nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom || '00:00:00') ,
                nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo || '00:00:00') ,
                dropPriceAbove: values.dropPriceAbove,
                additionalMinCharge: values.additionalMinCharge || 0,
                additionalMinChargeMVP: values.additionalMinChargeMVP || 0,
                additionalMinChargeSuv: values.additionalMinChargeSuv || 0,
                additionalMinChargeSedan: values.additionalMinChargeSedan || 0,
                freeExtraMinutes: values.freeExtraMinutes || 0,
                status: 1,
                zone: values.zone,
                bookingType:values.bookingType,
            };
            if (values.type === 'Outstation') {
                masterpriceList['baseFare'] = values.baseFare || 0;
            }
            // console.log('masterpriceList -> ', masterpriceList);
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
        setSubmitting(false);
    };

    const ZONE_OPTIONS = serviceAreas.map((area) => ({
        value: area.name,
        label: area.name,
    }));

    return (
        <div className="p-4 bg-white rounded-xl">

            <h2 className="text-2xl font-bold mb-4">Add Master Price</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={MASTERPRICE_ADD_SCHEME}
                onSubmit={handleSubmit}

            >
                {({ handleSubmit, values, setFieldValue, errors, isValid, dirty }) => (
                    <Form>
                        {/* <p>Form Errors (Debug):</p><p>{JSON.stringify(errors, null, 2)}</p>
                        <pre>{JSON.stringify(errors, null, 2)}</pre>
                        <p>Package Debug: {JSON.stringify(values.package, null, 2)}</p> */}

                        <div className="p-4  grid grid-cols-2 gap-4">
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
                                <label className="text-sm font-medium text-gray-700">Service Type</label>
                                <Field as="select" name="serviceType" className="p-2 w-full rounded-md border-2 border-gray-300">
                                    <option value="">Select Service Type</option>
                                    <option value="DRIVER">Acting Driver</option>
                                </Field>
                                <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Trip Type</label>
                                <Field as="select" name="type" className="p-2 w-full rounded-md border-2 border-gray-300">
                                    <option value="">Select Trip Type</option>
                                    <option value="Local">Local</option>
                                    <option value="Outstation">Outstation</option>
                                </Field>
                                <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                            </div>
                               <div>
                                <label className="text-sm font-medium text-gray-700">Booking Type</label>
                                <Field as="select" name="bookingType" className="p-2 w-full rounded-md border-2 border-gray-300">
                                    <option value="">Select Booking Type</option>
                                    <option value="DROP ONLY">Drop Only</option>
                                    <option value="ROUND TRIP">Round Trip</option>
                                </Field>
                                <ErrorMessage name="bookingType" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Base Hours</label>
                                <div className="flex items-center gap-2">
                                     <Field type="number" name="period" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                                <ErrorMessage name="period" component="div" className="text-red-500 text-xs" />
                            </div>
                           

                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Hours</label>
                                <div className="flex items-center gap-2">
                                    <Field type="time" name="nightHoursFrom" className="p-2 rounded border-2 border-gray-300" />
                                    <span className="px-3">to</span>
                                    <Field type="time" name="nightHoursTo" className="p-2 rounded border-2 border-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Food Charges</label>
                                <div className="flex items-center gap-2">
                                     <Field type="number" name="dropPriceAbove" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                <div className="flex items-center gap-2">
                                     <Field type="number" name="freeExtraMinutes" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Waiting (mins)</label>
                                <div className="flex items-center gap-2">
                                    <Field type="number" name="waitingMins" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Waiting Charges Apply After</label>
                                <div className="flex items-center gap-2">
                                    <Field type="number" name="waitingCharge" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancel Mins</label>
                                <div className="flex items-center gap-2">
                                    <Field type="number" name="cancelMins" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancel Charge</label>
                                <div className="flex items-center gap-2">
                                    <Field type="number" name="cancelCharge" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Charge</label>
                                <div className="flex items-center gap-2">
                                    <Field type="number" name="nightCharge" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            {values?.type === 'Outstation' && ( <>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Drop-only charge</label>
                                <div className="flex items-center gap-2">
                                    <Field type="number" name="dropPrice" className="w-full text-center border-2 rounded p-2 border-gray-300" />
                                </div>
                            </div>
                            </>)}                                                                         

                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Field as="select" name="status" className="p-2 w-full rounded-md border-2 border-gray-300">
                                    <option value="">Select Status</option>
                                    <option value="Active">Active</option>
                                    <option value="In Active">In Active</option>
                                </Field>
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                        </div>
                         {values?.type === 'Local' && ( 
                        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md mt-8">
                            <table className="min-w-full bg-white border border-gray-300 text-center">
                                <thead>
                                    <tr className="bg-blue-600 text-white whitespace-nowrap">
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Car Type</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Price</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Additional Mins Price</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-100">
                                    {/* 'Mini' */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Mini</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="price" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinCharge" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                    {/* 'Sedan' */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Sedan</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="priceSedan" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinChargeSedan" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                    {/* 'Suv' */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Suv</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="priceSuv" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinChargeSuv" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                    {/* 'MVP' */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Muv</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="priceMVP" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinChargeMVP" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                         )}
                          {values?.type === 'Outstation' && ( 
                        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md mt-8">
                            <table className="min-w-full bg-white border border-gray-300 text-center">
                                <thead>
                                    <tr className="bg-blue-600 text-white whitespace-nowrap">
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Car Type</th>
                                    <th className="px-4 py-3  text-xs font-bold text-white uppercase border border-gray-300">Base Fare</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Additional Mins Price</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-100">
                                    {/* Mini */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Mini</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="price" className="w-full text-center border rounded p-2" />
                                            <ErrorMessage name="price" component="div" className="text-red-500 text-xs" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinCharge" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                    {/* Sedan */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Sedan</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="priceSedan" className="w-full text-center border rounded p-2" />
                                            <ErrorMessage name="priceSedan" component="div" className="text-red-500 text-xs" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinChargeSedan" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                    {/* Suv */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Suv</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="priceSuv" className="w-full text-center border rounded p-2" />
                                            <ErrorMessage name="priceSuv" component="div" className="text-red-500 text-xs" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinChargeSuv" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                    {/* MVP */}
                                    <tr className=" whitespace-nowrap">
                                        <td className="px-2 py-3 border">
                                            <label className="w-full font-bold text-center rounded p-2">Muv</label>
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="priceMVP" className="w-full text-center border rounded p-2" />
                                            <ErrorMessage name="priceMVP" component="div" className="text-red-500 text-xs" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinChargeMVP" className="w-full text-center border rounded p-2" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                         )}

                        {/* Buttons */}
                        <div className="flex flex-row mt-10">
                            <Button
                                fullWidth
                                onClick={() => navigate('/dashboard/finance/master-price')}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                color="blue"
                                onClick={handleSubmit}
                                disabled={!dirty || !isValid}
                                className='my-6 mx-2'
                            >
                                Submit
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
}