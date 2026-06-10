import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Button, Alert, Spinner } from '@material-tailwind/react';
import * as Yup from 'yup';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { DISCOUNT_EDIT_SCHEMA } from '@/utils/validations';
import Select from 'react-select';

const DiscountEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [initialValues, setInitialValues] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [dashboardOfferImgPreview, setDashboardOfferImgPreview] = useState(null); 
  const [premiumServicesMap, setPremiumServicesMap] = useState({});
  const [alert, setAlert] = useState(null);
  const SERVICE_TYPE_OPTIONS_BY_ENTITY = {
    DRIVER: [{ value: 'DRIVER', label: 'DRIVER' }],
    CAB: [
      { value: 'RIDES', label: 'RIDES' },
      { value: 'RENTAL_HOURLY_PACKAGE', label: 'HOURLY PACKAGE' },
      { value: 'RENTAL_DROP_TAXI', label: 'DROP TAXI' },
      { value: 'RENTAL', label: 'OUTSTATION' },
      { value: 'ALL', label: 'ALL' },
    ],
    AUTO: [{ value: 'AUTO', label: 'AUTO' }],
    PARCEL: [{ value: 'PARCEL', label: 'PARCEL' }],
  };
  const PARCEL_VEHICLE_OPTIONS = ['BIKE', 'AUTO'];

  const normalizeParcelVehicleType = (value) => {
    const parsed = String(value || '').trim().toUpperCase();
    return PARCEL_VEHICLE_OPTIONS.includes(parsed) ? parsed : 'BIKE';
  };
  const getEntityFromServiceType = (serviceType) => {
    const normalized = String(serviceType || '').trim().toUpperCase();
    if (normalized === 'DRIVER') return 'DRIVER';
    if (normalized === 'AUTO') return 'AUTO';
    if (normalized === 'PARCEL') return 'PARCEL';
    if (['RIDES', 'RENTAL_HOURLY_PACKAGE', 'RENTAL_DROP_TAXI', 'RENTAL','ALL'].includes(normalized)) return 'CAB';
    return '';
  };
  const getServiceTypeOptions = (entity, currentServiceType) => {
    const baseOptions = SERVICE_TYPE_OPTIONS_BY_ENTITY[entity] || [];
    if (!currentServiceType) return baseOptions;
    const normalizedCurrent = String(currentServiceType).trim().toUpperCase();
    return baseOptions.some((option) => option.value === normalizedCurrent)
      ? baseOptions
      : [...baseOptions, { value: normalizedCurrent, label: normalizedCurrent }];
  };

  const formatDateOnly = (isoString) => {
    return isoString ? isoString.slice(0, 10) : '';
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

        if (serviceAreaResponse.premiumServices) {
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

    const handleImageUpload = (file,setFieldValue) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if(!file || !validTypes.includes(file.type)) {
        alert('Only JPEG and PNG images are allowed.');
        return;
      }

    setFieldValue('image', file);
    setFieldValue('imageUrl', '');
    setFieldValue('removeImage', false);
    setImagePreview(URL.createObjectURL(file));
  };


  const handleDashboardOfferImgUpload = (file, setFieldValue) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!file || !validTypes.includes(file.type)) {
      alert('Only JPEG and PNG images are allowed.');
      return;
    }
    setFieldValue('dashboardOfferImg', file);
    setFieldValue('dashboardImageUrl', '');
    setFieldValue('removeDashboardOfferImg', false);
    setDashboardOfferImgPreview(URL.createObjectURL(file));
  };

  const handleDashboardOfferImgClear = (setFieldValue) => {
    setFieldValue('dashboardOfferImg', null);
    setFieldValue('dashboardImageUrl', '');
    setDashboardOfferImgPreview(null);
    setFieldValue('removeDashboardOfferImg', true);
  };

  const getCurrentPremiumOptions = (serviceType) => {
    return premiumServicesMap[serviceType] || [];
  };

  const getSubZoneOptions = useMemo(() => {
    return (selectedServiceAreas = []) => {
      if (!Array.isArray(selectedServiceAreas) || selectedServiceAreas.length === 0) return zones;
      const selectedAreaIds = serviceAreas
        .filter((area) => selectedServiceAreas.includes(area.name))
        .map((area) => area.id);

      if (selectedAreaIds.length === 0) return zones;
      return zones.filter((zone) => !zone.parent_id || selectedAreaIds.includes(zone.parent_id));
    };
  }, [serviceAreas, zones]);

  useEffect(() => {
    const discountFromState = location.state?.discount;

    const fetchDiscount = async () => {
      try {
        if (discountFromState) {
          const initialDiscountType = (() => {
            if (discountFromState.discountType) {
              const lower = discountFromState.discountType.toLowerCase();
              if (lower === 'isamount' || lower === 'amount' || lower === 'flat') return 'IsAmount';
              if (lower === 'percentage' || lower === 'percent') return 'percentage';
            }
            return Number(discountFromState.amount) > 0 ? 'IsAmount' : 'percentage';
          })();
          setInitialValues({
            discountId: discountFromState.discountId || discountFromState.id,
            entity: discountFromState.entity || getEntityFromServiceType(discountFromState.serviceType),
            discountType: initialDiscountType,
            percentage: discountFromState.percentage || '',
            amount:discountFromState.amount || '',
            startDate: formatDateOnly(discountFromState.startDate),
            endDate: formatDateOnly(discountFromState.endDate),
            serviceType: discountFromState.serviceType || '',
            title: discountFromState.title || '',
            couponCode: discountFromState.couponCode || '',
            description: discountFromState.description || '',
            offerType: discountFromState.offerType || '',
            isActive: discountFromState.isActive ? 'true' : 'false',
            cabType: discountFromState.isPremium ? '' : discountFromState.cabType || '',
            premiumCabType: discountFromState.isPremium ? discountFromState.cabType || '' : '',
            isPremium: discountFromState.isPremium || false,
            parcelVehicleType: normalizeParcelVehicleType(discountFromState.parcelVehicleType),
            subZoneId: discountFromState?.subZoneId ? String(discountFromState.subZoneId) : '',
            image: null,
            imageUrl: discountFromState.imageUrl || '',
            dashboardOfferImg: null,                    
            dashboardImageUrl: discountFromState.dashboardOfferImg || '',
            serviceArea: discountFromState.serviceArea
              ? discountFromState.serviceArea === 'All'
                ? ['All']
                : Array.isArray(discountFromState.serviceArea)
                ? discountFromState.serviceArea
                : [discountFromState.serviceArea]
              : [],
            removeImage: false,
            removeDashboardOfferImg: false,            
          });

          setImagePreview(discountFromState.imageUrl || null);
          setDashboardOfferImgPreview(discountFromState.dashboardImageUrl || null); 
        } else {
          const res = await ApiRequestUtils.get(`${API_ROUTES.GET_DISCOUNT}/${id}`);
          const data = res?.data;
          const fetchedType = (() => {
            if (data.discountType) {
              const lower = data.discountType.toLowerCase();
              if (lower === 'isamount' || lower === 'amount' || lower === 'flat') return 'IsAmount';
              if (lower === 'percentage' || lower === 'percent') return 'percentage';
            }
            return Number(data.amount) > 0 ? 'IsAmount' : 'percentage';
          })();
          setInitialValues({
            discountId: data.discountId || data.id,
            entity: data.entity || getEntityFromServiceType(data.serviceType),
            discountType: fetchedType,
            percentage: data.percentage || '',
            amount: data.amount || '',
            startDate: formatDateOnly(data.startDate),
            endDate: formatDateOnly(data.endDate),
            serviceType: data.serviceType || '',
            isActive: data.isActive ? 'true' : 'false',
            title: data.title || '',
            description: data.description || '',
            offerType: data.offerType || '',
            couponCode: data.couponCode || '',
            cabType: data.isPremium ? '' : data.cabType || '',
            premiumCabType: data.isPremium ? data.cabType || '' : '',
            isPremium: data.isPremium || false,
            parcelVehicleType: normalizeParcelVehicleType(data.parcelVehicleType),
            subZoneId: data?.subZoneId ? String(data.subZoneId) : '',
            image: null,
            imageUrl: data.imageUrl || '',
            dashboardOfferImg: null,                    
            dashboardImageUrl: data.dashboardOfferImg || '',
            serviceArea: data.serviceArea
              ? data.serviceArea === 'All'
                ? ['All']
                : Array.isArray(data.serviceArea)
                ? data.serviceArea
                : [data.serviceArea]
              : [],
            removeImage: false,
            removeDashboardOfferImg: false,
          });
          setImagePreview(data.imageUrl || null);
          setDashboardOfferImgPreview(data.dashboardOfferImg || null);
        }
      } catch (err) {
        console.error('Failed to load discount:', err);
        alert('Discount not found');
        navigate('/dashboard/finance/discountModuleList');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscount();
  }, [id, location.state, navigate, premiumServicesMap]);

  const safeDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  };


  const handleImageClear = (setFieldValue) => {
    setFieldValue('image', null);
    setFieldValue('imageUrl', '');
    setImagePreview(null);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
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
      formData.append('discountId', Number(values.discountId));
      formData.append('entity', values.entity);
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
      if (values.removeImage) {
        formData.append('imageUrl', '');
      }
      if (values.image) {
        formData.append('image', values.image);
        formData.append('fileType', values.image?.type || '');
        formData.append('extImage', values.image?.name?.split('.').pop()?.toLowerCase() || '');
      } else {
        formData.append('fileType', '');
        formData.append('imageUrl', '');
        formData.append('extImage', '');
      }

     
      if (values.removeDashboardOfferImg) {
        formData.append('dashboardImageUrl', '');
      }
      if (values.dashboardOfferImg) {
        formData.append('dashboardOfferImg', values.dashboardOfferImg);
        formData.append('dashboardFileType', values.dashboardOfferImg?.type || '');
        formData.append('dashboardExtImage', values.dashboardOfferImg?.name?.split('.').pop()?.toLowerCase() || '');
      } else {
        formData.append('dashboardFileType', '');
        formData.append('dashboardExtImage', '');
      }

      const isParcelService = values.serviceType === 'PARCEL';
      const isGeneralParcel = values.offerType === 'GENERAL' && isParcelService;
      if (isParcelService) {
        const parcelVehicleType = normalizeParcelVehicleType(values.parcelVehicleType);
        formData.append('parcelVehicleType', parcelVehicleType);
        if (parcelVehicleType === 'BIKE' && values.subZoneId) {
          formData.append('subZoneId', Number(values.subZoneId));
        }
      } else if (values.serviceType === 'DRIVER') {
        formData.append('cabType', values.cabType || null);
      } else if (values.serviceType === 'AUTO') {
        formData.append('isPremium', values.isPremium);
      } else {
      const finalCabType = values.isPremium
        ? (values.premiumCabType || '')
        : (values.cabType || '');
      formData.append('cabType', finalCabType);
      formData.append('isPremium', values.isPremium);
      }
      console.log('Submitting form with values:', values);
    const response = await ApiRequestUtils.updateDocs(API_ROUTES.PUT_DISCOUNT, formData);

      if (response?.success) {
        
        navigate('/dashboard/finance/discountModuleList', {
          state: { updatedDiscount: response.data },
        });
      } else {
        setAlert({ color: 'red', message: 'Failed to update discount' });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error('Update failed:', error);
      setAlert({ color: 'red', message: 'Update failed!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !initialValues) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-4xl">
      {alert && (
        <div className="mb-2">
          <Alert color={alert.color}>{alert.message}</Alert>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4">Edit Discount</h2>

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={DISCOUNT_EDIT_SCHEMA}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, isValid, setFieldValue, values }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const isGeneralParcel = values.offerType === 'GENERAL' && values.serviceType === 'PARCEL';
                const selectedParcelVehicleType = normalizeParcelVehicleType(values.parcelVehicleType);
                const subZoneOptions = getSubZoneOptions(values.serviceArea);
                return (
                  <>
              <Field type="hidden" name="removeImage" />
              <Field type="hidden" name="removeDashboardOfferImg" />
              <Field type="hidden" name="discountId" />
              <div>
                <label className="text-sm font-medium text-gray-700">Entity Type</label>
                <Field
                  as="select"
                  name="entity"
                  onChange={(e) => {
                    const nextEntity = e.target.value;
                    const nextServiceTypeOptions = getServiceTypeOptions(nextEntity);
                    const currentServiceType = String(values.serviceType || '').toUpperCase();
                    setFieldValue('entity', nextEntity);
                    setFieldValue(
                      'serviceType',
                      nextServiceTypeOptions.some((option) => option.value === currentServiceType) ? values.serviceType : ''
                    );
                    setFieldValue('parcelVehicleType', 'BIKE');
                    setFieldValue('subZoneId', '');
                    setFieldValue('isPremium', false);
                    setFieldValue('cabType', '');
                    setFieldValue('premiumCabType', '');
                  }}
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="">Select Entity Type</option>
                  <option value="DRIVER">Driver</option>
                  <option value="CAB">Cab</option>
                  <option value="AUTO">Auto</option>
                  <option value="PARCEL">Parcel</option>
                </Field>
                <ErrorMessage name="entity" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Offer Type</label>
                <Field
                  as="select"
                  name="offerType"
                  disabled
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="">Select Offer Type</option>
                  <option value="GENERAL">GENERAL</option>
                  <option value="CUSTOM">CUSTOM</option>
                </Field>
                <ErrorMessage name="offerType" component="div" className="text-red-500 text-sm" />
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
                    if (nextServiceType === 'PARCEL') {
                      setFieldValue('isPremium', false);
                      setFieldValue('cabType', '');
                      setFieldValue('premiumCabType', '');
                    } else {
                      setFieldValue('parcelVehicleType', 'BIKE');
                      setFieldValue('subZoneId', '');
                    }
                  }}
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="">Select Service Type</option>
                  {getServiceTypeOptions(values.entity, values.serviceType).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
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
                  <ErrorMessage name="parcelVehicleType" component="div" className="text-red-500 text-sm" />
                </div>
              )}
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
                  <ErrorMessage name="subZoneId" component="div" className="text-red-500 text-sm" />
                </div>
              )}
              <div>
                <label htmlFor="image" className="text-sm font-medium text-gray-700">Estimate Summary Image</label>
                {(imagePreview || values.imageUrl) && (
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={imagePreview || values.imageUrl}
                      alt="discount"
                      className="w-32 h-32 object-cover rounded-md border"
                    />
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
                  accept="image/jpeg,image/png,image/gif"
                  className="mt-3 p-2 w-full rounded-md border border-gray-300 shadow-sm text-sm"
                  onChange={(e) => handleImageUpload(e.currentTarget.files[0], setFieldValue)}
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current image</p>
              </div>

             
              <div>
                <label className="text-sm font-medium text-gray-700">Dashboard Offer Image</label>
                {(dashboardOfferImgPreview || values.dashboardImageUrl) && (
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={dashboardOfferImgPreview || values.dashboardImageUrl}
                      alt="dashboard offer"
                      className="w-32 h-32 object-cover rounded-md border"
                    />
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
                  accept="image/jpeg,image/png,image/gif"
                  className="mt-3 p-2 w-full rounded-md border border-gray-300 shadow-sm text-sm"
                  onChange={(e) => handleDashboardOfferImgUpload(e.currentTarget.files[0], setFieldValue)}
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current image</p>
                <ErrorMessage name="dashboardOfferImg" component="div" className="text-red-500 text-sm" />
              </div>
              {!isGeneralParcel && values.serviceType !== 'PARCEL' && (
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer text-lg font-medium">
                <Field
                    type="checkbox"
                    name="isPremium"
                    className="w-5 h-5 text-blue-600 rounded"
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFieldValue('isPremium', checked);
                      if (checked) setFieldValue('cabType', '');
                      else setFieldValue('premiumCabType', '');
                    }}
                  />
                  <span>Enable Premium</span>
                </label>
                {values.isPremium && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-lg font-semibold text-blue-900 mb-4">Select Premium Car Type:</p>
                    {getCurrentPremiumOptions(values.serviceType).length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {getCurrentPremiumOptions(values.serviceType).map((premium) => {
                          const carType = premium.carType;
                          return (
                            <label
                              key={carType}
                              className={`flex items-center space-x-3 p-4 bg-white rounded-lg border-2 cursor-pointer transition
                                ${values.premiumCabType === carType ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-300 hover:border-blue-400'}`}
                            >
                              <input
                                type="radio"
                                name="premiumCabType"
                                value={carType}
                                checked={values.premiumCabType === carType}
                                onChange={() => setFieldValue('premiumCabType', carType)}
                                className="w-5 h-5 text-blue-600"
                              />
                              <span className="font-medium">{premium.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">No premium options for {values.serviceType}</p>
                    )}
                    <ErrorMessage name="premiumCabType" component="div" className="text-red-500 text-sm mt-3" />
                  </div>
                )}
              </div>
              )}
              {!isGeneralParcel && values.serviceType !== 'PARCEL' && !values.isPremium && values.serviceType !== 'AUTO' && (
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
                <ErrorMessage name="cabType" component="div" className="text-red-500 text-sm" />
              </div>
              )}
              <div>
                <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
                <Field type="text" name="title" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="couponCode" className="text-sm font-medium text-gray-700">Coupon Code</label>
                <Field
                  type="text"
                  name="couponCode"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="couponCode" component="div" className="text-red-500 text-sm" />
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
                      setFieldValue('amount', '');
                      setFieldValue('percentage', '');
                    }
                  }}
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-white"
                >
                  <option value="">Select Discount Type</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="IsAmount">Amount (₹)</option>
                </select>
                <ErrorMessage name="discountType" component="div" className="text-red-500 text-sm" />
              </div>

              {(values.discountType || '').toLowerCase() === 'percentage' ? (
              <div>
                <label className="text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                <Field
                  name="percentage"
                  type="number"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="percentage" component="div" className="text-red-500 text-sm" />
              </div>
              ) : (values.discountType || '').toLowerCase() === 'isamount' ? (
                <div>
                  <label className="text-sm font-medium text-gray-700">Discount Amount (₹)</label>
                  <Field name="amount">
                    {({ field }) => (
                      <input
                        {...field}
                        type="number"
                        className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(e);
                          const numeric = parseFloat(value);
                          if (!isNaN(numeric) && numeric > 0) {
                            setFieldValue('discountType', 'IsAmount');
                          }
                        }}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="amount" component="div" className="text-red-500 text-sm" />
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <Field
                  name="startDate"
                  type="date"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="startDate" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <Field
                  name="endDate"
                  type="date"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                />
                <ErrorMessage name="endDate" component="div" className="text-red-500 text-sm" />
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
                <ErrorMessage name="isActive" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="serviceArea" className="text-sm font-medium text-gray-700">Select Service Area</label>
                <Select
                  name="serviceArea"
                  options={values.serviceType === 'PARCEL' ? PARCEL_ZONE_OPTIONS : ZONE_OPTIONS}
                  isMulti={values.serviceType !== 'PARCEL'}
                  value={
                    values.serviceType === 'PARCEL'
                      ? (values.serviceArea[0] ? { value: values.serviceArea[0], label: values.serviceArea[0] } : null)
                      : values.serviceArea.map((val) => ({ value: val, label: val }))
                  }
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
                <ErrorMessage name="serviceArea" component="div" className="text-red-500 text-sm mt-1" />
              </div>
                  </>
                );
              })()}
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
                disabled={isSubmitting || !isValid}
                className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
              >
                Update
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default DiscountEdit;
