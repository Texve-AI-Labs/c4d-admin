import React from "react";
import { useNavigate } from "react-router-dom";
import { API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import ReferralRuleForm, { REFERRAL_RULE_DESCRIPTIONS } from "./ReferralRuleForm";

const initialValues = {
  name: "DRIVER_TO_DRIVER",
  description: REFERRAL_RULE_DESCRIPTIONS.DRIVER_TO_DRIVER,
  config: {
    referrerAmount: "",
    referredAmount: 0,
    triggerEvent: "DRIVER_VERIFIED",
    referrerType: "DRIVER",
    referredType: "DRIVER",
    enabled: true,
  },
  isActive: true,
};

const ReferralRuleAdd = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        name: values.name,
        description: REFERRAL_RULE_DESCRIPTIONS[values.name] || values.description || "",
        config: {
          referrerAmount: Number(values.config.referrerAmount),
          referredAmount: Number(values.config.referredAmount),
          triggerEvent: values.config.triggerEvent,
          referrerType: values.config.referrerType,
          referredType: values.config.referredType,
          enabled: Boolean(values.config.enabled),
        },
        isActive: Boolean(values.isActive),
      };

      const response = await ApiRequestUtils.post(API_ROUTES.POST_REFERRAL_RULE, payload);
      if (response?.success) {
        navigate("/dashboard/finance/referral-rules/list");
      }
    } catch (error) {
      console.error("Failed to add referral rule:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReferralRuleForm
      title="Add Referral Rule"
      submitLabel="Save"
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  );
};

export default ReferralRuleAdd;
