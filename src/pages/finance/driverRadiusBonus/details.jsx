import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Switch, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { BONUS_TYPE_OPTIONS, SERVICE_TYPE_OPTIONS, toForm } from "./utils";

const Field = ({ label, value }) => (
  <div>
    <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
    <div className="rounded-md border border-gray-300 bg-gray-50 p-2 text-sm text-gray-800">{value || "-"}</div>
  </div>
);

export default function DriverRadiusBonusDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(() => toForm({}));

  useEffect(() => {
    const load = async () => {
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.DRIVER_DISPATCH_ZONE_CONFIGS}/${id}`);
        setForm(toForm(response?.data || {}));
      } catch (error) {
        console.error("Failed to load details:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="mt-12 flex justify-center"><Spinner className="h-10 w-10" /></div>;
  }

  const serviceLabel = SERVICE_TYPE_OPTIONS.find((item) => item.value === form.serviceType)?.label || form.serviceType;
  const bonusTypeLabel = BONUS_TYPE_OPTIONS.find((item) => item.value === form.bonusType)?.label || form.bonusType;

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">Driver Radius & Bonus Configuration Details</Typography>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Zone" value={form.zone} />
            <Field label="Service Type" value={serviceLabel} />
            <Field label="First Search Radius Km" value={form.firstSearchRadiusKm} />
            <Field label="Max Search Radius Km" value={form.maxSearchRadiusKm} />
            <Field label="Radius Increment Km" value={form.radiusIncrementKm} />
            <Field label="Bonus Threshold Km" value={form.bonusThresholdKm} />
            <Field label="Bonus Type" value={bonusTypeLabel} />
            {form.bonusType === "FLAT" ? <Field label="Bonus Amount" value={form.bonusAmount} /> : null}
            {form.bonusType === "RATE" ? <Field label="Bonus Rate" value={form.bonusRate} /> : null}
            <Field label="Notes" value={form.notes} />
            <div className="md:col-span-2">
              <Switch checked={Boolean(form.isActive)} disabled label={form.isActive ? "Active" : "Inactive"} />
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outlined" onClick={() => navigate("/dashboard/finance/driver-radius-bonus")}>Back</Button>
            <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/finance/driver-radius-bonus/edit/${form.id || id}`, { state: { item: form } })}>
              Edit
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}