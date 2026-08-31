import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import ServiceContentForm from "./ServiceContentForm";

export default function ServiceContentEdit() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_SERVICE_CONTENT_BY_ID}/${id}`);
        setRecord(response?.data || null);
      } catch (error) {
        console.error("Failed to load service content:", error);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRecord();
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return <ServiceContentForm mode="edit" record={record} />;
}