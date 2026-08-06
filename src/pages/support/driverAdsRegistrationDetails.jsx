import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, CardBody, Chip, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";
import DriverSummaryCards from "./driverAdsRegistrationDetails/DriverSummaryCards";
import RegistrationSummary from "./driverAdsRegistrationDetails/RegistrationSummary";
import CycleReviewDialog from "./driverAdsRegistrationDetails/CycleReviewDialog";
import ClaimProofDialog from "./driverAdsRegistrationDetails/ClaimProofDialog";
import StatusUpdateModal from "./driverAdsRegistrationDetails/StatusUpdateModal";
import ActivityTabs from "./driverAdsRegistrationDetails/ActivityTabs";
import ActivityLogTable from "./driverAdsRegistrationDetails/ActivityLogTable";
import { STATUS_FLOW } from "./driverAdsRegistrationDetails/constants";
import { formatStatusLabel, getStatusBadgeClass, getStatusOptions } from "./driverAdsRegistrationDetails/utils";

const formatValue = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY hh:mm A") : String(value);
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY") : String(value);
};

const renderUser = (user) => {
  if (!user) return "-";
  const name = user?.name || "-";
  return user?.phoneNumber ? `${name} (${user.phoneNumber})` : name;
};

function DriverAdsRegistrationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [activityLog, setActivityLog] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [notes, setNotes] = useState("");
  const [completionRemarks, setCompletionRemarks] = useState("");
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cycleDetail, setCycleDetail] = useState(null);
  const [cycleStatus, setCycleStatus] = useState("");
  const [cycleRemarks, setCycleRemarks] = useState("");
  const [cycleOpen, setCycleOpen] = useState(false);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleSaving, setCycleSaving] = useState(false);
  const [cycleError, setCycleError] = useState("");
  const [proofOpen, setProofOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [actionError, setActionError] = useState("");
  const isSuperUser = isSuperUserRole();

  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ApiRequestUtils.get(`${API_ROUTES.GET_DRIVER_ADS_REGISTRATION_BY_ID.replace(":registrationId", id)}`);
      setRecord(response?.data || null);
      setSelectedStatus(response?.data?.status || "");
    } catch (err) {
      console.error("Failed to load driver ad registration details:", err);
      setError("Failed to load driver ad registration details.");
    } finally {
      setLoading(false);
    }
  };

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

  const fetchCycleDetail = async (cycleId, cycleRow = null) => {
    if (!cycleId) return;
    setCycleLoading(true);
    setCycleError("");
    try {
      const route = API_ROUTES.GET_DRIVER_ADS_REGISTRATION_CYCLE_BY_ID.replace(":cycleId", cycleId);
      const response = await ApiRequestUtils.get(route);
      setSelectedCycle(cycleRow);
      setCycleDetail(response?.data || cycleRow || null);
      setCycleStatus(response?.data?.status || cycleRow?.status || "");
      setCycleRemarks(response?.data?.remarks || "");
      setProofOpen(false);
      setCycleOpen(true);
    } catch (err) {
      console.error("Failed to load cycle detail:", err);
      setCycleError("Failed to load cycle detail.");
    } finally {
      setCycleLoading(false);
    }
  };

  useEffect(() => {
    if (!cycleOpen) return;
    setCycleRemarks("");
  }, [cycleStatus, cycleOpen]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  useEffect(() => {
    if (!isSuperUser || !id) return;
    fetchActivityLog();
  }, [id, activeTab, showDetails, isSuperUser]);

  const latestNote = useMemo(() => {
    const rows = Array.isArray(activityLog?.notes) ? [...activityLog.notes] : [];
    rows.sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0));
    return rows[0]?.note || "";
  }, [activityLog]);

  const latestFollowUp = useMemo(() => {
    const rows = Array.isArray(activityLog?.followUps) ? [...activityLog.followUps] : [];
    rows.sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0));
    return rows[0] || null;
  }, [activityLog]);

  const latestCompletionRemark = useMemo(() => {
    const rows = Array.isArray(activityLog?.history) ? [...activityLog.history] : [];
    rows.sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0));
    return rows.find((row) => String(row?.currentStatus || "").toUpperCase() === "COMPLETED" && row?.remarks) || null;
  }, [activityLog]);

  useEffect(() => {
    if (!showDetails) return;
    const normalizedStatus = String(selectedStatus || "").toUpperCase();
    setStatusRemarks("");
    setNotes("");
    setFollowUpDate("");
    setFollowUpTime("");
    setFollowUpRemarks("");
    setCompletionRemarks("");

    if (normalizedStatus === "FOLLOW_UP_SCHEDULED" && latestFollowUp) {
      setFollowUpDate(latestFollowUp?.followUpDate || "");
      setFollowUpTime((latestFollowUp?.followUpTime || "").slice(0, 5));
      setFollowUpRemarks(latestFollowUp?.followUpRemarks || "");
      setNotes(latestNote || "");
    }

    if (normalizedStatus === "COMPLETED" && latestCompletionRemark?.remarks) {
      setCompletionRemarks(latestCompletionRemark.remarks || "");
    }

    if (normalizedStatus !== "FOLLOW_UP_SCHEDULED" && normalizedStatus !== "COMPLETED") {
      setStatusRemarks(latestNote || "");
    }
  }, [showDetails, latestNote, latestFollowUp, latestCompletionRemark]);

  const handleUpdateStatus = async () => {
    setActionError("");
    if (!selectedStatus) {
      setActionError("Please select a status.");
      return false;
    }
    if (selectedStatus === "FOLLOW_UP_SCHEDULED" && (!followUpDate || !followUpTime)) {
      setActionError("Follow up date and time are required.");
      return false;
    }
    if (selectedStatus === "COMPLETED" && !completionRemarks.trim()) {
      setActionError("Completion remarks are required.");
      return false;
    }
    try {
      setSaving(true);
      const route = API_ROUTES.UPDATE_DRIVER_ADS_REGISTRATION_STATUS.replace(":registrationId", id);
      const response = await ApiRequestUtils.update(route, {
        status: selectedStatus,
        remarks: statusRemarks.trim() || undefined,
      });
      if (!response?.success) {
        setActionError(response?.message || "Failed to update status.");
        return false;
      }
      setRecord((prev) => (prev ? { ...prev, status: selectedStatus } : prev));
      return true;
    } catch (err) {
      console.error("Failed to update registration status:", err);
      setActionError("Failed to update status.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!notes.trim()) return true;
    try {
      const route = API_ROUTES.UPDATE_DRIVER_ADS_REGISTRATION_NOTES.replace(":registrationId", id);
      const response = await ApiRequestUtils.post(route, { note: notes.trim() });
      if (!response?.success) {
        setActionError(response?.message || "Failed to update notes.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Failed to update registration notes:", err);
      setActionError("Failed to update notes.");
      return false;
    }
  };

  const handleAddFollowUp = async () => {
    if (selectedStatus !== "FOLLOW_UP_SCHEDULED") return true;
    const route = API_ROUTES.POST_FOLLOW_UP.replace(":registrationId", id);
    const response = await ApiRequestUtils.post(route, {
      followUpDate,
      followUpTime,
      followUpRemarks: followUpRemarks.trim() || undefined,
    });
    if (!response?.success) {
      setActionError(response?.message || "Failed to save follow up.");
      return false;
    }
    return true;
  };

  const handleAddCompletion = async () => {
    if (selectedStatus !== "COMPLETED") return true;
    const route = API_ROUTES.STATUS_COMPLETE_REMARKS.replace(":registrationId", id);
    const response = await ApiRequestUtils.post(route, { completionRemarks: completionRemarks.trim() });
    if (!response?.success) {
      setActionError(response?.message || "Failed to save completion remarks.");
      return false;
    }
    return true;
  };

  const handleUpdateCycleStatus = async () => {
    const cycleId = cycleDetail?.id || selectedCycle?.id || selectedCycle?._id;
    if (!cycleId) return;
    setCycleError("");
    if (!cycleStatus) {
      setCycleError("Please select a cycle status.");
      return;
    }
    try {
      setCycleSaving(true);
      const route = API_ROUTES.UPDATE_DRIVER_ADS_REGISTRATION_CYCLE_STATUS.replace(":cycleId", cycleId);
      const response = await ApiRequestUtils.update(route, {
        status: cycleStatus,
        remarks: cycleRemarks.trim() || undefined,
      });
      if (!response?.success) {
        setCycleError(response?.message || "Failed to update cycle status.");
        return;
      }
      await fetchDetail();
      if (isSuperUser) await fetchActivityLog();
      setCycleDetail((prev) => (prev ? { ...prev, status: cycleStatus, remarks: cycleRemarks } : prev));
      setCycleOpen(false);
    } catch (err) {
      console.error("Failed to update cycle status:", err);
      setCycleError("Failed to update cycle status.");
    } finally {
      setCycleSaving(false);
    }
  };

  const handlePrimaryUpdate = async () => {
    setActionError("");
    const statusUpdated = await handleUpdateStatus();
    if (!statusUpdated) return;
    const noteUpdated = await handleAddNote();
    if (!noteUpdated) return;
    const followUpUpdated = await handleAddFollowUp();
    if (!followUpUpdated) return;
    const completionUpdated = await handleAddCompletion();
    if (!completionUpdated) return;
    setShowDetails(false);
    await fetchDetail();
    if (isSuperUser) await fetchActivityLog();
  };

  const getHistoryBadgeClass = (type, value) => {
    const normalized = String(value || "").toUpperCase();
    if (type === "action") {
      if (normalized === "REGISTERED") return "inline-flex items-center rounded-full bg-blue-gray-200 px-3 py-1 text-xs font-semibold text-white";
      if (normalized === "CYCLE_STATUS_UPDATED") return "inline-flex items-center rounded-full bg-fuchsia-800 px-3 py-1 text-xs font-semibold text-white";
      if (normalized === "CYCLE_CLAIM_SUBMITTED") return "inline-flex items-center rounded-full bg-rose-800 px-3 py-1 text-xs font-semibold text-white";
      if (normalized === "STATUS_UPDATED") return "inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-white";
      if (normalized === "COMPLETED") return "inline-flex items-center rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-white";
      return "inline-flex items-center rounded-full border border-slate-400 bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700";
    }
    if (type === "previous") {
      return "inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700";
    }
    if (type === "current") {
      return "inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700";
    }
    return "inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700";
  }

  const registration = record || {};
  const advertisement = registration?.advertisement || {};
  const driver = registration?.driver || {};
  const statusSteps = ["NEW", "IN_PROGRESS", "FOLLOW_UP_SCHEDULED", "COMPLETED"];
  const placements = Array.isArray(registration?.selectedPlacements) ? registration.selectedPlacements : [];
  const cycles = Array.isArray(registration?.cycles) ? registration.cycles : [];
  const totalCycles = Number(registration?.totalCycles || 0);
  const completedCycles = Number(registration?.completedCycles || 0);
  const currentCycleNumber = Number(registration?.currentCycleNumber || 0);
  const progressPercent = totalCycles > 0 ? Math.min(100, Math.round((completedCycles / totalCycles) * 100)) : 0;
  const notesRows = Array.isArray(activityLog?.notes) ? [...activityLog.notes] : [];
  notesRows.sort((a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0));
  const followUpRows = Array.isArray(activityLog?.followUps) ? activityLog.followUps : [];
  const historyRows = Array.isArray(activityLog?.history) ? activityLog.history : [];
  const timelineRows = Array.isArray(activityLog?.timeline) ? activityLog.timeline : [];

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
      <Card className="border border-blue-gray-100">
        <CardBody className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Typography variant="h5" className="text-black">
                Driver Ads Registration Details
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                Registration ID: {registration?.id || id}
              </Typography>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusSteps.map((step, index) => {
                  const currentIndex = statusSteps.indexOf(String(registration?.status));
                  const isCurrent = String(step) === String(registration?.status);
                  const isPassed = currentIndex > index;
                  return (
                    <span
                      key={step}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        isCurrent
                          ? "border-primary bg-primary text-white"
                          : isPassed
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-blue-gray-200 bg-blue-gray-50 text-blue-gray-600"
                      }`}
                    >
                      {formatStatusLabel(step)}
                    </span>
                  );
                })}
              </div>
            </div>
            {/* <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(registration?.status)}`}>
                {formatStatusLabel(registration?.status)}
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-gray-200 bg-blue-gray-50 px-3 py-1 text-xs font-semibold text-blue-gray-700">
                Can Claim: {registration?.canClaim ? "Yes" : "No"}
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-gray-200 bg-blue-gray-50 px-3 py-1 text-xs font-semibold text-blue-gray-700">
                Current Cycle: {registration?.currentCycleNumber ?? "-"}
              </span>
            </div> */}
          </div>

          {error ? <Alert color="red">{error}</Alert> : null}
          {actionError ? <Alert color="red">{actionError}</Alert> : null}

          <DriverSummaryCards
            driver={driver}
            status={registration?.status}
            advertisement={advertisement}
            registration={registration}
            onStatusUpdate={() => setShowDetails(true)}
          />

          <RegistrationSummary
            completedCycles={completedCycles}
            totalCycles={totalCycles}
            currentCycleNumber={currentCycleNumber}
            progressPercent={progressPercent}
            claimableCycleNumber={registration?.claimableCycleNumber}
            summaryCards={[
              <InfoRow key="start-date" label="Start Date" value={formatValue(registration?.startDate)} />,
              <InfoRow key="end-date" label="End Date" value={formatValue(registration?.endDate)} />,
              <InfoRow key="total-cycles" label="Total Cycles" value={registration?.totalCycles ?? "-"} />,
              <InfoRow key="completed-cycles" label="Completed Cycles" value={registration?.completedCycles ?? "-"} />,
              <InfoRow key="pending-cycles" label="Pending Cycles" value={registration?.pendingCycles ?? "-"} />,
              <InfoRow key="claimable-cycle" label="Claimable Cycle" value={registration?.claimableCycleNumber ?? "-"} />,
              <InfoRow key="current-cycle-status" label="Current Cycle Status" value={formatStatusLabel(registration?.currentCycleStatus)} />,
              <InfoRow key="advertisement-active" label="Advertisement Active" value={advertisement?.isActive ? "Yes" : "No"} />,
            ]}
          />

          <div className="rounded-xl border border-blue-gray-100 bg-white p-4">
            
            {cycles.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cycles.map((cycle, index) => (
                  <div key={`${cycle?.cycleNumber || index}`} className="rounded-xl border border-blue-gray-100 bg-blue-gray-50 p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <Typography variant="small" className="font-medium text-blue-gray-600">
                      Cycle {cycle?.cycleNumber ?? "-"}
                    </Typography>
                  </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHistoryBadgeClass("current", cycle?.status)}`}>
                        {formatStatusLabel(cycle?.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm text-blue-gray-700">
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                        <span className="text-xs font-semibold uppercase text-blue-gray-500">Start</span>
                        <span className="font-medium text-blue-gray-900">{formatValue(cycle?.cycleStartDate)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                        <span className="text-xs font-semibold uppercase text-blue-gray-500">End</span>
                        <span className="font-medium text-blue-gray-900">{formatValue(cycle?.cycleEndDate)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" className="bg-primary text-white" onClick={() => fetchCycleDetail(cycle?.id || cycle?._id, cycle)}>
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Typography className="text-sm text-blue-gray-600">No cycles created yet.</Typography>
            )}
          </div>

          {isSuperUser ? (
            <div className="rounded-xl border border-blue-gray-100 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Typography variant="small" className="font-medium text-blue-gray-700">
                  Activity Log
                </Typography>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Super User only
                </span>
              </div>
              <ActivityTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                loading={activityLoading}
                error={activityError}
                rowsRenderer={(tab) => {
                  if (tab === "notes") {
                    return <ActivityLogTable rows={notesRows} headings={["Note", "Added By", "Created At"]} renderRow={(row) => [row?.note || "-", renderUser(row?.addedByUser), formatValue(row?.created_at)]} />;
                  }
                  if (tab === "followUps") {
                    return (
                      <ActivityLogTable
                        rows={followUpRows}
                        headings={["Follow Up Date", "Follow Up Time", "Follow Up Remarks", "Updated By", "Created At"]}
                        renderRow={(row) => [
                      formatDateOnly(row?.followUpDate),
                      row?.followUpTime || "-",
                      row?.followUpRemarks || "-",
                      renderUser(row?.updatedByUser),
                      formatValue(row?.created_at),
                    ]}
                      />
                    );
                  }
                  if (tab === "history") {
                    return (
                      <ActivityLogTable
                        rows={historyRows}
                        headings={["Action", "Previous Status", "Current Status", "Remarks", "Performed By", "Created At"]}
                        renderRow={(row) => [
                      <Chip value={formatStatusLabel(row?.actionPerformed)} className={`${getHistoryBadgeClass("action", row?.actionPerformed)} whitespace-nowrap`} />,
                      <Chip value={formatStatusLabel(row?.previousStatus)} className={`${getHistoryBadgeClass("previous", row?.previousStatus)} whitespace-nowrap`} />,
                      <Chip value={formatStatusLabel(row?.currentStatus)} className={`${getHistoryBadgeClass("current", row?.currentStatus)} whitespace-nowrap`} />,
                      row?.remarks || "-",
                      renderUser(row?.performedByUser),
                      formatValue(row?.created_at),
                    ]}
                      />
                    );
                  }
                  return (
                    <ActivityLogTable
                      rows={timelineRows}
                      headings={["Kind", "Action", "Remarks", "Performed At"]}
                      renderRow={(row) => [
                    row?.kind || "-",
                    formatStatusLabel(row?.actionPerformed || row?.note || row?.followUpRemarks || "-"),
                    row?.remarks || row?.note || row?.followUpRemarks || "-",
                    formatValue(row?.performedAt || row?.addedAt || row?.updatedAt),
                  ]}
                    />
                  );
                }}
              />
            </div>
          ) : null}
        </CardBody>
        <div className="flex justify-center p-4">
          <Button size="sm" className="border-blue-gray-300 bg-primary text-white" onClick={() => navigate("/dashboard/support/driver-ads-reg")}>
            Back
          </Button>
        </div>
      </Card>

      <StatusUpdateModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        statusOptions={getStatusOptions(selectedStatus || "NEW", STATUS_FLOW)}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onStatusUpdate={handlePrimaryUpdate}
        updatingStatus={saving}
        statusError={actionError}
        statusRemarks={statusRemarks}
        onStatusRemarksChange={setStatusRemarks}
        completionRemarks={completionRemarks}
        onCompletionRemarksChange={setCompletionRemarks}
        followUpDate={followUpDate}
        followUpTime={followUpTime}
        followUpRemarks={followUpRemarks}
        onFollowUpDateChange={setFollowUpDate}
        onFollowUpTimeChange={setFollowUpTime}
        onFollowUpRemarksChange={setFollowUpRemarks}
        notes={notes}
        onNotesChange={setNotes}
        latestNote={latestNote}
      />

      <CycleReviewDialog
        open={cycleOpen}
        onClose={() => setCycleOpen(false)}
        cycleNumber={cycleDetail?.cycleNumber || selectedCycle?.cycleNumber || "-"}
        cycleLoading={cycleLoading}
        cycleError={cycleError}
        infoRows={[
          <InfoRow key="status" label="Status" value={formatStatusLabel(cycleDetail?.status || selectedCycle?.status)} />,
          <InfoRow key="cycle-number" label="Cycle Number" value={cycleDetail?.cycleNumber || selectedCycle?.cycleNumber || "-"} />,
          <InfoRow key="start-date" label="Start Date" value={formatValue(cycleDetail?.cycleStartDate || selectedCycle?.cycleStartDate)} />,
          <InfoRow key="end-date" label="End Date" value={formatValue(cycleDetail?.cycleEndDate || selectedCycle?.cycleEndDate)} />,
          <InfoRow key="submitted-at" label="Submitted At" value={formatValue(cycleDetail?.claimSubmittedAt)} />,
          <InfoRow key="registration-id" label="Registration ID" value={cycleDetail?.registrationId || registration?.id || "-"} />,
        ]}
        claimImages={Array.isArray(cycleDetail?.claimPayload?.claimImages) ? cycleDetail.claimPayload.claimImages : []}
        onOpenProof={() => setProofOpen(true)}
        cycleStatus={cycleStatus}
        onCycleStatusChange={(value) => {
          setCycleStatus(value);
          setCycleRemarks("");
        }}
        cycleRemarks={cycleRemarks}
        onCycleRemarksChange={setCycleRemarks}
        statusOptions={["CLAIM_SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PAID", "COMPLETED"]}
        formatStatusLabel={formatStatusLabel}
        onSave={handleUpdateCycleStatus}
        cycleSaving={cycleSaving}
      />

      <ClaimProofDialog
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        cycleNumber={cycleDetail?.cycleNumber || selectedCycle?.cycleNumber || "-"}
        claimImages={Array.isArray(cycleDetail?.claimPayload?.claimImages) ? cycleDetail.claimPayload.claimImages : []}
      />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-blue-gray-100 bg-blue-gray-50 p-3">
      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-500">
        {label}
      </Typography>
      <Typography className="text-sm font-semibold text-blue-gray-900">{value}</Typography>
    </div>
  );
}

export default DriverAdsRegistrationDetails;
