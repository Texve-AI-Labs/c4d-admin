import axios from "axios";

export const NETWORK_ERROR_EVENT = "app-network-error";
export const NETWORK_ERROR_BROADCAST_KEY = "app-network-error-broadcast";

export const isNetworkError = (error) => {
  return axios.isAxiosError(error) && !error.response;
};

const getNetworkErrorMessage = () => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "Network connection lost. Please check your internet connection.";
  }

  return "Unable to reach the server. Please check the API server or CORS configuration.";
};

const getNetworkErrorStatus = () => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "offline";
  }

  return "server-unreachable";
};

export const dispatchNetworkError = (error) => {
  if (typeof window === "undefined") return;
  if (error?.__c4dNetworkErrorDispatched) return;

  if (error && typeof error === "object") {
    error.__c4dNetworkErrorDispatched = true;
  }

  const detail = {
    message: getNetworkErrorMessage(),
    status: getNetworkErrorStatus(),
    originalMessage: error?.message,
  };

  window.dispatchEvent(new CustomEvent(NETWORK_ERROR_EVENT, { detail }));
  localStorage.setItem(NETWORK_ERROR_BROADCAST_KEY, JSON.stringify({
    ...detail,
    timestamp: Date.now(),
  }));
};

export const notifyAndThrowNetworkError = (error) => {
  if (isNetworkError(error)) {
    dispatchNetworkError(error);
  }
  throw error;
};

export const attachNetworkErrorInterceptor = () => {
  if (axios.__c4dNetworkErrorInterceptorAttached) return;

  axios.__c4dNetworkErrorInterceptorAttached = true;
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isNetworkError(error)) {
        dispatchNetworkError(error);
      }
      return Promise.reject(error);
    }
  );
};
