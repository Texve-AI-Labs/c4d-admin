import { useEffect, useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
import { NETWORK_ERROR_BROADCAST_KEY, NETWORK_ERROR_EVENT } from "@/utils/networkError";

const NETWORK_REFRESH_PENDING_KEY = "networkReconnectRefreshPending";
const NETWORK_REFRESH_DONE_KEY = "networkReconnectRefreshDone";

const getIsOnline = () => {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
};

export default function NetworkStatusModal() {
  const [modalState, setModalState] = useState({
    open: false,
    isOnline: getIsOnline(),
    message: "",
  });

  useEffect(() => {
    const showNetworkErrorModal = (message) => {
      sessionStorage.setItem(NETWORK_REFRESH_PENDING_KEY, "true");
      sessionStorage.removeItem(NETWORK_REFRESH_DONE_KEY);
      setModalState({
        open: true,
        isOnline: getIsOnline(),
        message: message || "Network connection lost. Please check your internet connection.",
      });
    };

    const handleNetworkError = (event) => {
      showNetworkErrorModal(event.detail?.message);
    };

    const handleNetworkBroadcast = (event) => {
      if (event.key !== NETWORK_ERROR_BROADCAST_KEY || !event.newValue) return;

      try {
        const payload = JSON.parse(event.newValue);
        showNetworkErrorModal(payload?.message);
      } catch {
        showNetworkErrorModal();
      }
    };

    const handleOnline = () => {
      const refreshPending = sessionStorage.getItem(NETWORK_REFRESH_PENDING_KEY) === "true";

      setModalState((current) => ({
        ...current,
        isOnline: true,
        message: current.open ? "Connection restored. Refreshing the page..." : current.message,
      }));

      if (refreshPending) {
        sessionStorage.removeItem(NETWORK_REFRESH_PENDING_KEY);
        sessionStorage.setItem(NETWORK_REFRESH_DONE_KEY, "true");
        window.location.reload();
      }
    };

    const handleOffline = () => {
      showNetworkErrorModal("Network connection lost. Please check your internet connection.");
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
          {modalState.isOnline
            ? modalState.message || "Connection restored. You can refresh the page."
            : modalState.message || "Network connection lost. Please check your internet connection."}
        </Typography>
      </DialogBody>
      <DialogFooter className="gap-2">
        <Button variant="text" color="blue-gray" onClick={handleClose}>
          Close
        </Button>
        <Button className="bg-red-600" disabled={!modalState.isOnline} onClick={handleRefresh}>
          Refresh Page
        </Button>
      </DialogFooter>
    </Dialog>
  );
}