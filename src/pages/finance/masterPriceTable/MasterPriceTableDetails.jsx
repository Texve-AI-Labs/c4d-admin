import React, { useEffect, useState } from 'react';
import { Button, Typography } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import MasterPriceLog from './MasterPriceLog';
import RidesPeakHourTableDetails from './RidesPeakHourTableDetails';

const CATEGORY_LABELS = {
    ECONOMY_GO: 'Economy Go',
    COMFORT: 'Comfort',
    PREMIUM: 'Premium',
    PREMIUM_XL: 'Premium XL',
};

const CAR_TYPE_LABELS = {
    MINI: 'Mini',
    SEDAN: 'Sedan',
    SUV: 'Suv',
    MUV: 'Muv',
};

const emptyCategoryPricing = {
    category: '',
    carTypes: [],
    pricing: {
        baseKm: '',
        baseFare: '',
        kilometerPrice: '',
        minCharge: '',
        nightCharge: '',
        waitingCharge: '',
        freeExtraMinutes: '',
        additionalMinCharge: '',
        surChargePercentage: '',
        nightHoursFrom: '',
        nightHoursTo: '',
        peakHours: [],
    },
};

const toTimeValue = (timeString) => timeString ? String(timeString).slice(0, 5) : '';

const normalizeCategoryPricings = (priceData) => {
    if (Array.isArray(priceData?.categoryPricings) && priceData.categoryPricings.length > 0) {
        return priceData.categoryPricings.map((item) => ({
            category: item.category || '',
            carTypes: Array.isArray(item.carTypes) ? item.carTypes : [],
            pricing: {
                baseKm: item.pricing?.baseKm ?? '',
                baseFare: item.pricing?.baseFare ?? '',
                kilometerPrice: item.pricing?.kilometerPrice ?? '',
                minCharge: item.pricing?.minCharge ?? '',
                nightCharge: item.pricing?.nightCharge ?? '',
                waitingCharge: item.pricing?.waitingCharge ?? '',
                freeExtraMinutes: item.pricing?.freeExtraMinutes ?? '',
                additionalMinCharge: item.pricing?.additionalMinCharge ?? '',
                surChargePercentage: item.pricing?.surChargePercentage ?? '',
                nightHoursFrom: toTimeValue(item.pricing?.nightHoursFrom),
                nightHoursTo: toTimeValue(item.pricing?.nightHoursTo),
                peakHours: Array.isArray(item.pricing?.peakHours) ? item.pricing.peakHours : [],
            },
        }));
    }

    return [emptyCategoryPricing];
};

const ReadOnlyField = ({ label, value }) => (
    <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 p-3 w-full rounded-md border border-gray-200 bg-gray-100 min-h-[46px]">
            {value || '-'}
        </div>
    </div>
);

const PriceDetails = () => {
    const [priceDetails, setPriceDetails] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPriceDetails();
    }, []);

    const fetchPriceDetails = async () => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${id}`);
            if (data?.success) {
                const priceData = data.data || {};
                setPriceDetails({
                    serviceType: priceData.serviceType || 'RIDES',
                    type: priceData.type || 'Rides',
                    zone: priceData.zone || '',
                    rateParameter: priceData.rateParameter || '',
                    status: priceData.status == 1 ? 'ACTIVE' : 'INACTIVE',
                    categoryPricings: normalizeCategoryPricings(priceData),
                });
            }
        } catch (error) {
            console.error('Error fetching price details:', error);
        }
    };

    return (
        <div className="p-4 mx-auto bg-white">
            <h2 className="text-2xl font-bold mb-4">Rides Pricing Details</h2>
            <div className="space-y-7">
                <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField label="Service Type" value={priceDetails?.serviceType} />
                    <ReadOnlyField label="Type" value={priceDetails?.type} />
                    <ReadOnlyField label="Zone" value={priceDetails?.zone} />
                    <ReadOnlyField label="Status" value={priceDetails?.status} />
                    <ReadOnlyField label="Rate Parameter" value={priceDetails?.rateParameter} />
                </div>

                <div className="space-y-6">
                    <Typography className="text-lg font-semibold">Category Pricings</Typography>
                    {priceDetails?.categoryPricings?.map((categoryPricing, index) => (
                        <div key={index} className="border border-gray-300 rounded-lg p-4 space-y-4">
                            <Typography className="font-semibold">Category Pricing</Typography>
                            <div className="grid grid-cols-2 gap-4">
                                <ReadOnlyField label="Category" value={CATEGORY_LABELS[categoryPricing.category] || categoryPricing.category} />
                                <ReadOnlyField
                                    label="Car Types"
                                    value={categoryPricing.carTypes.map((carType) => CAR_TYPE_LABELS[carType] || carType).join(', ')}
                                />
                                <ReadOnlyField label="Base Km" value={categoryPricing.pricing.baseKm} />
                                <ReadOnlyField label="Base Fare" value={categoryPricing.pricing.baseFare} />
                                <ReadOnlyField label="Kilometer Price" value={categoryPricing.pricing.kilometerPrice} />
                                <ReadOnlyField label="Min Charge" value={categoryPricing.pricing.minCharge} />
                                <ReadOnlyField label="Night Charge" value={categoryPricing.pricing.nightCharge} />
                                <ReadOnlyField label="Waiting Charge" value={categoryPricing.pricing.waitingCharge} />
                                <ReadOnlyField label="Free Extra Minutes" value={categoryPricing.pricing.freeExtraMinutes} />
                                <ReadOnlyField label="Additional Min Charge" value={categoryPricing.pricing.additionalMinCharge} />
                                <ReadOnlyField label="Surcharge Percentage" value={categoryPricing.pricing.surChargePercentage} />
                                <ReadOnlyField
                                    label="Night Hours"
                                    value={`${categoryPricing.pricing.nightHoursFrom || '-'} to ${categoryPricing.pricing.nightHoursTo || '-'}`}
                                />
                            </div>

                            <RidesPeakHourTableDetails priceData={categoryPricing.pricing.peakHours} />
                        </div>
                    ))}
                </div>

                <div className="flex flex-row">
                    <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className={`my-6 mx-2 ${ColorStyles.backButton}`}>
                        Back
                    </Button>
                    <Button
                        fullWidth
                        className={`my-6 mx-2 border-2 border-gray-400 rounded-xl ${ColorStyles.editButton}`}
                        onClick={() => navigate(`/dashboard/finance/master-price/rides-edit/${id}`)}
                    >
                        Edit
                    </Button>
                </div>
            </div>
            <MasterPriceLog id={id} />
        </div>
    );
};

export default PriceDetails;