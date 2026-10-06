import React, { useState } from "react";
import { Button, Card, CardBody, Input, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ColorStyles } from "@/utils/constants";
import { extendSubscription } from "./subscriptionExtendApi";
import {
  formatAmount,
  formatDateTime,
  formatLabel,
  getAccountName,
  getAccountPhone,
  getDriverName,
  getDriverPhone,
  getEntityName,
  getEntityNumber,
  getStatusBadgeClass,
} from "./subscriptionExtendUtils";

const DetailItem = ({ label, value }) => (
  <div className="rounded-lg border border-blue-gray-50 bg-white p-3">
    <div className="text-xs font-medium uppercase text-blue-gray-400">{label}</div>
    <div className="mt-1 text-sm font-medium text-blue-gray-900 break-words">{value || "-"}</div>
  </div>
);

const DetailSection = ({ title, fields }) => (
  <div className="rounded-lg border border-blue-gray-100 bg-blue-gray-50/30 p-4">
    <Typography variant="small" className="mb-3 font-semibold text-blue-gray-900">
      {title}
    </Typography>
    <div className="grid grid-cols-1 gap-3">
      {fields.map((field) => (
        <DetailItem key={field.label} label={field.label} value={field.value} />
      ))}
    </div>
  </div>
);

function SubscriptionExtendEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const row = location.state?.row || null;
  const [days, setDays] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subscription = row?.subscription || {};
  const associatedEntity = row?.associatedEntity || {};
  const isCreditPlan = String(subscription?.earningStrategy || "").toUpperCase() === "CREDIT";
  const detailSections = [
    {
      title: "Driver Details",
      fields: [
        { label: "Driver", value: getDriverName(row) },
        { label: "Phone", value: getDriverPhone(row) },
        { label: "Driver Type", value: formatLabel(row?.driverType || row?.driver?.driverType) },
        { label: "Entity", value: getEntityName(row) },
        { label: "Vehicle No", value: getEntityNumber(row) },
        {
          label: "Associated Vehicle Status",
          value: (
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row?.associatedStatus || associatedEntity?.subscriptionStatus)}`}>
              {formatLabel(row?.associatedStatus || associatedEntity?.subscriptionStatus)}
            </span>
          ),
        },
      ],
    },
    {
      title: "Account Details",
      fields: [
        { label: "Account", value: getAccountName(row) },
        { label: "Account Phone", value: getAccountPhone(row) },
      ],
    },
    {
      title: "Subscription Details",
      fields: [
        { label: "Plan", value: subscription?.Plan?.name || "-" },
        { label: "Earning Strategy", value: formatLabel(subscription?.earningStrategy) },
        {
          label: "Subscription Status",
          value: (
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(subscription?.status)}`}>
              {formatLabel(subscription?.status)}
            </span>
          ),
        },
        { label: "Expired Date", value: formatDateTime(subscription?.endDate) },
        ...(isCreditPlan
          ? [
              { label: "Expired Unused Credit", value: formatAmount(subscription?.expiredUnusedEarning) },
              { label: "Current Wallet", value: formatAmount(associatedEntity?.wallet) },
            ]
          : []),
      ],
    },
  ];

  const validateDays = () => {
    const numericDays = Number(days);
    if (!String(days).trim()) return "Extension days is required.";
    if (!Number.isInteger(numericDays) || numericDays <= 0) return "days must be a positive integer";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateDays();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await extendSubscription(id, { days: Number(days) });
      if (response?.success === false) {
        setError(response?.error || response?.message || "Failed to extend subscription.");
        return;
      }
      navigate("/dashboard/support/subscription-extend");
    } catch (err) {
      console.error("Error extending subscription:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to extend subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!row) {
    return (
      <div className="mb-8 mt-8 flex flex-col gap-6">
        <Card>
          <CardBody className="flex flex-col gap-4">
            <Typography variant="h6" color="black">Extend Subscription</Typography>
            <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Subscription details are not available. Please select an expired subscription from the list.
            </div>
            <div>
              <Button className={`${ColorStyles.bgColor} text-white`} onClick={() => navigate("/dashboard/support/subscription-extend")}>
                Back to List
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <Card>
        <CardBody className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Typography variant="h6" color="black">
              Extend Subscription
            </Typography>
            <Button className={ColorStyles.backButton} onClick={() => navigate("/dashboard/support/subscription-extend")} disabled={submitting}>
              Back
            </Button>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {detailSections.map((section) => (
              <DetailSection key={section.title} title={section.title} fields={section.fields} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,320px)_auto] md:items-start">
            <Input
              type="number"
              min="1"
              step="1"
              label="Extension Days"
              value={days}
              onChange={(event) => {
                setDays(event.target.value);
                setError("");
              }}
            />
            <Button type="submit" className={`${ColorStyles.bgColor} min-w-[140px] text-white`} disabled={submitting}>
              {submitting ? <Spinner className="mx-auto h-4 w-4" /> : "Extend"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default SubscriptionExtendEdit;