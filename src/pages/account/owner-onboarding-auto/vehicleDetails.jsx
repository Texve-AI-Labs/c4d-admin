import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Typography, Button, Chip, Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import AccountCreationTabs from './AccountCreationTabs';
import DriverAccountBookingNotes from '@/components/DriverAccountBookingNotes';

const toTitle = (value) => {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusColor = (status) => {
  if (status === "VERIFIED" || status === "UPLOADED" || status === "APPROVED") return "green";
  if (status === "PENDING" || status === "PENDING VERIFICATION" || status === "PENDING_VERIFICATION") return "amber";
  if (status === "PENDING UPLOAD") return "blue-gray";
  if (status === "NOT_INTERESTED") return "yellow";
  if (status === "NO_RESPONSE") return "gray";
  if (status === "INVALID") return "orange";
  if (status === "DECLINED") return "red";
  return "blue-gray";
};

const getStatusLabel = (status) => {
  if (status === "PENDING" || status === "PENDING VERIFICATION" || status === "PENDING_VERIFICATION") {
    return "Pending Verification";
  }
  if (status === "PENDING UPLOAD") return "Pending Upload";
  return toTitle(status);
};

const VehicleOnboardingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [uploadingByType, setUploadingByType] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) fetchOnboardingDetails();
  }, [id]);

  const fetchOnboardingDetails = async () => {
    try {
      setLoading(true);
      const res = await ApiRequestUtils.get(API_ROUTES.ADMIN_ONBOARDING_BY_ID + id);
      const payload = res?.data || res?.result || null;
      setOnboardingData(payload);
    } catch (err) {
      console.error("Failed to load vehicle onboarding details", err);
      setOnboardingData(null);
    } finally {
      setLoading(false);
    }
  };

  const account = useMemo(() => {
    if (!onboardingData) return {};
    if (onboardingData?.data?.id) return onboardingData.data;
    if (onboardingData?.id) return onboardingData;
    return {};
  }, [onboardingData]);
  const requiredVehicleDocs = account?.requiredDocuments?.vehicle || [];
  const vehicleUploads = account?.uploads?.vehicle || [];
  const vehicleStageStatus = account?.vehicleDocumentStatus?.status || "PENDING UPLOAD";
  const vehiclePendingTypes = account?.vehicleDocumentStatus?.pendingTypes || [];
  const vehicleApprovedTypes = account?.vehicleDocumentStatus?.approvedTypes || [];

  const rows = useMemo(() => {
    return requiredVehicleDocs.map((type) => {
      const proof = vehicleUploads.find((item) => item?.type === type);
      let resolvedStatus = "PENDING UPLOAD";

      if (!proof?.image1) {
        resolvedStatus = "PENDING UPLOAD";
      } else if (proof?.status) {
        resolvedStatus = proof.status;
      } else if (vehicleApprovedTypes.includes(type)) {
        resolvedStatus = "VERIFIED";
      } else if (vehiclePendingTypes.includes(type)) {
        resolvedStatus = "PENDING";
      } else {
        resolvedStatus = "UPLOADED";
      }

      return {
        type,
        proof,
        status: resolvedStatus,
        createdAt: proof?.created_at ? moment(proof.created_at).format("DD-MM-YYYY") : "-",
      };
    });
  }, [requiredVehicleDocs, vehicleUploads, vehiclePendingTypes, vehicleApprovedTypes]);
  // const canContinue = rows.length > 0 && !rows.some((row) => ["PENDING UPLOAD", "INVALID"].includes(row.status));

  const isSingleFileDocType = (docType) => ["PHOTO", "INSURANCE", "PERMIT"].includes(docType);

  const handleUploadDocument = async (event, row) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    const maxSize = 10 * 1024 * 1024;
    const singleFile = isSingleFileDocType(row.type);

    if (singleFile && files.length > 1) {
      window.alert("Only one document is allowed for this type.");
      return;
    }
    if (!singleFile && files.length > 2) {
      window.alert("You can upload a maximum of two documents.");
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        window.alert("Invalid file type. Please upload JPG, PNG, or PDF.");
        return;
      }
      if (file.size > maxSize) {
        window.alert("File size exceeds 10MB limit.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("type", row.type);
    formData.append("accountId", id);

    if (files[0]) {
      formData.append("image1", files[0]);
      formData.append("extImage1", files[0].name.split(".").pop() || "");
      formData.append("fileTypeImage1", files[0].type);
    }

    if (files[1] && !singleFile) {
      formData.append("image2", files[1]);
      formData.append("extImage2", files[1].name.split(".").pop() || "");
      formData.append("fileTypeImage2", files[1].type);
    }

    try {
      setUploadingByType((prev) => ({ ...prev, [row.type]: true }));
      if (row.proof?.id) {
        formData.append("documentId", row.proof.id);
        await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_PHOTO, formData);
      } else {
        await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
      }
      await fetchOnboardingDetails();
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setUploadingByType((prev) => ({ ...prev, [row.type]: false }));
      event.target.value = "";
    }
  };

  const handleStatusChange = async (documentId, status) => {
    if (!documentId) return;
    try {
      setUpdatingStatus(true);
      const loggedInUser = localStorage.getItem("loggedInUser");
      const parsedUser = loggedInUser ? JSON.parse(loggedInUser) : {};
      const verifiedBy = parsedUser?.name || "Admin";
      const payload = { documentId, status, verifiedBy };
      const response = await ApiRequestUtils.update(API_ROUTES.GET_DOCUMENT_DETAILS_LIST, payload);
      if (response?.success) {
        await fetchOnboardingDetails();
        setModalData(null);
      } else {
        window.alert("Failed to update status. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update status", error);
      window.alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <AccountCreationTabs activeStage={3} />
      <div className="mb-4">
        <Typography variant="h6" color="blue-gray">Vehicle Document Details</Typography>
        <Typography className="text-sm text-blue-gray-700 mt-1">Account ID: {id}</Typography>
        {/* <Typography className="text-sm text-blue-gray-700 mt-1">Account Name: {account?.name || "-"}</Typography> */}
        <p className="text-sm text-gray-600 mt-1">
          Document upload is required to verify your account and ensure compliance with our policies.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Please upload the following documents:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          {requiredVehicleDocs.map((docType) => (
            <li key={docType}>
              <strong>{toTitle(docType)}:</strong> {["PHOTO", "INSURANCE", "PERMIT"].includes(docType) ? "1 document" : "2 documents"}
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <Chip
            variant="ghost"
            color={getStatusColor(vehicleStageStatus)}
            value={`Vehicle Status: ${getStatusLabel(vehicleStageStatus)}`}
            className="py-0.5 px-2 text-[11px] font-medium normal-case w-fit"
          />
        </div>
      </div>

      <Card>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Document", "Status", "View Details", "Created At", "Action"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.type}>
                  <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-900">{toTitle(row.type)}</Typography>
                  </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Chip
                        variant="ghost"
                        color={getStatusColor(row.status)}
                        value={getStatusLabel(row.status)}
                        className="py-0.5 px-2 text-[11px] font-medium normal-case w-fit"
                      />
                    </td>
                  <td className="py-3 px-5 border-b border-blue-gray-50">
                    {row.proof?.image1 ? (
                      <Typography
                        className="text-xs font-semibold text-blue-700 underline cursor-pointer"
                        onClick={() =>
                          setModalData({
                            id: row.proof?.id,
                            type: row.type,
                            status: row.status,
                            image1: row.proof?.image1,
                            image2: row.proof?.image2,
                          })
                        }
                      >
                        View Details
                      </Typography>
                    ) : (
                      <Typography className="text-xs font-semibold text-blue-gray-400">-</Typography>
                    )}
                  </td>
                  <td className="py-3 px-5 border-b border-blue-gray-50">
                    <Typography className="text-xs font-semibold text-blue-gray-900">{row.createdAt}</Typography>
                  </td>
                  <td className="py-3 px-5 border-b border-blue-gray-50">
                    {["PENDING UPLOAD", "INVALID"].includes(row.status) ? (
                      <>
                        <label
                          htmlFor={`upload-${row.type}`}
                          className="inline-block text-center text-white border border-gray-400 bg-primary rounded-lg px-4 py-1 cursor-pointer text-xs"
                        >
                          {uploadingByType[row.type] ? "Uploading..." : row.status === "INVALID" ? "Upload Again" : "Upload"}
                        </label>
                        <input
                          type="file"
                          id={`upload-${row.type}`}
                          className="hidden"
                          accept="image/*,application/pdf"
                          multiple={!isSingleFileDocType(row.type)}
                          onChange={(e) => handleUploadDocument(e, row)}
                          disabled={Boolean(uploadingByType[row.type])}
                        />
                      </>
                    ) : (
                      <Typography className="text-xs font-semibold text-blue-gray-400">-</Typography>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <DriverAccountBookingNotes accountId={id} />

      <div className="flex flex-row mt-4">
        <Button
          fullWidth
          onClick={() => navigate("/dashboard/vendors/account/owner-onboarding-auto")}
          // disabled={!canContinue}
          className={`my-2 mx-2 ${ColorStyles.backButton}`}
        >
          Continue
        </Button>
      </div>
      {/* {!canContinue && (
        <Typography className="text-xs text-red-600 font-medium mt-1">
          Resolve all Pending Upload and Invalid documents to continue.
        </Typography>
      )} */}

      {modalData && (
        <Dialog open={Boolean(modalData)} handler={() => setModalData(null)} size="md">
          <DialogHeader>
            <div className="flex justify-between items-center w-full">
              <Typography variant="h6">Document Preview</Typography>
              <button className="text-gray-600 hover:text-gray-900" onClick={() => setModalData(null)}>
                X
              </button>
            </div>
          </DialogHeader>
          <DialogBody divider>
            <div className={`flex ${modalData.image2 ? "flex-row space-x-6" : "flex-col"} justify-center`}>
              {modalData.image1 && (
                <img src={modalData.image1} alt="Document 1 preview" className="rounded-lg shadow-md w-full" style={{ height: "45vh", maxWidth: "45%", objectFit: "contain" }} />
              )}
              {modalData.image2 && (
                <img src={modalData.image2} alt="Document 2 preview" className="rounded-lg shadow-md w-full" style={{ height: "45vh", maxWidth: "45%", objectFit: "contain" }} />
              )}
            </div>
            <div className="flex justify-center mt-4">
              {modalData.image1 && (
                <a
                  href={modalData.image1}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                >
                  Download Image 1
                </a>
              )}
              {modalData.image2 && (
                <a
                  href={modalData.image2}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                >
                  Download Image 2
                </a>
              )}
            </div>
            {["PENDING VERIFICATION", "NOT_INTERESTED", "NO_RESPONSE", "INVALID"].includes(vehicleStageStatus) &&
              ["PENDING", "PENDING VERIFICATION", "PENDING_VERIFICATION"].includes(modalData?.status) && (
              <div className="flex justify-center gap-3 mt-4 flex-wrap">
                {["APPROVED", "NOT_INTERESTED", "NO_RESPONSE", "INVALID"].map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(modalData?.id, nextStatus)}
                    className={`px-3 py-1 rounded-md text-white disabled:opacity-60 text-xs ${
                      nextStatus === "APPROVED"
                        ? "bg-green-600 hover:bg-green-700"
                        : nextStatus === "NOT_INTERESTED"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : nextStatus === "NO_RESPONSE"
                            ? "bg-gray-600 hover:bg-gray-700"
                            : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {updatingStatus ? "Updating..." : toTitle(nextStatus)}
                  </button>
                ))}
              </div>
            )}
            {["NOT_INTERESTED", "NO_RESPONSE"].includes(modalData?.status) && (
              <div className="flex justify-center gap-3 mt-4 flex-wrap">
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(modalData?.id, "PENDING")}
                  className="px-3 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-xs"
                >
                  {updatingStatus ? "Updating..." : "Reopen"}
                </button>
              </div>
            )}
          </DialogBody>
        </Dialog>
      )}
    </div>
  );
};

export default VehicleOnboardingDetails;
