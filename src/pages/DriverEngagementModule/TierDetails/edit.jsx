import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { normalizeTierRows } from "./shared/tierApi";
import { extractApiErrorMessage, showTierErrorAlert } from "./shared/tierErrorAlert";
import CommonFieldsSection from "./shared/CommonFieldsSection";
import TierRulesSection from "./tier-rules/TierRulesSection";
import IncentiveRulesSection from "./incentive-rules/IncentiveRulesSection";
import DispatchRulesSection from "./dispatch-rules/DispatchRulesSection";
import OnlineHoursRulesSection from "./online-hours-rules/OnlineHoursRulesSection";
import ServiceTripRulesSection from "./service-trip-rules/ServiceTripRulesSection";

const sanitizeDispatchConfigByZone = (config, zone) => {
  const normalizedZone = zone || "ALL";
  if (!config || typeof config !== "object") return config;
  const unlockRules = config?.unlockRules;
  if (!unlockRules || typeof unlockRules !== "object") return config;

  const normalizeTierRules = (tierRules) =>
    (Array.isArray(tierRules) ? tierRules : []).map((rule) => {
      const currentAllowedZones = Array.isArray(rule?.allowedZones) ? rule.allowedZones : [];
      return {
        ...rule,
        allowedZones:
          normalizedZone === "ALL"
            ? currentAllowedZones.filter((zoneName) => zoneName && zoneName !== "ALL")
            : [normalizedZone],
      };
    });

  return {
    ...config,
    unlockRules: {
      ...unlockRules,
      SILVER: normalizeTierRules(unlockRules.SILVER),
      GOLD: normalizeTierRules(unlockRules.GOLD),
      ELITE: normalizeTierRules(unlockRules.ELITE),
    },
  };
};

const SECTION_REGISTRY = {
  TIER_RULES: TierRulesSection,
  INCENTIVE_RULES: IncentiveRulesSection,
  ONLINE_HOURS_RULES: OnlineHoursRulesSection,
  SERVICE_TRIP_RULES: ServiceTripRulesSection,
  DISPATCH_RULES: DispatchRulesSection,
};

const formatTypeLabel = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function TierDetailsEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [serviceAreas, setServiceAreas] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTier, setIsLoadingTier] = useState(true);
  const [rowData, setRowData] = useState(location.state?.tier || null);
  const typeBuilderRef = useRef(() => ({}));
  const [form, setForm] = useState({
    type: "",
    partnerType: "CAB",
    parcelVehicleType: "BIKE",
    name: "",
    description: "",
    isActive: true,
    zone: "ALL",
  });

  useEffect(() => {
    const fetchTierDetails = async () => {
      if (rowData) {
        setForm({
          type: rowData.type || "TIER_RULES",
          partnerType: rowData?.config?.scope?.partnerType || "CAB",
          parcelVehicleType:
            rowData?.config?.scope?.parcelVehicleType ||
            rowData?.config?.scope?.vehicleType ||
            "BIKE",
          name: rowData.name || "",
          description: rowData.description || "",
          isActive: typeof rowData.isActive === "boolean" ? rowData.isActive : true,
          zone: rowData?.config?.scope?.zone || "ALL",
        });
        setIsLoadingTier(false);
      } else {
        setIsLoadingTier(true);
      }

      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.LIST_DE_TIER, {});
        const rows = normalizeTierRows(response?.data || []);
        const selected = rows.find((row) => String(row.id) === String(id));
        const raw = selected?.raw || null;
        setRowData(raw);

        if (raw) {
          setForm({
            type: raw.type || "TIER_RULES",
            partnerType: raw?.config?.scope?.partnerType || "CAB",
            parcelVehicleType:
              raw?.config?.scope?.parcelVehicleType ||
              raw?.config?.scope?.vehicleType ||
              "BIKE",
            name: raw.name || "",
            description: raw.description || "",
            isActive: typeof raw.isActive === "boolean" ? raw.isActive : true,
            zone: raw?.config?.scope?.zone || "ALL",
          });
        }
      } catch (error) {
        console.error("Failed to fetch tier details:", error);
      } finally {
        setIsLoadingTier(false);
      }
    };

    fetchTierDetails();
  }, [id]);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
        const areas = Array.isArray(response?.data) ? response.data : [];
        setServiceAreas(areas.filter((area) => area?.type === "Service Area"));
      } catch (error) {
        console.error("Error fetching GEO_MARKINGS_LIST:", error);
      }
    };
    fetchGeoData();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!rowData) {
      showTierErrorAlert("Tier not found");
      return;
    }

    if (!form.name?.trim()) {
      showTierErrorAlert("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const parsedSettingId = Number(rowData?.settingId || rowData?.SettingId ||rowData?.id);
      if (!Number.isFinite(parsedSettingId) || parsedSettingId <= 0) {
        throw new Error("Invalid settingId");
      }

      const existingConfig = rowData?.config || {};
      const existingScope = existingConfig?.scope || {};
      const builtConfig = (typeBuilderRef.current && typeBuilderRef.current()) || {};
      const mergedConfig = { ...existingConfig, ...builtConfig };
      const normalizedConfig =
        form.type === "DISPATCH_RULES"
          ? sanitizeDispatchConfigByZone(mergedConfig, form.zone)
          : mergedConfig;

      const payload = {
        settingId: parsedSettingId,
        serviceType: rowData?.serviceType || "ALL",
        type: form.type,
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        config: {
          ...normalizedConfig,
          scope: {
            partnerType: form.partnerType || existingScope.partnerType || "CAB",
            vehicleType:
              (form.partnerType || existingScope.partnerType) === "AUTO"
                ? "AUTO"
                : (form.partnerType || existingScope.partnerType) === "BIKE"
                  ? "BIKE"
                  : (form.partnerType || existingScope.partnerType) === "PARCEL"
                    ? form.parcelVehicleType || existingScope.vehicleType || "BIKE"
                : existingScope.vehicleType || "ALL",
            parcelVehicleType:
              (form.partnerType || existingScope.partnerType) === "PARCEL"
                ? form.parcelVehicleType || existingScope.parcelVehicleType || existingScope.vehicleType || "BIKE"
                : null,
            zone: form.zone || "ALL",
          },
        },
      };

      const updateRoutes = [API_ROUTES.EDIT_DE_TIER];
      let response = null;
      let lastErrorMessage = "";

      for (const route of updateRoutes) {
        try {
          const result = await ApiRequestUtils.update(route, payload, 0, { suppressAlert: true });
          response = result;
          if (result?.success) break;
          lastErrorMessage = result?.message || `Update failed for route: ${route}`;
        } catch (error) {
          lastErrorMessage = error?.message || `Update request failed for route: ${route}`;
        }
      }

      if (!response?.success) {
        throw new Error(lastErrorMessage || response?.message || "Failed to update tier");
      }

      navigate("/dashboard/driverengagement");
    } catch (error) {
      console.error("Failed to update tier:", error);
      showTierErrorAlert(extractApiErrorMessage(error, "Failed to update tier"));
    } finally {
      setIsSaving(false);
    }
  };

  const registerBuilder = (builder) => {
    typeBuilderRef.current = builder;
  };

  const ActiveSection = SECTION_REGISTRY[form.type] || TierRulesSection;

  if (isLoadingTier) {
    return (
      <div className="mt-5 mb-10 px-4">
        <Card>
          <CardBody>
            <Typography color="gray" className="text-sm font-normal">
              Loading tier...
            </Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!rowData) {
    return (
      <div className="mt-5 mb-10 px-4">
        <div className="mb-5 flex items-center justify-between">
          <Typography variant="h4" color="blue-gray">
            Edit Tier
          </Typography>
          <Link to="/dashboard/driverengagement">
            <Button variant="outlined" color="blue-gray">
              Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardBody>
            <Typography color="gray" className="text-sm font-normal">
              Tier not found.
            </Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-5 mb-10 px-4">
      <div className="mb-5 flex items-center justify-between">
        <Typography variant="h4" color="blue-gray">
          Edit Tier
        </Typography>
        <Link to="/dashboard/driverengagement">
          <Button variant="outlined" color="blue-gray">
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-5">
            <CommonFieldsSection
              form={form}
              onInputChange={(event) => {
                const { name, type, checked, value } = event.target;
                setForm((prev) => ({
                  ...prev,
                  [name]: type === "checkbox" ? checked : value,
                }));
              }}
              serviceAreas={serviceAreas}
              showParcelVehicleType
            />

            <div className="flex items-center">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-blue-gray-300"
                />
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  Is Active
                </Typography>
              </label>
            </div>

            <ActiveSection
              registerBuilder={registerBuilder}
              serviceAreas={serviceAreas}
              selectedZone={form.zone}
              partnerType={form.partnerType}
              parcelVehicleType={form.parcelVehicleType}
              initialConfig={rowData?.config || {}}
            />

            <div>
              <Button type="submit" color="blue" disabled={isSaving}>
                {isSaving ? "Saving..." : "Update"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default TierDetailsEdit;
