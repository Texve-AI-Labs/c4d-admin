import axios from "axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getBaseUrl, getNgrokSkipHeaders } from "@/utils/constants";
import { friendlyWhatsAppError, isWhatsAppMediaTypeError } from "@/utils/whatsapp/errors";
import { normalizeMessageMedia } from "@/utils/whatsapp/media";

const TOKEN_KEY = "rootcabs_access_token";

export const getWhatsappToken = () =>
  localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token") || "";

const authHeaders = () => {
  const token = getWhatsappToken();
  const headers = {
    "Content-Type": "application/json",
    ...getNgrokSkipHeaders(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers.token = token;
  }
  return headers;
};

const unwrapList = (payload, keys = []) => {
  if (Array.isArray(payload)) return { items: payload, pagination: null };
  if (Array.isArray(payload?.data)) return { items: payload.data, pagination: payload.pagination || null };
  if (payload?.data && typeof payload.data === "object") {
    const nestedKey = keys.find((key) => Array.isArray(payload.data[key]));
    if (Array.isArray(payload.data.items)) return { items: payload.data.items, pagination: payload.data.pagination || payload.pagination || null };
    if (nestedKey) return { items: payload.data[nestedKey], pagination: payload.data.pagination || payload.pagination || null };
  }
  const directKey = keys.find((key) => Array.isArray(payload?.[key]));
  if (directKey) return { items: payload[directKey], pagination: payload.pagination || null };
  if (Array.isArray(payload?.results)) return { items: payload.results, pagination: payload.pagination || null };
  return { items: [], pagination: payload?.pagination || payload?.data?.pagination || null };
};

const pick = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "open"].includes(normalized)) return true;
  if (["false", "0", "no", "closed", "expired"].includes(normalized)) return false;
  return null;
};

const isRecentInboundSession = (row = {}) => {
  const explicitOpen = parseBoolean(pick(row, ["is_session_window_open", "isSessionWindowOpen", "sessionWindowOpen"], null));
  if (explicitOpen !== null) return explicitOpen;
  const remainingSeconds = pick(row, ["session_window_remaining_seconds", "sessionWindowRemainingSeconds"], null);
  if (remainingSeconds !== null) return Number(remainingSeconds) > 0;
  const expiry = pick(row, ["session_window_expires_at", "sessionWindowExpiresAt"], null);
  if (expiry) {
    const expiryDate = new Date(expiry);
    return !Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() > Date.now();
  }
  const lastInbound = pick(row, ["lastInboundAt", "last_inbound_at", "lastMessageAt", "last_message_at"], null);
  if (!lastInbound) return true;
  const inboundDate = new Date(lastInbound);
  return !Number.isNaN(inboundDate.getTime()) && Date.now() - inboundDate.getTime() < 24 * 60 * 60 * 1000;
};

const extractQuotedMessage = (row = {}) => {
  const rawPayload = row.rawPayload || row.raw_payload || {};
  const quoted = pick(row, [
    "quotedMessage",
    "quoted_message",
    "contextMessage",
    "context_message",
    "replyToMessage",
    "reply_to_message",
    "repliedMessage",
    "replied_message",
    "quoted",
  ], null);
  const context = row.context || row.metaContext || row.meta_context || rawPayload.context || rawPayload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.context || {};
  const candidate = quoted || context?.quotedMessage || context?.message || context?.replyToMessage || null;

  if (typeof candidate === "string") {
    return { text: candidate, id: context?.id || row.meta_context_message_id || row.metaContextMessageId || "" };
  }

  if (candidate && typeof candidate === "object") {
    const text = pick(candidate, [
      "textBody",
      "text",
      "body",
      "content",
      "message",
      "caption",
      "preview",
    ], "");
    return {
      ...candidate,
      text: typeof text === "object" ? text?.body || text?.text || "" : String(text || ""),
      id: candidate.id || candidate.message_id || candidate.messageId || context?.id || "",
    };
  }

  const contextBody = pick(context, ["text", "body", "message", "content"], "");
  if (contextBody) {
    return {
      ...context,
      text: typeof contextBody === "object" ? contextBody?.body || contextBody?.text || "" : String(contextBody),
      id: context.id || row.meta_context_message_id || row.metaContextMessageId || "",
    };
  }

  return null;
};

export const normalizeConversation = (row = {}) => {
  const id = String(pick(row, ["id", "conversation_id", "thread_id", "chat_id", "_id"]));
  const phone = String(pick(row, ["phone", "phoneNumber", "mobile", "whatsapp_number", "number"]));
  const outboundFlag = pick(row, [
    "is_last_outbound",
    "isLastOutbound",
    "last_is_outbound",
    "lastIsOutbound",
    "last_message_from_me",
    "lastMessageFromMe",
    "fromMe",
    "isFromMe",
    "isOutbound",
  ], null);
  const lastDirection = String(
    pick(row, [
      "last_direction",
      "lastDirection",
      "last_message_direction",
      "lastMessageDirection",
      "last_sender",
      "lastSender",
      "direction",
      "sender",
      "source",
    ], "")
  ).toLowerCase();
  const hasOutboundFlag = outboundFlag !== null && outboundFlag !== undefined && outboundFlag !== "";
  const isLastOutbound = hasOutboundFlag
    ? outboundFlag === true || String(outboundFlag).toLowerCase() === "true" || String(outboundFlag) === "1"
    : ["outbound", "admin", "agent", "business", "system"].some((item) => lastDirection.includes(item));

  return {
    raw: row,
    id,
    name: String(pick(row, ["name", "contact_name", "displayName", "customer_name", "user_name", "sender_name"], phone || "Unknown customer")),
    phone,
    lastMessage: String(pick(row, ["last_message", "lastMessage", "lastMessagePreview", "message_preview", "last_text"], "")),
    lastTime: pick(row, ["last_time", "lastTime", "lastMessageAt", "updated_at", "last_message_time"], null),
    unread: Number(pick(row, ["unread", "unreadCount", "unread_count"], 0)) || 0,
    audienceType: pick(row, ["audience_type", "audienceType"], "CUSTOMER"),
    isSessionWindowOpen: isRecentInboundSession(row),
    sessionWindowExpiresAt: pick(row, ["session_window_expires_at", "sessionWindowExpiresAt"], null),
    sessionWindowRemainingSeconds: pick(row, ["session_window_remaining_seconds", "sessionWindowRemainingSeconds"], null),
    lastStatus: pick(row, [
      "last_message_status",
      "lastMessageStatus",
      "last_provider_status",
      "lastProviderStatus",
      "last_status",
      "lastStatus",
      "providerStatus",
      "provider_status",
      "status",
    ], ""),
    lastDirection,
    isLastOutbound,
  };
};

export const normalizeMessage = (row = {}) => {
  const directionValue = String(pick(row, ["direction", "from", "sender", "source"], "")).toLowerCase();
  const outbound = ["outbound", "admin", "agent", "business", "system"].some((item) => directionValue.includes(item));
  const id = String(pick(row, ["id", "message_id", "messageId", "uuid", "_id"], `msg-${Date.now()}-${Math.random()}`));
  const quotedMessage = extractQuotedMessage(row);
  const metaMessageId = pick(row, [
    "metaMessageId",
    "meta_message_id",
    "whatsappMessageId",
    "whatsapp_message_id",
    "providerMessageId",
    "provider_message_id",
    "wamid",
  ], "");
  const providerMessageId = pick(row, ["providerMessageId", "provider_message_id", "wamid"], metaMessageId);
  const whatsappMessageId = pick(row, ["whatsappMessageId", "whatsapp_message_id", "wamid"], metaMessageId);
  const rawText = String(pick(row, ["textBody", "text", "body", "content", "message"], ""));
  const rawErrorMessage = pick(row, ["errorMessage", "error_message"], "");
  return {
    raw: row,
    id,
    text: isWhatsAppMediaTypeError(rawText) ? "" : rawText,
    type: String(pick(row, ["type", "messageType", "message_type"], "text")),
    direction: outbound ? "outbound" : "inbound",
    providerStatus: String(pick(row, ["providerStatus", "provider_status", "status"], outbound ? "sent" : "")),
    errorCode: pick(row, ["errorCode", "error_code"], ""),
    errorMessage: rawErrorMessage ? friendlyWhatsAppError(rawErrorMessage) : "",
    sentAt: pick(row, ["sentAt", "created_at", "time", "timestamp", "deliveredAt", "readAt"], null),
    createdAt: pick(row, ["createdAt", "created_at", "createdOn", "created_on", "timestamp"], null),
    quotedMessage,
    templateHeaderMediaUrl: pick(row, ["templateHeaderMediaUrl", "template_header_media_url"], ""),
    templateName: pick(row, ["templateName", "template_name"], ""),
    metaMessageId,
    providerMessageId,
    whatsappMessageId,
    mediaAttachments: normalizeMessageMedia(row),
    metaContextMessageId: pick(row, ["metaContextMessageId", "meta_context_message_id"], ""),
    rawPayload: pick(row, ["rawPayload", "raw_payload"], null),
  };
};

export const normalizeTemplate = (template = {}) => {
  const components = template.components || template.data?.components || [];
  const body = components.find((item) => String(item.type).toUpperCase() === "BODY") || {};
  const header = components.find((item) => String(item.type).toUpperCase() === "HEADER") || {};
  const bodyText = body.text || template.body?.text || template.bodyText || template.text || "";
  const headerType = header.format || header.headerType || template.headerType || template.header?.format || "NONE";
  const matches = String(bodyText).match(/\{\{\d+\}\}/g) || [];
  return {
    raw: template,
    id: String(pick(template, ["id", "templateId", "template_id", "_id"], "")),
    name: String(pick(template, ["name", "templateName", "template_name"], "Template")),
    category: String(pick(template, ["category"], "")),
    languageCode: String(pick(template, ["languageCode", "language", "language_code"], "")),
    bodyText,
    header: {
      type: String(headerType || "NONE").toUpperCase(),
      text: header.text || template.headerText || "",
    },
    variables: matches.map((_, index) => `{{${index + 1}}}`),
  };
};

export const normalizeTemplateListItem = (template = {}) => ({
  raw: template,
  id: String(pick(template, ["id", "templateId", "template_id", "_id"], "")),
  name: String(pick(template, ["name", "templateName", "template_name"], "Template")),
  category: String(pick(template, ["category"], "")),
  languageCode: String(pick(template, ["languageCode", "language", "language_code"], "")),
  headerType: String(
    template.headerType ||
      template.header?.format ||
      template.header?.type ||
      template.components?.find?.((item) => String(item?.type || "").toUpperCase() === "HEADER")?.format ||
      "NONE"
  ).toUpperCase(),
  previewText: String(
    template.preview?.body ||
      template.previewBody ||
      template.bodyText ||
      template.body?.text ||
      template.body ||
      template.text ||
      ""
  ),
});

const request = async (method, route, { params, data } = {}) => {
  const response = await axios({
    method,
    url: `${getBaseUrl()}${route}`,
    params,
    data,
    headers: authHeaders(),
  });
  return response.data;
};

export const customerWhatsappApi = {
  loadConversations: async ({ search = "", page = 1, limit = 20 } = {}) => {
    const payload = await request("get", "/whatsapp-conversations", {
      params: { ...(search ? { search } : {}), audienceType: "CUSTOMER", page, limit },
    });
    const { items, pagination } = unwrapList(payload, ["items", "conversations", "results"]);
    return { items: items.map(normalizeConversation).filter((item) => item.id), pagination };
  },
  loadMessages: async (conversationId, { page = 1, limit = 50, search = "" } = {}) => {
    const payload = await request("get", `/whatsapp-conversations/${conversationId}/messages`, {
      params: { page, limit, ...(search ? { search } : {}) },
    });
    const { items, pagination } = unwrapList(payload, ["items", "messages", "results"]);
    return {
      items: items.map(normalizeMessage),
      pagination,
      conversation: payload?.data?.conversation || payload?.conversation || null,
    };
  },
  markRead: (conversationId) => request("post", `/whatsapp-conversations/${conversationId}/mark-read`, { data: {} }),
  sendReply: (conversationId, text, contextMessageId) =>
    request("post", `/whatsapp-conversations/${conversationId}/reply`, {
      data: { text, ...(contextMessageId ? { contextMessageId } : {}) },
    }),
  sendMediaReply: async (conversationId, formData) => {
    const token = getWhatsappToken();
    const response = await axios.post(`${getBaseUrl()}/whatsapp-conversations/${conversationId}/reply-media`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getNgrokSkipHeaders(),
        ...(token ? { token, Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  },
  downloadMediaForRetry: async (media) => {
    const endpoint = media?.id
      ? `${getBaseUrl()}/whatsapp-media/${media.id}/download`
      : media?.directUrl;
    if (!endpoint) throw new Error("Media file is unavailable");

    const token = getWhatsappToken();
    const response = await fetch(endpoint, {
      headers: media?.id
        ? {
            ...getNgrokSkipHeaders(),
            ...(token ? { token, Authorization: `Bearer ${token}` } : {}),
          }
        : undefined,
    });
    if (!response.ok) throw new Error("Unable to retrieve the media file for retry");
    return response.blob();
  },
  loadTemplates: async (conversationId) => {
    const payload = await request("get", `/whatsapp-conversations/${conversationId}/reply-templates`, {
      params: { limit: 100 },
    });
    const { items } = unwrapList(payload, ["items", "templates", "results"]);
    return items.map(normalizeTemplateListItem).filter((item) => item.id);
  },
  loadTemplateDetails: async (templateId) => {
    const payload = await request("get", `/whatsapp-templates/${templateId}`);
    return normalizeTemplate(payload?.data || payload);
  },
  sendTemplate: (conversationId, body) =>
    request("post", `/whatsapp-conversations/${conversationId}/reply-template`, { data: body }),
  forwardMessage: (conversationId, body) =>
    request("post", `/whatsapp-conversations/${conversationId}/forward`, { data: body }),
  getEventsUrl: () => `${getBaseUrl()}/whatsapp-conversations/events`,
  subscribeEvents: ({ signal, onOpen, onMessage, onClose, onError }) =>
    fetchEventSource(`${getBaseUrl()}/whatsapp-conversations/events`, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        ...getNgrokSkipHeaders(),
        ...(getWhatsappToken() ? { token: getWhatsappToken(), Authorization: `Bearer ${getWhatsappToken()}` } : {}),
      },
      signal,
      openWhenHidden: true,
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError,
    }),
  authHeaders,
};
