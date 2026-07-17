import React, { useEffect, useRef, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button,Typography } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import Select from 'react-select';
import { Utils } from '@/utils/utils';
import MasterPriceLog from "../masterPriceTable/MasterPriceLog";
import PremiumPriceDetailsEdit from '@/components/PremiumPriceDetailsEdit';
import DemandPriceEdit from './DemandPriceEdit';



const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const PRICE_SCHEMA = Yup.object().shape({
  zone: Yup.string().trim().nullable(),
  baseKm: Yup.number().min(0, 'Must be positive').required('Base KM is required'),
  baseFare: Yup.number().min(0, 'Must be positive').required('Base Fare is required'),
  ratePerKm: Yup.number().min(0, 'Must be positive').required('Rate per KM is required'),
  // ratePerMin: Yup.number().min(0, 'Must be positive').required('Rate per minute is required'),
  additionalMin: Yup.number().min(0, 'Must be positive').required('Additional min charge is required'),
  // surchargePercentage: Yup.number().min(0).required('Surcharge percentage is required'),
  nightCharge: Yup.number().min(0).required('Night charge is required'),
  waitingMins: Yup.number().min(0).required('Waiting minutes required'),
  waitingCharge: Yup.number().min(0).required('Waiting charge required'),
  cancellationMins: Yup.number().min(0).integer().required('Cancellation minutes required'),
  cancellationCharge: Yup.number().min(0).required('Cancellation charge required'),
  nightHoursFrom: Yup.string().required('Night start time is required'),
  nightHoursTo: Yup.string().required('Night end time is required'),
  status: Yup.string()
    .oneOf(['ACTIVE', 'INACTIVE'], 'Invalid status')
    .required('Status is required'),
});

const AutoMasterPriceEdit = () => {
  const [initialValues, setInitialValues] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [premiumConfig,setPremiumConfig] = useState({});
  const initialPremiumRef = useRef({});
  const [demandRules, setDemandRules] = useState([]);
  const initialDemandPriceRef = useRef([]);

  useEffect(() => {
    if (id) fetchPriceDetails(id);
  }, [id]);

  const fetchPriceDetails = async (packageId) => {
    try {
      const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${packageId}`);
      if (data?.success) {
        const priceData = data.data;

        setInitialValues({
          zone: priceData.zone || '',
          baseKm: priceData.baseKm || 0,
          baseFare: priceData.baseFare || 0,
          ratePerKm: priceData.kilometerPrice || 0,
          ratePerMin: priceData.minCharge || 0,
          extraKmPrice:priceData.extraKmPrice || 0, 
          period:priceData.type || 'Auto',
          additionalMin: priceData.additionalMinCharge || 0,
          surchargePercentage: priceData.surChargePercentage || 0,
          nightHoursFrom: convertToTimeFormat(priceData.nightHoursFrom),
          nightHoursTo: convertToTimeFormat(priceData.nightHoursTo),
          nightCharge: priceData.nightCharge || 0,
          waitingMins: Utils.convertTimeFormatToMinutes(priceData.waitingMins) || 0,
          waitingCharge: priceData.waitingCharge || 0,
          cancellationMins: Utils.convertTimeFormatToMinutes(priceData.cancelMins) || 0,
          cancellationCharge: priceData.cancelCharge || 0,
          status: Number(priceData.status) === 1 ? 'ACTIVE' : 'INACTIVE',
          freeExtraMinutes: priceData.freeExtraMinutes || 0,
        driverCancelMins: Utils.convertTimeFormatToMinutes(priceData.driverCancelMins) || 0,
        driverFreeCancellationsPerDay:priceData.driverFreeCancellationsPerDay || 0,
        driverCancellationCharge:priceData.driverCancellationCharge || 0,
        
        });

        const premium = priceData.premiumConfig || [];
        initialPremiumRef.current = JSON.parse(JSON.stringify(premium)); // deep copy
        setPremiumConfig(premium);
        setDemandRules(priceData.demandRules || []);
        initialDemandPriceRef.current = priceData.demandRules || [];
      }
    } catch (error) {
      console.error("Error fetching price details:", error);
    }
  };

      const hasPremiumConfig = () => {
      return JSON.stringify(premiumConfig) !== JSON.stringify(initialPremiumRef.current);
    }
    const hasDemandPriceChanged = () => {
      return JSON.stringify(demandRules) !== JSON.stringify(initialDemandPriceRef.current);
    }

  const convertToTimeFormat = (timeString) => {
    return timeString ? timeString.slice(0, 5) : "";
  };

  const onSubmit = async (values) => {
    try {
      const reqBody = {
        packageId: Number(id),
        zone: values.zone.trim() || '',
        period:values.type || 'Auto',
        baseKm: Number(values.baseKm),
        baseFare: Number(values.baseFare),
        kilometerPrice: Number(values.ratePerKm),
        minCharge: Number(values.ratePerMin) || 0,
        additionalMinCharge: Number(values.additionalMin),
        surChargePercentage: Number(values.surchargePercentage) || 0,
        nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom),
        nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo),
        nightCharge: Number(values.nightCharge),
        waitingMins: Utils.convertMinutesToTimeFormat(values.waitingMins),
        waitingCharge: Number(values.waitingCharge),
        cancelMins: Utils.convertMinutesToTimeFormat(values.cancellationMins),
        cancelCharge: Number(values.cancellationCharge),
        status: values.status === 'ACTIVE' ? 1 : 0,
        premiumConfig: premiumConfig || [],
        extraKmPrice: Number(values.extraKmPrice),
        freeExtraMinutes: Number(values.freeExtraMinutes) || 0,
        driverCancelMins: Utils.convertMinutesToTimeFormat(values.driverCancelMins),
        driverFreeCancellationsPerDay: Number(values.driverFreeCancellationsPerDay) || 0,
        driverCancellationCharge: Number(values.driverCancellationCharge) || 0,
        demandRules: demandRules,
      };

      const response = await ApiRequestUtils.post(API_ROUTES.AUTO_PRICE_EDIT, reqBody);

      if (response?.success) {
        navigate('/dashboard/finance/master-price');
      } else {
        console.error('Error updating data');
      }
    } catch (error) {
      console.error("Error updating price details:", error);
    }
  };

  return (
    <div className="p-4 mx-auto">
      <h2 className="text-2xl font-bold mb-4">Auto Edit Pricing Details</h2>
      <Formik initialValues={initialValues} validationSchema={PRICE_SCHEMA} onSubmit={onSubmit} enableReinitialize>
        {({ handleSubmit, setFieldValue, isValid, dirty, values }) => (
          <Form className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-sm font-medium text-gray-700">Zone</label>
                                          <Field type="text" name="zone"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                                      </div>
                                      
                          
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
                <div className='hidden'>
                    <label className="text-sm font-medium text-gray-700">Surcharge Percentage</label>
                    <Field type="number" name="surchargePercentage"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                    
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">Base Km</label>
                    <Field type="number" name="baseKm"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                    
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                    <Field type="number" name="freeExtraMinutes"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                    
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Night Charge</label>
                    <Field type="number" name="nightCharge"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Waiting Mins</label>
                    <Field type="number" name="waitingMins"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Waiting Charge</label>
                    <Field type="number" name="waitingCharge"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Cancellation Mins</label>
                    <Field type="number" name="cancellationMins"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Cancellation Charge</label>
                    <Field type="number" name="cancellationCharge"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">Addtional Km Charge</label>
                    <Field type="number" name="extraKmPrice"  className="mt-1 p-3 w-full rounded-md border-gray-300 bg-gray-100" />
                </div>
                <div className="lg:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Night Hours</label>
                    <div className="flex items-center gap-3 mt-1">
                        <Field type="time" name="nightHoursFrom"  className="p-3 rounded-md border-gray-300 bg-gray-100" />
                        <span className="text-gray-600">to</span>
                        <Field type="time" name="nightHoursTo"  className="p-3 rounded-md border-gray-300 bg-gray-100" />
                    </div>
                </div>
                              </div>
                                        <div className="mt-10">
                                          <div className="overflow-x-auto rounded-lg shadow border border-gray-300">
                                              <table className="min-w-full">
                                                  <thead className="bg-blue-600">
                                                      <tr>
                                                         
                                                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Base Fare</th>
                                                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Rate Per Km</th>
                                                          {/* <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Rate Per Min</th> */}
                                                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Additional Min Charge</th>
                                                      </tr>
                                                  </thead>
                                                  <tbody className="bg-white divide-y ">
                                                      <tr className="hover:bg-gray-50">
                                                          
                                                          <td className="px-6 py-1 ">
                                                              <Field type="number" name="baseFare"  className=" p-1  rounded-md bg-gray-50" />
                                                          </td>
                                                          <td className="px-6 py-1">
                                                              <Field type="number" name="ratePerKm"  className=" p-1  rounded-md bg-gray-50" />
                                                          </td>
                                                          
                                                          <td className="px-6 py-1 hidden">
                                                              <Field type="number" name="ratePerMin"  className=" p-1  rounded-md bg-gray-50" />
                                                          </td>
                                                           <td className="px-6 py-1">
                                                              <Field type="number" name="additionalMin"  className=" p-1  rounded-md bg-gray-50" />
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
            <PremiumPriceDetailsEdit initialPremiumData={premiumConfig} onUpdate={(data)=> setPremiumConfig(data) } />
            <DemandPriceEdit demandRules={demandRules} setDemandRules={setDemandRules} />
            <div className="flex flex-row">
              <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                Cancel
              </Button>
              <Button fullWidth color="blue" type="submit" disabled={!(dirty || hasPremiumConfig() || hasDemandPriceChanged()) || !isValid} className="my-6 mx-2">
                Save Changes
              </Button>
            </div>
          </Form>
        )}
      </Formik>


      <div className="mt-12">
        <MasterPriceLog id={id} />
      </div>
    </div>
  );
};

export default AutoMasterPriceEdit;
