import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Typography, Button, Spinner, Chip } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Swal from "sweetalert2";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { fetchZoneOptions } from "@/pages/marketing/DriverIncentive/zoneOptions";
import { getPriorityLabel, RATE_TYPES, SERVICE_TYPES } from "./utils";

const getRuleId = (item = {}) => item?.ruleId || item?.id || item?._id;

const DriverBonusList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypeFilter, setServiceTypeFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("");
  const [rateTypeFilter, setRateTypeFilter] = useState("ALL");
    const [labelFilter, setLabelFilter] = useState("ALL");
  const [isActiveFilter, setIsActiveFilter] = useState("true");
  const [zoneOptions, setZoneOptions] = useState([{ label: "ALL", value: "" }]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params = {
        serviceType: String(serviceTypeFilter || "ALL").toUpperCase() === "ALL" ? "" : String(serviceTypeFilter || "").toUpperCase(),
        rateType: String(rateTypeFilter || "ALL").toUpperCase() === "ALL" ? "" : String(rateTypeFilter || "").toUpperCase(),
        isActive: isActiveFilter === "true",
      };

      if (String(zoneFilter || "").trim()) {
        params.zone = String(zoneFilter).trim();
      }

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_KM_INCENTIVE_RULES, params);
      const data = response?.data;
      const list = Array.isArray(data) ? data : data ? [data] : [];
      setItems(list);
    } catch (error) {
      console.error("Failed to fetch driver bonus rules:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [serviceTypeFilter, zoneFilter, rateTypeFilter, isActiveFilter]);

  useEffect(() => {
    const loadZones = async () => {
      const options = await fetchZoneOptions();
      setZoneOptions(Array.isArray(options) && options.length ? options : [{ label: "ALL", value: "" }]);
    };
    loadZones();
  }, []);

  const handleDelete = async (ruleId) => {
    if (!ruleId) return;
    const result = await Swal.fire({
      title: "Delete Rule?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#db1839",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await ApiRequestUtils.delete(`${API_ROUTES.DRIVER_KM_INCENTIVE_RULES}/${ruleId}`);
      if (response?.success) {
        await Swal.fire({
          title: "Deleted",
          text: "Rule deleted successfully.",
          icon: "success",
          confirmButtonColor: "#2563eb",
        });
        fetchRules();
      } else {
        Swal.fire({
          title: "Failed",
          text: response?.error || response?.message || "Unable to delete rule.",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error("Failed to delete rule:", error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong while deleting the rule.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const rows = useMemo(() => {
    return items
      .map((item) => ({ ...item, _ruleId: getRuleId(item) }))
      .filter((item) => {
        if (labelFilter === "ALL") return true;
        return getPriorityLabel(item?.priority).toUpperCase() === labelFilter;
      })
      .sort((a, b) => Number(a?.priority ?? 999999) - Number(b?.priority ?? 999999));
  }, [items, labelFilter]);

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <div className="rounded-2xl border border-blue-gray-50 bg-white p-4 shadow-sm mb-2">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
            <label className="flex flex-col gap-1 text-sm font-semibold text-blue-gray-700">
              Service Type
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
              >
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-blue-gray-700">
              Zone
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
              >
            {zoneOptions.map((zone) => (
              <option key={zone.label} value={zone.value}>{zone.label}</option>
            ))}
          </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-blue-gray-700">
              Rate Type
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
                value={rateTypeFilter}
                onChange={(e) => setRateTypeFilter(e.target.value)}
              >
            <option value="ALL">ALL</option>
            {RATE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-blue-gray-700">
              Label
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
              >
                <option value="ALL">ALL</option>
                {["High", "Medium", "Low", "Custom"].map((label) => (
                  <option key={label} value={label.toUpperCase()}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1 text-sm font-semibold text-blue-gray-700">
              Status
              <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${isActiveFilter === "true" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => setIsActiveFilter("true")}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`border-l border-gray-300 px-4 py-2 text-sm font-semibold transition-colors ${isActiveFilter === "false" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => setIsActiveFilter("false")}
                >
                  Inactive
                </button>
              </div>
            </div>
            <Button size="sm" className={`rounded-xl px-5 py-3 ${ColorStyles.continueButtonColor}`} onClick={() => navigate("/dashboard/finance/driver-bonus/add")}>
              Add Rule
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">Driver KM Incentive Rules</Typography>
        </CardHeader>
        <CardBody className="px-0 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Spinner className="h-12 w-12" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] table-auto">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left">Service</th>
                    <th className="px-5 py-3 text-left">Zone</th>
                    <th className="px-5 py-3 text-left">Rate Type</th>
                    <th className="px-5 py-3 text-left">Rate / Amount</th>
                    <th className="px-5 py-3 text-left">KM Range</th>
                    <th className="px-5 py-3 text-left">Start</th>
                    <th className="px-5 py-3 text-left">End</th>
                    <th className="px-5 py-3 text-left">Priority</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-4 text-center text-gray-600">No rules found</td></tr>
                  ) : (
                    rows.map((row) => {
                      const rateType = String(row?.rateType || (row?.amount !== undefined && row?.amount !== null ? "FLAT_TRIP" : "PER_KM")).toUpperCase();
                      const rateValue = rateType === "FLAT_TRIP" ? row?.amount : row?.perKmRate;
                      const kmRange = rateType === "PER_KM" ? `${row?.minKm ?? 0} - ${row?.maxKm ?? "-"} Kms.` : "-";

                      return (
                      <tr key={row._ruleId} className="border-b">
                        <td className="px-5 py-3 cursor-pointer text-primary underline" onClick={() => navigate(`/dashboard/finance/driver-bonus/details/${row._ruleId}`)}>{row?.serviceType || "-"}</td>
                        <td className="px-5 py-3">{row?.zone || "-"}</td>
                        <td className="px-5 py-3">{rateType}</td>
                        <td className="px-5 py-3 font-bold">₹ {rateValue ?? "-"}</td>
                        <td className="px-5 py-3">{kmRange}</td>
                        <td className="px-5 py-3">{row?.startDate ? moment(row.startDate).format("DD-MM-YYYY") : "-"}</td>
                        <td className="px-5 py-3">{row?.endDate ? moment(row.endDate).format("DD-MM-YYYY") : "-"}</td>
                        <td className="px-5 py-3">{getPriorityLabel(row?.priority)}</td>
                        <td className="px-5 py-3">
                          <Chip variant="ghost" color={row?.isActive ? "green" : "blue-gray"} value={row?.isActive ? "Active" : "Inactive"} className="w-fit" />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" color="amber" className="rounded-xl" onClick={() => navigate(`/dashboard/finance/driver-bonus/edit/${row._ruleId}`, { state: { item: row } })}>Edit</Button>
                            {/* <Button size="sm" color="red" className="rounded-xl" onClick={() => handleDelete(row._ruleId)}>Delete</Button> */}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default DriverBonusList;
