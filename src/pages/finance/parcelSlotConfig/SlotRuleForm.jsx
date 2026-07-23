import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Option,
  Select,
  Spinner,
  Switch,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { DAYS, EMPTY_INITIAL_VALUES, RULE_TYPES } from "./constants";
import DaysOfWeekSelector from "./DaysOfWeekSelector";
import WeeklyConfig from "./WeeklyConfig";

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();

const fetchParcelGeoOptions = async (geoParams = {}) => {
  const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, geoParams);
  const allGeo = Array.isArray(response?.data) ? response.data : [];
  const filteredAreas = allGeo.filter((area) => area.type === "Service Area");
  const filteredSubZones = allGeo.filter((area) => area.type === "Zone" && area.description === "Zone");

  const zones = filteredAreas
    .map((area) => ({
      label: area.name || area.label || "Unnamed Zone",
      value: area.name || area.label || "",
      raw: area,
    }))
    .filter((item) => normalizeText(item.value));

  const subZones = filteredSubZones
    .map((area) => ({
      id: String(area.id ?? area._id ?? ""),
      label: area.name || area.label || "Unnamed Sub Zone",
      value: String(area.id ?? area._id ?? area.name ?? area.label ?? ""),
      zone:
        area.zone ||
        area.zoneName ||
        area.parentZone ||
        area.serviceArea ||
        area.serviceAreaName ||
        "",
      raw: area,
    }))
    .filter((item) => normalizeText(item.value));

  const subZoneLookup = subZones.reduce((acc, item) => {
    if (item.id) acc[item.id] = item;
    if (item.value) acc[item.value] = item;
    return acc;
  }, {});

  return { zones, subZones, subZoneLookup };
};

const readText = (value) => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
};

const resolveZoneValue = (value) =>
  readText(value?.zone || value?.zoneName || value?.name || value?.label || value?.serviceArea || value);

const resolveSubZoneValue = (value) =>
  readText(
    value?.subZoneId ||
      value?.subZone?.id ||
      value?.subZone?.name ||
      value?.subZoneName ||
      value?.zoneId ||
      value?.id ||
      value?.name ||
      value?.label ||
      value
  );

const emptySlot = () => ({ startTime: "", endTime: "", maxBookings: "" });

const formatDayLabels = (dayValues = []) =>
  dayValues
    .map((dayValue) => DAYS.find((day) => day.value === dayValue)?.label || dayValue)
    .join(", ");

const RequiredMark = () => <span className="ml-1 text-red-500">*</span>;

const isSameErrorMap = (left = {}, right = {}) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[key] === right[key]);
};

const getDateRangeValues = (fromDate, toDate) => {
  if (!fromDate || !toDate) return [];
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return [];

  const dates = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const buildInitialForm = (initialValues = {}) => ({
  zone: resolveZoneValue(initialValues.zone || initialValues),
  subZoneId: resolveSubZoneValue(initialValues.subZoneId || initialValues),
  ruleType: initialValues.ruleType || "WEEKLY",
  daysOfWeek: Array.isArray(initialValues.daysOfWeek) ? initialValues.daysOfWeek : [],
  fromDate: initialValues.fromDate || "",
  toDate: initialValues.toDate || "",
  priority: initialValues.priority ?? (initialValues.ruleType === "SPECIAL_DATE" ? 1 : 10),
  isActive: initialValues.isActive ?? true,
  notes: initialValues.notes || "",
  config: initialValues.config || { weekly: {}, specialDates: {} },
});

function SlotRuleForm({ mode = "add", initialValues, submitLabel }) {
  const isViewMode = mode === "view";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [zones, setZones] = useState([]);
  const [subZones, setSubZones] = useState([]);
  const resolvedInitialValues = initialValues || EMPTY_INITIAL_VALUES;
  const [form, setForm] = useState(() => buildInitialForm(resolvedInitialValues));

  useEffect(() => {
    setForm(buildInitialForm(resolvedInitialValues));
  }, [resolvedInitialValues]);

  useEffect(() => {
    const loadGeo = async () => {
      setGeoLoading(true);
      try {
        const { zones: zoneOptions, subZones: subZoneOptions } = await fetchParcelGeoOptions();
        setZones(zoneOptions);
        setSubZones(subZoneOptions);
      } catch (error) {
        console.error("Failed to load geo options:", error);
        setZones([]);
        setSubZones([]);
      } finally {
        setGeoLoading(false);
      }
    };

    loadGeo();
  }, []);

  const filteredSubZones = useMemo(
    () =>
      form.zone
        ? subZones.filter(
            (item) => !item.zone || String(item.zone).toLowerCase() === String(form.zone).toLowerCase()
          )
        : subZones,
    [form.zone, subZones]
  );

  const selectedZoneLabel = useMemo(() => {
    const match = zones.find((item) => String(item.value) === String(form.zone));
    return match?.label || String(form.zone || "").toUpperCase();
  }, [form.zone, zones]);

  const selectedSubZoneLabel = useMemo(() => {
    const match = filteredSubZones.find((item) => String(item.value) === String(form.subZoneId));
    const fallback = subZones.find((item) => String(item.value) === String(form.subZoneId));
    return match?.label || fallback?.label || String(form.subZoneId || "").toUpperCase();
  }, [filteredSubZones, form.subZoneId, subZones]);

  const selectedRuleTypeLabel = useMemo(() => {
    const match = RULE_TYPES.find((item) => String(item.value) === String(form.ruleType));
    return match?.label || "";
  }, [form.ruleType]);

  useEffect(() => {
    if (form.ruleType !== "SPECIAL_DATE") return;

    const nextErrors = {};
    const hasFrom = Boolean(form.fromDate);
    const hasTo = Boolean(form.toDate);

    if (!hasFrom) {
      nextErrors.fromDate = "From Date is required";
    }

    if (!hasTo) {
      nextErrors.toDate = "To Date is required";
    } else if (hasFrom) {
      const from = new Date(`${form.fromDate}T00:00:00`);
      const to = new Date(`${form.toDate}T00:00:00`);
      const diffDays = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        nextErrors.toDate = "Invalid date selected";
      } else if (diffDays < 1) {
        nextErrors.toDate = "To Date must be on or after From Date";
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (isSameErrorMap(next, nextErrors)) return prev;
      return nextErrors;
    });
  }, [form.ruleType, form.fromDate, form.toDate]);

  useEffect(() => {
    if (form.ruleType !== "SPECIAL_DATE") return;
    if (!form.fromDate || !form.toDate) {
      setForm((prev) => {
        const existingSpecialDates = prev.config?.specialDates || {};
        if (Object.keys(existingSpecialDates).length === 0) return prev;

        return {
          ...prev,
          config: {
            ...prev.config,
            specialDates: {},
          },
        };
      });
      return;
    }

    const rangeDates = getDateRangeValues(form.fromDate, form.toDate);
    if (rangeDates.length === 0) return;

    setForm((prev) => {
      const existingSpecialDates = prev.config?.specialDates || {};
      const nextSpecialDates = rangeDates.reduce((acc, dateKey) => {
        acc[dateKey] = Array.isArray(existingSpecialDates[dateKey]) ? existingSpecialDates[dateKey] : [];
        return acc;
      }, {});

      const existingKeys = Object.keys(existingSpecialDates);
      const nextKeys = Object.keys(nextSpecialDates);
      const sameKeys =
        existingKeys.length === nextKeys.length &&
        nextKeys.every((dateKey) => Array.isArray(existingSpecialDates[dateKey]));

      if (sameKeys) return prev;

      return {
        ...prev,
        config: {
          ...prev.config,
          specialDates: nextSpecialDates,
        },
      };
    });
  }, [form.ruleType, form.fromDate, form.toDate]);

  const updateSlot = (scope, key, index, field, value) => {
    setForm((prev) => {
      const next = { ...prev, config: { ...prev.config } };
      const existing = Array.isArray(next.config?.[scope]?.[key]) ? [...next.config[scope][key]] : [];
      const slot = { ...(existing[index] || emptySlot()), [field]: value };
      existing[index] = slot;
      next.config[scope] = { ...(next.config?.[scope] || {}), [key]: existing };
      return next;
    });
  };

  const addSlot = (scope, key) => {
    setForm((prev) => {
      const next = { ...prev, config: { ...prev.config } };
      const existing = Array.isArray(next.config?.[scope]?.[key]) ? [...next.config[scope][key]] : [];
      existing.push(emptySlot());
      next.config[scope] = { ...(next.config?.[scope] || {}), [key]: existing };
      return next;
    });
  };

  const removeSlot = (scope, key, index) => {
    setForm((prev) => {
      const next = { ...prev, config: { ...prev.config } };
      const existing = Array.isArray(next.config?.[scope]?.[key]) ? [...next.config[scope][key]] : [];
      existing.splice(index, 1);
      next.config[scope] = { ...(next.config?.[scope] || {}), [key]: existing };
      return next;
    });
  };

  const setRuleType = (ruleType) => {
    setForm((prev) => ({
      ...prev,
      ruleType,
      priority: ruleType === "SPECIAL_DATE" ? 1 : 10,
      daysOfWeek: ruleType === "WEEKLY" ? prev.daysOfWeek : [],
      fromDate: ruleType === "SPECIAL_DATE" ? prev.fromDate : "",
      toDate: ruleType === "SPECIAL_DATE" ? prev.toDate : "",
    }));
  };

  const buildPayload = () => {
    const payload = {
      zone: form.zone,
      ruleType: form.ruleType,
      priority: form.ruleType === "SPECIAL_DATE" ? 1 : 10,
      isActive: Boolean(form.isActive),
      notes: form.notes || "",
      config: {},
    };

    if (form.subZoneId) {
      payload.subZoneId = form.subZoneId;
    }

    if (form.ruleType === "WEEKLY") {
      payload.daysOfWeek = form.daysOfWeek;
      payload.config = {
        weekly: form.config?.weekly || {},
      };
    } else {
      payload.fromDate = form.fromDate;
      payload.toDate = form.toDate;
      payload.config = {
        specialDates:
          Object.keys(form.config?.specialDates || {}).length > 0
            ? form.config.specialDates
            : form.fromDate
              ? {
                  [form.fromDate]: [],
                }
              : {},
      };
    }

    return payload;
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.zone) nextErrors.zone = "Zone is required";
    if (!form.subZoneId) nextErrors.subZoneId = "Sub Zone is required";
    if (!form.ruleType) nextErrors.ruleType = "Rule Type is required";

    if (form.ruleType === "WEEKLY") {
      if (!Array.isArray(form.daysOfWeek) || form.daysOfWeek.length === 0) {
        nextErrors.daysOfWeek = "Select at least one day";
      } else {
        const weeklyConfig = form.config?.weekly || {};
        const missingWeeklyDays = form.daysOfWeek.filter((dayKey) => {
          const slots = Array.isArray(weeklyConfig[dayKey]) ? weeklyConfig[dayKey] : [];
          return !slots.some((slot) => slot?.startTime && slot?.endTime && String(slot?.maxBookings ?? "").trim() !== "");
        });

        if (missingWeeklyDays.length > 0) {
          nextErrors.weeklyConfig = "Add at least one complete time slot for each selected weekday";
        }
      }
    }

    if (form.ruleType === "SPECIAL_DATE") {
      if (!form.fromDate) nextErrors.fromDate = "From Date is required";
      if (!form.toDate) nextErrors.toDate = "To Date is required";
      if (form.fromDate && form.toDate) {
        const from = new Date(`${form.fromDate}T00:00:00`);
        const to = new Date(`${form.toDate}T00:00:00`);
        const diffDays = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
          nextErrors.fromDate = nextErrors.fromDate || "Invalid date selected";
          nextErrors.toDate = nextErrors.toDate || "Invalid date selected";
        } else if (diffDays < 1) {
          nextErrors.toDate = "To Date must be on or after From Date";
        } 
        // else if (diffDays > 7) {
        //   nextErrors.toDate = "Special Date range must be 7 days or less";
        // }
      }

      const rangeDates = getDateRangeValues(form.fromDate, form.toDate);
      const specialDatesConfig = form.config?.specialDates || {};
      const missingSlotDates = rangeDates.filter((dateKey) => {
        const slots = Array.isArray(specialDatesConfig[dateKey]) ? specialDatesConfig[dateKey] : [];
        return !slots.some((slot) => slot?.startTime && slot?.endTime && String(slot?.maxBookings ?? "").trim() !== "");
      });

      if (rangeDates.length > 0 && missingSlotDates.length > 0) {
        nextErrors.specialDates = "Add at least one complete time slot for each selected special date";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!validateForm()) return;

      const payload = buildPayload();
      const endpoint = mode === "edit" && resolvedInitialValues?.id
        ? `${API_ROUTES.UPDATE_ADMIN_PARCEL_SLOT_RULES}/${resolvedInitialValues.id}`
        : API_ROUTES.POST_ADMIN_PARCEL_SLOT_RULES;
      const response =
        mode === "edit" && resolvedInitialValues?.id
          ? await ApiRequestUtils.update(endpoint, payload)
          : await ApiRequestUtils.post(endpoint, payload);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to save parcel slot rule");
      }

      navigate("/dashboard/finance/parcel-slot-config");
    } catch (error) {
      console.error("Failed to save parcel slot rule:", error);
    } finally {
      setLoading(false);
    }
  };

  const weeklySlots = form.config?.weekly || {};
  const specialDates = form.config?.specialDates || {};

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <Card className="overflow-hidden rounded-2xl border shadow-sm">        
          <Typography variant="h6" color="black" className="px-4 py-4 md:px-6 md:py-6">
            {mode === "edit" ? "Edit Slot Rule" : "Add New Slot Rule"}
          </Typography>
        <CardBody className="px-4 pb-4 pt-2 md:px-6 md:pb-6">
          {geoLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-gray-700">
                  Zone
                  <RequiredMark />
                </label>
                <Select
                  value={form.zone}
                  selected={() => selectedZoneLabel || "Zone"}
                  onChange={(value) => setForm((prev) => ({ ...prev, zone: value || "", subZoneId: "" }))}
                  disabled={isViewMode}
                  menuProps={{ className: "max-h-56 overflow-y-auto" }}
                >
                  {zones.map((zone) => (
                    <Option key={zone.value} value={zone.value}>
                      {zone.label}
                    </Option>
                  ))}
                </Select>
                {errors.zone ? <p className="text-xs text-red-600">{errors.zone}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-gray-700">
                  Sub Zone
                  <RequiredMark />
                </label>
                <Select
                  value={form.subZoneId}
                  selected={() => selectedSubZoneLabel || "Sub Zone"}
                  onChange={(value) => setForm((prev) => ({ ...prev, subZoneId: value || "" }))}
                  disabled={isViewMode}
                  menuProps={{ className: "max-h-56 overflow-y-auto" }}
                >
                  {filteredSubZones.map((subZone) => (
                    <Option key={subZone.value} value={subZone.value}>
                      {subZone.label}
                    </Option>
                  ))}
                </Select>
                {errors.subZoneId ? <p className="text-xs text-red-600">{errors.subZoneId}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-gray-700">
                  <span>Rule Type</span>
                  <RequiredMark />
                </label>
                <Select
                  value={form.ruleType}
                  selected={() => selectedRuleTypeLabel || "Rule Type"}
                  onChange={(value) => setRuleType(value || "WEEKLY")}
                  disabled={mode !== "add"}
                >
                  {RULE_TYPES.map((ruleType) => (
                    <Option key={ruleType.value} value={ruleType.value}>
                      {ruleType.label}
                    </Option>
                  ))}
                </Select>
                {errors.ruleType ? <p className="text-xs text-red-600">{errors.ruleType}</p> : null}
              </div>

              <div className="flex items-center gap-3 md:pt-8">
                <Switch
                  checked={Boolean(form.isActive)}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  label={form.isActive ? "Active" : "Inactive"}
                  disabled={isViewMode}
                />
              </div>

              {form.ruleType === "WEEKLY" ? (
                <div className="lg:col-span-2">
                  <DaysOfWeekSelector
                    value={form.daysOfWeek}
                    error={errors.daysOfWeek}
                    onChange={(daysOfWeek) => setForm((prev) => ({ ...prev, daysOfWeek }))}
                    disabled={isViewMode}
                  />
                </div>
              ) : null}

              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-medium text-blue-gray-700">Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  disabled={isViewMode}
                />
              </div>

              {form.ruleType === "WEEKLY" && Array.isArray(form.daysOfWeek) && form.daysOfWeek.length > 0 ? (
                <div className="lg:col-span-2">
                  <WeeklyConfig
                    weeklySlots={weeklySlots}
                    selectedDays={form.daysOfWeek}
                    errors={errors}
                    onAddSlot={addSlot}
                    onRemoveSlot={removeSlot}
                    onUpdateSlot={updateSlot}
                    disabled={isViewMode}
                  />
                </div>
              ) : form.ruleType === "SPECIAL_DATE" ? (
                <div className="md:col-span-2 rounded-xl border p-3 sm:p-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Typography variant="h6">
                      Special Date Config
                      <RequiredMark />
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={form.fromDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, fromDate: event.target.value }))}
                        disabled={isViewMode}
                        label={
                          <span>
                            From Date
                            <RequiredMark />
                          </span>
                        }
                      />
                      {errors.fromDate ? <p className="text-xs text-red-600">{errors.fromDate}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={form.toDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, toDate: event.target.value }))}
                        disabled={isViewMode}
                        label={
                          <span>
                            To Date
                            <RequiredMark />
                          </span>
                        }
                      />
                      {errors.toDate ? <p className="text-xs text-red-600">{errors.toDate}</p> : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-4">
                    {errors.specialDates ? (
                      <Typography variant="small" className="text-red-600">
                        {errors.specialDates}
                      </Typography>
                    ) : null}

                    {Object.keys(specialDates).length === 0 ? (
                      <Typography variant="small" className="font-medium text-black">
                        Select from and to dates to generate the special date days
                      </Typography>
                    ) : (
                      Object.entries(specialDates).map(([dateKey, slots]) => (
                        <div key={dateKey} className="rounded-lg border p-3 sm:p-4">
                          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <Typography variant="small" className="font-semibold">
                              {dateKey}
                            </Typography>
                            <Button
                              type="button"
                              size="sm"
                              className="w-full md:w-auto bg-green-600 text-white hover:bg-green-700"
                              onClick={() => addSlot("specialDates", dateKey)}
                              disabled={isViewMode}
                            >
                              Add Slot
                            </Button>
                          </div>
                          <div className="flex flex-col gap-3">
                            {Array.isArray(slots) && slots.length > 0 ? (
                              slots.map((slot, index) => (
                                <div key={`${dateKey}-${index}`} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                  <Input
                                    type="time"
                                    value={slot.startTime || ""}
                                    onChange={(event) => updateSlot("specialDates", dateKey, index, "startTime", event.target.value)}
                                    disabled={isViewMode}
                                    label="Start Time"
                                  />
                                  <Input
                                    type="time"
                                    value={slot.endTime || ""}
                                    onChange={(event) => updateSlot("specialDates", dateKey, index, "endTime", event.target.value)}
                                    disabled={isViewMode}
                                    label="End Time"
                                  />
                                  <Input
                                    type="number"
                                    value={slot.maxBookings || ""}
                                    onChange={(event) => updateSlot("specialDates", dateKey, index, "maxBookings", event.target.value)}
                                    disabled={isViewMode}
                                    label="Max Bookings"
                                  />
                                  <Button
                                    type="button"
                                    className="w-full md:col-span-2 xl:col-span-1 bg-red-600 text-white hover:bg-red-700"
                                    onClick={() => removeSlot("specialDates", dateKey, index)}
                                    disabled={isViewMode}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <Typography variant="small" className="text-blue-gray-600">
                                No slots added for this date
                              </Typography>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              <div className="md:col-span-2 flex flex-col-reverse gap-3 md:flex-row md:justify-center">
                <Button
                  type="button"
                  className={`w-full md:w-auto ${ColorStyles.backButton}`}
                  onClick={() => navigate("/dashboard/finance/parcel-slot-config")}
                >
                  Back
                </Button>
                {isViewMode ? (
                  <Button
                    type="button"
                    className={`w-full md:w-auto ${ColorStyles.editButton}`}
                    onClick={() => {
                      const id = resolvedInitialValues?.id || initialValues?.id;
                      if (id) {
                        navigate(`/dashboard/finance/parcel-slot-config/edit/${id}`, {
                          state: { slotRule: resolvedInitialValues },
                        });
                      }
                    }}
                  >
                    Edit Slot Rule
                  </Button>
                ) : (
                  <Button type="submit" className={`w-full md:w-auto ${ColorStyles.editButton}`} disabled={loading}>
                    {loading ? "Saving..." : submitLabel || (mode === "edit" ? "Update Slot Rule" : "Create Slot Rule")}
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default SlotRuleForm;
