import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { parseInputValue } from "./shared/ruleMappings";
import { extractApiErrorMessage, showTierErrorAlert } from "./shared/tierErrorAlert";
import CommonFieldsSection from "./shared/CommonFieldsSection";
import TierRulesSection from "./tier-rules/TierRulesSection";
import IncentiveRulesSection from "./incentive-rules/IncentiveRulesSection";
import DispatchRulesSection from "./dispatch-rules/DispatchRulesSection";
import OnlineHoursRulesSection from "./online-hours-rules/OnlineHoursRulesSection";
import ServiceTripRulesSection from "./service-trip-rules/ServiceTripRulesSection";

const SECTION_REGISTRY = {
  TIER_RULES: TierRulesSection,
  INCENTIVE_RULES: IncentiveRulesSection,
  ONLINE_HOURS_RULES: OnlineHoursRulesSection,
  SERVICE_TRIP_RULES: ServiceTripRulesSection,
  DISPATCH_RULES: DispatchRulesSection,
};

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

function TierDetailsAdd() {
  const location = useLocation();
  const navigate = useNavigate();
  const typeFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("type") || "TIER_RULES";
  }, [location.search]);

  const [form, setForm] = useState({
    type: typeFromQuery,
    partnerType: "CAB",
    parcelVehicleType: "BIKE",
    name: "",
    description: "",
    isActive: true,
    zone: "ALL",
  });
  const [serviceAreas, setServiceAreas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const typeBuilderRef = useRef(() => ({}));

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

  useEffect(() => {
    setForm((prev) => ({ ...prev, type: typeFromQuery || "TIER_RULES" }));
  }, [typeFromQuery]);

  const onInputChange = (event) => {
    const { name } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: parseInputValue(event),
    }));
  };

  const registerBuilder = (builder) => {
    typeBuilderRef.current = builder;
  };

  const ActiveSection = SECTION_REGISTRY[form.type] || TierRulesSection;

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.name?.trim()) {
      showTierErrorAlert("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const builtConfig = (typeBuilderRef.current && typeBuilderRef.current()) || {};
      const typeConfig =
        form.type === "DISPATCH_RULES"
          ? sanitizeDispatchConfigByZone(builtConfig, form.zone)
          : builtConfig;
      const payload = {
        type: form.type,
        name: form.name || "",
        description: form.description,
        isActive: form.isActive,
        config: {
          scope: {
            partnerType: form.partnerType || "CAB",
            vehicleType:
              form.partnerType === "AUTO"
                ? "AUTO"
                : form.partnerType === "BIKE"
                  ? "BIKE"
                  : form.partnerType === "PARCEL"
                    ? form.parcelVehicleType || "BIKE"
                    : "ALL",
            parcelVehicleType: form.partnerType === "PARCEL" ? form.parcelVehicleType || "BIKE" : null,
            zone: form.zone || "ALL",
          },
          ...typeConfig,
        },
      };

      const response = await ApiRequestUtils.post(API_ROUTES.ADD_DE_TIER, payload, 0, { suppressAlert: true });
      if (!response?.success) {
        throw new Error(response?.message || "Failed to save tier");
      }
      navigate("/dashboard/driverengagement");
    } catch (error) {
      console.error("Error saving tier:", error);
      showTierErrorAlert(extractApiErrorMessage(error, "Failed to save tier"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-5 mb-10 px-4">
      <div className="mb-5 flex items-center justify-between">
        <Typography variant="h4" color="blue-gray">
          Add Tier
        </Typography>
        <Link to="/dashboard/driverengagement">
          <Button variant="outlined" color="blue">
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-5">
            <CommonFieldsSection
              form={form}
              onInputChange={onInputChange}
              serviceAreas={serviceAreas}
              showParcelVehicleType
            />

            <ActiveSection
              registerBuilder={registerBuilder}
              serviceAreas={serviceAreas}
              selectedZone={form.zone}
              partnerType={form.partnerType}
              parcelVehicleType={form.parcelVehicleType}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={onInputChange}
                    className="h-4 w-4 rounded border-blue-gray-300"
                  />
                  <Typography variant="small" color="blue-gray" className="font-semibold">
                    Is Active
                  </Typography>
                </label>
              </div>
            </div>

            <div>
              <Button type="submit" color="blue" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default TierDetailsAdd;
