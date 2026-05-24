import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Input, Spinner, Typography } from "@material-tailwind/react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, BOOKING_FEATURES, ColorStyles } from "@/utils/constants";
import Swal from "sweetalert2";

const PENDING_STATUS = "PENDING";
const TERMINAL_STATUSES = ["APPROVED", "AUTO_APPROVED", "REJECTED"];

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD-MM-YYYY hh:mm A");
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.history)) return payload.history;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

const getStatusStyles = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === PENDING_STATUS) {
    return "bg-amber-100 text-amber-800";
  }
  if (normalized === "APPROVED" || normalized === "AUTO_APPROVED") {
    return "bg-green-100 text-green-800";
  }
  if (normalized === "REJECTED") {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-700";
};

const getRoleBadgeStyles = (role) => {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "SUPER_USER") return "bg-purple-100 text-purple-800";
  if (normalized === "SUPPORT") return "bg-blue-100 text-blue-800";
  if (normalized === "FINANCE") return "bg-emerald-100 text-emerald-800";
  if (normalized === "SALES") return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-700";
};

function AdminDiscountHistory() {
  const [quoteRef, setQuoteRef] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [rows, setRows] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  let role = "";
  try {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
    role = String(loggedInUser?.role || loggedInUser?.userType || "").toUpperCase();
  } catch {
    role = "";
  }
  const isSuperUser = role === "SUPER_USER";

  const fetchHistory = async (options = {}) => {
    if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) {
      setRows([]);
      setError("Admin discount history is currently disabled.");
      return;
    }
    const { skipValidation = false } = options;
    const trimmedQuoteRef = quoteRef.trim();
    const trimmedBookingId = bookingId.trim();

    if (!skipValidation && !trimmedQuoteRef && !trimmedBookingId) {
      setError("Enter quoteRef or bookingId.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const query = trimmedQuoteRef
        ? { quoteRef: trimmedQuoteRef }
        : trimmedBookingId
          ? { bookingId: trimmedBookingId }
          : {};
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_DISCOUNT_HISTORY, query);
      const historyRows = normalizeRows(response?.data);
      setRows(historyRows);
      if (!historyRows.length && (trimmedQuoteRef || trimmedBookingId || skipValidation)) {
        setError("No history found for given filters.");
      }
    } catch (err) {
      console.error("Failed to fetch admin discount history:", err);
      setRows([]);
      setError("Failed to fetch admin discount history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
    fetchHistory({ skipValidation: true });
  }, []);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_ALL_USERS);
        if (response?.success) {
          const users = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.data)
              ? response.data.data
              : [];
          setAllUsers(users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, []);

  const resolveUserById = (rawId) => {
    const normalizeId = (value) => String(value ?? "").trim();
    const targetId = normalizeId(rawId);
    if (!targetId) return null;
    return (
      allUsers.find(
        (user) =>
          normalizeId(user?.id) === targetId ||
          normalizeId(user?._id) === targetId ||
          normalizeId(user?.userId) === targetId
      ) || null
    );
  };

  const handleClear = async () => {
    setQuoteRef("");
    setBookingId("");
    setError("");
    setRows([]);
    await fetchHistory({ skipValidation: true });
  };

  const handleDecision = async (action, row) => {
    if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
    const discountId = row?.id || row?.discountId;
    if (!discountId) return;

    let remarks = action === "approve" ? "Approved by super user" : "";
    if (action === "reject") {
      const result = await Swal.fire({
        title: "Reject admin discount",
        input: "text",
        inputLabel: "Reason",
        inputPlaceholder: "Enter rejection reason",
        showCancelButton: true,
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",
        buttonsStyling: false,
        customClass: {
          popup: "rounded-2xl",
          input: "text-base px-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          actions: "mt-6 flex items-center justify-center gap-4",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg",
          cancelButton: `${ColorStyles.bgColor} text-white px-6 py-2.5 rounded-lg`,
        },
      });
      if (!result.isConfirmed) return;
      remarks = String(result.value || "").trim();
      if (!remarks) {
        Swal.fire({ icon: "warning", title: "Reason is required for rejection." });
        return;
      }
    }

    try {
      setActionLoadingId(discountId);
      const route = action === "approve" ? API_ROUTES.ADMIN_DISCOUNT_APPROVE : API_ROUTES.ADMIN_DISCOUNT_REJECT;
      const response = await ApiRequestUtils.update(route, { discountId, remarks });
      if (response?.success) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: action === "approve" ? "Discount approved" : "Discount rejected",
          showConfirmButton: false,
          timer: 1800,
        });
        await fetchHistory({ skipValidation: true });
      } else {
        Swal.fire({ icon: "error", title: response?.message || "Failed to update status." });
      }
    } catch (err) {
      console.error("Failed to update admin discount:", err);
      Swal.fire({ icon: "error", title: "Failed to update admin discount status." });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardBody>
          <Typography variant="h5" className="mb-4">
            Admin Discount History
          </Typography>

          {!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW ? (
            <Typography className="text-sm text-gray-600">
              Admin discount feature is disabled.
            </Typography>
          ) : null}

          <div className="flex items-end">
            <Button
              variant="outlined"
              onClick={() => fetchHistory({ skipValidation: true })}
              disabled={loading || !BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW}
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="mt-6 flex justify-center">
              <Spinner />
            </div>
          ) : null}

          {error ? (
            <Typography className="mt-4 text-sm text-red-600">{error}</Typography>
          ) : null}

          {!loading && rows.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1850px] border-collapse">
                <thead>
                  <tr className={`border-b text-left ${ColorStyles.bgColor}`}>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Quote Ref</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Booking ID</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Discount ID</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Status</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Type</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Requested Value</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Discount Amount</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Remarks</th>
                    {/* <th className="p-2 text-sm font-semibold text-white">Requested By ID</th> */}
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Requested By Role</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Requested By Name</th>
                    {/* <th className="p-2 text-sm font-semibold text-white">Approved By ID</th> */}
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Approved By Role</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Approved By Name</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Updated At</th>
                    <th className="whitespace-nowrap p-2 text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item, index) => {
                    const rowId = item?.id || item?.discountId;
                    const status = String(item?.status || "").toUpperCase();
                    const isPending = status === PENDING_STATUS;
                    const requestedById = item?.requestedBy || item?.requestedById || "-";
                    const approvedById = item?.approvedBy || item?.approvedById || "-";
                    const requestedByUser = resolveUserById(requestedById);
                    const approvedByUser = resolveUserById(approvedById);

                    return (
                      <tr key={`${rowId || "row"}-${index}`} className="border-b">
                        <td className="whitespace-normal break-words p-2 text-sm">{item?.quoteRef || "-"}</td>
                        <td className="p-2 text-sm">{item?.bookingId || item?.booking?.id || "-"}</td>
                        <td className="p-2 text-sm">{rowId || "-"}</td>
                        <td className="p-2 text-sm">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusStyles(status)}`}>
                            {status || "-"}
                          </span>
                        </td>
                        <td className="p-2 text-sm">{item?.discountType || "-"}</td>
                        <td className="p-2 text-sm">{item?.discountValue ?? "-"} % </td>
                        <td className="p-2 text-sm">₹ {item?.discountAmount ?? "-"}</td>
                        <td className="whitespace-normal break-words p-2 text-sm">{item?.remarks || "-"}</td>
                        {/* <td className="p-2 text-sm">{requestedById}</td> */}
                        <td className="p-2 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeStyles(
                              requestedByUser?.role
                            )}`}
                          >
                            {requestedByUser?.role || "-"}
                          </span>
                        </td>
                        <td className="p-2 text-sm">{requestedByUser?.name || "-"}</td>
                        {/* <td className="p-2 text-sm">{approvedById}</td> */}
                        <td className="p-2 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeStyles(
                              approvedByUser?.role
                            )}`}
                          >
                            {approvedByUser?.role || "-"}
                          </span>
                        </td>
                        <td className="p-2 text-sm">{approvedByUser?.name || "-"}</td>
                        <td className="p-2 text-sm">
                          {formatDateTime(item?.updated_at || item?.updatedAt || item?.created_at || item?.createdAt)}
                        </td>
                        <td className="p-2 text-sm">
                          {isSuperUser && isPending ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                color="green"
                                disabled={actionLoadingId === rowId}
                                onClick={() => handleDecision("approve", item)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                color="red"
                                disabled={actionLoadingId === rowId}
                                onClick={() => handleDecision("reject", item)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : TERMINAL_STATUSES.includes(status) ? (
                            <span className="text-xs text-gray-500">Completed</span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

export default AdminDiscountHistory;
