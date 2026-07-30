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
              <DriverAdsZone label="Zone" placeholder="Select Zone" value={data.zone || ""} disabled showAll={false} />
              <DriverAdsZone label="Sub Zone" placeholder="Select Sub Zone" value={String(data.subZoneId || "")} disabled showAll={false} isSubZone parentValue={data.zone || ""} />
              <div>
                <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Launch At</Typography>
                <Input value={formatDate(data.launchAt)} disabled className="w-full" />
              </div>
              <div className="flex items-center gap-3 md:pt-6">
                <Switch checked={Boolean(data.isActive)} disabled />
                <Typography className="text-sm font-medium text-blue-gray-700">Active</Typography>
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
                <Typography variant="small" className="mb-2 font-medium text-blue-gray-700">Time Slots</Typography>
                <div className="space-y-3">
                  {(data?.config?.timeSlots || []).map((slot, index) => (
                    <div key={index} className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                      <div className="flex-1">
                        <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">From</Typography>
                        <Input value={slot.from || ""} disabled className="w-full" />
                      </div>
                      <div className="flex-1">
                        <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">To</Typography>
                        <Input value={slot.to || ""} disabled className="w-full" />
                      </div>
                    </div>
                  ))}
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