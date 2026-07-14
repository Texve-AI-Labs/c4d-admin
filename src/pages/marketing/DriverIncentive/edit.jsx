import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import {
  fetchDriverIncentiveList,
  updateDriverIncentiveComponent,
  updateDriverIncentiveStatus,
} from "./driverIncentiveApi";
import { fetchZoneOptions } from "./zoneOptions";
import DriverIncentiveComponentEditor from "./DriverIncentiveComponentEditor";
import { createDefaultRule, createEditableRule, getServiceConditionDetails, getTargetComponent } from "./edit.utils";

const toTypeCode = (code = "") =>
  code === "ONLINE_HOURS_BONUS"
    ? "ONLINE_HOURS_RULES"
    : code === "SERVICE_TRIP_BONUS"
      ? "SERVICE_TRIP_RULES"
      : code;

const isAutoPartnerType = (partnerType = "") =>
  String(partnerType || "").trim().toUpperCase() === "AUTO";

const isBikePartnerType = (partnerType = "") => String(partnerType || "").trim().toUpperCase() === "BIKE";
const getPartnerServiceType = (partnerType = "", code = "") => {
  if (isAutoPartnerType(partnerType)) return "AUTO";
  if (isBikePartnerType(partnerType)) return "BIKE";
  return code === "ONLINE_HOURS_BONUS" ? "ANY" : "RIDES";
};
const toUtcIsoStringOrNull = (dateTimeLocalValue) => {
  if (!dateTimeLocalValue) {
    return null;
  }

  const parsed = new Date(dateTimeLocalValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const toDateTimeLocalValue = (rawValue) => {
  if (!rawValue) {
    return "";
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function DriverIncentiveEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedCode = useMemo(
    () => new URLSearchParams(location.search).get("code") || "",
    [location.search]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rowData, setRowData] = useState(null);
  const [zoneOptions, setZoneOptions] = useState([{ label: "ALL", value: "" }]);
  const [componentRules, setComponentRules] = useState([]);
  const [form, setForm] = useState({
    type: "",
    name: "",
    description: "",
    isActive: true,
    partnerType: "CAB",
    vehicleType: "ALL",
    zone: "",
    code: "",
    enabled: true,
    payoutFrequency: "WEEKLY",
    validFrom: "",
    validTo: "",
  });

  useEffect(() => {
    const loadZones = async () => {
      const options = await fetchZoneOptions();
      setZoneOptions(options);
    };

    loadZones();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const stateRow = location.state?.row || {};
        const requestedPartnerType =
          stateRow?.scope?.partnerType ||
          stateRow?.config?.scope?.partnerType ||
          "CAB";
        const stateCode =
          stateRow?.code ||
          stateRow?.component?.code ||
          (Array.isArray(stateRow?.components) ? stateRow.components?.[0]?.code : "");
        const requestCode = selectedCode || stateCode || "ONLINE_HOURS_BONUS";
        const response = await fetchDriverIncentiveList({
          settingId: id,
          code: requestCode,
          partnerType: requestedPartnerType,
        });
        const rows = Array.isArray(response?.rows)
          ? response.rows
          : Array.isArray(response?.data)
            ? response.data
            : response?.data && typeof response.data === "object"
              ? [response.data]
              : [];
        const fromState = stateRow && Object.keys(stateRow).length ? stateRow : null;
        const selectedRow =
          rows.find((item) => String(item?.settingId || item?.id) === String(id)) || fromState;
        if (!selectedRow) {
          throw new Error("Incentive record not found");
        }

        const scope = selectedRow?.scope || selectedRow?.config?.scope || {};
        const component = getTargetComponent(selectedRow, selectedCode);
        if (!component) {
          throw new Error("Component not found for this record");
        }

        setRowData(selectedRow);
        const resolvedPayoutFrequency =
          component?.payoutFrequency ||
          component?.rules?.[0]?.condition?.period ||
          "WEEKLY";

        setForm({
          type: toTypeCode(component?.code || selectedCode || ""),
          name: selectedRow?.name || "",
          description: selectedRow?.description || "",
          isActive: typeof selectedRow?.isActive === "boolean" ? selectedRow.isActive : true,
          partnerType: scope?.partnerType || "CAB",
          vehicleType:
            (scope?.partnerType || "CAB") === "AUTO"
              ? "AUTO"
              : (scope?.partnerType || "BIKE") === "BIKE"
                ? "BIKE"
              : scope?.vehicleType || "ALL",
          zone: scope?.zone || "",
          code: component?.code || selectedCode || "",
          enabled: typeof component?.enabled === "boolean" ? component.enabled : true,
          payoutFrequency: resolvedPayoutFrequency,
          validFrom: toDateTimeLocalValue(component?.validFrom),
          validTo: toDateTimeLocalValue(component?.validTo),
        });
        setComponentRules(
          Array.isArray(component?.rules) && component.rules.length > 0
            ? component.rules.map((rule) => ({
              ...createEditableRule(rule, component?.code || selectedCode || "", scope?.partnerType || "CAB"),
              serviceType:
                isBikePartnerType(scope?.partnerType) || isBikePartnerType(selectedRow?.scope?.partnerType)
                  ? "BIKE"
                  : createEditableRule(rule, component?.code || selectedCode || "", scope?.partnerType || "CAB").serviceType,
              period: resolvedPayoutFrequency,
            }))
            : [{
              ...createDefaultRule(component?.code || selectedCode || "", scope?.partnerType || "CAB"),
              period: resolvedPayoutFrequency,
            }]
        );
      } catch (apiError) {
        setError(apiError?.message || "Failed to load incentive record");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, location.state, selectedCode]);

  const onInputChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
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

    const existingComponent = getTargetComponent(rowData, form.code);
    if (!existingComponent) {
      setError("Component not found for update");
      return;
    }

    const nextComponent = {
      ...existingComponent,
      enabled: Boolean(form.enabled),
      validFrom: toUtcIsoStringOrNull(form.validFrom),
      validTo: toUtcIsoStringOrNull(form.validTo),
    };
    delete nextComponent.applyMode;

    if (nextComponent.code === "ONLINE_HOURS_BONUS" || nextComponent.code === "SERVICE_TRIP_BONUS") {
      nextComponent.payoutFrequency = form.payoutFrequency || "WEEKLY";
      nextComponent.rules = componentRules.map((rule) => {
        const selectedServiceType = isBikePartnerType(form.partnerType)
          ? "BIKE"
          : rule.serviceType || getPartnerServiceType(form.partnerType, nextComponent.code);
        const serviceDetails = getServiceConditionDetails(selectedServiceType);

        return {
          amount: Number(rule.amount || 0),
          condition: {
            metric: rule.metric || (nextComponent.code === "ONLINE_HOURS_BONUS" ? "onlineHours" : "tripCount"),
            period: form.payoutFrequency || rule.period || "WEEKLY",
            serviceType: selectedServiceType,
            ...serviceDetails,
            op: rule.op || ">=",
            value: Number(rule.value || 0),
            isMandatory: true,
          },
        };
      });
    }

    setSaving(true);
    setError("");
    try {
      const parsedSettingId = Number(rowData?.settingId || rowData?.id);
      if (!Number.isFinite(parsedSettingId) || parsedSettingId <= 0) {
        throw new Error("Missing settingId");
      }

      const statusResponse = await updateDriverIncentiveStatus({
        settingId: parsedSettingId,
        code: form.code,
        enabled: Boolean(form.enabled),
        scope: {
          partnerType: form.partnerType || "CAB",
          vehicleType: (form.partnerType || "CAB") === "AUTO" ? "AUTO" : (form.partnerType || "CAB") === "BIKE" ? "BIKE" : form.vehicleType || "ALL",
          zone: form.zone || "",
        },
      });
      if (!statusResponse?.success) {
        throw new Error(statusResponse?.message || "Failed to update incentive status");
      }

      const response = await updateDriverIncentiveComponent({
        settingId: parsedSettingId,
        name: form.name,
        type: form.type,
        description: form.description,
        isActive: Boolean(form.isActive),
        scope: {
          partnerType: form.partnerType || "CAB",
          vehicleType: (form.partnerType || "CAB") === "AUTO" ? "AUTO" : (form.partnerType || "CAB") === "BIKE" ? "BIKE" : form.vehicleType || "ALL",
          zone: form.zone || "",
        },
        component: nextComponent,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update incentive component");
      }

      navigate("/dashboard/vendors/driver-incentive");
    } catch (apiError) {
      setError(apiError?.message || "Failed to update incentive component");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-10 mt-5 px-4">
        <Card>
          <CardBody>
            <Typography color="gray" className="text-sm">
              Loading incentive record...
            </Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-10 mt-5 px-4 bg-white">
      <div className="mb-5 flex items-center justify-between">
        <Typography variant="h5" color="blue-gray" className="font-bold">
          Edit Driver Incentive
        </Typography>
        <Button variant="outlined" color="blue" onClick={() => navigate("/dashboard/vendors/driver-incentive")}>
          Back
        </Button>
      </div>
      <Card>
        <CardBody className="p-0">
          <form onSubmit={onSubmit} className="space-y-5">
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
                <input
                  value={form.type || ""}
                  disabled
                  className="w-full rounded-md border border-blue-gray-200 bg-blue-gray-50 px-3 py-2 text-sm"
                />
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

              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                  Partner Type
                </Typography>
                <select
                  value={form.partnerType}
                  disabled
                  className="w-full rounded-md border border-blue-gray-200 bg-blue-gray-50 px-3 py-2 text-sm"
                >
                  <option value="CAB">Cab</option>
                  <option value="AUTO">Auto</option>
                  <option value="BIKE">Bike</option>
                </select>
              </div>

              <div className="md:col-span-2">
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
            </div>

            <DriverIncentiveComponentEditor
              form={form}
              onInputChange={onInputChange}
              onPayoutFrequencyChange={onPayoutFrequencyChange}
              componentRules={componentRules}
              setComponentRules={setComponentRules}
            />
            <div className="">
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

            <Button type="submit" color="blue" disabled={saving}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverIncentiveEdit;
