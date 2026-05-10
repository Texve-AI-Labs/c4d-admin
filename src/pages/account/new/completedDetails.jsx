import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Chip, IconButton, Spinner, Typography } from "@material-tailwind/react";
import { useParams } from "react-router-dom";
import { PencilIcon } from "@heroicons/react/24/solid";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import moment from "moment";
import AccountDocumentsSection from "./AccountDocumentsSection";
import VehicleDocumentsSection from "./VehicleDocumentsSection";
import VehicleInfoSection from "./VehicleInfoSection";

const toLabel = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());

const toDisplayCase = (value) =>
  String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");

const getStatusTextClass = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "VERIFIED" || normalized === "APPROVED") return "text-green-600";
  if (normalized === "PENDING" || normalized === "IN_REVIEW") return "text-amber-600";
  if (normalized === "DECLINED" || normalized === "REJECTED") return "text-red-600";
  return "text-blue-gray-700";
};

const getStatusBgClass = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "VERIFIED" || normalized === "APPROVED" || normalized === "COMPLETED") return "bg-green-50";
  if (normalized === "PENDING" || normalized === "IN_REVIEW") return "bg-amber-50";
  if (normalized === "DECLINED" || normalized === "REJECTED") return "bg-red-50";
  return "bg-blue-gray-50";
};

const getStatusChipColor = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (["VERIFIED", "APPROVED", "COMPLETED", "ACTIVE", "TRUE"].includes(normalized)) return "green";
  if (["PENDING", "IN_REVIEW"].includes(normalized)) return "amber";
  if (["DECLINED", "REJECTED", "INACTIVE", "FALSE"].includes(normalized)) return "red";
  return "blue-gray";
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = moment(value);
  if (!date.isValid()) return String(value);
  return date.format("DD-MM-YYYY / hh:mm A");
};

const extractCabIdsFromAccount = (account) => {
  if (!account || typeof account !== "object") return [];

  const primaryIds = [];
  const fallbackIds = [];
  const pushId = (value) => {
    if (value === null || value === undefined || value === "") return;
    primaryIds.push(String(value));
  };
  const pushFallbackId = (value) => {
    if (value === null || value === undefined || value === "") return;
    fallbackIds.push(String(value));
  };

  // Priority: use exact cab ids coming from onboarding payload Cabs/cabs arrays.
  if (Array.isArray(account?.Cabs)) {
    account.Cabs.forEach((item) => pushId(item?.id || item?.cabId || item));
  }
  if (Array.isArray(account?.cabs)) {
    account.cabs.forEach((item) => pushId(item?.id || item?.cabId || item));
  }
  if (Array.isArray(account?.cabIds)) {
    account.cabIds.forEach((item) => pushId(item));
  }

  // Fallback only when Cabs[] style data is absent.
  pushFallbackId(account?.cabId);
  pushFallbackId(account?.CabId);
  pushFallbackId(account?.vehicleId);
  pushFallbackId(account?.cab?.id);

  if (primaryIds.length > 0) return primaryIds;
  const uniqueFallback = Array.from(new Set(fallbackIds));
  if (uniqueFallback.length > 0) return uniqueFallback;
  return ["150","148"]; /// mock data fallback to ensure we show something in vehicle section for testing. Remove this when real data is available.
};

const CompletedOnboardingDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [cabFetchError, setCabFetchError] = useState("");

  useEffect(() => {
    if (id) fetchOnboardingDetails();
  }, [id]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_ALL_USERS);
        if (response?.success) {
          setAllUsers(response?.data || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, []);

  const fetchOnboardingDetails = async () => {
    try {
      setLoading(true);
      const res = await ApiRequestUtils.get(API_ROUTES.ADMIN_ONBOARDING_BY_ID + id);
      const payload = res?.data || res?.result || null;
      setOnboardingData(payload);
    } catch (err) {
      console.error("Failed to load completed onboarding details", err);
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

  const cabRequestIds = useMemo(() => extractCabIdsFromAccount(account), [account]);

  useEffect(() => {
    if (!cabRequestIds.length) {
      setCabs([]);
      setCabFetchError("");
      return;
    }

    let isActive = true;

    const fetchAllCabs = async () => {
      try {
        const responses = await Promise.allSettled(
          cabRequestIds.map((itemId) => ApiRequestUtils.get(API_ROUTES.GET_CAB_BY_ID + `${itemId}`))
        );
        if (!isActive) return;

        const normalized = responses
          .map((result, index) => {
            if (result.status !== "fulfilled") return null;
            const response = result.value;
            const payload = response?.data || null;
            if (!payload) return null;
            return { id: cabRequestIds[index], payload };
          })
          .filter(Boolean);

        const rejectedCount = responses.filter((result) => result.status === "rejected").length;

        setCabs(normalized);
        if (rejectedCount > 0) {
          setCabFetchError(`Some vehicle details could not be loaded (${rejectedCount} failed request${rejectedCount > 1 ? "s" : ""}).`);
        } else {
          setCabFetchError("");
        }
      } catch (error) {
        if (!isActive) return;
        console.error("Error fetching cab details:", error);
        setCabFetchError("Unable to load vehicle details.");
      }
    };

    fetchAllCabs();

    return () => {
      isActive = false;
    };
  }, [cabRequestIds, id]);

  const usersMap = useMemo(() => {
    const map = new Map();
    (allUsers || []).forEach((user) => {
      if (user?.id !== undefined && user?.id !== null) {
        map.set(String(user.id), user?.name || user?.fullName || user?.email || "-");
      }
    });
    return map;
  }, [allUsers]);

  const accountDetailsRows = useMemo(() => {
    if (!account || typeof account !== "object") return [];
    return Object.entries(account)
      .filter(([key, value]) => {
        if (["requiredDocuments", "uploads", "accountDocumentStatus", "vehicleDocumentStatus", "cab"].includes(key)) return false;
        if (value === null || value === undefined || value === "") return false;
        if (typeof value === "object") return false;
        return true;
      })
      .map(([key, value]) => ({
        label: toLabel(key),
        value: String(value),
      }));
  }, [account]);

  const vehicleSections = useMemo(() => {
    return cabs.map((cabItem, index) => {
      const cabPayload = cabItem?.payload || {};
      const cabResult = cabPayload?.result || {};
      const latestCredit = Array.isArray(cabPayload?.creditLog) && cabPayload.creditLog.length > 0 ? cabPayload.creditLog[0] : null;

      const vehicleDetailsRows = [
        {
          label: "Vehicle Number",
          value:
            cabResult?.registrationNumber ||
            cabResult?.carNumber ||
            cabResult?.vehicleNumber ||
            "-",
        },
        { label: "Vehicle Name", value: cabResult?.name || "-" },
        { label: "Car Type", value: toDisplayCase(cabResult?.carType || "-") },
        { label: "Vehicle Type", value: toDisplayCase(cabResult?.vehicleType || "-") },
        { label: "Model Year", value: String(cabResult?.modelYear || "-").trim() },
        { label: "Seater", value: cabResult?.seater || "-" },
        { label: "Luggage", value: cabResult?.luggage || "-" },
        { label: "Status", value: toDisplayCase(cabResult?.status || "-") },
        { label: "Subscription Status", value: toDisplayCase(cabResult?.subscriptionStatus || "-") },
        { label: "Wallet", value: cabResult?.wallet || "-" },
        { label: "Cashback Wallet", value: cabResult?.cashbackWallet || "-" },
        { label: "Credit Type", value: toDisplayCase(latestCredit?.type || "-") },
        { label: "Credit Transaction Type", value: toDisplayCase(latestCredit?.transactionType || "-") },
        { label: "Credit Remaining", value: latestCredit?.remainingCredit || "-" },
        { label: "Credit Status", value: toDisplayCase(latestCredit?.status || "-") },
        { label: "Credit Created At", value: formatDate(latestCredit?.created_at) },
      ].filter((row) => row.value !== null && row.value !== undefined && row.value !== "");

      const creditLogRows = (Array.isArray(cabPayload?.creditLog) ? cabPayload.creditLog : []).map((log, logIndex) => ({
        id: log?.id || `credit-${index}-${logIndex}`,
        type: toDisplayCase(log?.type || "-"),
        amount: log?.amount || "-",
        transactionType: toDisplayCase(log?.transactionType || "-"),
        baseCredit: log?.baseCredit || "-",
        bonusCredit: log?.bonusCredit || "-",
        utilizedCredit: log?.utilizedCredit || "-",
        nettCredit: log?.nettCredit || "-",
        remainingCredit: log?.remainingCredit || "-",
        status: toDisplayCase(log?.status || "-"),
        cashbackAmount: log?.cashbackAmount || "-",
        createdAt: formatDate(log?.created_at),
        updatedAt: formatDate(log?.updated_at),
        invoiceId: log?.InvoiceId || "-",
        receiptId: log?.ReceiptId || "-",
        subscriptionId: log?.Subscription?.id || "-",
        subscriptionStartDate: formatDate(log?.Subscription?.startDate),
        subscriptionEndDate: formatDate(log?.Subscription?.endDate),
      }));

      return {
        sectionKey: `${cabResult?.id || cabItem.id || "cab"}-${index}`,
        id: cabResult?.id || cabItem.id || `cab-${index + 1}`,
        cabId: cabResult?.id || cabItem.id || "-",
        title: `Cab ${index + 1}${cabResult?.registrationNumber ? ` - ${cabResult.registrationNumber}` : ""}`,
        vehicleDetailsRows,
        creditLogRows,
      };
    });
  }, [cabs]);

  const splitDocumentRows = useMemo(() => {
    const uploadsRaw = account?.uploads;
    const accountUploads = Array.isArray(uploadsRaw?.account) ? uploadsRaw.account : [];
    const vehicleUploads = Array.isArray(uploadsRaw?.vehicle) ? uploadsRaw.vehicle : [];

    const mapUpload = (item, index, prefix) => ({
      id: item?.id || `${prefix}-${index}`,
      type: toDisplayCase(item?.Proof?.name || item?.Proof?.type || item?.type || "-"),
      status: toDisplayCase(item?.status || "-"),
      createdAt: formatDate(item?.created_at),
      updatedAt: formatDate(item?.updated_at),
      verifiedBy:
        item?.User?.name ||
        usersMap.get(String(item?.userId ?? item?.UserId ?? "")) ||
        "-",
      verifiedAt: formatDate(item?.verified_at || item?.updated_at),
    });

    return {
      account: accountUploads.map((item, index) => mapUpload(item, index, "acc")),
      vehicle: vehicleUploads.map((item, index) => mapUpload(item, index, "veh")),
    };
  }, [account, usersMap]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md min-h-[60vh]">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-10 w-10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
            <CardBody>
              <div className="flex items-center justify-between">
                <Typography variant="h5" className="text-blue-gray-900 font-semibold rounded-md px-3 py-2 inline-block">
                  Account Details
                </Typography>
                <IconButton variant="text" className="h-9 w-9 rounded-md bg-blue-50 text-blue-600">
                  <PencilIcon className="h-4 w-4" />
                </IconButton>
              </div>
              <div className="border-t border-blue-gray-50 mt-3" />
              {accountDetailsRows.length === 0 ? (
                <Typography className="text-black mt-2">-</Typography>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                  {accountDetailsRows.map((row) => (
                    <div key={row.label} className="flex items-start gap-2">
                      <Typography className="text-blue-gray-400 font-semibold min-w-[130px]">{row.label}:</Typography>
                      {["Onboarding Stage", "Has Vehicle", "Owner Status"].includes(row.label) ? (
                        <Chip
                          value={row.label === "Has Vehicle" ? toDisplayCase(String(row.value)) : toDisplayCase(row.value)}
                          color={getStatusChipColor(row.value)}
                          variant="ghost"
                          className="w-fit"
                        />
                      ) : (
                        <Typography className="text-blue-gray-900 font-medium break-words">{row.value}</Typography>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <AccountDocumentsSection
            rows={splitDocumentRows.account}
            getStatusTextClass={getStatusTextClass}
            getStatusBgClass={getStatusBgClass}
          />
          <VehicleDocumentsSection
            rows={splitDocumentRows.vehicle}
            getStatusChipColor={getStatusChipColor}
          />
          {cabFetchError ? (
            <Card className="bg-amber-50 border border-amber-200 shadow-sm md:col-span-2">
              <CardBody className="py-3">
                <Typography className="text-amber-800 text-sm font-medium">{cabFetchError}</Typography>
              </CardBody>
            </Card>
          ) : null}
          <VehicleInfoSection
            vehicleSections={vehicleSections}
            getStatusChipColor={getStatusChipColor}
          />

        </div>
      )}
    </div>
  );
};

export default CompletedOnboardingDetails;
