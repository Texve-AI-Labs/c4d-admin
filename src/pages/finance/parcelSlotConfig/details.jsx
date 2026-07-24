import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "@material-tailwind/react";
import { useLocation, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import SlotRuleForm from "./SlotRuleForm";

export default function ParcelSlotConfigDetails() {
  const params = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [slotRule, setSlotRule] = useState(location.state?.slotRule || null);

  const initialValues = useMemo(() => slotRule || { id: params.id }, [slotRule, params.id]);

  useEffect(() => {
    if (slotRule || !params.id) return;

    const loadSlotRule = async () => {
      try {
        setLoading(true);
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_ADMIN_PARCEL_SLOT_RULES}/${params.id}`);
        const data = response?.data?.data || response?.data || null;
        if (data) {
          setSlotRule(data);
        }
      } catch (error) {
        console.error("Failed to load parcel slot rule details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSlotRule();
  }, [params.id, slotRule]);

  if (loading && !slotRule) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return <SlotRuleForm mode="view" initialValues={initialValues} />;
}