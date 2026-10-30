import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Utils } from '@/utils/utils';
import DemandPriceEdit from './DemandPriceEdit';
import RentalMasterPriceForm, {
    CATEGORY_OPTIONS,
    CAR_TYPE_OPTIONS,
    createLocalCategoryPricing,
    createOutstationCategoryPricing,
} from './RentalMasterPriceForm';
import MasterPriceErrorModal from '@/components/masterPrice/MasterPriceErrorModal';
import { getMasterPriceErrorMessage } from '@/components/masterPrice/masterPriceError';

const numberField = (label) => Yup.number()
    .typeError(`${label} is required`)
    .required(`${label} is required`)
    .min(0, `${label} must be greater than or equal to 0`);

const commonOutstationSchema = Yup.object().shape({
    baseKm: numberField('Base Km'),
    baseFare: numberField('Base Fare'),
    kilometer: numberField('Kilometer'),
    cancelMins: numberField('Cancellation Mins'),
    nightCharge: numberField('Night Charge'),
    waitingMins: numberField('Waiting Mins'),
    cancelCharge: numberField('Cancellation Charge'),
    driverCharge: numberField('Driver Charge'),
    nightHoursFrom: Yup.string().required('Night Hours From is required'),
    nightHoursTo: Yup.string().required('Night Hours To is required'),
    waitingCharge: numberField('Waiting Charge'),
    freeExtraMinutes: numberField('Free Extra Minutes'),
    additionalMinCharge: numberField('Additional Min Charge'),
});

const localPricingSchema = Yup.object().shape({
    price: numberField('Price'),
    baseKm: numberField('Base Km'),
    baseFare: numberField('Base Fare'),
    kilometer: numberField('Package Km'),
    kilometerPrice: numberField('Kilometer Price'),
    nightCharge: numberField('Night Charge'),
    cancelMins: numberField('Cancellation Mins'),
    cancelCharge: numberField('Cancellation Charge'),
    waitingMins: numberField('Waiting Mins'),
    waitingCharge: numberField('Waiting Charge'),
    driverCharge: numberField('Driver Charge'),
    nightHoursFrom: Yup.string().required('Night Hours From is required'),
    nightHoursTo: Yup.string().required('Night Hours To is required'),
    freeExtraMinutes: numberField('Free Extra Minutes'),
    additionalMinCharge: numberField('Additional Min Charge'),
});

const outstationPricingSchema = Yup.object().shape({
    common: commonOutstationSchema,
    DROP_ONLY: Yup.object().shape({
        AC: Yup.object().shape({
            acKilometerPrice: numberField('AC Kilometer Price'),
            acExtraKilometerPrice: numberField('AC Extra Kilometer Price'),
        }),
        NON_AC: Yup.object().shape({
            kilometerPrice: numberField('Kilometer Price'),
            extraKilometerPrice: numberField('Extra Kilometer Price'),
        }),
    }),
    ROUND_TRIP: Yup.object().shape({
        AC: Yup.object().shape({
            acKilometerRoundPrice: numberField('AC Kilometer Round Price'),
            acExtraKilometerRoundPrice: numberField('AC Extra Kilometer Round Price'),
        }),
        NON_AC: Yup.object().shape({
            kilometerRoundPrice: numberField('Kilometer Round Price'),
            extraKilometerRoundPrice: numberField('Extra Kilometer Round Price'),
        }),
    }),
});

const baseCategoryPricingSchema = {
    category: Yup.string().required('Category is required'),
    carTypes: Yup.array().of(Yup.string().required('Car Type is required')).min(1, 'Car Type is required'),
};

const localCategoryPricingSchema = Yup.object().shape({
    ...baseCategoryPricingSchema,
    pricing: localPricingSchema,
});

const outstationCategoryPricingSchema = Yup.object().shape({
    ...baseCategoryPricingSchema,
    pricing: outstationPricingSchema,
});

const getCategoryLabel = (value) => CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value;
const getCarTypeLabel = (value) => CAR_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;

const priceSchema = Yup.object().shape({
    serviceType: Yup.string().required('Service Type is required'),
    type: Yup.string().oneOf(['Local', 'Outstation']).required('Trip Type is required'),
    zone: Yup.string().required('Zone is required'),
    period: Yup.string().required('Package Type is required'),
    status: Yup.string().required('Status is required'),
    categoryPricings: Yup.array()
        .when('type', {
            is: 'Outstation',
            then: (schema) => schema.of(outstationCategoryPricingSchema),
            otherwise: (schema) => schema.of(localCategoryPricingSchema),
        })
        .min(1, 'At least one category pricing is required')
        .test('unique-category-car-types', function (items = []) {
            const seen = new Set();
            for (const item of items) {
                if (!item?.category || !Array.isArray(item?.carTypes)) continue;
                for (const carType of item.carTypes) {
                    const key = `${item.category}:${carType}`;
                    if (seen.has(key)) {
                        return this.createError({
                            message: `${getCategoryLabel(item.category)} + ${getCarTypeLabel(carType)} already exists`,
                        });
                    }
                    seen.add(key);
                }
            }
            return true;
        }),
});

const toNumber = (value) => Number(value || 0);
const withSeconds = (value) => Utils.formatTimeWithSeconds(value);
const minutesToTime = (value) => Utils.convertMinutesToTimeFormat(value);

const buildCategoryPricingsPayload = (values) => values.categoryPricings.map((item) => {
    if (values.type === 'Outstation') {
        return {
            category: item.category,
            carTypes: item.carTypes,
            pricing: {
                common: {
                    baseKm: toNumber(item.pricing.common.baseKm),
                    baseFare: toNumber(item.pricing.common.baseFare),
                    kilometer: toNumber(item.pricing.common.kilometer),
                    peakHours: [],
                    cancelMins: minutesToTime(item.pricing.common.cancelMins),
                    nightCharge: toNumber(item.pricing.common.nightCharge),
                    waitingMins: minutesToTime(item.pricing.common.waitingMins),
                    cancelCharge: toNumber(item.pricing.common.cancelCharge),
                    driverCharge: toNumber(item.pricing.common.driverCharge),
                    nightHoursFrom: withSeconds(item.pricing.common.nightHoursFrom),
                    nightHoursTo: withSeconds(item.pricing.common.nightHoursTo),
                    waitingCharge: toNumber(item.pricing.common.waitingCharge),
                    freeExtraMinutes: toNumber(item.pricing.common.freeExtraMinutes),
                    additionalMinCharge: toNumber(item.pricing.common.additionalMinCharge),
                },
                DROP_ONLY: {
                    AC: {
                        acKilometerPrice: toNumber(item.pricing.DROP_ONLY.AC.acKilometerPrice),
                        acExtraKilometerPrice: toNumber(item.pricing.DROP_ONLY.AC.acExtraKilometerPrice),
                    },
                    NON_AC: {
                        kilometerPrice: toNumber(item.pricing.DROP_ONLY.NON_AC.kilometerPrice),
                        extraKilometerPrice: toNumber(item.pricing.DROP_ONLY.NON_AC.extraKilometerPrice),
                    },
                },
                ROUND_TRIP: {
                    AC: {
                        acKilometerRoundPrice: toNumber(item.pricing.ROUND_TRIP.AC.acKilometerRoundPrice),
                        acExtraKilometerRoundPrice: toNumber(item.pricing.ROUND_TRIP.AC.acExtraKilometerRoundPrice),
                    },
                    NON_AC: {
                        kilometerRoundPrice: toNumber(item.pricing.ROUND_TRIP.NON_AC.kilometerRoundPrice),
                        extraKilometerRoundPrice: toNumber(item.pricing.ROUND_TRIP.NON_AC.extraKilometerRoundPrice),
                    },
                },
            },
        };
    }

    return {
        category: item.category,
        carTypes: item.carTypes,
        pricing: {
            price: toNumber(item.pricing.price),
            baseKm: toNumber(item.pricing.baseKm),
            baseFare: toNumber(item.pricing.baseFare),
            kilometer: toNumber(item.pricing.kilometer),
            kilometerPrice: toNumber(item.pricing.kilometerPrice),
            extraKilometerPrice: toNumber(item.pricing.kilometerPrice),
            minCharge: 0,
            peakHours: [],
            nightCharge: toNumber(item.pricing.nightCharge),
            cancelMins: minutesToTime(item.pricing.cancelMins),
            cancelCharge: toNumber(item.pricing.cancelCharge),
            waitingMins: minutesToTime(item.pricing.waitingMins),
            waitingCharge: toNumber(item.pricing.waitingCharge),
            driverCharge: toNumber(item.pricing.driverCharge),
            nightHoursFrom: withSeconds(item.pricing.nightHoursFrom),
            nightHoursTo: withSeconds(item.pricing.nightHoursTo),
            freeExtraMinutes: toNumber(item.pricing.freeExtraMinutes),
            additionalMinCharge: toNumber(item.pricing.additionalMinCharge),
            surChargePercentage: 0,
        },
    };
});

export { priceSchema, buildCategoryPricingsPayload };

const RentalsPriceMasterAdd = () => {
    const [errorMessage, setErrorMessage] = useState('');
    const [zones, setZones] = useState([]);
    const [demandRules, setDemandRules] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchZones = async () => {
            try {
                const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
                if (response?.success) {
                    setZones(response.data
                        .filter((area) => area.type === 'Service Area')
                        .map((area) => ({ value: area.name, label: area.name })));
                }
            } catch (error) {
                console.error('Error fetching zones:', error);
            }
        };
        fetchZones();
    }, []);

    const initialValues = {
        serviceType: 'RENTAL',
        zone: '',
        type: '',
        period: '',
        status: 'ACTIVE',
        driverCancelMins: '',
        driverFreeCancellationsPerDay: '',
        driverCancellationCharge: '',
        categoryPricings: [],
    };

    const onSubmit = async (values, { setSubmitting }) => {
        try {
            const isOutstation = values?.type === 'Outstation';
            const reqBody = {
                serviceType: 'RENTAL',
                zone: values.zone,
                type: values.type,
                period: String(values.period),
                status: values.status === 'ACTIVE' ? 1 : 0,
                categoryPricings: buildCategoryPricingsPayload(values),
                driverCancelMins: minutesToTime(values.driverCancelMins),
                driverFreeCancellationsPerDay: toNumber(values.driverFreeCancellationsPerDay),
                driverCancellationCharge: toNumber(values.driverCancellationCharge),
                demandRules,
            };

            const data = await ApiRequestUtils.post(API_ROUTES.ADD_RENTALS_PRICE_TABLE, reqBody, 0, { suppressAlert: true });
            if (data?.success) {
                navigate('/dashboard/finance/master-price');
            } else {
                setErrorMessage(getMasterPriceErrorMessage(data));
            }
        } catch (error) {
            setErrorMessage(getMasterPriceErrorMessage(error));
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto bg-white">
            <MasterPriceErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
            <h2 className="text-2xl font-bold mb-4">Add Rentals Price Details</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={priceSchema}
                validateOnMount
                onSubmit={onSubmit}
            >
                {({ setFieldValue, isValid, dirty, errors, values }) => (
                    <Form>
                        <RentalMasterPriceForm
                            values={values}
                            errors={errors}
                            setFieldValue={setFieldValue}
                            zones={zones}
                        />
                        <DemandPriceEdit demandRules={demandRules} setDemandRules={setDemandRules} />
                        <div className="flex flex-row">
                            <Button fullWidth type="button" onClick={() => navigate('/dashboard/finance/master-price')} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
                                Cancel
                            </Button>
                            <Button fullWidth color="blue" type="submit" disabled={!dirty || !isValid} className="my-6 mx-2">
                                Submit
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export { createLocalCategoryPricing, createOutstationCategoryPricing };
export default RentalsPriceMasterAdd;
