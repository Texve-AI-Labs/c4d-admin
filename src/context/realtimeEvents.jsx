import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { API_ROUTES, getBaseUrl } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { useAuth } from "@/context/auth";

const RealtimeEventsContext = createContext(null);
const DEFAULT_INQUIRY_TYPE = "ALL_CABS";
const SUMMARY_DEBOUNCE_MS = 1200;
const SUMMARY_MIN_INTERVAL_MS = 2500;

const EVENT_TYPES = new Set(["connected", "booking_created", "booking_status_changed", "message"]);

const normalizeEvent = (message) => {
  const eventType = message?.event || "message";
  if (!EVENT_TYPES.has(eventType)) return null;

  let payload = null;
  if (message?.data) {
    try {
      payload = JSON.parse(message.data);
    } catch (error) {
      payload = message.data;
    }
  }

  return {
    eventType,
    payload,
    raw: message,
    receivedAt: Date.now(),
  };
};

export const RealtimeEventsProvider = ({ children }) => {
  const { user } = useAuth();
  const authToken = user?.token || localStorage.getItem("token") || "";
  const [isLive, setIsLive] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [eventSeq, setEventSeq] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);
  const [summaryCounts, setSummaryCounts] = useState({});
  const [homeTotalPendings, setHomeTotalPendings] = useState(0);
  const [inquiriesPendingsByType, setInquiriesPendingsByType] = useState({});
  const [lastSummaryAt, setLastSummaryAt] = useState(null);
  const [isSummaryRefreshing, setIsSummaryRefreshing] = useState(false);

  const updateHomeTotalPendings = useCallback((value) => {
    setHomeTotalPendings(Number(value || 0));
  }, []);

  const updateInquiryTotalPendings = useCallback((inquiryType, value) => {
    const normalizedType = String(inquiryType || DEFAULT_INQUIRY_TYPE).toUpperCase();
    setInquiriesPendingsByType((prev) => ({
      ...prev,
      [normalizedType]: Number(value || 0),
    }));
  }, []);

  const refreshGlobalSummary = useCallback(async () => {
    if (!authToken) return;
    setIsSummaryRefreshing(true);
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ADMIN_BOOKINGS_SUMMARY, {});
      if (!data?.success) return;
      const counts = data?.counts || data?.data || {};
      setSummaryCounts(counts);
      const pending = Number(counts?.totalPendings || 0);
      setHomeTotalPendings(pending);
      setInquiriesPendingsByType((prev) => ({
        ...prev,
        [DEFAULT_INQUIRY_TYPE]: pending,
      }));
      setLastSummaryAt(Date.now());
    } catch (error) {
      console.error("Global summary refresh failed:", error);
    } finally {
      setIsSummaryRefreshing(false);
    }
  }, [authToken]);

  const scheduleRef = React.useRef({
    timer: null,
    inFlight: false,
    lastFetchAt: 0,
    pendingAfterFlight: false,
  });

  const runSummaryRefresh = useCallback(async () => {
    if (!authToken) return;
    const state = scheduleRef.current;
    if (state.inFlight) {
      state.pendingAfterFlight = true;
      return;
    }
    state.inFlight = true;
    await refreshGlobalSummary();
    state.lastFetchAt = Date.now();
    state.inFlight = false;
    if (state.pendingAfterFlight) {
      state.pendingAfterFlight = false;
      state.timer = setTimeout(() => {
        runSummaryRefresh();
      }, SUMMARY_DEBOUNCE_MS);
    }
  }, [authToken, refreshGlobalSummary]);

  const requestSummaryRefresh = useCallback(
    (immediate = false) => {
      if (!authToken) return;
      const state = scheduleRef.current;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }

      const now = Date.now();
      const elapsed = now - state.lastFetchAt;
      const canRunNow = immediate || elapsed >= SUMMARY_MIN_INTERVAL_MS;

      if (canRunNow) {
        runSummaryRefresh();
        return;
      }

      state.timer = setTimeout(() => {
        runSummaryRefresh();
      }, Math.max(SUMMARY_DEBOUNCE_MS, SUMMARY_MIN_INTERVAL_MS - elapsed));
    },
    [authToken, runSummaryRefresh]
  );

  useEffect(() => {
    if (!authToken) {
      setIsLive(false);
      setIsReconnecting(false);
      setSummaryCounts({});
      setHomeTotalPendings(0);
      setInquiriesPendingsByType({});
      setLastSummaryAt(null);
      return;
    }

    const streamUrl = `${getBaseUrl()}${API_ROUTES.GET_ADMIN_BOOKINGS_EVENTS}`;
    const abortController = new AbortController();

    setIsReconnecting(false);

    fetchEventSource(streamUrl, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "ngrok-skip-browser-warning": "true",
        token: authToken,
      },
      signal: abortController.signal,
      openWhenHidden: true,
      onopen(response) {
        const contentType = response.headers.get("Content-Type") || "";
        if (!response.ok) throw new Error(`SSE failed with status ${response.status}`);
        if (!contentType.includes("text/event-stream")) {
          throw new Error(`Invalid SSE content-type: ${contentType}`);
        }
        setIsLive(true);
        setIsReconnecting(false);
      },
      onmessage(message) {
        const normalized = normalizeEvent(message);
        if (!normalized) return;
        setLastEvent(normalized);
        setEventSeq((prev) => prev + 1);
        setIsLive(true);
        if (normalized.eventType === "connected") {
          requestSummaryRefresh(true);
        }
        if (normalized.eventType === "connected") {
          setIsReconnecting(false);
        }
      },
      onclose() {
        setIsLive(false);
        setIsReconnecting(true);
      },
      onerror(error) {
        setIsLive(false);
        setIsReconnecting(true);
        throw error;
      },
    }).catch((error) => {
      if (abortController.signal.aborted) return;
      console.error("Global bookings stream error:", error);
    });

    return () => {
      const state = scheduleRef.current;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      abortController.abort();
      setIsLive(false);
      setIsReconnecting(false);
    };
  }, [authToken, requestSummaryRefresh]);

  useEffect(() => {
    if (!authToken) return;
    requestSummaryRefresh(true);
  }, [authToken, requestSummaryRefresh]);

  const value = useMemo(
    () => ({
      isLive,
      isReconnecting,
      eventSeq,
      lastEvent,
      summaryCounts,
      totalPendings: Number(summaryCounts?.totalPendings || 0),
      homeTotalPendings,
      inquiriesPendingsByType,
      lastSummaryAt,
      isSummaryRefreshing,
      refreshGlobalSummary,
      requestSummaryRefresh,
      updateHomeTotalPendings,
      updateInquiryTotalPendings,
    }),
    [
      isLive,
      isReconnecting,
      eventSeq,
      lastEvent,
      summaryCounts,
      homeTotalPendings,
      inquiriesPendingsByType,
      lastSummaryAt,
      isSummaryRefreshing,
      refreshGlobalSummary,
      requestSummaryRefresh,
      updateHomeTotalPendings,
      updateInquiryTotalPendings,
    ]
  );

  return <RealtimeEventsContext.Provider value={value}>{children}</RealtimeEventsContext.Provider>;
};

export const useRealtimeEvents = () => {
  const context = useContext(RealtimeEventsContext);
  if (!context) {
    throw new Error("useRealtimeEvents must be used within RealtimeEventsProvider");
  }
  return context;
};
