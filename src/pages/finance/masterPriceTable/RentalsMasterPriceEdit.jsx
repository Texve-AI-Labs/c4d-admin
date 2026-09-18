import React, { useEffect, useRef, useState } from 'react';
import { Formik, Form } from 'formik';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import DemandPriceEdit from './DemandPriceEdit';
import RentalMasterPriceForm, { createLocalCategoryPricing, createOutstationCategoryPricing } from './RentalMasterPriceForm';
import { buildCategoryPricingsPayload, priceSchema } from './RentalsMasterPriceAdd';

const toTimeValue = (timeString) => timeString ? String(timeString).slice(0, 5) : '';
const toMinutes = (timeString) => Utils.convertTimeFormatToMinutes(timeString || 0);

const normalizeCategoryPricings = (priceData) => {
    if (Array.isArray(priceData?.categoryPricings) && priceData.categoryPricings.length > 0) {
        return priceData.categoryPricings.map((item) => {
            if (priceData.type === 'Outstation') {
                const pricing = item.pricing || {};
                const common = pricing.common || {};
                return {
                    category: item.category || '',
                    carTypes: Array.isArray(item.carTypes) ? item.carTypes : [],
                    pricing: {
                        common: {
                            baseKm: common.baseKm ?? '',
                            baseFare: common.baseFare ?? '',
                            kilometer: common.kilometer ?? '',
                            peakHours: Array.isArray(common.peakHours) ? common.peakHours : [],
                            cancelMins: toMinutes(common.cancelMins),
                            nightCharge: common.nightCharge ?? '',
                            waitingMins: toMinutes(common.waitingMins),
                            cancelCharge: common.cancelCharge ?? '',
                            driverCharge: common.driverCharge ?? '',
                            nightHoursFrom: toTimeValue(common.nightHoursFrom),
                            nightHoursTo: toTimeValue(common.nightHoursTo),
                            waitingCharge: common.waitingCharge ?? '',
                            freeExtraMinutes: common.freeExtraMinutes ?? '',
                            additionalMinCharge: common.additionalMinCharge ?? '',
                        },
                        DROP_ONLY: {
                            AC: {
                                acKilometerPrice: pricing.DROP_ONLY?.AC?.acKilometerPrice ?? '',
                                acExtraKilometerPrice: pricing.DROP_ONLY?.AC?.acExtraKilometerPrice ?? '',
                            },
                            NON_AC: {
                                kilometerPrice: pricing.DROP_ONLY?.NON_AC?.kilometerPrice ?? '',
                                extraKilometerPrice: pricing.DROP_ONLY?.NON_AC?.extraKilometerPrice ?? '',
                            },
                        },
                        ROUND_TRIP: {
                            AC: {
                                acKilometerRoundPrice: pricing.ROUND_TRIP?.AC?.acKilometerRoundPrice ?? '',
                                acExtraKilometerRoundPrice: pricing.ROUND_TRIP?.AC?.acExtraKilometerRoundPrice ?? '',
                            },
                            NON_AC: {
                                kilometerRoundPrice: pricing.ROUND_TRIP?.NON_AC?.kilometerRoundPrice ?? '',
                                extraKilometerRoundPrice: pricing.ROUND_TRIP?.NON_AC?.extraKilometerRoundPrice ?? '',
                            },
                        },
                    },
                };
            }

            const pricing = item.pricing || {};
            return {
                category: item.category || '',
                carTypes: Array.isArray(item.carTypes) ? item.carTypes : [],
                pricing: {
                    baseKm: pricing.baseKm ?? '',
                    baseFare: pricing.baseFare ?? '',
                    kilometer: pricing.kilometer ?? '',
                    kilometerPrice: pricing.kilometerPrice ?? '',
                    minCharge: pricing.minCharge ?? 0,
                    peakHours: Array.isArray(pricing.peakHours) ? pricing.peakHours : [],
                    nightCharge: pricing.nightCharge ?? '',
                    driverCharge: pricing.driverCharge ?? 0,
                    nightHoursFrom: toTimeValue(pricing.nightHoursFrom),
                    nightHoursTo: toTimeValue(pricing.nightHoursTo),
                    freeExtraMinutes: pricing.freeExtraMinutes ?? '',
                    additionalMinCharge: pricing.additionalMinCharge ?? '',
                    surChargePercentage: pricing.surChargePercentage ?? 0,
                },
            };
        });
    }

    return [priceData?.type === 'Outstation' ? createOutstationCategoryPricing() : createLocalCategoryPricing()];
};

const RentalsMasterPriceEdit = () => {
    const [initialValues, setInitialValues] = useState(null);
    const [demandRules, setDemandRules] = useState([]);
    const initialDemandPriceRef = useRef([]);
    const initialValuesRef = useRef(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPriceDetails = async () => {
            try {
                const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${id}`);
                if (data?.success) {
                    const priceData = data.data || {};
                    const values = {
                        serviceType: priceData.serviceType || 'RENTAL',
                        zone: priceData.zone || '',
                        type: priceData.type || '',
                        period: priceData.period || '',
                        status: priceData.status == 1 ? 'ACTIVE' : 'INACTIVE',
                        driverCancelMins: toMinutes(priceData.driverCancelMins),
                        driverFreeCancellationsPerDay: priceData.driverFreeCancellationsPerDay ?? '',
                        driverCancellationCharge: priceData.driverCancellationCharge ?? '',
                        categoryPricings: normalizeCategoryPricings(priceData),
                    };
                    initialValuesRef.current = values;
                    setInitialValues(values);
                    initialDemandPriceRef.current = priceData.demandRules || [];
                    setDemandRules(priceData.demandRules || []);
                }
            } catch (error) {
                console.error('Error fetching price details:', error);
            }
        };
        fetchPriceDetails();
    }, [id]);

    const hasDemandPriceChanged = () => JSON.stringify(demandRules) !== JSON.stringify(initialDemandPriceRef.current);
    const hasFormChanged = (values) => JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);

    const onSubmit = async (values) => {
        try {
            const reqBody = {
                packageId: Number(id),
                serviceType: 'RENTAL',
                zone: values.zone,
                type: values.type,
                period: String(values.period),
                status: values.status === 'ACTIVE' ? 1 : 0,
                categoryPricings: buildCategoryPricingsPayload(values),
                driverCancelMins: Utils.convertMinutesToTimeFormat(values.driverCancelMins),
                driverFreeCancellationsPerDay: Number(values.driverFreeCancellationsPerDay || 0),
                driverCancellationCharge: Number(values.driverCancellationCharge || 0),
                demandRules,
            };

            const response = await ApiRequestUtils.post(API_ROUTES.RENDAL_PRICE_EDIT, reqBody);
            if (response?.success) {
                navigate('/dashboard/finance/master-price');
            }
        } catch (error) {
            console.error('Error updating price details:', error);
        }
    };

    return (
        <div className="p-4 mx-auto bg-white">
            <h2 className="text-2xl font-bold mb-4">Edit Rentals Pricing Details</h2>
            {initialValues ? (
            <Formik initialValues={initialValues} validationSchema={priceSchema} onSubmit={onSubmit} enableReinitialize validateOnMount>
                {({ setFieldValue, isValid, values, errors }) => (
                    <Form>
                        <RentalMasterPriceForm
                            values={values}
                            errors={errors}
                            setFieldValue={setFieldValue}
                            isEdit
                        />
                        <DemandPriceEdit demandRules={demandRules} setDemandRules={setDemandRules} />
                        <div className="flex flex-row">
                            <Button fullWidth type="button" onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                                Cancel
                            </Button>
                            <Button fullWidth color="blue" type="submit" disabled={!(hasFormChanged(values) || hasDemandPriceChanged()) || !isValid} className="my-6 mx-2">
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
            ) : (
                <div className="p-4 text-sm text-gray-600">Loading...</div>
            )}
        </div>
    );
};

export { normalizeCategoryPricings };
export default RentalsMasterPriceEdit;
