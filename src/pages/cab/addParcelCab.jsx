import React, { useEffect, useState } from 'react';
import { Button, Input, List, ListItem, Typography } from '@material-tailwind/react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';

const LocationInput = ({ field, form, suggestions, onSearch, onSelect, type }) => {
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
                const selectedText = getSuggestionText(suggestion);
                form.setFieldValue(field.name, selectedText);
                if (onSelect) onSelect(selectedText, suggestion);
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
  modelYear: Yup.string()
    .required('Year of Model is required')
    .matches(/^\d{4}$/, 'Model Year must be a 4-digit year')
    .test('is-valid-year', 'Model Year cannot be in the future', (value) => {
      if (!value) return true;
      const currentYear = new Date().getFullYear();
      return parseInt(value, 10) <= currentYear;
    }),
});

const ParcelCabAdd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ownerName = '', accountId = '' } = location?.state || {}; 

  const [ownerAddressSuggestions, setOwnerAddressSuggestions] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [serviceAreaFetchError, setServiceAreaFetchError] = useState('');
  const [zoneFetchError, setZoneFetchError] = useState('');

  useEffect(() => {
    const fetchServiceAreas = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
          type: 'Service Area',
        });
        const allAreas = Array.isArray(response?.data) ? response.data : [];
        const filteredAreas = allAreas.filter((area) => area.type === 'Service Area');
        setServiceAreas(filteredAreas);
        setServiceAreaFetchError('');
      } catch (error) {
        console.error('Error fetching service areas:', error);
        setServiceAreaFetchError('Failed to fetch service areas. Please try again.');
      }
    };

    const fetchZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
          type: 'Zone',
        });
        const allZones = Array.isArray(response?.data) ? response.data : [];
        const filteredZones = allZones.filter((zone) => zone.type === 'Zone' && zone.description === 'Zone');
        setZones(filteredZones);
        setZoneFetchError('');
      } catch (error) {
        console.error('Error fetching zones:', error);
        setZoneFetchError('Failed to fetch zones. Please try again.');
      }
    };

    fetchServiceAreas();
    fetchZones();
  }, []);

  const SERVICE_AREA_OPTIONS = serviceAreas.map((area) => ({
    value: area.name,
    label: area.name,
    id: area.id,
  }));

  const ZONE_OPTIONS = zones.map((zone) => ({
    value: zone.name,
    label: zone.name,
    id: zone.id,
    parentId: zone.parent_id,
  }));

  const searchLocations = async (query, type) => {
    if (query.length > 2) {
      try {
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
          address: query,
        });
        if (data?.success && data?.data && type === 'owner') {
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
    <div className="p-4 mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add New Vehicle</h2>

      <Formik
        initialValues={{
          accountId: accountId,
          name: '',
          ownerName: ownerName, 
          vehicleNumber: '',
          address: '',
          insurance: '',
          autoType: 'BIKE',
          seater: '3',
          modelYear: '',
          serviceArea: '',
          zoneDescription: '',
          subZoneId: '',
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            if (!values.serviceArea) {
              alert('Please select service area');
              setSubmitting(false);
              return;
            }
            if (!values.zoneDescription) {
              alert('Please select zone');
              setSubmitting(false);
              return;
            }

            const payload = {
              accountId: values.accountId,
              name: values.name,
              company: values.ownerName,
              vehicleNumber: values.vehicleNumber,
              curAddress: values.address,
              insurance: values.insurance,
              vehicleType: 'BIKE',
              seater: values.seater,
              modelYear: values.modelYear,
              serviceArea: values.serviceArea,
              subZoneId: values.subZoneId,
            };
            const res = await ApiRequestUtils.post(API_ROUTES.CREATE_PARCEL_ADMIN, payload);

            if (res?.success) {
              
              navigate(`/dashboard/vendors/account/parcel/details/${accountId}`, {
                state: { refresh: true }
              });
            } else {
              alert(`Failed to add bike: ${res?.message || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('Submission error:', error);
            alert('Something went wrong!');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleChange, values, setFieldValue }) => {
          const selectedArea = serviceAreas.find((area) => area.name === values.serviceArea);
          const filteredZoneOptions = ZONE_OPTIONS.filter(
            (zone) => !selectedArea || !zone.parentId || zone.parentId === selectedArea.id
          );
          return (
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
              <div>
                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
                  Owner Name
                </label>
                <Field name="ownerName" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
                  Bike Number
                </label>
                <Field
                  name="vehicleNumber"
                  maxLength={10}
                  className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                />
                <ErrorMessage name="vehicleNumber" component="div" className="text-red-500 text-sm" />
              </div>
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
              <div className='hidden'>
                <label className="text-sm font-medium text-gray-700">Bike Type</label>
                <div className="space-x-4 mt-1">
                  {['BIKE'].map((type) => (
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

              <div>
                <label htmlFor="seater" className="text-sm font-medium text-gray-700">
                  Seater
                </label>
                <Field name="seater" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">
                  Year of Model
                </label>
                <Field name="modelYear" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
              </div>
                <div>
                  <label htmlFor="serviceArea" className="text-sm font-medium text-gray-700">
                    Service Area
                  </label>
                  <Select
                    options={SERVICE_AREA_OPTIONS}
                    value={SERVICE_AREA_OPTIONS.find((opt) => opt.value === values.serviceArea) || null}
                    onChange={(opt) => {
                      const selected = opt?.value || '';
                      setFieldValue('serviceArea', selected);
                    }}
                    placeholder="Select Service Area"
                    className="w-full"
                    name="serviceArea"
                  />
                  <ErrorMessage name="serviceArea" component="div" className="text-red-500 text-sm" />
                  {serviceAreaFetchError ? (
                    <Typography variant="small" className="text-red-500 mt-1">
                      {serviceAreaFetchError}
                    </Typography>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="zoneDescription" className="text-sm font-medium text-gray-700">
                    Zone (Type: Zone / Description: Zone)
                  </label>
                  <Select
                    options={filteredZoneOptions}
                    value={filteredZoneOptions.find((opt) => opt.value === values.zoneDescription) || null}
                    onChange={(opt) => {
                      setFieldValue('zoneDescription', opt?.value || '');
                      setFieldValue('subZoneId', opt?.id || '');
                    }}
                    placeholder="Select Zone"
                    className="w-full"
                    name="zoneDescription"
                    isDisabled={!values.serviceArea}
                  />
                  <ErrorMessage name="zoneDescription" component="div" className="text-red-500 text-sm" />
                  {zoneFetchError ? (
                    <Typography variant="small" className="text-red-500 mt-1">
                      {zoneFetchError}
                    </Typography>
                  ) : null}
                </div>
            </div>
            <div className="flex flex-row">
              <Button
                fullWidth
                className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl"
                onClick={() => navigate('/dashboard/vendors/account/parcel')}
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
          );
        }}
      </Formik>
    </div>
  );
};

export default ParcelCabAdd;
