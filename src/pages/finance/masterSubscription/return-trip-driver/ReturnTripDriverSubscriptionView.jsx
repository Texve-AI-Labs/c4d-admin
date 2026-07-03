import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

const getStatusBadgeClass = (status) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 border-green-200";
    case "INACTIVE":
      return "bg-red-100 text-red-700 border-red-200";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await ApiRequestUtils.get(API_ROUTES.GET_RETURN_TRIP_ELIGIBILITY);
      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.result)
          ? response.result
          : [];
      setRows(data);
    };
    fetchData().catch((error) => console.error("Error fetching return trip eligibility:", error));
  }, []);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row?.planName, row?.serviceType, row?.status, row?.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, searchQuery]);

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="p-4  rounded-lg shadow-sm">
        <div className="flex items-end justify-self-end gap-4">
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
            className="ml-4 rounded-md border border-emerald-700 bg-primary-600 px-4 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
                {["Plan Name", "Service Type", "Eligible", "Status", "Notes"].map((heading) => (
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