import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Input, Switch, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import DriverAdsZone from "@/components/driverAdsZone";
import moment from "moment";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : String(value);
};

function DriverAdsDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_BY_ID_DRIVER_ADVERISEMENT}/${id}`);
        if (response?.success) setData(response?.data || null);
        else setError(response?.message || "Failed to load advertisement.");
      } catch (err) {
        console.error(err);
        setError("Failed to load advertisement.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const fetchGeoMarkings = async () => {
      try {
        const [serviceAreaRes, zoneRes] = await Promise.all([
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" }),
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Zone" }),
        ]);
        if (serviceAreaRes?.success) setServiceAreas(serviceAreaRes.data || []);
        if (zoneRes?.success) setZones(zoneRes.data || []);
      } catch (err) {
        console.error("Failed to load geo markings for driver ads detail:", err);
      }
    };
    fetchGeoMarkings();
  }, []);

  const zoneName = serviceAreas.find((item) => String(item?.id) === String(data?.zone))?.name || data?.zone || "";
  const subZoneName = zones.find((item) => String(item?.id) === String(data?.subZoneId))?.name || data?.subZoneId || "";

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardBody className="flex flex-col gap-6">
          <Typography variant="h5" className="text-black">Driver Advertisement Details</Typography>
          {error ? <Alert color="red">{error}</Alert> : null}
          {loading ? <Typography>Loading...</Typography> : null}
          {data ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Name</Typography>
                <Input value={data.name || ""} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Description</Typography>
                <Input value={data.description || ""} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Terms And Conditions</Typography>
                <Input value={data.termsAndConditions || ""} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Contract Period</Typography>
                <Input value={String(data.contractPeriod || "")} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Payment Frequency</Typography>
                <Input value={data.paymentFrequency || ""} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Payment Amount</Typography>
                <Input value={String(data.paymentAmount ?? "")} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Tier</Typography>
                <Input value={data.tier || ""} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Zone</Typography>
                <Input value={zoneName} disabled className="w-full" />
              </div>
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Sub Zone</Typography>
                <Input value={subZoneName} disabled className="w-full" />
              </div>
              <div className="flex items-center gap-3 md:pt-6">
                <Switch checked={Boolean(data.isActive)} disabled />
                <Typography className="text-sm font-medium text-blue-gray-700">Active</Typography>
              </div>
              <div className="flex items-center gap-3 md:pt-6">
                <Switch checked={Boolean(data.claimRequest)} disabled />
                <Typography className="text-sm font-medium text-blue-gray-700">Claim Request</Typography>
              </div>
              <div className="md:col-span-2">
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Image</Typography>
                {data.image ? (
                  <img src={data.image} alt={data.name || "driver advertisement"} className="max-h-64 rounded-lg border object-contain" />
                ) : (
                  <Typography className="text-sm text-blue-gray-600">No image uploaded</Typography>
                )}
              </div>
              <div className="md:col-span-2">
                <Typography variant="small" className="mb-2 font-medium text-blue-gray-700">Placements</Typography>
                <div className="space-y-3">
                  {(data?.config?.placements || []).map((placement, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Place</Typography>
                        <Input value={placement.place || ""} disabled className="w-full" />
                      </div>
                      <div>
                        <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">From</Typography>
                        <Input value={placement?.slot?.from || ""} disabled className="w-full" />
                      </div>
                      <div>
                        <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">To</Typography>
                        <Input value={placement?.slot?.to || ""} disabled className="w-full" />
                      </div>
                    </div>
                  ))}
                  {!data?.config?.placements?.length ? (
                    <Typography className="text-sm text-blue-gray-600">No placements available</Typography>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex justify-center gap-3">
            <Button className="bg-red-600 text-white" onClick={() => navigate("/dashboard/support/driver-ads")}>Back</Button>
            <Button className={`${ColorStyles.bgColor} text-white`} onClick={() => navigate(`/dashboard/support/driver-ads/edit/${id}`)}>Edit</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverAdsDetail;