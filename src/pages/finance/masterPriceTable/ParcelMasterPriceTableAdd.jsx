import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import ParcelMasterPriceForm from "./parcelMasterPrice/ParcelMasterPriceForm";
import { createInitialParcelForm } from "./parcelMasterPrice/defaults";
import MasterPriceErrorModal from '@/components/masterPrice/MasterPriceErrorModal';
import { getMasterPriceErrorMessage } from '@/components/masterPrice/masterPriceError';

export default function ParcelMasterPriceTableAdd() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledZone = location?.state?.zone || "";
  const prefilledParcelVehicleType = location?.state?.parcelVehicleType || "BIKE";
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const initialForm = useMemo(
    () =>
      createInitialParcelForm({
        zone: prefilledZone,
        parcelVehicleType: prefilledParcelVehicleType,
      }),
    [prefilledZone, prefilledParcelVehicleType]
  );

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const [areaResp, zoneResp] = await Promise.all([
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" }),
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Zone" }),
        ]);

        const allAreas = Array.isArray(areaResp?.data) ? areaResp.data : [];
        const allZones = Array.isArray(zoneResp?.data) ? zoneResp.data : [];

        setServiceAreas(allAreas.filter((item) => item.type === "Service Area"));
        setZones(allZones.filter((item) => item.type === "Zone" && item.description === "Zone"));
      } catch (fetchErr) {
        console.error("Failed to fetch geo data", fetchErr);
      }
    };

    fetchGeoData();
  }, []);

  const handleSubmit = async (payload) => {
    // console.log("FADADAAF",payload)
    setError("");
    try {
      setSaving(true);
      const response = await ApiRequestUtils.post(API_ROUTES.ADD_PARCEL_PRICE, payload, 0, { suppressAlert: true });
      if (response?.success) {
        navigate("/dashboard/finance/master-price");
      } else {
        setError(getMasterPriceErrorMessage(response));
      }
    } catch (saveErr) {
      console.error("Add parcel price failed", saveErr);
      setError(getMasterPriceErrorMessage(saveErr));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white">
      <MasterPriceErrorModal message={error} onClose={() => setError("")} />
    <ParcelMasterPriceForm
      title="Add Parcel Master Price"
      initialForm={initialForm}
      serviceAreas={serviceAreas}
      zones={zones}
      saving={saving}
      submitLabel="Save Parcel Price"
      errorMessage=""
      onSubmit={handleSubmit}
      onBack={() => navigate("/dashboard/finance/master-price")}
    />
    </div>
  );
}
