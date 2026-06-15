import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Typography } from '@material-tailwind/react';
import { Utils } from '@/utils/utils';
import MasterPriceLog from './MasterPriceLog';
import PremiumPriceDetails from '@/components/PremiumPriceDetails';
import DemandPriceTable from './DemandPrice';

const RentalsPriceMasterDetails = () => {
    const [initialValues, setInitialValues] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [premiumConfig ,setPremiumConfig] = useState({});
    const [demandRules, setDemandRules] = useState([]);

    useEffect(() => {
        fetchPriceDetails();
    }, []);

    const fetchPriceDetails = async () => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${id}`);
            if (data?.success) {
                setInitialValues({
                    // carType: data?.data?.carType,
                    zone: data?.data?.zone || '',
                    type: data?.data?.type,
                    period: data?.data?.period,
                    baseKm: data?.data?.baseKm,
                    baseFare: data?.data?.baseFare,
                    kilometer: data?.data?.kilometer,
                    kilometerPrice: data?.data?.kilometerPrice,
                    additionalMinCharge: data?.data?.additionalMinCharge,
                    tollCharge: data?.data?.tollCharge,
                    driverCharge: data?.data?.driverCharge,
                    kilometerRoundPrice: data?.data?.kilometerRoundPrice,
                    kilometerRoundPriceMVP: data?.data?.kilometerRoundPriceMVP,
                    kilometerRoundPriceSuv: data?.data?.kilometerRoundPriceSuv,
                    kilometerRoundPriceSedan: data?.data?.kilometerRoundPriceSedan,
                    extraKmPrice: data?.data?.extraKmPrice,
                    nightHoursFrom: convertToTimeFormat(data?.data?.nightHoursFrom),
                    nightHoursTo: convertToTimeFormat(data?.data?.nightHoursTo),
                    nightCharge: data?.data?.nightCharge,
                    // cancellationMins: Utils.convertTimeFormatToMinutes(data?.data?.cancelMins),
                    // cancellationCharge: data?.data?.cancelCharge,
                    status: data?.data?.status == 1 ? "ACTIVE" : "INACTIVE",
                    price:data?.data?.price,
                    priceMVP:data?.data?.priceMVP,
                    priceSuv:data?.data?.priceSuv,
                    priceSedan:data?.data?.priceSedan,
                    baseFareMVP:data?.data?.baseFareMVP,
                    baseFareSuv:data?.data?.baseFareSuv,
                    baseFareSedan:data?.data?.baseFareSedan,
                    kilometerPriceMVP:data?.data?.kilometerPriceMVP,
                    kilometerPriceSuv:data?.data?.kilometerPriceSuv,
                    kilometerPriceSedan:data?.data?.kilometerPriceSedan,

                    extraKilometerPrice: data?.data?.extraKilometerPrice || 0,
                    extraKilometerPriceMVP: data?.data?.extraKilometerPriceMVP || 0,
                    extraKilometerPriceSuv: data?.data?.extraKilometerPriceSuv || 0,
                    extraKilometerPriceSedan: data?.data?.extraKilometerPriceSedan || 0,

                    extraKilometerRoundPrice: data?.data?.extraKilometerRoundPrice || 0,
                    extraKilometerRoundPriceMVP: data?.data?.extraKilometerRoundPriceMVP || 0,
                    extraKilometerRoundPriceSuv: data?.data?.extraKilometerRoundPriceSuv || 0,
                    extraKilometerRoundPriceSedan: data?.data?.extraKilometerRoundPriceSedan || 0,

                    additionalMinChargeMVP:data?.data?.additionalMinChargeMVP,
                    additionalMinChargeSuv:data?.data?.additionalMinChargeSuv,
                    additionalMinChargeSedan:data?.data?.additionalMinChargeSedan,
                    cancelMins: Utils.convertTimeFormatToMinutes(data?.data?.cancelMins),
                    cancelCharge: data?.data?.cancelCharge,

                    acKilometerPrice: data?.data?.acKilometerPrice || 0,
                    acKilometerPriceMVP: data?.data?.acKilometerPriceMVP || 0,
                    acKilometerPriceSuv: data?.data?.acKilometerPriceSuv || 0,
                    acKilometerPriceSedan: data?.data?.acKilometerPriceSedan || 0,

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
                    freeExtraMinutes: data?.data?.freeExtraMinutes || 0,

                    driverCancelMins:Utils.convertTimeFormatToMinutes(data?.data?.driverCancelMins || 0),
                    driverFreeCancellationsPerDay:data?.data?.driverFreeCancellationsPerDay || 0,
                    driverCancellationCharge:data?.data?.driverCancellationCharge || 0,
                });
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
            <h2 className="text-2xl font-bold mb-4">Rentals Pricing Details</h2>
            <Formik initialValues={initialValues} enableReinitialize>
                {() => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Zone</label>
                                <Field type="text" name="zone" className="p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-200" disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Trip Type</label>
                                <Field type="string" name="type" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Package Type</label>
                                <Field type="string" name="period" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Base KM</label>
                                <Field type="number" name="baseKm" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            {initialValues?.type !== 'Outstation' && <div> 
                                <label className="text-sm font-medium text-gray-700">Package KM</label>
                                <Field type="number" name="kilometer" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Field type="string" name="status" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Additional KM Rate</label>
                                <Field type="number" name="extraKmPrice" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Free Extra Minutes</label>
                                <Field type="number" name="freeExtraMinutes" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            {initialValues?.type === 'Outstation' && <div>
                                <label className="text-sm font-medium text-gray-700">Toll Charge</label>
                                <Field type="number" name="tollCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>}
                            {initialValues?.type === 'Outstation' && <div>
                                <label className="text-sm font-medium text-gray-700">Driver Charge</label>
                                <Field type="number" name="driverCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
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
                                <label className="text-sm font-medium text-gray-700">Cancellation Mins</label>
                                <Field type="number" name="cancelMins" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cancellation Charge</label>
                                <Field type="number" name="cancelCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Night Charge</label>
                                <Field type="number" name="nightCharge" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled />
                            </div>
                            </div>

                        <div>
  <div className="overflow-x-auto">
    <table className="w-full border-spacing-y-2  border-collapse text-sm text-center">
      <thead>
         {initialValues?.type === 'Outstation' && (
  <tr className="bg-primary text-white">
  <th  colSpan={1}></th>
  <th  colSpan={2}></th>

  <th  colSpan={2} className=' border text-lg'>Drop Only Non AC</th>
  <th  colSpan={2}className=' border text-lg'>Drop only AC</th>
   <th  colSpan={2}className='border text-lg'>Round Trip Non AC</th>
  <th  colSpan={2}className=' border text-lg'>Round Trip AC</th>
</tr>)}
  <tr className="bg-primary text-white">
          <th className="border p-2">Car Type</th>
          <th className="border p-2">Base Fare</th>
          <th className="border p-2">Additional Min Charge</th>
          {initialValues?.type !== "Outstation" && (
            <th className="border p-2">Price</th>
          )}
          <th className="border p-2">KM Price</th>
          {initialValues?.type === "Outstation" && (
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
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinCharge"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="price"
                className="w-full p-1 border rounded"
                disabled
              />
            </td>
          )}
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPrice"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPrice"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPrice"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPrice"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPrice"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPrice"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPrice"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPrice"
                  className="w-full p-1 border rounded"
                  disabled
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
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinChargeSedan"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="priceSedan"
                className="w-full p-1 border rounded"
                disabled
              />
            </td>
          )}
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPriceSedan"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPriceSedan"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPriceSedan"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPriceSedan"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPriceSedan"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPriceSedan"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPriceSedan"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPriceSedan"
                  className="w-full p-1 border rounded"
                  disabled
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
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinChargeSuv"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="priceSuv"
                className="w-full p-1 border rounded"
                disabled
              />
            </td>
          )}
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPriceSuv"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPriceSuv"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPriceSuv"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPriceSuv"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPriceSuv"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPriceSuv"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPriceSuv"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPriceSuv"
                  className="w-full p-1 border rounded"
                  disabled
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
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          <td className="border p-2">
            <Field
              type="number"
              name="additionalMinChargeMVP"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type !== "Outstation" && (
            <td className="border p-2">
              <Field
                type="number"
                name="priceMVP"
                className="w-full p-1 border rounded"
                disabled
              />
            </td>
          )}
          <td className="border p-2">
            <Field
              type="number"
              name="kilometerPriceMVP"
              className="w-full p-1 border rounded"
              disabled
            />
          </td>
          {initialValues?.type === "Outstation" && (
            <>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerPriceMVP"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerPriceMVP"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerPriceMVP"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="kilometerRoundPriceMVP"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="extraKilometerRoundPriceMVP"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acKilometerRoundPriceMVP"
                  className="w-full p-1 border rounded"
                  disabled
                />
              </td>
              <td className="border p-2">
                <Field
                  type="number"
                  name="acExtraKilometerRoundPriceMVP"
                  className="w-full p-1 border rounded"
                  disabled
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
</div>
              {initialValues?.type === 'Outstation' &&
                <PremiumPriceDetails premiumData={premiumConfig} />
              }
              <DemandPriceTable demandRules={demandRules}/>


                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className={`my-6 mx-2 ${ColorStyles.backButton}`}>
                                Back
                            </Button>
                            <Button fullWidth className={`my-6 mx-2 border-2 border-gray-400 rounded-xl ${ColorStyles.editButton
                                }`} onClick={() => navigate(`/dashboard/finance/master-price/rentals-edit/${id}`)}>
                                Edit
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
            <MasterPriceLog id={id} />
        </div>
    );
};

export default RentalsPriceMasterDetails;
