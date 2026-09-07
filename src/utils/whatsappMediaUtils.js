const pick = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

export const getMediaKind = (media = {}) => {
  const rawType = String(
    pick(media, ["mediaType", "media_type", "type", "messageType", "message_type", "mimeType", "mime_type", "contentType", "content_type"], "")
  ).toLowerCase();
  if (rawType.includes("image")) return "image";
  if (rawType.includes("audio") || rawType.includes("voice")) return "audio";
  if (rawType.includes("video")) return "video";
  if (rawType.includes("pdf")) return "pdf";
  if (rawType.includes("word") || rawType.includes("document") || rawType.includes("doc")) return "document";
  return rawType || "file";
};

export const getMediaFileName = (media = {}) => {
  const id = pick(media, ["id", "mediaId", "media_id", "metaMediaId", "meta_media_id"], "file");
  return String(
    pick(media, ["fileName", "file_name", "originalName", "original_name", "name", "s3Key", "s3_key", "key"], `whatsapp-media-${id}`)
  ).split("/").pop();
};

const normalizeSingleMedia = (media = {}) => {
  const id = String(pick(media, ["id", "mediaId", "media_id", "messageMediaId", "message_media_id", "_id"], ""));
  const mimeType = String(pick(media, ["mimeType", "mime_type", "contentType", "content_type"], ""));
  return {
    raw: media,
    id,
    kind: getMediaKind(media),
    fileName: getMediaFileName(media),
    caption: String(pick(media, ["caption", "text", "description"], "")),
    mimeType,
    sizeBytes: pick(media, ["sizeBytes", "size_bytes", "fileSize", "file_size"], null),
    directUrl: String(pick(media, ["url", "mediaUrl", "media_url", "s3Url", "s3_url", "publicUrl", "public_url", "fileUrl", "file_url", "downloadUrl", "download_url", "storageUrl", "storage_url"], "")),
  };
};

const hasInlineMedia = (message = {}) => {
  const type = String(message.type || message.messageType || message.message_type || message.mediaType || message.media_type || "").toLowerCase();
  return Boolean(
    ["image", "audio", "voice", "video", "document", "pdf", "sticker"].some((item) => type.includes(item)) ||
      message.mediaId ||
      message.media_id ||
      message.metaMediaId ||
      message.meta_media_id ||
      message.mediaUrl ||
      message.media_url ||
      message.imageUrl ||
      message.audioUrl ||
      message.videoUrl ||
      message.documentUrl
  );
};

export const normalizeMessageMedia = (message = {}) => {
  const rawPayload = message.rawPayload || message.raw_payload || {};
  const mediaSources = [
    message.media,
    message.medias,
    message.Media,
    message.Medias,
    message.mediaItems,
    message.media_items,
    message.mediaFiles,
    message.media_files,
    message.messageMedia,
    message.message_media,
    message.messageMedias,
    message.message_medias,
    message.attachments,
    message.WhatsappConversationMessageMedia,
    message.WhatsappConversationMessageMedias,
    message.WhatsappConversationMessageMediaItems,
    message.whatsappConversationMessageMedia,
    message.whatsappConversationMessageMedias,
    rawPayload.media,
    rawPayload.medias,
    rawPayload.mediaItems,
    rawPayload.media_items,
    rawPayload.attachments,
  ];

  const mediaRows = mediaSources.flatMap((source) => {
    if (!source) return [];
    return Array.isArray(source) ? source : [source];
  });

  if (!mediaRows.length && hasInlineMedia(message)) {
    mediaRows.push({
      id: message.messageMediaId || message.message_media_id || "",
      mediaId: message.mediaId || message.media_id || "",
      mediaType: message.mediaType || message.media_type || message.type || message.messageType || message.message_type || "",
      mimeType: message.mimeType || message.mime_type || message.contentType || message.content_type || "",
      fileName: message.fileName || message.file_name || message.originalName || message.original_name || "",
      caption: message.caption || message.textBody || message.text || "",
      sizeBytes: message.sizeBytes || message.size_bytes || message.fileSize || message.file_size || null,
      url: message.mediaUrl || message.media_url || message.imageUrl || message.audioUrl || message.videoUrl || message.documentUrl || "",
    });
  }

  return mediaRows.map(normalizeSingleMedia).filter((item) => item.id || item.directUrl);
};

export const formatMediaSize = (sizeBytes) => {
  const size = Number(sizeBytes || 0);
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
