import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Typography, Button, Switch } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { fetchZoneOptions } from "@/pages/marketing/DriverIncentive/zoneOptions";
import { buildPayload, PRIORITY_OPTIONS, RATE_TYPES, SERVICE_TYPES, toForm, validationSchema } from "./utils";
const ErrorMessage = ({ error }) => (error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null);

const getToday = () => new Date().toISOString().slice(0, 10);

const DriverBonusAdd = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(
    toForm({
    serviceType: "ALL",
    zone: "",
    startDate: getToday(),
    endDate: "",
    rateType: "PER_KM",
    perKmRate: "",
    amount: "",
    minKm: "",
    maxKm: "",
    priority: "60",
    isActive: true,
  }));

  const selectableZones = useMemo(() => zoneOptions.filter((zone) => String(zone.value || "").trim() !== ""), [zoneOptions]);
  const rateType = String(form.rateType || "PER_KM").toUpperCase();

  const onChange = (key, value) => {
    setForm((prev) => {
      if (key === "rateType") {
        const nextRateType = String(value || "PER_KM").toUpperCase();
        return {
          ...prev,
          rateType: nextRateType,
          perKmRate: nextRateType === "PER_KM" ? prev.perKmRate : "",
          amount: nextRateType === "FLAT_TRIP" ? prev.amount : "",
          minKm: nextRateType === "PER_KM" ? prev.minKm : "",
          maxKm: nextRateType === "PER_KM" ? prev.maxKm : "",
        };
      }
      return { ...prev, [key]: value };
    });
  };

  useEffect(() => {
    const loadZones = async () => {
      const options = await fetchZoneOptions();
      const validOptions = Array.isArray(options) ? options.filter((zone) => String(zone.value || "").trim() !== "") : [];
      setZoneOptions(validOptions);
      setForm((prev) => {
        if (prev.zone || !validOptions.length) return prev;
        return { ...prev, zone: validOptions[0].value };
      });
    };
    loadZones();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(form, { abortEarly: false });
      setErrors({});
    } catch (validationError) {
      const nextErrors = {};
      if (validationError?.inner?.length) {
        validationError.inner.forEach((item) => {
          if (item?.path && !nextErrors[item.path]) nextErrors[item.path] = item.message;
        });
      }
      setErrors(nextErrors);
      return;
    }

    try {
      setSubmitting(true);
      const response = await ApiRequestUtils.post(API_ROUTES.DRIVER_KM_INCENTIVE_RULES, buildPayload(form));
      if (response?.success) {
        navigate("/dashboard/finance/driver-bonus/list");
        return;
      }
      window.alert(response?.message || response?.error || "Unable to create rule.");
    } catch (error) {
      console.error("Failed to create driver bonus rule:", error);
      window.alert("Something went wrong while creating the rule.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">Add Driver KM Incentive Rule</Typography>
        </CardHeader>
        <CardBody>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm">Service Type</label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={form.serviceType} onChange={(e) => onChange("serviceType", e.target.value)}>
                {SERVICE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <ErrorMessage error={errors.serviceType} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Zone</label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={form.zone} onChange={(e) => onChange("zone", e.target.value)}>
                {selectableZones.length === 0 ? (
                  <option value="">No zones available</option>
                ) : (
                  selectableZones.map((zone) => (
                    <option key={zone.label} value={zone.value}>{zone.label}</option>
                  ))
                )}
              </select>
              <ErrorMessage error={errors.zone} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Start Date</label>
              <input type="date" className="w-full rounded-md border border-gray-300 p-2" value={form.startDate} onChange={(e) => onChange("startDate", e.target.value)} />
              <ErrorMessage error={errors.startDate} />
            </div>
            <div>
              <label className="mb-1 block text-sm">End Date</label>
              <input type="date" className="w-full rounded-md border border-gray-300 p-2" value={form.endDate} onChange={(e) => onChange("endDate", e.target.value)} />
              <ErrorMessage error={errors.endDate} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Rate Type</label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={rateType} onChange={(e) => onChange("rateType", e.target.value)}>
                {RATE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <ErrorMessage error={errors.rateType} />
            </div>
            {rateType === "FLAT_TRIP" ? (
              <div>
                <label className="mb-1 block text-sm">Amount (₹)</label>
                <input type="number" step="0.01" className="w-full rounded-md border border-gray-300 p-2" value={form.amount} onChange={(e) => onChange("amount", e.target.value)} />
                <ErrorMessage error={errors.amount} />
              </div>
            ) : (
            <div>
              <label className="mb-1 block text-sm">Per KM Rate (₹)</label>
              <input type="number" step="0.01" className="w-full rounded-md border border-gray-300 p-2" value={form.perKmRate} onChange={(e) => onChange("perKmRate", e.target.value)} />
              <ErrorMessage error={errors.perKmRate} />
            </div>
            )}
            {rateType === "PER_KM" ? (
              <>
            <div>
              <label className="mb-1 block text-sm">Min KM</label>
              <input type="number" className="w-full rounded-md border border-gray-300 p-2" value={form.minKm} onChange={(e) => onChange("minKm", e.target.value)} />
              <ErrorMessage error={errors.minKm} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Max KM</label>
              <input type="number" className="w-full rounded-md border border-gray-300 p-2" value={form.maxKm} onChange={(e) => onChange("maxKm", e.target.value)} />
              <ErrorMessage error={errors.maxKm} />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
                KM range is only used for per-km rules.
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm">Priority</label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={form.priority} onChange={(e) => onChange("priority", e.target.value)}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.label} value={priority.value}>{priority.label}</option>
                ))}
              </select>
              <ErrorMessage error={errors.priority} />
            </div>
            <div className="md:col-span-2">
              <Switch label={form.isActive ? "Active" : "Inactive"} checked={form.isActive} onChange={(e) => onChange("isActive", e.target.checked)} />
            </div>
            <div className="mt-2 flex gap-2 md:col-span-2 justify-center">
              <Button type="button" color="gray" onClick={() => navigate("/dashboard/finance/driver-bonus/list")}>Cancel</Button>
              <Button type="submit" className={ColorStyles.continueButtonColor} disabled={submitting}>{submitting ? "Saving..." : "Save Rule"}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default DriverBonusAdd;