import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const formatOptionLabel = (value) => {
  if (!value) return "-";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const FieldRow = ({ label, value }) => (
  <div className="rounded-md border bg-white p-3 shadow-sm">
    <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
    <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{value || "-"}</div>
  </div>
);

export default function DriverSubscriptionDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_DRIVER_SUBSCRIPTIONS_FEEDBACK);
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
        setRows(data);
      } catch (error) {
        console.error("Failed to load driver subscription details:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, [id]);

  const row = useMemo(() => {
    if (location?.state?.row) return location.state.row;
    return rows.find((item) => String(item?.id) === String(id)) || {};
  }, [id, location.state, rows]);

  if (loading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Driver Subscription Details
          </Typography>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FieldRow label="Service Type" value={formatOptionLabel(row?.serviceType)} />
            <FieldRow label="Placement" value={formatOptionLabel(row?.placement)} />
            <FieldRow label="Overall Label" value={row?.overallLabel} />
            <FieldRow label="First Label" value={row?.firstLabel} />
            <FieldRow label="Star" value={row?.star} />
            <FieldRow label="Sort Order" value={row?.sortOrder} />
            <FieldRow label="Status" value={formatOptionLabel(row?.status)} />
            <div className="md:col-span-2 rounded-md border bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase text-gray-500">Second Label</div>
              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{row?.secondLabel || "-"}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/finance/driver-subscription-feedback")}>
              Back
            </Button>
            <Button type="button" className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/finance/driver-subscription-feedback/edit/${id}`, { state: { row } })}>
              Edit
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
