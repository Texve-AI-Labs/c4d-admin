import React, { useMemo, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button, Dialog, DialogBody, DialogHeader, DialogFooter, Typography, Switch } from '@material-tailwind/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const toDateInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('T')) {
    return value.slice(0, 10);
  }
  return value;
};

const toDateOnly = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value;
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
      return { serviceType: 'RENTAL', bookingType: 'DROP_ONLY', packageType: 'Outstation' };
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

const normalizeBannerType = (type) => {
  const typeMap = {
    'Customer Banner First App': 'BANNER',
    'One Time Driver Banner': 'BANNER_DRIVER',
    'Trip Screen Banner': 'ONTRIP_BANNER',
    'Dashboard Banner Image': 'TOP_NEW',
    'Service Intro Image (customer)': 'SERVICE_INTRO_IMAGE',
    'New Customer': 'NEW_CUSTOMER',
    'Intro Slides (customer)': 'INTRO_SLIDES',
    'Intro Slides (Driver)': 'INTRO_SLIDES_DRIVER',
    'Future Booking Intro (Driver)': 'FUTURE_BOOKING_INTRO_DRIVER',
    'Return Trip Intro (Driver)': 'RETURN_TRIP_INTRO_DRIVER',
    'Training Video (Driver)': 'TRAINING_VIDEO_DRIVER',
  };

  return typeMap[type] || type;
};

const isTrainingVideoDriver = (type) => type === 'TRAINING_VIDEO_DRIVER';
const isServiceIntroImage = (type) => type === 'SERVICE_INTRO_IMAGE';
const isBannerTargetedMode = (type, mode) => type === 'BANNER' && mode === 'TARGETED';
const isIntroType = (type) => type === 'INTRO_SLIDES' || type === 'INTRO_SLIDES_DRIVER' || type === 'FUTURE_BOOKING_INTRO_DRIVER' || type === 'RETURN_TRIP_INTRO_DRIVER';
const isQrPageImageType = (type) => type === 'QR_DRIVER_TO_DRIVER' || type === 'QR_DRIVER_TO_CUSTOMER' || type === 'QR_CUSTOMER_TO_CUSTOMER';
const isStandardBannerType = (type) => Boolean(type) && type !== 'NEW_CUSTOMER' && !isIntroType(type) && !isTrainingVideoDriver(type);

const EditBanner = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const banner = location.state?.banner || {};
  const [modalMessage, setModalMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(banner?.imageUrl || banner?.image || null);
  const [dropSuggestions, setDropSuggestions] = useState([]);

  const initialValues = useMemo(() => ({
    bannerId: banner?.id || id || '',
    status: banner?.status ?? false,
    type: normalizeBannerType(banner?.type || ''),
    mode: banner?.mode || 'GENERAL',
    fromDate: toDateInputValue(banner?.fromDate),
    toDate: toDateInputValue(banner?.toDate),
    startTime: banner?.startTime || '',
    endTime: banner?.endTime || '',
    redirectUrl: banner?.redirectUrl || '',
    zone: banner?.zone || '',
    serviceType: banner?.serviceType || '',
    driverType: banner?.driverType || '',
    title: banner?.title || '',
    dropAddress: banner?.dropAddress || '',
    dropLocation: banner?.dropLocation || (
      banner?.dropLat != null && banner?.dropLong != null
        ? { lat: banner.dropLat, lng: banner.dropLong }
        : null
    ),
    navigateTo: banner?.navigateTo || '',
    image: null,
    eligibilityConfig: banner?.eligibilityConfig || {},
  }), [banner, id]);

  const schema = Yup.object().shape({
    bannerId: Yup.string().required(),
    status: Yup.boolean().required('Status is required'),
    fromDate: Yup.string().when('type', {
      is: (type) => Boolean(type) && type !== 'NEW_CUSTOMER' && !isIntroType(type) && !isTrainingVideoDriver(type),
      then: (schema) => schema.required('Start Date is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    toDate: Yup.string().when('type', {
      is: (type) => Boolean(type) && type !== 'NEW_CUSTOMER' && !isIntroType(type) && !isTrainingVideoDriver(type),
      then: (schema) => schema.required('End Date is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    zone: Yup.string().when('type', {
      is: (type) => Boolean(type) && type !== 'NEW_CUSTOMER' && !isIntroType(type) && !isTrainingVideoDriver(type),
      then: (schema) => schema.required('Zone is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    startTime: Yup.string().when('type', {
      is: (type) => Boolean(type) && type !== 'NEW_CUSTOMER' && !isIntroType(type) && !isTrainingVideoDriver(type),
      then: (schema) => schema.required('Start Time is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    endTime: Yup.string().when('type', {
      is: (type) => Boolean(type) && type !== 'NEW_CUSTOMER' && !isIntroType(type) && !isTrainingVideoDriver(type),
      then: (schema) => schema.required('End Time is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    serviceType: Yup.string().when('type', {
      is: isServiceIntroImage,
      then: (schema) => schema.required('Service Type is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    eligibilityConfig: Yup.object().when(['type', 'mode'], {
      is: (type, mode) => isBannerTargetedMode(type, mode),
      then: (schema) => schema.required('Eligibility config is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    driverType: Yup.string().when('type', {
      is: (type) => type === 'INTRO_SLIDES_DRIVER' || isTrainingVideoDriver(type),
      then: (schema) => schema.required('Driver Type is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    title: Yup.string().when('type', {
      is: (type) => type === 'QR_DRIVER_TO_DRIVER' || type === 'QR_DRIVER_TO_CUSTOMER' || type === 'QR_CUSTOMER_TO_CUSTOMER' || isTrainingVideoDriver(type),
      then: (schema) => schema.trim().required('Heading Text is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      const isIntroType = values.type === 'INTRO_SLIDES' || values.type === 'INTRO_SLIDES_DRIVER' || values.type === 'FUTURE_BOOKING_INTRO_DRIVER' || values.type === 'RETURN_TRIP_INTRO_DRIVER';
      const isTrainingVideo = values.type === 'TRAINING_VIDEO_DRIVER';
      const isQrPageImageType = values.type === 'QR_DRIVER_TO_DRIVER' || values.type === 'QR_DRIVER_TO_CUSTOMER' || values.type === 'QR_CUSTOMER_TO_CUSTOMER';
      const isNewCustomer = values.type === 'NEW_CUSTOMER';
      const isServiceIntro = values.type === 'SERVICE_INTRO_IMAGE';

      formData.append('bannerId', values.bannerId);
      formData.append('status', values.status === 'true' || values.status === true);
      formData.append('type', values.type || '');

      if (!isNewCustomer && !isIntroType && !isTrainingVideo) {
        formData.append('fromDate', toDateOnly(values.fromDate));
        formData.append('startTime', values.startTime || '');
        formData.append('endTime', values.endTime || '');
        formData.append('toDate', toDateOnly(values.toDate));
        if (!isServiceIntro && !isQrPageImageType) {
          formData.append('redirectUrl', values.redirectUrl?.trim?.() || values.redirectUrl || '');
          formData.append('dropAddress', values.dropAddress || '');
          formData.append('navigateTo', values.navigateTo || '');
          if (values.dropLocation?.lat != null) formData.append('dropLat', values.dropLocation.lat);
          if (values.dropLocation?.lng != null) formData.append('dropLong', values.dropLocation.lng);
        }
      }

      if (isTrainingVideo || isQrPageImageType) {
        if (isTrainingVideo) {
          formData.append('redirectUrl', values.redirectUrl?.trim?.() || values.redirectUrl || '');
        }
        formData.append('title', values.title?.trim?.() || values.title || '');
      }

      if (isServiceIntro) {
        const mappedServiceDetails = mapServiceDetails(values.serviceType);
        formData.append('serviceType', mappedServiceDetails?.serviceType || '');
        if (mappedServiceDetails?.bookingType) {
          formData.append('bookingType', mappedServiceDetails.bookingType);
        }
        if (mappedServiceDetails?.packageType) {
          formData.append('packageType', mappedServiceDetails.packageType);
        }
      }

      if (values.type === 'INTRO_SLIDES_DRIVER' || isTrainingVideo) {
        formData.append('driverType', values.driverType || '');
      }

      formData.append('zone', values.zone || 'All');

      if (values.image) {
        formData.append('image', values.image, values.image.name);
        formData.append('fileTypeImage', values.image?.type || '');
        formData.append('extImage', values.image?.name?.split('.').pop()?.toLowerCase() || '');
      }

      if (values.type === 'BANNER' && values.mode === 'TARGETED') {
        formData.append('eligibilityConfig', JSON.stringify(values.eligibilityConfig || {}));
      }

      // The update endpoint accepts the banner image as multipart form data.
      const response = await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_BANNER, formData);
      if (response?.success) {
        navigate('/dashboard/user/bannerimgView', {
          state: { updatedBanner: { ...banner, ...values, status: Boolean(values.status) } },
        });
      } else {
        setModalMessage(response?.error || response?.message || 'Banner update failed.');
      }
    } catch (err) {
      setModalMessage(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'p-2 w-full rounded-md border border-gray-300 shadow-sm';
  const typeOptions = [
    { value: 'BANNER', label: 'Customer Banner First App' },
    { value: 'BANNER_DRIVER', label: 'One Time Driver Banner' },
    { value: 'ONTRIP_BANNER', label: 'Trip Screen Banner' },
    { value: 'TOP_NEW', label: 'Dashboard Banner Image' },
    { value: 'SERVICE_INTRO_IMAGE', label: 'Service Intro Image (customer)' },
    { value: 'NEW_CUSTOMER', label: 'New Customer' },
    { value: 'INTRO_SLIDES', label: 'Intro Slides (customer)' },
    { value: 'INTRO_SLIDES_DRIVER', label: 'Intro Slides (Driver)' },
    { value: 'FUTURE_BOOKING_INTRO_DRIVER', label: 'Future Booking Intro (Driver)' },
    { value: 'RETURN_TRIP_INTRO_DRIVER', label: 'Return Trip Intro (Driver)' },
    { value: 'TRAINING_VIDEO_DRIVER', label: 'Training Video (Driver)' },
  ];
  const getTypeLabel = (type) => typeOptions.find((option) => option.value === type)?.label || type || '-';
  const getTargetedServiceLabel = (service) => {
    switch (service) {
      case 'RIDES': return 'Rides';
      case 'AUTO': return 'Auto';
      case 'BIKE': return 'Bike';
      case 'PARCEL': return 'Parcel';
      case 'RENTAL_HOURLY_PACKAGE': return 'Hourly Package';
      case 'RENTAL_DROP_TAXI': return 'Drop Taxi';
      case 'RENTAL_OUTSTATION': return 'Outstation';
      default: return service;
    }
  };
  const handleImageUpload = (file, setFieldValue) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/avif', 'image/webp'];
    if (!file || !validTypes.includes(file.type)) {
      setModalMessage('Only JPEG, PNG, GIF, AVIF, or WEBP images are allowed.');
      return;
    }
    setFieldValue('image', file);
    setImagePreview(URL.createObjectURL(file));
  };
  const searchLocations = React.useCallback(
    debounce(async (query) => {
      if (query.length > 2) {
        try {
          const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
          if (data?.success && data?.data) {
            setDropSuggestions(data.data);
          } else {
            setDropSuggestions([]);
          }
        } catch (error) {
          setDropSuggestions([]);
        }
      } else {
        setDropSuggestions([]);
      }
    }, 300),
    []
  );
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

  return (
    <div className="p-4 mx-auto bg-white rounded-xl shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Edit Banner</h2>
      <Dialog open={Boolean(modalMessage)} handler={() => setModalMessage('')} size="sm">
        <DialogHeader className="flex items-center justify-between">
          <Typography variant="h6" color="blue-gray">Alert</Typography>
        </DialogHeader>
        <DialogBody divider>
          <Typography variant="paragraph" color="blue-gray">{modalMessage}</Typography>
        </DialogBody>
        <DialogFooter>
          <Button type="button" className={ColorStyles.continueButtonColor} onClick={() => setModalMessage('')}>
            Ok
          </Button>
        </DialogFooter>
      </Dialog>

      <Formik initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit} enableReinitialize>
        {({ isSubmitting, values, setFieldValue }) => {
          const showModeField = values.type === 'BANNER';
          const showTargetedBannerFields = isBannerTargetedMode(values.type, values.mode);
          const hideStandardFields = values.type === 'NEW_CUSTOMER' || isIntroType(values.type) || isTrainingVideoDriver(values.type);
          const showImageField = !isTrainingVideoDriver(values.type);
          const showDropAndNavigate = isStandardBannerType(values.type) && !isServiceIntroImage(values.type) && !isQrPageImageType(values.type);

          return (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Field as="select" name="type" className={inputClass} disabled>
                  <option value="">select the Type</option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
              </div>
              {showModeField && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Mode</label>
                  <Field as="select" name="mode" className={inputClass}>
                    <option value="GENERAL">General</option>
                    <option value="TARGETED">Targeted</option>
                  </Field>
                </div>
              )}
              {!hideStandardFields && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">From Date</label>
                    <Field name="fromDate" type="date" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                    <Field name="startTime" type="time" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">To Date</label>
                    <Field name="toDate" type="date" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">End Time</label>
                    <Field name="endTime" type="time" className={inputClass} />
                  </div>
                  {!isServiceIntroImage(values.type) && !isQrPageImageType(values.type) && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Redirect URL</label>
                      <Field name="redirectUrl" type="text" className={inputClass} />
                    </div>
                  )}
                </>
              )}
              {showDropAndNavigate && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Drop Location</label>
                    <Field
                      name="dropAddress"
                      type="text"
                      placeholder="Search drop location..."
                      className={inputClass}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldValue('dropAddress', val);
                        setFieldValue('dropLocation', null);
                        searchLocations(val);
                      }}
                    />
                    {dropSuggestions.length > 0 && (
                      <ul className="border rounded-md bg-white mt-1 max-h-40 overflow-y-auto z-10">
                        {dropSuggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              const address = getSuggestionText(suggestion);
                              setFieldValue('dropAddress', address);
                              setFieldValue('dropLocation', suggestion?.location || null);
                              setDropSuggestions([]);
                            }}
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
                  <div>
                    <label className="text-sm font-medium text-gray-700">Navigate To</label>
                    <Field as="select" name="navigateTo" className={inputClass}>
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
                        'REFER_AND_EARN',
                      ].map((option) => (
                        <option key={option} value={option}>
                          {option.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </Field>
                  </div>
                </>
              )}
              {showTargetedBannerFields && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Targeted Services</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-gray-300 p-3 bg-gray-100">
                    {Object.keys(values.eligibilityConfig || {}).length === 0 ? (
                      <span className="text-sm text-gray-500">No targeted services selected</span>
                    ) : (
                      Object.entries(values.eligibilityConfig || {}).map(([service, count]) => (
                        <span key={service} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {getTargetedServiceLabel(service)}: {count}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
              {!hideStandardFields && (
                <div className={`${hideStandardFields ? 'hidden' : ''}`}>
                  <label htmlFor="zone" className="text-sm font-medium text-gray-700">
                    Zone
                  </label>
                  <Field name="zone" type="text" className={inputClass} disabled />
                </div>
              )}
              {(values.type === 'INTRO_SLIDES_DRIVER' || isTrainingVideoDriver(values.type)) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Driver Type</label>
                  <Field as="select" name="driverType" className={inputClass} disabled>
                    <option value="">Select Driver Type</option>
                    <option value="ACTING_DRIVER">Driver</option>
                    <option value="CAB">Cab</option>
                    <option value="AUTO">Auto</option>
                    <option value="PARCEL">Parcel</option>
                    <option value="BIKE">Bike</option>
                    <option value="ALL">All</option>
                  </Field>
                </div>
              )}
              {(isTrainingVideoDriver(values.type) || isQrPageImageType(values.type)) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Heading Text</label>
                  <Field name="title" type="text" className={inputClass} />
                </div>
              )}
              {isTrainingVideoDriver(values.type) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">YouTube Link</label>
                  <Field name="redirectUrl" type="text" className={inputClass} />
                </div>
              )}
              {isServiceIntroImage(values.type) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Service Type</label>
                  <Field as="select" name="serviceType" className={inputClass}>
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
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="status" className={inputClass}>
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </Field>
                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
              </div>
              {showImageField && (
                <div>
                  <label htmlFor="image" className="text-sm font-medium text-gray-700">Image</label>
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
                Update
              </Button>
            </div>
          </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default EditBanner;
