import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Alert, Button, Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Utils } from '@/utils/utils';

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

const PRICE_SCHEMA = Yup.object().shape({
    zone: Yup.string().required('Zone is required'),
    // carType: Yup.string().required('Cab Type is required'),
    // serviceType: Yup.string().required('Service Type is required'),
    type: Yup.string().required('Trip Type is required'),
    period: Yup.string().required('Package Type is required'),
    baseKm: Yup.number().required('Base Km is required'),
    baseFare: Yup.number().required('Base Fare is required'),
    kilometer: Yup.number().required('Kilometer is required'),
    kilometerPrice: Yup.number().required('Kilometer Rate is required'),

    // kilometerRoundPrice: Yup.number().required('kilometer Round Price  is required'),
    // kilometerRoundPriceMVP: Yup.number().required('kilometer Round Price MVP  is required'),
    // kilometerRoundPriceSuv: Yup.number().required('kilometer Round Price Suv  is required'),
    // kilometerRoundPriceSedan: Yup.number().required('kilometer Round Price Sedan is required'),
    
    // extraKmPrice: Yup.number().required('Additional Kilometer Price is required'),
    additionalMinCharge: Yup.number().required('Additional Min is required'),
    // tollCharge: Yup.number().required('Toll Charge is required'),
    // driverCharge: Yup.number().required('Driver Charge is required'),
    nightCharge: Yup.number().required('Night Charge is required'),
    cancelMins: Yup.number().required('Cancellation Mins is required'),
    cancelCharge: Yup.number().required('Cancellation Charge is required'),
    waitingMins: Yup.number().required('Waiting Mins is required'),
    waitingCharge: Yup.number().required('Waiting Charge is required'),
    status: Yup.string().required('Status is required'),
});

const RentalsPriceMasterAdd = () => {
    const [alert, setAlert] = useState(false);
    const [zones, setZones] = useState([]);
    const navigate = useNavigate();

useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
        if (response?.success) {
          const filteredAreas = response.data
            .filter((area) => area.type === 'Service Area')
            .map((area) => ({
              value: area.id,
              label: area.name, // Use original name without transformation
            }));
          setZones(filteredAreas);
        }
      } catch (error) {
        console.error('Error fetching zones:', error);
      }
    };
    fetchZones();
  }, []);

    const initialValues = {
        // carType: '',
        zone: '',
        serviceType: '',
        type: '',
        period: '',
        baseKm: '',
        kilometer: '',
        tollCharge: '',
        driverCharge: '',
        cancelMins: Utils.convertMinutesToTimeFormat || 0,
        cancelCharge: '',
        nightCharge: '',
        status: 'ACTIVE',
        waitingMins: Utils.convertMinutesToTimeFormat || 0,
        waitingCharge: '',

        // baseFare Drop only and Round Trip
        baseFare: '',
        baseFareMVP: '',
        baseFareSuv: '',
        baseFareSedan: '',

        // Price Drop only and Round Trip
        price: '',
        priceMVP: '',
        priceSuv: '',
        priceSedan: '',

        // kilometerPrice Drop only
        kilometerPrice: '',
        kilometerPriceMVP: '',
        kilometerPriceSuv: '',
        kilometerPriceSedan: '',

        // kilometerPrice Round Trip
        kilometerRoundPrice: '',
        kilometerRoundPriceMVP: '',
        kilometerRoundPriceSuv: '',
        kilometerRoundPriceSedan: '',

        // additionalMinCharge Drop and Round Trip
        freeExtraMinutes:'',
        additionalMinCharge: '',
        additionalMinChargeMVP: '',
        additionalMinChargeSuv: '',
        additionalMinChargeSedan: '',

        // extraKilometerPrice Drop 
        extraKilometerPrice: '',
        extraKilometerPriceMVP: '',
        extraKilometerPriceSuv: '',
        extraKilometerPriceSedan: '',

        // extraKilometerRoundPrice Round Trip
        extraKilometerRoundPrice: '',
        extraKilometerRoundPriceMVP: '',
        extraKilometerRoundPriceSuv: '',
        extraKilometerRoundPriceSedan: '',

        // acKilometerPrice Drop only
        acKilometerPrice: "",
        acKilometerPriceMVP: "",
        acKilometerPriceSuv: "",
        acKilometerPriceSedan: "",

        //acKilometerRoundPrice Round Trip
        acKilometerRoundPrice: "",
        acKilometerRoundPriceMVP: "",
        acKilometerRoundPriceSuv: "",
        acKilometerRoundPriceSedan: "",

        //acExtraKilometerPrice Drop Only
        acExtraKilometerPrice: "",
        acExtraKilometerPriceMVP: "",
        acExtraKilometerPriceSuv: "",
        acExtraKilometerPriceSedan: "",

        //acExtraKilometerRoundPrice Round Trip
        acExtraKilometerRoundPrice: "",
        acExtraKilometerRoundPriceMVP: "",
        acExtraKilometerRoundPriceSuv: "",
        acExtraKilometerRoundPriceSedan: "",
        driverCancelMins:"",
        driverFreeCancellationsPerDay:"",
        driverCancellationCharge:"",
    };

    const onSubmit = async (values, { setSubmitting }) => {
        try {
            const reqBody = {
                // 'carType': values.carType,
                 'zone': String(values.zone),
                'serviceType': 'RENTAL',
                'type': String(values.type),
                'period': String(values.period),
                'baseKm': Number(values.baseKm),
                'baseFare': Number(values.baseFare),
                'kilometer': Number(values.kilometer),
                'kilometerPrice': Number(values.kilometerPrice),

                'kilometerRoundPrice': values?. type === 'Outstation' ? values.kilometerRoundPrice : 0,
                'kilometerRoundPriceMVP': values?. type === 'Outstation' ? values.kilometerRoundPriceMVP : 0,
                'kilometerRoundPriceSuv': values?. type === 'Outstation' ? values.kilometerRoundPriceSuv : 0,
                'kilometerRoundPriceSedan': values?. type === 'Outstation' ? values.kilometerRoundPriceSedan : 0,

                'extraKilometerPrice': values?.type === 'Outstation' ? values.extraKilometerPrice : 0,
                'extraKilometerPriceMVP': values?.type === 'Outstation' ? values.extraKilometerPriceMVP : 0,
                'extraKilometerPriceSuv': values?.type === 'Outstation' ? values.extraKilometerPriceSuv : 0,
                'extraKilometerPriceSedan': values?.type === 'Outstation' ? values.extraKilometerPriceSedan : 0,

                'extraKilometerRoundPrice': values?.type === 'Outstation' ? values.extraKilometerRoundPrice : 0,
                'extraKilometerRoundPriceMVP': values?.type === 'Outstation' ? values.extraKilometerRoundPriceMVP : 0,
                'extraKilometerRoundPriceSuv': values?.type === 'Outstation' ? values.extraKilometerRoundPriceSuv : 0,
                'extraKilometerRoundPriceSedan': values?.type === 'Outstation' ? values.extraKilometerRoundPriceSedan : 0,

                'acKilometerRoundPrice': values?.type === 'Outstation' ? values.acKilometerRoundPrice : 0,
                'acKilometerRoundPriceMVP': values?.type === 'Outstation' ? values.acKilometerRoundPriceMVP : 0,
                'acKilometerRoundPriceSuv': values?.type === 'Outstation' ? values.acKilometerRoundPriceSuv : 0,
                'acKilometerRoundPriceSedan': values?.type === 'Outstation' ? values.acKilometerRoundPriceSedan : 0,

                'acExtraKilometerPrice': values?.type === 'Outstation' ? values.acExtraKilometerPrice : 0,
                'acExtraKilometerPriceMVP': values?.type === 'Outstation' ? values.acExtraKilometerPriceMVP : 0,
                'acExtraKilometerPriceSuv': values?.type === 'Outstation' ? values.acExtraKilometerPriceSuv : 0,
                'acExtraKilometerPriceSedan': values?.type === 'Outstation' ? values.acExtraKilometerPriceSedan : 0,

                'acExtraKilometerRoundPrice': values?.type === 'Outstation' ? values.acExtraKilometerRoundPrice : 0,
                'acExtraKilometerRoundPriceMVP': values?.type === 'Outstation' ? values.acExtraKilometerRoundPriceMVP : 0,
                'acExtraKilometerRoundPriceSuv': values?.type === 'Outstation' ? values.acExtraKilometerRoundPriceSuv : 0,
                'acExtraKilometerRoundPriceSedan': values?.type === 'Outstation' ? values.acExtraKilometerRoundPriceSedan : 0,

                'price': values?.type !== 'Outstation' ? values.price : '',
                'priceMVP':values?.type !== 'Outstation' ? values.priceMVP : '',
                'priceSuv':values?.type !== 'Outstation' ? values.priceSuv : '',
                'priceSedan':values?.type !== 'Outstation' ? values.priceSedan : '',

                'additionalMinCharge': Number(values.additionalMinCharge),
                'freeExtraMinutes': Number(values.freeExtraMinutes),
                'tollCharge': values?.type === 'Outstation' ? values.tollCharge : 0,
                'driverCharge': values?.type === 'Outstation' ? values.driverCharge : 0,
                'nightCharge': Number(values.nightCharge),
                'nightHoursFrom': Utils.formatTimeWithSeconds(values.nightHoursFrom),
                'nightHoursTo': Utils.formatTimeWithSeconds(values.nightHoursTo),
                'status': values.status === "ACTIVE" ? 1 : 0,
                "cancelMins": Utils.convertMinutesToTimeFormat(values.cancelMins),
                "cancelCharge": Number(values.cancelCharge),
                "waitingMins": Utils.convertMinutesToTimeFormat(values.waitingMins),
                "waitingCharge": Number(values.waitingCharge),
                'extraKmPrice': Number(values.extraKmPrice),
                "price":Number(values.price),
                "priceMVP":Number(values.priceMVP),
                "priceSuv":Number(values.priceSuv),
                "priceSedan":Number(values.priceSedan),
                "baseFareMVP":Number(values.baseFareMVP),
                "baseFareSuv":Number(values.baseFareSuv),
                "baseFareSedan":Number(values.baseFareSedan),
                "kilometerPriceMVP":Number(values.kilometerPriceMVP),
                "kilometerPriceSuv":Number(values.kilometerPriceSuv),
                "kilometerPriceSedan":Number(values.kilometerPriceSedan),
                "additionalMinChargeMVP":Number(values.additionalMinChargeMVP),
                "additionalMinChargeSuv":Number(values.additionalMinChargeSuv),
                "additionalMinChargeSedan":Number(values.additionalMinChargeSedan),

                "acKilometerPrice": Number(values.acKilometerPrice),
                "acKilometerPriceMVP": Number(values.acKilometerPriceMVP),
                "acKilometerPriceSuv": Number(values.acKilometerPriceSuv),
                "acKilometerPriceSedan": Number(values.acKilometerPriceSedan),
              "driverCancelMins": Utils.convertMinutesToTimeFormat(values.driverCancelMins),
              "driverFreeCancellationsPerDay": Number(values.driverFreeCancellationsPerDay),
              "driverCancellationCharge": Number(values.driverCancellationCharge),
            };
            const data = await ApiRequestUtils.post(API_ROUTES.ADD_RENTALS_PRICE_TABLE, reqBody);
            if (data?.success) {
                navigate('/dashboard/finance/master-price');
            }
        } catch (error) {
            console.error('Error saving price details:', error);
            setAlert({ message: 'Error saving data', color: 'red' });
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto">
            {alert && (
                <div className='mb-2'>
                    <Alert color={alert.color} className='py-3 px-6 rounded-xl'>
                        {alert.message}
                    </Alert>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Add Rentals Price Details</h2>
            <Formik initialValues={initialValues} validationSchema={PRICE_SCHEMA} onSubmit={onSubmit} enableReinitialize>
                {({ handleSubmit, setFieldValue, isValid, dirty, errors, values }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Select
                                  options={zones}
                                  onChange={(selectedOption) => setFieldValue('zone', selectedOption ? selectedOption.value : '')}
                                  placeholder="Select Zone"
                                  className="w-full"
                                />
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
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
                                <label className="text-sm font-medium text-gray-700">Package Type</label>
                                <Field as="select" name="period" className="p-2 w-full rounded-md border-2 border-gray-300">
                                    <option value="">Select Package Type</option>
                                    {values.type === 'Outstation' && <option value="1">1</option>}
                                    {values.type !== 'Outstation' && <option value="2">2</option>}
                                    {values.type !== 'Outstation' && <option value="4">4</option>}
                                    {values.type !== 'Outstation' && <option value="6">6</option>}
                                    {values.type !== 'Outstation' && <option value="8">8</option>}
                                    {values.type !== 'Outstation' && <option value="10">10</option>}
                                    {values.type !== 'Outstation' && <option value="12">12</option>}
                                </Field>
                                <ErrorMessage name="period" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Base Km</label>
                                <Field type="number" name="baseKm" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="baseKm" component="div" className="text-red-500 text-sm" />
                            </div>
                            {values.type !== 'Outstation' && (<>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Package KM</label>
                                <Field type="number" name="kilometer" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="kilometer" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Additional KM Rate</label>
                                <Field type="number" name="extraKmPrice" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="extraKmPrice" component="div" className="text-red-500 text-sm" />
                            </div>
                            </>)}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                <Field type="number" name="freeExtraMinutes" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="freeExtraMinutes" component="div" className="text-red-500 text-sm" />
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
                            {values?.type === 'Outstation' && <div>
                                <label className="text-sm font-medium text-gray-700">Toll Charge</label>
                                <Field type="number" name="tollCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="tollCharge" component="div" className="text-red-500 text-sm" />
                            </div>}
                            {values?.type === 'Outstation' && <div>
                                <label className="text-sm font-medium text-gray-700">Driver Charge</label>
                                <Field type="number" name="driverCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="driverCharge" component="div" className="text-red-500 text-sm" />
                            </div>}
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
                                <Field type="number" name="nightCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="nightCharge" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Mins</label>
                                <Field type="number" name="cancelMins" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="cancelMins" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Charge</label>
                                <Field type="number" name="cancelCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="cancelCharge" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Waiting Mins</label>
                                <Field type="number" name="waitingMins" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="waitingMins" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Waiting Charge</label>
                                <Field type="number" name="waitingCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="waitingCharge" component="div" className="text-red-500 text-sm" />
                            </div>                            
                        </div>
                        
                       <div>
 
  <div className="overflow-x-auto">
    <table className="w-full border border-collapse text-sm text-center">
      <thead>
         {values.type === 'Outstation' && (
         <tr className="bg-primary  text-white">
  <th  colSpan={1}></th>
  <th  colSpan={2}></th>

  <th  colSpan={2} className='border text-lg'>Drop Only Non AC</th>
  <th  colSpan={2}className='border text-lg'>Drop only AC</th>
   <th  colSpan={2}className='border text-lg'>Round Trip Non AC</th>
  <th  colSpan={2}className='border text-lg'>Round Trip AC</th>
</tr>)}
  <tr className="bg-primary text-white">
          <th className="border p-2">Car Type</th>
          <th className="border p-2">Base Fare</th>
          <th className="border p-2">Additional Min Charge</th>
          <th className="border p-2">KM Price</th>
          {values.type !== "Outstation" && (
            <th className="border p-2">Price</th>
          )}
          {values.type === "Outstation" && (
            <>
              <th className="border p-2">Extra KM Price</th>
              <th className="border p-2">AC KM Price</th>
              <th className="border p-2">AC Extra KM Price</th>
              <th className="border p-2">KM Round Price</th>
              <th className="border p-2">Extra KM Round Price</th>
              <th className="border p-2">AC KM Round Price</th>
              <th className="border p-2">AC Extra KM Round Price</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {/* Mini */}
        <tr>
          <td className="border p-2 font-semibold">Mini</td>
          <td className="border p-2">
            <Field
              type="number"
              name="baseFare"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="baseFare"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinCharge"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="additionalMinCharge"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPrice"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="kilometerPrice"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          {values.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="price"
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
              />
              <ErrorMessage
                name="price"
                component="div"
                className="text-red-500 text-sm"
              />
            </td>
          )}
          {values.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPrice"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerPrice"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPrice"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerPrice"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPrice"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerPrice"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPrice"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="kilometerRoundPrice"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPrice"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerRoundPrice"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPrice"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerRoundPrice"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPrice"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerRoundPrice"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
            </>
          )}
        </tr>

        {/* Sedan */}
        <tr>
          <td className="border p-2 font-semibold">Sedan</td>
          <td className="border p-2">
            <Field
              type="number"
              name="baseFareSedan"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="baseFareSedan"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinChargeSedan"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="additionalMinChargeSedan"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPriceSedan"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="kilometerPriceSedan"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          {values.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="priceSedan"
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
              />
              <ErrorMessage
                name="priceSedan"
                component="div"
                className="text-red-500 text-sm"
              />
            </td>
          )}
          {values.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPriceSedan"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerPriceSedan"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPriceSedan"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerPriceSedan"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPriceSedan"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerPriceSedan"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPriceSedan"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="kilometerRoundPriceSedan"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPriceSedan"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerRoundPriceSedan"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPriceSedan"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerRoundPriceSedan"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPriceSedan"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerRoundPriceSedan"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
            </>
          )}
        </tr>

        {/* SUV */}
        <tr>
          <td className="border p-2 font-semibold">SUV</td>
          <td className="border p-2">
            <Field
              type="number"
              name="baseFareSuv"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="baseFareSuv"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinChargeSuv"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="additionalMinChargeSuv"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPriceSuv"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="kilometerPriceSuv"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          {values.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="priceSuv"
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
              />
              <ErrorMessage
                name="priceSuv"
                component="div"
                className="text-red-500 text-sm"
              />
            </td>
          )}
          {values.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPriceSuv"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerPriceSuv"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPriceSuv"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerPriceSuv"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPriceSuv"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerPriceSuv"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPriceSuv"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="kilometerRoundPriceSuv"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPriceSuv"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerRoundPriceSuv"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPriceSuv"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerRoundPriceSuv"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPriceSuv"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerRoundPriceSuv"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
            </>
          )}
        </tr>

        {/* MUV */}
        <tr>
          <td className="border p-2 font-semibold">MUV</td>
          <td className="border p-2">
            <Field
              type="number"
              name="baseFareMUV"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="baseFareMUV"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinChargeMUV"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="additionalMinChargeMUV"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPriceMUV"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="kilometerPriceMUV"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          {values.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="priceMUV"
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
              />
              <ErrorMessage
                name="priceMUV"
                component="div"
                className="text-red-500 text-sm"
              />
            </td>
          )}
          {values.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPriceMUV"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerPriceMUV"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPriceMUV"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerPriceMUV"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPriceMUV"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerPriceMUV"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPriceMUV"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="kilometerRoundPriceMUV"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPriceMUV"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerRoundPriceMUV"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPriceMUV"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerRoundPriceMUV"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPriceMUV"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerRoundPriceMUV"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
            </>
          )}
        </tr>
      </tbody>
    </table>
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
</div>


                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                                Cancel
                            </Button>
                            <Button fullWidth  onClick={handleSubmit} disabled={!dirty || !isValid} 
                            className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}>
                                Continue
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default RentalsPriceMasterAdd;
