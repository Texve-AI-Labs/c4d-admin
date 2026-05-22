import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import MasterPriceLogParcel from "./MasterPriceLogParcel";
import ParcelMasterPriceForm from "./parcelMasterPrice/ParcelMasterPriceForm";
import { createInitialParcelForm } from "./parcelMasterPrice/defaults";
import { mapApiToParcelForm } from "./parcelMasterPrice/mapper";
import DemandPriceEdit from "./DemandPriceEdit";

export default function ParcelMasterPriceTableEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialForm, setInitialForm] = useState(createInitialParcelForm());
  const [demandRules, setDemandRules] = useState([]);

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

  useEffect(() => {
    if (!id) return;

    const fetchPriceDetails = async () => {
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.PARCEL_PACKAGE_BY_ID}/${id}`);
        if (response?.success && response?.data) {
          setInitialForm(mapApiToParcelForm(response.data));
          setDemandRules(response.data.demandRules || []);
        }
      } catch (fetchErr) {
        console.error("Fetch error:", fetchErr);
      }
    };

    fetchPriceDetails();
  }, [id]);

  const handleSubmit = async (payload) => {
    setError("");
    try {
      setSaving(true);
      const reqBody = { packageId: Number(id), ...payload, demandRules };

      let response = await ApiRequestUtils.post(API_ROUTES.PARCEL_PRICE_EDIT, reqBody);
      if (!response?.success) {
        response = await ApiRequestUtils.update(API_ROUTES.PARCEL_PRICE_EDIT, reqBody);
      }

      if (response?.success) {
        navigate("/dashboard/finance/master-price");
      } else {
        setError(response?.message || "Update failed");
      }
    } catch (saveErr) {
      console.error("Save error:", saveErr);
      setError("Network or server error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ParcelMasterPriceForm
        title="Edit Parcel Master Price"
        initialForm={initialForm}
        serviceAreas={serviceAreas}
        zones={zones}
        disableZoneAndVehicleType
        saving={saving}
        submitLabel="Update Parcel Price"
        errorMessage={error}
        onSubmit={handleSubmit}
        onBack={() => navigate("/dashboard/finance/master-price")}
      />
      <div className="px-4 pb-4">
        <DemandPriceEdit demandRules={demandRules} setDemandRules={setDemandRules} />
      </div>

      <div className="px-4">
        <MasterPriceLogParcel id={id} />
      </div>
    </>
  );
}
