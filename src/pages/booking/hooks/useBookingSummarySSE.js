import { useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { API_ROUTES, getBaseUrl } from "@/utils/constants";

export const useBookingSummarySSE = ({
  enabled,
  refreshSummary,
  dependencyKey,
}) => {
  const [isLive, setIsLive] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const abortRef = useRef(null);
  const reconnectingRef = useRef(false);
  const refreshSummaryRef = useRef(refreshSummary);

  useEffect(() => {
    reconnectingRef.current = isReconnecting;
  }, [isReconnecting]);

  useEffect(() => {
    refreshSummaryRef.current = refreshSummary;
  }, [refreshSummary]);

  useEffect(() => {
    if (!enabled) return;

    const streamUrl = `${getBaseUrl()}${API_ROUTES.GET_ADMIN_BOOKINGS_EVENTS}`;
    const abortController = new AbortController();
    abortRef.current = abortController;
    let receivedFirstEventAfterReconnect = false;

    setIsReconnecting(false);

    fetchEventSource(streamUrl, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "ngrok-skip-browser-warning": "true",
        token: localStorage.getItem("token") || "",
      },
      signal: abortController.signal,
      openWhenHidden: true,
      onopen(response) {
        const contentType = response.headers.get("Content-Type") || "";
        if (!response.ok) {
          throw new Error(`SSE failed with status ${response.status}`);
        }
        if (!contentType.includes("text/event-stream")) {
          throw new Error(`Invalid SSE content-type: ${contentType}`);
        }
        setIsLive(true);
        setIsReconnecting(false);
        receivedFirstEventAfterReconnect = false;
      },
      onmessage(message) {
        const eventName = message.event || "message";
        if (eventName === "connected") {
          if (reconnectingRef.current && !receivedFirstEventAfterReconnect) {
            refreshSummaryRef.current?.();
            receivedFirstEventAfterReconnect = true;
          }
          setIsLive(true);
          setIsReconnecting(false);
          return;
        }

        if (
          eventName === "booking_created" ||
          eventName === "booking_status_changed" ||
          eventName === "message"
        ) {
          refreshSummaryRef.current?.();
          setIsLive(true);
          if (reconnectingRef.current && !receivedFirstEventAfterReconnect) {
            receivedFirstEventAfterReconnect = true;
          }
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
      console.error("Bookings stream error:", error);
    });

    return () => {
      abortController.abort();
      abortRef.current = null;
      setIsLive(false);
      setIsReconnecting(false);
    };
  }, [enabled, dependencyKey]);

  return {
    isLive,
    isReconnecting,
    abortRef,
  };
};
