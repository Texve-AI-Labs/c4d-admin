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
        dropOnly: '',
        additionalMins: '',
        nightHoursFrom: '00:00',
        nightHoursTo: '00:00',
        nightCharge: '',
        cancelMins: '',
        cancelCharge: '',
        active: "",
        extraPrice:'',
        kilometer:'',
        dropPriceAbove:'',
        freeExtraMinutes:'',
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
                dropPrice: values.dropPrice,
                nightCharge: values.nightCharge,
                cancelCharge: values.cancelCharge ||0,
                cancelMins: Utils.convertMinutesToTimeFormat(values.cancelMins || '00:00:00') ,
                waitingMins: Utils.convertMinutesToTimeFormat(values.waitingMins ||'00:00:00') ,
                waitingCharge: values.waitingCharge || 0,
                nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom || '00:00:00') ,
                nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo || '00:00:00') ,
                extraPrice: values.extraPrice || 0,
                kilometer: values.kilometer,
                dropPriceAbove: values.dropPriceAbove,
                additionalMinCharge: values.additionalMinCharge || 0,
                freeExtraMinutes: values.freeExtraMinutes || 0,
                status: 1,
                extraKmPrice:values.extraKmPrice,
                zone: values.zone,
            };
            if (values.type === 'Outstation') {
                masterpriceList['baseFare'] = values.baseFare || 0;
                masterpriceList['kilometer'] = values.kilometer;
                masterpriceList['extraKmPrice'] = values.extraKmPrice;
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
        setSubmitting(false);
    };

    const ZONE_OPTIONS = serviceAreas.map((area) => ({
        value: area.name,
        label: area.name,
    }));

    return (
        <div className="p-4">

            <h2 className="text-2xl font-bold mb-4">Add Master Price List</h2>
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

                        <div className="p-4 bg-blue-gray-100 grid grid-cols-2 gap-4">
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
                                    {/* <option value="RIDES">Rides</option>
                                    <option value="RENTAL">Rental</option> */}
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
                                <label className="text-sm font-medium text-gray-700">Night Hours</label>
                                <div className="flex items-center gap-2">
                                    <Field type="time" name="nightHoursFrom" className="p-2 rounded border-gray-300" />
                                    <span className="px-3">to</span>
                                    <Field type="time" name="nightHoursTo" className="p-2 rounded border-gray-300" />
                                </div>
                            </div>
                            {values?.serviceType === 'DRIVER' &&
                            <div>
                                <label className="text-sm font-medium text-gray-700">Food Charges</label>
                                <div className="flex items-center gap-2">
                                     <Field type="number" name="dropPriceAbove" className="w-full text-center border rounded p-2" />
                                </div>
                            </div>
                            }
                            
                            <div>
                                <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                <div className="flex items-center gap-2">
                                     <Field type="number" name="freeExtraMinutes" className="w-full text-center border rounded p-2" />
                                </div>
                            </div>
                            

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

                        {/* Same Beautiful Table as Edit Page */}
                         {values?.type === 'Local' && ( 
                        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md mt-8">
                            <table className="min-w-full bg-white border border-gray-300 text-center">
                                <thead>
                                    <tr className="bg-blue-600 text-white">
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Package (Hrs/Kms)</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Price</th>
                                        {/* <th className="px-4 py-3 text-xs font-bold uppercase border border-gray-300">Price (MUV)</th> */}
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
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="period" className="w-full text-center border rounded p-2"  />
                                            <ErrorMessage name="period" component="div" className="text-red-500 text-xs" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="price" className="w-full text-center border rounded p-2" />
                                            <ErrorMessage name="price" component="div" className="text-red-500 text-xs" />
                                        </td>
                                        {/* <td className="px-2 py-3 border">
                                            <Field type="number" name="priceMVP" className="w-full text-center border rounded p-2" />
                                            <ErrorMessage name="priceMVP" component="div" className="text-red-500 text-xs" />
                                        </td> */}
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="kilometer" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinCharge" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="extraPrice" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="extraKmPrice" className="w-full text-center border rounded p-2" />
                                        </td>

                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="waitingMins" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="waitingCharge" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="nightCharge" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="cancelMins" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="cancelCharge" className="w-full text-center border rounded p-2" />
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
                                    <tr className="bg-blue-600 text-white">
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
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="period" className="w-full text-center border rounded p-2"  />
                                            <ErrorMessage name="period" component="div" className="text-red-500 text-xs" />
                                        </td>
                                         <td className="px-2 py-3 border">
                                            <Field type="number" name="kilometer" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="price" className="w-full text-center border rounded p-2" />
                                            <ErrorMessage name="price" component="div" className="text-red-500 text-xs" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="additionalMinCharge" className="w-full text-center border rounded p-2" />
                                        </td>
                                        
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="extraKmPrice" className="w-full text-center border rounded p-2" />
                                        </td>

                                        {/* <td className="px-2 py-3 border">
                                            <Field type="number" name="dropPriceAbove" className="w-full text-center border rounded p-2" />
                                        </td> */}
                                       

                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="nightCharge" className="w-full text-center border rounded p-2" />
                                        </td>
                                        <td className="px-2 py-3 border">
                                            <Field type="number" name="dropPrice" className="w-full text-center border rounded p-2" />
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
