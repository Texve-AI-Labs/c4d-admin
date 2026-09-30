import React, { useEffect, useState } from 'react';
import { Formik, Field, Form, ErrorMessage, FieldArray } from 'formik';
import { Button } from '@material-tailwind/react';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { useNavigate } from 'react-router-dom';
import { DISTANCE_RULE_SCHEMA } from '@/utils/validations';

const DistanceRuleAdd = () => {
  const navigate = useNavigate();
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasLoading, setServiceAreasLoading] = useState(false);

  const buildReasonFromThreshold = (thresholdKm) => {
    const value = String(thresholdKm || '').trim();
    return value ? `OVER_${value}_KM` : '';
  };

  const initialValues = {
    serviceType: 'RENTAL',
    name: 'RENTAL_DROP_ONLY_OUTSTATION_THRESHOLD',
    description: 'Service area based distance threshold after which rental drop-only should suggest outstation',
    config: {
      reason: '',
      thresholdKm: '',
      serviceAreaRules: [
        {
          reason: '',
          thresholdKm: '',
          serviceAreaName: '',
        },
      ],
    },
    isActive: true,
  };

  useEffect(() => {
    const fetchServiceAreas = async () => {
      try {
        setServiceAreasLoading(true);
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
          type: 'Service Area',
        });
        setServiceAreas(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch service areas:', error);
        setServiceAreas([]);
      } finally {
        setServiceAreasLoading(false);
      }
    };

    fetchServiceAreas();
  }, []);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        serviceType: 'RENTAL',
        type: 'DISTANCE_RULE',
        name: values.name,
        description: 'Service area based distance threshold after which rental drop-only should suggest outstation',
        config: {
          reason: values.config.reason,
          thresholdKm: Number(values.config.thresholdKm),
          serviceAreaRules: values.config.serviceAreaRules.map((rule) => ({
            reason: rule.reason,
            thresholdKm: Number(rule.thresholdKm),
            serviceAreaName: rule.serviceAreaName,
          })),
        },
        isActive: values.isActive === true || values.isActive === 'true',
      };

      await ApiRequestUtils.post(API_ROUTES.POST_GST, payload);

      navigate('/dashboard/finance/GSTList', {
        state: { updatedGst: payload, selectedType: 'DISTANCE_RULE' },
      });
    } catch (error) {
      console.error('Distance rule save failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Add Distance Rule</h2>

      <Formik initialValues={initialValues} validationSchema={DISTANCE_RULE_SCHEMA} onSubmit={handleSubmit} enableReinitialize>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-4">
            <Field type="hidden" name="serviceType" />
            <Field type="hidden" name="name" />
            <Field type="hidden" name="config.reason" />
            <Field type="hidden" name="description" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Default Threshold (KM)</label>
                <Field
                  name="config.thresholdKm"
                  type="number"
                  min="1"
                  className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  onChange={(event) => {
                    const { value } = event.target;
                    setFieldValue('config.thresholdKm', value);
                    setFieldValue('config.reason', buildReasonFromThreshold(value));
                  }}
                />
                <ErrorMessage name="config.thresholdKm" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border border-gray-300 shadow-sm">
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </Field>
                <ErrorMessage name="isActive" component="div" className="text-red-500 text-sm" />
              </div>
            </div>

            <FieldArray name="config.serviceAreaRules">
              {({ push, remove }) => (
                <div className="space-y-3 rounded-md border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Service Area Rules</h3>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-primary text-white"
                      onClick={() => push({ reason: '', thresholdKm: '', serviceAreaName: '' })}
                    >
                      Add Rule
                    </Button>
                  </div>

                  {values.config.serviceAreaRules.map((_, index) => (
                    <div key={index} className="grid grid-cols-1 gap-4 rounded-md bg-gray-50 p-3 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Service Area Name</label>
                        <Field as="select" name={`config.serviceAreaRules.${index}.serviceAreaName`} className="p-2 w-full rounded-md border border-gray-300 shadow-sm">
                          <option value="">{serviceAreasLoading ? 'Loading service areas...' : 'Select Service Area'}</option>
                          {serviceAreas.map((area) => (
                            <option key={area.id || area.name} value={area.name}>
                              {area.name}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name={`config.serviceAreaRules.${index}.serviceAreaName`} component="div" className="text-red-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Reason</label>
                        <Field name={`config.serviceAreaRules.${index}.reason`} type="text" disabled placeholder="OVER_120_KM" className="p-2 w-full rounded-md border border-gray-300 bg-gray-100 shadow-sm" />
                        <ErrorMessage name={`config.serviceAreaRules.${index}.reason`} component="div" className="text-red-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Threshold (KM)</label>
                        <div className="flex gap-2">
                          <Field
                            name={`config.serviceAreaRules.${index}.thresholdKm`}
                            type="number"
                            min="1"
                            className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                            onChange={(event) => {
                              const { value } = event.target;
                              setFieldValue(`config.serviceAreaRules.${index}.thresholdKm`, value);
                              setFieldValue(`config.serviceAreaRules.${index}.reason`, buildReasonFromThreshold(value));
                            }}
                          />
                          {values.config.serviceAreaRules.length > 1 && (
                            <Button type="button" color="red" size="sm" onClick={() => remove(index)}>
                              Remove
                            </Button>
                          )}
                        </div>
                        <ErrorMessage name={`config.serviceAreaRules.${index}.thresholdKm`} component="div" className="text-red-500 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FieldArray>

            <div className="flex flex-row">
              <Button
                fullWidth
                type="button"
                onClick={() => navigate('/dashboard/finance/GSTList', { state: { selectedType: 'DISTANCE_RULE' } })}
                className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.backButton}`}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting}
                color="black"
                className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
              >
                Add
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default DistanceRuleAdd;