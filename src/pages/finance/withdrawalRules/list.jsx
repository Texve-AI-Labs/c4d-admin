import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Checkbox, Popover, PopoverContent, PopoverHandler, Spinner, Typography } from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { useNavigate, useSearchParams } from "react-router-dom";

const badgeClassByValue = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "ACTIVE") return "bg-green-100 text-green-700 border-green-200";
  if (normalized === "INACTIVE") return "bg-red-100 text-red-700 border-red-200";
  if (normalized === "SILVER") return "bg-slate-100 text-slate-700 border-slate-200";
  if (normalized === "GOLD") return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "ELITE") return "bg-violet-100 text-violet-700 border-violet-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const ENTITY_TYPE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "CAB", label: "Rides Rental Cabs" },
  { value: "DRIVER", label: "Driver" },
  { value: "AUTO", label: "Auto" },
  { value: "BIKE", label: "Bike" },
  { value: "PARCEL", label: "Parcel" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function FilterPopover({ label, value, options, onChange }) {
  return (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <button type="button" className="flex items-center cursor-pointer">
          <Typography variant="small" className="mr-1 text-sm font-bold text-blue-gray-700">{label}</Typography>
          <FaFilter className="text-blue-gray-700 text-xs" />
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

const WithdrawalRulesList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState(() => sessionStorage.getItem("withdrawalRulesEntityType") || searchParams.get("entityType") || "ALL");
  const [isActiveFilter, setIsActiveFilter] = useState(() => sessionStorage.getItem("withdrawalRulesStatus") || searchParams.get("isActive") || "ALL");

  useEffect(() => {
    sessionStorage.setItem("withdrawalRulesEntityType", entityTypeFilter);
    sessionStorage.setItem("withdrawalRulesStatus", isActiveFilter);
  }, [entityTypeFilter, isActiveFilter]);

  useEffect(() => {
    if (searchParams.has("entityType")) setEntityTypeFilter(searchParams.get("entityType") || "ALL");
    if (searchParams.has("isActive")) setIsActiveFilter(searchParams.get("isActive") || "ALL");
  }, [searchParams]);

  useEffect(() => {
    const fetchWithdrawalRules = async () => {
      try {
        setLoading(true);
        const query = {};
        if (entityTypeFilter !== "ALL") query.entityType = entityTypeFilter;
        if (isActiveFilter !== "ALL") query.isActive = isActiveFilter;
        const res = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_WITHDRAWAL_RULES, query);
        if (res?.success && Array.isArray(res.data)) {
          setItems(res.data);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch withdrawal rules:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalRules();
  }, [entityTypeFilter, isActiveFilter]);

  const filteredItems = useMemo(() => items, [items]);

  return (
    <div className="mb-8 flex flex-col gap-6 mt-8">
      <Card className="mt-2">
        <CardHeader variant="gradient" className={`mb-4 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <div className="flex items-center justify-between gap-4">
            <Typography variant="h6" color="white">Withdrawal Rules List</Typography>
            <Button size="sm" className="rounded-xl bg-white px-5 py-3 text-black shadow-none hover:shadow-none" onClick={() => navigate("/dashboard/finance/withdrawal-rules/add")}>Add New</Button>
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
                    <th className="whitespace-nowrap py-3 px-5 text-left"><FilterPopover label="Entity Type" value={entityTypeFilter} options={ENTITY_TYPE_OPTIONS} onChange={setEntityTypeFilter} /></th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Tier</th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Name</th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Withdrawal Allowed</th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Min Amount</th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Max Amount</th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Minimum Hold Amount</th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Description</th>
                    <th className="whitespace-nowrap py-3 px-5 text-left"><FilterPopover label="Status" value={isActiveFilter} options={STATUS_OPTIONS} onChange={setIsActiveFilter} /></th>
                    <th className="whitespace-nowrap py-3 px-5 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-4 px-5 text-center text-gray-600">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={item.id ?? index} className="border-b">
                        <td className="py-3 px-5">{item.entityType ?? "-"}</td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClassByValue(item.tier)}`}>
                            {item.tier ?? "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 px-5">{item.name ?? "-"}</td>
                        <td className="py-3 px-5">
                          {item.isWithdrawalAllowed === true ? "Yes" : item.isWithdrawalAllowed === false ? "No" : "-"}
                        </td>
                        <td className="whitespace-nowrap py-3 px-5">₹ {item.minWithdrawalAmount ?? "-"}</td>
                        <td className="whitespace-nowrap py-3 px-5">₹ {item.maxWithdrawalAmount ?? "-"}</td>
                        <td className="whitespace-nowrap py-3 px-5">₹ {item.minimumHoldAmount ?? "-"}</td>
                        <td className="py-3 px-5">{item.description ?? "-"}</td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClassByValue(item.isActive ? "ACTIVE" : "INACTIVE")}`}>
                            {item.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <Button
                            size="sm"
                            className={`rounded-lg ${ColorStyles.continueButtonColor}`}
                            onClick={() => navigate(`/dashboard/finance/withdrawal-rules/edit/${item.id}`, { state: { item } })}
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

export default WithdrawalRulesList;
