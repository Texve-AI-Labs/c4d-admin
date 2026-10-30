import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Spinner } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import FutureBookingAcceptWindowForm from "./FutureBookingAcceptWindowForm.jsx";
import { ACCEPT_WINDOW_TYPE, buildAcceptWindowPayload } from "./futureBookingAcceptWindowConfig.js";

export default function FutureBookingAcceptWindowEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const back = () => navigate("/dashboard/finance/GSTList", { state: { selectedType: ACCEPT_WINDOW_TYPE } });
  useEffect(() => {
    let active = true;
    setRecord(null);
    setError("");
    const load = async () => {
      let raw = location.state?.gst;
      if (!raw || String(raw.id) !== String(id)) {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_GST, { id });
        if (!response?.success) throw new Error(response?.message || "Unable to load configuration");
        raw = Array.isArray(response.data) ? response.data.find((item) => String(item.id) === String(id)) : response.data;
      }
      if (!raw || raw.type !== ACCEPT_WINDOW_TYPE || String(raw.id) !== String(id)) throw new Error("Configuration not found");
      if (active) setRecord(raw);
    };
    load().catch((err) => { if (active) setError(err.message || "Unable to load configuration"); });
    return () => { active = false; };
  }, [id, location.state]);
  const onSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    try {
      const response = await ApiRequestUtils.update(API_ROUTES.PUT_GST, buildAcceptWindowPayload(values, record), 0, { suppressAlert: true });
      if (!response?.success) { setStatus(response?.message || "Unable to save configuration"); return; }
      back();
    } catch (err) { setStatus(err?.response?.data?.message || "Unable to save configuration"); }
    finally { setSubmitting(false); }
  };
  if (error) return <div role="alert">{error}<button className="ml-4 underline" onClick={back}>Back to Settings</button></div>;
  if (!record) return <Spinner className="h-8 w-8 mx-auto" />;
  return <FutureBookingAcceptWindowForm key={id} record={record} onSubmit={onSubmit} onCancel={back} />;
}
