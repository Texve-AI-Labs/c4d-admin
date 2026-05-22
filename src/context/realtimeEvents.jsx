import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { API_ROUTES, getBaseUrl } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { useAuth } from "@/context/auth";

const RealtimeEventsContext = createContext(null);
const DEFAULT_INQUIRY_TYPE = "ALL_CABS";
const SUMMARY_DEBOUNCE_MS = 1200;
const SUMMARY_MIN_INTERVAL_MS = 2500;
const CONNECTED_REFRESH_COOLDOWN_MS = 2000;
const MAX_SEEN_EVENT_IDS = 2000;
const MAX_RETRY_DELAY_MS = 15000;
const FALLBACK_SUMMARY_REFRESH_MS = 120000;
const AUTH_FATAL_LOGOUT_THRESHOLD = 2;
const DEDUPE_TTL_MS = 20000;

const FALLBACK_REALTIME_CONTEXT = {
  isLive: false,
  isReconnecting: false,
  eventSeq: 0,
  lastEvent: null,
  summaryCounts: {},
  totalPendings: 0,
  homeTotalPendings: 0,
  inquiriesPendingsByType: {},
  lastSummaryAt: null,
  isSummaryRefreshing: false,
  refreshGlobalSummary: async () => {},
  requestSummaryRefresh: () => {},
  updateHomeTotalPendings: () => {},
  updateInquiryTotalPendings: () => {},
};

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
  const { user, logout } = useAuth();
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
  const lastConnectedRefreshAtRef = React.useRef(0);
  const seenEventIdsRef = React.useRef(new Set());
  const retryAttemptRef = React.useRef(0);
  const authFatalCountRef = React.useRef(0);
  const dedupeCacheRef = React.useRef(new Map());

  const shouldRefreshOnConnected = useCallback(() => {
    const now = Date.now();
    if (now - lastConnectedRefreshAtRef.current < CONNECTED_REFRESH_COOLDOWN_MS) return false;
    lastConnectedRefreshAtRef.current = now;
    return true;
  }, []);

  const getDataFingerprint = useCallback((value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }, []);

  const shouldProcessEvent = useCallback(
    (normalized, message) => {
      const now = Date.now();
      for (const [key, expiry] of dedupeCacheRef.current.entries()) {
        if (expiry <= now) dedupeCacheRef.current.delete(key);
      }

      const eventId = message?.id || normalized?.payload?.eventId || normalized?.payload?.id;
      const key = eventId
        ? `${normalized.eventType}:${String(eventId)}`
        : `${normalized.eventType}:${Math.floor(now / 5000)}:${getDataFingerprint(normalized?.payload || normalized?.raw?.data)}`;

      if (dedupeCacheRef.current.has(key)) return false;
      dedupeCacheRef.current.set(key, now + DEDUPE_TTL_MS);

      if (eventId) {
        seenEventIdsRef.current.add(key);
        if (seenEventIdsRef.current.size > MAX_SEEN_EVENT_IDS) {
          const firstKey = seenEventIdsRef.current.values().next().value;
          seenEventIdsRef.current.delete(firstKey);
        }
      }
      return true;
    },
    [getDataFingerprint]
  );

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
        // "ngrok-skip-browser-warning": "true",
        // 'ngrok-skip-browser-warning': '69420',
        token: authToken,
      },
      signal: abortController.signal,
      openWhenHidden: true,
      onopen(response) {
        const contentType = response.headers.get("Content-Type") || "";
        if (response.status === 401 || response.status === 403) {
          throw new Error("SSE_AUTH_FATAL");
        }
        if (!response.ok) throw new Error(`SSE failed with status ${response.status}`);
        if (!contentType.includes("text/event-stream")) {
          throw new Error(`Invalid SSE content-type: ${contentType}`);
        }
        authFatalCountRef.current = 0;
        retryAttemptRef.current = 0;
        setIsLive(true);
        setIsReconnecting(false);
      },
      onmessage(message) {
        const normalized = normalizeEvent(message);
        if (!normalized) return;
        if (!shouldProcessEvent(normalized, message)) return;

        setLastEvent(normalized);
        setEventSeq((prev) => prev + 1);
        setIsLive(true);
        setIsReconnecting(false);
        if (normalized.eventType === "connected") {
          if (shouldRefreshOnConnected()) {
            requestSummaryRefresh(true);
          }
          return;
        }
        if (
          normalized.eventType === "booking_created" ||
          normalized.eventType === "booking_status_changed" ||
          normalized.eventType === "message"
        ) {
          requestSummaryRefresh(false);
        }
      },
      onclose() {
        setIsLive(false);
        setIsReconnecting(true);
      },
      onerror(error) {
        setIsLive(false);
        setIsReconnecting(true);
        if (String(error?.message || "").includes("SSE_AUTH_FATAL")) {
          authFatalCountRef.current += 1;
          throw error;
        }
        retryAttemptRef.current += 1;
        return Math.min(MAX_RETRY_DELAY_MS, 1000 * (2 ** (retryAttemptRef.current - 1)));
      },
    }).catch((error) => {
      if (abortController.signal.aborted) return;
      if (String(error?.message || "").includes("SSE_AUTH_FATAL")) {
        if (authFatalCountRef.current >= AUTH_FATAL_LOGOUT_THRESHOLD) {
          logout?.();
        }
        return;
      }
      console.error("Global bookings stream error:", error);
    });

    return () => {
      const state = scheduleRef.current;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      abortController.abort();
      seenEventIdsRef.current.clear();
      dedupeCacheRef.current.clear();
      retryAttemptRef.current = 0;
      authFatalCountRef.current = 0;
      setIsLive(false);
      setIsReconnecting(false);
    };
  }, [authToken, logout, requestSummaryRefresh, shouldProcessEvent]);

  useEffect(() => {
    if (!authToken) return;
    requestSummaryRefresh(true);
  }, [authToken, requestSummaryRefresh]);

  useEffect(() => {
    if (!authToken) return;
    const intervalId = setInterval(() => {
      if (isLive && !isReconnecting) return;
      requestSummaryRefresh(false);
    }, FALLBACK_SUMMARY_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [authToken, isLive, isReconnecting, requestSummaryRefresh]);

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
    return FALLBACK_REALTIME_CONTEXT;
  }
  return context;
};
