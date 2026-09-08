import React from "react";
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  EyeIcon,
  ForwardIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getBaseUrl, getNgrokSkipHeaders } from "@/utils/constants";
import { formatMediaSize } from "@/utils/whatsapp/media";

const getToken = () => localStorage.getItem("rootcabs_access_token") || localStorage.getItem("token") || "";

const resolveMediaUrl = (url = "") => {
  if (!url) return "";
  if (url.startsWith("blob:") || /^https?:\/\//i.test(url)) return url;
  if (!url.startsWith("/")) return url;
  try {
    return `${new URL(getBaseUrl()).origin}${url}`;
  } catch {
    return url;
  }
};

const isApiMediaUrl = (url = "") => /\/api\/customer\/[^/]+\/whatsapp-media\/[^/]+\/(view|download)/i.test(url);

const canUseDirectMediaUrl = (url = "") => Boolean(url) && !isApiMediaUrl(resolveMediaUrl(url));

const mediaEndpoint = (media, action) => {
  const actionUrl = action === "download" ? media?.downloadUrl : media?.viewUrl;
  if (actionUrl) return resolveMediaUrl(actionUrl);
  if (!media?.id) return resolveMediaUrl(media?.directUrl || "");
  return `${getBaseUrl()}/whatsapp-media/${media.id}/${action}`;
};

const mediaIcon = {
  image: PhotoIcon,
  audio: MusicalNoteIcon,
  voice: MusicalNoteIcon,
  pdf: DocumentIcon,
  document: DocumentIcon,
  file: DocumentIcon,
  video: VideoCameraIcon,
};

const fetchMediaBlob = async (media, action) => {
  if (media.directUrl && media.directUrl.startsWith("blob:")) return media.directUrl;
  if (media.directUrl && !media.id && !media.viewUrl && !media.downloadUrl && canUseDirectMediaUrl(media.directUrl)) {
    return resolveMediaUrl(media.directUrl);
  }
  const token = getToken();
  const response = await fetch(mediaEndpoint(media, action), {
    headers: {
      ...getNgrokSkipHeaders(),
      ...(token ? { token, Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error("Unable to load media");
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

const getViewUrl = async (media) => {
  const directUrl = resolveMediaUrl(media.directUrl || "");
  if (directUrl && canUseDirectMediaUrl(directUrl)) return directUrl;
  return fetchMediaBlob(media, "view");
};

const getDownloadUrl = async (media) => {
  const directUrl = resolveMediaUrl(media.directUrl || "");
  if (directUrl && !media.downloadUrl && !media.viewUrl && !media.id && canUseDirectMediaUrl(directUrl)) return directUrl;
  return fetchMediaBlob(media, "download");
};

function MediaPreviewModal({ media, objectUrl, onClose }) {
  if (!media || !objectUrl) return null;
  const kind = media.kind;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#d9e1dd] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111b21]">{media.fileName}</p>
            <p className="text-xs text-[#667781]">{media.mimeType || media.kind}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-[#f0f2f5]" aria-label="Close media preview">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#111b21] p-4">
          {kind === "image" && <img src={objectUrl} alt={media.fileName} className="mx-auto max-h-[72vh] rounded object-contain" />}
          {kind === "audio" && <audio src={objectUrl} controls className="mx-auto mt-20 w-full max-w-xl" />}
          {kind === "video" && <video src={objectUrl} controls className="mx-auto max-h-[72vh] rounded" />}
          {kind === "pdf" && <iframe src={objectUrl} title={media.fileName} className="h-[72vh] w-full rounded bg-white" />}
          {!["image", "audio", "video", "pdf"].includes(kind) && (
            <div className="mx-auto mt-20 max-w-md rounded-xl bg-white p-6 text-center">
              <DocumentIcon className="mx-auto h-12 w-12 text-[#008069]" />
              <p className="mt-3 text-sm font-semibold text-[#111b21]">Preview unavailable</p>
              <p className="mt-1 text-xs text-[#667781]">Download this file to view it in its native application.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ForwardModal({ open, media, targets, onClose, onForward }) {
  const [query, setQuery] = React.useState("");
  if (!open || !media) return null;
  const filtered = targets.filter((target) => {
    const value = `${target.name || ""} ${target.phone || target.phoneNumber || ""}`.toLowerCase();
    return value.includes(query.trim().toLowerCase());
  });
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#d9e1dd] px-4 py-3">
          <p className="text-sm font-semibold text-[#111b21]">Forward attachment</p>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-[#f0f2f5]" aria-label="Close forward modal">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            className="w-full rounded-lg border border-[#d9e1dd] px-3 py-2 text-sm outline-none focus:border-[#00a884]"
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => onForward(target.id)}
              className="flex w-full items-center gap-3 border-t border-[#eef2ef] px-4 py-3 text-left hover:bg-[#f5fbf8]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d9fdd3] text-sm font-semibold text-[#008069]">
                {(target.name || target.phone || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#111b21]">{target.name || target.phone || target.phoneNumber}</span>
                <span className="block truncate text-xs text-[#667781]">{target.phone || target.phoneNumber}</span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#667781]">No chats found</p>}
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppMediaAttachment({ media = [], message, forwardTargets = [], onForward }) {
  const [preview, setPreview] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [forwardMedia, setForwardMedia] = React.useState(null);
  const [loadingId, setLoadingId] = React.useState("");
  const [inlineUrls, setInlineUrls] = React.useState({});
  const fetchedInlineKeysRef = React.useRef(new Set());
  const mediaSignature = React.useMemo(
    () =>
      media
        .map((item, index) =>
          [
            item.id || index,
            item.kind,
            item.mediaType,
            item.mimeType,
            item.directUrl,
            item.viewUrl,
            item.downloadUrl,
            item.fileName,
          ].join("|")
        )
        .join("||"),
    [media]
  );

  React.useEffect(() => () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  React.useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    media.forEach((item, index) => {
      const key = item.id || item.directUrl || index;
      if (!["image", "audio", "voice", "video"].includes(item.kind)) return;
      const directUrl = resolveMediaUrl(item.directUrl || "");
      if (directUrl && canUseDirectMediaUrl(directUrl)) {
        setInlineUrls((prev) => ({ ...prev, [key]: directUrl }));
        return;
      }
      if (fetchedInlineKeysRef.current.has(key)) return;
      if (!item.id && !item.viewUrl && !item.directUrl) return;

      fetchedInlineKeysRef.current.add(key);
      fetchMediaBlob(item, "view")
        .then((url) => {
          if (cancelled) {
            if (url.startsWith("blob:")) URL.revokeObjectURL(url);
            return;
          }
          if (url.startsWith("blob:")) objectUrls.push(url);
          setInlineUrls((prev) => ({ ...prev, [key]: url }));
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaSignature]);

  const handleView = async (item) => {
    setLoadingId(`view-${item.id || item.directUrl}`);
    try {
      const url = await getViewUrl(item);
      setPreview(item);
      setPreviewUrl(url);
    } finally {
      setLoadingId("");
    }
  };

  const handleDownload = async (item) => {
    setLoadingId(`download-${item.id || item.directUrl}`);
    try {
      const url = await getDownloadUrl(item);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.fileName || "whatsapp-media";
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (url.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setLoadingId("");
    }
  };

  if (!media.length) return null;

  return (
    <>
      <div className="mb-2 space-y-2">
        {media.map((item, index) => {
          const Icon = mediaIcon[item.kind] || DocumentIcon;
          const key = item.id || item.directUrl || index;
          return (
            <div key={key} className="overflow-hidden rounded-lg border border-black/5 bg-black/5">
              {item.kind === "image" && inlineUrls[key] && (
                <button type="button" onClick={() => handleView(item)} className="block w-full">
                  <img src={inlineUrls[key]} alt={item.fileName} className="max-h-56 w-full object-cover" />
                </button>
              )}
              {item.kind === "video" && inlineUrls[key] && (
                <video src={inlineUrls[key]} controls className="max-h-56 w-full bg-black" />
              )}
              {["audio", "voice"].includes(item.kind) && inlineUrls[key] && (
                <div className="p-2">
                  <audio src={inlineUrls[key]} controls className="w-full" />
                </div>
              )}
              <div className="flex items-center gap-2 p-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/70 text-[#008069]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#111b21]">{item.fileName}</p>
                  <p className="text-[11px] text-[#667781]">{[item.kind, formatMediaSize(item.sizeBytes)].filter(Boolean).join(" - ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleView(item)}
                  disabled={loadingId === `view-${item.id || item.directUrl}`}
                  className="rounded-full p-1.5 text-[#54656f] hover:bg-white"
                  title="View"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  disabled={loadingId === `download-${item.id || item.directUrl}`}
                  className="rounded-full p-1.5 text-[#54656f] hover:bg-white"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
                {onForward && (
                  <button
                    type="button"
                    onClick={() => setForwardMedia(item)}
                    className="rounded-full p-1.5 text-[#54656f] hover:bg-white"
                    title="Forward"
                  >
                    <ForwardIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {item.caption && <p className="px-2 pb-2 text-xs text-[#111b21]">{item.caption}</p>}
            </div>
          );
        })}
      </div>
      <MediaPreviewModal
        media={preview}
        objectUrl={previewUrl}
        onClose={() => {
          if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
          setPreview(null);
          setPreviewUrl("");
        }}
      />
      <ForwardModal
        open={Boolean(forwardMedia)}
        media={forwardMedia}
        targets={forwardTargets}
        onClose={() => setForwardMedia(null)}
        onForward={async (targetConversationId) => {
          await onForward?.({ message, media: forwardMedia, targetConversationId });
          setForwardMedia(null);
        }}
      />
    </>
  );
}
