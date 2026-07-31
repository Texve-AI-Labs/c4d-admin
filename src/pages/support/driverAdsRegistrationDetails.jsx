import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Dialog, DialogBody, DialogFooter, DialogHeader, Input, Spinner, Textarea, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";
import DriverSummaryCards from "./driverAdsRegistrationDetails/DriverSummaryCards";
import StatusUpdateModal from "./driverAdsRegistrationDetails/StatusUpdateModal";
import ActivityTabs from "./driverAdsRegistrationDetails/ActivityTabs";
import { STATUS_FLOW } from "./driverAdsRegistrationDetails/constants";
import { getStatusOptions } from "./driverAdsRegistrationDetails/utils";

const formatValue = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY hh:mm A") : String(value);
};

const resolveGeoName = (value, collection) =>
  collection.find((item) => String(item?.id) === String(value))?.name || value || "-";

const formatStatusLabel = (value) => {
  if (!value) return "-";
  const normalized = String(value).toUpperCase();
  const STATUS_LABELS = {
    NEW: "New",
    IN_PROGRESS: "In Progress",
    FOLLOW_UP_SCHEDULED: "Follow Up Scheduled",
    COMPLETED: "Completed",
  };
  if (STATUS_LABELS[normalized]) return STATUS_LABELS[normalized];
  return String(value)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
const getStatusBadgeClass = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "NEW") return "bg-blue-gray-100 text-blue-gray-800 border-blue-gray-200";
  if (normalized === "IN_PROGRESS") return "bg-blue-50 text-blue-700 border-blue-200";
  if (normalized === "FOLLOW_UP_SCHEDULED") return "bg-orange-50 text-orange-700 border-orange-200";
  if (normalized === "COMPLETED") return "bg-green-50 text-green-700 border-green-200";
  return "bg-blue-gray-50 text-blue-gray-700 border-blue-gray-200";
};

function DriverAdsRegistrationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [record, setRecord] = useState(null);
  const [driver, setDriver] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [updatingFollowUp, setUpdatingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState("");
  const [notes, setNotes] = useState("");
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [completionRemarks, setCompletionRemarks] = useState("");
  const [updatingCompletionRemarks, setUpdatingCompletionRemarks] = useState(false);
  const [completionRemarksError, setCompletionRemarksError] = useState("");
  const [activityLog, setActivityLog] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline");
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSuperUser = isSuperUserRole();

  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ApiRequestUtils.get(`${API_ROUTES.GET_DRIVER_ADS_LIST}/${id}`);
      setRecord(response?.data || null);
      setDriver(response?.data?.driver || null);
      setSelectedStatus(response?.data?.status || "");
      setData(response?.data?.advertisement || response?.data || null);
    } catch (err) {
      console.error("Failed to load driver ad registration details:", err);
      setError("Failed to load driver ad registration details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const fetchGeoMarkings = async () => {
      try {
        const [serviceAreaRes, zoneRes] = await Promise.all([
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" }),
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Zone" }),
        ]);
        if (serviceAreaRes?.success) setServiceAreas(serviceAreaRes.data || []);
        if (zoneRes?.success) setZones(zoneRes.data || []);
      } catch (err) {
        console.error("Error fetching geo markings for driver ad details:", err);
      }
    };
    fetchGeoMarkings();
  }, []);

  const fetchActivityLog = async () => {
    setActivityLoading(true);
    setActivityError("");
    try {
      const route = API_ROUTES.DRIVER_ADS_REG_ACTIVITY_LOG.replace(":registrationId", id);
      const response = await ApiRequestUtils.get(route);
      setActivityLog(response?.data || null);
    } catch (err) {
      console.error("Failed to load driver ad registration activity log:", err);
      setActivityError("Failed to load activity log.");
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperUser) return;
    if (id) fetchActivityLog();
  }, [id, activeTab, showDetails, isSuperUser]);

  const handleStatusUpdate = async () => {
    setStatusError("");
    if (!selectedStatus) {
      setStatusError("Please select a status.");
      return false;
    }
    try {
      setUpdatingStatus(true);
      const route = API_ROUTES.UPDATE_DRIVER_ADS_REGISTRATION_STATUS.replace(":registrationId", id);
      const response = await ApiRequestUtils.update(route, { status: selectedStatus });
      if (response?.success) {
        setRecord((prev) => (prev ? { ...prev, status: selectedStatus } : prev));
        return true;
      } else {
        setStatusError(response?.message || "Failed to update status.");
        return false;
      }
    } catch (err) {
      console.error("Failed to update registration status:", err);
      setStatusError("Failed to update status.");
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrimaryUpdate = async () => {
    setStatusError("");
    if (!selectedStatus) {
      setStatusError("Please select a status.");
      return;
    }

    if (selectedStatus === "FOLLOW_UP_SCHEDULED" && (!followUpDate || !followUpTime || !followUpRemarks.trim())) {
      setStatusError("Follow up date, time, and remarks are required for Follow Up Scheduled.");
      return;
    }

    if (selectedStatus === "COMPLETED" && !completionRemarks.trim()) {
      setStatusError("Completion remarks are required for Completed.");
      return;
    }

    const statusUpdated = await handleStatusUpdate();
    if (!statusUpdated) {
      return;
    }

    const notesUpdated = notes.trim() ? await handleNotesUpdate() : true;
    if (!notesUpdated) {
      return;
    }

    if (selectedStatus !== "FOLLOW_UP_SCHEDULED" && selectedStatus !== "COMPLETED") {
      setShowDetails(false);
      await fetchDetail();
      await fetchActivityLog();
      return;
    }

    if (selectedStatus === "FOLLOW_UP_SCHEDULED") {
      const followUpUpdated = await handleFollowUpUpdate();
      if (!followUpUpdated) return;
      setShowDetails(false);
      await fetchDetail();
      await fetchActivityLog();
    }

    if (selectedStatus === "COMPLETED" && completionRemarks.trim()) {
      const completionUpdated = await handleCompletionRemarksUpdate();
      if (!completionUpdated) return;
      setShowDetails(false);
      await fetchDetail();
      await fetchActivityLog();
    }
  };

  const handleFollowUpUpdate = async () => {
    setFollowUpError("");
    if (!followUpDate || !followUpTime || !followUpRemarks.trim()) {
      setFollowUpError("Follow up date, time, and remarks are required.");
      return false;
    }
    try {
      setUpdatingFollowUp(true);
      const route = API_ROUTES.POST_FOLLOW_UP.replace(":registrationId", id);
      const response = await ApiRequestUtils.post(route, {
        followUpDate,
        followUpTime,
        followUpRemarks: followUpRemarks.trim(),
      });
      if (response?.success) {
        setFollowUpDate("");
        setFollowUpTime("");
        setFollowUpRemarks("");
        return true;
      } else {
        setFollowUpError(response?.message || "Failed to save follow up.");
        return false;
      }
    } catch (err) {
      console.error("Failed to save follow up:", err);
      setFollowUpError("Failed to save follow up.");
      return false;
    } finally {
      setUpdatingFollowUp(false);
    }
  };

  const handleNotesUpdate = async () => {
    setNotesError("");
    if (!notes.trim()) {
      setNotesError("Please enter notes.");
      return false;
    }
    try {
      setUpdatingNotes(true);
      const route = API_ROUTES.UPDATE_DRIVER_ADS_REGISTRATION_NOTES.replace(":registrationId", id);
      const response = await ApiRequestUtils.post(route, { note: notes.trim() });
      if (response?.success) {
        setNotes("");
        return true;
      } else {
        setNotesError(response?.message || "Failed to update notes.");
        return false;
      }
    } catch (err) {
      console.error("Failed to update registration notes:", err);
      setNotesError("Failed to update notes.");
      return false;
    } finally {
      setUpdatingNotes(false);
    }
  };

  const handleCompletionRemarksUpdate = async () => {
    setCompletionRemarksError("");
    if (!completionRemarks.trim()) {
      setCompletionRemarksError("Please enter completion remarks.");
      return false;
    }
    try {
      setUpdatingCompletionRemarks(true);
      const route = API_ROUTES.STATUS_COMPLETE_REMARKS.replace(":registrationId", id);
      const response = await ApiRequestUtils.post(route, { completionRemarks: completionRemarks.trim() });
      if (response?.success) {
        setCompletionRemarks("");
        return true;
      } else {
        setCompletionRemarksError(response?.message || "Failed to save completion remarks.");
        return false;
      }
    } catch (err) {
      console.error("Failed to save completion remarks:", err);
      setCompletionRemarksError("Failed to save completion remarks.");
      return false;
    } finally {
      setUpdatingCompletionRemarks(false);
    }
  };

  const renderActivityRows = (rows, headings, renderRow) => {
    const normalizedRows = Array.isArray(rows) ? rows : [];
    if (!normalizedRows.length) {
      return <div className="py-6 text-center text-sm text-blue-gray-600">No records found.</div>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-auto">
          <thead className="bg-primary">
            <tr>
              {headings.map((heading) => (
                <th key={heading} className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                    {heading}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedRows.map((row, index) => (
              <tr
                key={`${row?.kind || row?.actionPerformed || row?.currentStatus || row?.previousStatus || row?.id || row?._id || "row"}-${index}`}
                className="border-b border-blue-gray-50"
              >
                {renderRow(row).map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`} className="whitespace-nowrap py-3 px-5">
                    <Typography className="text-xs font-semibold text-black">{cell}</Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderUser = (user) => {
    if (!user) return "-";
    const name = user?.name || "-";
    return user?.phoneNumber ? `${name} (${user.phoneNumber})` : name;
  };

  const renderActivityTab = () => {
    const notesRows = Array.isArray(activityLog?.notes) ? [...activityLog.notes] : [];
    notesRows.sort((a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0));

    const statusBadge = (value, tone = "neutral") => {
      const text = formatStatusLabel(value);
      const normalized = String(value || "").toUpperCase();
      const classes =
        normalized === "NEW"
          ? "bg-blue-gray-100 text-blue-gray-800 border-blue-gray-200"
          : normalized === "IN_PROGRESS"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : normalized === "FOLLOW_UP_SCHEDULED"
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : normalized === "COMPLETED"
                ? "bg-green-50 text-green-700 border-green-200"
                : tone === "action"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-blue-gray-50 text-blue-gray-700 border-blue-gray-200";
      return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${classes}`}>
          {text}
        </span>
      );
    };

    const sections = {
      notes: renderActivityRows(notesRows, ["Note", "Added By", "Created At"], (row) => [
        row?.note || "-",
        renderUser(row?.addedByUser),
        formatValue(row?.created_at),
      ]),
      followUps: renderActivityRows(
        activityLog?.followUps || [],
        ["Follow Up Date", "Follow Up Time", "Follow Up Remarks", "Updated By", "Created At"],
        (row) => [
          formatValue(row?.followUpDate),
          row?.followUpTime || "-",
          row?.followUpRemarks || "-",
          renderUser(row?.updatedByUser),
          formatValue(row?.created_at),
        ]
      ),
      history: renderActivityRows(
        activityLog?.history || [],
        ["Action", "Previous Status", "Current Status", "Remarks", "Performed By", "Created At"],
        (row) => [
          statusBadge(row?.actionPerformed, "action"),
          statusBadge(row?.previousStatus),
          statusBadge(row?.currentStatus),
          row?.remarks || "-",
          renderUser(row?.performedByUser),
          formatValue(row?.created_at),
        ]
      ),
      timeline: renderActivityRows(activityLog?.timeline || [], ["Kind", "Action", "Remarks", "Performed At"], (row) => [
        row?.kind || "-",
        statusBadge(row?.actionPerformed || row?.note || row?.followUpRemarks || "-"),
        row?.remarks || row?.note || row?.followUpRemarks || "-",
        formatValue(row?.performedAt || row?.addedAt || row?.updatedAt),
      ]),
    };

    return sections[activeTab] || sections.notes;
  };

  const handleShowDetails = () => {
    setShowDetails(true);
  };

  const latestNote =
    Array.isArray(activityLog?.notes) && activityLog.notes.length
      ? [...activityLog.notes].sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0))[0]?.note || ""
      : "";
  const latestFollowUp =
    Array.isArray(activityLog?.followUps) && activityLog.followUps.length
      ? [...activityLog.followUps].sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0))[0]
      : null;
  const latestCompletionRemark =
    Array.isArray(activityLog?.history) && activityLog.history.length
      ? [...activityLog.history]
          .sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0))
          .find((row) => String(row?.currentStatus || "").toUpperCase() === "COMPLETED" && row?.remarks)
      : null;

  useEffect(() => {
    if (!showDetails) return;
    if (latestNote) setNotes(latestNote);
    if (selectedStatus === "FOLLOW_UP_SCHEDULED" && latestFollowUp) {
      setFollowUpDate(latestFollowUp?.followUpDate || "");
      setFollowUpTime((latestFollowUp?.followUpTime || "").slice(0, 5));
      setFollowUpRemarks(latestFollowUp?.followUpRemarks || "");
    }
    if (selectedStatus === "COMPLETED" && latestCompletionRemark?.remarks) {
      setCompletionRemarks(latestCompletionRemark.remarks || "");
    }
  }, [showDetails, selectedStatus, latestNote, latestFollowUp, latestCompletionRemark, activityLog]);

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  if (loading) {
    return (
      <div className="mb-8 mt-8">
        <Card>
          <CardBody>
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-12 w-12" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Typography variant="h5" className="text-black">
              Driver Ads Registration Details
            </Typography>
          </div>
          {error ? <Alert color="red">{error}</Alert> : null}
          {data ? (
            <>
              <DriverSummaryCards driver={driver} status={record?.status} advertisement={data} onStatusUpdate={handleShowDetails} />
              <StatusUpdateModal
                open={showDetails}
                onClose={handleCloseDetails}
                statusOptions={getStatusOptions(selectedStatus || "NEW", STATUS_FLOW)}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                onStatusUpdate={handlePrimaryUpdate}
                updatingStatus={updatingStatus}
                statusError={statusError}
                completionRemarks={completionRemarks}
                onCompletionRemarksChange={setCompletionRemarks}
                onCompletionRemarksUpdate={handleCompletionRemarksUpdate}
                updatingCompletionRemarks={updatingCompletionRemarks}
                completionRemarksError={completionRemarksError}
                followUpDate={followUpDate}
                followUpTime={followUpTime}
                followUpRemarks={followUpRemarks}
                onFollowUpDateChange={setFollowUpDate}
                onFollowUpTimeChange={setFollowUpTime}
                onFollowUpRemarksChange={setFollowUpRemarks}
                onFollowUpUpdate={handleFollowUpUpdate}
                updatingFollowUp={updatingFollowUp}
                followUpError={followUpError}
                notes={notes}
                onNotesChange={setNotes}
                onNotesUpdate={handleNotesUpdate}
                updatingNotes={updatingNotes}
                notesError={notesError}
                latestNote={latestNote}
              />
              {isSuperUser ? (
              <div className="rounded-xl border border-blue-gray-100 p-4">
                <ActivityTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  loading={activityLoading}
                  error={activityError}
                  rowsRenderer={renderActivityTab}
                />
              </div>
              ) : null}
             
            </>
          ) : null}
        </CardBody>
        <div className="flex justify-center p-4">
          <Button
            size="sm"
            className="border-blue-gray-300 bg-primary text-white"
            onClick={() => navigate("/dashboard/support/driver-ads-reg")}
            >
              Back
            </Button>
      </div>
      </Card>
      
    </div>
    
  );
}

export default DriverAdsRegistrationDetails;
