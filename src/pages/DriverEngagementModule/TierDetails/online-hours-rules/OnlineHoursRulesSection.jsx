import React from "react";
import TierComponentRulesSection from "../shared/TierComponentRulesSection";

const METRIC_OPTIONS = [
  { label: "Online Hours", value: "onlineHours" },
];
const PERIOD_OPTIONS = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  // { label: "Monthly", value: "MONTHLY" },
];
const PAYOUT_FREQUENCY_OPTIONS = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
];

function OnlineHoursRulesSection(props) {
  return (
    <TierComponentRulesSection
      {...props}
      componentCode="ONLINE_HOURS_BONUS"
      title="Online Hours Bonus"
      defaultMetric="onlineHours"
      defaultPeriod="DAILY"
      defaultServiceType="ANY"
      defaultPayoutFrequency="DAILY"
      metricOptions={METRIC_OPTIONS}
      periodOptions={PERIOD_OPTIONS}
      payoutFrequencyOptions={PAYOUT_FREQUENCY_OPTIONS}
    />
  );
}

export default OnlineHoursRulesSection;
