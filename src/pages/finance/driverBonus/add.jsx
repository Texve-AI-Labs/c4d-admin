import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Typography, Button, Switch } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { fetchZoneOptions } from "@/pages/marketing/DriverIncentive/zoneOptions";

const SERVICE_TYPES = ["ALL", "DRIVER", "RENTAL", "RIDES", "AUTO", "PARCEL"];
const PRIORITY_OPTIONS = [
  { label: "High", value: 30 },
  { label: "Medium", value: 60 },
  { label: "Low", value: 90 },
];
const validationSchema = Yup.object({
  serviceType: Yup.string().oneOf(SERVICE_TYPES).required("Service Type is required"),
  zone: Yup.string().trim().required("Zone is required"),
  startDate: Yup.string().required("Start Date is required"),
  endDate: Yup.string()
    .required("End Date is required")
    .test("end-after-start", "End Date must be on or after Start Date", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
  perKmRate: Yup.number().typeError("Per KM Rate must be a number").min(0, "Per KM Rate must be >= 0").required("Per KM Rate is required"),
  minKm: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .typeError("Min KM must be a number")
    .min(0, "Min KM must be >= 0")
    .nullable(),
  maxKm: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .typeError("Max KM must be a number")
    .min(0, "Max KM must be >= 0")
    .test("max-gte-min", "Max KM must be greater than or equal to Min KM", function (value) {
      const { minKm } = this.parent;
      if (value === "" || value === null || value === undefined) return true;
      if (minKm === "" || minKm === null || minKm === undefined) return true;
      return Number(value) >= Number(minKm);
    })
    .nullable(),
  priority: Yup.number().oneOf(PRIORITY_OPTIONS.map((item) => item.value), "Invalid priority").required("Priority is required"),
});
const ErrorMessage = ({ error }) => (error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null);

const getToday = () => new Date().toISOString().slice(0, 10);

const DriverBonusAdd = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    serviceType: "ALL",
    zone: "",
    startDate: getToday(),
    endDate: "",
    perKmRate: "",
    minKm: "",
    maxKm: "",
    priority: "60",
    isActive: true,
  });

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const selectableZones = useMemo(() => zoneOptions.filter((zone) => String(zone.value || "").trim() !== ""), [zoneOptions]);

  useEffect(() => {
    const loadZones = async () => {
      const options = await fetchZoneOptions();
      const validOptions = Array.isArray(options) ? options.filter((zone) => String(zone.value || "").trim() !== "") : [];
      setZoneOptions(validOptions);
      if (!form.zone && validOptions.length) {
        setForm((prev) => ({ ...prev, zone: validOptions[0].value }));
      }
    };
    loadZones();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(
        {
          ...form,
          perKmRate: form.perKmRate === "" ? "" : Number(form.perKmRate),
          minKm: form.minKm === "" ? "" : Number(form.minKm),
          maxKm: form.maxKm === "" ? "" : Number(form.maxKm),
          priority: form.priority === "" ? "" : Number(form.priority),
        },
        { abortEarly: false }
      );
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
      const payload = {
        serviceType: String(form.serviceType).toUpperCase(),
        zone: String(form.zone).trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        perKmRate: Number(form.perKmRate),
        minKm: form.minKm === "" ? null : Number(form.minKm),
        maxKm: form.maxKm === "" ? null : Number(form.maxKm),
        priority: form.priority === "" ? 60 : Number(form.priority),
        isActive: Boolean(form.isActive),
      };

      const response = await ApiRequestUtils.post(API_ROUTES.DRIVER_KM_INCENTIVE_RULES, payload);
      if (response?.success) {
        navigate("/dashboard/finance/driver-bonus/list");
      }
    } catch (error) {
      console.error("Failed to create driver bonus rule:", error);
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
              <label className="mb-1 block text-sm">Per KM Rate (₹)</label>
              <input type="number" step="0.01" className="w-full rounded-md border border-gray-300 p-2" value={form.perKmRate} onChange={(e) => onChange("perKmRate", e.target.value)} />
              <ErrorMessage error={errors.perKmRate} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Priority</label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={form.priority} onChange={(e) => onChange("priority", e.target.value)}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.label} value={priority.value}>{priority.label}
                    {/* ({priority.value}) */}
                  </option>
                ))}
              </select>
              <ErrorMessage error={errors.priority} />
            </div>
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
