import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import MasterPriceLog from './MasterPriceLog';
import PremiumPriceDetails from '@/components/PremiumPriceDetails';
import DemandPriceTable from './DemandPrice';
import RentalMasterPriceForm from './RentalMasterPriceForm';
import { normalizeCategoryPricings } from './RentalsMasterPriceEdit';

const RentalsPriceMasterDetails = () => {
    const [initialValues, setInitialValues] = useState(null);
    const [premiumConfig, setPremiumConfig] = useState({});
    const [demandRules, setDemandRules] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPriceDetails = async () => {
            try {
                const data = await ApiRequestUtils.get(`${API_ROUTES.RIDES_PRICE_DETAILS}/${id}`);
                if (data?.success) {
                    const priceData = data.data || {};
                    setInitialValues({
                        serviceType: priceData.serviceType || 'RENTAL',
                        zone: priceData.zone || '',
                        type: priceData.type || '',
                        period: priceData.period || '',
                        status: priceData.status == 1 ? 'ACTIVE' : 'INACTIVE',
                        categoryPricings: normalizeCategoryPricings(priceData),
                    });
                    setPremiumConfig(priceData.premiumConfig || {});
                    setDemandRules(priceData.demandRules || []);
                }
            } catch (error) {
                console.error('Error fetching price details:', error);
            }
        };
        fetchPriceDetails();
    }, [id]);

    return (
        <div className="p-4 mx-auto bg-white">
            <h2 className="text-2xl font-bold mb-4">Rentals Pricing Details</h2>
            {initialValues ? (
            <Formik initialValues={initialValues} enableReinitialize>
                {({ setFieldValue, values, errors }) => (
                    <Form>
                        <RentalMasterPriceForm
                            values={values}
                            errors={errors}
                            setFieldValue={setFieldValue}
                            readOnly
                            isEdit
                        />
                        {values?.type === 'Outstation' ? (
                            <PremiumPriceDetails premiumData={premiumConfig} />
                        ) : null}
                        <DemandPriceTable demandRules={demandRules} />
                        <div className="flex flex-row">
                            <Button fullWidth onClick={() => navigate('/dashboard/finance/master-price')} className={`my-6 mx-2 ${ColorStyles.backButton}`}>
                                Back
                            </Button>
                            <Button fullWidth className={`my-6 mx-2 border-2 border-gray-400 rounded-xl ${ColorStyles.editButton}`} onClick={() => navigate(`/dashboard/finance/master-price/rentals-edit/${id}`)}>
                                Edit
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
            ) : (
                <div className="p-4 text-sm text-gray-600">Loading...</div>
            )}
            <MasterPriceLog id={id} />
        </div>
    );
};

export default RentalsPriceMasterDetails;
