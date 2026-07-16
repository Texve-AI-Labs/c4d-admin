import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button, Card, CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

const STATUS_TABS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const getStatusBadgeClass = (status,tier) => {
  switch (String(status || tier || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 border-green-200";
    case "INACTIVE":
      return "bg-red-100 text-red-700 border-red-200";
    case "SILVER":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "GOLD":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "ELITE":
      return "bg-violet-100 text-violet-700 border-violet-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const normalizePlanName = (value) => {
  if (!value) return "";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "premium") return "Premium";
  if (normalized === "standard") return "Standard";
  if (normalized === "regular") return "Regular";
  return value;
};

const formatEligible = (value) => (value ? "Yes" : "No");

export default function ReturnTripDriverSubscriptionView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ACTIVE");

  useEffect(() => {
    const nextStatus = searchParams.get("status") || "ACTIVE";
    setStatusFilter(nextStatus);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const queryParams = {};
      if (statusFilter) {
        queryParams.status = statusFilter;
      }

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_RETURN_TRIP_ELIGIBILITY, queryParams);
      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.result)
          ? response.result
          : [];
      setRows(data);
    };
    fetchData().catch((error) => console.error("Error fetching return trip eligibility:", error));
  }, [statusFilter]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
        [row?.tier, row?.planName, row?.serviceType, row?.status, row?.zone, row?.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, searchQuery]);

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="p-4  bg-gray-50 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Card className="inline-block border border-blue-gray-100 shadow-none">
            <CardBody className="flex flex-wrap gap-2 p-2">
              {STATUS_TABS.map((tab) => {
                const isActive = statusFilter === tab.value;
                return (
                  <Button
                    key={tab.value}
                    variant={isActive ? "filled" : "text"}
                    color={isActive ? "teal" : "blue-gray"}
                    onClick={() => {
                      setStatusFilter(tab.value);
                      setSearchParams({ status: tab.value });
                    }}
                    className={`normal-case text-sm px-4 py-2 ${!isActive ? "text-blue-gray-700" : ""}`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </CardBody>
          </Card>
          {/* <div className="relative flex-grow max-w-[420px]">
            <input
              type="text"
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Search plan, service type, status"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div> */}
          <button
            onClick={() => navigate("/dashboard/finance/master-subscription/return-trip-driver/add")}
            className="rounded-md border border-emerald-700 bg-primary-600 px-4 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Add new
          </button>
        </div>
      </div>

      <Card>
        <CardHeader variant="gradient" color="blue" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Return Trip Driver Subscription List
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[900px] table-auto">
            <thead>
              <tr>
                {["Tier","Plan Name", "Service Type", "Eligible", "Status","Zone", "Notes"].map((heading) => (
                  <th key={heading} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] text-black font-bold uppercase">
                      {heading}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (filteredRows.map((row) => (
                <tr key={row.id} className="text-sm">
                  <td className="border-b border-blue-gray-50 py-3 px-5">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row.tier)}`}>
                      {row.tier || "-"}
                    </span>
                  </td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">{normalizePlanName(row.planName)}</td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">
                    <span
                      className="cursor-pointer text-blue-600 underline decoration-blue-600 underline-offset-2"
                      onClick={() => navigate(`/dashboard/finance/master-subscription/return-trip-driver/details/${row.id}`)}
                    >
                      {row.serviceType || "-"}
                    </span>
                  </td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">{formatEligible(row.eligibleForReturnTrip)}</td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row.status)}`}>
                      {row.status || "-"}
                    </span>
                  </td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">
                    <span className="inline-flex items-center rounded-full border border-blue-gray-200 bg-blue-gray-50 px-3 py-1 text-xs font-semibold text-blue-gray-700">
                      {row.zone || "-"}
                    </span>
                  </td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">{row.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                    No Return Trip Driver Subscription data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
