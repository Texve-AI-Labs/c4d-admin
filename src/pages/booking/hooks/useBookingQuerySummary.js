import { useCallback } from "react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

export const useBookingQuerySummary = ({
  pagination,
  statusFilter,
  sourceFilter,
  tripCoordinatorFilter,
  zoneFilter,
  effectiveSearchId,
  activeTab,
  dateFilter,
  customDateFrom,
  customDateTo,
  customerId,
  type,
  summaryRequestRef,
  DEFAULT_COUNTS,
  setCounts,
}) => {
  const buildBookingQueryParams = useCallback(
    ({
      page = pagination.currentPage,
      statusFilterParam = statusFilter,
      sourceFilterParam = sourceFilter,
      tripCoordinatorFilterParam = tripCoordinatorFilter,
      zoneFilterParam = zoneFilter,
      effectiveSearchIdParam = effectiveSearchId,
      activeTabParam = activeTab,
      startDateOverride,
      endDateOverride,
    } = {}) => {
      const filterType = {
        type: activeTabParam,
        source: sourceFilterParam,
        tripCoordinator: tripCoordinatorFilterParam,
        zone: zoneFilterParam.includes("All") ? ["All"] : zoneFilterParam,
      };
      if (!statusFilterParam.includes("All")) {
        filterType.status = statusFilterParam;
        filterType.tripStatus = statusFilterParam.includes("COMPLETED")
          ? true
          : statusFilterParam.includes("ENDED")
          ? false
          : undefined;
      }

      let startDate = startDateOverride;
      let endDate = endDateOverride;
      if (typeof startDate === "undefined" || typeof endDate === "undefined") {
        if (activeTabParam === "TODAY") {
          const today = moment().format("YYYY-MM-DD");
          startDate = today;
          endDate = today;
        } else if (activeTabParam === "REMAINING") {
          startDate = moment().add(1, "day").format("YYYY-MM-DD");
          endDate = "";
        } else if (dateFilter === "Last 7 days") {
          startDate = moment().subtract(7, "days").format("YYYY-MM-DD");
          endDate = moment().format("YYYY-MM-DD");
        } else if (activeTabParam === "CUSTOM_DATE") {
          startDate = customDateFrom;
          endDate = customDateTo;
        } else {
          startDate = "";
          endDate = "";
        }
      }

      const queryParams = {
        customerId,
        type: type ? type : "",
        page,
        limit: pagination.itemsPerPage,
        filterType: JSON.stringify(filterType),
        bookingNumber: effectiveSearchIdParam,
      };
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;
      return queryParams;
    },
    [
      pagination,
      statusFilter,
      sourceFilter,
      tripCoordinatorFilter,
      zoneFilter,
      effectiveSearchId,
      activeTab,
      dateFilter,
      customDateFrom,
      customDateTo,
      customerId,
      type,
    ]
  );

  const fetchBookingSummary = useCallback(
    async (queryParams) => {
      const currentSummaryRequestId = ++summaryRequestRef.current;
      try {
        const data = await ApiRequestUtils.getWithQueryParam(
          API_ROUTES.GET_ADMIN_BOOKINGS_SUMMARY,
          queryParams
        );
        if (currentSummaryRequestId !== summaryRequestRef.current) return;
        if (data?.success) {
          const summaryCounts = data?.counts || data?.data || DEFAULT_COUNTS;
          setCounts(summaryCounts);
        } else {
          setCounts(DEFAULT_COUNTS);
        }
      } catch (error) {
        console.error("Error fetching booking summary:", error);
        if (currentSummaryRequestId !== summaryRequestRef.current) return;
        setCounts(DEFAULT_COUNTS);
      }
    },
    [summaryRequestRef, DEFAULT_COUNTS, setCounts]
  );

  const buildSummaryQueryParams = useCallback(
    ({
      page = pagination.currentPage,
      statusFilterParam = statusFilter,
      sourceFilterParam = sourceFilter,
      tripCoordinatorFilterParam = tripCoordinatorFilter,
      zoneFilterParam = zoneFilter,
      effectiveSearchIdParam = effectiveSearchId,
      activeTabParam = activeTab,
      startDateOverride,
      endDateOverride,
    } = {}) =>
      buildBookingQueryParams({
        page,
        statusFilterParam,
        sourceFilterParam,
        tripCoordinatorFilterParam,
        zoneFilterParam,
        effectiveSearchIdParam,
        activeTabParam,
        startDateOverride,
        endDateOverride,
      }),
    [
      pagination.currentPage,
      statusFilter,
      sourceFilter,
      tripCoordinatorFilter,
      zoneFilter,
      effectiveSearchId,
      activeTab,
      buildBookingQueryParams,
    ]
  );

  return {
    buildBookingQueryParams,
    fetchBookingSummary,
    buildSummaryQueryParams,
  };
};

