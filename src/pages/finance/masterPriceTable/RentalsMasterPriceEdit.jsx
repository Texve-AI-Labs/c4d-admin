import React, { useEffect, useState,useRef} from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import Select from 'react-select';
import {Typography } from "@material-tailwind/react";
import { Utils } from '@/utils/utils';
import PremiumPriceDetailsEdit from '@/components/PremiumPriceDetailsEdit';



const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

const PRICE_SCHEMA = Yup.object().shape({
    // carType: Yup.string().required('Cab Type is required'),
    zone: Yup.string().required('Zone is required'),
    type: Yup.string().required('Trip Type is required'),
    period: Yup.string().required('Package Type is required'),
    baseKm: Yup.number().required('Base KM is required'),
    baseFare: Yup.number().required('Base Fare is required'),
    kilometer: Yup.number().required('Kilometer is required'),
    kilometerPrice: Yup.number().required('Kilometer Rate is required'),
    extraKmPrice: Yup.number().required('Additional Kilometer Price is required'),
    additionalMinCharge: Yup.number().required('Additional Min is required'),
    nightCharge: Yup.number().required('Night Charge is required'),
    cancelMins: Yup.number().required('Cancellation Mins is required'),
    cancelCharge: Yup.number().required('Cancellation Charge is require'),
    status: Yup.string().required('Status is required'),
});

const RentalsMasterPriceEdit = () => {
    const [initialValues, setInitialValues] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [premiumConfig ,setPremiumConfig] = useState({});
    const initialPremiumRef = useRef({});

    useEffect(() => {
        if (id) fetchPriceDetails(id);
    }, [id]);

    const fetchPriceDetails = async (packageId) => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${packageId}`);
            if (data?.success) {
                const isLocalType = data?.data?.type === 'Local';
                setInitialValues({
                    // carType: data?.data?.carType || '',
                    zone: data?.data?.zone || '',
                    type: data?.data?.type || '',
                    period: data?.data?.period || '',
                    baseKm: data?.data?.baseKm || 0,
                    baseFare: data?.data?.baseFare || 0,
                    kilometer: data?.data?.kilometer || 0,
                    kilometerPrice: data?.data?.kilometerPrice || 0,
                    additionalMinCharge: data?.data?.additionalMinCharge || 0,
                    tollCharge: data?.data?.tollCharge || 0,
                    driverCharge: data?.data?.driverCharge || 0,
                    extraKmPrice: data?.data?.extraKmPrice || 0,
                    nightHoursFrom: convertToTimeFormat(data?.data?.nightHoursFrom),
                    nightHoursTo: convertToTimeFormat(data?.data?.nightHoursTo),
                    nightCharge: data?.data?.nightCharge || 0,
                    cancelMins: Utils.convertTimeFormatToMinutes(data?.data?.cancelMins),
                    cancelCharge: data?.data?.cancelCharge || 0,
                    status: data?.data?.status == 1 ? "ACTIVE" : "INACTIVE",
                    price:data?.data?.price || 0,
                    priceMVP:data?.data?.priceMVP || 0,
                    priceSuv:data?.data?.priceSuv || 0,
                    priceSedan:data?.data?.priceSedan || 0,
                    baseFareMVP:data?.data?.baseFareMVP || 0,
                    baseFareSuv:data?.data?.baseFareSuv || 0,
                    baseFareSedan:data?.data?.baseFareSedan || 0,
                    kilometerPriceMVP:data?.data?.kilometerPriceMVP || 0,
                    kilometerPriceSuv:data?.data?.kilometerPriceSuv || 0,
                    kilometerPriceSedan:data?.data?.kilometerPriceSedan || 0,
                    additionalMinChargeMVP:data?.data?.additionalMinChargeMVP || 0,
                    additionalMinChargeSuv:data?.data?.additionalMinChargeSuv || 0,
                    additionalMinChargeSedan:data?.data?.additionalMinChargeSedan || 0,
                    freeExtraMinutes:data?.data?.freeExtraMinutes || 0,

                    kilometerRoundPrice:data?.data?.kilometerRoundPrice || 0,
                    kilometerRoundPriceMVP:data?.data?.kilometerRoundPriceMVP || 0,
                    kilometerRoundPriceSuv:data?.data?.kilometerRoundPriceSuv || 0,
                    kilometerRoundPriceSedan:data?.data?.kilometerRoundPriceSedan || 0,

                    extraKilometerPrice: data?.data?.extraKilometerPrice || 0,
                    extraKilometerPriceMVP: data?.data?.extraKilometerPriceMVP || 0,
                    extraKilometerPriceSuv: data?.data?.extraKilometerPriceSuv || 0,
                    extraKilometerPriceSedan: data?.data?.extraKilometerPriceSedan || 0,

                    extraKilometerRoundPrice: data?.data?.extraKilometerRoundPrice || 0,
                    extraKilometerRoundPriceMVP: data?.data?.extraKilometerRoundPriceMVP || 0,
                    extraKilometerRoundPriceSuv: data?.data?.extraKilometerRoundPriceSuv || 0,
                    extraKilometerRoundPriceSedan: data?.data?.extraKilometerRoundPriceSedan || 0,


                    acKilometerPrice: isLocalType ? (data?.data?.kilometerPrice || 0) : (data?.data?.acKilometerPrice || 0),
                    acKilometerPriceMVP: isLocalType ? (data?.data?.kilometerPriceMVP || 0) : (data?.data?.acKilometerPriceMVP || 0),
                    acKilometerPriceSuv: isLocalType ? (data?.data?.kilometerPriceSuv || 0) : (data?.data?.acKilometerPriceSuv || 0),
                    acKilometerPriceSedan: isLocalType ? (data?.data?.kilometerPriceSedan || 0) : (data?.data?.acKilometerPriceSedan || 0),

                    acKilometerRoundPrice: data?.data?.acKilometerRoundPrice || 0,
                    acKilometerRoundPriceMVP: data?.data?.acKilometerRoundPriceMVP || 0,
                    acKilometerRoundPriceSuv: data?.data?.acKilometerRoundPriceSuv || 0,
                    acKilometerRoundPriceSedan: data?.data?.acKilometerRoundPriceSedan || 0,

                    acExtraKilometerPrice: data?.data?.acExtraKilometerPrice || 0,
                    acExtraKilometerPriceMVP: data?.data?.acExtraKilometerPriceMVP || 0,
                    acExtraKilometerPriceSuv: data?.data?.acExtraKilometerPriceSuv || 0,
                    acExtraKilometerPriceSedan: data?.data?.acExtraKilometerPriceSedan || 0,

                    acExtraKilometerRoundPrice: data?.data?.acExtraKilometerRoundPrice || 0,
                    acExtraKilometerRoundPriceMVP: data?.data?.acExtraKilometerRoundPriceMVP || 0,
                    acExtraKilometerRoundPriceSuv: data?.data?.acExtraKilometerRoundPriceSuv || 0,
                    acExtraKilometerRoundPriceSedan: data?.data?.acExtraKilometerRoundPriceSedan || 0,
                    driverCancelMins: Utils.convertTimeFormatToMinutes(data?.data?.driverCancelMins || 0),
                    driverFreeCancellationsPerDay: data?.data?.driverFreeCancellationsPerDay || 0,
                    driverCancellationCharge: data?.data?.driverCancellationCharge || 0,
                });
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

  const hasPremiumConfig = () => {
    return JSON.stringify(premiumConfig) !== JSON.stringify(initialPremiumRef.current);
  }

    const onSubmit = async (values) => {
        try {
            const reqBody = {
                packageId: Number(id),
                // carType: String(values.carType),
                zone: String(values.zone),
                type: String(values.type),
                period: Number(values.period),
                kilometer: Number(values.kilometer),
                serviceType: 'RENTAL',
                baseKm: Number(values.baseKm),
                baseFare: Number(values.baseFare),
                kilometerPrice: Number(values.kilometerPrice),
                additionalMinCharge: Number(values.additionalMinCharge),
                nightHoursFrom: Utils.formatTimeWithSeconds(values.nightHoursFrom),
                nightHoursTo: Utils.formatTimeWithSeconds(values.nightHoursTo),
                nightCharge: Number(values.nightCharge),
                tollCharge: Number(values.tollCharge),
                driverCharge: Number(values.driverCharge),
                extraKmPrice: Number(values.extraKmPrice),
                cancelMins: Utils.convertMinutesToTimeFormat(values.cancelMins),
                cancelCharge: Number(values.cancelCharge),
                status: values.status == 'ACTIVE' ? 1 : 0,
                price:Number(values.price),
                priceMVP:Number(values.priceMVP),
                priceSuv:Number(values.priceSuv),
                freeExtraMinutes:Number(values.freeExtraMinutes),
                priceSedan:Number(values.priceSedan),
                baseFareMVP:Number(values.baseFareMVP),
                baseFareSuv:Number(values.baseFareSuv),
                baseFareSedan:Number(values.baseFareSedan),
                kilometerPriceMVP:Number(values.kilometerPriceMVP),
                kilometerPriceSuv:Number(values.kilometerPriceSuv),
                kilometerPriceSedan:Number(values.kilometerPriceSedan),
                additionalMinChargeMVP:Number(values.additionalMinChargeMVP),
                additionalMinChargeSuv:Number(values.additionalMinChargeSuv),
                additionalMinChargeSedan:Number(values.additionalMinChargeSedan),

                kilometerRoundPrice:Number(values.kilometerRoundPrice),
                kilometerRoundPriceMVP:Number(values.kilometerRoundPriceMVP),
                kilometerRoundPriceSuv:Number(values.kilometerRoundPriceSuv),
                kilometerRoundPriceSedan:Number(values.kilometerRoundPriceSedan),

                extraKilometerPrice: Number(values.extraKilometerPrice),
                extraKilometerPriceMVP: Number(values.extraKilometerPriceMVP),
                extraKilometerPriceSuv: Number(values.extraKilometerPriceSuv),
                extraKilometerPriceSedan: Number(values.extraKilometerPriceSedan),

                extraKilometerRoundPrice: Number(values.extraKilometerRoundPrice),
                extraKilometerRoundPriceMVP: Number(values.extraKilometerRoundPriceMVP),
                extraKilometerRoundPriceSuv: Number(values.extraKilometerRoundPriceSuv),
                extraKilometerRoundPriceSedan: Number(values.extraKilometerRoundPriceSedan),

                acKilometerPrice: values.type === 'Local' ? Number(values.kilometerPrice) : Number(values.acKilometerPrice),
                acKilometerPriceMVP: values.type === 'Local' ? Number(values.kilometerPriceMVP) : Number(values.acKilometerPriceMVP),
                acKilometerPriceSuv: values.type === 'Local' ? Number(values.kilometerPriceSuv) : Number(values.acKilometerPriceSuv),
                acKilometerPriceSedan: values.type === 'Local' ? Number(values.kilometerPriceSedan) : Number(values.acKilometerPriceSedan),

                acKilometerRoundPrice: Number(values.acKilometerRoundPrice),
                acKilometerRoundPriceMVP: Number(values.acKilometerRoundPriceMVP),
                acKilometerRoundPriceSuv: Number(values.acKilometerRoundPriceSuv),
                acKilometerRoundPriceSedan: Number(values.acKilometerRoundPriceSedan),

                acExtraKilometerPrice: Number(values.acExtraKilometerPrice),
                acExtraKilometerPriceMVP: Number(values.acExtraKilometerPriceMVP),
                acExtraKilometerPriceSuv: Number(values.acExtraKilometerPriceSuv),
                acExtraKilometerPriceSedan: Number(values.acExtraKilometerPriceSedan),

                acExtraKilometerRoundPrice: Number(values.acExtraKilometerRoundPrice),
                acExtraKilometerRoundPriceMVP: Number(values.acExtraKilometerRoundPriceMVP),
                acExtraKilometerRoundPriceSuv: Number(values.acExtraKilometerRoundPriceSuv),
                acExtraKilometerRoundPriceSedan: Number(values.acExtraKilometerRoundPriceSedan),

                driverCancelMins: Utils.convertMinutesToTimeFormat(values.driverCancelMins),
                driverFreeCancellationsPerDay: Number(values.driverFreeCancellationsPerDay),
                driverCancellationCharge: Number(values.driverCancellationCharge),
                premiumConfig:premiumConfig,
            };

            const response = await ApiRequestUtils.post(API_ROUTES.RENDAL_PRICE_EDIT, reqBody);

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
            <h2 className="text-2xl font-bold mb-4">Edit Pricing Details</h2>
            <Formik initialValues={initialValues} validationSchema={PRICE_SCHEMA} onSubmit={onSubmit} enableReinitialize>
                {({ handleSubmit, setFieldValue, isValid, dirty, values }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Field type="text" name="zone" className="p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-200" disabled />
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Trip Type</label>
                                <Field type="string" name="type" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                                <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Package Type</label>
                                <Field type="string" name="period" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                                <ErrorMessage name="period" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Base Km</label>
                                <Field type="number" name="baseKm" className="p-2 w-full rounded-md border-gray-300 shadow-sm"  />
                                <ErrorMessage name="baseKm" component="div" className="text-red-500 text-sm" />
                            </div>
                            {values?.type !== 'Outstation' && <div>
                                <label className="text-sm font-medium text-gray-700">KM</label>
                                <Field type="number" name="kilometer" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="kilometer" component="div" className="text-red-500 text-sm" />
                            </div>}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Additional KM Rate</label>
                                <Field type="number" name="extraKmPrice" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="extraKmPrice" component="div" className="text-red-500 text-sm" />
                            </div>
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
                                    value={STATUS_OPTIONS.find(option => option.value === values?.status)}
                                    placeholder="Select Status"
                                    className="w-full"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                            {initialValues?.type === 'Outstation' && <div>
                                <label className="text-sm font-medium text-gray-700">Toll Charge</label>
                                <Field type="number" name="tollCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="tollCharge" component="div" className="text-red-500 text-sm" />
                            </div>}
                            {initialValues?.type === 'Outstation' && <div>
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
                                    <ErrorMessage name="nightHoursFrom" component="div" className="text-red-500 text-sm" />
                                    <ErrorMessage name="nightHoursTo" component="div" className="text-red-500 text-sm" />
                                </div>
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
                        </div>

<div className="overflow-x-auto">
  <table className="w-full border border-collapse text-sm text-center">
    <thead>
         {values?.type === 'Outstation' && (
         <tr className="bg-primary  text-white">
  <th  colSpan={1}></th>
  <th  colSpan={2}></th>

  <th  colSpan={2} className=' border text-lg'>Drop Only Non AC</th>
  <th  colSpan={2}className='border text-lg'>Drop only AC</th>
   <th  colSpan={2}className='border text-lg'>Round Trip Non AC</th>
  <th  colSpan={2}className='border text-lg'>Round Trip AC</th>
</tr>)}
  <tr className="bg-primary text-white">
        <th className="border p-2">Car Type</th>
        <th className="border p-2">Base Fare</th>
        <th className="border p-2">Additional Min Charge</th>
        {values?.type !== "Outstation" && (
          <th className="border p-2">Price</th>
        )}
        <th className="border p-2">KM Price</th>
        {values?.type === "Outstation" && (
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
        {values?.type !== "Outstation" && (
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
        {values?.type === "Outstation" && (
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
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
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
        {values?.type !== "Outstation" && (
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
        {values?.type === "Outstation" && (
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
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
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
        {values?.type !== "Outstation" && (
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
        {values?.type === "Outstation" && (
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
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
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
        {values?.type !== "Outstation" && (
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
        {values?.type === "Outstation" && (
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
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
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
                className="p-2 w-full rounded-md border-gray-300 shadow-sm"
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
              {(values?.type === 'Outstation') &&
                <PremiumPriceDetailsEdit initialPremiumData={premiumConfig} onUpdate={(data) => setPremiumConfig(data)} />
              }
                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                                Cancel
                            </Button>
                            <Button fullWidth color="blue" type="submit" disabled={!(dirty || hasPremiumConfig()) || !isValid} className="my-6 mx-2">
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default RentalsMasterPriceEdit;
