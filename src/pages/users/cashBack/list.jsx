import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardBody, Typography, Spinner, Button, Chip } from "@material-tailwind/react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Checkbox, Popover, PopoverHandler, PopoverContent } from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";


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
const SERVICE_TYPE_OPTIONS = [
  { value: "DRIVER", label: "Driver" },
  { value: "RIDES", label: "Local" },
  { value: "RENTAL_HOURLY_PACKAGE", label: "Hourly Package" },
  { value: "RENTAL_DROP_TAXI", label: "Drop Taxi" },
  { value: "RENTAL", label: "Round Trip" },
  { value: "AUTO", label: "Auto" },
  { value: "PARCEL", label: "Parcel" },
  // { value: "ALL", label: "All" },
];

const SERVICE_TYPE_LABEL_MAP = SERVICE_TYPE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const CashBackList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypeFilter, setServiceTypeFilter] = useState(() => sessionStorage.getItem("cashBackServiceFilter") || "All");
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem("cashBackStatusFilter") || "true");

  const fetchCashBackList = async () => {
    try {
      setLoading(true);
      const params = {};
      if (serviceTypeFilter !== "All") {
        params.serviceType = serviceTypeFilter;
      }
      params.isActive = statusFilter === "true";

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_CASH_BACK, params);
      const list = Array.isArray(response?.data)
        ? response.data
        : response?.data
        ? [response.data]
        : [];

      const sortedList = [...list].sort(
        (a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0)
      );
      setItems(sortedList);
    } catch (error) {
      console.error("Failed to fetch cash back list:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    sessionStorage.setItem("cashBackServiceFilter", serviceTypeFilter); 
    sessionStorage.setItem("cashBackStatusFilter", statusFilter); }, 
    [serviceTypeFilter, statusFilter]);

  useEffect(() => {
    fetchCashBackList();
  }, [serviceTypeFilter, statusFilter]);

  const rows = useMemo(
    () =>
      items.map((item) => {
        const id = item?.settingId || item?.id || item?.cashBackId || item?._id;
        return {
          id,
          name: item?.name || "-",
          serviceType:
            SERVICE_TYPE_LABEL_MAP[item?.serviceType] || item?.serviceType || "-",
          zones: Array.isArray(item?.config?.zones) ? item.config.zones.join(", ") : "-",
          cashbackDiscount:
            item?.config?.cashbackDiscount !== undefined && item?.config?.cashbackDiscount !== null
              ? Number(item.config.cashbackDiscount).toFixed(2)
              : "-",
          isActive: Boolean(item?.isActive),
          createdAt: item?.created_at || item?.createdAt,
          raw: item,
        };
      }),
    [items]
  );

  return (
    <div className="mb-8 flex flex-col gap-6 mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <div className="flex items-center justify-between gap-4">
            <Typography variant="h6" color="white">Cash Back List</Typography>
            <Button size="sm" className="rounded-xl bg-white px-4 py-2 text-black shadow-none hover:shadow-none" onClick={() => navigate("/dashboard/finance/cash-back/add")}>Add Cash Back</Button>
          </div>
        </CardHeader>
        <CardBody className="pt-0 px-0">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] table-auto">
                <thead>
                  <tr>
                    <th className="py-3 px-5 text-left">Name</th>
                    <th className="py-3 px-5 text-left">
                      <FilterPopover label="Service Type" 
                      value={serviceTypeFilter} 
                      options={[{
                        value:"All",label:"All Service Types"}, 
                      ...SERVICE_TYPE_OPTIONS]} 
                      onChange={setServiceTypeFilter} />
                      </th>
                    <th className="py-3 px-5 text-left">Zones</th>
                    <th className="py-3 px-5 text-left">Cashback Discount (%)</th>
                    <th className="py-3 px-5 text-left">
                      <FilterPopover 
                      label="Status" 
                      value={statusFilter} 
                      options={[
                        {value:"true",label:"Active"},
                        {value:"false",label:"Inactive"}]} 
                        onChange={setStatusFilter} />
                        </th>
                    <th className="py-3 px-5 text-left">Created At</th>
                    <th className="py-3 px-5 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 px-5 text-center text-gray-600">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id || row.name} className="border-b">
                        <td className="py-3 px-5">{row.name}</td>
                        <td className="py-3 px-5">{row.serviceType}</td>
                        <td className="py-3 px-5">{row.zones}</td>
                        <td className="py-3 px-5">{row.cashbackDiscount}</td>
                        <td className="py-3 px-5">
                          <Chip
                            variant="ghost"
                            color={row.isActive ? "green" : "blue-gray"}
                            value={row.isActive ? "Active" : "Inactive"}
                            className="w-fit"
                          />
                        </td>
                        <td className="py-3 px-5">
                          {row.createdAt ? moment(row.createdAt).format("DD-MM-YYYY / hh:mm A") : "-"}
                        </td>
                        <td className="py-3 px-5">
                          <Button
                            size="sm"
                            className={`rounded-xl ${ColorStyles.continueButtonColor}`}
                            onClick={() =>
                              navigate(`/dashboard/finance/cash-back/edit/${row.id}`, {
                                state: { cashBack: row.raw },
                              })
                            }
                            disabled={!row.id}
                          >
                            Edit
                          </Button>
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

export default CashBackList;
