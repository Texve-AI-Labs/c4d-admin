import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button, Dialog, DialogBody, DialogHeader, DialogFooter, Typography } from '@material-tailwind/react';
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
  const [image2Preview, setImage2Preview] = useState(null);
  const [error, setError] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [dropLocation, setDropLocation] = useState(null);
  const [modalMessage, setModalMessage] = useState(""); 

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

  const mapServiceDetails = (serviceType) => {
    switch (serviceType) {
      case 'DRIVER':
        return { serviceType: 'DRIVER', bookingType: null, packageType: null };
      case 'RENTAL_HOURLY_PACKAGE':
        return { serviceType: 'RENTAL', bookingType: null, packageType: 'Local' };
      case 'RENTAL':
        return { serviceType: 'RENTAL', bookingType: 'ROUND TRIP', packageType: 'Outstation' };
      case 'RENTAL_DROP_TAXI':
        return { serviceType: 'RENTAL', bookingType: 'DROP ONLY', packageType: 'Outstation' };
      case 'RIDES':
        return { serviceType: 'RIDES', bookingType: null, packageType: null };
      case 'AUTO':
        return { serviceType: 'AUTO', bookingType: null, packageType: null };
      case 'PARCEL':
        return { serviceType: 'PARCEL', bookingType: null, packageType: null };
      case 'BIKE':
        return { serviceType: 'BIKE', bookingType: null, packageType: null };
      default:
        return { serviceType: 'RIDES', bookingType: null, packageType: null };
    }
  };

  const initialValues = {
    fromDate: '',
    toDate: '',
    redirectUrl: '',
    title: '',
    status: true,
    type: '',
    image: null,
    image2: null,
    zone: '',
    dropAddress: '',        
    dropLocation: null,     
    navigateTo: '',         
    driverType: '',
    startTime: '',
    endTime: '',
    serviceType: '',
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

  const isTrainingVideoDriver = (type) => type === 'TRAINING_VIDEO_DRIVER';
  const skipStandardFieldTypes = ['NEW_CUSTOMER', 'INTRO_SLIDES', 'INTRO_SLIDES_DRIVER', 'TRAINING_VIDEO_DRIVER', 'QR_PAGE_BANNER'];
  const requiresStandardFields = (type) => Boolean(type) && !skipStandardFieldTypes.includes(type);
  const isServiceIntroImage = (type) => type === 'SERVICE_INTRO_IMAGE';
  const isExternalPromotions = (type) => type === 'EXTERNAL_PROMOTIONS';

  const validationSchema = Yup.object().shape({
    type: Yup.string().required('Type is required'),
    image: Yup.mixed().when('type', {
      is: (type) => !isTrainingVideoDriver(type),
      then: (schema) =>
        schema
          .required('Image is required')
          .test('fileType', 'Only JPEG or PNG or GIF or AVIF or WEBP files are allowed', (value) =>
            value ? ['image/jpeg', 'image/png', 'image/gif', 'image/avif', 'image/webp'].includes(value.type) : false
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    image2: Yup.mixed().when('type', {
      is: isExternalPromotions,
      then: (schema) =>
        schema
          .required('Image 2 is required')
          .test('fileType2', 'Only JPEG or PNG or GIF or AVIF or WEBP files are allowed', (value) =>
            value ? ['image/jpeg', 'image/png', 'image/gif', 'image/avif', 'image/webp'].includes(value.type) : false
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    fromDate: Yup.string().when('type', {
      is: requiresStandardFields,
      then: (schema) => schema.required('Start Date is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    toDate: Yup.string().when('type', {
      is: requiresStandardFields,
      then: (schema) => schema.required('End Date is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    zone: Yup.string().when('type', {
      is: requiresStandardFields,
      then: (schema) => schema.required('Zone is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    startTime: Yup.string().when('type', {
      is: requiresStandardFields,
      then: (schema) => schema.required('Start Time is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    endTime: Yup.string().when('type', {
      is: requiresStandardFields,
      then: (schema) => schema.required('End Time is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    redirectUrl: Yup.string().when('type', {
      is: isExternalPromotions,
      then: (schema) => schema.trim().required('Redirect URL is required'),
      otherwise: (schema) =>
        schema.when('type', {
          is: isTrainingVideoDriver,
          then: (nestedSchema) => nestedSchema.trim().required('YouTube Link is required'),
          otherwise: (nestedSchema) => nestedSchema.notRequired(),
        }),
    }),
    serviceType: Yup.string().when('type', {
      is: isServiceIntroImage,
      then: (schema) => schema.required('Service Type is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    driverType: Yup.string().when('type', {
      is: (type) => type === 'INTRO_SLIDES_DRIVER' || isTrainingVideoDriver(type),
      then: (schema) => schema.required('Driver Type is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    title: Yup.string().when('type', {
      is: isTrainingVideoDriver,
      then: (schema) => schema.trim().required('Heading Text is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const handleImageUpload = (file, setFieldValue) => {
    const validTypes = ['image/jpeg', 'image/png','image/gif','image/avif','image/webp',];
    if (!file || !validTypes.includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and AVIF, WEBP images are allowed.');
      return;
    }

    setFieldValue('image', file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImage2Upload = (file, setFieldValue) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/avif', 'image/webp'];
    if (!file || !validTypes.includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and AVIF, WEBP images are allowed.');
      return;
    }

    setFieldValue('image2', file);
    setImage2Preview(URL.createObjectURL(file));
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
      const formData = new FormData();
      const isIntroType = values.type === 'INTRO_SLIDES' || values.type === 'INTRO_SLIDES_DRIVER';
      const isTrainingVideo = values.type === 'TRAINING_VIDEO_DRIVER';
      const isQrPageImageType = values.type === 'QR_PAGE_BANNER';
      const isNewCustomer = values.type === "NEW_CUSTOMER";
      const isServiceIntro = values.type === "SERVICE_INTRO_IMAGE";
      const mappedServiceDetails = isServiceIntro ? mapServiceDetails(values.serviceType) : null;

      if (!isNewCustomer && !isIntroType && !isTrainingVideo && !isQrPageImageType) {
        formData.append('fromDate', values.fromDate);
        formData.append('startTime', values.startTime || '');
        formData.append('endTime', values.endTime || '');
        formData.append('toDate', values.toDate);
        if (!isServiceIntro) {
          formData.append('redirectUrl', values.redirectUrl.trim());
        }
        if (!isServiceIntro && !isExternalPromotions(values.type)) {
          formData.append('dropAddress', values.dropAddress || '');
          formData.append('dropLat', values.dropLocation?.lat || '');
          formData.append('dropLong', values.dropLocation?.lng || '');
          formData.append('navigateTo', values.navigateTo.trim());
        }
      }
      if (isTrainingVideo) {
        formData.append('redirectUrl', values.redirectUrl.trim());
        formData.append('title', values.title.trim());
      }
      if (isQrPageImageType) {
      formData.append('title', values.title.trim());
      }
      if (isServiceIntro) {
        formData.append('serviceType', mappedServiceDetails?.serviceType || '');
        if (mappedServiceDetails?.bookingType) {
          formData.append('bookingType', mappedServiceDetails.bookingType);
        }
        if (mappedServiceDetails?.packageType) {
          formData.append('packageType', mappedServiceDetails.packageType);
        }
      }
      if (isExternalPromotions(values.type) && values.image2) {
        formData.append('image2', values.image2, values.image2.name);
        formData.append('fileTypeImage2', values.image2?.type || '');
        formData.append('extImage2', values.image2?.name?.split('.').pop()?.toLowerCase() || '');
      }
      if (values.type === 'INTRO_SLIDES_DRIVER' || isTrainingVideo) {
        formData.append('driverType', values.driverType);
      }
      formData.append('status', values.status === 'true' || values.status === true);
      formData.append('type', values.type.trim());
      formData.append('zone', isNewCustomer || isIntroType || isTrainingVideo || isQrPageImageType ? 'All' : values.zone);
      if (!isTrainingVideo && values.image) {
        formData.append('image', values.image, values.image.name);
        formData.append('fileTypeImage', values.image?.type || '');
        formData.append('extImage', values.image?.name?.split('.').pop()?.toLowerCase() || '');
      }

      const response = await ApiRequestUtils.postDocs(API_ROUTES.POST_BANNER, formData);
      if (response?.success === false) {
        setModalMessage(response?.error || response?.message || 'Unable to save banner.');
      return;
    }
      if (response?.success) {
        navigate('/dashboard/user/bannerimgView');
      } else {
        setModalMessage(response?.error || response?.message || 'Banner upload failed.');
      } 
    } catch (err) {
      console.error('Upload error:', err);
      setModalMessage(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto bg-white rounded-xl shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Add Banner</h2>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <Dialog open={Boolean(modalMessage)} handler={() => setModalMessage('')} size="sm">
        <DialogHeader className="flex items-center justify-between">
          <Typography variant="h6" color="blue-gray">
            Alert
          </Typography>
        </DialogHeader>
        <DialogBody divider>
          <Typography variant="paragraph" color="blue-gray">
            {modalMessage}
          </Typography>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            className={`${ColorStyles.continueButtonColor}`}
            onClick={() => setModalMessage('')}
          >
            Ok
          </Button>
        </DialogFooter>
      </Dialog>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values,setFieldValue }) => {
          const isIntroType = values.type === 'INTRO_SLIDES' || values.type === 'INTRO_SLIDES_DRIVER'; 
          const isTrainingVideo = values.type === 'TRAINING_VIDEO_DRIVER';
          const isServiceIntro = values.type === 'SERVICE_INTRO_IMAGE';
          const isQrPageImageType = values.type === 'QR_PAGE_BANNER';
          const hideStandardFields = values.type === 'NEW_CUSTOMER' || isIntroType || isTrainingVideo || isQrPageImageType;
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
                    if (selectedType === 'NEW_CUSTOMER' || selectedType === 'INTRO_SLIDES' || selectedType === 'INTRO_SLIDES_DRIVER' || selectedType === 'SERVICE_INTRO_IMAGE' || selectedType === 'TRAINING_VIDEO_DRIVER' || selectedType === 'QR_PAGE_BANNER') {
                      setFieldValue('zone', 'All');
                    }
                    if (selectedType !== 'INTRO_SLIDES_DRIVER' && selectedType !== 'TRAINING_VIDEO_DRIVER') {
                      setFieldValue('driverType', '');
                    }
                    if (selectedType === 'TRAINING_VIDEO_DRIVER') {
                      setFieldValue('image', null);
                      setFieldValue('image2', null);
                      setImagePreview(null);
                      setImage2Preview(null);
                    }
                  }}
                >
                  <option value="">select the Type</option>
                  <option value="BANNER">Customer Banner First App</option>
                  <option value="BANNER_DRIVER">Banner Driver</option>
                  <option value="ONTRIP_BANNER">On Trip Banner</option>
                  <option value="TOP_NEW">Top New</option>
                  <option value="EXTERNAL_PROMOTIONS">External Promotions</option>
                  <option value="SERVICE_INTRO_IMAGE">Service Intro Image (customer)</option>                  
                  <option value="NEW_CUSTOMER">New Customer</option>
                  <option value="INTRO_SLIDES">Intro Slides (customer)</option>         
                  <option value="INTRO_SLIDES_DRIVER">Intro Slides (Driver)</option>         
                  <option value="TRAINING_VIDEO_DRIVER">Training Video (Driver)</option>
                  <option value="QR_PAGE_BANNER">QR Page Banner</option>
                </Field>
                <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
              </div>
              {(values.type === 'INTRO_SLIDES_DRIVER' || isTrainingVideo) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Driver Type</label>
                  <Field
                    as="select"
                    name="driverType"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  >
                    <option value="">Select Driver Type</option>
                    <option value="ACTING_DRIVER">Driver</option>
                    <option value="CAB">Cab</option>
                    <option value="AUTO">Auto</option>
                    <option value="PARCEL">Parcel</option>
                    <option value="BIKE">Bike</option>
                    <option value="ALL">All</option>
                  </Field>
                  <ErrorMessage name="driverType" component="div" className="text-red-500 text-sm" />
                </div>
              )}
                {isQrPageImageType && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <Field
                    name="title"
                    type="text"
                    placeholder="Enter Title text"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  />
                  <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
                </div>
              )}
              {isTrainingVideo && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Heading Text</label>
                  <Field
                    name="title"
                    type="text"
                    placeholder="Enter heading text"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  />
                  <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
                </div>
              )}
              {isTrainingVideo && (
                <div>
                  <label className="text-sm font-medium text-gray-700">YouTube Link</label>
                  <Field
                    name="redirectUrl"
                    type="text"
                    placeholder="Paste YouTube video link"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  />
                  <ErrorMessage name="redirectUrl" component="div" className="text-red-500 text-sm" />
                </div>
              )}
              {isServiceIntro && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Service Type</label>
                  <Field
                    as="select"
                    name="serviceType"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  >
                    <option value="">Select Service Type</option>
                    <option value="DRIVER">Driver</option>
                    <option value="RENTAL_HOURLY_PACKAGE">Hourly Package</option>
                    <option value="RENTAL">Outstation</option>
                    <option value="RENTAL_DROP_TAXI">Drop Taxi</option>
                    <option value="RIDES">Local</option>
                    <option value="AUTO">Auto</option>
                    <option value="PARCEL">Parcel</option>
                    <option value="BIKE">Bike</option>
                  </Field>
                  <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
                </div>
              )}
              {!hideStandardFields && (
                <>
              <div>
                <label className="text-sm font-medium text-gray-700">From Date</label>
                <Field name="fromDate" type="date" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="fromDate" component="div" className="text-red-500 text-sm" />
              </div>
                 <div>
                <label className="text-sm font-medium text-gray-700">Start Time</label>
                <Field name="startTime" type="time" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="startTime" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">To Date</label>
                <Field name="toDate" type="date" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="toDate" component="div" className="text-red-500 text-sm" />
              </div>
                 <div>
                <label className="text-sm font-medium text-gray-700">End Time</label>
                <Field name="endTime" type="time" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="endTime" component="div" className="text-red-500 text-sm" />
              </div>

              {!isServiceIntro && (
              <div>
                <label className="text-sm font-medium text-gray-700">Redirect URL</label>
                <Field name="redirectUrl" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="redirectUrl" component="div" className="text-red-500 text-sm" />
              </div>
              )}
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
              {!hideStandardFields && !isServiceIntro && !isExternalPromotions && !isQrPageImageType && (
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
                    'BIKE',
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

              
              {!isTrainingVideo && (
                <div>
                  <label htmlFor="image" className="text-sm font-medium text-gray-700">
                   {values.type === 'EXTERNAL_PROMOTIONS' ? 'Only Square Image' : 'Image'}
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
              )}
              {values.type === 'EXTERNAL_PROMOTIONS' && (
                <div>
                  <label htmlFor="image2" className="text-sm font-medium text-gray-700">
                    Only Landscape Image
                  </label>
                  {image2Preview && (
                    <img src={image2Preview} alt="Preview 2" className="w-32 h-32 object-cover mb-2 border" />
                  )}
                  <input
                    name="image2"
                    type="file"
                    accept="image/*"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                    onChange={(e) => handleImage2Upload(e.currentTarget.files[0], setFieldValue)}
                  />
                  <ErrorMessage name="image2" component="div" className="text-red-500 text-sm" />
                </div>
              )}
              
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