import React, { useState, useMemo } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Alert,
  Switch,
} from '@material-tailwind/react';
import Select from 'react-select';

const PARCEL_SERVICE_TYPE = 'PARCEL';
const DEFAULT_PARCEL_SUB_SERVICES = ['BIKE', 'AUTO'];

const ServiceAreaForm = ({
  onSave, initialData = null, coordinates = null ,
}) => {
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const commaIndex =
          typeof result === 'string' ? result.indexOf(',') : -1;
        resolve(
          commaIndex !== -1 ? result.substring(commaIndex + 1) : result
        );
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const initialServiceTypes = initialData?.services || [];
  const initialParcelSubServices = useMemo(() => {
    const allowedParcelSubServices = DEFAULT_PARCEL_SUB_SERVICES;
    const rawParcelSubServices = initialData?.parcelSubServices
      ?? initialData?.parcelDeliveryType
      ?? initialData?.deliveryType;
    const normalizeParcelSubService = (item) => {
      const value = (item || '').toString().trim().toUpperCase();
      if (value === 'PARCEL_BIKE') return 'BIKE';
      if (value === 'PARCEL_AUTO') return 'AUTO';
      return value;
    };
    if (Array.isArray(rawParcelSubServices)) {
      const values = rawParcelSubServices
        .map((item) => normalizeParcelSubService(item))
        .filter((item) => allowedParcelSubServices.includes(item));
      if (values.length > 0) return values;
      return initialServiceTypes.includes(PARCEL_SERVICE_TYPE)
        ? DEFAULT_PARCEL_SUB_SERVICES
        : [];
    }

    const fromApi = normalizeParcelSubService(rawParcelSubServices);
    if (allowedParcelSubServices.includes(fromApi)) return [fromApi];
    return initialServiceTypes.includes(PARCEL_SERVICE_TYPE)
      ? DEFAULT_PARCEL_SUB_SERVICES
      : [];
  }, [initialData?.parcelSubServices, initialData?.parcelDeliveryType, initialData?.deliveryType, initialServiceTypes]);
  const initialQuickServices = useMemo(() => {
    return initialData?.quickServices?.filter(qs =>
      initialServiceTypes.includes(qs)
    ) || [];
  }, [initialData?.quickServices, initialServiceTypes]);

  // Fix: Handle both string and array for highlightedService
  const initialHighlighted = useMemo(() => {
    if (!initialData?.highlightedService) return [];
    if (typeof initialData.highlightedService === 'string') {
      return initialServiceTypes.includes(initialData.highlightedService)
       ? [initialData.highlightedService]: [];
    }
    if (Array.isArray(initialData.highlightedService)) {
      return initialData.highlightedService.filter((hs) => initialServiceTypes.includes(hs));
    }
    return [];
  }, [initialData?.highlightedService, initialServiceTypes]);

  const initialNewServices = useMemo(() => {
    const ns = initialData?.newServices;
    let raw = [];
    if (ns && ns.data && Array.isArray(ns.data)) raw = ns.data;
    else if (Array.isArray(ns)) raw = ns;
    return raw.map((service) => {
      const { imageFile, imagePreview, ...rest } = service || {};
      const url = (rest.url || rest.image || '').trim();
      return { ...rest, url, imagePreview: url || undefined };
    });
  }, [initialData]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    parcelSubServices: initialParcelSubServices,
    services: initialServiceTypes,
    quickServices: initialQuickServices,
    highlightedService: initialHighlighted,
    newServices: initialNewServices,
  });

  const [error, setError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [descriptionError, setDescriptionError] = useState(null);
  const [parcelSubServicesError, setParcelSubServicesError] = useState(null);
  const [servicesError, setServicesError] = useState(null);
  const [quickServiceError, setQuickServiceError] = useState(null);
  const [highlightedServiceError, setHighlightedServiceError] = useState(null);
  const [newServicesError, setNewServicesError] = useState(null);

  const [isSubmittingFull, setIsSubmittingFull] = useState(false);

  const serviceTypeOptions = [
    { value: 'RENTAL_DROP_TAXI', label: 'Drop Taxi' },
    { value: 'RENTAL', label: 'Outstation' },
    { value: 'DRIVER', label: 'Acting Driver' },
    { value: 'RIDES', label: 'Local Rides' },
    { value: 'RENTAL_HOURLY_PACKAGE', label: 'Hourly Package' },
    { value: 'AUTO', label: 'Auto' },
    { value: 'PARCEL', label: 'Parcel' },
    { value: 'BIKE', label: 'Bike'},
  ];
  const parcelSubServicesOptions = [
    { value: 'BIKE', label: 'Bike' },
    { value: 'AUTO', label: 'Auto' },
  ];

  const newServiceNameOptions = [
    { value: 'CABS', label: 'Root Cabs' },
    { value: 'FOOD', label: 'Root Food' },
    { value: 'PARCEL', label: 'Root Parcel' },
    { value: 'STAY', label: 'Root Stay' },
  ];

 const availableQuickOptions = useMemo(() => {
    return serviceTypeOptions.filter(opt =>
      formData.services.includes(opt.value)
    );
  }, [formData.services]);

  const availableHighlightedOptions = useMemo(() => {
    return serviceTypeOptions.filter(opt =>
      formData.services.includes(opt.value)
    );
  }, [formData.services]);
  const isParcelSelected = formData.services.includes(PARCEL_SERVICE_TYPE);

  const isValidHexColor = (value) =>
    typeof value === 'string' && /^#([0-9A-Fa-f]{6})$/.test(value);

  const validateServices = (arr) => {
    if (arr.length < 3) {
      setServicesError('Please select at least 3 Service Types');
      return false;
    }
    setServicesError(null);
    return true;
  };

  const validateQuickServices = (arr) => {
    if (arr.length !== 3) {
      setQuickServiceError('Please select exactly 3 Quick Services');
      return false;
    }
    setQuickServiceError(null);
    return true;
  };

  const validateHighlightedServices = (arr) => {
    if (arr.length !== 1) {
      setHighlightedServiceError('Please select exactly 1 Highlighted Services');
      return false;
    }
    setHighlightedServiceError(null);
    return true;
  };

  const validateNewServices = (services) => {
    const names = (services || []).map((s) => s.name).filter(Boolean);

    const hasRootCabs = names.some((name) => {
      const normalized = (name || '').toString().trim().toUpperCase();
      return normalized === 'CABS' || normalized === 'ROOT CABS';
    });
    if (!hasRootCabs) {
      setNewServicesError('ROOT CABS is mandatory');
      return false;
    }

    if (names.length < 2) {
      setNewServicesError('Please select at least 2 New Services');
      return false;
    }

    setNewServicesError(null);
    return true;
  };

  const handleServiceTypeChange = (selected) => {
    const values = selected ? selected.map((s) => s.value) : [];
    const hadParcel = formData.services.includes(PARCEL_SERVICE_TYPE);
    const hasParcel = values.includes(PARCEL_SERVICE_TYPE);
    const filteredQuick = formData.quickServices.filter((qs) => values.includes(qs));
    const filteredHighlighted = (formData.highlightedService || [])
      .filter((hs) => values.includes(hs));
    const nextParcelSubServices = hasParcel
      ? hadParcel
        ? formData.parcelSubServices
        : DEFAULT_PARCEL_SUB_SERVICES
      : [];

    setFormData((prev) => ({
      ...prev,
      services: values,
      parcelSubServices: nextParcelSubServices,
      quickServices: filteredQuick,
      highlightedService: filteredHighlighted,
    }));

    if (!hasParcel) {
      setParcelSubServicesError(null);
    }
    validateServices(values);
    validateQuickServices(filteredQuick);
    validateHighlightedServices(filteredHighlighted);
  };
  const handleParcelSubServicesChange = (selected) => {
    const values = selected ? selected.map((s) => s.value) : [];
    setFormData((prev) => ({
      ...prev,
      parcelSubServices: values,
    }));
    setParcelSubServicesError(null);
  };

  const handleQuickServiceChange = (selected) => {
    const values = selected ? selected.map((s) => s.value) : [];
    setFormData((prev) => ({ ...prev, quickServices: values }));
    validateQuickServices(values);
  };

  const handleHighlightedChange = (selected) => {
    const values = selected ? selected.map((s) => s.value) : [];
    setFormData((prev) => ({
      ...prev,
      highlightedService: values,
    }));
    validateHighlightedServices(values);
  };

  const handleNewServiceSelectChange = (selected) => {
    const names = selected ? selected.map((s) => s.value) : [];

    const existing = {};
    formData.newServices.forEach((s) => {
      if (s.name) existing[s.name] = s;
    });

    const updated = names.map((name) =>
      existing[name] || {
        name,
        accentColor: '#1D4ED8',
        backgroundColor: '#EAEEFF',
        pillColor: '#1E3A8A',
        isUpdate: false,
        url: '',
      }
    );

    setFormData((prev) => ({ ...prev, newServices: updated }));
    if (updated.length > 0) {
      validateNewServices(updated);
    } else {
      setNewServicesError(null);
    }
  };

  const handleNewServiceChange = (index, field, value) => {
    const updated = [...formData.newServices];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, newServices: updated }));
  };

  const handleNewServiceToggle = (index, checked) => {
    const updated = [...formData.newServices];
    updated[index] = { ...updated[index], isUpdate: checked };
    setFormData((prev) => ({ ...prev, newServices: updated }));
  };
  const handleNewServiceImageChange = (index, file) => {
    if (!file || typeof URL === 'undefined') return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPEG, PNG and GIF images are allowed.');
      return;
    }

    const updated = [...formData.newServices];

    const prevPreview = updated[index]?.imagePreview;
    if (prevPreview) {
      try {
        URL.revokeObjectURL(prevPreview);
      } catch {
        // ignore revoke errors
      }
    }

    const ext = file.name?.split('.').pop()?.toLowerCase() || '';

    updated[index] = {
      ...updated[index],
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
      image: '',
      extImage: ext,
      fileTypeImage: file.type || '',
      url: '',
    };
    setFormData((prev) => ({ ...prev, newServices: updated }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNameError(null);
    setDescriptionError(null);
    setParcelSubServicesError(null);
    setServicesError(null);
    setQuickServiceError(null);
    setHighlightedServiceError(null);

    let hasError = false;

    if (!formData.name.trim()) {
      setNameError('Name is required');
      hasError = true;
    }

    if (!formData.description) {
      setDescriptionError('Description is required');
      hasError = true;
    }

    if (
      isParcelSelected
      && (!Array.isArray(formData.parcelSubServices) || formData.parcelSubServices.length === 0)
    ) {
      setParcelSubServicesError('Please select at least 1 Parcel Sub Service');
      hasError = true;
    }

    if (!validateServices(formData.services)) hasError = true;
    if (!validateQuickServices(formData.quickServices)) hasError = true;
    if (!validateHighlightedServices(formData.highlightedService || [])) hasError = true;

    if (!coordinates || coordinates.length < 3) {
      setError('Please draw a valid polygon with at least 3 points');
      hasError = true;
    }
    if (hasError) {
      return;
    }

    setIsSubmittingFull(true);

    try {
      const cleanNewServices = await Promise.all(
        (formData.newServices || []).map(async (service) => {
          const file =
            service.imageFile instanceof File ? service.imageFile : null;
          const extFromFile = file?.name?.split('.').pop()?.toLowerCase() || '';

          let imageValue = service.image || '';
          if (!imageValue && file) {
            imageValue = await fileToBase64(file);
          }

          return {
            name: service.name,
            accentColor: service.accentColor || '#1D4ED8',
            backgroundColor: service.backgroundColor || '#EAEEFF',
            pillColor: service.pillColor || '#1E3A8A',
            isUpdate: !!service.isUpdate,
            image: imageValue,
            extImage: service.extImage || extFromFile || '',
            fileTypeImage:
              service.fileTypeImage || (file ? file.type || '' : ''),
          };
        })
      );

      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        services: formData.services,
        quickServices: formData.quickServices,
        highlightedService: formData.highlightedService,
        newServices: { data: cleanNewServices },
        coordinates,
      };
      if (formData.services.includes(PARCEL_SERVICE_TYPE)) {
        payload.parcelSubServices = formData.parcelSubServices;
      }

      await onSave(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmittingFull(false);
    }
  };

  return (
    <Card className="p-4 mt-4">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Service Area Details
      </Typography>
      {error && (
        <Alert color="red" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
            Name <span className="text-red-500">*</span>
          </Typography>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (nameError) {
                setNameError(null);
              }
            }}
            placeholder="Enter service area name"
            error={!!nameError}
          />
          {nameError && (
            <p className="text-red-500 text-xs mt-1">{nameError}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
            Description <span className="text-red-500">*</span>
          </Typography>
          <Input
            type="text"
            value={formData.description}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, description: e.target.value }));
              if (descriptionError) setDescriptionError(null);
            }}
            placeholder="Enter service area description"
            error={!!descriptionError}
          />
          {descriptionError && (
            <p className="text-red-500 text-xs mt-1">{descriptionError}</p>
          )}
        </div>

        {/* Service Types */}
        <div className="relative z-50">
          <label className="block text-sm text-gray-700 mb-1">
            Service Types <span className="text-red-500">*</span>
          </label>
          <Typography variant="small" color="gray" className="mb-1">
            Select at least 3 service types.
          </Typography>
          <Select
            isMulti
            options={serviceTypeOptions}
            value={serviceTypeOptions.filter((opt) => 
              formData.services.includes(opt.value)
            )}
            onChange={handleServiceTypeChange}
            closeMenuOnSelect={false}
            placeholder="Select service types"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              control: (base, state) => ({
                ...base,
                borderColor: servicesError ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                boxShadow: servicesError
                  ? '0 0 0 1px #ef4444'
                  : state.isFocused
                    ? '0 0 0 1px #3b82f6'
                    : 'none',
                '&:hover': { borderColor: servicesError ? '#ef4444' : '#9ca3af' },
              }),
            }}
          />
          {servicesError && <p className="text-red-500 text-xs mt-1">{servicesError}</p>}
           
          
        </div>
      {/* Service Types */}
        {isParcelSelected && (
        <div className="relative z-50">
          <label className="block text-sm text-gray-700 mb-1">
            Parcel Sub Services {isParcelSelected && <span className="text-red-500">*</span>}
          </label>
          <Select
            isMulti
            options={parcelSubServicesOptions}
            value={parcelSubServicesOptions.filter((opt) => formData.parcelSubServices.includes(opt.value))}
            onChange={handleParcelSubServicesChange}
            closeMenuOnSelect={false}
            placeholder="Select parcel sub services"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              control: (base, state) => ({
                ...base,
                borderColor: parcelSubServicesError ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                boxShadow: parcelSubServicesError
                  ? '0 0 0 1px #ef4444'
                  : state.isFocused
                    ? '0 0 0 1px #3b82f6'
                    : 'none',
                '&:hover': { borderColor: parcelSubServicesError ? '#ef4444' : '#9ca3af' },
              }),
            }}
          />
          {parcelSubServicesError && <p className="text-red-500 text-xs mt-1">{parcelSubServicesError}</p>}
        </div>
        )}

        {/* New Services */}
        <div className="mt-2">
          <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
            New Services
          </Typography>
          <Typography variant="small" color="gray" className="mb-2">
            Optional. If you add new services, ROOT CABS is mandatory and select at least 2.
          </Typography>

          <div className="relative z-50 mb-4">
            <Select
              isMulti
              options={newServiceNameOptions}
              value={newServiceNameOptions.filter((opt) =>
                      formData.newServices?.some((s) => s.name === opt.value)
              )}
              onChange={handleNewServiceSelectChange}
              closeMenuOnSelect={false}
              placeholder="Select new services"
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              styles={{menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>

          {newServicesError && (
            <p className="text-red-500 text-xs mt-1">{newServicesError}</p>
          )}

                {/* Services Cards */}
                <div className="space-y-4">
                  {formData.newServices?.map((service, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-white shadow-sm space-y-4"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                  <Typography variant="h6" color="blue-gray">
                          {service.name}
                  </Typography>
                  <Switch
                    color="blue"
                    checked={!!service.isUpdate}
                    onChange={(e) => handleNewServiceToggle(index, e.target.checked)}
                    label={service.isUpdate ? 'Active' : 'Inactive'}
                  />
                </div>

                      {/* Image */}
                {!((service.name || '').toString().trim().toUpperCase() === 'CABS' || (service.name || '').toString().trim().toUpperCase() === 'ROOT CABS') && (
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2">
                    Service Image
                  </Typography>
                                   <label className="cursor-pointer block w-full max-w-xs">
                    <div
                      className={`border-2 rounded p-4 text-center transition-all ${
                        service.imagePreview || service.url
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-dashed border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {service.imagePreview ? (
                        <img
                          src={service.imagePreview}
                          alt="preview"
                          className="max-h-28 mx-auto object-contain"
                        />
                      ) : service.url ? (
                        <img
                          src={service.url}
                          alt="existing"
                          className="max-h-28 mx-auto object-contain"
                        />
                      ) : (
                              <span className="text-xs text-gray-500">
                                Click to upload (PNG / JPG / GIF)
                              </span>
                      )}
                    </div>

                    <input
                      type="file"
                            accept="image/png, image/jpeg, image/jpg, image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                              if (file) {
                                handleNewServiceImageChange(index, file);
                              }
                      }}
                    />
                  </label>
                </div>
                )}

                {/* Colors */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Accent Color', key: 'accentColor', placeholder: '#1D4ED8' },
                    { label: 'Background Color', key: 'backgroundColor', placeholder: '#EAEEFF' },
                    { label: 'Pill Color', key: 'pillColor', placeholder: '#1E3A8A' },
                  ].map((item) => (
                          <div key={item.key} className="flex flex-col">
                      <Typography variant="small" color="blue-gray" className="mb-1">
                        {item.label}
                      </Typography>

                            <div className="flex items-center gap-2">
                        <input
                          type="color"
                                value={
                                  isValidHexColor(service[item.key])
                                    ? service[item.key]
                                    : '#000000'
                                }
                                onChange={(e) =>
                                  handleNewServiceChange(
                                    index,
                                    item.key,
                                    e.target.value
                                  )
                                }
                                className="h-10 w-12 border border-gray-300 rounded"
                        />

                        <Input
                                type="text"
                          value={service[item.key] || ''}
                                onChange={(e) =>
                                  handleNewServiceChange(
                                    index,
                                    item.key,
                                    e.target.value
                                  )
                                }
                          placeholder={item.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Services */}
        <div className="relative z-50">
          <label className="block text-sm text-gray-700 mb-1">
            Quick Service <span className="text-red-500">*</span>
          </label>
          <Typography variant="small" color="gray" className="mb-1">
            Select exactly 3 quick services.
          </Typography>
          <Select
            isMulti
            options={availableQuickOptions}
            isSearchable={false}
            value={availableQuickOptions.filter((opt) =>
              formData.quickServices.includes(opt.value)
            )}
            onChange={handleQuickServiceChange}
            closeMenuOnSelect={false}
            placeholder={
              availableQuickOptions.length === 0
                ? 'First select Service Types'
                : 'Select exactly 3 quick services'
            }
            isDisabled={availableQuickOptions.length === 0}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              control: (base, state) => ({
                ...base,
                borderColor: quickServiceError ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                boxShadow: quickServiceError ? '0 0 0 1px #ef4444' : state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                '&:hover': { borderColor: quickServiceError ? '#ef4444' : '#9ca3af' },
              }),
            }}
          />
          {quickServiceError && <p className="text-red-500 text-xs mt-1">{quickServiceError}</p>}
        </div>

        {/* Highlighted Service */}
        <div className="relative z-50">
          <label className="block text-sm text-gray-700 mb-1">
            Highlighted Service <span className="text-red-500">*</span>
          </label>
          <Select
            isMulti
            options={availableHighlightedOptions}
            value={availableHighlightedOptions.filter((opt) =>
              (formData.highlightedService || []).includes(opt.value)
            )}
            onChange={handleHighlightedChange}
            closeMenuOnSelect={false}
            placeholder={
              availableHighlightedOptions.length === 0
                ? 'First select Service Types'
                : 'Select highlighted services'
            }
            isDisabled={availableHighlightedOptions.length === 0}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              control: (base, state) => ({
                ...base,
                borderColor: highlightedServiceError ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                boxShadow: highlightedServiceError
                  ? '0 0 0 1px #ef4444'
                  : state.isFocused
                    ? '0 0 0 1px #3b82f6'
                    : 'none',
                '&:hover': { borderColor: highlightedServiceError ? '#ef4444' : '#9ca3af' },
              }),
            }}
          />
          {highlightedServiceError && <p className="text-red-500 text-xs mt-1">{highlightedServiceError}</p>}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="mt-6"
          disabled={isSubmittingFull}
          fullWidth
        >
          {isSubmittingFull
            ? 'Saving...'
            : initialData
            ? 'Update Service Area'
            : 'Create Service Area'}
        </Button>
      </form>
    </Card>
  );
};

export default ServiceAreaForm;