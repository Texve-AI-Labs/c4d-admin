import React, { useEffect, useState } from 'react';
import { Button } from '@material-tailwind/react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import AccountCreationTabs from './AccountCreationTabs';
import LocationInput from './LocationInput';

const validationSchema = Yup.object({
  name: Yup.string().required('Vehicle Name is required'),
  ownerName: Yup.string().required('Owner Name is required'),
  autoNumber: Yup.string().required('Auto Number is required'),
  address: Yup.string().required('Address is required'),
  insurance: Yup.string().required('Insurance Expiry Date is required'),
  autoType: Yup.string().required('Auto Type is required'),
  seater: Yup.string().required('Seater is required'),
  modelYear: Yup.string()
    .required('Year of Model is required')
    .matches(/^\d{4}$/, 'Model Year must be a 4-digit year')
    .test('is-valid-year', 'Model Year cannot be in the future', (value) => {
      if (!value) return true;
      const currentYear = new Date().getFullYear();
      return parseInt(value, 10) <= currentYear;
    }),
});

const AutoCreation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [ownerAddressSuggestions, setOwnerAddressSuggestions] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);

  const accountId = location?.state?.accountId || id || '';
  const ownerName = location?.state?.ownerName || accountInfo?.name || '';

  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId) return;
      try {
        const res = await ApiRequestUtils.get(`${API_ROUTES.GET_ACCOUNT_BY_ID}/${accountId}`);
        setAccountInfo(res?.data?.data || null);
      } catch (err) {
        console.error('Failed to load account details', err);
      }
    };
    fetchAccount();
  }, [accountId]);

  const searchLocations = async (query) => {
    if (query.length > 2) {
      try {
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
          address: query,
        });
        if (data?.success && data?.data) {
          setOwnerAddressSuggestions(data?.data);
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      }
    } else {
      setOwnerAddressSuggestions([]);
    }
  };

  const currentDate = () => new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <AccountCreationTabs activeStage={4} />
      {/* <h2 className="text-2xl font-bold mb-4">Add New Auto</h2> */}

      <Formik
        initialValues={{
          accountId,
          name: '',
          ownerName,
          autoNumber: '',
          address: '',
          insurance: '',
          autoType: '',
          seater: '3',
          modelYear: '',
        }}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const payload = {
              accountId: values.accountId,
              name: values.name,
              company: values.ownerName,
              autoNumber: values.autoNumber,
              curAddress: values.address,
              insurance: values.insurance,
              vehicleType: values.autoType,
              seater: values.seater,
              modelYear: values.modelYear,
              curLatitude: '',
              curLongitude: '',
            };
            const res = await ApiRequestUtils.post(API_ROUTES.ADD_NEW_AUTO_DETAILS, payload);
            if (res?.success) {
              navigate(`/dashboard/vendors/account/owner-onboarding-auto/details/completed/${values.accountId}`);
            } else {
              window.alert(res?.message || 'Failed to add auto');
            }
          } catch (error) {
            console.error('Submission error:', error);
            window.alert('Something went wrong!');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleChange }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Vehicle Name</label>
                <Field name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Owner Name</label>
                <Field name="ownerName" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="autoNumber" className="text-sm font-medium text-gray-700">Auto Number</label>
                <Field name="autoNumber" maxLength={10} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="autoNumber" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="address" className="text-sm font-medium text-gray-700">Address</label>
                <Field name="address">
                  {({ field, form }) => (
                    <LocationInput
                      field={field}
                      form={form}
                      suggestions={ownerAddressSuggestions}
                      onSearch={searchLocations}
                      onSelect={() => {}}
                    />
                  )}
                </Field>
                <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="insurance" className="text-sm font-medium text-gray-700">Insurance Expiry Date</label>
                <Field type="date" name="insurance" className="p-2 w-full border-2 rounded-md border-gray-300 shadow-sm" min={currentDate()} />
                <ErrorMessage name="insurance" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Auto Type</label>
                <div className="space-x-4 mt-1">
                  {['CNG', 'LPG', 'Diesel'].map((type) => (
                    <label key={type} className="inline-flex items-center">
                      <Field type="radio" name="autoType" value={type} className="mr-2" onChange={handleChange} />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                <ErrorMessage name="autoType" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="seater" className="text-sm font-medium text-gray-700">Seater</label>
                <Field name="seater" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">Year of Model</label>
                <Field name="modelYear" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <Button type="button" className={ColorStyles.backButton} onClick={() => navigate(`/dashboard/vendors/account/owner-onboarding-auto/vehicle-documents/${accountId}`)}>
                Back
              </Button>
              <Button type="submit" className={ColorStyles.continueButtonColor}>Create Auto</Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AutoCreation;
