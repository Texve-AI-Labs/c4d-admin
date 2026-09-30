import { useEffect, useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
import { NETWORK_ERROR_BROADCAST_KEY, NETWORK_ERROR_EVENT } from "@/utils/networkError";

const NETWORK_REFRESH_PENDING_KEY = "networkReconnectRefreshPending";
const NETWORK_REFRESH_DONE_KEY = "networkReconnectRefreshDone";
const RECONNECT_REFRESH_DELAY_MS = 1200;

const getIsOnline = () => {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
};

const getStatusMessage = (status, message) => {
  if (message) return message;
  if (status === "restored") return "Connection restored. Refreshing the page...";
  if (status === "server-unreachable") return "Unable to reach the server. Please check the API server or CORS configuration.";
  return "Network connection lost. Please check your internet connection.";
};

export default function NetworkStatusModal() {
  const [modalState, setModalState] = useState({
    open: false,
    status: "idle",
    refreshPending: false,
    message: "",
  });

  useEffect(() => {
    const showNetworkErrorModal = ({ message, status } = {}) => {
      const nextStatus = status || (getIsOnline() ? "server-unreachable" : "offline");
      const refreshPending = nextStatus === "offline";

      if (refreshPending) {
        sessionStorage.setItem(NETWORK_REFRESH_PENDING_KEY, "true");
      } else {
        sessionStorage.removeItem(NETWORK_REFRESH_PENDING_KEY);
      }

      sessionStorage.removeItem(NETWORK_REFRESH_DONE_KEY);
      setModalState({
        open: true,
        status: nextStatus,
        refreshPending,
        message: getStatusMessage(nextStatus, message),
      });
    };

    const handleNetworkError = (event) => {
      showNetworkErrorModal({
        message: event.detail?.message,
        status: event.detail?.status,
      });
    };

    const handleNetworkBroadcast = (event) => {
      if (event.key !== NETWORK_ERROR_BROADCAST_KEY || !event.newValue) return;

      try {
        const payload = JSON.parse(event.newValue);
        showNetworkErrorModal({
          message: payload?.message,
          status: payload?.status,
        });
      } catch {
        showNetworkErrorModal();
      }
    };

    const handleOnline = () => {
      const refreshPending = sessionStorage.getItem(NETWORK_REFRESH_PENDING_KEY) === "true";

      setModalState((current) => ({
        ...current,
        status: refreshPending ? "restored" : current.status,
        refreshPending,
        message: refreshPending && current.open ? getStatusMessage("restored") : current.message,
      }));

      if (refreshPending) {
        sessionStorage.removeItem(NETWORK_REFRESH_PENDING_KEY);
        sessionStorage.setItem(NETWORK_REFRESH_DONE_KEY, "true");
        window.setTimeout(() => {
          window.location.reload();
        }, RECONNECT_REFRESH_DELAY_MS);
      }
    };

    const handleOffline = () => {
      showNetworkErrorModal({ status: "offline" });
    };

    window.addEventListener(NETWORK_ERROR_EVENT, handleNetworkError);
    window.addEventListener("storage", handleNetworkBroadcast);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!getIsOnline()) {
      handleOffline();
    }

    return () => {
      window.removeEventListener(NETWORK_ERROR_EVENT, handleNetworkError);
      window.removeEventListener("storage", handleNetworkBroadcast);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    sessionStorage.removeItem(NETWORK_REFRESH_PENDING_KEY);
    sessionStorage.setItem(NETWORK_REFRESH_DONE_KEY, "true");
    window.location.reload();
  };

  const handleClose = () => {
    setModalState((current) => ({
      ...current,
      open: false,
    }));
  };

  return (
    <Dialog open={modalState.open} handler={handleClose} size="sm">
      <DialogHeader className="text-red-700">Connection Issue</DialogHeader>
      <DialogBody divider>
        <Typography className="text-sm font-medium text-gray-800">
          {modalState.message}
        </Typography>
      </DialogBody>
      <DialogFooter className="gap-2">
        <Button variant="text" color="blue-gray" onClick={handleClose}>
          Close
        </Button>
        <Button className="bg-red-600" disabled={modalState.status === "offline"} onClick={handleRefresh}>
          Refresh Page
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
