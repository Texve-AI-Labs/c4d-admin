import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
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
import { EMPTY_INITIAL_VALUES, RULE_TYPES } from "./constants";
import DaysOfWeekSelector from "./DaysOfWeekSelector";

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();
const emptySlot = () => ({ startTime: "", endTime: "", maxBookings: "" });

const fetchActingDriverGeoOptions = async () => {
  const areaResp = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
  const filteredAreas = Array.isArray(areaResp?.data) ? areaResp.data : [];

  return filteredAreas
    .map((area) => ({
      id: String(area.id ?? area._id ?? ""),
      label: area.name || area.label || "Unnamed Zone",
      value: area.name || area.label || "",
      raw: area,
    }))
    .filter((item) => normalizeText(item.value));
};

const readText = (value) => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
};

const resolveZoneValue = (value) =>
  readText(value?.zone || value?.zoneName || value?.name || value?.label || value?.serviceArea || value);

const normalizeSlots = (config = {}) => (Array.isArray(config?.slots) ? config.slots : []);

const buildInitialForm = (initialValues = {}) => ({
  zoneId: initialValues.zoneId || "",
  zone: resolveZoneValue(initialValues.zone || initialValues),
  ruleType: initialValues.ruleType || "WEEKLY",
  daysOfWeek: Array.isArray(initialValues.daysOfWeek) ? initialValues.daysOfWeek : [],
  fromDate: initialValues.fromDate || "",
  toDate: initialValues.toDate || "",
  priority: initialValues.priority ?? (initialValues.ruleType === "SPECIAL_DATE" ? 1 : 100),
  isActive: initialValues.isActive ?? true,
  notes: initialValues.notes || "",
  config: { slots: normalizeSlots(initialValues.config) },
});

const RequiredMark = () => <span className="ml-1 text-red-500">*</span>;

function SlotRuleForm({ mode = "add", initialValues, submitLabel }) {
  const isViewMode = mode === "view";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [zones, setZones] = useState([]);
  const resolvedInitialValues = initialValues || EMPTY_INITIAL_VALUES;
  const [form, setForm] = useState(() => buildInitialForm(resolvedInitialValues));

  useEffect(() => {
    setForm(buildInitialForm(resolvedInitialValues));
  }, [resolvedInitialValues]);

  useEffect(() => {
    const loadGeo = async () => {
      setGeoLoading(true);
      try {
        setZones(await fetchActingDriverGeoOptions());
      } catch (error) {
        console.error("Failed to load geo options:", error);
        setZones([]);
      } finally {
        setGeoLoading(false);
      }
    };

    loadGeo();
  }, []);

  const selectedZoneLabel = useMemo(() => {
    const match = zones.find((item) => String(item.id) === String(form.zoneId));
    return match?.label || String(form.zone || "").toUpperCase();
  }, [form.zone, form.zoneId, zones]);

  const selectedRuleTypeLabel = useMemo(() => {
    const match = RULE_TYPES.find((item) => String(item.value) === String(form.ruleType));
    return match?.label || "";
  }, [form.ruleType]);

  const slots = Array.isArray(form.config?.slots) ? form.config.slots : [];

  const setRuleType = (ruleType) => {
    setForm((prev) => ({
      ...prev,
      ruleType,
      priority: ruleType === "SPECIAL_DATE" ? 1 : 100,
      daysOfWeek: ruleType === "WEEKLY" ? prev.daysOfWeek : [],
      fromDate: ruleType === "SPECIAL_DATE" ? prev.fromDate : "",
      toDate: ruleType === "SPECIAL_DATE" ? prev.toDate : "",
    }));
  };

  const updateSlot = (index, field, value) => {
    setForm((prev) => {
      const nextSlots = Array.isArray(prev.config?.slots) ? [...prev.config.slots] : [];
      nextSlots[index] = { ...(nextSlots[index] || emptySlot()), [field]: value };
      return { ...prev, config: { ...prev.config, slots: nextSlots } };
    });
  };

  const addSlot = () => {
    setForm((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        slots: [...(Array.isArray(prev.config?.slots) ? prev.config.slots : []), emptySlot()],
      },
    }));
  };

  const removeSlot = (index) => {
    setForm((prev) => {
      const nextSlots = Array.isArray(prev.config?.slots) ? [...prev.config.slots] : [];
      nextSlots.splice(index, 1);
      return { ...prev, config: { ...prev.config, slots: nextSlots } };
    });
  };

  const buildPayload = () => {
    const payload = {
      zone: form.zone,
      ruleType: form.ruleType,
      priority: form.ruleType === "SPECIAL_DATE" ? 1 : 100,
      isActive: Boolean(form.isActive),
      notes: form.notes || "",
      config: { slots },
    };

    if (form.ruleType === "WEEKLY") {
      payload.daysOfWeek = form.daysOfWeek;
    } else {
      payload.fromDate = form.fromDate;
      payload.toDate = form.toDate;
    }

    return payload;
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.zone) nextErrors.zone = "Zone is required";
    if (!form.ruleType) nextErrors.ruleType = "Rule Type is required";

    if (form.ruleType === "WEEKLY" && (!Array.isArray(form.daysOfWeek) || form.daysOfWeek.length === 0)) {
      nextErrors.daysOfWeek = "Select at least one day";
    }

    if (form.ruleType === "SPECIAL_DATE") {
      if (!form.fromDate) nextErrors.fromDate = "From Date is required";
      if (!form.toDate) nextErrors.toDate = "To Date is required";
      if (form.fromDate && form.toDate) {
        const from = new Date(`${form.fromDate}T00:00:00`);
        const to = new Date(`${form.toDate}T00:00:00`);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
          nextErrors.toDate = "Invalid date selected";
        } else if (from > to) {
          nextErrors.toDate = "To Date must be on or after From Date";
        }
      }
    }

    if (!slots.some((slot) => slot?.startTime && slot?.endTime && String(slot?.maxBookings ?? "").trim() !== "")) {
      nextErrors.slots = "Add at least one complete slot";
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
        ? `${API_ROUTES.UPDATE_ADMIN_ACTING_DRIVER_SLOT_RULES}/${resolvedInitialValues.id}`
        : API_ROUTES.POST_ADMIN_ACTING_DRIVER_SLOT_RULES;
      const response =
        mode === "edit" && resolvedInitialValues?.id
          ? await ApiRequestUtils.update(endpoint, payload)
          : await ApiRequestUtils.post(endpoint, payload);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to save acting driver slot rule");
      }

      navigate("/dashboard/finance/acting-driver-slot-config");
    } catch (error) {
      console.error("Failed to save acting driver slot rule:", error);
    } finally {
      setLoading(false);
    }
  };

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
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-blue-gray-700">
                  Zone
                  <RequiredMark />
                </label>
                <Select
                  value={form.zoneId}
                  selected={() => selectedZoneLabel || "Zone"}
                  onChange={(value) => {
                    const selected = zones.find((item) => String(item.id) === String(value));
                    setForm((prev) => ({ ...prev, zoneId: value || "", zone: selected?.label || "" }));
                  }}
                  disabled={isViewMode}
                  menuProps={{ className: "max-h-56 overflow-y-auto" }}
                >
                  {zones.map((zone) => (
                    <Option key={zone.id || zone.value} value={zone.id || zone.value}>
                      {zone.label}
                    </Option>
                  ))}
                </Select>
                {errors.zone ? <p className="text-xs text-red-600">{errors.zone}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-gray-700">
                  Rule Type
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
              ) : (
                <div className="md:col-span-2 rounded-xl border p-3 sm:p-4">
                  <Typography variant="h6" className="mb-4">
                    Special Date Range
                    <RequiredMark />
                  </Typography>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={form.fromDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, fromDate: event.target.value }))}
                        disabled={isViewMode}
                        label="From Date"
                      />
                      {errors.fromDate ? <p className="text-xs text-red-600">{errors.fromDate}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={form.toDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, toDate: event.target.value }))}
                        disabled={isViewMode}
                        label="To Date"
                      />
                      {errors.toDate ? <p className="text-xs text-red-600">{errors.toDate}</p> : null}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-medium text-blue-gray-700">Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  disabled={isViewMode}
                />
              </div>

              <div className="lg:col-span-2 rounded-xl border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <Typography variant="h6" className="font-medium text-black">
                    Slot Config
                    <RequiredMark />
                  </Typography>
                  <Button
                    size="sm"
                    type="button"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={addSlot}
                    disabled={isViewMode}
                  >
                    Add Slot
                  </Button>
                </div>
                {errors.slots ? <p className="mb-3 text-sm text-red-600">{errors.slots}</p> : null}
                <div className="flex flex-col gap-3">
                  {slots.length === 0 ? (
                    <Typography variant="small" className="text-blue-gray-600">
                      No slots added
                    </Typography>
                  ) : (
                    slots.map((slot, index) => (
                      <div key={index} className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                        <Input
                          type="time"
                          value={slot.startTime || ""}
                          onChange={(event) => updateSlot(index, "startTime", event.target.value)}
                          label="Start Time"
                          disabled={isViewMode}
                        />
                        <Input
                          type="time"
                          value={slot.endTime || ""}
                          onChange={(event) => updateSlot(index, "endTime", event.target.value)}
                          label="End Time"
                          disabled={isViewMode}
                        />
                        <Input
                          type="number"
                          value={slot.maxBookings || ""}
                          onChange={(event) => updateSlot(index, "maxBookings", event.target.value)}
                          label="Max Bookings"
                          disabled={isViewMode}
                        />
                        <Button
                          type="button"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => removeSlot(index)}
                          disabled={isViewMode}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col-reverse gap-3 md:flex-row md:justify-center">
                <Button
                  type="button"
                  className={`w-full md:w-auto ${ColorStyles.backButton}`}
                  onClick={() => navigate("/dashboard/finance/acting-driver-slot-config")}
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
                        navigate(`/dashboard/finance/acting-driver-slot-config/edit/${id}`, {
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
