import React, { useEffect, useState } from 'react';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import { Button } from '@material-tailwind/react';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { useNavigate } from 'react-router-dom';
import { DISCOUNT_ADD_SCHEMA } from '@/utils/validations';
import Select from 'react-select';

const DiscountAdd = () => {
  const navigate = useNavigate();
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [dashboardOfferImgPreview, setDashboardOfferImgPreview] = useState(null);
  const [premiumServicesMap, setPremiumServicesMap] = useState({});

  const PARCEL_VEHICLE_OPTIONS = ['BIKE', 'AUTO'];
  const normalizeParcelVehicleType = (value) => {
    const parsed = String(value || '').trim().toUpperCase();
    return PARCEL_VEHICLE_OPTIONS.includes(parsed) ? parsed : 'BIKE';
  };

  const initialValues = {
    serviceType: '',
    title: '',
    couponCode: '',
    description: '',
    offerType: '',
    discountType: '',
    percentage: '',
    amount: '',
    startDate: '',
    endDate: '',
    isActive: 'true',
    serviceArea: [],
    image: null,
    dashboardOfferImg: null,
    cabType: '',
    premiumCabType: '',
    isPremium: false,
    parcelVehicleType: 'BIKE',
    subZoneId: '',
    removeImage: false,
    removeDashboardOfferImg: false,
  };

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const [serviceAreaResponse, zoneResponse] = await Promise.all([
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
          type: 'Service Area',
          }),
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
            type: 'Zone',
          }),
        ]);

        if (serviceAreaResponse?.premiumServices) {
          setPremiumServicesMap(serviceAreaResponse.premiumServices);
        }

        const allServiceAreas = Array.isArray(serviceAreaResponse?.data) ? serviceAreaResponse.data : [];
        const allZones = Array.isArray(zoneResponse?.data) ? zoneResponse.data : [];
        setServiceAreas(allServiceAreas);
        setZones(allZones.filter((zone) => zone.type === 'Zone' && zone.description === 'Zone'));
      } catch (error) {
        console.error('Error fetching GEO_MARKINGS_LIST:', error);
      }
    };
    fetchGeoData();
  }, []);

  const ZONE_OPTIONS = [
    { value: 'All', label: 'All' },
    ...serviceAreas.map((area) => ({
      value: area.name,
      label: area.name,
    })),
  ];

  const PARCEL_ZONE_OPTIONS = serviceAreas.map((area) => ({
    value: area.name,
    label: area.name,
  }));

  const getSubZoneOptions = (selectedServiceAreas = []) => {
    if (!Array.isArray(selectedServiceAreas) || selectedServiceAreas.length === 0) return zones;
    const selectedAreaIds = serviceAreas
      .filter((area) => selectedServiceAreas.includes(area.name))
      .map((area) => area.id);
    if (selectedAreaIds.length === 0) return zones;
    return zones.filter((zone) => !zone.parent_id || selectedAreaIds.includes(zone.parent_id));
  };

  const handleImageUpload = (file, setFieldValue) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if(!file || !validTypes.includes(file.type)) {
        alert('Only JPEG and PNG images are allowed.');
        return;
      }

    setFieldValue('image', file);
    setImagePreview(URL.createObjectURL(file));
    setFieldValue('removeImage', false);
  };
  const handleImageClear = (setFieldValue) => {
    setFieldValue('image', null);
    setImagePreview(null);
    setFieldValue('removeImage', true);
  };

  const safeDate = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};
const handleDashboardOfferImgUpload = (file, setFieldValue) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!file || !validTypes.includes(file.type)) {
    alert('Only JPEG and PNG images are allowed.');
    return;
  }
  setFieldValue('dashboardOfferImg', file);
  setDashboardOfferImgPreview(URL.createObjectURL(file));
  setFieldValue('removeDashboardOfferImg', false);
};

const handleDashboardOfferImgClear = (setFieldValue) => {
  setFieldValue('dashboardOfferImg', null);
  setDashboardOfferImgPreview(null);
  setFieldValue('removeDashboardOfferImg', true);
};
  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
//    const payload = {
//   serviceType: values.serviceType?.trim(),
//   percentage:
//     values.percentage !== '' && !isNaN(values.percentage)
//       ? parseFloat(values.percentage)
//       : 0,
//   startDate: values.startDate
//     ? new Date(values.startDate).toISOString().split('T')[0]
//     : undefined,
//   endDate: values.endDate
//     ? new Date(values.endDate).toISOString().split('T')[0]
//     : undefined,
//   isActive: values.isActive,
//   title: values.title,
//   description: values.description,
//   serviceArea: values.serviceArea.includes['All'] ? ['All'] : values.serviceArea,
//   image: values.image,
//   cabType: values.cabType
// };

    try {
      const hasAmount = Number(values.amount) > 0;
      const hasPercentage = Number(values.percentage) > 0;
      let discountType = values.discountType;

      if (hasAmount && !hasPercentage) {
        discountType = 'IsAmount';
      } else if (hasPercentage && !hasAmount) {
        discountType = 'percentage';
      }

      const formData = new FormData();
      formData.append('serviceType', values.serviceType);
      formData.append('offerType', values.offerType);
      formData.append('couponCode', values.couponCode);
      formData.append('discountType', discountType);
      if ((discountType || '').toLowerCase() === 'percentage') {
        formData.append('percentage', values.percentage || '');
      } else if ((discountType || '').toLowerCase() === 'isamount') {
        formData.append('amount', values.amount || '');
      }
      formData.append('startDate', safeDate(values.startDate));
      formData.append('endDate', safeDate(values.endDate));
      formData.append('isActive', values.isActive);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('serviceArea', values.serviceArea.includes('All') ? ['All'] : values.serviceArea);
      if (values.image) {
      formData.append('image', values.image, values.image.name);
      formData.append('fileType', values.image?.type || '');
      formData.append('extImage', values.image?.name?.split('.').pop()?.toLowerCase() || '');
      } else {
        formData.append('fileType', '');
        formData.append('extImage', '');
      }
      if (values.removeImage) {
        formData.append('imageUrl', '');
      }
      if (values.dashboardOfferImg) {
  formData.append('dashboardOfferImg', values.dashboardOfferImg, values.dashboardOfferImg.name);
  formData.append('dashboardFileType', values.dashboardOfferImg?.type || '');
  formData.append('dashboardExtImage', values.dashboardOfferImg?.name?.split('.').pop()?.toLowerCase() || '');
} else {
  formData.append('dashboardFileType', '');
  formData.append('dashboardExtImage', '');
}

if (values.removeDashboardOfferImg) {
  formData.append('dashboardImageUrl', '');  
}
      const isGeneralParcel = values.offerType === 'GENERAL' && values.serviceType === 'PARCEL';
      if (isGeneralParcel) {
        const parcelVehicleType = normalizeParcelVehicleType(values.parcelVehicleType);
        formData.append('parcelVehicleType', parcelVehicleType);
        formData.append('isPremium', false);
        formData.append('cabType', '');
        if (parcelVehicleType === 'BIKE' && values.subZoneId) {
          formData.append('subZoneId', Number(values.subZoneId));
        }
      } else {
        const finalCabType = values.isPremium ? values.premiumCabType : values.cabType;
      formData.append('cabType', finalCabType);
      formData.append('isPremium', values.isPremium);
      }
      // console.log('Submitting form with values:', values);
      const res = await ApiRequestUtils.postDocs(API_ROUTES.POST_DISCOUNT, formData);
      if (!res?.success) {
        const message = res?.error || res?.message || 'Coupon code already exists';
        setFieldError('couponCode', message);
        return;
      }
      const newDiscountId = res?.data?.discountId || res?.data?.id || res?.discountId || res?.id || null;
      if (values.offerType === 'CUSTOM') {
        navigate('/dashboard/finance/custom-discount/add', {
          state: { discountId: newDiscountId },
        });
      } else {
      navigate('/dashboard/finance/discountModuleList');
      }
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      const apiMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message;
      setFieldError('couponCode', apiMessage || 'Failed to create discount');
    } finally {
      setSubmitting(false);
    }
  };

const getCurrentPremiumOptions = (currentServiceType) => {
  return premiumServicesMap[currentServiceType] || [];
};

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Add Discount</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={DISCOUNT_ADD_SCHEMA}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue, values }) => {
          const isGeneralParcel = values.offerType === 'GENERAL' && values.serviceType === 'PARCEL';
          const selectedParcelVehicleType = normalizeParcelVehicleType(values.parcelVehicleType);
          const subZoneOptions = getSubZoneOptions(values.serviceArea);

          return (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Field type="hidden" name="removeImage" />
                <Field type="hidden" name="removeDashboardOfferImg" />
              <div>
                <label className="text-sm font-medium text-gray-700">Offer Type</label>
                <Field
                  as="select"
                  name="offerType"
                    onChange={(e) => {
                      const nextOfferType = e.target.value;
                      setFieldValue('offerType', nextOfferType);
                      if (nextOfferType === 'GENERAL' && values.serviceType === 'PARCEL') {
                        setFieldValue('isPremium', false);
                        setFieldValue('cabType', '');
                        setFieldValue('premiumCabType', '');
                      }
                    }}
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="">Select Offer Type</option>
                  <option value="GENERAL">GENERAL</option>
                  <option value="CUSTOM">CUSTOM</option>
                </Field>
                <ErrorMessage name="offerType" className="text-red-500 text-sm" component="div" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                <Field
                  as="select"
                  name="serviceType"
                    onChange={(e) => {
                      const nextServiceType = e.target.value;
                      setFieldValue('serviceType', nextServiceType);
                      setFieldValue('serviceArea', []);
                      if (nextServiceType !== 'PARCEL') {
                        setFieldValue('parcelVehicleType', 'BIKE');
                        setFieldValue('subZoneId', '');
                      } else if (values.offerType === 'GENERAL') {
                        setFieldValue('isPremium', false);
                        setFieldValue('cabType', '');
                        setFieldValue('premiumCabType', '');
                      }
                    }}
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="">Select Service Type</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="RIDES">RIDES</option>
                  <option value="RENTAL_HOURLY_PACKAGE">HOURLY PACKAGE</option>
                  <option value="RENTAL_DROP_TAXI">DROP TAXI</option>
                  <option value="RENTAL">OUTSTATION</option>
                  <option value="AUTO">AUTO</option>
                    <option value="PARCEL">PARCEL</option>
                  <option value="ALL">ALL</option>
                </Field>
                <ErrorMessage name="serviceType" className="text-red-500 text-sm" component="div" />
              </div>
                {values.serviceType === 'PARCEL' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Parcel Vehicle Type</label>
                    <Field
                      as="select"
                      name="parcelVehicleType"
                      onChange={(e) => {
                        const nextVehicleType = normalizeParcelVehicleType(e.target.value);
                        setFieldValue('parcelVehicleType', nextVehicleType);
                        if (nextVehicleType === 'AUTO') {
                          setFieldValue('subZoneId', '');
                        }
                      }}
                      className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                    >
                      <option value="BIKE">BIKE</option>
                      <option value="AUTO">AUTO</option>
                    </Field>
                    <ErrorMessage name="parcelVehicleType" className="text-red-500 text-sm" component="div" />
                  </div>
                )}
              <div>
                <label htmlFor="image" className="text-sm font-medium text-gray-700">
                  Estimate Summary Image
                </label>
                {imagePreview && (
                  <div className="mb-2 flex items-center gap-3">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover border rounded-md" />
                    <button
                      type="button"
                      className="px-3 py-1 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleImageClear(setFieldValue)}
                    >
                      Remove
                    </button>
                  </div>
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
              <div>
  <label className="text-sm font-medium text-gray-700">Dashboard Offer Image</label>
  {dashboardOfferImgPreview && (
    <div className="mb-2 flex items-center gap-3">
      <img src={dashboardOfferImgPreview} alt="Dashboard Offer Preview" className="w-32 h-32 object-cover border rounded-md" />
      <button
        type="button"
        className="px-3 py-1 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
        onClick={() => handleDashboardOfferImgClear(setFieldValue)}
      >
        Remove
      </button>
    </div>
  )}
  <input
    name="dashboardOfferImg"
    type="file"
    accept="image/*"
    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
    onChange={(e) => handleDashboardOfferImgUpload(e.currentTarget.files[0], setFieldValue)}
  />
  <ErrorMessage name="dashboardOfferImg" component="div" className="text-red-500 text-sm" />
</div>

                {!isGeneralParcel && (
              <div className="mt-3 flex gap-3">
                <div className="w-full col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <Field
                      type="checkbox"
                      name="isPremium"
                      className="h-5 w-5 text-primary-600 rounded"
                      onChange={(e) => {
                        setFieldValue('isPremium', e.target.checked);
                        if (e.target.checked) {
                          setFieldValue('cabType', '');
                        } else {
                          setFieldValue('premiumCabType', '');
                        }
                    }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Premium Service
                    </span>
                  </label>
                  {values.isPremium && (
                    <div className="col-span-2 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-3">
                        Select Premium Car Type:
                      </p>
                      {getCurrentPremiumOptions(values.serviceType).length > 0 ? (
                        <div className="w-full  md:grid-cols-4">
                          {getCurrentPremiumOptions(values.serviceType).map((premium, index) => (
                            <label key={index} className="flex items-center space-x-2 cursor-pointer">
                              <Field
                                type="radio"
                                name="premiumCabType"
                                value={premium.carType}
                                className="h-4 w-4 text-primary-600"
                              />
                              <span className="text-gray-800 font-medium">{premium.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 italic">
                          No premium options configured for {values.serviceType}
                        </p>
                      )}
                      <ErrorMessage name="premiumCabType" className="text-red-500 text-sm mt-2 inline-block" component="div" />
                    </div>
                  )}
                </div>
              </div>
                )}

              {!isGeneralParcel && values.serviceType !== 'AUTO' && values.isPremium === false && (
              <div>
                <label className="text-sm font-medium text-gray-700">Car Type</label>
                <Field
                  as="select"
                  name="cabType"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="">Select Car Type</option>
                  <option value="Mini">Mini</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">Suv</option>
                  <option value="MUV">Muv</option>
                  </Field>
                <ErrorMessage name="cabType" className="text-red-500 text-sm" component="div" />
              </div>
              )}
              <div>
                <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
                <Field type="text" name="title" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="title" className="text-red-500 text-sm" component="div" />
              </div>
              <div>
                <label htmlFor="couponCode" className="text-sm font-medium text-gray-700">Coupon Code</label>
                <Field
                  type="text"
                  name="couponCode"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="couponCode" className="text-red-500 text-sm" component="div" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Discount Type</label>
                <select
                  name="discountType"
                  value={values.discountType}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    setFieldValue('discountType', selectedType);
                    if ((selectedType || '').toLowerCase() === 'percentage') {
                      setFieldValue('amount', '');
                    } else if ((selectedType || '').toLowerCase() === 'isamount') {
                      setFieldValue('percentage', '');
                    } else {
                      setFieldValue('percentage', '');
                      setFieldValue('amount', '');
                    }
                  }}
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-white"
                >
                  <option value="">Select Discount Type</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="IsAmount">Amount (₹)</option>
                </select>
                <ErrorMessage name="discountType" className="text-red-500 text-sm" component="div" />
              </div>
              {(values.discountType || '').toLowerCase() === 'percentage' ? (
              <div>
                <label className="text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                <Field
                  type="number"
                  name="percentage"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="percentage" className="text-red-500 text-sm" component="div" />
              </div>
              ) : (values.discountType || '').toLowerCase() === 'isamount' ? (
                <div>
                  <label className="text-sm font-medium text-gray-700">Discount Amount (₹)</label>
                  <Field
                    type="number"
                    name="amount"
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                  />
                  <ErrorMessage name="amount" className="text-red-500 text-sm" component="div" />
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700">Start Date & Time</label>
                <Field
                  type="datetime-local"
                  name="startDate"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="startDate" className="text-red-500 text-sm" component="div" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">End Date & Time</label>
                <Field
                  type="datetime-local"
                  name="endDate"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="endDate" className="text-red-500 text-sm" component="div" />
              </div>
               <div>
                <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
                <Field as="textarea" name="description" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" rows="4" />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm my-1" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field
                  as="select"
                  name="isActive"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Field>
                <ErrorMessage name="isActive" className="text-red-500 text-sm" component="div" />
              </div>
              <div>
                <label htmlFor="serviceArea" className="text-sm font-medium text-gray-700">Select service Area</label>
                <Select
                  name="serviceArea"
                  options={values.serviceType === 'PARCEL' ? PARCEL_ZONE_OPTIONS : ZONE_OPTIONS}
                  isMulti={values.serviceType !== 'PARCEL'}
                  value={values.serviceType === 'PARCEL' ? (values.serviceArea[0] ? { value: values.serviceArea[0], label: values.serviceArea[0] } : null) : values.serviceArea.map((val) => ({ value: val, label: val }))}
                  onChange={(selectedOptions) => {
                      if (values.serviceType === 'PARCEL') {
                        const selectedValue = selectedOptions?.value || '';
                        setFieldValue('serviceArea', selectedValue ? [selectedValue] : []);
                      } else {
                    const selectedValues = selectedOptions ? selectedOptions.map((option) => option.value) : [];
                    if (selectedValues.includes('All') && selectedValues.length > 1) {
                      setFieldValue('serviceArea', ['All']); 
                    } else if (selectedValues.includes('All')) {
                      setFieldValue('serviceArea', ['All']); 
                    } else {
                      setFieldValue('serviceArea', selectedValues); 
                        }
                      }
                  }}
                  placeholder="Select service Area"
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
                <ErrorMessage name="serviceArea" className="text-red-500 text-sm mt-1" component="div" />
              </div>

                {isGeneralParcel && selectedParcelVehicleType === 'BIKE' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sub Zone</label>
                    <Field
                      as="select"
                      name="subZoneId"
                      disabled={subZoneOptions.length === 0}
                      className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                    >
                      <option value="">Select Sub Zone</option>
                      {subZoneOptions.map((subZone) => (
                        <option key={subZone.id} value={subZone.id}>
                          {subZone.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="subZoneId" className="text-red-500 text-sm" component="div" />
                  </div>
                )}
            </div>

            <div className="flex flex-row">
              <Button
                fullWidth
                type="button"
                className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`}
                onClick={() => navigate('/dashboard/finance/discountModuleList')}
              >
                Back
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting}
                className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
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

export default DiscountAdd;
