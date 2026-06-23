import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Typography, Button, Spinner, Switch } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { fetchZoneOptions } from "@/pages/marketing/DriverIncentive/zoneOptions";
import { PRIORITY_OPTIONS, RATE_TYPES, SERVICE_TYPES, toForm } from "./utils";

const getPriorityLabel = (priority) =>
  PRIORITY_OPTIONS.find((item) => item.value === Number(priority))?.label || "Custom";

const DriverBonusDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(toForm(location?.state?.item || {}));
  const [zoneOptions, setZoneOptions] = useState([]);

  const rateType = String(form.rateType || "PER_KM").toUpperCase();
  const rateLabel = rateType === "FLAT_TRIP" ? "Amount" : "Per KM Rate";
  const rateValue = rateType === "FLAT_TRIP" ? form.amount : form.perKmRate;

  const selectableZones = useMemo(() => zoneOptions.filter((zone) => String(zone.value || "").trim() !== ""), [zoneOptions]);

  useEffect(() => {
    const load = async () => {
      try {
        if (location?.state?.item) {
          setForm(toForm(location.state.item));
          return;
        }
        const response = await ApiRequestUtils.get(`${API_ROUTES.DRIVER_KM_INCENTIVE_RULES}/${id}`);
        setForm(toForm(response?.data || {}));
      } catch (error) {
        console.error("Failed to load rule details:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, location.state]);

  useEffect(() => {
    const loadZones = async () => {
      const options = await fetchZoneOptions();
      const validOptions = Array.isArray(options) ? options.filter((zone) => String(zone.value || "").trim() !== "") : [];
      setZoneOptions(validOptions);
    };
    loadZones();
  }, []);

  if (loading) {
    return <div className="mt-12 flex justify-center"><Spinner className="h-10 w-10" /></div>;
  }

  if (!form?.ruleId) {
    return (
      <div className="mt-8">
        <Typography color="red">Rule not found</Typography>
        <Button className="mt-4" onClick={() => navigate("/dashboard/finance/driver-bonus/list")}>Back</Button>
      </div>
    );
  }

  const ruleId = form.ruleId;

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">Driver KM Incentive Rule Details</Typography>
        </CardHeader>
        <CardBody>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="hidden">
              <label className="mb-1 block text-sm">Rule ID</label>
              <input className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={ruleId || ""} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm">Service Type</label>
              <select className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={form.serviceType} disabled>
                {SERVICE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Zone</label>
              <select className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={form.zone} disabled>
                {selectableZones.length === 0 ? (
                  <option value={form.zone || ""}>{form.zone || "No zones available"}</option>
                ) : (
                  <>
                    {!selectableZones.find((zone) => zone.value === form.zone) && form.zone ? (
                      <option value={form.zone}>{form.zone}</option>
                    ) : null}
                    {selectableZones.map((zone) => (
                      <option key={zone.label} value={zone.value}>{zone.label}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Start Date</label>
              <input type="date" className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={form.startDate} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm">End Date</label>
              <input type="date" className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={form.endDate} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm">Rate Type</label>
              <select className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={rateType} disabled>
                {RATE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">{rateLabel}</label>
              <input type="number" className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={rateValue} disabled />
            </div>
            {rateType === "PER_KM" ? (
              <>
                <div>
                  <label className="mb-1 block text-sm">Min KM</label>
                  <input type="number" className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={form.minKm} disabled />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Max KM</label>
                  <input type="number" className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={form.maxKm} disabled />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
                KM range is not used for flat-trip rules.
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm">Priority</label>
              <select className="w-full rounded-md border border-gray-300 bg-gray-100 p-2" value={form.priority} disabled>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.label} value={priority.value}>{priority.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">{getPriorityLabel(form.priority)}</p>
            </div>
            <div className="md:col-span-2">
              <Switch label={form.isActive ? "Active" : "Inactive"} checked={form.isActive} disabled />
            </div>
          </form>

          <div className="mt-6 flex gap-2 justify-center">
            <Button color="gray" onClick={() => navigate("/dashboard/finance/driver-bonus/list")}>Back</Button>
            <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/finance/driver-bonus/edit/${ruleId}`, { state: { item: form } })}>Edit</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DriverBonusDetails;
