import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { fetchZoneOptions } from "../masterSubscription/return-trip-driver/zoneOptions";
import FilterPopover from "./components/FilterPopover";
import { getEligibilityRecords } from "./data";
import {
  PLAN_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  TIER_OPTIONS,
} from "./constants";

const FILTER_KEYS = ["planName", "zone", "tier", "status"];

const getStoredFilters = () =>
  FILTER_KEYS.reduce((filters, key) => {
    filters[key] = sessionStorage.getItem(`futureBooking${key.charAt(0).toUpperCase()}${key.slice(1)}`) || "ALL";
    return filters;
  }, {});

const toOptions = (values) => [
  { value: "ALL", label: "All" },
  ...[...new Set(values.filter((value) => value !== "ALL"))].map((value) => ({
    value,
    label: formatLabel(value),
  })),
];

const formatLabel = (value) =>
  String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getPlanChipClass = (planName) => {
  switch (String(planName || "").toLowerCase()) {
    case "premium":
      return "bg-amber-100 text-amber-800";
    case "standard":
      return "bg-blue-100 text-blue-800";
    case "regular":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTierChipClass = (tier) => {
  switch (String(tier || "").toUpperCase()) {
    case "SILVER":
      return "bg-slate-200 text-slate-800";
    case "GOLD":
      return "bg-amber-100 text-amber-800";
    case "ELITE":
      return "bg-violet-100 text-violet-800";
    case "ALL":
      return "bg-blue-gray-100 text-blue-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function TableHeader({ filters, zones, onFilterChange }) {
  return (
    <thead>
      <tr>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap">
          <FilterPopover
            label="Plan Name"
            value={filters.planName}
            options={toOptions(PLAN_OPTIONS)}
            onChange={(value) => onFilterChange("planName", value)}
          />
        </th>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap"><Typography variant="small" className="text-[11px] font-bold uppercase text-black">Service Type</Typography></th>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap">
          <FilterPopover
            label="Zone"
            value={filters.zone}
            options={zones}
            onChange={(value) => onFilterChange("zone", value)}
          />
        </th>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap">
          <FilterPopover
            label="Tier"
            value={filters.tier}
            options={toOptions(TIER_OPTIONS.filter((value) => value !== "ALL"))}
            onChange={(value) => onFilterChange("tier", value)}
          />
        </th>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap"><Typography variant="small" className="text-[11px] font-bold uppercase text-black">Eligible For Future Booking</Typography></th>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap">
          <FilterPopover
            label="Status"
            value={filters.status}
            options={toOptions(STATUS_OPTIONS)}
            onChange={(value) => onFilterChange("status", value)}
          />
        </th>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap"><Typography variant="small" className="text-[11px] font-bold uppercase text-black">Notes</Typography></th>
        <th className="border-b border-blue-gray-50 px-5 py-3 text-left whitespace-nowrap"><Typography variant="small" className="text-[11px] font-bold uppercase text-black">Actions</Typography></th>
      </tr>
    </thead>
  );
}

function TableRow({ row, onEdit, onView }) {
  return (
    <tr className="border-b">
      <td className="whitespace-nowrap px-5 py-3">
        <Chip
          value={formatLabel(row.planName)}
          className={`w-fit ${getPlanChipClass(row.planName)}`}
        />
      </td>
      <td className="whitespace-nowrap px-5 py-3">{formatLabel(row.serviceType)}</td>
      <td className="whitespace-nowrap px-5 py-3">{formatLabel(row.zone)}</td>
      <td className="whitespace-nowrap px-5 py-3">
        <Chip
          value={formatLabel(row.tier)}
          className={`w-fit ${getTierChipClass(row.tier)}`}
        />
      </td>
      <td className="whitespace-nowrap px-5 py-3">
        <Chip
          value={row.eligibleForFutureBooking ? "Yes" : "No"}
          className={`w-fit ${row.eligibleForFutureBooking ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        />
      </td>
      <td className="whitespace-nowrap px-5 py-3">
        <Chip
          value={formatLabel(row.status)}
          className={`w-fit ${String(row.status).toUpperCase() === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        />
      </td>
      <td className="whitespace-nowrap px-5 py-3">{row.notes || "-"}</td>
      <td className="whitespace-nowrap px-5 py-3">
        <Button
          size="sm"
          className={`rounded-lg ${ColorStyles.continueButtonColor}`}
          onClick={() => onEdit(row)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          className={`ml-2 rounded-lg ${ColorStyles.backButton}`}
          onClick={() => onView(row)}
        >
          View
        </Button>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={8} className="py-10 text-center">
        No Future Booking Eligibility records found.
      </td>
    </tr>
  );
}

export default function FutureBookingEligibilityList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([{ value: "ALL", label: "All" }]);
  const [filters, setFilters] = useState(getStoredFilters);

  useEffect(() => {
    fetchZoneOptions().then((items) => {
      const zoneOptions = items
        .filter((item) => item.value && item.value !== "ALL")
        .map((item) => ({ value: item.value, label: item.label }));
      const uniqueZones = zoneOptions.filter(
        (option, index, options) =>
          options.findIndex((item) => item.value === option.value) === index
      );
      setZones([{ value: "ALL", label: "All" }, ...uniqueZones]);
    });
  }, []);

  useEffect(() => {
    FILTER_KEYS.forEach((key) => {
      const storageKey = `futureBooking${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      sessionStorage.setItem(storageKey, filters[key]);
    });

    const loadRows = async () => {
      setLoading(true);
      const query = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "ALL")
      );
      try {
        const response = await ApiRequestUtils.getWithQueryParam(
          API_ROUTES.GET_FUTURE_BOOKING_ELIGIBILITY,
          query
        );
        setRows(getEligibilityRecords(response));
      } catch (error) {
        console.error("Failed to load future booking eligibility rules:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <div className="flex items-center justify-between gap-4">
            <Typography variant="h6" color="white">
              Future Booking Eligibility
            </Typography>
            <Button
              className="rounded-xl bg-white px-4 py-2 text-black shadow-none hover:shadow-none"
              onClick={() => navigate("/dashboard/finance/future-booking-eligibility/add")}
            >
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pb-2 pt-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <table className="w-full min-w-[1100px] table-auto whitespace-nowrap">
              <TableHeader filters={filters} zones={zones} onFilterChange={handleFilterChange} />
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow
      key={row.id ?? row._id}
                      row={row}
                      onEdit={(item) => navigate(`/dashboard/finance/future-booking-eligibility/edit/${item.id ?? item._id}`, { state: { row: item } })}
                      onView={(item) => navigate(`/dashboard/finance/future-booking-eligibility/details/${item.id ?? item._id}`, { state: { row: item } })}
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}