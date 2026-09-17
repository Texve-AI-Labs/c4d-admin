import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import {
  CATALOG_SERVICE_TYPE_OPTIONS,
  BOOKING_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  DRIVER_RULE_CAR_TYPE_OPTIONS,
  DRIVER_RULE_PLAN_OPTIONS,
  PACKAGE_TYPE_OPTIONS,
  TARGET_SERVICE_TYPE_OPTIONS,
} from "./constants";
import { getCategoryDriverEligibleList } from "./api";

const normalizeOptionValue = (value) => String(value || "").trim().toUpperCase().replace(/_/g, " ");
const optionLabel = (options, value) => {
  const normalizedValue = normalizeOptionValue(value);
  return options.find((item) => normalizeOptionValue(item.value) === normalizedValue)?.label || value || "-";
};
const serviceLabel = (value) => optionLabel(CATALOG_SERVICE_TYPE_OPTIONS, value);
const targetServiceLabel = (value) => optionLabel(TARGET_SERVICE_TYPE_OPTIONS, value);
const categoryLabel = (value) => optionLabel(CATEGORY_OPTIONS, value);
const packageTypeLabel = (value) => optionLabel(PACKAGE_TYPE_OPTIONS, value);
const bookingTypeLabel = (value) => optionLabel(BOOKING_TYPE_OPTIONS, value);
const carTypeLabel = (value) => optionLabel(DRIVER_RULE_CAR_TYPE_OPTIONS, value);
const planNameLabel = (value) => optionLabel(DRIVER_RULE_PLAN_OPTIONS, value);
const joinRuleLabels = (rules = [], field, formatter) => {
  const values = rules.flatMap((rule) => Array.isArray(rule?.[field]) ? rule[field] : []);
  return [...new Set(values)].map(formatter).join(", ") || "-";
};
const SERVICE_BADGE_CLASSES = {
  RIDES: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RENTAL: "border-amber-200 bg-amber-50 text-amber-700",
  AUTO: "border-sky-200 bg-sky-50 text-sky-700",
  BIKE: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  SCOOTY: "border-rose-200 bg-rose-50 text-rose-700",
};
const CATEGORY_BADGE_CLASSES = {
  ECONOMY_GO: "border-teal-200 bg-teal-50 text-teal-700",
  COMFORT: "border-blue-200 bg-blue-50 text-blue-700",
  PREMIUM: "border-violet-200 bg-violet-50 text-violet-700",
  PREMIUM_XL: "border-indigo-200 bg-indigo-50 text-indigo-700",
  AUTO_SAVER: "border-cyan-200 bg-cyan-50 text-cyan-700",
  AUTO_PLUS: "border-lime-200 bg-lime-50 text-lime-700",
  BIKE: "border-pink-200 bg-pink-50 text-pink-700",
  SCOOTY: "border-orange-200 bg-orange-50 text-orange-700",
};
const Badge = ({ label, className }) => (
  <span className={`inline-flex w-fit items-center rounded-md border px-3 py-1 text-xs font-semibold ${className || "border-gray-200 bg-gray-50 text-gray-700"}`}>
    {label}
  </span>
);
const tableCellClass = "py-3 px-5 whitespace-nowrap";
const FILTER_STORAGE_KEY = "categoryDriverEligibleListFilters";
const getStoredFilters = () => {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Failed to read category driver eligible filters:", error);
    return {};
  }
};
const setStoredFilters = (filters) => {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error("Failed to save category driver eligible filters:", error);
  }
};

export default function CategoryDriverEligibleList() {
  const navigate = useNavigate();
  const storedFilters = getStoredFilters();
  const [rows, setRows] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoneFilter, setZoneFilter] = useState(storedFilters.zoneFilter || "");
  const [catalogServiceType, setCatalogServiceType] = useState(storedFilters.catalogServiceType || "");

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
        const list = Array.isArray(response?.data) ? response.data : [];
        setZones(list.map((item) => ({ value: item.name || item.label || "", label: item.name || item.label || "Unnamed Zone" })).filter((item) => item.value));
      } catch (error) {
        console.error("Failed to load service areas:", error);
      }
    };
    loadZones();
  }, []);

  useEffect(() => {
    setStoredFilters({ zoneFilter, catalogServiceType });
  }, [zoneFilter, catalogServiceType]);

  useEffect(() => {
    const loadList = async () => {
      try {
        setLoading(true);
        const params = {};
        if (zoneFilter) params.zone = zoneFilter;
        if (catalogServiceType) params.catalogServiceType = catalogServiceType;
        const response = await getCategoryDriverEligibleList(params);
        setRows(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load category driver eligible list:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, [zoneFilter, catalogServiceType]);

  return (
    <div className="mb-8 flex flex-col gap-6 mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3 bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Zone</label>
            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
              <option value="">All</option>
              {zones.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Catalog Service Type</label>
            <select value={catalogServiceType} onChange={(e) => setCatalogServiceType(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
              <option value="">All</option>
              {CATALOG_SERVICE_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>
        <Button size="sm" className={`rounded-xl p-4 ${ColorStyles.continueButtonColor}`} onClick={() => navigate("/dashboard/finance/category-driver-eligible/add")}>
          Add New
        </Button>
      </div>
      <Card>
        <CardHeader variant="gradient" className={`m-4 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">Category Driver Eligible List</Typography>
        </CardHeader>
        <CardBody className="px-0 pt-0">
          {loading ? (
            <div className="flex justify-center items-center py-10"><Spinner className="h-12 w-12" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] table-auto">
                <thead>
                  <tr>
                    {["Zone", "Catalog Service", "Target Service", "Category", "Package Type", "Booking Type", "Order", "Visible", "Status", "Car Types", "Plans", "Action"].map((label) => (
                      <th key={label} className="border-b border-blue-gray-50 py-3 px-5 text-left whitespace-nowrap">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">{label}</Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={12} className="py-10 px-5 text-center text-gray-600">No records found</td></tr>
                  ) : rows.map((row, index) => (
                    <tr key={row.id || index} className="border-b">
                      <td className={tableCellClass}>{row.zone || "-"}</td>
                      <td className={tableCellClass}>
                        <Badge label={serviceLabel(row.catalogServiceType)} className={SERVICE_BADGE_CLASSES[row.catalogServiceType]} />
                      </td>
                      <td className={tableCellClass}>
                        <Badge label={targetServiceLabel(row.targetServiceType)} className={SERVICE_BADGE_CLASSES[row.targetServiceType]} />
                      </td>
                      <td className={tableCellClass}>
                        <Badge label={categoryLabel(row.category)} className={CATEGORY_BADGE_CLASSES[row.category]} />
                      </td>
                      <td className={tableCellClass}>{packageTypeLabel(row.packageType)}</td>
                      <td className={tableCellClass}>{bookingTypeLabel(row.bookingType)}</td>
                      <td className={tableCellClass}>{row.displayOrder ?? "-"}</td>
                      <td className={tableCellClass}>{row.isVisible ? "Yes" : "No"}</td>
                      <td className={tableCellClass}>
                        <Chip variant="ghost" color={row.status === "ACTIVE" ? "green" : "blue-gray"} value={row.status || "-"} className="w-fit" />
                      </td>
                      <td className={tableCellClass}>{joinRuleLabels(row.driverRules, "carTypes", carTypeLabel)}</td>
                      <td className={tableCellClass}>{joinRuleLabels(row.driverRules, "planNames", planNameLabel)}</td>
                      <td className={tableCellClass}>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/finance/category-driver-eligible/details/${row.id}`, { state: { item: row } })}>Details</Button>
                          <Button size="sm" className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/finance/category-driver-eligible/edit/${row.id}`, { state: { item: row } })}>Edit</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
