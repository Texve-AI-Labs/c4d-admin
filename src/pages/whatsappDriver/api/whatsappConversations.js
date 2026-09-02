import { fetchEventSource } from "@microsoft/fetch-event-source";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { getBaseUrl } from "@/utils/constants";

const BASE = "/whatsapp-conversations";

const compactParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));

export const whatsappConversationsApi = {
  getConversations: (params) => ApiRequestUtils.getWithQueryParam(BASE, compactParams(params)),

  getMessages: (conversationId, params) =>
    ApiRequestUtils.getWithQueryParam(`${BASE}/${conversationId}/messages`, compactParams(params)),

  markAsRead: (conversationId) => ApiRequestUtils.post(`${BASE}/${conversationId}/mark-read`, {}),

  sendReply: (conversationId, body) => ApiRequestUtils.post(`${BASE}/${conversationId}/reply`, body),

  getReplyTemplates: (conversationId, limit = 100) =>
    ApiRequestUtils.getWithQueryParam(`${BASE}/${conversationId}/reply-templates`, { limit }),

  getTemplateDetail: (templateId) => ApiRequestUtils.get(`/whatsapp-templates/${templateId}`),

  sendTemplateReply: (conversationId, body) => ApiRequestUtils.post(`${BASE}/${conversationId}/reply-template`, body),

  subscribeEvents: ({ token, signal, onOpen, onMessage, onClose, onError }) =>
    fetchEventSource(`${getBaseUrl()}${BASE}/events`, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        token,
      },
      signal,
      openWhenHidden: true,
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError,
    }),
};
