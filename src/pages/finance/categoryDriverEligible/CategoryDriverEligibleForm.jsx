import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Switch, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import {CATALOG_SERVICE_TYPE_OPTIONS,CATEGORY_OPTIONS,CATEGORY_OPTIONS_BY_SERVICE_TYPE,DRIVER_RULE_CAR_TYPE_OPTIONS,DRIVER_RULE_CAR_TYPE_OPTIONS_BY_SERVICE_TYPE,DRIVER_RULE_PLAN_OPTIONS,BOOKING_TYPE_OPTIONS,PACKAGE_TYPE_OPTIONS,STATUS_OPTIONS,TARGET_SERVICE_TYPE_OPTIONS,TARGET_SERVICE_TYPE_OPTIONS_BY_CATALOG_SERVICE_TYPE,emptyCategoryDriverEligible,emptyDriverRule,} from "./constants";
import {
  createCategoryDriverEligible,
  getCategoryDriverEligibleById,
  getCategoryDriverEligibleList,
  updateCategoryDriverEligible,
} from "./api";
import { shouldUseBookingType, shouldUseDriverRules, shouldUsePackageFields } from "./rules";
import { categoryDriverEligibleSchema, yupErrorsToObject } from "./validation";

const modeTitle = {
  add: "Add Category Driver Eligible",
  edit: "Edit Category Driver Eligible",
  details: "Category Driver Eligible Details",
};

const normalizeRecord = (record = {}) => ({
  ...emptyCategoryDriverEligible,
  ...record,
  displayOrder: record.displayOrder ?? "",
  isVisible: record.isVisible ?? true,
  status: record.status || "ACTIVE",
  driverRules: Array.isArray(record.driverRules) && record.driverRules.length > 0
    ? record.driverRules.map((rule) => ({
        id: rule.id,
        catalogId: rule.catalogId,
        carTypes: Array.isArray(rule.carTypes) ? rule.carTypes : [],
        planNames: Array.isArray(rule.planNames) ? rule.planNames : [],
        status: rule.status,
      }))
    : [emptyDriverRule()],
});

const buildPayload = (form, id) => {
  const payload = {
    ...(id ? { id: Number(id) || id } : {}),
    zone: form.zone,
    catalogServiceType: form.catalogServiceType,
    targetServiceType: form.targetServiceType,
    category: form.category,
    label: form.label,
    displayOrder: Number(form.displayOrder),
    isVisible: Boolean(form.isVisible),
    status: form.status,
  };

  if (shouldUsePackageFields(form.targetServiceType)) {
  payload.packageType = String(form.packageType || "").toUpperCase();
  payload.bookingType = shouldUseBookingType(form.packageType) ? form.bookingType : null;
  }

  if (shouldUseDriverRules(form.catalogServiceType, form.targetServiceType)) {
    payload.driverRules = (form.driverRules || []).map((rule) => ({
      carTypes: rule.carTypes || [],
      planNames: rule.planNames || [],
    }));
  }

  return payload;
};

const getAllowedOptions = (optionsByServiceType, serviceType, fallbackOptions) =>
  optionsByServiceType[serviceType] || fallbackOptions;

const filterRuleCarTypes = (rules, allowedCarTypeOptions) => {
  const allowedValues = new Set(allowedCarTypeOptions.map((item) => item.value));
  return (rules || []).map((rule) => ({
    ...rule,
    carTypes: (rule.carTypes || []).filter((carType) => allowedValues.has(carType)),
  }));
};

const ErrorText = ({ value }) => value ? <p className="mt-1 text-sm text-red-500">{value}</p> : null;
const RequiredMark = () => <span className="text-red-600">*</span>;
const FieldLabel = ({ children, required = false }) => (
  <label className="mb-1 block text-sm font-medium text-gray-700">
    {children} {required ? <RequiredMark /> : null}
  </label>
);

const MultiCheck = ({ label, options, value, disabled, required, onChange }) => {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">
        {label} {required ? <RequiredMark /> : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onChange(active ? selected.filter((item) => item !== option.value) : [...selected, option.value]);
              }}
              className={`rounded-md border px-3 py-2 text-sm ${active ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-gray-700"} ${disabled ? "cursor-not-allowed opacity-80" : ""}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function CategoryDriverEligibleForm({ mode }) {
  const isDetails = mode === "details";
  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(() => normalizeRecord(state?.item || {}));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
        const list = Array.isArray(response?.data) ? response.data : [];
        setZones(list.map((item) => ({ value: item.name || item.label || "", label: item.name || item.label || "Unnamed Zone" })).filter((item) => item.value));
      } catch (error) {
        console.error("Failed to load service areas:", error);
      }
    };
    loadZones();
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        let record = state?.item;
        if (!record?.id) {
          const response = await getCategoryDriverEligibleById(id);
          record = response?.data;
        }
        if (!record?.id) {
          const response = await getCategoryDriverEligibleList({});
          record = (Array.isArray(response?.data) ? response.data : []).find((item) => String(item.id) === String(id));
        }
        setForm(normalizeRecord(record || {}));
      } catch (error) {
        console.error("Failed to load category driver eligible:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, state?.item]);

  const disabled = isDetails;
  const identityFieldsDisabled = disabled || isEdit;
  const driverRules = useMemo(() => form.driverRules || [], [form.driverRules]);
  const showDriverRules = shouldUseDriverRules(form.catalogServiceType, form.targetServiceType);
  const showPackageFields = shouldUsePackageFields(form.targetServiceType);
  const showBookingType = showPackageFields && shouldUseBookingType(form.packageType);
  const targetServiceOptions = useMemo(
    () => getAllowedOptions(TARGET_SERVICE_TYPE_OPTIONS_BY_CATALOG_SERVICE_TYPE, form.catalogServiceType, TARGET_SERVICE_TYPE_OPTIONS),
    [form.catalogServiceType]
  );
  const categoryOptions = useMemo(
    () => getAllowedOptions(CATEGORY_OPTIONS_BY_SERVICE_TYPE, form.targetServiceType, CATEGORY_OPTIONS),
    [form.targetServiceType]
  );
  const carTypeOptions = useMemo(
    () => getAllowedOptions(DRIVER_RULE_CAR_TYPE_OPTIONS_BY_SERVICE_TYPE, form.targetServiceType, DRIVER_RULE_CAR_TYPE_OPTIONS),
    [form.targetServiceType]
  );
  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const handleCatalogServiceTypeChange = (value) => {
    const nextTargetOptions = getAllowedOptions(TARGET_SERVICE_TYPE_OPTIONS_BY_CATALOG_SERVICE_TYPE, value, TARGET_SERVICE_TYPE_OPTIONS);
    const nextTargetServiceType = nextTargetOptions.some((item) => item.value === value)
      ? value
      : nextTargetOptions[0]?.value || "";
    const nextCategoryOptions = getAllowedOptions(CATEGORY_OPTIONS_BY_SERVICE_TYPE, nextTargetServiceType, CATEGORY_OPTIONS);
    const nextCarTypeOptions = getAllowedOptions(DRIVER_RULE_CAR_TYPE_OPTIONS_BY_SERVICE_TYPE, nextTargetServiceType, DRIVER_RULE_CAR_TYPE_OPTIONS);

    setForm((prev) => ({
      ...prev,
      catalogServiceType: value,
      targetServiceType: nextTargetServiceType,
      category: nextCategoryOptions.some((item) => item.value === prev.category) ? prev.category : "",
      driverRules: filterRuleCarTypes(prev.driverRules, nextCarTypeOptions),
    }));
  };
  const handleTargetServiceTypeChange = (value) => {
    const nextCategoryOptions = getAllowedOptions(CATEGORY_OPTIONS_BY_SERVICE_TYPE, value, CATEGORY_OPTIONS);
    const nextCarTypeOptions = getAllowedOptions(DRIVER_RULE_CAR_TYPE_OPTIONS_BY_SERVICE_TYPE, value, DRIVER_RULE_CAR_TYPE_OPTIONS);

    setForm((prev) => ({
      ...prev,
      targetServiceType: value,
      category: nextCategoryOptions.some((item) => item.value === prev.category) ? prev.category : "",
      driverRules: filterRuleCarTypes(prev.driverRules, nextCarTypeOptions),
    }));
  };
  const setRuleField = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      driverRules: prev.driverRules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, [field]: value } : rule),
    }));
  };

  const validate = async () => {
    try {
      await categoryDriverEligibleSchema.validate(form, { abortEarly: false });
      setErrors({});
      return true;
    } catch (validationError) {
      setErrors(yupErrorsToObject(validationError));
      return false;
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (disabled) return;
    const isValid = await validate();
    if (!isValid) return;
    try {
      setSaving(true);
      const response = isEdit
        ? await updateCategoryDriverEligible(buildPayload(form, form.id || id))
        : await createCategoryDriverEligible(buildPayload(form));
      if (response?.success !== false) navigate("/dashboard/finance/category-driver-eligible");
    } catch (error) {
      console.error("Failed to save category driver eligible:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mt-12 flex justify-center"><Spinner className="h-10 w-10" /></div>;

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">{modeTitle[mode]}</Typography>
        </CardHeader>
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Zone</FieldLabel>
              <select disabled={identityFieldsDisabled} className="w-full rounded-md border border-gray-300 p-2" value={form.zone} onChange={(e) => setField("zone", e.target.value)}>
                <option value="">Select Zone</option>
                {zones.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
              </select>
              <ErrorText value={errors.zone} />
            </div>
            <div>
              <FieldLabel required>Catalog Service Type</FieldLabel>
              <select disabled={identityFieldsDisabled} className="w-full rounded-md border border-gray-300 p-2" value={form.catalogServiceType} onChange={(e) => handleCatalogServiceTypeChange(e.target.value)}>
                <option value="">Select Catalog Service</option>
                {CATALOG_SERVICE_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorText value={errors.catalogServiceType} />
            </div>
            <div>
              <FieldLabel required>Target Service Type</FieldLabel>
              <select disabled={disabled} className="w-full rounded-md border border-gray-300 p-2" value={form.targetServiceType} onChange={(e) => handleTargetServiceTypeChange(e.target.value)}>
                <option value="">Select Target Service</option>
                {targetServiceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorText value={errors.targetServiceType} />
            </div>
            <div>
              <FieldLabel required>Category</FieldLabel>
              <select disabled={identityFieldsDisabled} className="w-full rounded-md border border-gray-300 p-2" value={form.category} onChange={(e) => setField("category", e.target.value)}>
                <option value="">Select Category</option>
                {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorText value={errors.category} />
            </div>
            <div>
              <FieldLabel required>Category Label</FieldLabel>
              <input
                disabled={disabled}
                type="text"
                className="w-full rounded-md border border-gray-300 p-2"
                value={form.label}
                onChange={(e) => setField("label", e.target.value)}
                placeholder="Economy Go"
              />
              <ErrorText value={errors.label} />
            </div>
            {showPackageFields ? (
            <div>
              <FieldLabel required>Package Type</FieldLabel>
              <select disabled={disabled} className="w-full rounded-md border border-gray-300 p-2" value={form.packageType} onChange={(e) => setField("packageType", e.target.value)}>
                <option value="">Select Package Type</option>
                {PACKAGE_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorText value={errors.packageType} />
            </div>
            ) : null}
            {showBookingType ? (
                <div>
                  <FieldLabel required>Booking Type</FieldLabel>
                  <select disabled={disabled} className="w-full rounded-md border border-gray-300 p-2" value={form.bookingType} onChange={(e) => setField("bookingType", e.target.value)}>
                    <option value="">Select Booking Type</option>
                    {BOOKING_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <ErrorText value={errors.bookingType} />
                </div>
            ) : null}
            <div>
              <FieldLabel required>Display Order</FieldLabel>
              <input disabled={disabled} type="number" className="w-full rounded-md border border-gray-300 p-2" value={form.displayOrder} onChange={(e) => setField("displayOrder", e.target.value)} />
              <ErrorText value={errors.displayOrder} />
            </div>
            <div>
              <FieldLabel required>Status</FieldLabel>
              <select disabled={disabled} className="w-full rounded-md border border-gray-300 p-2" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorText value={errors.status} />
            </div>
            <div className="md:col-span-2">
              <Switch disabled={disabled} checked={Boolean(form.isVisible)} label="Visible" onChange={(e) => setField("isVisible", e.target.checked)} />
            </div>

            {showDriverRules ? (
            <div className="md:col-span-2 rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Typography variant="h6" className="text-gray-800">Driver Request</Typography>
                {!disabled && (
                  <Button type="button" size="sm" variant="outlined" onClick={() => setField("driverRules", [...driverRules, emptyDriverRule()])}>
                    Add Rule
                  </Button>
                )}
              </div>
              <ErrorText value={errors.driverRules} />
              <div className="flex flex-col gap-4">
                {driverRules.map((rule, index) => (
                  <div key={index} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Typography className="text-sm font-semibold text-gray-800">Rule {index + 1}</Typography>
                      {!disabled && driverRules.length > 1 && (
                        <Button type="button" size="sm" color="red" variant="text" onClick={() => setField("driverRules", driverRules.filter((_, ruleIndex) => ruleIndex !== index))}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <MultiCheck required label="Based on Car Types" options={carTypeOptions} value={rule.carTypes} disabled={disabled} onChange={(value) => setRuleField(index, "carTypes", value)} />
                        <ErrorText value={errors[`driverRules.${index}.carTypes`]} />
                      </div>
                      <div>
                        <MultiCheck required label="Based on Subscription Plan Names" options={DRIVER_RULE_PLAN_OPTIONS} value={rule.planNames} disabled={disabled} onChange={(value) => setRuleField(index, "planNames", value)} />
                        <ErrorText value={errors[`driverRules.${index}.planNames`]} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            ) : null}

            <div className="md:col-span-2 flex justify-center gap-3">
              <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/finance/category-driver-eligible")}>
                {isDetails ? "Back" : "Cancel"}
              </Button>
              {isDetails ? (
                <Button type="button" className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/finance/category-driver-eligible/edit/${form.id || id}`, { state: { item: form } })}>
                  Edit
                </Button>
              ) : (
                <Button type="submit" className={ColorStyles.continueButtonColor} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}