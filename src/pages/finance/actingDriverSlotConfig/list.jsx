import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverHandler,
  Option,
  Select,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { DAYS } from "./constants";

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

const RULE_TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "SPECIAL_DATE", label: "Special Date" },
];

const STATUS_FILTER_OPTIONS = [
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

function ActingDriverSlotConfigList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [zoneFilter, setZoneFilter] = useState(() => sessionStorage.getItem("actingDriverSlotZoneFilter") || "");
  const [zoneIdFilter, setZoneIdFilter] = useState(() => sessionStorage.getItem("actingDriverSlotZoneIdFilter") || "");
  const [ruleTypeFilter, setRuleTypeFilter] = useState(() => sessionStorage.getItem("actingDriverSlotRuleTypeFilter") || "ALL");
  const [isActiveFilter, setIsActiveFilter] = useState(() => sessionStorage.getItem("actingDriverSlotStatusFilter") || "ALL");
  const [pagination, setPagination] = useState(() => ({ ...DEFAULT_PAGINATION, currentPage: Number(sessionStorage.getItem("actingDriverSlotCurrentPage")) || 1 }));

  useEffect(() => {
    sessionStorage.setItem("actingDriverSlotZoneFilter", zoneFilter);
    sessionStorage.setItem("actingDriverSlotZoneIdFilter", zoneIdFilter);
    sessionStorage.setItem("actingDriverSlotRuleTypeFilter", ruleTypeFilter);
    sessionStorage.setItem("actingDriverSlotStatusFilter", isActiveFilter);
    sessionStorage.setItem("actingDriverSlotCurrentPage", String(pagination.currentPage));
  }, [zoneFilter, zoneIdFilter, ruleTypeFilter, isActiveFilter, pagination.currentPage]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
        const serviceAreas = Array.isArray(response?.data) ? response.data : [];
        setZones(
          serviceAreas
            .filter((area) => area.type === "Service Area")
            .map((area) => ({
              id: String(area.id ?? area._id ?? ""),
              label: area.name || area.label || "Unnamed Zone",
              value: area.name || area.label || "",
            }))
            .filter((area) => area.value)
        );
      } catch (error) {
        console.error("Failed to load acting driver zones:", error);
        setZones([]);
      }
    };

    fetchZones();
  }, []);

  const fetchSlotRules = useCallback(async (page = 1, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const query = {
        limit: pagination.itemsPerPage,
        offset: Math.max(0, (page - 1) * pagination.itemsPerPage),
      };
      if (zoneFilter) query.zone = zoneFilter;
      if (ruleTypeFilter && ruleTypeFilter !== "ALL") query.ruleType = ruleTypeFilter;
      if (isActiveFilter !== "ALL") query.isActive = isActiveFilter === "true";

      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.GET_ADMIN_ACTING_DRIVER_SLOT_RULES,
        query
      );

      if (response?.success) {
        const responseData = response?.data || {};
        const list =
          (Array.isArray(responseData) && responseData) ||
          (Array.isArray(responseData?.data) && responseData.data) ||
          (Array.isArray(responseData?.rows) && responseData.rows) ||
          (Array.isArray(responseData?.items) && responseData.items) ||
          [];
        const totalItems = Number(responseData?.count ?? responseData?.pagination?.totalItems ?? 0) || 0;
        const itemsPerPage = responseData?.pagination?.itemsPerPage || pagination.itemsPerPage;

        setRows(list);
        setPagination({
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          totalItems,
          itemsPerPage,
        });
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to fetch acting driver slot rules:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage, zoneFilter, ruleTypeFilter, isActiveFilter]);

  useEffect(() => {
    fetchSlotRules(pagination.currentPage, true);
  }, [fetchSlotRules, pagination.currentPage]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [zoneFilter, ruleTypeFilter, isActiveFilter]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  const getRuleId = (item, index) => item?.id || item?._id || `${pagination.currentPage}-${index}`;
  const formatLabel = (value) =>
    String(value || "-")
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const formatDayList = (values = []) =>
    Array.isArray(values) && values.length > 0
      ? values
          .map((day) => DAYS.find((item) => item.value === day)?.label || day)
          .join(", ")
      : "-";

  const getSlotCount = (item) => (Array.isArray(item?.config?.slots) ? item.config.slots.length : 0);
  const getWeeklyDays = (item) => formatDayList(item?.daysOfWeek || []);
  const formatCreatedAt = (value) => (value ? moment(value).format("DD-MM-YYYY hh:mm A") : "-");
  const getStatusChip = (isActive) =>
    isActive === false ? (
      <Chip value="INACTIVE" color="red" className="w-fit" />
    ) : (
      <Chip value="ACTIVE" color="green" className="w-fit" />
    );
  const handleEdit = (item) => {
    const id = item?.id || item?._id;
    if (!id) return;
    navigate(`/dashboard/finance/acting-driver-slot-config/edit/${id}`, { state: { slotRule: item } });
  };

  return (
    <div className="mb-8 mt-5 flex flex-col gap-6">
      <Card>
        <CardHeader variant="gradient" className={`mb-5 p-5 ${ColorStyles.bgColor}`}>
          <div className="flex items-center justify-between gap-4">
            <Typography variant="h6" color="white">Acting Driver Slot Config</Typography>
            <Button size="sm" className="rounded-xl bg-white px-5 py-3 text-black shadow-none hover:shadow-none" onClick={() => navigate("/dashboard/finance/acting-driver-slot-config/add")}>Add New Slot</Button>
          </div>
        </CardHeader>
        <CardBody className="pt-0 px-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] table-auto">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 text-left whitespace-nowrap">
                        <FilterPopover
                          label="Zone"
                          value={zoneFilter || "ALL"}
                          options={[{ value: "ALL", label: "All Zones" }, ...zones.map((zone) => ({ value: zone.label, label: zone.label }))]}
                          onChange={(value) => {
                            const selected = zones.find((zone) => zone.label === value);
                            setZoneFilter(value === "ALL" ? "" : value);
                            setZoneIdFilter(value === "ALL" ? "" : selected?.id || "");
                          }}
                        />
                      </th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">
                        <FilterPopover
                          label="Rule Type"
                          value={ruleTypeFilter}
                          options={RULE_TYPE_FILTER_OPTIONS}
                          onChange={setRuleTypeFilter}
                        />
                      </th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Date Range</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Days / Slots</th>
                      {/* <th className="px-5 py-3 text-left whitespace-nowrap">Priority</th> */}
                      <th className="px-5 py-3 text-left whitespace-nowrap">
                        <FilterPopover
                          label="Status"
                          value={isActiveFilter}
                          options={STATUS_FILTER_OPTIONS}
                          onChange={setIsActiveFilter}
                        />
                      </th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Notes</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Created At</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      rows.map((item, index) => (
                        <tr key={getRuleId(item, index)} className="border">
                          <td className="px-5 py-3 whitespace-nowrap">
                            {formatLabel(item?.zone)}
                          </td>
                          {/* <td className="px-5 py-3 whitespace-nowrap">
                            {formatLabel(item?.ruleType)}
                          </td> */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            {item?.id || item?._id ? (
                              <Link
                                to={`/dashboard/finance/acting-driver-slot-config/details/${item?.id || item?._id}`}
                                state={{ slotRule: item }}
                                className="cursor-pointer font-semibold text-blue-600 underline"
                              >
                                {formatLabel(item?.ruleType)}
                              </Link>
                            ) : (
                              formatLabel(item?.ruleType)
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {item?.fromDate || item?.toDate ? `${item?.fromDate || "-"} to ${item?.toDate || "-"}` : "-"}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {item?.ruleType === "WEEKLY"
                              ? getWeeklyDays(item)
                              : `${getSlotCount(item)} slot(s)`}
                          </td>
                          {/* <td className="px-5 py-3 whitespace-nowrap">
                            {item?.priority ?? "-"}
                          </td> */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            {getStatusChip(item?.isActive)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {item?.notes || "-"}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {formatCreatedAt(item?.created_at || item?.createdAt)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <Button
                              size="sm"
                              className={`rounded-lg ${ColorStyles.backButton}`}
                              onClick={() => handleEdit(item)}
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

              <div className="flex items-center justify-center mt-4">
                <Button
                  size="sm"
                  variant="text"
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className="mx-1"
                >
                  {"<"}
                </Button>
                {renderPageButtons()}
                <Button
                  size="sm"
                  variant="text"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className="mx-1"
                >
                  {">"}
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ActingDriverSlotConfigList;
