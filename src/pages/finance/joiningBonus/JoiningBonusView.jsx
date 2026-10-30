import React, { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Popover, PopoverHandler, PopoverContent } from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import FinanceSubscriptionTabs from "@/pages/finance/components/FinanceSubscriptionTabs";


function FilterPopover({ label, value, options, onChange }) {
  return (
    <Popover placement="bottom-start">
    <PopoverHandler>
      <button type="button" className="flex items-center cursor-pointer">
        <Typography variant="small" className="mr-1 text-[11px] font-bold uppercase text-black">{label}</Typography>
        <FaFilter className="text-black text-xs" />
      </button>
    </PopoverHandler>
    <PopoverContent className="p-2">
      {options.map((option) => (
        <div key={option.value} className="mb-2 flex items-center">
          <Checkbox color="blue" checked={value === option.value} onChange={() => onChange(option.value)} />
          <Typography color="blue-gray" className="ml-2 font-medium">
            {option.label}
          </Typography>
        </div>
      ))}
    </PopoverContent>
    </Popover>
  );
}
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
  const [serviceFilter, setServiceFilter] = useState(() => sessionStorage.getItem("joiningBonusServiceFilter") || "");
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem("joiningBonusStatusFilter") || "");
  const [tabLoadingPath, setTabLoadingPath] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("joiningBonusServiceFilter", serviceFilter);
    sessionStorage.setItem("joiningBonusStatusFilter", statusFilter);
  }, [serviceFilter, statusFilter]);

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
              <CardHeader variant="gradient" className={`mb-8 rounded-xl p-6 ${ColorStyles.bgColor}`}>
                <div className="flex items-center justify-between gap-4">
                  <Typography variant="h6" color="white">Joining Bonus List</Typography>
                  <button onClick={() => navigate("/dashboard/finance/joining-bonus/add")} className="rounded-xl bg-white px-4 py-2 text-black">Add new</button>
                </div>
              </CardHeader>
              <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                <table className="w-full min-w-full table-auto">
                  <thead>
                    <tr>
                      {["Service Type", "Plan Group", "Zone", "Status", "Actions"].map((el) => (
                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left whitespace-nowrap">
                          {el === "Service Type" ? 
                          <FilterPopover label={el} 
                          value={serviceFilter} 
                          options={[
                            {value:"",label:"All Service Types"},
                            {value:"DRIVER",label:"Driver"},
                            {value:"RIDES_RENTAL_CABS",label:"Rides/Rental Cabs"},
                            {value:"AUTO",label:"Auto"},{value:"BIKE",label:"Bike"}]} 
                            onChange={setServiceFilter} 
                            /> : 
                            el === "Status" ? 
                            <FilterPopover label={el} 
                            value={statusFilter} 
                            options={[
                              {value:"",label:"All Status"},
                              {value:"ACTIVE",label:"Active"},
                              {value:"INACTIVE",label:"Inactive"}]} 
                              onChange={setStatusFilter} 
                              /> : 
                              <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                            {el}
                          </Typography>
                          }
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