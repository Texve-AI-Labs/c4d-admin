import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Option,
  Select,
  Spinner,
  Typography,
} from "@material-tailwind/react";
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

function ParcelSlotConfigList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subZoneLookup, setSubZoneLookup] = useState({});
  const [ruleTypeFilter, setRuleTypeFilter] = useState("ALL");
  const [isActiveFilter, setIsActiveFilter] = useState("ALL");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  useEffect(() => {
    const fetchGeoLookup = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {});
        const allGeo = Array.isArray(response?.data) ? response.data : [];
        const subZones = allGeo.filter((area) => area.type === "Zone" && area.description === "Zone");
        const lookup = subZones.reduce((acc, area) => {
          const id = String(area.id ?? area._id ?? "");
          const label = area.name || area.label || "";
          if (id) acc[id] = label;
          return acc;
        }, {});
        setSubZoneLookup(lookup);
      } catch (error) {
        console.error("Failed to load geo lookup:", error);
        setSubZoneLookup({});
      }
    };

    fetchGeoLookup();
  }, []);

  const fetchSlotRules = useCallback(async (page = 1, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.GET_ADMIN_PARCEL_SLOT_RULES,
        {
          limit: pagination.itemsPerPage,
          offset: Math.max(0, (page - 1) * pagination.itemsPerPage),
          ruleType: ruleTypeFilter || "ALL",
          isActive:
            isActiveFilter === "ALL"
              ? ""
              : isActiveFilter === "true"
                ? true
                : false,
        }
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
      console.error("Failed to fetch parcel slot rules:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage, ruleTypeFilter, isActiveFilter]);

  useEffect(() => {
    fetchSlotRules(pagination.currentPage, true);
  }, [fetchSlotRules, pagination.currentPage]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [ruleTypeFilter, isActiveFilter]);

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

  const getSpecialDateCount = (item) => Object.keys(item?.config?.specialDates || {}).length;
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
    navigate(`/dashboard/finance/parcel-slot-config/edit/${id}`, { state: { slotRule: item } });
  };

  return (
    <div className="mb-8 mt-5 flex flex-col gap-6">
      <div className="mb-2 p-4 rounded-xl border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[220px] flex-col gap-1 text-sm font-semibold text-blue-gray-700">
            <span className="cursor-pointer font-medium">Rule Type</span>
            <Select value={ruleTypeFilter} onChange={(value) => setRuleTypeFilter(value || "ALL")}>
              <Option value="ALL">All</Option>
              <Option value="WEEKLY">Weekly</Option>
              <Option value="SPECIAL_DATE">Special Date</Option>
            </Select>
          </label>

          <label className="flex min-w-[220px] flex-col gap-1 text-sm font-semibold text-blue-gray-700">
            Status
            <Select value={isActiveFilter} onChange={(value) => setIsActiveFilter(value || "ALL")}>
              <Option value="ALL">All</Option>
              <Option value="true">Active</Option>
              <Option value="false">Inactive</Option>
            </Select>
          </label>
        </div>

        <Button
          size="sm"
          className={`rounded-xl px-5 py-3 ${ColorStyles.editButton}`}
          onClick={() => navigate("/dashboard/finance/parcel-slot-config/add")}
        >
          Add New Slot
        </Button>
      </div>

      <Card>
        <CardHeader variant="gradient" className={`mb-5 p-5 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Parcel Slot Config
          </Typography>
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
                      <th className="px-5 py-3 text-left whitespace-nowrap">Zone</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Sub Zone</th>
                      {/* <th className="px-5 py-3 text-left whitespace-nowrap">Rule Type</th> */}
                      <th className="px-5 py-3 text-left whitespace-nowrap">Rule Type</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Date Range</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Days Of Week</th>
                      {/* <th className="px-5 py-3 text-left whitespace-nowrap">Priority</th> */}
                      <th className="px-5 py-3 text-left whitespace-nowrap">Status</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Notes</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Created At</th>
                      <th className="px-5 py-3 text-left whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      rows.map((item, index) => (
                        <tr key={getRuleId(item, index)} className="border">
                          <td className="px-5 py-3 whitespace-nowrap">
                            {formatLabel(item?.zone)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {item?.subZoneName ||
                              item?.subZone?.name ||
                              item?.subZone?.label ||
                              subZoneLookup[String(item?.subZoneId)] ||
                              (item?.subZoneId ? `Sub Zone ${item?.subZoneId}` : "-")}
                          </td>
                          {/* <td className="px-5 py-3 whitespace-nowrap">
                            {formatLabel(item?.ruleType)}
                          </td> */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            {item?.id || item?._id ? (
                              <Link
                                to={`/dashboard/finance/parcel-slot-config/details/${item?.id || item?._id}`}
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
                              : `${getSpecialDateCount(item)} day(s)`}
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

export default ParcelSlotConfigList;