import { useEffect, useMemo, useRef } from "react";
import { useRealtimeEvents } from "@/context/realtimeEvents";

const PAGE_SUMMARY_DEBOUNCE_MS = 800;
const PAGE_SUMMARY_MIN_INTERVAL_MS = 1800;
const SAME_QUERY_DEDUPE_MS = 1200;
const EVENT_DEDUPE_MS = {
  connected: 0,
  booking_created: 400,
  booking_status_changed: 400,
  message: 1000,
};
const MAX_STALE_MS = 20000;
const DEBUG_SUMMARY_REALTIME = false;

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
    isHidden: typeof document !== "undefined" ? document.hidden : false,
    pendingWhileHidden: false,
    lastQueryKey: "",
    lastQueryAt: 0,
    lastSuccessfulSummaryAt: 0,
    debug: {
      dedupedCount: 0,
      hiddenDeferredCount: 0,
      forcedResyncCount: 0,
    },
  });

  const refreshSummary = useMemo(
    () => async ({ dedupeMs = SAME_QUERY_DEDUPE_MS, force = false } = {}) => {
      const queryParams = buildSummaryQueryParams({ page: pagination.currentPage });
      const queryKey = JSON.stringify(queryParams || {});
      const state = scheduleRef.current;
      const now = Date.now();
      if (!force && state.lastQueryKey === queryKey && now - state.lastQueryAt < dedupeMs) {
        state.debug.dedupedCount += 1;
        return;
      }
      state.lastQueryKey = queryKey;
      state.lastQueryAt = now;
      const result = await fetchBookingSummary(queryParams);
      state.lastSuccessfulSummaryAt = Date.now();
      return result;
    },
    [buildSummaryQueryParams, fetchBookingSummary, pagination.currentPage]
  );

  const requestSummaryRefresh = useMemo(
    () =>
      ({
        immediate = false,
        dedupeMs = SAME_QUERY_DEDUPE_MS,
        force = false,
      } = {}) => {
      const state = scheduleRef.current;
      if (state.isHidden) {
        state.pendingWhileHidden = true;
        state.debug.hiddenDeferredCount += 1;
        return;
      }
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
          await refreshSummary({ dedupeMs, force });
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
    requestSummaryRefresh({ immediate: true, force: true });
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
    requestSummaryRefresh,
  ]);

  useEffect(() => {
    if (!filtersLoaded) return;
    if (activeTab === "CUSTOM_DATE" && (!customDateFrom || !customDateTo)) return;
    if (!lastEvent) return;

    const eventType = lastEvent.eventType || "message";
    if (eventType === "connected") {
      requestSummaryRefresh({ immediate: true, dedupeMs: EVENT_DEDUPE_MS.connected });
      return;
    }

    if (eventType === "booking_created" || eventType === "booking_status_changed" || eventType === "message") {
      requestSummaryRefresh({ immediate: false, dedupeMs: EVENT_DEDUPE_MS[eventType] ?? SAME_QUERY_DEDUPE_MS });
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

  useEffect(() => {
    const onVisibilityChange = () => {
      const state = scheduleRef.current;
      state.isHidden = document.hidden;
      if (!document.hidden && state.pendingWhileHidden) {
        state.pendingWhileHidden = false;
        const staleMs = Date.now() - (state.lastSuccessfulSummaryAt || 0);
        const force = staleMs > MAX_STALE_MS;
        if (force) {
          state.debug.forcedResyncCount += 1;
        }
        requestSummaryRefresh({
          immediate: true,
          dedupeMs: EVENT_DEDUPE_MS.connected,
          force,
        });
      }
      if (!document.hidden && DEBUG_SUMMARY_REALTIME) {
        const { dedupedCount, hiddenDeferredCount, forcedResyncCount } = state.debug;
        console.debug("[summary-realtime] stats", { dedupedCount, hiddenDeferredCount, forcedResyncCount });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [requestSummaryRefresh]);

  return {
    isLive,
    isReconnecting,
  };
};
