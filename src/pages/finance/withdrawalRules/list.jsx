import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
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

const WithdrawalRulesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState(searchParams.get("entityType") || "");
  const [isActiveFilter, setIsActiveFilter] = useState(searchParams.get("isActive") || "");

  useEffect(() => {
    setEntityTypeFilter(searchParams.get("entityType") || "");
    setIsActiveFilter(searchParams.get("isActive") || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchWithdrawalRules = async () => {
      try {
        setLoading(true);
        const query = {};
        if (entityTypeFilter) query.entityType = entityTypeFilter;
        if (isActiveFilter !== "") query.isActive = isActiveFilter;
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                const next = e.target.value;
                setEntityTypeFilter(next);
                setSearchParams((prev) => {
                  const nextParams = new URLSearchParams(prev);
                  if (next) nextParams.set("entityType", next);
                  else nextParams.delete("entityType");
                  return nextParams;
                });
              }}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All</option>
              <option value="RIDES_RENTAL_CABS">RIDES_RENTAL_CABS</option>
              <option value="ACTING_DRIVER">ACTING_DRIVER</option>
              <option value="AUTO">AUTO</option>
              <option value="BIKE">BIKE</option>
              <option value="PARCEL">PARCEL</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={isActiveFilter}
              onChange={(e) => {
                const next = e.target.value;
                setIsActiveFilter(next);
                setSearchParams((prev) => {
                  const nextParams = new URLSearchParams(prev);
                  if (next !== "") nextParams.set("isActive", next);
                  else nextParams.delete("isActive");
                  return nextParams;
                });
              }}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <Button
          size="sm"
          className={`rounded-xl p-4 ${ColorStyles.continueButtonColor}`}
          onClick={() => navigate("/dashboard/finance/withdrawal-rules/add")}
        >
          Add New
        </Button>
      </div>

      <Card className="mt-2">
        <CardHeader variant="gradient" className={`mb-4 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Withdrawal Rules List
          </Typography>
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
                    <th className="py-3 px-5 text-left">Entity Type</th>
                    <th className="py-3 px-5 text-left">Tier</th>
                    <th className="py-3 px-5 text-left">Name</th>
                    <th className="py-3 px-5 text-left">Withdrawal Allowed</th>
                    <th className="py-3 px-5 text-left">Min Amount</th>
                    <th className="py-3 px-5 text-left">Max Amount</th>
                    <th className="py-3 px-5 text-left">Description</th>
                    <th className="py-3 px-5 text-left">Status</th>
                    <th className="py-3 px-5 text-left">Action</th>
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
                        <td className="py-3 px-5">{item.name ?? "-"}</td>
                        <td className="py-3 px-5">
                          {item.isWithdrawalAllowed === true ? "Yes" : item.isWithdrawalAllowed === false ? "No" : "-"}
                        </td>
                        <td className="py-3 px-5">{item.minWithdrawalAmount ?? "-"}</td>
                        <td className="py-3 px-5">{item.maxWithdrawalAmount ?? "-"}</td>
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
