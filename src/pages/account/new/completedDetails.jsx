import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, IconButton, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useParams } from "react-router-dom";
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

const formatIndianPhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const digits = raw.replace(/\D/g, "");
  const core = digits.slice(-10);
  if (core.length === 10) return `+91${core}`;
  return raw;
};

const getPhoneCore = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.slice(-10);
};

const normalizeVehicleStatus = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "INACTIVE") return "IN_ACTIVE";
  if (normalized === "ACTIVE" || normalized === "IN_ACTIVE" || normalized === "BLOCKED") return normalized;
  return "IN_ACTIVE";
};

const extractCabIdsFromAccount = (account) => {
  if (!account || typeof account !== "object") return [];

  const source = Array.isArray(account?.cabs) ? account.cabs : [];
  const accountId = account?.id;

  return Array.from(
    new Set(
      source
        .filter((item) => {
          if (!accountId) return false;
          const cabAccountId = item?.accountId ?? item?.AccountId;
          return String(cabAccountId) === String(accountId);
        })
        .map((item) => item?.id)
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value))
    )
  );
};

const CompletedOnboardingDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [carTypeOptions, setCarTypeOptions] = useState([]);
  const [cabFetchError, setCabFetchError] = useState("");
  const [cabRequestIds, setCabRequestIds] = useState([]);
  const [ownerStatus, setOwnerStatus] = useState("InActive");
  const [ownerBlockedReason, setOwnerBlockedReason] = useState("");
  const [updatingOwnerStatus, setUpdatingOwnerStatus] = useState(false);
  const [accountEditMode, setAccountEditMode] = useState(false);
  const [accountDraft, setAccountDraft] = useState({});
  const [savingAccountDetails, setSavingAccountDetails] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [vehicleStatusById, setVehicleStatusById] = useState({});
  const [vehicleBlockedReasonById, setVehicleBlockedReasonById] = useState({});
  const [updatingVehicleStatus, setUpdatingVehicleStatus] = useState(false);
  const [vehicleDetailsSavingId, setVehicleDetailsSavingId] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    const timer = setTimeout(() => {
      fetchOnboardingDetails();
    }, 300);

    return () => clearTimeout(timer);
  }, [id, location?.state]);

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

  useEffect(() => {
    const fetchCarTypes = async () => {
      try {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_CAR_TYPE + "all");
        if (data?.success && Array.isArray(data?.data)) {
          setCarTypeOptions(data.data);
        }
      } catch (error) {
        console.error("Error fetching car type options:", error);
      }
    };
    fetchCarTypes();
  }, []);

  const fetchOnboardingDetails = async () => {
    try {
      setLoading(true);
      // Always load base details by id to avoid empty details page.
      const res = await ApiRequestUtils.get(API_ROUTES.ADMIN_ONBOARDING_BY_ID + id);
      const payload = res?.data || res?.result || null;
      const base = payload?.data?.id ? payload.data : payload || {};
      const stateCabs = Array.isArray(location?.state?.prefetchedCabs) ? location.state.prefetchedCabs : [];
      let nextData = stateCabs.length > 0 ? { ...base, cabs: stateCabs } : payload;

      // Try to enrich `cabs` from onboarding list API shape when available.
      try {
        let page = 1;
        const limit = 50;
        let totalPages = 1;
        let matched = null;

        do {
          const listRes = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ONBOARDING_DETAILS, {
            page,
            limit,
            accountId: id,
          });

          const listRows = Array.isArray(listRes?.data) ? listRes.data : [];
          matched = listRows.find((row) => String(row?.id) === String(id)) || null;
          totalPages = Number(listRes?.pagination?.totalPages || 1);

          if (matched || listRows.length === 0) break;
          page += 1;
        } while (page <= totalPages);

        if (matched && Array.isArray(matched?.cabs)) {
          const strictCabs = matched.cabs.filter(
            (cab) =>
              cab &&
              cab.id !== null &&
              cab.id !== undefined &&
              String(cab?.accountId ?? cab?.AccountId) === String(id)
          );
          const baseCabs = Array.isArray(base?.cabs) ? base.cabs : [];
          nextData = { ...base, cabs: strictCabs.length > 0 ? strictCabs : baseCabs };
        }
      } catch (_err) {
        // Ignore list enrichment failure; base details are already loaded.
      }

      setOnboardingData(nextData);
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

  useEffect(() => {
    setOwnerStatus(account?.ownerStatus || "InActive");
    setOwnerBlockedReason(account?.blockedReason || "");
    setAccountDraft({
      type: account?.type || "",
      name: account?.name || "",
      phoneNumber: getPhoneCore(account?.phoneNumber || ""),
      email: account?.email || "",
      source: account?.source || "",
      address: account?.address || "",
      street: account?.street || "",
      thaluk: account?.thaluk || "",
      district: account?.district || "",
      state: account?.state || "",
      pincode: account?.pincode || "",
    });
  }, [account]);

  useEffect(() => {
    setCabRequestIds(extractCabIdsFromAccount(account));
  }, [account]);

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
      .map(([key, value]) => {
        const label = toLabel(key);
        if (["Phone Number", "Owner Phone Number"].includes(label)) {
          return { label, value: formatIndianPhone(value) };
        }
        if (["Created at", "Updated at"].includes(label)) {
          return { label, value: formatDate(value) };
        }
        return { label, value: String(value) };
      });
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
        rawValues: {
          carType: cabResult?.carType || "",
        },
      };
    });
  }, [cabs]);

  useEffect(() => {
    const nextStatusById = {};
    const nextBlockedReasonById = {};
    cabs.forEach((cabItem) => {
      const cabResult = cabItem?.payload?.result || {};
      const sectionId = cabResult?.id || cabItem?.id;
      if (sectionId === null || sectionId === undefined || sectionId === "") return;
      nextStatusById[String(sectionId)] = normalizeVehicleStatus(cabResult?.status);
      nextBlockedReasonById[String(sectionId)] = cabResult?.blockedReason || "";
    });
    setVehicleStatusById(nextStatusById);
    setVehicleBlockedReasonById(nextBlockedReasonById);
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

  const handleOwnerStatusUpdate = async () => {
    if (!account?.id) return;
    if (ownerStatus === "Blocked" && !ownerBlockedReason.trim()) {
      window.alert("Please enter blocked reason.");
      return;
    }

    try {
      setUpdatingOwnerStatus(true);
      const payload = {
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
        blockedReason: ownerStatus === "Blocked" ? ownerBlockedReason : "",
      };
      const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_ACCOUNT, payload);
      if (response?.success) {
        await fetchOnboardingDetails();
      } else {
        window.alert(response?.message || "Failed to update account status.");
      }
    } catch (error) {
      console.error("Failed to update account status:", error);
      window.alert("Failed to update account status.");
    } finally {
      setUpdatingOwnerStatus(false);
    }
  };

  const handleAccountDetailsSave = async () => {
    if (!account?.id) return;
    try {
      setSavingAccountDetails(true);
      const payload = {
        type: accountDraft?.type || account?.type || "",
        name: accountDraft?.name || "",
        phoneNumber: String(accountDraft?.phoneNumber || "").replace(/\D/g, "").slice(-10),
        email: accountDraft?.email || "",
        address: accountDraft?.address || "",
        street: accountDraft?.street || "",
        thaluk: accountDraft?.thaluk || "",
        district: accountDraft?.district || "",
        state: accountDraft?.state || "",
        pincode: accountDraft?.pincode || "",
        source: accountDraft?.source || "",
        accountId: account?.id,
        ownerStatus: ownerStatus,
        blockedReason: ownerStatus === "Blocked" ? ownerBlockedReason : "",
      };
      const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_ACCOUNT, payload);
      if (response?.success) {
        setAccountEditMode(false);
        await fetchOnboardingDetails();
      } else {
        window.alert(response?.message || "Failed to update account details.");
      }
    } catch (error) {
      console.error("Failed to update account details:", error);
      window.alert("Failed to update account details.");
    } finally {
      setSavingAccountDetails(false);
    }
  };

  const parseAddress = (address) => {
    if (!address || typeof address !== "string") {
      return { street: "", thaluk: "", district: "", state: "", pincode: "" };
    }
    const parts = address.split(",").map((item) => item.trim()).filter(Boolean);
    const reversed = [...parts].reverse();
    const pincodeMatch = address.match(/\b\d{6}\b/);
    return {
      street: reversed[4] || parts[0] || "",
      thaluk: reversed[3] || "",
      district: reversed[2] || "",
      state: reversed[1] || "",
      pincode: pincodeMatch?.[0] || "",
    };
  };

  const searchLocations = async (query) => {
    if (!query || query.length <= 2) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
      if (data?.success && data?.data) {
        setAddressSuggestions(data.data);
      } else {
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error("Address search failed:", error);
      setAddressSuggestions([]);
    }
  };

  const handleVehicleStatusUpdate = async (sectionId) => {
    const target = cabs.find((item) => String(item?.payload?.result?.id || item?.id) === String(sectionId));
    const cabPayload = target?.payload;
    const cabResult = cabPayload?.result;
    if (!cabResult?.id) return;
    const nextVehicleStatus = normalizeVehicleStatus(vehicleStatusById[String(sectionId)]);
    const nextBlockedReason = vehicleBlockedReasonById[String(sectionId)] || "";

    if (nextVehicleStatus === "BLOCKED" && !nextBlockedReason.trim()) {
      window.alert("Please enter blocked reason.");
      return;
    }

    try {
      setUpdatingVehicleStatus(true);
      const cabDetails = {
        name: cabResult?.name || "",
        carNumber: cabResult?.carNumber || "",
        curAddress: cabResult?.curAddress || "",
        insurance: cabResult?.insurance || "",
        carType: cabResult?.carType || "",
        vehicleType: cabResult?.vehicleType || "",
        seater: cabResult?.seater || "",
        luggage: cabResult?.luggage || "",
        modelYear: cabResult?.modelYear || "",
        assigned: cabResult?.assigned || "",
        withDriver: cabResult?.withDriver || "",
        driverName: cabResult?.driverName || "",
        phoneNumber: cabResult?.phoneNumber || "",
        driverAddress: cabResult?.driverAddress || "",
        driverLicense: cabResult?.driverLicense || "",
        packages: cabResult?.packages || [],
        accountId: cabResult?.Account?.id || cabResult?.AccountId || "",
        driverId: cabResult?.Drivers?.[0]?.id || "",
        cabId: cabResult?.id,
        status: nextVehicleStatus,
        blockedReason: nextVehicleStatus === "BLOCKED" ? nextBlockedReason : "",
      };

      const prices = Array.isArray(cabPayload?.price)
        ? cabPayload.price.filter((el) => (cabResult?.packages || []).includes(el.packageId))
        : [];

      const res = await ApiRequestUtils.update(API_ROUTES.UPDATE_CAB, {
        cabDetails: JSON.stringify(cabDetails),
        prices: JSON.stringify(prices),
      });

      if (res?.success) {
        const responses = await Promise.allSettled(
          cabRequestIds.map((itemId) => ApiRequestUtils.get(API_ROUTES.GET_CAB_BY_ID + `${itemId}`))
        );
        const normalized = responses
          .map((result, index) => {
            if (result.status !== "fulfilled") return null;
            const response = result.value;
            const payload = response?.data || null;
            if (!payload) return null;
            return { id: cabRequestIds[index], payload };
          })
          .filter(Boolean);
        setCabs(normalized);
      } else {
        window.alert(res?.message || "Failed to update vehicle status.");
      }
    } catch (error) {
      console.error("Failed to update vehicle status", error);
      window.alert("Failed to update vehicle status.");
    } finally {
      setUpdatingVehicleStatus(false);
    }
  };

  const handleVehicleDetailsSave = async (sectionId, draftValues, onDone) => {
    const target = cabs.find((item) => String(item?.payload?.result?.id) === String(sectionId));
    const cabPayload = target?.payload;
    const cabResult = cabPayload?.result;
    if (!cabResult?.id) return;

    try {
      setVehicleDetailsSavingId(sectionId);
      const mappedCarType = String(draftValues?.["Car Type"] || cabResult?.carType || "").toUpperCase();
      const cabDetails = {
        name: draftValues?.["Vehicle Name"] || cabResult?.name || "",
        carNumber: draftValues?.["Vehicle Number"] || cabResult?.carNumber || "",
        curAddress: cabResult?.curAddress || "",
        insurance: cabResult?.insurance || "",
        carType: mappedCarType || cabResult?.carType || "",
        vehicleType: draftValues?.["Vehicle Type"] || cabResult?.vehicleType || "",
        seater: draftValues?.Seater || cabResult?.seater || "",
        luggage: draftValues?.Luggage || cabResult?.luggage || "",
        modelYear: draftValues?.["Model Year"] || cabResult?.modelYear || "",
        assigned: cabResult?.assigned || "",
        withDriver: cabResult?.withDriver || "",
        driverName: cabResult?.driverName || "",
        phoneNumber: cabResult?.phoneNumber || "",
        driverAddress: cabResult?.driverAddress || "",
        driverLicense: cabResult?.driverLicense || "",
        packages: cabResult?.packages || [],
        accountId: cabResult?.Account?.id || cabResult?.AccountId || "",
        driverId: cabResult?.Drivers?.[0]?.id || "",
        cabId: cabResult?.id,
        status: normalizeVehicleStatus(cabResult?.status),
        blockedReason: cabResult?.blockedReason || "",
      };

      const prices = Array.isArray(cabPayload?.price)
        ? cabPayload.price.filter((el) => (cabResult?.packages || []).includes(el.packageId))
        : [];

      const res = await ApiRequestUtils.update(API_ROUTES.UPDATE_CAB, {
        cabDetails: JSON.stringify(cabDetails),
        prices: JSON.stringify(prices),
      });

      if (res?.success) {
        const responses = await Promise.allSettled(
          cabRequestIds.map((itemId) => ApiRequestUtils.get(API_ROUTES.GET_CAB_BY_ID + `${itemId}`))
        );
        const normalized = responses
          .map((result, index) => {
            if (result.status !== "fulfilled") return null;
            const response = result.value;
            const payload = response?.data || null;
            if (!payload) return null;
            return { id: cabRequestIds[index], payload };
          })
          .filter(Boolean);
        setCabs(normalized);
        onDone?.();
      } else {
        window.alert(res?.message || "Failed to update vehicle details.");
      }
    } catch (error) {
      console.error("Failed to update vehicle details:", error);
      window.alert("Failed to update vehicle details.");
    } finally {
      setVehicleDetailsSavingId(null);
    }
  };

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
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Typography variant="h5" className="text-blue-gray-900 font-semibold inline-block">
                    Account Details
                  </Typography>
                  <IconButton
                    variant="text"
                    className="h-9 w-9 rounded-md bg-blue-50 text-blue-600"
                    onClick={() => {
                      setAccountEditMode(true);
                      setAccountDraft({
                        type: account?.type || "",
                        name: account?.name || "",
                        phoneNumber: getPhoneCore(account?.phoneNumber || ""),
                        email: account?.email || "",
                        source: account?.source || "",
                        address: account?.address || "",
                        street: account?.street || "",
                        thaluk: account?.thaluk || "",
                        district: account?.district || "",
                        state: account?.state || "",
                        pincode: account?.pincode || "",
                      });
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                </div>
                <div className="w-full max-w-[260px] space-y-1.5 rounded-lg border border-blue-gray-100 bg-blue-gray-50/40 p-2">
                    <select
                      value={ownerStatus}
                      onChange={(e) => {
                        setOwnerStatus(e.target.value);
                        if (e.target.value !== "Blocked") setOwnerBlockedReason("");
                      }}
                      disabled={updatingOwnerStatus}
                      className="h-9 px-2.5 w-full rounded-md border border-gray-300 bg-white text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="InActive">In_Active</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                    {ownerStatus === "Blocked" && (
                      <input
                        type="text"
                        value={ownerBlockedReason}
                        onChange={(e) => setOwnerBlockedReason(e.target.value)}
                        disabled={updatingOwnerStatus}
                        placeholder="Enter block reason"
                        className="h-9 px-2.5 w-full rounded-md border border-gray-300 bg-white text-sm"
                      />
                    )}
                    <Button
                      onClick={handleOwnerStatusUpdate}
                      disabled={updatingOwnerStatus}
                      size="sm"
                      className="h-8 px-3 w-full bg-primary text-xs normal-case"
                    >
                      {updatingOwnerStatus ? "Updating..." : "Update Status"}
                    </Button>
                </div>
              </div>
              <div className="border-t border-blue-gray-50 mt-3" />
              {accountDetailsRows.length === 0 ? (
                <Typography className="text-black mt-2">-</Typography>
              ) : accountEditMode ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ["type", "Service Type"],
                    ["name", "Name"],
                    ["phoneNumber", "Phone Number"],
                    ["email", "Email"],
                    ["source", "Source"],
                    ["address", "Address"],
                    ["street", "Street"],
                    ["thaluk", "Thaluk"],
                    ["district", "District"],
                    ["state", "State"],
                    ["pincode", "Pincode"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <Typography className="text-xs text-blue-gray-500 mb-1">{label}</Typography>
                      {key === "address" ? (
                        <div className="relative">
                          <input
                            value={accountDraft?.[key] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAccountDraft((prev) => ({ ...prev, [key]: value }));
                              searchLocations(value);
                            }}
                            className="h-9 px-2.5 w-full rounded-md border border-gray-300 bg-white text-sm"
                          />
                          {addressSuggestions.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                              {addressSuggestions.map((suggestion, index) => (
                                <button
                                  key={`${suggestion}-${index}`}
                                  type="button"
                                  className="w-full text-left px-2.5 py-2 text-sm hover:bg-blue-gray-50"
                                  onClick={() => {
                                    setAccountDraft((prev) => ({ ...prev, address: suggestion }));
                                    setAddressSuggestions([]);
                                    if (isSameAddress) {
                                      const parsed = parseAddress(suggestion);
                                      setAccountDraft((prev) => ({
                                        ...prev,
                                        street: parsed.street,
                                        thaluk: parsed.thaluk,
                                        district: parsed.district,
                                        state: parsed.state,
                                        pincode: parsed.pincode,
                                      }));
                                    }
                                  }}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          value={accountDraft?.[key] || ""}
                          onChange={(e) => {
                            if (key === "phoneNumber") {
                              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setAccountDraft((prev) => ({ ...prev, [key]: digits }));
                              return;
                            }
                            setAccountDraft((prev) => ({ ...prev, [key]: e.target.value }));
                          }}
                          className="h-9 px-2.5 w-full rounded-md border border-gray-300 bg-white text-sm"
                          disabled={key === "type"}
                          maxLength={key === "phoneNumber" ? 10 : undefined}
                        />
                      )}
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm text-blue-gray-700">
                      <input
                        type="checkbox"
                        checked={isSameAddress}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsSameAddress(checked);
                          if (checked) {
                            const parsed = parseAddress(accountDraft?.address || "");
                            setAccountDraft((prev) => ({
                              ...prev,
                              street: parsed.street,
                              thaluk: parsed.thaluk,
                              district: parsed.district,
                              state: parsed.state,
                              pincode: parsed.pincode,
                            }));
                          }
                        }}
                      />
                      Same as Current Address
                    </label>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs normal-case bg-white text-black border border-gray-300 shadow-none"
                      onClick={() => setAccountEditMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs normal-case bg-primary"
                      disabled={savingAccountDetails}
                      onClick={handleAccountDetailsSave}
                    >
                      {savingAccountDetails ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
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
            carTypeOptions={carTypeOptions}
            getVehicleStatusBySection={(sectionId) => vehicleStatusById[String(sectionId)] || "IN_ACTIVE"}
            onVehicleStatusChange={(sectionId, value) => {
              const normalized = normalizeVehicleStatus(value);
              setVehicleStatusById((prev) => ({ ...prev, [String(sectionId)]: normalized }));
              if (normalized !== "BLOCKED") {
                setVehicleBlockedReasonById((prev) => ({ ...prev, [String(sectionId)]: "" }));
              }
            }}
            getVehicleBlockedReasonBySection={(sectionId) => vehicleBlockedReasonById[String(sectionId)] || ""}
            onVehicleBlockedReasonChange={(sectionId, value) => {
              setVehicleBlockedReasonById((prev) => ({ ...prev, [String(sectionId)]: value }));
            }}
            onVehicleStatusUpdate={handleVehicleStatusUpdate}
            statusUpdating={updatingVehicleStatus}
            onSaveVehicleDetails={handleVehicleDetailsSave}
            vehicleDetailsSavingId={vehicleDetailsSavingId}
          />

        </div>
      )}
    </div>
  );
};

export default CompletedOnboardingDetails;
