import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import MasterPriceLogParcel from "./MasterPriceLogParcel";
import ParcelMasterPriceForm from "./parcelMasterPrice/ParcelMasterPriceForm";
import { createInitialParcelForm } from "./parcelMasterPrice/defaults";
import { mapApiToParcelForm } from "./parcelMasterPrice/mapper";
import DemandPriceTable from "./DemandPrice";

export default function ParcelMasterPriceTableDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
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

    const fetchDetails = async () => {
      setError("");
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.PARCEL_PACKAGE_BY_ID}/${id}`);
        if (response?.success && response?.data) {
          setInitialForm(mapApiToParcelForm(response.data));
          setDemandRules(response.data.demandRules || []);
        } else {
          setError(response?.message || "Failed to fetch parcel package details");
        }
      } catch (fetchErr) {
        console.error("Fetch parcel package details error:", fetchErr);
        setError("Network or server error while fetching details");
      }
    };

    fetchDetails();
  }, [id]);

  return (
    <>
      <ParcelMasterPriceForm
        title="Parcel Master Price Details"
        initialForm={initialForm}
        serviceAreas={serviceAreas}
        zones={zones}
        saving={false}
        errorMessage={error}
        readOnly
        primaryButtonLabel="Edit"
        onPrimaryButtonClick={() => navigate(`/dashboard/finance/master-price/parcel-edit/${id}`)}
        onBack={() => navigate("/dashboard/finance/master-price")}
      />
      <div className="px-4 pb-4">
        <DemandPriceTable demandRules={demandRules} />
      </div>

      <div className="px-4">
        <MasterPriceLogParcel id={id} />
      </div>
    </>
  );
}
