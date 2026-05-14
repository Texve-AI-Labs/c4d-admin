import { useEffect, useMemo, useRef } from "react";
import { useRealtimeEvents } from "@/context/realtimeEvents";

const PAGE_SUMMARY_DEBOUNCE_MS = 800;
const PAGE_SUMMARY_MIN_INTERVAL_MS = 1800;

export const useBookingSummaryRealtime = ({
  filtersLoaded,
  activeTab,
  customDateFrom,
  customDateTo,
  buildSummaryQueryParams,
  fetchBookingSummary,
  pagination,
  customerId,
  effectiveSearchId,
  type,
  statusFilter,
  sourceFilter,
  tripCoordinatorFilter,
  zoneFilter,
  dateFilter,
}) => {
  const { isLive, isReconnecting, eventSeq, lastEvent } = useRealtimeEvents();
  const scheduleRef = useRef({
    timer: null,
    inFlight: false,
    lastFetchAt: 0,
    pendingAfterFlight: false,
  });

  useEffect(() => {
    if (!filtersLoaded) return;
    if (activeTab === "CUSTOM_DATE" && (!customDateFrom || !customDateTo)) return;
    const queryParams = buildSummaryQueryParams({ page: pagination.currentPage });
    fetchBookingSummary(queryParams);
  }, [
    customerId,
    effectiveSearchId,
    type,
    pagination.currentPage,
    activeTab,
    statusFilter,
    sourceFilter,
    tripCoordinatorFilter,
    zoneFilter,
    dateFilter,
    customDateFrom,
    customDateTo,
    filtersLoaded,
    buildSummaryQueryParams,
    fetchBookingSummary,
  ]);

  const refreshSummary = useMemo(
    () => () => {
      const queryParams = buildSummaryQueryParams({ page: pagination.currentPage });
      return fetchBookingSummary(queryParams);
    },
    [buildSummaryQueryParams, fetchBookingSummary, pagination.currentPage]
  );

  const requestSummaryRefresh = useMemo(
    () => (immediate = false) => {
      const state = scheduleRef.current;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }

      const run = async () => {
        if (state.inFlight) {
          state.pendingAfterFlight = true;
          return;
        }
        state.inFlight = true;
        try {
          await refreshSummary();
          state.lastFetchAt = Date.now();
        } finally {
          state.inFlight = false;
          if (state.pendingAfterFlight) {
            state.pendingAfterFlight = false;
            state.timer = setTimeout(() => {
              run();
            }, PAGE_SUMMARY_DEBOUNCE_MS);
          }
        }
      };

      const elapsed = Date.now() - state.lastFetchAt;
      const canRunNow = immediate || elapsed >= PAGE_SUMMARY_MIN_INTERVAL_MS;
      if (canRunNow) {
        run();
        return;
      }

      state.timer = setTimeout(() => {
        run();
      }, Math.max(PAGE_SUMMARY_DEBOUNCE_MS, PAGE_SUMMARY_MIN_INTERVAL_MS - elapsed));
    },
    [refreshSummary]
  );

  useEffect(() => {
    if (!filtersLoaded) return;
    if (activeTab === "CUSTOM_DATE" && (!customDateFrom || !customDateTo)) return;
    if (!lastEvent) return;

    const eventType = lastEvent.eventType || "message";
    if (eventType === "connected") {
      requestSummaryRefresh(true);
      return;
    }

    if (eventType === "booking_created" || eventType === "booking_status_changed" || eventType === "message") {
      requestSummaryRefresh(false);
    }
  }, [
    eventSeq,
    lastEvent,
    filtersLoaded,
    activeTab,
    customDateFrom,
    customDateTo,
    requestSummaryRefresh,
  ]);

  useEffect(
    () => () => {
      const state = scheduleRef.current;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
    },
    []
  );

  return {
    isLive,
    isReconnecting,
  };
};
