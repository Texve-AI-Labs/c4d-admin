import axios from "axios";

export const NETWORK_ERROR_EVENT = "app-network-error";
export const NETWORK_ERROR_BROADCAST_KEY = "app-network-error-broadcast";

export const isNetworkError = (error) => {
  return axios.isAxiosError(error) && !error.response;
};

export const dispatchNetworkError = (error) => {
  if (typeof window === "undefined") return;
  if (error?.__c4dNetworkErrorDispatched) return;

  if (error && typeof error === "object") {
    error.__c4dNetworkErrorDispatched = true;
  }

  const detail = {
    message: "Network connection lost. Please check your internet connection.",
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
