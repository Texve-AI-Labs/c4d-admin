import React, { useEffect, useState } from 'react';
import { Button, Input, List, ListItem, Typography } from '@material-tailwind/react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';

const LocationInput = ({ field, form, suggestions, onSearch, type }) => {
  const [isFocused, setIsFocused] = useState(false);

  const getSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') return suggestion;
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.fullText || suggestion.title || suggestion.subtitle || '';
  };

  const getSuggestionTitle = (suggestion) => {
    if (typeof suggestion === 'string') {
      const [firstPart] = suggestion.split(',');
      return (firstPart || suggestion).trim();
    }
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.title || suggestion.fullText || '';
  };

  useEffect(() => {
    form.validateField(field.name);
  }, []);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Enter address"
        {...field}
        onChange={(e) => {
          form.setFieldValue(field.name, e.target.value);
          onSearch(e.target.value, type);
          form.setFieldTouched(field.name, true, false);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          field.onBlur(e);
          setTimeout(() => setIsFocused(false), 200);
          form.validateField(field.name);
        }}
        className="pr-10"
      />
      {suggestions.length > 0 && isFocused && (
        <List className="w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <ListItem
              key={index}
              onClick={() => {
                form.setFieldValue(field.name, getSuggestionText(suggestion));
                setIsFocused(false);
                form.validateField(field.name);
              }}
              className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex flex-col">
                <Typography variant="small" className="font-bold text-black">
                  {getSuggestionTitle(suggestion)}
                </Typography>
                {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                  <Typography variant="small" className="text-xs text-gray-600">
                    {getSuggestionText(suggestion)}
                  </Typography>
                )}
              </div>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

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

const AutoForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ownerName = '', accountId = '' } = location?.state || {}; // Get ownerName and accountId from state

  const [ownerAddressSuggestions, setOwnerAddressSuggestions] = useState([]);

  const searchLocations = async (query, type) => {
    if (query.length > 2) {
      try {
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
          address: query,
        });
        if (data?.success && data?.data) {
          if (type === 'owner') {
            setOwnerAddressSuggestions(data?.data);
          }
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      }
    } else {
      setOwnerAddressSuggestions([]);
    }
  };

  const currentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="p-4 mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add New Auto</h2>

      <Formik
        initialValues={{
          accountId: accountId,
          name: '',
          ownerName: ownerName, // Set default ownerName from location.state
          autoNumber: '',
          address: '',
          insurance: '',
          autoType: '',
          seater: '3',
          modelYear: '',
          
          
        }}
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
      // Navigate back to AutoDetails with refreshed data
      navigate(`/dashboard/vendors/account/autoView/details/${accountId}`, {
        state: { refresh: true }
      });
    } else {
      alert('Failed to add auto: ' + (res?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Something went wrong!');
  } finally {
    setSubmitting(false);
  }
}}
      >
        {({ handleChange, values }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Vehicle Name */}
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Vehicle Name
                </label>
                <Field name="name" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Owner Name */}
              <div>
                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
                  Owner Name
                </label>
                <Field name="ownerName" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Auto Number */}
              <div>
                <label htmlFor="autoNumber" className="text-sm font-medium text-gray-700">
                  Auto Number
                </label>
                <Field
                  name="autoNumber"
                  maxLength={10}
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage name="autoNumber" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Address
                </label>
                <Field name="address">
                  {({ field, form }) => (
                    <LocationInput
                      field={field}
                      form={form}
                      suggestions={ownerAddressSuggestions}
                      onSearch={searchLocations}
                      type="owner"
                    />
                  )}
                </Field>
                <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Insurance Date */}
              <div>
                <label htmlFor="insurance" className="text-sm font-medium text-gray-700">
                  Insurance Expiry Date
                </label>
                <Field
                  type="date"
                  name="insurance"
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                  min={currentDate()}
                />
                <ErrorMessage name="insurance" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Auto Type */}
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Type</label>
                <div className="space-x-4 mt-1">
                  {['CNG', 'LPG', 'Diesel'].map((type) => (
                    <label key={type} className="inline-flex items-center">
                      <Field
                        type="radio"
                        name="autoType"
                        value={type}
                        className="mr-2"
                        onChange={handleChange}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                <ErrorMessage name="autoType" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Seater */}
              <div>
                <label htmlFor="seater" className="text-sm font-medium text-gray-700">
                  Seater
                </label>
                <Field name="seater" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Year of Model */}
              <div>
                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">
                  Year of Model
                </label>
                <Field name="modelYear" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
              </div>

              

             
            </div>

            {/* Buttons */}
            <div className="flex flex-row">
              <Button
                fullWidth
                className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl"
                onClick={() => navigate('/dashboard/vendors/account/autoView/details')}
                type="reset"
              >
                Cancel
              </Button>
              <Button
                fullWidth
                color="black"
                className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                type="submit"
                // onClick={()=>navigate('/dashboard/vendors/account/autoView/details')}
              >
                Continue
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AutoForm;
