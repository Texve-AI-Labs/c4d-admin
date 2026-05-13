import React, { useEffect, useState } from 'react';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import { Button, Typography } from '@material-tailwind/react';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  serviceType: Yup.string().required('Service Type is required'),
  serviceArea: Yup.string()
    .required('Service Area is required')
    .test('all-with-others', 'Cannot select "All" with other service areas', (value) => {
      if (value && value.includes('All')) {
        return value === 'All';
      }
      return true;
    }),
  message: Yup.string().required('Message is required'),
  status: Yup.boolean().required('Status is required'),
});

const CombineAdd = () => {
  const initialValues = {
    serviceType: '',
    serviceArea: '',
    message: '',
    status: true,
  };

  const [serviceAreas, setServiceAreas] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null); // Clear previous errors
      const data = await ApiRequestUtils.post(API_ROUTES.POST_CUSTOMER_NOTIFICATION, values);
      if (data?.success) {
        navigate('/dashboard/vendors/customerNotificationList');
      } else {
        setError('Failed to submit data to the API');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError('An error occurred while submitting the form');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS, {
          type: 'Service Area',
        });
        setServiceAreas(response?.data || []);
      } catch (error) {
        console.error('Error fetching GEO_MARKINGS_LIST:', error);
        setError('Failed to fetch service areas');
      }
    };
    fetchGeoData();
  }, []);

  const SERVICE_AREA_OPTIONS = [
    { value: 'All', label: 'All' },
    ...serviceAreas.map((area) => ({
      value: area.name,
      label: area.name,
    })),
  ];

  const SERVICE_TYPE_OPTIONS = [
    { value: '', label: 'Select Type' },
  { value: 'RIDES', label: 'Rides' },
  { value: 'DROP_TAXI', label: 'Drop Taxi' },
  { value: 'OUTSTATION', label: 'Outstation' },
  { value: 'HOURLY_PACKAGE', label: 'Hourly Package' },
  { value: 'ACTING_DRIVER', label: 'Acting Driver' },
  ];

  const STATUS_OPTIONS = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  return (
    <div className="p-4 mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add New</h2>
      {error && (
        <Typography color="red" className="text-center mb-4">
          {error}
        </Typography>
      )}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="space-y-6">

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                  <Field
                    as="select"
                    name="serviceType"
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  >
                    {SERVICE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm my-1" />
                </div>
                <div>
                  <label htmlFor="serviceArea" className="text-sm font-medium text-gray-700">
                    Service Area
                  </label>
                  <Select
                    name="serviceArea"
                    options={SERVICE_AREA_OPTIONS}
                    isMulti
                    value={
                      values.serviceArea
                        ? values.serviceArea.split(',').map((val) => ({
                            value: val,
                            label: val,
                          }))
                        : []
                    }
                    onChange={(selectedOptions) => {
                      const selectedValues = selectedOptions ? selectedOptions.map((option) => option.value) : [];
                      if (selectedValues.includes('All')) {
                        setFieldValue('serviceArea', 'All');
                      } else {
                        setFieldValue('serviceArea', selectedValues.join(','));
                      }
                    }}
                    placeholder="Select Service Area"
                    className="mt-1"
                    styles={{
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#3b82f6',
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: '#fff',
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: '#fff',
                        ':hover': {
                          backgroundColor: '#2563eb',
                          color: '#fff',
                        },
                      }),
                    }}
                  />
                  <ErrorMessage name="serviceArea" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>

            {/* ROW 2: Status + Message (Same width, same line) */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field
                  as="select"
                  name="status"
                  className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value.toString()} value={opt.value.toString()}>
                      {opt.label}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="status" component="div" className="text-red-500 text-xs mt-1" />
              </div>

                <div>
                  <label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <Field
                    as="textarea"
                    name="message"
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                    rows="4"
                  />
                  <ErrorMessage name="message" component="div" className="text-red-500 text-sm my-1" />
                </div>
              </div>

       
            <div className="flex justify-center gap-8 mt-8">
              <Button
                fullWidth
                className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`}
                type="button"
                onClick={() => navigate('/dashboard/vendors/customerNotificationList')}
              >
                Back
              </Button>
              <Button
                fullWidth
                color="black"
                className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
                type="submit"
                disabled={isSubmitting}
              >
                Send
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CombineAdd;