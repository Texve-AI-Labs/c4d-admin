import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { findEligibilityById, getEligibilityRecords } from "./data";

const DETAIL_FIELDS = [
  ["Plan Name", "planName"],
  ["Service Type", "serviceType"],
  ["Zone", "zone"],
  ["Tier", "tier"],
  ["Status", "status"],
  ["Notes", "notes"],
];

function DetailField({ label, value }) {
  return (
    <div>
      <Typography variant="small" className="mb-1 block font-medium text-gray-700">
        {label}
      </Typography>
      <div className="min-h-10 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {value || "-"}
      </div>
    </div>
  );
}

export default function FutureBookingEligibilityDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [row, setRow] = useState(location.state?.row || null);
  const [loading, setLoading] = useState(!row);

  useEffect(() => {
    if (row) return;

    ApiRequestUtils.get(API_ROUTES.GET_FUTURE_BOOKING_ELIGIBILITY)
      .then((response) => {
        const records = getEligibilityRecords(response);
        const record = response?.data?.id || response?.data?._id
          ? response.data
          : findEligibilityById(records, id);
        setRow(record || null);
      })
      .finally(() => setLoading(false));
  }, [id, row]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader variant="gradient" className={`p-6 ${ColorStyles.bgColor}`}>
        <Typography variant="h6" color="white">
          Future Booking Eligibility Details
        </Typography>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {DETAIL_FIELDS.map(([label, field]) => (
            <DetailField key={field} label={label} value={row?.[field]} />
          ))}
          <DetailField
            label="Eligible For Future Booking"
            value={row?.eligibleForFutureBooking ? "Yes" : "No"}
          />
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            className={ColorStyles.backButton}
            onClick={() => navigate("/dashboard/finance/future-booking-eligibility")}
          >
            Back
          </Button>
          <Button
            className={ColorStyles.continueButtonColor}
            onClick={() =>
              navigate(`/dashboard/finance/future-booking-eligibility/edit/${id}`, {
                state: { row },
              })
            }
          >
            Edit
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}