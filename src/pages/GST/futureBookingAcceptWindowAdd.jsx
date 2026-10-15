import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import FutureBookingAcceptWindowForm from "./FutureBookingAcceptWindowForm.jsx";
import { ACCEPT_WINDOW_TYPE, ACCEPT_WINDOW_PATH, buildAcceptWindowPayload } from "./futureBookingAcceptWindowConfig.js";

export default function FutureBookingAcceptWindowAdd() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const back = () => navigate("/dashboard/finance/GSTList", { state: { selectedType: ACCEPT_WINDOW_TYPE } });
  const findExisting = async () => {
    const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_GST, { type: ACCEPT_WINDOW_TYPE });
    if (!response?.success || !Array.isArray(response.data)) throw new Error(response?.message || "Unable to check existing configuration");
    return response.data.find((item) => item.type === ACCEPT_WINDOW_TYPE);
  };
  useEffect(() => {
    let active = true;
    findExisting().then((existing) => {
      if (!active) return;
      if (existing) navigate(`${ACCEPT_WINDOW_PATH}/edit/${existing.id}`, { replace: true, state: { gst: existing } });
      else setChecking(false);
    }).catch((err) => { if (active) { setError(err.message); setChecking(false); } });
    return () => { active = false; };
  }, []);
  const onSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    try {
      if (await findExisting()) {
        setStatus("A configuration already exists. Return to Settings to edit it.");
        return;
      }
      const response = await ApiRequestUtils.post(API_ROUTES.POST_GST, buildAcceptWindowPayload(values), 0, { suppressAlert: true });
      if (!response?.success) { setStatus(response?.message || "Unable to save configuration"); return; }
      back();
    } catch (err) { setStatus(err?.response?.data?.message || err.message || "Unable to save configuration"); }
    finally { setSubmitting(false); }
  };
  if (checking) return <Spinner className="h-8 w-8 mx-auto" />;
  if (error) return <div role="alert">{error}<button className="ml-4 underline" onClick={back}>Back to Settings</button></div>;
  return <FutureBookingAcceptWindowForm onSubmit={onSubmit} onCancel={back} />;
}
