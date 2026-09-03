import React from "react";
import { whatsappConversationsApi } from "../api/whatsappConversations";
import {
  extractList,
  hasMoreFromResponse,
  normalizeConversation,
  normalizeMessage,
  normalizeTemplate,
  isRenderableMessage,
} from "../utils/whatsappUtils";

const CONVERSATION_LIMIT = 20;
const MESSAGE_LIMIT = 50;
const MAX_RETRY_DELAY_MS = 15000;
const DRIVER_AUDIENCE_TYPE = "DRIVER";

const sortConversations = (items = []) =>
  [...items].sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0));

const mergeById = (oldItems = [], nextItems = []) => {
  const map = new Map();
  [...oldItems, ...nextItems].forEach((item) => {
    if (item?.id) map.set(String(item.id), { ...(map.get(String(item.id)) || {}), ...item });
  });
  return Array.from(map.values());
};

const normalizeEvent = (message) => {
  if (!String(message?.data || "").trim()) return null;
  let payload = null;
  try {
    payload = message?.data ? JSON.parse(message.data) : {};
  } catch {
    payload = { raw: message?.data };
  }

  if (!payload || (typeof payload === "object" && Object.keys(payload).length === 0)) return null;

  return {
    type: payload?.type || payload?.event || message?.event || "message",
    payload,
  };
};

const getNestedValues = (payload = {}) => {
  if (!payload || typeof payload !== "object") return [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  return entries.flatMap((entry) => {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    return changes.map((change) => change?.value).filter(Boolean);
  });
};

const getWebhookMessages = (payload = {}) => {
  const directMessages = [
    payload?.message,
    payload?.data?.message,
    ...(Array.isArray(payload?.messages) ? payload.messages : []),
    ...(Array.isArray(payload?.data?.messages) ? payload.data.messages : []),
  ].filter(Boolean);

  const webhookMessages = getNestedValues(payload).flatMap((value) =>
    Array.isArray(value?.messages) ? value.messages : []
  );

  return [...directMessages, ...webhookMessages];
};

const getWebhookStatuses = (payload = {}) => {
  const directStatuses = [
    payload?.status,
    payload?.data?.status,
    ...(Array.isArray(payload?.statuses) ? payload.statuses : []),
    ...(Array.isArray(payload?.data?.statuses) ? payload.data.statuses : []),
  ].filter((item) => item && typeof item === "object");

  const webhookStatuses = getNestedValues(payload).flatMap((value) =>
    Array.isArray(value?.statuses) ? value.statuses : []
  );

  return [...directStatuses, ...webhookStatuses];
};

const getPayloadConversation = (payload = {}) =>
  payload?.conversation || payload?.data?.conversation || payload?.conversationData || payload?.data?.conversationData || null;

const getAudienceType = (payload = {}) =>
  String(
    payload?.audienceType ||
      payload?.audience_type ||
      payload?.data?.audienceType ||
      payload?.data?.audience_type ||
      payload?.message?.audienceType ||
      payload?.status?.audienceType ||
      ""
  ).toUpperCase();

const isNonDriverEvent = (payload = {}) => {
  const audienceType = getAudienceType(payload);
  return Boolean(audienceType && audienceType !== DRIVER_AUDIENCE_TYPE);
};

export function useWhatsAppDriver() {
  const token = localStorage.getItem("token") || "";
  const [search, setSearch] = React.useState("");
  const [conversations, setConversations] = React.useState([]);
  const [conversationPage, setConversationPage] = React.useState(1);
  const [hasMoreConversations, setHasMoreConversations] = React.useState(true);
  const [loadingConversations, setLoadingConversations] = React.useState(false);
  const [conversationError, setConversationError] = React.useState("");
  const [selectedConversationId, setSelectedConversationId] = React.useState("");

  const [messages, setMessages] = React.useState([]);
  const [messagePage, setMessagePage] = React.useState(1);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [messageError, setMessageError] = React.useState("");
  const [messageSearch, setMessageSearch] = React.useState("");
  const [replyTo, setReplyTo] = React.useState(null);

  const [templates, setTemplates] = React.useState([]);
  const [templateDetail, setTemplateDetail] = React.useState(null);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [eventState, setEventState] = React.useState({ live: false, reconnecting: false, reason: "" });

  const selectedConversation = React.useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const loadConversations = React.useCallback(
    async ({ page = 1, append = false, query = search } = {}) => {
      setLoadingConversations(true);
      setConversationError("");
      try {
        const response = await whatsappConversationsApi.getConversations({
          search: query,
          audienceType: DRIVER_AUDIENCE_TYPE,
          page,
          limit: CONVERSATION_LIMIT,
        });
        const list = extractList(response, "conversations").map(normalizeConversation).filter((item) => item.id);
        setConversations((prev) => sortConversations(append ? mergeById(prev, list) : list));
        setConversationPage(page);
        setHasMoreConversations(hasMoreFromResponse(response, list, CONVERSATION_LIMIT));
      } catch (error) {
        setConversationError(error?.message || "Unable to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    },
    [search]
  );

  const loadMessages = React.useCallback(
    async ({ conversationId = selectedConversationId, page = 1, appendOlder = false, query = messageSearch } = {}) => {
      if (!conversationId) return;
      setLoadingMessages(true);
      setMessageError("");
      try {
        const response = await whatsappConversationsApi.getMessages(conversationId, {
          page,
          limit: MESSAGE_LIMIT,
          search: query,
        });
        const list = extractList(response, "messages")
          .filter(isRenderableMessage)
          .map(normalizeMessage)
          .filter((item) => item.id)
          .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        setMessages((prev) => (appendOlder ? mergeById(list, prev).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) : list));
        setMessagePage(page);
        setHasMoreMessages(hasMoreFromResponse(response, list, MESSAGE_LIMIT));
      } catch (error) {
        setMessageError(error?.message || "Unable to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [messageSearch, selectedConversationId]
  );

  const openConversation = React.useCallback(
    async (conversation) => {
      if (!conversation?.id) return;
      setSelectedConversationId(conversation.id);
      setReplyTo(null);
      setMessageSearch("");
      loadMessages({ conversationId: conversation.id, page: 1, query: "" });
      setConversations((prev) => prev.map((item) => (item.id === conversation.id ? { ...item, unreadCount: 0 } : item)));
      whatsappConversationsApi.markAsRead(conversation.id).catch(() => {});
    },
    [loadMessages]
  );

  const closeConversation = React.useCallback(() => {
    setSelectedConversationId("");
    setMessages([]);
    setReplyTo(null);
    setMessageSearch("");
  }, []);

  const sendReply = React.useCallback(
    async (text) => {
      const trimmed = String(text || "").trim();
      if (!selectedConversationId || !trimmed) return;
      const tempId = `optimistic-${Date.now()}`;
      const optimisticMessage = normalizeMessage({
        id: tempId,
        text: trimmed,
        direction: "outbound",
        status: "sending",
        createdAt: new Date().toISOString(),
        contextMessageId: replyTo?.id,
        quotedMessage: replyTo,
        isOptimistic: true,
      });
      setMessages((prev) => [...prev, optimisticMessage]);
      setSending(true);
      try {
        const body = replyTo?.id ? { text: trimmed, contextMessageId: replyTo.id } : { text: trimmed };
        const response = await whatsappConversationsApi.sendReply(selectedConversationId, body);
        const saved = normalizeMessage(response?.data || response?.message || response);
        setMessages((prev) => prev.map((item) => (item.id === tempId ? { ...optimisticMessage, ...saved, isOptimistic: false } : item)));
        setReplyTo(null);
      } catch (error) {
        setMessages((prev) => prev.map((item) => (item.id === tempId ? { ...item, status: "failed", isOptimistic: false } : item)));
        throw error;
      } finally {
        setSending(false);
      }
    },
    [replyTo, selectedConversationId]
  );

  const loadTemplates = React.useCallback(async () => {
    if (!selectedConversationId) return;
    setLoadingTemplates(true);
    try {
      const response = await whatsappConversationsApi.getReplyTemplates(selectedConversationId);
      setTemplates(extractList(response, "templates").map(normalizeTemplate));
    } finally {
      setLoadingTemplates(false);
    }
  }, [selectedConversationId]);

  const loadTemplateDetail = React.useCallback(async (templateId) => {
    const response = await whatsappConversationsApi.getTemplateDetail(templateId);
    const detail = normalizeTemplate(response?.data || response?.template || response);
    setTemplateDetail(detail);
    return detail;
  }, []);

  const sendTemplateReply = React.useCallback(
    async ({ templateId, bodyParameters, languageCode }) => {
      if (!selectedConversationId || !templateId) return;
      setSending(true);
      try {
        await whatsappConversationsApi.sendTemplateReply(selectedConversationId, {
          templateId,
          bodyParameters,
          languageCode,
        });
        await loadMessages({ conversationId: selectedConversationId, page: 1, query: "" });
      } finally {
        setSending(false);
      }
    },
    [loadMessages, selectedConversationId]
  );

  const applyIncomingMessage = React.useCallback(
    (rawMessage, rawConversation) => {
      const message = normalizeMessage(rawMessage);
      if (!isRenderableMessage(message)) return;
      const conversationId = String(
        rawConversation?.conversationId ||
          rawConversation?.id ||
          rawConversation?.waId ||
          rawConversation?.phoneNumber ||
          rawMessage?.conversationId ||
          rawMessage?.conversation_id ||
          rawMessage?.from ||
          rawMessage?.waId ||
          rawMessage?.wa_id ||
          rawMessage?.contacts?.[0]?.wa_id ||
          selectedConversationId ||
          ""
      );
      if (!conversationId) return;

      setConversations((prev) => {
        const normalizedConversation = normalizeConversation({
          ...(prev.find((item) => item.id === conversationId) || {}),
          ...(rawConversation || {}),
          id: conversationId,
          lastMessage: message.text,
          lastMessageAt: message.createdAt,
        });
        const next = mergeById(prev, [
          {
            ...normalizedConversation,
            unreadCount:
              conversationId === selectedConversationId || message.fromAdmin
                ? normalizedConversation.unreadCount || 0
                : Number(normalizedConversation.unreadCount || 0) + 1,
          },
        ]);
        return sortConversations(next);
      });

      if (conversationId === selectedConversationId) {
        setMessages((prev) => mergeById(prev, [message]).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)));
      }
    },
    [selectedConversationId]
  );

  const applyStatusUpdate = React.useCallback(
    (payload) => {
      const messageId = String(payload?.messageId || payload?.message_id || payload?.id || payload?.whatsappMessageId || payload?.wamid || "");
      if (!messageId) return;
      const nextStatus = String(
        payload?.providerStatus || payload?.provider_status || payload?.status || payload?.deliveryStatus || ""
      ).toLowerCase();
      const failedReason = payload?.errorMessage || payload?.error_message || payload?.errors?.[0]?.message || "";
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status: nextStatus || message.status,
                failedReason: failedReason || message.failedReason,
              }
            : message
        )
      );
    },
    []
  );

  const refreshAfterWebhookEvent = React.useCallback(() => {
    loadConversations({ page: 1, append: false });
    if (selectedConversationId) {
      loadMessages({ conversationId: selectedConversationId, page: 1, query: "" });
    }
  }, [loadConversations, loadMessages, selectedConversationId]);

  React.useEffect(() => {
    const timer = setTimeout(() => loadConversations({ page: 1, append: false }), 300);
    return () => clearTimeout(timer);
  }, [loadConversations]);

  React.useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    loadMessages({ conversationId: selectedConversationId, page: 1, query: "" });
  }, [loadMessages, selectedConversationId]);

  React.useEffect(() => {
    if (!token) return undefined;
    const abortController = new AbortController();
    let retryAttempt = 0;

    whatsappConversationsApi
      .subscribeEvents({
        token,
        signal: abortController.signal,
        onOpen(response) {
          if (!response.ok) throw new Error(`WhatsApp SSE failed with status ${response.status}`);
          retryAttempt = 0;
          setEventState({ live: true, reconnecting: false, reason: "" });
        },
        onMessage(message) {
          const event = normalizeEvent(message);
          if (!event) return;
          const payload = event.payload;
          if (isNonDriverEvent(payload)) return;
          const type = String(event.type || "").toLowerCase();

          if (["message_new", "new_message", "message", "whatsapp_message", "webhook", "webhook_received", "whatsapp_webhook", "messages.upsert"].includes(type)) {
            const messages = getWebhookMessages(payload);
            const conversation = getPayloadConversation(payload);
            if (messages.length > 0) {
              messages.forEach((item) => {
                if (isRenderableMessage(item)) {
                  applyIncomingMessage(item, conversation);
                }
              });
            } else if (isRenderableMessage(payload)) {
              applyIncomingMessage(payload, conversation);
            } else {
              // message_new commonly contains only ids; refresh to pull saved webhook data.
              refreshAfterWebhookEvent();
            }
            return;
          }

          if (["status_update", "message_status", "conversation_status", "statuses", "message_status_update"].includes(type)) {
            const statuses = getWebhookStatuses(payload);
            if (statuses.length > 0) {
              statuses.forEach(applyStatusUpdate);
            } else {
              applyStatusUpdate(payload);
            }
            loadConversations({ page: 1, append: false });
            return;
          }

          if (["conversation_updated", "conversation"].includes(type)) {
            const conversation = normalizeConversation(payload?.conversation || payload);
            if (conversation.audienceType && String(conversation.audienceType).toUpperCase() !== DRIVER_AUDIENCE_TYPE) return;
            if (conversation.id) {
              setConversations((prev) => sortConversations(mergeById(prev, [conversation])));
            } else {
              refreshAfterWebhookEvent();
            }
            return;
          }

          if (String(type).includes("whatsapp")) {
            refreshAfterWebhookEvent();
          }
        },
        onClose() {
          setEventState({ live: false, reconnecting: true, reason: "closed" });
        },
        onError(error) {
          retryAttempt += 1;
          setEventState({ live: false, reconnecting: true, reason: error?.message || "stream_error" });
          if (selectedConversationId) {
            loadMessages({ conversationId: selectedConversationId, page: 1, query: "" });
          }
          return Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** (retryAttempt - 1));
        },
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setEventState({ live: false, reconnecting: false, reason: error?.message || "stream_error" });
        }
      });

    return () => abortController.abort();
  }, [applyIncomingMessage, applyStatusUpdate, loadConversations, loadMessages, refreshAfterWebhookEvent, selectedConversationId, token]);

  return {
    search,
    setSearch,
    audienceType: DRIVER_AUDIENCE_TYPE,
    conversations,
    conversationPage,
    selectedConversation,
    selectedConversationId,
    openConversation,
    closeConversation,
    loadMoreConversations: () => loadConversations({ page: conversationPage + 1, append: true }),
    loadPreviousConversations: () => {
      const previousPage = Math.max(1, conversationPage - 1);
      return loadConversations({ page: previousPage, append: false });
    },
    loadFirstConversations: () => loadConversations({ page: 1, append: false }),
    hasMoreConversations,
    loadingConversations,
    conversationError,
    messages,
    loadOlderMessages: () => loadMessages({ page: messagePage + 1, appendOlder: true }),
    hasMoreMessages,
    loadingMessages,
    messageError,
    messageSearch,
    setMessageSearch,
    searchMessages: (query) => loadMessages({ page: 1, query }),
    replyTo,
    setReplyTo,
    sendReply,
    templates,
    templateDetail,
    setTemplateDetail,
    loadTemplates,
    loadTemplateDetail,
    sendTemplateReply,
    loadingTemplates,
    sending,
    eventState,
  };
}
