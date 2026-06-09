import React from "react";
import TierComponentRulesSection from "../shared/TierComponentRulesSection";

const METRIC_OPTIONS = [
  { label: "Trip Count", value: "tripCount" },
  { label: "Acceptance Pct", value: "acceptancePct" },
  { label: "Rating", value: "rating" },
];
const PERIOD_OPTIONS = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
];
const PAYOUT_FREQUENCY_OPTIONS = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
];
const SERVICE_OPTIONS = [
  { label: "Hourly Package", value: "RENTAL_HOURLY_PACKAGE" },
  { label: "Round Trip", value: "RENTAL_OUTSTATION" },
  { label: "Drop Taxi", value: "RENTAL_DROP_ONLY" },
  { label: "Local", value: "RIDES" },
  { label: "Auto", value: "AUTO" },
];

function ServiceTripRulesSection(props) {
  return (
    <TierComponentRulesSection
      {...props}
      componentCode="SERVICE_TRIP_BONUS"
      title="Service Trip Bonus"
      defaultMetric="tripCount"
      defaultPeriod="WEEKLY"
      defaultServiceType="RENTAL_OUTSTATION"
      defaultPayoutFrequency="WEEKLY"
      metricOptions={METRIC_OPTIONS}
      allowMetricChange
      periodOptions={PERIOD_OPTIONS}
      payoutFrequencyOptions={PAYOUT_FREQUENCY_OPTIONS}
      serviceOptions={SERVICE_OPTIONS}
    />
  );
}

export default ServiceTripRulesSection;
