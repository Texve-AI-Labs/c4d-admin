const pick = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

export const WHATSAPP_SUPPORTED_MEDIA_TYPES = [
  "audio/aac",
  "audio/mp4",
  "audio/mpeg",
  "audio/amr",
  "audio/ogg",
  "audio/opus",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/3gpp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const normalizeMimeType = (mimeType = "") => String(mimeType || "").split(";")[0].trim().toLowerCase();

export const EXTENSION_MIME_TYPES = {
  ".aac": "audio/aac",
  ".amr": "audio/amr",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".3gp": "video/3gpp",
  ".3gpp": "video/3gpp",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const WHATSAPP_SUPPORTED_MEDIA_ACCEPT = [
  ...WHATSAPP_SUPPORTED_MEDIA_TYPES,
  ...Object.keys(EXTENSION_MIME_TYPES),
].join(",");

const EXTENSION_KINDS = {
  ".aac": "audio",
  ".amr": "audio",
  ".m4a": "audio",
  ".mp3": "audio",
  ".ogg": "audio",
  ".opus": "audio",
  ".webm": "audio",
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
  ".3gp": "video",
  ".3gpp": "video",
  ".mp4": "video",
  ".pdf": "pdf",
  ".doc": "document",
  ".docx": "document",
  ".ppt": "document",
  ".pptx": "document",
  ".txt": "document",
  ".xls": "document",
  ".xlsx": "document",
};

export const getMimeTypeFromFileName = (fileName = "") => {
  const normalizedName = String(fileName || "").toLowerCase();
  const extension = Object.keys(EXTENSION_MIME_TYPES).find((item) => normalizedName.endsWith(item));
  return extension ? EXTENSION_MIME_TYPES[extension] : "";
};

export const getFileMimeType = (file = {}) => {
  const browserType = normalizeMimeType(file.type);
  return browserType && browserType !== "application/octet-stream" ? browserType : getMimeTypeFromFileName(file.name);
};

export const ensureFileMimeType = (file, mimeType = getFileMimeType(file)) => {
  if (!file || !mimeType || typeof File === "undefined") return file;
  const currentType = normalizeMimeType(file.type);
  if (currentType && currentType !== "application/octet-stream") return file;
  return new File([file], file.name || "whatsapp-media", {
    type: mimeType,
    lastModified: file.lastModified || Date.now(),
  });
};

const getKindFromFileName = (fileName = "") => {
  const normalizedName = String(fileName || "").toLowerCase();
  const extension = Object.keys(EXTENSION_KINDS).find((item) => normalizedName.endsWith(item));
  return extension ? EXTENSION_KINDS[extension] : "";
};

export const getMediaKindFromMimeType = (mimeType = "") => {
  const normalized = normalizeMimeType(mimeType);
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("audio/")) return "audio";
  if (normalized.startsWith("video/")) return "video";
  if (normalized === "application/pdf") return "pdf";
  if (normalized.startsWith("text/") || normalized.includes("word") || normalized.includes("excel") || normalized.includes("spreadsheet") || normalized.includes("powerpoint") || normalized.includes("presentation") || normalized.includes("document")) {
    return "document";
  }
  return "";
};

export const isWhatsAppSupportedMediaFile = (file) =>
  Boolean(getFileMimeType(file) && WHATSAPP_SUPPORTED_MEDIA_TYPES.includes(getFileMimeType(file)));

export const isBackendSupportedVoiceRecording = (file) =>
  ["audio/webm", "video/webm"].includes(getFileMimeType(file));

export const canSendWhatsAppMediaFile = (file, mediaType = "") => {
  if (isWhatsAppSupportedMediaFile(file)) return true;
  const normalizedMediaType = String(mediaType || "").toUpperCase();
  return ["VOICE", "AUDIO"].includes(normalizedMediaType) && isBackendSupportedVoiceRecording(file);
};

export const getMediaKind = (media = {}) => {
  const rawType = String(
    pick(media, ["mediaType", "media_type", "type", "messageType", "message_type", "mimeType", "mime_type", "contentType", "content_type"], "")
  ).toLowerCase();
  const mimeKind = getMediaKindFromMimeType(pick(media, ["mimeType", "mime_type", "contentType", "content_type", "type"], ""));
  const fileNameKind = getKindFromFileName(getMediaFileName(media));
  if (rawType.includes("image")) return "image";
  if (rawType.includes("audio") || rawType.includes("voice")) return "audio";
  if (rawType.includes("video")) return "video";
  if (rawType.includes("pdf")) return "pdf";
  if (rawType.includes("word") || rawType.includes("document") || rawType.includes("doc")) return "document";
  return mimeKind || fileNameKind || "file";
};

export const getMediaFileName = (media = {}) => {
  const id = pick(media, ["id", "mediaId", "media_id", "metaMediaId", "meta_media_id"], "file");
  return String(
    pick(media, ["fileName", "file_name", "filename", "originalName", "original_name", "name", "s3Key", "s3_key", "key"], `whatsapp-media-${id}`)
  ).split("/").pop();
};

const normalizeSingleMedia = (media = {}) => {
  const id = String(pick(media, ["id", "mediaId", "media_id", "messageMediaId", "message_media_id", "_id"], ""));
  const mimeType = String(pick(media, ["mimeType", "mime_type", "contentType", "content_type"], ""));
  return {
    raw: media,
    id,
    kind: getMediaKind(media),
    mediaType: String(pick(media, ["mediaType", "media_type", "type", "messageType", "message_type"], "")),
    fileName: getMediaFileName(media),
    caption: String(pick(media, ["caption", "text", "description"], "")),
    mimeType,
    sizeBytes: pick(media, ["sizeBytes", "size_bytes", "fileSize", "file_size", "size"], null),
    viewUrl: String(pick(media, ["viewUrl", "view_url"], "")),
    downloadUrl: String(pick(media, ["downloadUrl", "download_url"], "")),
    directUrl: String(
      pick(media, [
        "url",
        "mediaUrl",
        "media_url",
        "s3Url",
        "s3_url",
        "publicUrl",
        "public_url",
        "fileUrl",
        "file_url",
        "storageUrl",
        "storage_url",
      ], "")
    ),
    isReady: pick(media, ["isReady", "is_ready"], true),
    isViewable: pick(media, ["isViewable", "is_viewable"], true),
    isDownloadable: pick(media, ["isDownloadable", "is_downloadable"], true),
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
      message.documentUrl ||
      message.hasMedia ||
      message.has_media
  );
};

export const normalizeMessageMedia = (message = {}) => {
  const rawPayload = message.rawPayload || message.raw_payload || {};
  const data = message.data || {};
  const nestedMessage = message.message && typeof message.message === "object" ? message.message : {};
  const dataMessage = data.message && typeof data.message === "object" ? data.message : {};
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
    data.media,
    data.medias,
    data.mediaItems,
    data.media_items,
    data.attachments,
    nestedMessage.media,
    nestedMessage.medias,
    nestedMessage.attachments,
    dataMessage.media,
    dataMessage.medias,
    dataMessage.attachments,
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
      fileName: message.fileName || message.file_name || message.filename || message.originalName || message.original_name || "",
      caption: message.caption || message.textBody || message.text || "",
      sizeBytes: message.sizeBytes || message.size_bytes || message.fileSize || message.file_size || message.size || null,
      url: message.mediaUrl || message.media_url || message.viewUrl || message.view_url || message.imageUrl || message.audioUrl || message.videoUrl || message.documentUrl || "",
    });
  }

  const seen = new Set();
  return mediaRows
    .map(normalizeSingleMedia)
    .filter((item) => item.id || item.directUrl || item.viewUrl || item.downloadUrl)
    .filter((item) => {
      const key = [
        item.id,
        item.raw?.messageId,
        item.raw?.message_id,
        item.raw?.metaMediaId,
        item.raw?.meta_media_id,
        item.raw?.s3Key,
        item.raw?.s3_key,
        item.raw?.storageKey,
        item.raw?.storage_key,
        item.fileName,
        item.sizeBytes,
      ]
        .filter(Boolean)
        .join("|");
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const formatMediaSize = (sizeBytes) => {
  const size = Number(sizeBytes || 0);
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
