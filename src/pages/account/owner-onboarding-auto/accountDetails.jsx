import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Typography, Button, Chip, Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles, STATE_LIST, THALUK_LIST } from "@/utils/constants";
import { parseAddressParts } from "@/utils/addressUtils";
import AccountCreationTabs from './AccountCreationTabs';
import DriverAccountBookingNotes from '@/components/DriverAccountBookingNotes';
import LocationInput from "./LocationInput";

const isPdfFile = (src = "") =>
  String(src).toLowerCase().includes(".pdf") || String(src).toLowerCase().startsWith("data:application/pdf");

const DocumentPreview = ({ src, zoom = 1, onZoomIn, onZoomOut }) => {
  if (!src) return null;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (isPdfFile(src)) {
    return (
      <div className="w-full">
        <div className="w-full flex justify-end gap-2 mb-2">
          <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomOut}>-</Button>
          <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomIn}>+</Button>
        </div>
        <div
          className={`w-full h-[38vh] md:h-[44vh] border border-gray-200 bg-white overflow-hidden ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="w-full h-full"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <iframe src={src} className="w-full h-full pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full flex justify-end gap-2 mb-2">
        <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomOut}>-</Button>
        <Button size="sm" className="bg-blue-gray-700 px-3 py-1 text-xs" onClick={onZoomIn}>+</Button>
      </div>
      <div
        className={`w-full h-[38vh] md:h-[44vh] border border-gray-200 bg-white p-2 overflow-hidden ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt="Document preview"
          className="w-full h-full object-contain select-none"
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
};

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

const getReviewStatus = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (["UPLOADED","PENDING","PENDING UPLOAD"].includes(normalized)) return "PENDING VERIFICATION";
  return normalized;
};

const AccountOnboardingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [uploadingByType, setUploadingByType] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [previewZoom, setPreviewZoom] = useState({});
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address: "",
    street: "",
    thaluk: "",
    district: "",
    state: "",
    pincode: "",
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [ownerStatus, setOwnerStatus] = useState("InActive");
  const [blockedReason, setBlockedReason] = useState("");
  const [updatingOwnerStatus, setUpdatingOwnerStatus] = useState(false);
  const [serviceAreas, setServiceAreas] = useState([]);

  useEffect(() => {
    if (id) fetchOnboardingDetails();
  }, [id]);

  useEffect(() => {
    const fetchServiceAreas = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
        if (response?.success) {
          setServiceAreas(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error("Failed to load service areas", err);
      }
    };

    fetchServiceAreas();
  }, []);

  const fetchOnboardingDetails = async () => {
    try {
      setLoading(true);
      const res = await ApiRequestUtils.get(API_ROUTES.ADMIN_ONBOARDING_BY_ID + id);
      const payload = res?.data || res?.result || null;
      setOnboardingData(payload);
    } catch (err) {
      console.error("Failed to load account onboarding details", err);
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

  useEffect(() => {
    setOwnerStatus(account?.ownerStatus || "InActive");
    setBlockedReason(account?.blockedReason || "");
    setAddressForm({
      address: account?.address || "",
      street: account?.street || "",
      thaluk: account?.thaluk || "",
      district: account?.district || "",
      state: account?.state || "",
      pincode: account?.pincode || "",
    });
    setIsSameAddress(Boolean(account?.address && account?.street && account?.district));
    setAddressSaved(Boolean(
      account?.address &&
      account?.street &&
      account?.thaluk &&
      account?.district &&
      account?.state &&
      account?.pincode
    ));
  }, [
    account?.ownerStatus,
    account?.blockedReason,
    account?.address,
    account?.street,
    account?.thaluk,
    account?.district,
    account?.state,
    account?.pincode,
  ]);
  const requiredAccountDocs = account?.requiredDocuments?.account || [];
  const accountUploads = account?.uploads?.account || [];
  const accountStageStatus = account?.accountDocumentStatus?.status || "PENDING UPLOAD";
  const accountPendingTypes = account?.accountDocumentStatus?.pendingTypes || [];
  const accountApprovedTypes = account?.accountDocumentStatus?.approvedTypes || [];

  const rows = useMemo(() => {
    return requiredAccountDocs.map((type) => {
      const proof = accountUploads.find((item) => item?.type === type);
      let resolvedStatus = "PENDING UPLOAD";

      if (!proof?.image1) {
        resolvedStatus = "PENDING UPLOAD";
      } else if (proof?.status) {
        resolvedStatus = proof.status;
      } else if (accountApprovedTypes.includes(type)) {
        resolvedStatus = "VERIFIED";
      } else if (accountPendingTypes.includes(type)) {
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
  }, [requiredAccountDocs, accountUploads, accountPendingTypes, accountApprovedTypes]);
  const previewableTypes = useMemo(() => rows.filter((row) => row?.proof?.image1).map((row) => row.type), [rows]);
  const allAccountDocsUploaded = useMemo(
    () => rows.length > 0 && rows.every((row) => Boolean(row?.proof?.image1)),
    [rows]
  );
  const shouldShowPreviewAndAddress = useMemo(() => {
    const normalizedStatus = String(accountStageStatus || "").toUpperCase();
    return allAccountDocsUploaded && normalizedStatus === "VERIFIED";
  }, [allAccountDocsUploaded, accountStageStatus]);
  const getZoomKey = (docType, imageIndex) => `${docType || "UNKNOWN"}_${imageIndex}`;
  const getZoomValue = (docType, imageIndex) => previewZoom[getZoomKey(docType, imageIndex)] || 1;
  const updateZoom = (docType, imageIndex, direction) => {
    const key = getZoomKey(docType, imageIndex);
    setPreviewZoom((prev) => {
      const current = prev[key] || 1;
      const next = direction === "in"
        ? Math.min(2.5, Number((current + 0.1).toFixed(2)))
        : Math.max(0.6, Number((current - 0.1).toFixed(2)));
      return { ...prev, [key]: next };
    });
  };

  useEffect(() => {
    if (!selectedDocType && previewableTypes.length > 0) {
      setSelectedDocType(previewableTypes[0]);
    }
  }, [previewableTypes, selectedDocType]);
  const isAddressFormComplete = useMemo(() => {
    const address = String(addressForm.address || "").trim();
    const street = String(addressForm.street || "").trim();
    const thaluk = String(addressForm.thaluk || "").trim();
    const district = String(addressForm.district || "").trim();
    const state = String(addressForm.state || "").trim();
    const pincode = String(addressForm.pincode || "").trim();

    return (
      address.length >= 5 &&
      street.length >= 2 &&
      thaluk.length > 0 &&
      THALUK_LIST.some((item) => item.value === thaluk || item.label === thaluk) &&
      district.length >= 2 &&
      state.length > 0 &&
      STATE_LIST.some((item) => item.value === state || item.label === state) &&
      /^\d{6}$/.test(pincode)
    );
  }, [addressForm.address, addressForm.street, addressForm.thaluk, addressForm.district, addressForm.state, addressForm.pincode]);
  const missingAddressFields = useMemo(() => {
    const address = String(addressForm.address || "").trim();
    const street = String(addressForm.street || "").trim();
    const thaluk = String(addressForm.thaluk || "").trim();
    const district = String(addressForm.district || "").trim();
    const state = String(addressForm.state || "").trim();
    const pincode = String(addressForm.pincode || "").trim();
    const missing = [];

    if (address.length < 5) missing.push("Current Address");
    if (street.length < 2) missing.push("Street Name");
    if (!thaluk || !THALUK_LIST.some((item) => item.value === thaluk || item.label === thaluk)) missing.push("Thaluk");
    if (district.length < 2) missing.push("District");
    if (!state || !STATE_LIST.some((item) => item.value === state || item.label === state)) missing.push("State");
    if (!/^\d{6}$/.test(pincode)) missing.push("Pincode");

    return missing;
  }, [addressForm.address, addressForm.street, addressForm.thaluk, addressForm.district, addressForm.state, addressForm.pincode]);
  const canContinue = shouldShowPreviewAndAddress && isAddressFormComplete && addressSaved;
  const missingAccountDocuments = useMemo(() => {
    return rows
      .filter((row) => !["VERIFIED", "APPROVED"].includes(String(row.status || "").toUpperCase()))
      .map((row) => toTitle(row.type))
      .filter(Boolean);
  }, [rows]);
  const canContinueMessageParts = [];
  if (shouldShowPreviewAndAddress && !addressSaved) {
    canContinueMessageParts.push("Save the address details to continue.");
  }
  if (missingAddressFields.length > 0) {
    canContinueMessageParts.push(`Fill these address fields: ${missingAddressFields.join(", ")}.`);
  }
  if (missingAccountDocuments.length > 0) {
    canContinueMessageParts.push(`Approve these account documents: ${missingAccountDocuments.join(", ")}.`);
  }
  const canContinueMessage = canContinueMessageParts.join(" ");

  const isSingleFileDocType = (docType) => ["PHOTO", "INSURANCE", "PERMIT","VEHICLE_PHOTO"].includes(docType);

  const handleAddressInputChange = (key, value) => {
    setAddressForm((prev) => ({ ...prev, [key]: value }));
    setAddressErrors((prev) => ({ ...prev, [key]: "" }));
    setAddressSaved(false);
  };

  const parseAddress = (address, addressComponents = []) => parseAddressParts({
    addressText: address,
    addressComponents,
  });

  const searchLocations = async (query) => {
    if (query.length <= 2) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
      if (data?.success && data?.data) setAddressSuggestions(data.data);
    } catch (err) {
      console.error("Failed to fetch address suggestions", err);
    }
  };

  const handleAddressSelect = (place) => {
    if (!place?.formatted_address) return;
    setAddressSaved(false);
    handleAddressInputChange("address", place.formatted_address);
    if (!isSameAddress) return;
    const parsed = parseAddress(place.formatted_address, place.address_components);
    setAddressForm((prev) => ({
      ...prev,
      street: parsed.street || "",
      thaluk: parsed.taluk || "",
      district: parsed.district || "",
      state: parsed.state || "",
      pincode: parsed.pincode || "",
    }));
  };

  const validateAddressForm = () => {
    const nextErrors = {};
    const address = String(addressForm.address || "").trim();
    const street = String(addressForm.street || "").trim();
    const thaluk = String(addressForm.thaluk || "").trim();
    const district = String(addressForm.district || "").trim();
    const state = String(addressForm.state || "").trim();
    const pincode = String(addressForm.pincode || "").trim();

    if (!address) nextErrors.address = "Current Address is required";
    else if (address.length < 5) nextErrors.address = "Current Address must be at least 5 characters";

    if (!street) nextErrors.street = "Street Name is required";
    else if (street.length < 2) nextErrors.street = "Street Name must be at least 2 characters";

    if (!thaluk) nextErrors.thaluk = "Thaluk is required";
    else if (!THALUK_LIST.some((item) => item.value === thaluk || item.label === thaluk)) nextErrors.thaluk = "Please select a valid Thaluk";

    if (!district) nextErrors.district = "District is required";
    else if (district.length < 2) nextErrors.district = "District must be at least 2 characters";

    if (!state) nextErrors.state = "State is required";
    else if (!STATE_LIST.some((item) => item.value === state || item.label === state)) nextErrors.state = "Please select a valid State";

    if (!pincode) nextErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(pincode)) nextErrors.pincode = "Pincode must be exactly 6 digits";

    setAddressErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveAddressDetails = async () => {
    if (!account?.id) return false;
    if (!validateAddressForm()) return false;
    try {
      setSavingAddress(true);
      const payload = {
        type: account?.type || "",
        name: account?.name || "",
        phoneNumber: account?.phoneNumber || "",
        email: account?.email || "",
        source: account?.source || "",
        accountId: account?.id,
        address: String(addressForm.address || "").trim(),
        street: String(addressForm.street || "").trim(),
        thaluk: String(addressForm.thaluk || "").trim(),
        district: String(addressForm.district || "").trim(),
        state: String(addressForm.state || "").trim(),
        pincode: String(addressForm.pincode || "").trim(),
      };
      const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_ACCOUNT, payload);
      if (!response?.success) {
        window.alert(response?.message || "Failed to save address details.");
        return false;
      }
      setAddressSaved(true);
      await fetchOnboardingDetails();
      return true;
    } catch (error) {
      console.error("Failed to save address details", error);
      window.alert("Failed to save address details.");
      return false;
    } finally {
      setSavingAddress(false);
    }
  };

  const handleContinue = () => {
    if (shouldShowPreviewAndAddress && !addressSaved) {
      const addressSection = document.getElementById("account-address-details");
      if (addressSection) addressSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (shouldShowPreviewAndAddress && !validateAddressForm()) {
      const addressSection = document.getElementById("account-address-details");
      if (addressSection) addressSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate(`/dashboard/vendors/account/owner-onboarding-auto/details/vehicle/${id}`);
  };

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

  const handleOwnerStatusUpdate = async () => {
    if (!account?.id) return;
    if (ownerStatus === "Blocked" && !blockedReason.trim()) {
      window.alert("Please enter blocked reason.");
      return;
    }

    try {
      setUpdatingOwnerStatus(true);
      const formData = {
        type: account?.type || "",
        name: account?.name || "",
        phoneNumber: account?.phoneNumber || "",
        email: account?.email || "",
        address: account?.address || "",
        street: account?.street || "",
        thaluk: account?.thaluk || "",
        district: account?.district || "",
        state: account?.state || "",
        pincode: account?.pincode || "",
        source: account?.source || "",
        accountId: account?.id,
        ownerStatus,
        blockedReason: ownerStatus === "Blocked" ? blockedReason : "",
      };
      const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_ACCOUNT, formData);
      if (response?.success) {
        await fetchOnboardingDetails();
      } else {
        window.alert(response?.message || "Failed to update account status.");
      }
    } catch (error) {
      console.error("Failed to update account status", error);
      window.alert("Failed to update account status.");
    } finally {
      setUpdatingOwnerStatus(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <AccountCreationTabs activeStage={2} />
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <Typography variant="h6" color="blue-gray">Account Document Details</Typography>
            <Typography className="text-sm text-blue-gray-700 mt-1">Account ID: {id}</Typography>
          </div>          
        </div>
        {/* <Typography className="text-sm text-blue-gray-700 mt-1">Account Name: {account?.name || "-"}</Typography> */}
        <p className="text-sm text-gray-600 mt-1">
          Document upload is required to verify your account and ensure compliance with our policies.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Please upload the following documents:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          {requiredAccountDocs.map((docType) => (
            <li key={docType}>
              <strong>{toTitle(docType)}:</strong> {["PHOTO", "INSURANCE", "PERMIT","VEHICLE_PHOTO"].includes(docType) ? "1 document" : "2 documents"}
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <Chip
            variant="ghost"
            color={getStatusColor(accountStageStatus)}
            value={`Account Status: ${getStatusLabel(accountStageStatus)}`}
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
                            status: getReviewStatus(row.status),
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
                    {["PENDING UPLOAD", "INVALID", "DECLINED"].includes(row.status) ? (
                      <>
                        <label
                          htmlFor={`upload-${row.type}`}
                          className="inline-block text-center text-white border border-gray-400 bg-primary rounded-lg px-4 py-1 cursor-pointer text-xs"
                        >
                          {uploadingByType[row.type] ? "Uploading..." : ["INVALID", "DECLINED"].includes(row.status) ? "Upload Again" : "Upload"}
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
        {shouldShowPreviewAndAddress && previewableTypes.length > 0 && (
            <div id="account-address-details" className="px-5 pb-4">
              <Typography className="text-sm font-medium text-gray-700 mb-2">Account Documents Preview</Typography>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="lg:w-[26%] border border-blue-gray-100 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-blue-gray-100 bg-blue-gray-50">
                    <Typography className="text-xs font-bold uppercase text-blue-gray-500">Type</Typography>
                  </div>
                  {previewableTypes.map((docType, idx) => (
                    <button
                      key={docType}
                      type="button"
                      onClick={() => setSelectedDocType(docType)}
                      className={`w-full text-left px-3 py-3 ${idx !== previewableTypes.length - 1 ? "border-b border-blue-gray-100" : ""} ${selectedDocType === docType ? "bg-blue-50" : "bg-white hover:bg-blue-gray-50"}`}
                    >
                      <Typography className="text-sm font-semibold text-blue-gray-900">{docType}</Typography>
                    </button>
                  ))}
                </div>
                <div className="lg:w-[74%]">
                  <div className="w-full max-w-4xl min-h-[52vh] border border-blue-gray-100 rounded-lg bg-white p-3">
                    <div className="space-y-4">
                      <Typography className="text-xs font-semibold text-blue-gray-700">{selectedDocType}</Typography>
                      {rows.find((row) => row.type === selectedDocType)?.proof?.image1 ? (
                        <div className="max-h-[56vh] overflow-y-auto overflow-x-hidden pr-1">
                          <div className={`grid w-full gap-3 ${rows.find((row) => row.type === selectedDocType)?.proof?.image2 ? "grid-cols-2" : "grid-cols-1"}`}>
                            <DocumentPreview
                              src={rows.find((row) => row.type === selectedDocType)?.proof?.image1}
                              zoom={getZoomValue(selectedDocType, 1)}
                              onZoomOut={() => updateZoom(selectedDocType, 1, "out")}
                              onZoomIn={() => updateZoom(selectedDocType, 1, "in")}
                            />
                            {rows.find((row) => row.type === selectedDocType)?.proof?.image2 && (
                              <DocumentPreview
                                src={rows.find((row) => row.type === selectedDocType)?.proof?.image2}
                                zoom={getZoomValue(selectedDocType, 2)}
                                onZoomOut={() => updateZoom(selectedDocType, 2, "out")}
                                onZoomIn={() => updateZoom(selectedDocType, 2, "in")}
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-[38vh] md:h-[44vh] border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-500">
                          No document available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {shouldShowPreviewAndAddress && previewableTypes.length > 0 && (
            <div className="px-5 pb-4">
              <Typography className="text-sm font-semibold text-blue-gray-800 mb-3">Address Details</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address" className="text-sm font-medium text-gray-700">Current Address</label>
                  <LocationInput
                    field={{ name: "address", value: addressForm.address, onBlur: () => {} }}
                    form={{
                      setFieldValue: (_, value) => handleAddressInputChange("address", value),
                      setFieldTouched: () => {},
                      validateField: () => {},
                    }}
                    suggestions={addressSuggestions}
                    onSearch={searchLocations}
                    onSelect={handleAddressSelect}
                  />
                  {addressErrors.address ? <Typography className="text-red-500 text-xs mt-1">{addressErrors.address}</Typography> : null}
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={isSameAddress}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsSameAddress(checked);
                      setAddressSaved(false);
                      if (!checked) return;
                      const parsed = parseAddress(addressForm.address);
                      setAddressForm((prev) => ({
                        ...prev,
                        street: parsed.street || prev.street || "",
                        thaluk: parsed.taluk || prev.thaluk || "",
                        district: parsed.district || prev.district || "",
                        state: parsed.state || prev.state || "",
                        pincode: parsed.pincode || prev.pincode || "",
                      }));
                      setAddressErrors((prev) => ({
                        ...prev,
                        street: "",
                        thaluk: "",
                        district: "",
                        state: "",
                        pincode: "",
                      }));
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="sameAddress" className="text-sm text-gray-700">Same as Current Address</label>
                </div>
                <div>
                  <label htmlFor="street" className="text-sm font-medium text-gray-700">Street Name</label>
                  <input
                    id="street"
                    value={addressForm.street}
                    onChange={(e) => handleAddressInputChange("street", e.target.value)}
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                  />
                  {addressErrors.street ? <Typography className="text-red-500 text-xs mt-1">{addressErrors.street}</Typography> : null}
                </div>
                <div>
                  <label htmlFor="thaluk" className="text-sm font-medium text-gray-700">Thaluk</label>
                  <select
                    id="thaluk"
                    value={addressForm.thaluk}
                    onChange={(e) => handleAddressInputChange("thaluk", e.target.value)}
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                  >
                    <option value="">Select Thaluk</option>
                    {THALUK_LIST.map((thaluk) => (
                      <option key={thaluk.value} value={thaluk.value}>{thaluk.label}</option>
                    ))}
                  </select>
                  {addressErrors.thaluk ? <Typography className="text-red-500 text-xs mt-1">{addressErrors.thaluk}</Typography> : null}
                </div>
                <div>
                  <label htmlFor="district" className="text-sm font-medium text-gray-700">District</label>
                <select
                    id="district"
                    value={addressForm.district}
                    onChange={(e) => handleAddressInputChange("district", e.target.value)}
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                >
                  <option value="">Select District</option>
                  {serviceAreas.map((area) => (
                    <option key={area.id} value={area.name}>
                      {area.name}
                    </option>
                  ))}
                </select>
                  {addressErrors.district ? <Typography className="text-red-500 text-xs mt-1">{addressErrors.district}</Typography> : null}
                </div>
                <div>
                  <label htmlFor="state" className="text-sm font-medium text-gray-700">State</label>
                  <select
                    id="state"
                    value={addressForm.state}
                    onChange={(e) => handleAddressInputChange("state", e.target.value)}
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                  >
                    <option value="">Select State</option>
                    {STATE_LIST.map((state) => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                  {addressErrors.state ? <Typography className="text-red-500 text-xs mt-1">{addressErrors.state}</Typography> : null}
                </div>
                <div>
                  <label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</label>
                  <input
                    id="pincode"
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => handleAddressInputChange("pincode", e.target.value.replace(/\D/g, ""))}
                    className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                  />
                  {addressErrors.pincode ? <Typography className="text-red-500 text-xs mt-1">{addressErrors.pincode}</Typography> : null}
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={saveAddressDetails} className={ColorStyles.continueButtonColor} disabled={savingAddress}>
                  {savingAddress ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </div>
          )}
                  <DriverAccountBookingNotes accountId={id} />
      </Card>

      <div className="flex flex-row mt-4">
        <Button
          fullWidth
          onClick={handleContinue}
          disabled={!canContinue}
          className={`my-2 mx-2 ${ColorStyles.backButton}`}
        >
          Continue
        </Button>
      </div>
      {!canContinue && canContinueMessage ? (
        <Typography className="mt-1 text-xs font-medium text-red-600">
          {canContinueMessage}
        </Typography>
      ) : null}
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
            {["PENDING VERIFICATION", "NOT_INTERESTED", "NO_RESPONSE", "INVALID", "DECLINED"].includes(accountStageStatus) &&
              ["PENDING", "PENDING VERIFICATION", "PENDING_VERIFICATION"].includes(modalData?.status) && (
              <div className="flex justify-center gap-3 mt-4 flex-wrap">
                {["APPROVED", "NOT_INTERESTED", "NO_RESPONSE", "INVALID", "DECLINED"].map((nextStatus) => (
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
                            : nextStatus === "INVALID"
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "bg-red-600 hover:bg-red-700"
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

export default AccountOnboardingDetails;
