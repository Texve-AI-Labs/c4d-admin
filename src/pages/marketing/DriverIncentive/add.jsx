import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { createDriverIncentiveRule } from "./driverIncentiveApi";
import { fetchZoneOptions } from "./zoneOptions";
import DriverIncentiveComponentEditor from "./DriverIncentiveComponentEditor";
import { createDefaultRule, getServiceConditionDetails } from "./edit.utils";
import { PARTNER_TYPE_OPTIONS, PARCEL_VEHICLE_TYPE_OPTIONS } from "./edit.constants";

const TYPE_OPTIONS = [
  { value: "ONLINE_HOURS_RULES", label: "Online Hours Rules" },
  { value: "SERVICE_TRIP_RULES", label: "Service Trip Rules" },
];

const isOnlineHoursType = (code) => code === "ONLINE_HOURS_RULES";
const isAutoPartnerType = (partnerType = "") =>
  String(partnerType || "").trim().toUpperCase() === "AUTO";
const isBikePartnerType= (partnerType = "") => String(partnerType || "").trim().toUpperCase() === "BIKE";
const isParcelPartnerType = (partnerType = "") => String(partnerType || "").trim().toUpperCase() === "PARCEL";
const getPartnerServiceType = (partnerType = "", code = "") => {
  if (isAutoPartnerType(partnerType)) return "AUTO";
  if (isBikePartnerType(partnerType)) return "BIKE";
  return isOnlineHoursType(code) ? "ANY" : "RIDES";
};

const toApiComponentCode = (code) =>
  code === "ONLINE_HOURS_RULES" ? "ONLINE_HOURS_BONUS" : "SERVICE_TRIP_BONUS";

const toUtcIsoStringOrNull = (dateTimeLocalValue) => {
  if (!dateTimeLocalValue) {
    return null;
  }

  const parsed = new Date(dateTimeLocalValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

function DriverIncentiveAdd() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [zoneOptions, setZoneOptions] = useState([{ label: "ALL", value: "" }]);
  const [form, setForm] = useState({
    code: query.get("code") || "ONLINE_HOURS_RULES",
    partnerType: query.get("partnerType") || "CAB",
    vehicleType: isAutoPartnerType(query.get("partnerType")) ? "AUTO" : isBikePartnerType(query.get("partnerType")) ? "BIKE" : "BIKE",
    parcelVehicleType: query.get("parcelVehicleType") || "BIKE",
    zone: query.get("zone") || "ALL",
    name: "",
    description: "",
    isActive: true,
    enabled: true,
    payoutFrequency: "WEEKLY",
    validFrom: "",
    validTo: "",
  });
  const [componentRules, setComponentRules] = useState([
    {
      ...createDefaultRule(query.get("code") || "ONLINE_HOURS_RULES", query.get("partnerType") || "CAB"),
      period: "WEEKLY",
    },
  ]);

  useEffect(() => {
    const loadZones = async () => {
      const options = await fetchZoneOptions();
      setZoneOptions(options);
    };

    loadZones();
  }, []);

  const onInputChange = (name, value) => {
    setForm((prev) => {
      if (name === "partnerType") {
        const nextPartnerType = String(value || "").toUpperCase();
        setComponentRules((prevRules) =>
          prevRules.map((rule) => ({
            ...rule,
            serviceType: isParcelPartnerType(nextPartnerType)
              ? "PARCEL"
              : getPartnerServiceType(nextPartnerType, form.code),
            parcelVehicleType: isParcelPartnerType(nextPartnerType)
              ? String(prev.parcelVehicleType || "BIKE").toUpperCase()
              : undefined,
          }))
        );
        return {
          ...prev,
          partnerType: value,
          vehicleType: value === "AUTO" ? "AUTO" : value === "BIKE" ? "BIKE" : "ALL",
          parcelVehicleType: value === "PARCEL" ? prev.parcelVehicleType || "BIKE" : prev.parcelVehicleType,
        };
      }
      if (name === "parcelVehicleType") {
        setComponentRules((prevRules) =>
          prevRules.map((rule) => ({
            ...rule,
            serviceType: "PARCEL",
            parcelVehicleType: String(value || "BIKE").toUpperCase(),
          }))
        );
        return { ...prev, parcelVehicleType: value };
      }
      return { ...prev, [name]: value };
    });
  };

  const onTypeChange = (nextCode) => {
    onInputChange("code", nextCode);
    setComponentRules([
      {
        ...createDefaultRule(nextCode, form.partnerType),
        period: form.payoutFrequency || "WEEKLY",
      },
    ]);
  };

  const onPayoutFrequencyChange = (value) => {
    onInputChange("payoutFrequency", value);
    setComponentRules((prev) =>
      prev.map((rule) => ({
        ...rule,
        period: value,
      }))
    );
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.name?.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const componentCode = toApiComponentCode(form.code);
      const component = {
        code: componentCode,
        enabled: Boolean(form.enabled),
        payoutFrequency: form.payoutFrequency || "WEEKLY",
        validFrom: toUtcIsoStringOrNull(form.validFrom),
        validTo: toUtcIsoStringOrNull(form.validTo),
        rules: componentRules.map((rule) => {
          const selectedServiceType = isParcelPartnerType(form.partnerType)
            ? "PARCEL"
            : isBikePartnerType(form.partnerType)
            ? "BIKE"
            : rule.serviceType || getPartnerServiceType(form.partnerType, form.code);
          const serviceDetails = isParcelPartnerType(form.partnerType)
            ? { bookingType: null, packageType: null }
            : getServiceConditionDetails(selectedServiceType);

          return {
            amount: Number(rule.amount || 0),
            condition: {
              metric: rule.metric || (isOnlineHoursType(form.code) ? "onlineHours" : "tripCount"),
              period: form.payoutFrequency || rule.period || "WEEKLY",
              serviceType: selectedServiceType,
              ...(isParcelPartnerType(form.partnerType)
                ? { parcelVehicleType: String(form.parcelVehicleType || "BIKE").toUpperCase() }
                : {}),
              ...serviceDetails,
              op: rule.op || ">=",
              value: Number(rule.value || 0),
              isMandatory: true,
            },
          };
        }),
      };

      const scope = {
        partnerType: form.partnerType || "CAB",
        vehicleType:
          form.partnerType === "PARCEL"
            ? String(form.parcelVehicleType || "BIKE").toUpperCase()
            : form.partnerType === "AUTO"
              ? "AUTO"
              : form.partnerType === "BIKE"
                ? "BIKE"
                : "ALL",
        ...(isParcelPartnerType(form.partnerType)
          ? { parcelVehicleType: String(form.parcelVehicleType || "BIKE").toUpperCase() }
          : {}),
        zone: form.zone || "ALL",
      };

      const payload = {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        type: form.code,
        config: {
          scope,
          components: [component],
        },
      };

      const response = await createDriverIncentiveRule(payload);
      if (!response?.success) {
        throw new Error(response?.message || "Failed to create incentive");
      }
      navigate("/dashboard/vendors/driver-incentive");
    } catch (apiError) {
      setError(apiError?.message || "Failed to create incentive");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-10 mt-5 px-4">
      <div className="mb-5 flex items-center justify-between">
        <Typography variant="h5" color="blue-gray" className="font-bold">
          Add Driver Incentive
        </Typography>
        <Button variant="outlined" color="blue" onClick={() => navigate("/dashboard/vendors/driver-incentive")}>
          Back
        </Button>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            {!!error && (
              <Typography color="red" className="text-sm">
                {error}
              </Typography>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                  Type
                </Typography>
                <select
                  value={form.code}
                  onChange={(event) => onTypeChange(event.target.value)}
                  className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                  Name
                </Typography>
                <input
                  value={form.name}
                  onChange={(event) => onInputChange("name", event.target.value)}
                  className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
                  placeholder="Rule Name"
                />
              </div>

              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                  Partner Type
                </Typography>
                <select
                  value={form.partnerType}
                  onChange={(event) => onInputChange("partnerType", event.target.value)}
                  className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
                >
                  {PARTNER_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {isParcelPartnerType(form.partnerType) && (
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                    Parcel Vehicle Type
                  </Typography>
                  <select
                    value={form.parcelVehicleType}
                    onChange={(event) => onInputChange("parcelVehicleType", event.target.value)}
                    className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
                  >
                    {PARCEL_VEHICLE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                  Description
                </Typography>
                <textarea
                  value={form.description}
                  onChange={(event) => onInputChange("description", event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
                  placeholder="Description"
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => onInputChange("isActive", event.target.checked)}
                    className="h-4 w-4 rounded border-blue-gray-300"
                  />
                  <Typography variant="small" color="blue-gray" className="font-semibold">
                    Is Active
                  </Typography>
                </label>
              </div>

              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                  Zone
                </Typography>
                <select
                  value={form.zone}
                  onChange={(event) => onInputChange("zone", event.target.value)}
                  className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
                >
                  {zoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label || option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DriverIncentiveComponentEditor
              form={form}
              onInputChange={onInputChange}
              onPayoutFrequencyChange={onPayoutFrequencyChange}
              componentRules={componentRules}
              setComponentRules={setComponentRules}
            />

            <Button type="submit" color="blue" disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverIncentiveAdd;
