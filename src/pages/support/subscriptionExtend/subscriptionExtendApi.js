import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

export const fetchExpiredSubscriptions = (params) =>
  ApiRequestUtils.getWithQueryParam(API_ROUTES.EXPIRED_SUBSCRIPTIONS, params);

export const extendSubscription = (subscriptionId, payload) =>
  ApiRequestUtils.update(
    `${API_ROUTES.ADMIN_SUBSCRIPTION}/${encodeURIComponent(String(subscriptionId))}/extend`,
    payload,
    0,
    { suppressAlert: true }
  );
