import moment from "moment";

export const PAGE_LIMIT = 20;

export const driverTypeOptions = [
  { label: "All", value: "ALL" },
  { label: "Cab", value: "CAB" },
  { label: "Auto", value: "AUTO" },
  { label: "Bike", value: "BIKE" },
  { label: "Driver", value: "DRIVER" },
];

export const earningStrategyOptions = [
  { label: "All", value: "ALL" },
  { label: "Credit", value: "CREDIT" },
  { label: "Unlimited", value: "UNLIMITED" },
];

export const associatedStatusOptions = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "IN_ACTIVE" },
];

export const emptyFilters = {
  search: "",
  driverType: "ALL",
  earningStrategy: "ALL",
  associatedStatus: "ALL",
};

export const formatLabel = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY hh:mm A") : String(value);
};

export const formatAmount = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  return `₹ ${numericValue.toLocaleString("en-IN", {
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

export const normalizeExpiredSubscriptionsResponse = (response) => {
  const body = response?.data ?? response?.result ?? response;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.rows)) return body.rows;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.list)) return body.list;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

export const resolvePagination = (response, rows, fallbackPage, fallbackLimit = PAGE_LIMIT) => {
  const body = response?.data ?? response?.result ?? {};
  const pagination = response?.pagination || response?.meta || body?.pagination || body?.meta || {};
  const itemsPerPage = Number(
    pagination.itemsPerPage ||
      pagination.limit ||
      body?.limit ||
      response?.limit ||
      fallbackLimit
  );
  const totalItems = Number(
    pagination.totalItems ||
      pagination.total ||
      body?.total ||
      response?.total ||
      rows.length ||
      0
  );
  const totalPages = Number(
    pagination.totalPages ||
      body?.totalPages ||
      response?.totalPages ||
      (itemsPerPage > 0 ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : 1)
  );
  const currentPage = Number(
    pagination.currentPage ||
      pagination.page ||
      body?.page ||
      response?.page ||
      fallbackPage ||
      1
  );

  return { currentPage, totalPages, totalItems, itemsPerPage };
};

export const getDriverName = (row) => {
  const driver = row?.driver || row?.Driver || {};
  const fullName = [driver?.firstName, driver?.lastName].filter(Boolean).join(" ").trim();
  return fullName || driver?.name || row?.driverName || "-";
};

export const getDriverPhone = (row) =>
  row?.driver?.phoneNumber || row?.Driver?.phoneNumber || row?.driverPhone || "-";

export const getEntityName = (row) => {
  const entity = row?.associatedEntity || {};
  return entity?.name || entity?.carNumber || entity?.vehicleNumber || "-";
};

export const getEntityNumber = (row) => {
  const entity = row?.associatedEntity || {};
  return entity?.carNumber || entity?.vehicleNumber || entity?.registrationNumber || "-";
};

export const getAccountName = (row) => {
  const account = row?.associatedEntity?.Account || row?.associatedEntity?.account || {};
  return account?.name || "-";
};

export const getAccountPhone = (row) => {
  const account = row?.associatedEntity?.Account || row?.associatedEntity?.account || {};
  return account?.phoneNumber || "-";
};

export const getSubscriptionId = (row) => row?.subscription?.id || row?.subscriptionId || row?.id;

export const getStatusBadgeClass = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ACTIVE") return "bg-green-100 text-green-800";
  if (normalized === "EXPIRED" || normalized === "IN_ACTIVE" || normalized === "INACTIVE") {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-700";
};