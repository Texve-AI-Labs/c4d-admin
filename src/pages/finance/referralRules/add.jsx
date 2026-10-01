import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
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
  const [apiError, setApiError] = useState("");

  const getApiErrorMessage = (error, fallback = "Unable to save referral rule.") =>
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.data?.error ||
    error?.data?.message ||
    error?.error ||
    error?.message ||
    fallback;

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
      } else {
        setApiError(getApiErrorMessage(response));
      }
    } catch (error) {
      console.error("Failed to add referral rule:", error);
      setApiError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ReferralRuleForm
        title="Add Referral Rule"
        submitLabel="Save"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        showStatus={false}
      />
      <Dialog open={Boolean(apiError)} handler={() => setApiError("")} size="sm">
        <DialogHeader className="text-red-700">Alert !</DialogHeader>
        <DialogBody divider>
          <Typography className="text-sm font-medium text-gray-800">{apiError}</Typography>
        </DialogBody>
        <DialogFooter>
          <Button className="bg-red-600" onClick={() => setApiError("")}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default ReferralRuleAdd;
