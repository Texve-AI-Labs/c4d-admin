import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Input, List, ListItem, Typography } from '@material-tailwind/react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import AccountCreationTabs from './AccountCreationTabs';

const makeAddressPayload = (name, placeId) => ({
  name,
  ...(placeId ? { placeId } : {}),
});

const isPdfFile = (src = "") =>
  String(src).toLowerCase().includes(".pdf") || String(src).toLowerCase().startsWith("data:application/pdf");

const DocumentPreview = ({ src, zoom = 1, onZoomIn, onZoomOut }) => {
  if (!src) return null;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const controls = (
    <div className="w-full flex justify-end gap-2 mb-2">
      <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomOut}>-</Button>
      <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomIn}>+</Button>
    </div>
  );

  if (isPdfFile(src)) {
    return (
      <div className="w-full">
        {controls}
        <div
          className={`w-full h-[38vh] md:h-[44vh] border border-gray-200 bg-white overflow-hidden ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="w-full h-full"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <iframe src={src} className="w-full h-full pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {controls}
      <div
        className={`w-full h-[38vh] md:h-[44vh] border border-gray-200 bg-white p-2 overflow-hidden ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt="Document preview"
          className="w-full h-full object-contain select-none"
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
};


const LocationInput = ({ field, form, suggestions, onSearch, onSelect, type }) => {
  const [isFocused, setIsFocused] = useState(false);
  const getSuggestionText = (suggestion) => {
    if (typeof suggestion === "string") return suggestion;
    if (suggestion && typeof suggestion === "object") {
      return (
        suggestion.fullText ||
        suggestion.title ||
        suggestion.name ||
        suggestion.address ||
        suggestion.label ||
        suggestion.subtitle ||
        suggestion.formatted_address ||
        suggestion.description ||
        suggestion.display_name ||
        ""
      );
    }
    return "";
  };

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
                if (onSelect) onSelect(suggestion);
                setIsFocused(false);
              }}
              className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
            >
              <Typography variant="small">{getSuggestionText(suggestion)}</Typography>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

const ParcelCabAdd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ownerName = '', accountId = '' } = location?.state || {};
  const vehicleDocuments = Array.isArray(location?.state?.vehicleDocuments) ? location.state.vehicleDocuments : [];
  const [selectedVehicleDocType, setSelectedVehicleDocType] = useState("");
  const [accountInfo, setAccountInfo] = useState(null);
  const [previewZoom, setPreviewZoom] = useState({});

  const [ownerAddressSuggestions, setOwnerAddressSuggestions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [serviceAreaFetchError, setServiceAreaFetchError] = useState('');
  const [zoneFetchError, setZoneFetchError] = useState('');
  const previewSourceRows = (
    vehicleDocuments.length > 0
      ? vehicleDocuments
      : (Array.isArray(accountInfo?.Proofs) ? accountInfo.Proofs : [])
  );
  const vehicleDocTypes = [...new Set(previewSourceRows.map((doc) => String(doc?.docType || doc?.type || "").toUpperCase()).filter(Boolean))];
  const documentPreviewRows = previewSourceRows
    .map((doc) => ({
      type: doc?.type || doc?.docType || "",
      docType: doc?.docType || doc?.type || "",
      image1: doc?.image1 || null,
      image2: doc?.image2 || null,
    }));
  const getZoomKey = (docType, imageIndex) => `${docType || "UNKNOWN"}_${imageIndex}`;
  const getZoomValue = (docType, imageIndex) => previewZoom[getZoomKey(docType, imageIndex)] || 1;
  const updateZoom = (docType, imageIndex, direction) => {
    const key = getZoomKey(docType, imageIndex);
    setPreviewZoom((prev) => {
      const current = prev[key] || 1;
      const next = direction === "in"
        ? Math.min(2.5, Number((current + 0.1).toFixed(2)))
        : Math.max(0.6, Number((current - 0.1).toFixed(2)));
      return { ...prev, [key]: next };
    });
  };

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

  useEffect(() => {
    if (vehicleDocTypes.length > 0 && !selectedVehicleDocType) {
      setSelectedVehicleDocType(vehicleDocTypes[0]);
    }
  }, [vehicleDocTypes, selectedVehicleDocType]);

  const handleAddressSelect = (suggestion) => {
    setSelectedAddress(suggestion || null);
  };

  const getSelectedAddressPayload = (fallbackAddress) => {
    const placeId =
      selectedAddress?.placeId ||
      selectedAddress?.place_id ||
      selectedAddress?.placeID ||
      selectedAddress?.id ||
      "";
    return makeAddressPayload(fallbackAddress || "", placeId);
  };

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
  const validationSchema = Yup.object({
    name: Yup.string().required('Vehicle Name is required'),
    ownerName: Yup.string().required('Owner Name is required'),
    vehicleNumber: Yup.string().required('Bike Number is required'),
    address: Yup.string().required('Current Address is required'),
    insurance: Yup.string().required('Insurance Expiry Date is required'),
    autoType: Yup.string().required('Bike Type is required'),
    seater: Yup.string().required('Seater is required'),
    modelYear: Yup.string()
      .required('Year of Model is required')
      .matches(/^\d{4}$/, 'Model Year must be a 4-digit year')
      .test('is-valid-year', 'Model Year cannot be in the future', (value) => {
        if (!value) return true;
        const currentYear = new Date().getFullYear();
        return parseInt(value, 10) <= currentYear;
      }),
    serviceArea: Yup.string().required('Service Area is required'),
    zoneDescription: Yup.string().required('Zone is required'),
    subZoneId: Yup.string().required('Sub Zone is required'),
  });

  return (
    <div className="p-4 mx-auto">
      <AccountCreationTabs activeStage={4} />
      {/* <h2 className="text-2xl font-bold mb-4">Add New Vehicle new</h2> */}

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
            const payload = {
              accountId: values.accountId,
              name: values.name,
              company: values.ownerName,
              vehicleNumber: values.vehicleNumber,
              curAddress: getSelectedAddressPayload(values.address),
              insurance: values.insurance,
              vehicleType: 'BIKE',
              seater: values.seater,
              modelYear: values.modelYear,
              serviceArea: values.serviceArea,
              subZoneId: values.subZoneId,
            };
            const res = await ApiRequestUtils.post(API_ROUTES.CREATE_PARCEL_ADMIN, payload);

            if (res?.success) {
              navigate(`/dashboard/vendors/account/owner-onboarding-bike`, {
                state: {
                  accountUpdated: true,
                  accountName: values.ownerName || values.name || "Bike",
                },
              });
            } else {
              console.error(`Failed to add bike: ${res?.message || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('Submission error:', error);
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
            <Form className="space-y-4 shadow-lg p-6 rounded-lg bg-white">
              <Card className="mb-4">
                <CardBody className="px-4 py-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-[26%] border border-blue-gray-100 rounded-lg overflow-hidden">
                      <div className="px-3 py-2 border-b border-blue-gray-100 bg-blue-gray-50">
                        <Typography className="text-xs font-bold uppercase text-blue-gray-500">Type</Typography>
                      </div>
                      {vehicleDocTypes.length === 0 ? (
                        <div className="px-3 py-3">
                          <Typography className="text-sm text-blue-gray-500">No document types</Typography>
                        </div>
                      ) : (
                        vehicleDocTypes.map((docType, idx) => (
                      <button
                        key={docType}
                        type="button"
                        onClick={() => setSelectedVehicleDocType(docType)}
                        className={`w-full text-left px-3 py-3 ${idx !== vehicleDocTypes.length - 1 ? "border-b border-blue-gray-100" : ""} ${selectedVehicleDocType === docType ? "bg-blue-50" : "bg-white hover:bg-blue-gray-50"}`}
                          >
                            <Typography className="text-sm font-semibold text-blue-gray-900">{docType}</Typography>
                      </button>
                        ))
                      )}
                    </div>

                  <div className="lg:w-[74%]">
                    <div className="w-full max-w-4xl min-h-[72vh] border border-blue-gray-100 rounded-lg bg-white p-3">
                      <div className="space-y-4">
                        <Typography className="text-xs font-semibold text-blue-gray-700">{selectedVehicleDocType}</Typography>
                          {(() => {
                            const activeDoc = documentPreviewRows.find((doc) => String(doc.docType || doc.type || "").toUpperCase() === selectedVehicleDocType);
                            return activeDoc?.image1 ? (
                              <div className="max-h-[56vh] overflow-y-auto overflow-x-hidden pr-1">
                                <div className={`grid w-full gap-3 ${activeDoc?.image2 ? "grid-cols-2" : "grid-cols-1"}`}>
                                  <DocumentPreview
                                    src={activeDoc.image1}
                                    zoom={getZoomValue(selectedVehicleDocType, 1)}
                                    onZoomOut={() => updateZoom(selectedVehicleDocType, 1, "out")}
                                    onZoomIn={() => updateZoom(selectedVehicleDocType, 1, "in")}
                                  />
                                  {activeDoc?.image2 && (
                                    <DocumentPreview
                                      src={activeDoc.image2}
                                      zoom={getZoomValue(selectedVehicleDocType, 2)}
                                      onZoomOut={() => updateZoom(selectedVehicleDocType, 2, "out")}
                                      onZoomIn={() => updateZoom(selectedVehicleDocType, 2, "in")}
                                    />
                                  )}
                    </div>
                  </div>
                            ) : (
                              <div className="w-full h-[38vh] md:h-[44vh] border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-500">
                                No document available
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">Vehicle Name</label>
                  <Field name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                  <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Owner Name</label>
                  <Field name="ownerName" className="p-2 w-full border-2 rounded-md border-gray-300 shadow-sm" />
                  <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                  <label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">Bike Number</label>
                  <Field name="vehicleNumber" maxLength={10} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                  <ErrorMessage name="vehicleNumber" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                  <label htmlFor="address" className="text-sm font-medium text-gray-700">Current Address</label>
                  <Field name="address">
                    {({ field, form }) => (
                      <LocationInput
                        field={field}
                        form={form}
                        suggestions={ownerAddressSuggestions}
                        onSearch={searchLocations}
                        onSelect={handleAddressSelect}
                        type="owner"
                      />
                    )}
                  </Field>
                  <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                  <label htmlFor="insurance" className="text-sm font-medium text-gray-700">Insurance Expiry Date</label>
                  <Field type="date" name="insurance" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" min={currentDate()} />
                  <ErrorMessage name="insurance" component="div" className="text-red-500 text-sm" />
                </div>
                <div className="hidden">
                  <label className="text-sm font-medium text-gray-700">Bike Type</label>
                  <div className="space-x-4 mt-1">
                    {['BIKE'].map((type) => (
                      <label key={type} className="inline-flex items-center">
                        <Field type="radio" name="autoType" value={type} className="mr-2 border-2" onChange={handleChange} />
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
                <div>
                  <label htmlFor="serviceArea" className="text-sm font-medium text-gray-700">Service Area</label>
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
                  <label htmlFor="zoneDescription" className="text-sm font-medium text-gray-700">Zone (Type: Zone / Description: Zone)</label>
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
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

              <div className="flex flex-row">
                <Button
                  fullWidth
                  onClick={() => { navigate(`/dashboard/vendors/account/owner-onboarding-bike/vehicle-documents/${values.accountId}`); }}
                  className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                >
                  Back
                </Button>
                <Button
                  fullWidth
                  className="my-6 mx-2 text-white border-2 border-red-400 bg-red-900 rounded-xl"
                  onClick={() => navigate(`/dashboard/vendors/account/owner-onboarding-bike`)}
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
