import React from "react";
import {
  CheckIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import {
  formatDateSeparator,
  formatMessageTime,
  getDayKey,
  getInitials,
  isSessionOpen,
} from "../utils/whatsappUtils";
import TemplatePickerModal from "./TemplatePickerModal";
import WhatsAppMediaAttachment from "@/components/whatsapp/WhatsAppMediaAttachment";
import WhatsAppVoiceRecorder from "@/components/whatsapp/WhatsAppVoiceRecorder";
import {
  formatMediaSize,
  getFileMimeType,
  getMediaKindFromMimeType,
  WHATSAPP_SUPPORTED_MEDIA_ACCEPT,
} from "@/utils/whatsapp/media";

function StatusTicks({ status }) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "sending") return <span className="text-[10px] text-blue-gray-400">sending</span>;
  if (normalized === "failed") return <span className="text-[10px] text-red-500">failed</span>;
  if (normalized === "sent") {
    return (
      <span className="inline-flex items-center text-blue-gray-400" title="sent">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  const read = normalized === "read" || normalized === "seen";
  const delivered = read || normalized === "delivered";
  return (
    <span className={`inline-flex items-center ${read ? "text-[#53BDEB]" : "text-blue-gray-400"}`} title={normalized || "sent"}>
      <CheckIcon className="h-3.5 w-3.5" />
      {delivered && <CheckIcon className="-ml-2 h-3.5 w-3.5" />}
    </span>
  );
}

function QuotedPreview({ message, compact = false }) {
  if (!message) return null;
  return (
    <div className={`mb-2 border-l-4 border-[#00A884] bg-black/5 px-2 py-1 ${compact ? "rounded-md" : "rounded-lg"}`}>
      <p className="text-[11px] font-semibold text-[#008069]">{message.fromAdmin ? "You" : "Driver"}</p>
      <p className="line-clamp-2 text-xs text-blue-gray-700">{message.text || message.body || message.message || "Message"}</p>
    </div>
  );
}

function MessageBubble({ message, onReply, onRetry, forwardTargets, onForwardMessage }) {
  const sent = message.fromAdmin;
  const failed = message.status === "failed";
  return (
    <div className={`group flex ${sent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
          sent ? "rounded-br-md bg-[#D9FDD3] text-blue-gray-900" : "rounded-bl-md bg-white text-blue-gray-900"
        }`}
      >
        <QuotedPreview message={message.quotedMessage} compact />
        <WhatsAppMediaAttachment
          media={message.mediaAttachments || []}
          message={message}
          forwardTargets={forwardTargets}
          onForward={onForwardMessage}
        />
        {message.mediaLabel && (
          <div className="mb-2 rounded-lg bg-black/5 px-2 py-1 text-xs font-semibold text-[#008069]">
            {message.mediaLabel}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
        {failed && message.failedReason && (
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] font-medium text-red-600">
            <p>{message.failedReason}</p>
            <button
              type="button"
              onClick={() => onRetry?.(message)}
              className="shrink-0 rounded-md bg-red-50 px-2 py-1 font-semibold text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-[10px] text-blue-gray-400">{formatMessageTime(message.createdAt)}</span>
          {sent && <StatusTicks status={message.status} />}
          {failed && !message.failedReason && (
            <button type="button" onClick={() => onRetry?.(message)} className="ml-1 font-semibold text-red-600">
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => onReply(message)}
            className="ml-1 rounded-full p-1 text-blue-gray-300 opacity-0 transition hover:bg-black/5 hover:text-blue-gray-700 group-hover:opacity-100 focus:opacity-100"
            aria-label="Reply to message"
          >
            <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageList({ messages, loading, hasMore, onLoadOlder, onReply, onRetry, searchQuery, forwardTargets, onForwardMessage }) {
  const scrollerRef = React.useRef(null);
  const bottomRef = React.useRef(null);
  const [stickToBottom, setStickToBottom] = React.useState(true);
  const [newMessageCount, setNewMessageCount] = React.useState(0);
  const prevCount = React.useRef(0);
  const normalizedSearch = String(searchQuery || "").trim().toLowerCase();
  const visibleMessages = normalizedSearch
    ? messages.filter((message) =>
        [message.text, message.mediaLabel, message.failedReason, message.quotedMessage?.text, message.quotedMessage?.textBody]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      )
    : messages;

  React.useEffect(() => {
    if (visibleMessages.length > prevCount.current && !stickToBottom) {
      setNewMessageCount((count) => count + visibleMessages.length - prevCount.current);
    }
    prevCount.current = visibleMessages.length;
    if (stickToBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, stickToBottom]);

  const handleScroll = () => {
    const element = scrollerRef.current;
    if (!element) return;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    setStickToBottom(nearBottom);
    if (nearBottom) setNewMessageCount(0);
    if (element.scrollTop < 80 && hasMore && !loading) onLoadOlder();
  };

  let lastDay = "";
  return (
    <div ref={scrollerRef} onScroll={handleScroll} className="relative min-h-0 flex-1 overflow-y-auto bg-[#EDE7DE] px-4 py-5">
      {hasMore && (
        <div className="mb-4 text-center">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={loading}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-gray-600 shadow-sm disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load older"}
          </button>
        </div>
      )}
      {loading && messages.length === 0 && (
        <div className="space-y-3">
          <div className="h-12 w-3/5 animate-pulse rounded-2xl bg-white" />
          <div className="ml-auto h-12 w-2/5 animate-pulse rounded-2xl bg-[#D9FDD3]" />
          <div className="h-16 w-1/2 animate-pulse rounded-2xl bg-white" />
        </div>
      )}
      <div className="space-y-3">
        {visibleMessages.map((message) => {
          const day = getDayKey(message.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <React.Fragment key={message.id}>
              {showDay && (
                <div className="flex justify-center">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-blue-gray-500 shadow-sm">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                onReply={onReply}
                onRetry={onRetry}
                forwardTargets={forwardTargets}
                onForwardMessage={onForwardMessage}
              />
            </React.Fragment>
          );
        })}
      </div>
      {!loading && normalizedSearch && visibleMessages.length === 0 && (
        <div className="flex h-full items-center justify-center text-sm font-medium text-blue-gray-500">
          No messages match "{searchQuery}"
        </div>
      )}
      {newMessageCount > 0 && (
        <button
          type="button"
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            setNewMessageCount(0);
          }}
          className="sticky bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#00A884] px-4 py-2 text-xs font-semibold text-white shadow-lg"
        >
          {newMessageCount} new message{newMessageCount > 1 ? "s" : ""}
        </button>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageInputBar({ disabled, sending, replyTo, onClearReply, onSend, onSendMedia, onOpenTemplates }) {
  const [text, setText] = React.useState("");
  const [pendingMedia, setPendingMedia] = React.useState(null);
  const fileInputRef = React.useRef(null);

  React.useEffect(
    () => () => {
      if (pendingMedia?.previewUrl) URL.revokeObjectURL(pendingMedia.previewUrl);
    },
    [pendingMedia?.previewUrl]
  );

  const clearPendingMedia = () => {
    setPendingMedia((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (disabled || sending) return;
    if (pendingMedia) {
      const media = pendingMedia;
      setPendingMedia(null);
      await onSendMedia(media.file, { caption: text.trim() });
      setText("");
      return;
    }
    if (!text.trim()) return;
    await onSend(text);
    setText("");
  };

  const sendMedia = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled || sending) return;
    const mimeType = getFileMimeType(file) || file.type || "application/octet-stream";
    setPendingMedia((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return {
        file,
        fileName: file.name,
        mimeType,
        kind: getMediaKindFromMimeType(mimeType) || "document",
        sizeBytes: file.size,
        previewUrl: URL.createObjectURL(file),
      };
    });
  };

  return (
    <div className="border-t border-blue-gray-100 bg-[#F0F2F5]">
      {pendingMedia && (
        <div className="border-b border-blue-gray-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearPendingMedia}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#54656F] hover:bg-[#F0F2F5]"
                title="Remove attachment"
                aria-label="Remove attachment"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-[#111B21]">{pendingMedia.fileName}</p>
              <span className="h-9 w-9 shrink-0" aria-hidden="true" />
            </div>
            <div className="grid min-h-[180px] place-items-center rounded-lg bg-[#F0F2F5] p-4">
              {pendingMedia.kind === "image" ? (
                <img src={pendingMedia.previewUrl} alt={pendingMedia.fileName} className="max-h-[240px] max-w-full rounded object-contain shadow-sm" />
              ) : pendingMedia.kind === "video" ? (
                <video src={pendingMedia.previewUrl} controls className="max-h-[240px] max-w-full rounded bg-black shadow-sm" />
              ) : pendingMedia.kind === "audio" ? (
                <audio src={pendingMedia.previewUrl} controls className="w-full max-w-md" />
              ) : (
                <div className="text-center text-[#667781]">
                  <DocumentIcon className="mx-auto h-16 w-16 text-white drop-shadow-sm" />
                  <p className="mt-3 text-sm font-semibold text-[#111B21]">{pendingMedia.fileName}</p>
                  <p className="mt-1 text-xs">
                    {[formatMediaSize(pendingMedia.sizeBytes), pendingMedia.mimeType].filter(Boolean).join(" - ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {replyTo && (
        <div className="mx-3 mt-3 flex items-start justify-between gap-2 rounded-xl bg-white p-2">
          <QuotedPreview message={replyTo} />
          <button type="button" onClick={onClearReply} className="rounded-full p-1 text-blue-gray-400 hover:bg-white hover:text-blue-gray-700" aria-label="Clear reply">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {disabled && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          <span>24-hour session expired. You can only send template messages.</span>
          <button type="button" onClick={onOpenTemplates} className="shrink-0 rounded-lg bg-[#00A884] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#008069]">
            Use Template
          </button>
        </div>
      )}
      <form onSubmit={submit} className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onOpenTemplates}
          className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#008069] transition hover:bg-[#E7FCE3]"
          aria-label="Open templates"
        >
          Use Template
        </button>
        <input ref={fileInputRef} type="file" accept={WHATSAPP_SUPPORTED_MEDIA_ACCEPT} className="hidden" onChange={sendMedia} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#54656F] transition hover:bg-[#E7FCE3] hover:text-[#008069] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Attach file"
          title="Attach file"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Choose a template" : pendingMedia ? "Add a caption" : "Type a message"}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-white px-4 py-2 text-sm outline-none transition focus:border-[#00A884] focus:ring-2 focus:ring-[#D9FDD3] disabled:cursor-not-allowed disabled:opacity-70"
        />
        <WhatsAppVoiceRecorder disabled={disabled} sending={sending} onSendVoice={onSendMedia} />
        <button
          type="submit"
          disabled={disabled || sending || (!text.trim() && !pendingMedia)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00A884] text-white transition hover:bg-[#008069] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

export default function ChatWindow({
  conversation,
  messages,
  loading,
  error,
  hasMore,
  onLoadOlder,
  messageSearch,
  onMessageSearchChange,
  onMessageSearch,
  replyTo,
  onReply,
  onClearReply,
  onClose,
  onSend,
  onSendMedia,
  onRetry,
  conversations = [],
  onForwardMessage,
  templates,
  templateDetail,
  setTemplateDetail,
  loadTemplates,
  loadTemplateDetail,
  sendTemplateReply,
  loadingTemplates,
  sending,
  eventState,
}) {
  const [showSearch, setShowSearch] = React.useState(false);
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const searchInputRef = React.useRef(null);

  React.useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  if (!conversation) {
    return (
      <section className="flex min-h-[520px] flex-1 items-center justify-center bg-[#F0F2F5]">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D9FDD3] text-2xl font-bold text-[#008069]">
            W
          </div>
          <h2 className="text-base font-bold text-black">Driver WhatsApp</h2>
          <p className="mt-2 text-sm text-blue-gray-600">Select a driver chat to open the conversation.</p>
        </div>
      </section>
    );
  }

  const sessionOpen = isSessionOpen(conversation);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-blue-gray-100 bg-[#F0F2F5] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DDE4E7] text-sm font-semibold text-blue-gray-800">
            {conversation.avatarUrl ? <img src={conversation.avatarUrl} alt="" className="h-full w-full object-cover" /> : getInitials(conversation.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-blue-gray-900">{conversation.name}</p>
            <p className="truncate text-[11px] text-blue-gray-700">{conversation.phoneNumber || "Driver"}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative hidden min-w-[220px] sm:block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-blue-gray-400" />
            <input
              ref={searchInputRef}
              value={messageSearch}
              onChange={(event) => onMessageSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onMessageSearch(messageSearch);
              }}
              placeholder="Search in chat"
              className="w-full rounded-lg border border-transparent bg-white px-3 py-2 pl-9 text-xs outline-none focus:border-[#00A884]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSearch((value) => !value)}
            className="rounded-lg bg-white p-2 text-blue-gray-500 transition hover:text-[#008069] sm:hidden"
            aria-label="Search messages"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-gray-600 hover:text-blue-gray-900">
            Close chat
          </button>
        </div>
      </header>
      {showSearch && (
        <div className="flex items-center gap-2 border-b border-blue-gray-100 bg-white px-4 py-2">
          <input
            value={messageSearch}
            onChange={(event) => onMessageSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onMessageSearch(messageSearch);
            }}
            placeholder="Search in conversation"
            className="min-w-0 flex-1 rounded-xl border border-blue-gray-100 px-3 py-2 text-sm outline-none focus:border-[#00A884]"
          />
          <button type="button" onClick={() => onMessageSearch(messageSearch)} className="rounded-xl bg-[#00A884] px-4 py-2 text-sm font-semibold text-white hover:bg-[#008069]">
            Search
          </button>
        </div>
      )}
      {error && <div className="bg-red-50 px-4 py-2 text-xs font-medium text-red-700">{error}</div>}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadOlder={onLoadOlder}
        onReply={onReply}
        onRetry={onRetry}
        searchQuery={messageSearch}
        forwardTargets={conversations}
        onForwardMessage={onForwardMessage}
      />
      <MessageInputBar
        disabled={!sessionOpen}
        sending={sending}
        replyTo={replyTo}
        onClearReply={onClearReply}
        onSend={onSend}
        onSendMedia={onSendMedia}
        onOpenTemplates={() => {
          setTemplateOpen(true);
          loadTemplates();
        }}
      />
      <TemplatePickerModal
        open={templateOpen}
        onClose={() => {
          setTemplateOpen(false);
          setTemplateDetail(null);
        }}
        templates={templates}
        templateDetail={templateDetail}
        loading={loadingTemplates}
        sending={sending}
        onSelectTemplate={loadTemplateDetail}
        onSend={async (payload) => {
          await sendTemplateReply(payload);
          setTemplateOpen(false);
          setTemplateDetail(null);
        }}
      />
    </section>
  );
}
