import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Typography, Button, Spinner, Chip } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Swal from "sweetalert2";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { fetchZoneOptions } from "@/pages/marketing/DriverIncentive/zoneOptions";

const SERVICE_TYPES = ["ALL", "DRIVER", "RENTAL", "RIDES", "AUTO", "PARCEL"];
const PRIORITY_OPTIONS = [
  { label: "High", value: 30 },
  { label: "Medium", value: 60 },
  { label: "Low", value: 90 },
];
const getPriorityLabel = (priority) =>
  PRIORITY_OPTIONS.find((item) => item.value === Number(priority))?.label || "Custom";

const getRuleId = (item = {}) => item?.ruleId || item?.id || item?._id;

const DriverBonusList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypeFilter, setServiceTypeFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("true");
  const [zoneOptions, setZoneOptions] = useState([{ label: "ALL", value: "" }]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params = {
        serviceType: String(serviceTypeFilter || "ALL").toUpperCase() === "ALL" ? "" : String(serviceTypeFilter || "").toUpperCase(),
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
  }, [serviceTypeFilter, zoneFilter, isActiveFilter]);

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
      cancelButtonColor: "#db1839"
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
      .sort((a, b) => Number(a?.priority ?? 999999) - Number(b?.priority ?? 999999));
  }, [items]);

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <div className="mb-2 flex items-center justify-end">
        <div className="mr-auto flex flex-wrap items-center gap-3">
          <select className="rounded-md border border-gray-300 p-2 text-sm" value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)}>
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select className="rounded-md border border-gray-300 p-2 text-sm" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
            {zoneOptions.map((zone) => (
              <option key={zone.label} value={zone.value}>{zone.label}</option>
            ))}
          </select>
          <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
            <button type="button" className={`px-3 py-2 text-sm ${isActiveFilter === "true" ? "bg-primary text-white" : "bg-white text-gray-700"}`} onClick={() => setIsActiveFilter("true")}>Active</button>
            <button type="button" className={`border-l border-gray-300 px-3 py-2 text-sm ${isActiveFilter === "false" ? "bg-primary text-white" : "bg-white text-gray-700"}`} onClick={() => setIsActiveFilter("false")}>Inactive</button>
          </div>
        </div>

        <Button size="sm" className={`rounded-xl p-4 ${ColorStyles.continueButtonColor}`} onClick={() => navigate("/dashboard/finance/driver-bonus/add")}>
          Add Rule
        </Button>
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
              <table className="w-full min-w-[1200px] table-auto">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left">Service</th>
                    <th className="px-5 py-3 text-left">Zone</th>
                    <th className="px-5 py-3 text-left">Start</th>
                    <th className="px-5 py-3 text-left">End</th>
                    <th className="px-5 py-3 text-left">Per KM Rate</th>
                    <th className="px-5 py-3 text-left">KM Range</th>
                    <th className="px-5 py-3 text-left">Priority</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-4 text-center text-gray-600">No rules found</td></tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row._ruleId} className="border-b">
                        <td className="px-5 py-3 cursor-pointer text-primary underline" onClick={() => navigate(`/dashboard/finance/driver-bonus/details/${row._ruleId}`)}>{row?.serviceType || "-"}</td>
                        <td className="px-5 py-3">{row?.zone || "-"}</td>
                        <td className="px-5 py-3">{row?.startDate ? moment(row.startDate).format("DD-MM-YYYY") : "-"}</td>
                        <td className="px-5 py-3">{row?.endDate ? moment(row.endDate).format("DD-MM-YYYY") : "-"}</td>
                        <td className="px-5 py-3 font-bold">₹ {row?.perKmRate ?? "-"}</td>
                        <td className="px-5 py-3">{row?.minKm ?? 0} - {row?.maxKm ?? "-"} Kms.</td>
                        <td className="px-5 py-3">{getPriorityLabel(row?.priority)}</td>
                        <td className="px-5 py-3">
                          <Chip variant="ghost" color={row?.isActive ? "green" : "blue-gray"} value={row?.isActive ? "Active" : "Inactive"} className="w-fit" />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            
                            {/* <Button size="sm" color="amber" className="rounded-xl" onClick={() => navigate(`/dashboard/finance/driver-bonus/edit/${row._ruleId}`, { state: { item: row } })}>Edit</Button> */}
                            <Button size="sm" color="red" className="rounded-xl" onClick={() => handleDelete(row._ruleId)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))
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
