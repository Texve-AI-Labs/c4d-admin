import moment from "moment";

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const pickText = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== "");
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
};

export const getMessageText = (raw = {}) =>
  pickText(
    raw.textBody,
    raw.text_body,
    raw.text?.body,
    raw.interactive?.button_reply?.title,
    raw.interactive?.list_reply?.title,
    raw.interactive?.list_reply?.description,
    raw.message?.text,
    raw.message?.body,
    raw.payload?.text,
    raw.payload?.body,
    raw.media?.caption,
    raw.image?.caption,
    raw.video?.caption,
    raw.document?.caption,
    raw.audio?.caption,
    raw.sticker?.caption,
    raw.body?.text,
    raw.body?.body,
    raw.text,
    raw.body,
    raw.message,
    raw.content,
    raw.caption,
    raw.template?.body,
    raw.template?.name ? `[TEMPLATE] ${raw.template.name}` : "",
    raw.templateName ? `[TEMPLATE] ${raw.templateName}` : "",
    raw.template_name ? `[TEMPLATE] ${raw.template_name}` : "",
    raw.errorMessage ? `Message undeliverable: ${raw.errorMessage}` : "",
    raw.errors?.[0]?.message ? `Message undeliverable: ${raw.errors[0].message}` : "",
    ""
  );

export const isRenderableMessage = (raw = {}) => {
  if (!raw || typeof raw !== "object") return false;
  if (String(getMessageText(raw) || "").trim()) return true;
  return Boolean(
    raw.mediaUrl ||
      raw.media?.url ||
      raw.imageUrl ||
      raw.videoUrl ||
      raw.audioUrl ||
      raw.documentUrl ||
      raw.attachments?.length ||
      raw.image ||
      raw.video ||
      raw.audio ||
      raw.document ||
      raw.sticker
  );
};

export const getMediaLabel = (raw = {}) => {
  const type = String(raw.messageType || raw.type || raw.mediaType || "").toLowerCase();
  if (type === "image" || raw.image || raw.imageUrl) return "Image";
  if (type === "video" || raw.video || raw.videoUrl) return "Video";
  if (type === "audio" || raw.audio || raw.audioUrl) return "Audio";
  if (type === "document" || raw.document || raw.documentUrl) return "Document";
  if (type === "sticker" || raw.sticker) return "Sticker";
  if (raw.media || raw.mediaUrl || raw.attachments?.length) return "Attachment";
  return "";
};

export const getInitials = (name = "") => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "WD";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

export const formatChatTime = (value) => {
  if (!value) return "";
  const date = moment(value);
  if (!date.isValid()) return "";
  if (date.isSame(moment(), "day")) return date.format("h:mm A");
  if (date.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
  return date.format("DD MMM");
};

export const formatMessageTime = (value) => {
  if (!value) return "";
  const date = moment(value);
  return date.isValid() ? date.format("h:mm A") : "";
};

export const formatDateSeparator = (value) => {
  if (!value) return "";
  const date = moment(value);
  if (!date.isValid()) return "";
  if (date.isSame(moment(), "day")) return "Today";
  if (date.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
  return date.format("DD MMM YYYY");
};

export const getDayKey = (value) => {
  const date = moment(value);
  return date.isValid() ? date.format("YYYY-MM-DD") : "unknown";
};

export const isSessionOpen = (conversation = {}) => {
  if (typeof conversation.isSessionWindowOpen === "boolean") return conversation.isSessionWindowOpen;
  if (typeof conversation.is_session_window_open === "boolean") return conversation.is_session_window_open;

  const expiry = pickFirst(
    conversation.sessionWindowExpiresAt,
    conversation.session_window_expires_at,
    conversation.sessionExpiresAt,
    conversation.sessionExpiry,
    conversation.windowExpiresAt,
    conversation.session_expires_at
  );
  if (expiry) return moment(expiry).isAfter(moment());

  const lastInbound = pickFirst(
    conversation.lastInboundAt,
    conversation.last_inbound_at,
    conversation.lastCustomerMessageAt,
    conversation.lastReceivedAt,
    conversation.lastMessageAt,
    conversation.last_message_time,
    conversation.updatedAt
  );
  if (!lastInbound) return false;
  const date = moment(lastInbound);
  return date.isValid() && moment().diff(date, "hours", true) < 24;
};

export const normalizeConversation = (raw = {}) => {
  const id = String(pickFirst(raw.conversationId, raw.whatsappConversationId, raw.id, raw._id) || "");
  const name = pickFirst(
    raw.name,
    raw.displayName,
    raw.display_name,
    raw.driverName,
    raw.driver_name,
    raw.contactName,
    raw.contact_name,
    raw.contacts?.[0]?.profile?.name,
    raw.profileName,
    raw.Driver?.firstName,
    raw.driver?.firstName,
    raw.phoneNumber,
    raw.mobileNumber,
    "Unknown Driver"
  );
  const lastMessage = pickFirst(
    raw.lastMessage,
    raw.last_message,
    raw.lastMessagePreview,
    raw.last_message_preview,
    raw.lastMessageText,
    raw.last_message_text,
    raw.preview,
    raw.lastMessage?.text,
    raw.message,
    ""
  );
  const lastMessageAt = pickFirst(
    raw.lastMessageAt,
    raw.last_message_at,
    raw.lastMessageAt,
    raw.last_message_time,
    raw.updatedAt,
    raw.updated_at,
    raw.createdAt,
    raw.created_at,
    raw.timestamp,
    raw.lastMessage?.createdAt
  );

  return {
    ...raw,
    id,
    name,
    phoneNumber: pickFirst(raw.phoneNumber, raw.phone_number, raw.mobileNumber, raw.waId, raw.wa_id, raw.contacts?.[0]?.wa_id, raw.Driver?.phoneNumber, raw.driver?.phoneNumber, ""),
    avatarUrl: pickFirst(raw.avatarUrl, raw.profilePhoto, raw.photoUrl, raw.Driver?.profilePhoto, raw.driver?.profilePhoto, ""),
    lastMessage,
    lastMessageAt,
    unreadCount: Number(pickFirst(raw.unreadCount, raw.unread_count, raw.unread, raw.unreadMessages, 0) || 0),
    audienceType: pickFirst(raw.audienceType, raw.type, "DRIVER"),
  };
};

export const normalizeMessage = (raw = {}) => {
  const id = String(
    pickFirst(raw.messageId, raw.message_id, raw.metaMessageId, raw.meta_message_id, raw.whatsappMessageId, raw.wamid, raw.id, raw._id, `temp-${Date.now()}`)
  );
  const direction = String(pickFirst(raw.direction, raw.messageDirection, raw.type, raw.senderType, "")).toLowerCase();
  const fromAdmin = Boolean(
    raw.fromAdmin ||
      raw.isSentByAdmin ||
      raw.sentByAdmin ||
      ["outbound", "outgoing", "sent", "admin", "business"].includes(direction)
  );
  const mediaLabel = getMediaLabel(raw);
  const text = getMessageText(raw) || (mediaLabel ? `[${mediaLabel}]` : "");
  const failedReason = pickFirst(raw.errorMessage, raw.error_message, raw.errors?.[0]?.message, raw.errors?.[0]?.title, "");

  return {
    ...raw,
    id,
    text,
    mediaLabel,
    mediaUrl: pickFirst(raw.mediaUrl, raw.media?.url, raw.imageUrl, raw.videoUrl, raw.audioUrl, raw.documentUrl, ""),
    failedReason,
    fromAdmin,
    status: String(pickFirst(raw.providerStatus, raw.provider_status, raw.status, raw.deliveryStatus, raw.messageStatus, "sent")).toLowerCase(),
    createdAt: pickFirst(raw.createdAt, raw.created_at, raw.timestamp, raw.sentAt, raw.sent_at, raw.updatedAt, raw.updated_at, new Date().toISOString()),
    contextMessageId: pickFirst(
      raw.contextMessageId,
      raw.context_message_id,
      raw.metaContextMessageId,
      raw.meta_context_message_id,
      raw.replyToMessageId,
      raw.quotedMessageId,
      raw.context?.id,
      raw.context?.message_id,
      ""
    ),
    quotedMessage: raw.quotedMessage ? normalizeMessage(raw.quotedMessage) : raw.contextMessage || raw.replyTo || raw.context || null,
    isOptimistic: Boolean(raw.isOptimistic),
  };
};

export const normalizeTemplate = (raw = {}) => ({
  ...raw,
  id: String(pickFirst(raw.id, raw.templateId, raw._id, raw.name) || ""),
  name: pickFirst(raw.name, raw.templateName, raw.displayName, "Template"),
  languageCode: pickFirst(raw.languageCode, raw.language, raw.locale, "en"),
  body: pickFirst(raw.body, raw.bodyText, raw.content, raw.components?.find?.((item) => item.type === "BODY")?.text, ""),
});

export const extractList = (response, key) => {
  const seen = new Set();
  const findArray = (value) => {
    if (!value || typeof value !== "object" || seen.has(value)) return [];
    seen.add(value);
    if (Array.isArray(value)) return value;
    const preferredKeys = [key, "items", "rows", "results", "data", "list"];
    for (const itemKey of preferredKeys) {
      if (Array.isArray(value?.[itemKey])) return value[itemKey];
    }
    for (const itemKey of preferredKeys) {
      const nested = findArray(value?.[itemKey]);
      if (nested.length) return nested;
    }
    return [];
  };
  const data = response?.data ?? response;
  const direct = findArray(data);
  if (direct.length) return direct;
  if (response?.data && response !== response.data) return findArray(response);
  return [];
};

export const hasMoreFromResponse = (response, list = [], limit = 20) => {
  const data = response?.data ?? response;
  if (typeof data?.hasMore === "boolean") return data.hasMore;
  if (typeof data?.pagination?.hasMore === "boolean") return data.pagination.hasMore;
  if (Number(data?.pagination?.totalPages || 0) && Number(data?.pagination?.currentPage || 0)) {
    return Number(data.pagination.currentPage) < Number(data.pagination.totalPages);
  }
  return list.length >= limit;
};
