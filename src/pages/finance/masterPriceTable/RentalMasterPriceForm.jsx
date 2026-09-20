import React from 'react';
import { Field, FieldArray, ErrorMessage } from 'formik';
import Select from 'react-select';
import { Button, Typography } from '@material-tailwind/react';

export const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

export const CATEGORY_OPTIONS = [
    { value: 'ECONOMY_GO', label: 'Economy Go' },
    { value: 'COMFORT', label: 'Comfort' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'PREMIUM_XL', label: 'Premium XL' },
];

export const CAR_TYPE_OPTIONS = [
    { value: 'MINI', label: 'Mini' },
    { value: 'SEDAN', label: 'Sedan' },
    { value: 'SUV', label: 'Suv' },
    { value: 'MUV', label: 'Muv' },
];

const FormLevelError = ({ error }) => (
    typeof error === 'string' ? <div className="text-red-500 text-sm">{error}</div> : null
);

const NumberInput = ({ name, label, disabled = false }) => (
    <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <Field type="number" name={name} disabled={disabled} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm disabled:bg-gray-100" />
        <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
    </div>
);

const TimeRangeInput = ({ fromName, toName, disabled = false }) => (
    <div>
        <label className="text-sm font-medium text-gray-700">Night Hours</label>
        <div className="flex items-center">
            <Field type="time" name={fromName} disabled={disabled} className="p-2 w-full rounded-l-md border-2 border-gray-300 shadow-sm disabled:bg-gray-100" />
            <span className="px-3 py-2 bg-gray-100 border-t border-b border-gray-300">to</span>
            <Field type="time" name={toName} disabled={disabled} className="p-2 w-full rounded-r-md border-2 border-gray-300 shadow-sm disabled:bg-gray-100" />
        </div>
        <ErrorMessage name={fromName} component="div" className="text-red-500 text-sm" />
        <ErrorMessage name={toName} component="div" className="text-red-500 text-sm" />
    </div>
);

const LocalPricingFields = ({ prefix, disabled }) => (
    <div className="grid grid-cols-2 gap-4">
        <NumberInput name={`${prefix}.pricing.baseKm`} label="Base Km" disabled={disabled} />
        <NumberInput name={`${prefix}.pricing.baseFare`} label="Base Fare" disabled={disabled} />
        <NumberInput name={`${prefix}.pricing.kilometer`} label="Package Km" disabled={disabled} />
        <NumberInput name={`${prefix}.pricing.kilometerPrice`} label="Kilometer Price" disabled={disabled} />
        <NumberInput name={`${prefix}.pricing.nightCharge`} label="Night Charge" disabled={disabled} />
        <NumberInput name={`${prefix}.pricing.driverCharge`} label="Driver Charge" disabled={disabled} />
        <NumberInput name={`${prefix}.pricing.freeExtraMinutes`} label="Free Extra Minutes" disabled={disabled} />
        <NumberInput name={`${prefix}.pricing.additionalMinCharge`} label="Additional Min Charge" disabled={disabled} />
        <TimeRangeInput fromName={`${prefix}.pricing.nightHoursFrom`} toName={`${prefix}.pricing.nightHoursTo`} disabled={disabled} />
    </div>
);

const OutstationPricingFields = ({ prefix, disabled }) => (
    <div className="space-y-5">
        <div>
            <Typography className="font-semibold mb-2">Common</Typography>
            <div className="grid grid-cols-2 gap-4">
                <NumberInput name={`${prefix}.pricing.common.baseKm`} label="Base Km" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.baseFare`} label="Base Fare" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.kilometer`} label="Kilometer" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.cancelMins`} label="Cancellation Mins" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.cancelCharge`} label="Cancellation Charge" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.waitingMins`} label="Waiting Mins" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.waitingCharge`} label="Waiting Charge" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.nightCharge`} label="Night Charge" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.driverCharge`} label="Driver Charge" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.freeExtraMinutes`} label="Free Extra Minutes" disabled={disabled} />
                <NumberInput name={`${prefix}.pricing.common.additionalMinCharge`} label="Additional Min Charge" disabled={disabled} />
                <TimeRangeInput fromName={`${prefix}.pricing.common.nightHoursFrom`} toName={`${prefix}.pricing.common.nightHoursTo`} disabled={disabled} />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full border border-collapse text-sm text-center">
                <thead>
                    <tr className="bg-primary text-white">
                        <th colSpan={2} className="border p-2">Drop Only Non AC</th>
                        <th colSpan={2} className="border p-2">Drop Only AC</th>
                        <th colSpan={2} className="border p-2">Round Trip Non AC</th>
                        <th colSpan={2} className="border p-2">Round Trip AC</th>
                    </tr>
                    <tr className="bg-primary text-white">
                        <th className="border p-2">KM Price</th>
                        <th className="border p-2">Extra KM Price</th>
                        <th className="border p-2">AC KM Price</th>
                        <th className="border p-2">AC Extra KM Price</th>
                        <th className="border p-2">KM Round Price</th>
                        <th className="border p-2">Extra KM Round Price</th>
                        <th className="border p-2">AC KM Round Price</th>
                        <th className="border p-2">AC Extra KM Round Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-gray-100">
                        {[
                            'DROP_ONLY.NON_AC.kilometerPrice',
                            'DROP_ONLY.NON_AC.extraKilometerPrice',
                            'DROP_ONLY.AC.acKilometerPrice',
                            'DROP_ONLY.AC.acExtraKilometerPrice',
                            'ROUND_TRIP.NON_AC.kilometerRoundPrice',
                            'ROUND_TRIP.NON_AC.extraKilometerRoundPrice',
                            'ROUND_TRIP.AC.acKilometerRoundPrice',
                            'ROUND_TRIP.AC.acExtraKilometerRoundPrice',
                        ].map((field) => (
                            <td key={field} className="border p-2 align-top">
                                <Field type="number" name={`${prefix}.pricing.${field}`} disabled={disabled} className="p-2 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" />
                                <ErrorMessage name={`${prefix}.pricing.${field}`} component="div" className="text-red-500 text-sm" />
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

const RentalMasterPriceForm = ({
    values,
    errors,
    setFieldValue,
    zones = [],
    isEdit = false,
    readOnly = false,
}) => {
    const periodOptions = values.type === 'Outstation' ? ['1'] : ['2', '4', '6', '8', '10', '12'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Zone</label>
                    {isEdit || readOnly ? (
                        <Field type="text" name="zone" disabled className="p-2 w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm" />
                    ) : (
                        <Select
                            options={zones}
                            value={zones.find((option) => option.value === values.zone) || null}
                            onChange={(selectedOption) => setFieldValue('zone', selectedOption?.value || '')}
                            placeholder="Select Zone"
                            className="w-full"
                        />
                    )}
                    <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Trip Type</label>
                    {isEdit || readOnly ? (
                        <Field type="text" name="type" disabled className="p-2 w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm" />
                    ) : (
                        <Field
                            as="select"
                            name="type"
                            className="p-2 w-full rounded-md border-2 border-gray-300"
                            onChange={(event) => {
                                setFieldValue('type', event.target.value);
                                setFieldValue('period', '');
                                setFieldValue('categoryPricings', []);
                            }}
                        >
                            <option value="">Select Trip Type</option>
                            <option value="Local">Local</option>
                            <option value="Outstation">Outstation</option>
                        </Field>
                    )}
                    <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Package Type</label>
                    {isEdit || readOnly ? (
                        <Field type="text" name="period" disabled className="p-2 w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm" />
                    ) : (
                        <Field as="select" name="period" className="p-2 w-full rounded-md border-2 border-gray-300">
                            <option value="">Select Package Type</option>
                            {periodOptions.map((period) => <option key={period} value={period}>{period}</option>)}
                        </Field>
                    )}
                    <ErrorMessage name="period" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Select
                        options={STATUS_OPTIONS}
                        value={STATUS_OPTIONS.find((option) => option.value === values.status) || null}
                        onChange={(selectedOption) => setFieldValue('status', selectedOption?.value || '')}
                        placeholder="Select Status"
                        className="w-full"
                        isDisabled={readOnly}
                    />
                    <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                </div>
            </div>

            <FieldArray name="categoryPricings">
                {({ push, remove }) => (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Typography className="text-lg font-semibold">Category Pricings</Typography>
                            {!readOnly && values.type ? (
                                <Button type="button" className="bg-black text-white" onClick={() => push(values.type === 'Outstation' ? createOutstationCategoryPricing() : createLocalCategoryPricing())}>
                                    Add Category
                                </Button>
                            ) : null}
                        </div>
                        <FormLevelError error={errors.categoryPricings} />

                        {values.categoryPricings?.map((categoryPricing, index) => {
                            const prefix = `categoryPricings.${index}`;
                            return (
                                <div key={index} className="border border-gray-300 rounded-lg p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Typography className="font-semibold">Category Pricing</Typography>
                                        {!readOnly && values.categoryPricings.length > 1 ? (
                                            <Button type="button" className="bg-red-500 text-white" onClick={() => remove(index)}>
                                                Remove
                                            </Button>
                                        ) : null}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Category</label>
                                            <Select
                                                options={CATEGORY_OPTIONS}
                                                value={CATEGORY_OPTIONS.find((option) => option.value === categoryPricing.category) || null}
                                                onChange={(selectedOption) => setFieldValue(`${prefix}.category`, selectedOption?.value || '')}
                                                placeholder="Select Category"
                                                className="w-full"
                                                isDisabled={readOnly}
                                            />
                                            <ErrorMessage name={`${prefix}.category`} component="div" className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Car Types</label>
                                            <Select
                                                isMulti
                                                options={CAR_TYPE_OPTIONS}
                                                value={CAR_TYPE_OPTIONS.filter((option) => categoryPricing.carTypes?.includes(option.value))}
                                                onChange={(selectedOptions) => setFieldValue(`${prefix}.carTypes`, selectedOptions ? selectedOptions.map((option) => option.value) : [])}
                                                placeholder="Select Car Types"
                                                className="w-full"
                                                isDisabled={readOnly}
                                            />
                                            <ErrorMessage name={`${prefix}.carTypes`} component="div" className="text-red-500 text-sm" />
                                        </div>
                                    </div>

                                    {values.type === 'Outstation' ? (
                                        <OutstationPricingFields prefix={prefix} disabled={readOnly} />
                                    ) : (
                                        <LocalPricingFields prefix={prefix} disabled={readOnly} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </FieldArray>

            <div className="overflow-x-auto">
                <Typography className="font-semibold mb-2">Driver Cancellation</Typography>
                <table className="w-full border border-collapse text-sm text-center">
                    <thead>
                        <tr className="bg-primary text-white">
                            <th className="border p-2">Driver Cancel Mins</th>
                            <th className="border p-2">Driver Free Cancellations Per Day</th>
                            <th className="border p-2">Driver Cancellation Charge</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-gray-100">
                            <td className="border p-2 align-top">
                                <Field type="number" name="driverCancelMins" disabled={readOnly} className="p-2 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" />
                                <ErrorMessage name="driverCancelMins" component="div" className="text-red-500 text-sm" />
                            </td>
                            <td className="border p-2 align-top">
                                <Field type="number" name="driverFreeCancellationsPerDay" disabled={readOnly} className="p-2 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" />
                                <ErrorMessage name="driverFreeCancellationsPerDay" component="div" className="text-red-500 text-sm" />
                            </td>
                            <td className="border p-2 align-top">
                                <Field type="number" name="driverCancellationCharge" disabled={readOnly} className="p-2 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" />
                                <ErrorMessage name="driverCancellationCharge" component="div" className="text-red-500 text-sm" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export const createLocalCategoryPricing = () => ({
    category: '',
    carTypes: [],
    pricing: {
        baseKm: '',
        baseFare: '',
        kilometer: '',
        kilometerPrice: '',
        peakHours: [],
        nightCharge: '',
        driverCharge: 0,
        nightHoursFrom: '',
        nightHoursTo: '',
        freeExtraMinutes: '',
        additionalMinCharge: '',
    },
});

export const createOutstationCategoryPricing = () => ({
    category: '',
    carTypes: [],
    pricing: {
        common: {
            baseKm: '',
            baseFare: '',
            kilometer: '',
            peakHours: [],
            cancelMins: '',
            nightCharge: '',
            waitingMins: '',
            cancelCharge: '',
            driverCharge: '',
            nightHoursFrom: '',
            nightHoursTo: '',
            waitingCharge: '',
            freeExtraMinutes: '',
            additionalMinCharge: '',
        },
        DROP_ONLY: {
            AC: {
                acKilometerPrice: '',
                acExtraKilometerPrice: '',
            },
            NON_AC: {
                kilometerPrice: '',
                extraKilometerPrice: '',
            },
        },
        ROUND_TRIP: {
            AC: {
                acKilometerRoundPrice: '',
                acExtraKilometerRoundPrice: '',
            },
            NON_AC: {
                kilometerRoundPrice: '',
                extraKilometerRoundPrice: '',
            },
        },
    },
});

export default RentalMasterPriceForm;
