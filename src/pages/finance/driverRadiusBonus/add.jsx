import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Option, Select, Spinner, Switch, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { buildPayload, BONUS_TYPE_OPTIONS, initialValues, SERVICE_TYPE_OPTIONS, toForm, validationSchema } from "./utils";

const ErrorMessage = ({ error }) => (error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null);

export default function DriverRadiusBonusAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => toForm(initialValues));

  const bonusType = String(form.bonusType || "").toUpperCase();

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
        const items = Array.isArray(response?.data) ? response.data : [];
        setZones(items.map((item) => ({ label: item.name || item.label || "Unnamed Zone", value: item.name || item.label || "" })).filter((item) => item.value));
      } catch (error) {
        console.error("Failed to load zones:", error);
      }
    };
    loadZones();
  }, []);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate({ ...form, bonusType }, { abortEarly: false });
      setErrors({});
    } catch (validationError) {
      const nextErrors = {};
      validationError?.inner?.forEach((item) => {
        if (item?.path && !nextErrors[item.path]) nextErrors[item.path] = item.message;
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload(form);
      const response = await ApiRequestUtils.post(API_ROUTES.DRIVER_DISPATCH_ZONE_CONFIGS, payload);
      if (response?.success) {
        navigate("/dashboard/finance/driver-radius-bonus");
        return;
      }
    } catch (error) {
      console.error("Failed to create config:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">Add Driver Radius & Bonus Configuration</Typography>
        </CardHeader>
        <CardBody>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm">Zone <span className="text-red-600">*</span></label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={form.zone} onChange={(e) => onChange("zone", e.target.value)}>
                <option value="">Select Zone</option>
                {zones.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorMessage error={errors.zone} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Service Type <span className="text-red-600">*</span></label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={form.serviceType} onChange={(e) => onChange("serviceType", e.target.value)}>
                <option value="">Select Service Type</option>
                {SERVICE_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorMessage error={errors.serviceType} />
            </div>
            <div>
              <label className="mb-1 block text-sm">First Search Radius Km <span className="text-red-600">*</span></label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 p-2"
                value={form.firstSearchRadiusKm}
                onChange={(e) => onChange("firstSearchRadiusKm", e.target.value)}
              />
              <ErrorMessage error={errors.firstSearchRadiusKm} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Max Search Radius Km <span className="text-red-600">*</span></label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 p-2"
                value={form.maxSearchRadiusKm}
                onChange={(e) => onChange("maxSearchRadiusKm", e.target.value)}
              />
              <ErrorMessage error={errors.maxSearchRadiusKm} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Radius Increment Km <span className="text-red-600">*</span></label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 p-2"
                value={form.radiusIncrementKm}
                onChange={(e) => onChange("radiusIncrementKm", e.target.value)}
              />
              <ErrorMessage error={errors.radiusIncrementKm} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Bonus Threshold Km <span className="text-red-600">*</span></label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 p-2"
                value={form.bonusThresholdKm}
                onChange={(e) => onChange("bonusThresholdKm", e.target.value)}
              />
              <ErrorMessage error={errors.bonusThresholdKm} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Bonus Type <span className="text-red-600">*</span></label>
              <select className="w-full rounded-md border border-gray-300 p-2" value={bonusType} onChange={(e) => onChange("bonusType", e.target.value)}>
                <option value="">Select Bonus Type</option>
                {BONUS_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ErrorMessage error={errors.bonusType} />
            </div>
            {bonusType === "FLAT" && (
              <div>
                <label className="mb-1 block text-sm">Bonus Amount <span className="text-red-600">*</span></label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={form.bonusAmount}
                  onChange={(e) => onChange("bonusAmount", e.target.value)}
                />
                <ErrorMessage error={errors.bonusAmount} />
              </div>
            )}
            {bonusType === "RATE" && (
              <div>
                <label className="mb-1 block text-sm">Bonus Rate <span className="text-red-600">*</span></label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={form.bonusRate}
                  onChange={(e) => onChange("bonusRate", e.target.value)}
                />
                <ErrorMessage error={errors.bonusRate} />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Notes </label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-gray-300 p-2"
                value={form.notes}
                onChange={(e) => onChange("notes", e.target.value)}
                placeholder="Default Chennai ride config"
              />
            </div>
            <div className="md:col-span-2">
              <Switch checked={Boolean(form.isActive)} label={<span>Status <span className="text-red-600">*</span></span>} onChange={(e) => onChange("isActive", e.target.checked)} />
            </div>
            <div className="md:col-span-2 flex justify-center gap-3">
              <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/finance/driver-radius-bonus")}>Cancel</Button>
              <Button type="submit" className={ColorStyles.continueButtonColor} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}