import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CustomerChatList from "./components/CustomerChatList";
import CustomerMessageThread from "./components/CustomerMessageThread";
import TemplatePicker from "./components/TemplatePicker";
import { customerWhatsappApi, getWhatsappToken, normalizeMessage } from "./customerWhatsappApi";
import { friendlyWhatsAppError, unsupportedWhatsAppMediaMessage } from "@/utils/whatsapp/errors";
import { useRealtimeEvents } from "@/context/realtimeEvents";
import {
  canSendWhatsAppMediaFile,
  ensureFileMimeType,
  EXTENSION_MIME_TYPES,
  getFileMimeType,
  getMediaKindFromMimeType,
  WHATSAPP_SUPPORTED_MEDIA_ACCEPT,
  WHATSAPP_SUPPORTED_MEDIA_TYPES,
} from "@/utils/whatsapp/media";

const CONVERSATION_LIMIT = 20;
const MESSAGE_LIMIT = 50;
const MAX_RETRY_DELAY_MS = 15000;
const ALLOWED_MEDIA_MIME_TYPES = new Set(WHATSAPP_SUPPORTED_MEDIA_TYPES);
const ALLOWED_MEDIA_ACCEPT = WHATSAPP_SUPPORTED_MEDIA_ACCEPT;
const friendlyError = (error) => friendlyWhatsAppError(error);

const validateMediaFile = (file, mediaType = "") => {
  if (canSendWhatsAppMediaFile(file, mediaType)) return "";
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (ALLOWED_MEDIA_MIME_TYPES.has(type)) return "";
  const extension = Object.keys(EXTENSION_MIME_TYPES).find((item) => name.endsWith(item));
  if (extension && ALLOWED_MEDIA_MIME_TYPES.has(EXTENSION_MIME_TYPES[extension])) return "";
  return "This file format is not supported. Please upload AAC, MP4 audio, MP3, AMR, OGG, OPUS, JPEG, PNG, WebP, MP4 video, 3GPP, PDF, TXT, DOC, DOCX, XLS, XLSX, PPT, or PPTX.";
};

const getPendingMimeType = (file) => {
  const name = String(file?.name || "").toLowerCase();
  const type = getFileMimeType(file);
  const extension = Object.keys(EXTENSION_MIME_TYPES).find((item) => name.endsWith(item));
  return type || EXTENSION_MIME_TYPES[extension] || "application/octet-stream";
};

const getPendingMediaKind = (file, mimeType = "", mediaType = "") => {
  const normalizedMediaType = String(mediaType || "").toUpperCase();
  if (["VOICE", "AUDIO"].includes(normalizedMediaType)) return "audio";
  return getMediaKindFromMimeType(mimeType || getPendingMimeType(file)) || "document";
};

const extractSingleMessagePayload = (payload) => {
  const data = payload?.data || payload;
  if (!data || typeof data !== "object") return payload;
  if (data.message) return data.message;
  if (data.item) return data.item;
  if (Array.isArray(data.messages) && data.messages.length) return data.messages[data.messages.length - 1];
  if (Array.isArray(data.items) && data.items.length) return data.items[data.items.length - 1];
  return data;
};

export default function CustomerWhatsappPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [search, setSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [mediaUploadError, setMediaUploadError] = useState("");
  const [mediaSending, setMediaSending] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateValues, setTemplateValues] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false);
  const [templateDetailError, setTemplateDetailError] = useState("");
  const [templateLanguageCode, setTemplateLanguageCode] = useState("");
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaSendingRef = useRef(false);
  const loadingMessagesKeysRef = useRef(new Set());
  const reloadTimerRef = useRef(null);
  const selectedIdRef = useRef("");
  const searchRef = useRef("");
  const pageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const token = getWhatsappToken();
  const { updateWhatsappUnreadCount } = useRealtimeEvents();

  const activeMessages = useMemo(
    () => messagesByConversation[selectedConversation?.id] || [],
    [messagesByConversation, selectedConversation?.id]
  );

  const selectedConversationId = selectedConversation?.id || "";
  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || selectedConversation,
    [conversations, selectedConversation, selectedConversationId]
  );
  const canSendText = activeConversation?.isSessionWindowOpen !== false;

  const getMessageKeys = useCallback((message = {}) => {
    const mediaKeys = (message.mediaAttachments || [])
      .flatMap((media) => [media.id, media.mediaId, media.messageMediaId])
      .filter(Boolean)
      .map((value) => `media:${value}`);
    return [
      message.id,
      message.metaMessageId,
      message.providerMessageId,
      message.whatsappMessageId,
      ...mediaKeys,
    ]
      .filter(Boolean)
      .map(String);
  }, [updateWhatsappUnreadCount]);

  const getMessageFingerprint = useCallback((message = {}) => {
    const media = message.mediaAttachments?.[0] || {};
    const sentAt = message.sentAt ? new Date(message.sentAt) : null;
    const minuteKey = sentAt && !Number.isNaN(sentAt.getTime()) ? Math.floor(sentAt.getTime() / 60000) : "";
    return [
      message.direction,
      message.type,
      String(message.text || "").trim(),
      minuteKey,
      media.kind,
      media.mediaType,
      media.mimeType,
      media.fileName,
      media.sizeBytes,
    ].join("|");
  }, []);

  const getMessageTime = useCallback((message = {}) => {
    const value = message.sentAt || message.createdAt || message.created_at || message.timestamp;
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
  }, []);

  const isLikelySameOutboundMedia = useCallback(
    (left = {}, right = {}) => {
      if (left.direction !== "outbound" || right.direction !== "outbound") return false;
      const leftMedia = left.mediaAttachments?.[0];
      const rightMedia = right.mediaAttachments?.[0];
      if (!leftMedia || !rightMedia) return false;
      const leftKind = String(leftMedia.kind || leftMedia.mediaType || "").toLowerCase();
      const rightKind = String(rightMedia.kind || rightMedia.mediaType || "").toLowerCase();
      const sameKind = leftKind && rightKind && (leftKind === rightKind || [leftKind, rightKind].every((item) => ["audio", "voice"].includes(item)));
      const sameName = leftMedia.fileName && rightMedia.fileName && leftMedia.fileName === rightMedia.fileName;
      const sameSize = leftMedia.sizeBytes && rightMedia.sizeBytes && Number(leftMedia.sizeBytes) === Number(rightMedia.sizeBytes);
      const closeTime = Math.abs(getMessageTime(left) - getMessageTime(right)) < 5 * 60 * 1000;
      return closeTime && (sameName || sameSize || sameKind);
    },
    [getMessageTime]
  );

  const addOrReplaceMessages = useCallback((current = [], incoming = []) => {
    const mergeMessage = (existing = {}, nextRow = {}) => {
      const existingMedia = existing.mediaAttachments || [];
      const nextMedia = nextRow.mediaAttachments || [];
      const mergedMedia = nextMedia.length
        ? nextMedia.map((item, index) => {
            const localMedia = existingMedia[index] || {};
            return {
              ...localMedia,
              ...item,
              kind: item.kind && item.kind !== "file" ? item.kind : localMedia.kind,
              mediaType: item.mediaType || localMedia.mediaType,
              directUrl: item.directUrl || localMedia.directUrl,
            };
          })
        : existingMedia;
      return {
        ...existing,
        ...nextRow,
        mediaAttachments: mergedMedia,
      };
    };

    const rows = Array.isArray(incoming) ? incoming : [incoming];
    const next = [...current];
    rows.forEach((row) => {
      if (!row) return;
      const rowKeys = getMessageKeys(row);
      const rowFingerprint = getMessageFingerprint(row);
      const existingIndex = next.findIndex((item) =>
        getMessageKeys(item).some((key) => rowKeys.includes(key)) ||
        (rowFingerprint && getMessageFingerprint(item) === rowFingerprint) ||
        isLikelySameOutboundMedia(item, row)
      );
      if (existingIndex >= 0) {
        next[existingIndex] = mergeMessage(next[existingIndex], row);
      } else {
        next.push(row);
      }
    });
    const deduped = [];
    next.forEach((row) => {
      const rowKeys = getMessageKeys(row);
      const rowFingerprint = getMessageFingerprint(row);
      const existingIndex = deduped.findIndex((item) =>
        getMessageKeys(item).some((key) => rowKeys.includes(key)) ||
        (rowFingerprint && getMessageFingerprint(item) === rowFingerprint) ||
        isLikelySameOutboundMedia(item, row)
      );
      if (existingIndex >= 0) {
        deduped[existingIndex] = mergeMessage(deduped[existingIndex], row);
      } else {
        deduped.push(row);
      }
    });
    return deduped.sort((a, b) => new Date(a.sentAt || 0) - new Date(b.sentAt || 0));
  }, [getMessageFingerprint, getMessageKeys, isLikelySameOutboundMedia]);

  const clearPendingMedia = useCallback(() => {
    setPendingMedia((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
  }, []);

  const loadConversations = useCallback(async ({ silent = false, nextPage = pageRef.current, nextSearch = searchRef.current } = {}) => {
    if (!silent) setLoadingChats(true);
    try {
      const requestedPage = Math.max(1, Number(nextPage) || 1);
      const response = await customerWhatsappApi.loadConversations({
        search: nextSearch,
        page: requestedPage,
        limit: CONVERSATION_LIMIT,
      });
      setConversations(response.items);
      setSelectedConversation((current) => {
        if (!current?.id) return current;
        const refreshed = response.items.find((item) => item.id === current.id);
        return refreshed ? { ...current, ...refreshed } : current;
      });
      const nextTotalPages = Math.max(1, Number(response.pagination?.totalPages || response.pagination?.total_pages || 1) || 1);
      const responsePage = Math.min(nextTotalPages, Math.max(1, Number(response.pagination?.page || requestedPage) || requestedPage));
      const unreadTotal = response.items.reduce((sum, item) => sum + Number(item.unread || 0), 0);
      updateWhatsappUnreadCount?.("CUSTOMER", unreadTotal);
      setTotalPages(nextTotalPages);
      totalPagesRef.current = nextTotalPages;
      pageRef.current = responsePage;
      setPage(responsePage);
      setError("");
    } catch (err) {
      if (!silent) setError(friendlyError(err));
    } finally {
      if (!silent) setLoadingChats(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, { silent = false, searchText = chatSearch, nextPage = 1, appendOlder = false } = {}) => {
    if (!conversationId) return;
    const requestKey = `${conversationId}|${nextPage}|${searchText}|${appendOlder ? "older" : "latest"}`;
    if (loadingMessagesKeysRef.current.has(requestKey)) return;
    loadingMessagesKeysRef.current.add(requestKey);
    if (!silent) setLoadingMessages(true);
    try {
      let response = await customerWhatsappApi.loadMessages(conversationId, {
        page: nextPage,
        limit: MESSAGE_LIMIT,
        search: searchText,
      });
      let loadedPage = Math.max(1, Number(response.pagination?.page || nextPage) || 1);
      const totalMessagePages = Math.max(1, Number(response.pagination?.totalPages || response.pagination?.total_pages || 1) || 1);
      const expectedLastId = String(response.conversation?.lastMessageId || response.conversation?.last_message_id || "");
      const hasExpectedLastMessage =
        expectedLastId &&
        response.items.some((message) =>
          [message.id, message.raw?.id, message.raw?.messageId, message.raw?.message_id].filter(Boolean).map(String).includes(expectedLastId)
        );

      if (!appendOlder && !searchText && loadedPage === 1 && totalMessagePages > 1 && (!expectedLastId || !hasExpectedLastMessage)) {
        response = await customerWhatsappApi.loadMessages(conversationId, {
          page: totalMessagePages,
          limit: MESSAGE_LIMIT,
          search: searchText,
        });
        loadedPage = Math.max(1, Number(response.pagination?.page || totalMessagePages) || totalMessagePages);
      }

      setMessagePage(loadedPage);
      setHasMoreMessages(loadedPage > 1);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: appendOlder
          ? addOrReplaceMessages(response.items, prev[conversationId] || [])
          : addOrReplaceMessages(prev[conversationId] || [], response.items),
      }));
      setError("");
      if (!appendOlder) scrollToBottom();
    } catch (err) {
      if (!silent) setError(friendlyError(err));
    } finally {
      loadingMessagesKeysRef.current.delete(requestKey);
      if (!silent) setLoadingMessages(false);
    }
  }, [addOrReplaceMessages, chatSearch, scrollToBottom]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      pageRef.current = 1;
      searchRef.current = search;
      loadConversations({ nextPage: 1, nextSearch: search });
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, loadConversations]);

  useEffect(() => {
    selectedIdRef.current = selectedConversation?.id || "";
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (!mediaUploadError) return undefined;
    const timeout = setTimeout(() => setMediaUploadError(""), 5000);
    return () => clearTimeout(timeout);
  }, [mediaUploadError]);

  useEffect(() => () => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    setPendingMedia((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    const timeout = setTimeout(() => {
      setMessagePage(1);
      loadMessages(selectedConversation.id, { searchText: chatSearch, nextPage: 1 });
    }, 300);
    return () => clearTimeout(timeout);
  }, [chatSearch, selectedConversation?.id, loadMessages]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setReplyTo(null);
    clearPendingMedia();
    setChatSearch("");
    setMessagePage(1);
    try {
      await customerWhatsappApi.markRead(conversation.id);
      setConversations((prev) => prev.map((item) => item.id === conversation.id ? { ...item, unread: 0 } : item));
      updateWhatsappUnreadCount?.("CUSTOMER", conversations.reduce((sum, item) => sum + (item.id === conversation.id ? 0 : Number(item.unread || 0)), 0));
    } catch {
      // Opening the chat should still succeed even if mark-read fails.
    }
  };

  const reloadActiveSilently = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      const activeId = selectedIdRef.current;
      loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
      if (activeId) loadMessages(activeId, { silent: true, searchText: "", nextPage: 1 });
    }, 250);
  }, [loadConversations, loadMessages]);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    let retryAttempt = 0;

    customerWhatsappApi
      .subscribeEvents({
        signal: controller.signal,
        onOpen(response) {
          if (!response.ok) throw new Error(`WhatsApp SSE failed with status ${response.status}`);
          retryAttempt = 0;
        },
        onMessage(message) {
          const eventName = message?.event || "message";
          let data = {};
          try {
            data = message?.data ? JSON.parse(message.data) : {};
          } catch {
            data = {};
          }
          if (eventName === "message_new") {
            reloadActiveSilently();
          }
          if (eventName === "message_status") {
            const messageId = data.messageId || data.message_id || data.metaMessageId || data.meta_message_id;
            const status = data.status || data.providerStatus || data.provider_status;
            const conversationId = String(data.conversationId || data.conversation_id || data.threadId || data.thread_id || "");
            setMessagesByConversation((prev) => {
              const activeId = selectedIdRef.current;
              const rows = prev[activeId] || [];
              return {
                ...prev,
                [activeId]: rows.map((messageItem) =>
                  [messageItem.id, messageItem.metaMessageId, messageItem.providerMessageId, messageItem.whatsappMessageId]
                    .filter(Boolean)
                    .map(String)
                    .includes(String(messageId))
                    ? { ...messageItem, providerStatus: status }
                    : messageItem
                ),
              };
            });
            if (conversationId && status) {
              setConversations((prev) =>
                prev.map((conversation) =>
                  conversation.id === conversationId ? { ...conversation, lastStatus: status, isLastOutbound: true } : conversation
                )
              );
            }
            loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
          }
        },
        onClose() {},
        onError(error) {
          retryAttempt += 1;
          return Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** (retryAttempt - 1));
        },
      })
      .catch(() => {});

    return () => controller.abort();
  }, [token, reloadActiveSilently, loadConversations]);

  const handleThreadPageChange = (targetPage) => {
    const nextPage = Math.min(totalPagesRef.current, Math.max(1, Number(targetPage) || 1));
    if (nextPage === pageRef.current || loadingChats) return;

    pageRef.current = nextPage;
    setPage(nextPage);
    loadConversations({ nextPage, nextSearch: searchRef.current });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedConversation) return;
    if (!canSendText) {
      setError("Session expired. Please send a template message.");
      return;
    }
    if (pendingMedia) {
      if (mediaSendingRef.current) return;
      await sendPendingMedia();
      return;
    }
    if (!messageText.trim()) return;
    const text = messageText.trim();
    const localId = `local-${Date.now()}`;
    const optimistic = normalizeMessage({
      id: localId,
      text,
      direction: "outbound",
      status: "sending",
      created_at: new Date().toISOString(),
      quotedMessage: replyTo ? { text: replyTo.text } : null,
    });
    setMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), optimistic],
    }));
    setMessageText("");
    setReplyTo(null);
    scrollToBottom();
    try {
      await customerWhatsappApi.sendReply(selectedConversation.id, text, replyTo?.metaMessageId || "");
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation.id]: (prev[selectedConversation.id] || []).filter((message) => message.id !== localId),
      }));
      await loadMessages(selectedConversation.id, { silent: true, searchText: "", nextPage: 1 });
      await loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
    } catch (err) {
      setError(friendlyError(err));
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation.id]: (prev[selectedConversation.id] || []).map((message) =>
          message.id === localId ? { ...message, providerStatus: "failed", errorMessage: friendlyError(err) } : message
        ),
      }));
    }
  };

  const handleRetry = async (message) => {
    const media = message.mediaAttachments?.[0];
    if (media) {
      try {
        const blob = await customerWhatsappApi.downloadMediaForRetry(media);
        const file = new File([blob], media.fileName || "whatsapp-media", {
          type: blob.type || media.mimeType || "application/octet-stream",
        });
        const validationError = validateMediaFile(file);
        if (validationError) {
          setMessagesByConversation((prev) => ({
            ...prev,
            [selectedConversation.id]: (prev[selectedConversation.id] || []).map((item) =>
              item.id === message.id ? { ...item, errorMessage: validationError } : item
            ),
          }));
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        if (media.mediaType) formData.append("mediaType", media.mediaType);
        formData.append("mimeType", media.mimeType || file.type || "");
        formData.append("fileName", media.fileName || file.name || "");
        if (message.metaContextMessageId) formData.append("contextMessageId", message.metaContextMessageId);
        await customerWhatsappApi.sendMediaReply(selectedConversation.id, formData);
        await loadMessages(selectedConversation.id, { silent: true, searchText: "", nextPage: 1 });
        await loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
      } catch (err) {
        setError(friendlyError(err));
      }
      return;
    }
    setMessageText(message.text);
    setReplyTo(null);
  };

  const resetTemplateState = () => {
    setTemplatesError("");
    setSelectedTemplateId(null);
    setSelectedTemplate(null);
    setTemplateValues([]);
    setTemplateDetailLoading(false);
    setTemplateDetailError("");
    setTemplateLanguageCode("");
  };

  const closeTemplatePicker = () => {
    setTemplateOpen(false);
    setTemplates([]);
    setTemplatesLoading(false);
    setTemplateSubmitting(false);
    resetTemplateState();
  };

  const openTemplates = async () => {
    if (!selectedConversation?.id) return;
    setTemplateOpen(true);
    setTemplatesLoading(true);
    resetTemplateState();
    try {
      const items = await customerWhatsappApi.loadTemplates(selectedConversation.id);
      setTemplates(items);
    } catch (err) {
      setTemplatesError(friendlyError(err));
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const selectTemplate = async (templateId) => {
    if (!templateId) return;
    setSelectedTemplateId(String(templateId));
    setSelectedTemplate(null);
    setTemplateValues([]);
    setTemplateDetailLoading(true);
    setTemplateDetailError("");
    try {
      const template = await customerWhatsappApi.loadTemplateDetails(templateId);
      setSelectedTemplate(template);
      setTemplateValues(Array.from({ length: template.variables.length }, () => ""));
      setTemplateLanguageCode(template.languageCode || "");
    } catch (err) {
      setTemplateDetailError(friendlyError(err));
    } finally {
      setTemplateDetailLoading(false);
    }
  };

  const sendTemplate = async () => {
    if (!selectedConversation?.id || !selectedTemplateId) return;
    setTemplateSubmitting(true);
    try {
      const payload = {
        templateId: selectedTemplateId,
      };
      if (templateValues.length > 0) {
        payload.bodyParameters = templateValues;
      }
      if (templateLanguageCode) {
        payload.languageCode = templateLanguageCode;
      }
      await customerWhatsappApi.sendTemplate(selectedConversation.id, payload);
      closeTemplatePicker();
      await loadMessages(selectedConversation.id, { silent: true, searchText: "", nextPage: 1 });
      await loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const sendMediaFile = async ({ file, previewUrl, kind, fileName, mimeType, sizeBytes, options = {}, caption = "" }) => {
    if (!selectedConversation?.id || !file) return;
    if (mediaSendingRef.current) return;
    mediaSendingRef.current = true;
    setMediaSending(true);
    const uploadFile = ensureFileMimeType(file, mimeType);
    const localId = `local-media-${Date.now()}`;
    const optimistic = {
      id: localId,
      text: caption,
      type: mimeType || "document",
      direction: "outbound",
      providerStatus: "sending",
      sentAt: new Date().toISOString(),
      mediaAttachments: [
        {
          id: "",
          kind,
          mediaType: options.mediaType || kind,
          fileName,
          mimeType,
          sizeBytes,
          directUrl: previewUrl,
        },
      ],
    };
    setMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversation.id]: addOrReplaceMessages(prev[selectedConversation.id] || [], optimistic),
    }));
    setMessageText("");
    scrollToBottom();
    const formData = new FormData();
    formData.append("file", uploadFile);
    if (options.mediaType) formData.append("mediaType", options.mediaType);
    formData.append("mimeType", options.mimeType || mimeType || uploadFile.type || "");
    formData.append("fileName", options.fileName || uploadFile.name || file.name || "");
    if (caption) formData.append("caption", caption);
    if (replyTo?.metaMessageId) formData.append("contextMessageId", replyTo.metaMessageId);
    try {
      const response = await customerWhatsappApi.sendMediaReply(selectedConversation.id, formData);
      const saved = normalizeMessage(extractSingleMessagePayload(response));
      const savedMediaAttachments = saved.mediaAttachments?.length
        ? saved.mediaAttachments.map((item, index) => {
            const localMedia = optimistic.mediaAttachments[index] || {};
            return {
              ...localMedia,
              ...item,
              kind: item.kind && item.kind !== "file" ? item.kind : localMedia.kind,
              mediaType: item.mediaType || localMedia.mediaType,
              directUrl: item.directUrl || localMedia.directUrl,
            };
          })
        : optimistic.mediaAttachments;
      const mergedMessage = {
        ...optimistic,
        ...saved,
        mediaAttachments: savedMediaAttachments,
      };
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation.id]: addOrReplaceMessages(
          (prev[selectedConversation.id] || []).filter((message) => message.id !== localId),
          mergedMessage
        ),
      }));
      if (savedMediaAttachments.some((item) => item.directUrl && item.directUrl !== previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
      setReplyTo(null);
      await loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
    } catch (err) {
      setError(friendlyError(err));
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation.id]: (prev[selectedConversation.id] || []).map((message) =>
          message.id === localId ? { ...message, providerStatus: "failed", errorMessage: friendlyError(err) } : message
        ),
      }));
    } finally {
      mediaSendingRef.current = false;
      setMediaSending(false);
    }
  };

  const handleSendMedia = async (file, options = {}) => {
    if (!selectedConversation?.id || !file) return;
    if (mediaSendingRef.current) return;
    if (!canSendText) {
      setError("Session expired. Please send a template message.");
      return;
    }
    if (!canSendWhatsAppMediaFile(file, options.mediaType)) {
      setError(unsupportedWhatsAppMediaMessage);
      return;
    }
    const validationError = validateMediaFile(file, options.mediaType);
    if (validationError) {
      setMediaUploadError(validationError);
      return;
    }
    setMediaUploadError("");
    const normalizedMediaType = String(options.mediaType || "").toUpperCase();
    const mimeType = options.mimeType || getPendingMimeType(file);
    const mediaPayload = {
      file,
      kind: getPendingMediaKind(file, mimeType, options.mediaType),
      fileName: options.fileName || file.name,
      mimeType,
      sizeBytes: file.size,
      previewUrl: URL.createObjectURL(file),
      options,
    };

    if (normalizedMediaType === "VOICE") {
      await sendMediaFile(mediaPayload);
      return;
    }

    setPendingMedia((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return mediaPayload;
    });
  };

  const sendPendingMedia = async () => {
    if (!selectedConversation?.id || !pendingMedia?.file) return;
    const caption = messageText.trim();
    const payload = { ...pendingMedia, caption };
    setPendingMedia(null);
    await sendMediaFile(payload);
  };

  const handleForwardMessage = async ({ message, media, targetConversationId }) => {
    if (!selectedConversation?.id || !targetConversationId || !message) return;
    try {
      await customerWhatsappApi.forwardMessage(selectedConversation.id, {
        targetConversationId,
        messageId: message.id,
        metaMessageId: message.metaMessageId,
        mediaId: media?.id,
      });
      if (String(targetConversationId) === String(selectedConversation.id)) {
        await loadMessages(selectedConversation.id, { silent: true, searchText: "", nextPage: 1 });
      }
      await loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const loadOlder = () => {
    if (!selectedConversation?.id) return;
    const next = messagePage - 1;
    if (next < 1) return;
    setMessagePage(next);
    loadMessages(selectedConversation.id, { nextPage: next, appendOlder: true });
  };

  return (
    <div className="flex h-[calc(100vh-155px)] min-h-[620px] overflow-hidden rounded-lg border border-[#d9e1dd] bg-white shadow-sm">
      <CustomerChatList
        conversations={conversations}
        selectedId={selectedConversation?.id}
        search={search}
        loading={loadingChats}
        page={page}
        totalPages={totalPages}
        onSearch={setSearch}
        onSelect={handleSelectConversation}
        onPageChange={handleThreadPageChange}
      />
      <CustomerMessageThread
        conversation={activeConversation}
        messages={activeMessages}
        loading={loadingMessages}
        messageText={messageText}
        mediaUploadError={mediaUploadError}
        pendingMedia={pendingMedia}
        chatSearch={chatSearch}
        replyTo={replyTo}
        canSendText={canSendText}
        hasMoreMessages={hasMoreMessages}
        showJumpLatest={showJumpLatest}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        onCloseChat={() => {
          clearPendingMedia();
          setSelectedConversation(null);
        }}
        onChatSearch={setChatSearch}
        onLoadOlder={loadOlder}
        onScroll={() => {
          const el = messagesContainerRef.current;
          if (!el) return;
          setShowJumpLatest(el.scrollHeight - el.scrollTop - el.clientHeight > 180);
        }}
        onCopy={(message) => navigator.clipboard?.writeText(message.text || "")}
        onReply={setReplyTo}
        onCancelReply={() => setReplyTo(null)}
        onChangeMessage={setMessageText}
        onSend={handleSend}
        onSendMedia={handleSendMedia}
        mediaSending={mediaSending}
        allowedMediaAccept={ALLOWED_MEDIA_ACCEPT}
        onCancelPendingMedia={clearPendingMedia}
        onRetry={handleRetry}
        onOpenTemplates={openTemplates}
        onJumpLatest={scrollToBottom}
        conversations={conversations}
        onForwardMessage={handleForwardMessage}
      />
      {error && (
        <div className="fixed bottom-5 right-5 z-[80] rounded bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {error}
          <button className="ml-3 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      <TemplatePicker
        open={templateOpen}
        templates={templates}
        selectedTemplate={selectedTemplate}
        selectedTemplateId={selectedTemplateId}
        loading={templatesLoading}
        detailLoading={templateDetailLoading}
        submitting={templateSubmitting}
        templatesError={templatesError}
        detailError={templateDetailError}
        values={templateValues}
        onClose={closeTemplatePicker}
        onSelectTemplate={selectTemplate}
        onValueChange={(index, value) => {
          setTemplateValues((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
          });
        }}
        onSend={sendTemplate}
      />
    </div>
  );
}
