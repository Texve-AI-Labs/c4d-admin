import React, { useEffect, useMemo, useState } from "react";
import {Alert,Button,Card,CardBody,CardHeader,Checkbox,Dialog,DialogBody,DialogFooter,DialogHeader,Option,Popover,PopoverContent,PopoverHandler,Select,Spinner,Textarea,Typography} from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";
import moment from "moment";
import {fetchParcelCommissionHistory,fetchParcelCommissionStateList,settleParcelCommission,settleParcelCommissionRow,} from "./parcelCommissionApi";
import { ColorStyles } from "@/utils/constants";

const SETTLEMENT_STATUS_OPTIONS = ["SETTLED", "WAIVED"];

const formatAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return value || "0.00";
  return num.toFixed(2);
};

const isPending = (value) => String(value || "").toUpperCase() === "PENDING";

const FILTER_OPTIONS = {
  status: [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ],
  parcelVehicleType: [
    { value: "ALL", label: "All" },
    { value: "BIKE", label: "Bike" },
    { value: "AUTO", label: "Auto" },
  ],
};

function FilterPopover({ label, value, options, onChange }) {
  return (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <button type="button" className="flex items-center cursor-pointer">
          <Typography variant="small" className="mr-1 text-[11px] font-bold uppercase text-black">
            {label}
          </Typography>
          <FaFilter className="text-black text-xs" />
        </button>
      </PopoverHandler>
      <PopoverContent className="p-2">
        {options.map((option) => (
          <div key={option.value} className="mb-2 flex items-center">
            <Checkbox color="blue" checked={value === option.value} onChange={() => onChange(option.value)} />
            <Typography color="blue-gray" className="ml-2 font-medium">{option.label}</Typography>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ParcelCommissionList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "ALL",
    parcelVehicleType: "ALL",
  });
  const [activeFilters, setActiveFilters] = useState({
    status: "ALL",
    parcelVehicleType: "ALL",
  });

  const [historyDialog, setHistoryDialog] = useState({
    open: false,
    loading: false,
    stateId: null,
    state: null,
    rows: [],
  });

  const [settleOneDialog, setSettleOneDialog] = useState({
    open: false,
    parcelCommissionId: null,
    status: "SETTLED",
    remarks: "",
  });

  const [settleAllDialog, setSettleAllDialog] = useState({
    open: false,
    stateId: null,
    status: "SETTLED",
    remarks: "",
  });

  const [actionLoading, setActionLoading] = useState({
    settleOneId: null,
    settleAllStateId: null,
  });

  const [message, setMessage] = useState(null);

  const activeStateMap = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      map.set(Number(row?.id), row);
    });
    return map;
  }, [rows]);

  const loadStateList = async (nextFilters = activeFilters, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await fetchParcelCommissionStateList(nextFilters);
      if (response?.success) {
        setRows(Array.isArray(response?.data) ? response.data : []);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to fetch parcel commission state list:", error);
      setRows([]);
      setMessage({ type: "error", text: "Failed to load parcel commission states." });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (stateId) => {
    setHistoryDialog((prev) => ({
      ...prev,
      open: true,
      loading: true,
      stateId,
      rows: [],
    }));

    try {
      const response = await fetchParcelCommissionHistory(stateId);
      if (response?.success) {
        setHistoryDialog((prev) => ({
          ...prev,
          loading: false,
          state: response?.data?.state || null,
          rows: Array.isArray(response?.data?.history) ? response.data.history : [],
        }));
      } else {
        setHistoryDialog((prev) => ({
          ...prev,
          loading: false,
          state: null,
          rows: [],
        }));
      }
    } catch (error) {
      console.error("Failed to fetch parcel commission history:", error);
      setHistoryDialog((prev) => ({
        ...prev,
        loading: false,
        state: null,
        rows: [],
      }));
      setMessage({ type: "error", text: "Failed to load selected partner history." });
    }
  };

  useEffect(() => {
    loadStateList(activeFilters, true);
  }, []);

  const refreshAfterSettlement = async (stateId) => {
    await loadStateList(activeFilters, false);
    if (historyDialog.open && Number(historyDialog.stateId) === Number(stateId)) {
      await loadHistory(stateId);
    }
  };

  const updateStatusFilter = async (value) => {
    const nextFilters = { ...filters, status: value };
    setFilters(nextFilters);
    setActiveFilters(nextFilters);
    await loadStateList(nextFilters, true);
  };

  const updateVehicleTypeFilter = async (value) => {
    const nextFilters = { ...filters, parcelVehicleType: value };
    setFilters(nextFilters);
    setActiveFilters(nextFilters);
    await loadStateList(nextFilters, true);
  };

  const handleSettleOne = async () => {
    if (!settleOneDialog.parcelCommissionId) return;
    setActionLoading((prev) => ({ ...prev, settleOneId: settleOneDialog.parcelCommissionId }));

    try {
      const response = await settleParcelCommissionRow({
        parcelCommissionId: settleOneDialog.parcelCommissionId,
        status: settleOneDialog.status,
        remarks: settleOneDialog.remarks,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Unable to settle the selected row");
      }

      setMessage({
        type: "success",
        text: `Settled 1 row. Amount: ${response?.data?.settledAmount ?? 0}`,
      });
      const refreshedStateId = response?.data?.state?.id || historyDialog.stateId;
      setSettleOneDialog({ open: false, parcelCommissionId: null, status: "SETTLED", remarks: "" });
      await refreshAfterSettlement(refreshedStateId);
    } catch (error) {
      console.error("Failed to settle one parcel commission row:", error);
      setMessage({
        type: "error",
        text: error?.message || "Failed to settle selected commission row.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, settleOneId: null }));
    }
  };

  const handleSettleAll = async () => {
    if (!settleAllDialog.stateId) return;
    setActionLoading((prev) => ({ ...prev, settleAllStateId: settleAllDialog.stateId }));

    try {
      const response = await settleParcelCommission({
        stateId: settleAllDialog.stateId,
        status: settleAllDialog.status,
        remarks: settleAllDialog.remarks,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Unable to settle all rows");
      }

      setMessage({
        type: "success",
        text: `Settled ${response?.data?.settledCount ?? 0} rows. Amount: ${response?.data?.settledAmount ?? 0}`,
      });

      const refreshedStateId = response?.data?.state?.id || settleAllDialog.stateId;
      setSettleAllDialog({ open: false, stateId: null, status: "SETTLED", remarks: "" });
      await refreshAfterSettlement(refreshedStateId);
    } catch (error) {
      console.error("Failed to settle all parcel commissions:", error);
      setMessage({
        type: "error",
        text: error?.message || "Failed to settle all rows for selected partner bucket.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, settleAllStateId: null }));
    }
  };

  const closeHistoryDialog = () => {
    setHistoryDialog({
      open: false,
      loading: false,
      stateId: null,
      state: null,
      rows: [],
    });
  };

  return (
    <div className="mb-8 mt-5 flex flex-col gap-6">
      {message ? (
        <Alert
          color={message.type === "success" ? "green" : "red"}
          className="rounded-lg"
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      ) : null}

      <Card>
        <CardHeader variant="gradient" className={`mb-5 rounded-xl p-4 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Parcel Commission Settlement
          </Typography>
        </CardHeader>
        <CardBody className="p-0">
          <div className="md:hidden space-y-3 p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-9 w-9" />
              </div>
            ) : rows.length === 0 ? (
              <Typography variant="small" color="gray" className="py-4 text-center">
                No parcel commission found.
              </Typography>
            ) : (
              rows.map((row, index) => {
                const driverName = [row?.Driver?.firstName, row?.Driver?.lastName].filter(Boolean).join(" ") || "-";
                const vehicle = row?.Parcel?.vehicleNumber || row?.Auto?.vehicleNumber || "-";
                const lastUpdated = row?.blockedAt || row?.updatedAt || row?.createdAt;
                return (
                  <div key={row?.id || index} className="rounded-lg border border-blue-gray-100 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Typography variant="small" className="font-bold text-blue-gray-700">
                        State #{row?.id}
                      </Typography>
                      <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                        {row?.status || "-"}
                      </Typography>
                    </div>
                    <div className="space-y-1 text-sm">
                      <Typography variant="small">Driver: {driverName}</Typography>
                      <Typography variant="small">Vehicle: {vehicle}</Typography>
                      <Typography variant="small">Type: {row?.parcelVehicleType || "-"}</Typography>
                      <Typography variant="small">Outstanding: {formatAmount(row?.outstandingAmount)}</Typography>
                      <Typography variant="small">Partner Payable: {formatAmount(row?.totalPartnerPayable)}</Typography>
                      <Typography variant="small">Settled: {formatAmount(row?.totalSettledAmount)}</Typography>
                      <Typography variant="small">Direction: {row?.settlementDirection || "-"}</Typography>
                      <Typography variant="small">Last Booking: {row?.lastBooking?.bookingNumber || row?.lastBookingId || "-"}</Typography>
                      <Typography variant="small">Updated: {lastUpdated ? moment(lastUpdated).format("DD-MM-YYYY hh:mm A") : "-"}</Typography>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outlined" color="blue-gray" onClick={() => loadHistory(row?.id)}>
                        History
                      </Button>
                      <Button
                        size="sm"
                        className={ColorStyles.bgColor}
                        disabled={actionLoading.settleAllStateId === row?.id}
                        onClick={() =>
                          setSettleAllDialog({
                            open: true,
                            stateId: row?.id,
                            status: "SETTLED",
                            remarks: "",
                          })
                        }
                      >
                        {actionLoading.settleAllStateId === row?.id ? "Settling..." : "Settle All"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto px-0 pt-0 pb-2">
            <table className="w-full min-w-[1280px] table-auto">
              <thead>
                <tr>
                  {[
                    "State ID",
                    "Driver",
                    "Vehicle",
                    "Type",
                    "Outstanding",
                    "Partner Payable",
                    "Settled",
                    "Status",
                    "Direction",
                    "Last Booking",
                    "Updated",
                    "Actions",
                  ].map((head) => (
                    <th key={head} className={`border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap`}>
                      {head === "Status" ? (
                        <FilterPopover label={head} value={filters.status} options={FILTER_OPTIONS.status} onChange={updateStatusFilter} />
                      ) : head === "Type" ? (
                        <FilterPopover label="Parcel Vehicle Type" value={filters.parcelVehicleType} options={FILTER_OPTIONS.parcelVehicleType} onChange={updateVehicleTypeFilter} />
                      ) : (
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          {head}
                        </Typography>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-8">
                      <div className="flex items-center justify-center">
                        <Spinner className="h-9 w-9" />
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center">
                      <Typography variant="small" color="gray">
                        No parcel commission found.
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const className = `py-3 px-4 ${index === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                    const driverName = [row?.Driver?.firstName, row?.Driver?.lastName].filter(Boolean).join(" ") || "-";
                    const vehicle = row?.Parcel?.vehicleNumber || row?.Auto?.vehicleNumber || "-";
                    const lastUpdated = row?.blockedAt || row?.updatedAt || row?.createdAt;

                    return (
                      <tr key={row?.id || index}>
                        <td className={className}>
                          <Typography variant="small" className="font-semibold text-blue-gray-700">{row?.id}</Typography>
                        </td>
                        <td className={className}>
                          <Typography variant="small" className="font-semibold text-blue-gray-700">{driverName}</Typography>
                          <Typography variant="small" className="text-xs text-blue-gray-500">{row?.Driver?.phoneNumber || "-"}</Typography>
                        </td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{vehicle}</Typography></td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{row?.parcelVehicleType || "-"}</Typography></td>
                        <td className={className}><Typography variant="small" className="font-semibold text-blue-gray-700">{formatAmount(row?.outstandingAmount)}</Typography></td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{formatAmount(row?.totalPartnerPayable)}</Typography></td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{formatAmount(row?.totalSettledAmount)}</Typography></td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{row?.status || "-"}</Typography></td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{row?.settlementDirection || "-"}</Typography></td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{row?.lastBooking?.bookingNumber || row?.lastBookingId || "-"}</Typography></td>
                        <td className={className}><Typography variant="small" className="text-blue-gray-700">{lastUpdated ? moment(lastUpdated).format("DD-MM-YYYY hh:mm A") : "-"}</Typography></td>
                        <td className={className}>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outlined" color="blue-gray" onClick={() => loadHistory(row?.id)}>
                              History
                            </Button>
                            <Button
                              size="sm"
                              className={ColorStyles.bgColor}
                              disabled={actionLoading.settleAllStateId === row?.id}
                              onClick={() =>
                                setSettleAllDialog({
                                  open: true,
                                  stateId: row?.id,
                                  status: "SETTLED",
                                  remarks: "",
                                })
                              }
                            >
                              {actionLoading.settleAllStateId === row?.id ? "Settling..." : "Settle All"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Dialog open={historyDialog.open} size="xl" handler={closeHistoryDialog}>
        <DialogHeader className="flex items-center justify-between gap-2">
          <Typography variant="h6" color="blue-gray" className="text-sm md:text-base">
            Parcel Commission History - State #{historyDialog.stateId}
          </Typography>
          <Button size="sm" variant="text" color="blue-gray" onClick={closeHistoryDialog}>
            Close
          </Button>
        </DialogHeader>
        <DialogBody divider className="max-h-[75vh] overflow-auto">
          {historyDialog.loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-blue-gray-50 p-3 md:grid-cols-4">
                <Typography variant="small" className="font-semibold text-blue-gray-700">
                  Outstanding: {formatAmount(historyDialog.state?.outstandingAmount)}
                </Typography>
                <Typography variant="small" className="font-semibold text-blue-gray-700">
                  Partner Payable: {formatAmount(historyDialog.state?.totalPartnerPayable)}
                </Typography>
                <Typography variant="small" className="font-semibold text-blue-gray-700">
                  Settled: {formatAmount(historyDialog.state?.totalSettledAmount)}
                </Typography>
                <Typography variant="small" className="font-semibold text-blue-gray-700">
                  Status: {historyDialog.state?.status || "-"}
                </Typography>
              </div>

              <div className="md:hidden space-y-3">
                {historyDialog.rows.length === 0 ? (
                  <Typography variant="small" color="gray" className="py-2">
                    No history rows available.
                  </Typography>
                ) : (
                  historyDialog.rows.map((item, index) => (
                    <div key={item?.id || index} className="rounded-lg border border-blue-gray-100 p-3">
                      <Typography variant="small" className="font-bold text-blue-gray-700 mb-1">
                        Row #{item?.id}
                      </Typography>
                      <div className="space-y-1">
                        <Typography variant="small">Booking: {item?.Booking?.bookingNumber || item?.bookingId || "-"}</Typography>
                        <Typography variant="small">Payment: {item?.paymentType || "-"}</Typography>
                        <Typography variant="small">Collection: {item?.collectionType || "-"}</Typography>
                        <Typography variant="small">Received: {formatAmount(item?.totalAmountReceived)}</Typography>
                        <Typography variant="small">Commission: {formatAmount(item?.totalCommission)}</Typography>
                        <Typography variant="small">Partner Amount: {formatAmount(item?.partnerAmount)}</Typography>
                        <Typography variant="small">Status: {item?.status || "-"}</Typography>
                        <Typography variant="small">Settled At: {item?.settledAt ? moment(item.settledAt).format("DD-MM-YYYY hh:mm A") : "-"}</Typography>
                      </div>
                      <div className="mt-3">
                        <Button
                          size="sm"
                          disabled={!isPending(item?.status) || actionLoading.settleOneId === item?.id}
                          className={ColorStyles.bgColor}
                          onClick={() =>
                            setSettleOneDialog({
                              open: true,
                              parcelCommissionId: item?.id,
                              status: "SETTLED",
                              remarks: "",
                            })
                          }
                        >
                          {actionLoading.settleOneId === item?.id ? "Settling..." : "Settle"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[1220px] table-auto text-left">
                  <thead>
                    <tr>
                      {[
                        "ID",
                        "Booking",
                        "Payment",
                        "Collection",
                        "Total Received",
                        "Commission",
                        "Partner Amount",
                        "Status",
                        "Settled At",
                        "Actions",
                      ].map((head) => (
                        <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 py-2 px-3">
                          <Typography variant="small" className="font-semibold text-blue-gray-700">
                            {head}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyDialog.rows.length === 0 ? (
                      <tr>
                        <td className="py-6 px-3" colSpan={10}>
                          <Typography variant="small" color="gray">
                            No history rows available.
                          </Typography>
                        </td>
                      </tr>
                    ) : (
                      historyDialog.rows.map((item, index) => {
                        const className = index === historyDialog.rows.length - 1 ? "py-2 px-3" : "border-b border-blue-gray-50 py-2 px-3";
                        return (
                          <tr key={item?.id || index}>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{item?.id}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{item?.Booking?.bookingNumber || item?.bookingId || "-"}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{item?.paymentType || "-"}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{item?.collectionType || "-"}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{formatAmount(item?.totalAmountReceived)}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{formatAmount(item?.totalCommission)}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{formatAmount(item?.partnerAmount)}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{item?.status || "-"}</Typography></td>
                            <td className={className}><Typography variant="small" className="text-blue-gray-700">{item?.settledAt ? moment(item.settledAt).format("DD-MM-YYYY hh:mm A") : "-"}</Typography></td>
                            <td className={className}>
                              <Button
                                size="sm"
                                disabled={!isPending(item?.status) || actionLoading.settleOneId === item?.id}
                                className={ColorStyles.bgColor}
                                onClick={() =>
                                  setSettleOneDialog({
                                    open: true,
                                    parcelCommissionId: item?.id,
                                    status: "SETTLED",
                                    remarks: "",
                                  })
                                }
                              >
                                {actionLoading.settleOneId === item?.id ? "Settling..." : "Settle"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogBody>
      </Dialog>

      <Dialog
        open={settleOneDialog.open}
        handler={() => setSettleOneDialog({ open: false, parcelCommissionId: null, status: "SETTLED", remarks: "" })}
        size="sm"
      >
        <DialogHeader>Settle Commission Row</DialogHeader>
        <DialogBody divider className="space-y-4">
          <Typography variant="small" color="blue-gray">
            Parcel Commission ID: <span className="font-semibold">{settleOneDialog.parcelCommissionId}</span>
          </Typography>

          <div>
            <Typography variant="small" className="mb-1 font-semibold text-blue-gray-700">
              Status
            </Typography>
            <Select
              value={settleOneDialog.status}
              onChange={(value) => setSettleOneDialog((prev) => ({ ...prev, status: value || "SETTLED" }))}
            >
              {SETTLEMENT_STATUS_OPTIONS.map((status) => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Typography variant="small" className="mb-1 font-semibold text-blue-gray-700">
              Remarks
            </Typography>
            <Textarea
              label="Remarks"
              value={settleOneDialog.remarks}
              onChange={(event) => setSettleOneDialog((prev) => ({ ...prev, remarks: event.target.value }))}
            />
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button
            variant="outlined"
            color="blue-gray"
            onClick={() => setSettleOneDialog({ open: false, parcelCommissionId: null, status: "SETTLED", remarks: "" })}
          >
            Cancel
          </Button>
          <Button
            className={ColorStyles.bgColor}
            onClick={handleSettleOne}
            disabled={!settleOneDialog.parcelCommissionId || actionLoading.settleOneId === settleOneDialog.parcelCommissionId}
          >
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={settleAllDialog.open}
        handler={() => setSettleAllDialog({ open: false, stateId: null, status: "SETTLED", remarks: "" })}
        size="sm"
      >
        <DialogHeader>Settle All For Partner Bucket</DialogHeader>
        <DialogBody divider className="space-y-4">
          <Typography variant="small" color="blue-gray">
            State ID: <span className="font-semibold">{settleAllDialog.stateId}</span>
          </Typography>
          <Typography variant="small" color="blue-gray">
            Current Outstanding: <span className="font-semibold">{formatAmount(activeStateMap.get(Number(settleAllDialog.stateId))?.outstandingAmount)}</span>
          </Typography>

          <div>
            <Typography variant="small" className="mb-1 font-semibold text-blue-gray-700">
              Status
            </Typography>
            <Select
              value={settleAllDialog.status}
              onChange={(value) => setSettleAllDialog((prev) => ({ ...prev, status: value || "SETTLED" }))}
            >
              {SETTLEMENT_STATUS_OPTIONS.map((status) => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Typography variant="small" className="mb-1 font-semibold text-blue-gray-700">
              Remarks
            </Typography>
            <Textarea
              label="Remarks"
              value={settleAllDialog.remarks}
              onChange={(event) => setSettleAllDialog((prev) => ({ ...prev, remarks: event.target.value }))}
            />
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button
            variant="outlined"
            color="blue-gray"
            onClick={() => setSettleAllDialog({ open: false, stateId: null, status: "SETTLED", remarks: "" })}
          >
            Cancel
          </Button>
          <Button
            className={ColorStyles.bgColor}
            onClick={handleSettleAll}
            disabled={!settleAllDialog.stateId || actionLoading.settleAllStateId === settleAllDialog.stateId}
          >
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default ParcelCommissionList;
