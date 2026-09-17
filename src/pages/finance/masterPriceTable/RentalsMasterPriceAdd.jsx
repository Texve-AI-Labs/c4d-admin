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
    // kilometer: Yup.number().required('Kilometer is required'),
    // kilometerPrice: Yup.number().required('Kilometer Rate is required'),

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

    const resolveZoneLabel = (zoneValue) => {
        const selectedZone = zones.find((option) => String(option.value) === String(zoneValue));
        return selectedZone?.label || String(zoneValue || "");
    };

    const toNumber = (value) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : 0;
    };
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
            const isOutstation = values?.type === 'Outstation';
            const reqBody = {
                // 'carType': values.carType,
                'zone': resolveZoneLabel(values.zone),
                'serviceType': 'RENTAL',
                'type': String(values.type),
                'period': String(values.period),
                'baseKm': toNumber(values.baseKm),
                'baseFare': toNumber(values.baseFare),
                'kilometer': toNumber(values.kilometer),
                'kilometerPrice': toNumber(values.kilometerPrice),

                'kilometerRoundPrice': isOutstation ? toNumber(values.kilometerRoundPrice) : 0,
                'kilometerRoundPriceMVP': isOutstation ? toNumber(values.kilometerRoundPriceMVP) : 0,
                'kilometerRoundPriceSuv': isOutstation ? toNumber(values.kilometerRoundPriceSuv) : 0,
                'kilometerRoundPriceSedan': isOutstation ? toNumber(values.kilometerRoundPriceSedan) : 0,

                'extraKilometerPrice': isOutstation ? toNumber(values.extraKilometerPrice) : 0,
                'extraKilometerPriceMVP': isOutstation ? toNumber(values.extraKilometerPriceMVP) : 0,
                'extraKilometerPriceSuv': isOutstation ? toNumber(values.extraKilometerPriceSuv) : 0,
                'extraKilometerPriceSedan': isOutstation ? toNumber(values.extraKilometerPriceSedan) : 0,

                'extraKilometerRoundPrice': isOutstation ? toNumber(values.extraKilometerRoundPrice) : 0,
                'extraKilometerRoundPriceMVP': isOutstation ? toNumber(values.extraKilometerRoundPriceMVP) : 0,
                'extraKilometerRoundPriceSuv': isOutstation ? toNumber(values.extraKilometerRoundPriceSuv) : 0,
                'extraKilometerRoundPriceSedan': isOutstation ? toNumber(values.extraKilometerRoundPriceSedan) : 0,

                'acKilometerRoundPrice': isOutstation ? toNumber(values.acKilometerRoundPrice) : 0,
                'acKilometerRoundPriceMVP': isOutstation ? toNumber(values.acKilometerRoundPriceMVP) : 0,
                'acKilometerRoundPriceSuv': isOutstation ? toNumber(values.acKilometerRoundPriceSuv) : 0,
                'acKilometerRoundPriceSedan': isOutstation ? toNumber(values.acKilometerRoundPriceSedan) : 0,

                'acExtraKilometerPrice': isOutstation ? toNumber(values.acExtraKilometerPrice) : 0,
                'acExtraKilometerPriceMVP': isOutstation ? toNumber(values.acExtraKilometerPriceMVP) : 0,
                'acExtraKilometerPriceSuv': isOutstation ? toNumber(values.acExtraKilometerPriceSuv) : 0,
                'acExtraKilometerPriceSedan': isOutstation ? toNumber(values.acExtraKilometerPriceSedan) : 0,

                'acExtraKilometerRoundPrice': isOutstation ? toNumber(values.acExtraKilometerRoundPrice) : 0,
                'acExtraKilometerRoundPriceMVP': isOutstation ? toNumber(values.acExtraKilometerRoundPriceMVP) : 0,
                'acExtraKilometerRoundPriceSuv': isOutstation ? toNumber(values.acExtraKilometerRoundPriceSuv) : 0,
                'acExtraKilometerRoundPriceSedan': isOutstation ? toNumber(values.acExtraKilometerRoundPriceSedan) : 0,

                'price': !isOutstation ? toNumber(values.price) : 0,
                'priceMVP': !isOutstation ? toNumber(values.priceMVP) : 0,
                'priceSuv': !isOutstation ? toNumber(values.priceSuv) : 0,
                'priceSedan': !isOutstation ? toNumber(values.priceSedan) : 0,

                'additionalMinCharge': toNumber(values.additionalMinCharge),
                'freeExtraMinutes': toNumber(values.freeExtraMinutes),
                'tollCharge': isOutstation ? toNumber(values.tollCharge) : 0,
                'driverCharge': isOutstation ? toNumber(values.driverCharge) : 0,
                'nightCharge': toNumber(values.nightCharge),
                'nightHoursFrom': Utils.formatTimeWithSeconds(values.nightHoursFrom),
                'nightHoursTo': Utils.formatTimeWithSeconds(values.nightHoursTo),
                'status': values.status === "ACTIVE" ? 1 : 0,
                "cancelMins": Utils.convertMinutesToTimeFormat(values.cancelMins),
                "cancelCharge": toNumber(values.cancelCharge),
                "waitingMins": Utils.convertMinutesToTimeFormat(values.waitingMins),
                "waitingCharge": toNumber(values.waitingCharge),
                'extraKmPrice': toNumber(values.extraKmPrice),
                "baseFareMVP": toNumber(values.baseFareMVP),
                "baseFareSuv": toNumber(values.baseFareSuv),
                "baseFareSedan": toNumber(values.baseFareSedan),
                "kilometerPriceMVP": toNumber(values.kilometerPriceMVP),
                "kilometerPriceSuv": toNumber(values.kilometerPriceSuv),
                "kilometerPriceSedan": toNumber(values.kilometerPriceSedan),
                "additionalMinChargeMVP": toNumber(values.additionalMinChargeMVP),
                "additionalMinChargeSuv": toNumber(values.additionalMinChargeSuv),
                "additionalMinChargeSedan": toNumber(values.additionalMinChargeSedan),

                "acKilometerPrice": toNumber(values.acKilometerPrice),
                "acKilometerPriceMVP": toNumber(values.acKilometerPriceMVP),
                "acKilometerPriceSuv": toNumber(values.acKilometerPriceSuv),
                "acKilometerPriceSedan": toNumber(values.acKilometerPriceSedan),
              "driverCancelMins": Utils.convertMinutesToTimeFormat(values.driverCancelMins),
              "driverFreeCancellationsPerDay": toNumber(values.driverFreeCancellationsPerDay),
              "driverCancellationCharge": toNumber(values.driverCancellationCharge),
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
                      {/* <p>Form Errors (Debug):</p><p>{JSON.stringify(errors, null, 2)}</p>                         
                      <pre>{JSON.stringify(errors, null, 2)}</pre> */}
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
                            {/* {values?.type === 'Outstation' && <div>
                                <label className="text-sm font-medium text-gray-700">Toll Charge</label>
                                <Field type="number" name="tollCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="tollCharge" component="div" className="text-red-500 text-sm" />
                            </div>} */}
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
              name="baseFareMVP"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="baseFareMVP"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinChargeMVP"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="additionalMinChargeMVP"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPriceMVP"
              className="p-2 w-full rounded-md border-gray-300 shadow-sm"
            />
            <ErrorMessage
              name="kilometerPriceMVP"
              component="div"
              className="text-red-500 text-sm"
            />
          </td>
          {values.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="priceMVP"
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
              />
              <ErrorMessage
                name="priceMVP"
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
                  name="extraKilometerPriceMVP"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerPriceMVP"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPriceMVP"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerPriceMVP"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPriceMVP"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerPriceMVP"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPriceMVP"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="kilometerRoundPriceMVP"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPriceMVP"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="extraKilometerRoundPriceMVP"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPriceMVP"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acKilometerRoundPriceMVP"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPriceMVP"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage
                  name="acExtraKilometerRoundPriceMVP"
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
