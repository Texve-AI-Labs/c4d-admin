import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
import { API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import ReferralRuleForm, { REFERRAL_RULE_DESCRIPTIONS } from "./ReferralRuleForm";

const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.data?.error ||
  error?.data?.message ||
  error?.error ||
  error?.message ||
  fallback;

const normalizeRecord = (record = {}) => ({
  id: record?.settingId || record?.id || record?._id || null,
  name: record?.name || "DRIVER_TO_DRIVER",
  description: record?.description || REFERRAL_RULE_DESCRIPTIONS[record?.name] || "",
  config: {
    referrerAmount:
      record?.config?.referrerAmount !== null && record?.config?.referrerAmount !== undefined
        ? String(record.config.referrerAmount)
        : "",
    referredAmount:
      record?.config?.referredAmount !== null && record?.config?.referredAmount !== undefined
        ? String(record.config.referredAmount)
        : "",
    triggerEvent: record?.config?.triggerEvent || "",
    referrerType: record?.config?.referrerType || "",
    referredType: record?.config?.referredType || "",
    enabled: Boolean(record?.config?.enabled),
  },
  isActive: Boolean(record?.isActive),
});

const ReferralRuleEdit = () => {
  const { settingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recordId, setRecordId] = useState(settingId || null);
  const [initialValues, setInitialValues] = useState(normalizeRecord());
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const ruleFromState = location?.state?.referralRule;
        if (ruleFromState) {
          const normalized = normalizeRecord(ruleFromState);
          setInitialValues(normalized);
          setRecordId(normalized.id || settingId);
          return;
        }

        let record = null;
        try {
          const response = await ApiRequestUtils.get(`${API_ROUTES.GET_REFERRAL_RULE}/${settingId}`);
          const data = response?.data;
          record = Array.isArray(data) ? data[0] : data;
        } catch (error) {
          const fallback = await ApiRequestUtils.get(API_ROUTES.GET_REFERRAL_RULE);
          const list = Array.isArray(fallback?.data) ? fallback.data : [];
          record = list.find((item) => String(item?.settingId || item?.id || item?._id) === String(settingId));
        }

        if (!record) {
          throw new Error("Referral rule not found");
        }

        const normalized = normalizeRecord(record);
        setInitialValues(normalized);
        setRecordId(normalized.id || settingId);
      } catch (error) {
        console.error("Failed to load referral rule:", error);
        setApiError(getApiErrorMessage(error, "Unable to load referral rule."));
      } finally {
        setLoading(false);
      }
    };

    if (settingId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [settingId, location.state, navigate]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const parsedSettingId = String(recordId || settingId || "");
      if (!parsedSettingId) {
        throw new Error("Invalid settingId");
      }

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

      const updateRoute = API_ROUTES.UPDATE_REFERRAL_RULE.replace(":settingId", parsedSettingId);
      const response = await ApiRequestUtils.update(updateRoute, payload);
      if (response?.success) {
        navigate("/dashboard/finance/referral-rules/list");
      } else {
        setApiError(getApiErrorMessage(response, "Unable to update referral rule."));
      }
    } catch (error) {
      console.error("Failed to update referral rule:", error);
      setApiError(getApiErrorMessage(error, "Unable to update referral rule."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <ReferralRuleForm
      title="Edit Referral Rule"
      submitLabel="Update"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        loading={loading}
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

export default ReferralRuleEdit;
