import React, { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import FinanceSubscriptionTabs from "@/pages/finance/components/FinanceSubscriptionTabs";

const SERVICE_TYPE_LABELS = {
  DRIVER: "Driver",
  RIDES_RENTAL_CABS: "Rides/Rental Cabs",
  AUTO: "Auto",
  BIKE: "Bike",
};

export default function JoiningBonusView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [allRows, setAllRows] = useState([]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tabLoadingPath, setTabLoadingPath] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (serviceFilter) params.serviceType = serviceFilter;
        if (statusFilter) params.status = statusFilter;
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.MASTER_JOINS_BOUNCE, params);
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
        setAllRows(data);
      } catch (error) {
        console.error("Error fetching joining bonus data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [serviceFilter, statusFilter]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allRows;
    return allRows.filter((row) =>
      [row?.name, row?.code, row?.serviceType, row?.status, row?.zone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [allRows, searchQuery]);

  const getStatusBadgeClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";
      case "INACTIVE":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatServiceType = (value) => SERVICE_TYPE_LABELS[value] || value || "-";

  const handleTabClick = (path) => {
    if (path === "/dashboard/finance/joining-bonus") return;
    setTabLoadingPath(path);
    navigate(path);
  };

  return (
    <div className="p-4 bg-white rounded-xl sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-12">
        <FinanceSubscriptionTabs activePath="/dashboard/finance/joining-bonus" loadingPath={tabLoadingPath} onTabClick={handleTabClick} />
        <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-grow">
              <div className="relative flex-grow max-w-[320px]">
                <input
                  type="text"
                  className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Search Joining Bonus..."
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Service Types</option>
                <option value="ACTING_DRIVER">Driver</option>
                <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                <option value="AUTO">Autos</option>
                <option value="BIKE">Bikes</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">In Active</option>
              </select>
            </div>
            <button
              onClick={() => navigate("/dashboard/finance/joining-bonus/add")}
              className={`ml-4 px-4 py-2 rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${ColorStyles.addButtonColor}`}
            >
              Add new
            </button>
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Spinner className="h-10 w-10 text-primary-600" />
                <p className="text-sm text-gray-500">Loading joining bonus data...</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader variant="gradient" className={`mb-8 p-6 flex-1 justify-between items-center ${ColorStyles.bgColor}`}>
                <Typography variant="h6" color="white">
                  Joining Bonus List
                </Typography>
              </CardHeader>
              <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                <table className="w-full min-w-full table-auto">
                  <thead>
                    <tr>
                      {["Service Type", "Plan Group", "Zone", "Status", "Actions"].map((el) => (
                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left whitespace-nowrap">
                          <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                            {el}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row, index) => (
                        <tr key={row.id || index} className="text-sm">
                          <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">{formatServiceType(row.serviceType)}</td>
                          <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">{row.name || row.planGroupName || "-"}</td>
                          <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">{row.zone || "-"}</td>
                          <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                            <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row.status)}`}>
                              {row.status || "-"}
                            </span>
                          </td>
                          <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/finance/joining-bonus/edit/${row.id}`)}
                              className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                          No Joining Bonus data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardBody>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}