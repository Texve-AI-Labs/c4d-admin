import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

const normalizeRecord = (response) => {
  const body = response?.data ?? response?.result ?? response;
  if (Array.isArray(body)) return body[0] || null;
  if (body?.data && !Array.isArray(body.data)) return body.data;
  return body || null;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY HH:mm") : String(value);
};

const formatValue = (value) => (value === undefined || value === null || value === "" ? "-" : value);
const formatAmount = (value) => (value === undefined || value === null || value === "" ? "-" : `₹ ${Number(value).toLocaleString("en-IN")}`);

function DetailField({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <div className="text-xs font-medium text-blue-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-blue-gray-900">{formatValue(value)}</div>
    </div>
  );
}

function OwnVehicleDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [record, setRecord] = useState(location.state?.row || null);
  const [loading, setLoading] = useState(Boolean(id && !location.state?.row));
  const [error, setError] = useState("");

  const totalKm = useMemo(
    () => record?.totalKm ?? Number(record?.endKm || 0) - Number(record?.startKm || 0),
    [record]
  );
  const closingAmount = useMemo(
    () => record?.closingAmount ?? Number(record?.totalTripAmount || 0) - Number(record?.fuelAmount || 0) - Number(record?.otherExpense || 0),
    [record]
  );

  useEffect(() => {
    if (record || !id) return;

    const fetchRecord = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.OWN_VEHICLE_TRIPS}/${id}`);
        if (response?.success === false) {
          setError(response?.message || "Failed to load own vehicle trip.");
          return;
        }
        setRecord(normalizeRecord(response));
      } catch (err) {
        console.error("Error fetching own vehicle trip:", err);
        setError("Failed to load own vehicle trip.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, record]);

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Typography variant="h6" color="black">
              Own Vehicle Trip Details
            </Typography>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-7 w-7" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailField label="Trip Start Date Time" value={formatDateTime(record?.tripStartDate)} />
                <DetailField label="Trip End Date Time" value={formatDateTime(record?.tripEndDateTime)} />
                <DetailField label="Vehicle Number" value={record?.vehicleNumber} />
                <DetailField label="Driver Name" value={record?.driverName} />
                <DetailField label="Start KM" value={record?.startKm} />
                <DetailField label="End KM" value={record?.endKm} />
                <DetailField label="Total Trip Amount" value={formatAmount(record?.totalTripAmount)} />
                <DetailField label="Fuel Type" value={record?.fuelType} />
                <DetailField label="Fuel Amount" value={formatAmount(record?.fuelAmount)} />
                <DetailField label="Other Expense" value={formatAmount(record?.otherExpense)} />
                <DetailField label="Total KM" value={totalKm} />
                <DetailField label="Closing Amount" value={formatAmount(closingAmount)} />
                <DetailField label="Created At" value={formatDateTime(record?.createdAt || record?.created_at)} />
                <DetailField label="Updated At" value={formatDateTime(record?.updatedAt || record?.updated_at)} />
                <div className="md:col-span-2">
                  <DetailField label="Notes" value={record?.notes} />
                </div>
              </div>

              <div className="flex justify-center">
                <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/support/own-vehicle")}>
                  Back
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default OwnVehicleDetails;
