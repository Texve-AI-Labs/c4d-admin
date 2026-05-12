import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select'; // Assuming react-select is used
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';

// Debounce function (same as in Booking page)
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const AddBanner = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [dropLocation, setDropLocation] = useState(null); 

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

  const initialValues = {
    fromDate: '',
    toDate: '',
    redirectUrl: '',
    status: true,
    type: '',
    image: null,
    zone: '',
    dropAddress: '',        
    dropLocation: null,     
    navigateTo: '',         
    driverType: '',
  };

  const fetchGeoData = async () => {
  try {
    const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
      type: 'Service Area',
    });
    const filteredAreas = response.data.filter((area) => area.type === 'Service Area');
    setServiceAreas(filteredAreas || []); // Ensure serviceAreas is always an array
  } catch (error) {
    console.error('Error fetching GEO_MARKINGS_LIST:', error);
    setError('Failed to fetch service areas. Please try again.');
  }
};

  useEffect(() => {
    fetchGeoData();
  }, []);

  const ZONE_OPTIONS = [
    { value: 'All', label: 'All' },
    ...serviceAreas.map((area) => ({
      value: area.name,
      label: area.name,
    })),
  ];

  const validationSchema = Yup.object().shape({
    // status: Yup.boolean().required('Status is required'),
    type: Yup.string().required('Type is required'),
    image: Yup.mixed()
      .required('Image is required')
      .test('fileType', 'Only JPEG or PNG files are allowed', (value) =>
        value ? ['image/jpeg', 'image/png','image/gif','image/avif'].includes(value.type) : false
      ),
    //   fromDate: Yup.string().required('Start Date is required'),
    //   toDate: Yup.string().required('End Date is required'),
    //   zone: Yup.string().required('Zone is required')
  });

  const handleImageUpload = (file, setFieldValue) => {
    const validTypes = ['image/jpeg', 'image/png','image/gif','image/avif'];
    if (!file || !validTypes.includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and AVIF images are allowed.');
      return;
    }

    setFieldValue('image', file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Search Locations (same as Booking page)
  const searchLocations = useCallback(
    debounce(async (query, setFieldValue) => {
      if (query.length > 2) {
        try {
          const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
          if (data?.success && data?.data) {
            setDropSuggestions(data.data);
          } else {
            setDropSuggestions([]);
          }
        } catch (error) {
          console.error('Error searching drop locations:', error);
          setDropSuggestions([]);
        }
      } else {
        setDropSuggestions([]);
      }
    }, 300),
    []
  );

  // Handle Location Selection
  const handleSelectLocation = async (address, setFieldValue) => {
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_LATLONG, { address });
      if (data?.success) {
        const location = { lat: data.data.lat, lng: data.data.lng };
        setFieldValue('dropAddress', address);
        setFieldValue('dropLocation', location);
        setDropLocation(location);
        setDropSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching lat/lng:', error);
    }
  };

  // Submit Handler
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // console.log('Sending image:', values.image?.name, values.image?.type);

      const formData = new FormData();
      const isIntroType = values.type === 'INTRO_SLIDES' || values.type === 'INTRO_SLIDES_DRIVER' || values.type === 'TRAINING_VIDEO_DRIVER';
      const isNewCustomer = values.type === "NEW_CUSTOMER";
      if (!isNewCustomer && !isIntroType) {
        formData.append('fromDate', values.fromDate);
        formData.append('toDate', values.toDate);
        formData.append('redirectUrl', values.redirectUrl.trim());
        formData.append('dropAddress', values.dropAddress || '');
        formData.append('dropLat', values.dropLocation?.lat || '');
        formData.append('dropLong', values.dropLocation?.lng || '');
        formData.append('navigateTo', values.navigateTo.trim());
      }
      if (values.type === 'TRAINING_VIDEO_DRIVER') {
        formData.append('redirectUrl', values.redirectUrl.trim());
      }
      if (values.type === 'INTRO_SLIDES_DRIVER' || values.type === 'TRAINING_VIDEO_DRIVER') {
        formData.append('driverType', values.driverType);
      }
      formData.append('status', values.status === 'true' || values.status === true);
      formData.append('type', values.type.trim());
      formData.append('zone', isNewCustomer || isIntroType ? 'All' : values.zone);
      formData.append('image', values.image, values.image.name);
      formData.append('fileTypeImage', values.image?.type || '');
      formData.append('extImage', values.image?.name?.split('.').pop()?.toLowerCase() || '');

      const response = await ApiRequestUtils.postDocs(API_ROUTES.POST_BANNER, formData);

      if (response?.success) {
        navigate('/dashboard/user/bannerimgView');
      } else {
        setError(response?.error || 'Banner upload failed.');
      } 
    } catch (err) {
      console.error('Upload error:', err);
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Banner</h2>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values,setFieldValue }) => {
          const isIntroType = values.type === 'INTRO_SLIDES' || values.type === 'INTRO_SLIDES_DRIVER' || values.type === 'TRAINING_VIDEO_DRIVER';
          const hideStandardFields = values.type === 'NEW_CUSTOMER' || isIntroType;
          return (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Field
                  as="select"
                  name="type"
                  className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    setFieldValue('type', selectedType);
                    if (selectedType === 'NEW_CUSTOMER' || selectedType === 'INTRO_SLIDES' || selectedType === 'INTRO_SLIDES_DRIVER' || selectedType === 'TRAINING_VIDEO_DRIVER') {
                      setFieldValue('zone', 'All');
                    }
                    if (selectedType !== 'INTRO_SLIDES_DRIVER' && selectedType !== 'TRAINING_VIDEO_DRIVER') {
                      setFieldValue('driverType', '');
                    }
                  }}
                >
                  <option value="">select the Type</option>
                  <option value="TOP">Top</option>
                  <option value="BOTTOM">Bottom</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="BACKGROUND">Background</option>
                  <option value="BANNER">Banner</option>
                  <option value="STATS">Stats</option>
                  <option value="TOP_NEW">Top New</option>
                  {/* <option value="MIDCAROUSEL">MidCarousel</option> */}
                  <option value="PROMOTION">Promotion</option>
                  <option value="BOTTOM_NEW">Bottom New</option>
                  <option value="NEW_CUSTOMER">New Customer</option>
                  <option value="INTRO_SLIDES">Intro Slides (customer)</option>         
                  <option value="INTRO_SLIDES_DRIVER">Intro Slides (Driver)</option>         
                  <option value="TRAINING_VIDEO_DRIVER">Training Video (Driver)</option>         
                </Field>
                <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
              </div>
              {(values.type === 'INTRO_SLIDES_DRIVER' || values.type === 'TRAINING_VIDEO_DRIVER') && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Driver Type</label>
                  <Field
                    as="select"
                    name="driverType"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  >
                    <option value="">Select Driver Type</option>
                    <option value="ACTING_DRIVER">ACTING_DRIVER</option>
                    <option value="CAB">CAB</option>
                    <option value="AUTO">AUTO</option>
                    <option value="PARCEL">PARCEL</option>
                    <option value="ALL">ALL</option>
                  </Field>
                  <ErrorMessage name="driverType" component="div" className="text-red-500 text-sm" />
                </div>
              )}
              {values.type === 'TRAINING_VIDEO_DRIVER' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Redirect URL</label>
                    <Field
                      name="redirectUrl"
                      type="text"
                      className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                    />
                    <ErrorMessage name="redirectUrl" component="div" className="text-red-500 text-sm" />
                  </div>
                </>
              )}
              {!hideStandardFields && (
                <>
              <div>
                <label className="text-sm font-medium text-gray-700">From Date</label>
                <Field name="fromDate" type="date" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="fromDate" component="div" className="text-red-500 text-sm" />
              </div>
             
              <div>
                <label className="text-sm font-medium text-gray-700">To Date</label>
                <Field name="toDate" type="date" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="toDate" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Redirect URL</label>
                <Field name="redirectUrl" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="redirectUrl" component="div" className="text-red-500 text-sm" />
              </div>
              </>)}
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="status" className="p-2 w-full rounded-md border border-gray-300 shadow-sm">
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </Field>
                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
              </div>

              <div  className={`${hideStandardFields ? 'hidden' : ''}`}>
                <label htmlFor="zone" className="text-sm font-medium text-gray-700">
                  Zone
                </label>
                <Select
                  options={ZONE_OPTIONS}
                  value={ZONE_OPTIONS.find((opt) => opt.value === values.zone) || null}
                  onChange={(opt) => setFieldValue('zone', opt?.value || '')}
                  placeholder="Select Zone"
                  isDisabled={hideStandardFields}
                  className="w-full"
                  name="zone" />
                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Drop Location (New Field) */}
              {!hideStandardFields && (
                <>              
              <div>
                <label className="text-sm font-medium text-gray-700">Drop Location </label>
                <Field
                  name="dropAddress"
                  type="text"
                  placeholder="Search drop location..."
                  className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  onChange={(e) => {
                    const val = e.target.value;
                    setFieldValue('dropAddress', val);
                    setFieldValue('dropLocation', null);
                    searchLocations(val, setFieldValue);
                  }}
                />
                {dropSuggestions.length > 0 && (
                  <ul className="border rounded-md bg-white mt-1 max-h-40 overflow-y-auto z-10">
                    {dropSuggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSelectLocation(getSuggestionText(suggestion), setFieldValue)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-black">{getSuggestionTitle(suggestion)}</span>
                          {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                            <span className="text-xs text-gray-600">{getSuggestionText(suggestion)}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
               
              </div>

              {/* NEW FIELD: Navigate To */}
            <div>
                <label className="text-sm font-medium text-gray-700">Navigate To</label>
                <Field
                  as="select"
                  name="navigateTo"
                  className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                >
                  <option value="">Select navigation path...</option>
                  {[
                    'RENTAL_DROP_TAXI',
                    'RENTAL',
                    'AUTO',
                    'RIDES',
                    'DRIVER',
                    'PARCEL',
                    'RENTAL_HOURLY_PACKAGE',
                    'EMERGENCY_CONTACT',
                    'REFER_AND_EARN'
                  ].map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Field>
              </div>
              </>)}

              {/* Image Upload */}

              
              <div>
                <label htmlFor="image" className="text-sm font-medium text-gray-700">
                  Image
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover mb-2 border" />
                )}
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  onChange={(e) => handleImageUpload(e.currentTarget.files[0], setFieldValue)}
                />
                <ErrorMessage name="image" component="div" className="text-red-500 text-sm" />
              </div>
              
            </div>

            <div className="flex flex-row">
              <Button
                fullWidth
                type="button"
                onClick={() => navigate('/dashboard/user/bannerimgView')}
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
          );
        }}
      </Formik>
    </div>
  );
};

export default AddBanner;
