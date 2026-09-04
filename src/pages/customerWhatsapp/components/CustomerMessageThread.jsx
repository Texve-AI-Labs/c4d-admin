import React from "react";
import {
  ArrowDownIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const formatDateLabel = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const statusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "sending") return "...";
  if (normalized === "pending") return "pending";
  if (normalized === "failed") return "failed";
  if (normalized === "read") return "✓✓";
  if (normalized === "delivered") return "✓✓";
  if (normalized === "sent") return "✓";
  return normalized;
};

const getQuotedText = (quotedMessage) => {
  if (!quotedMessage) return "";
  if (typeof quotedMessage === "string") return quotedMessage;
  const text =
    quotedMessage.textBody ||
    quotedMessage.text ||
    quotedMessage.body ||
    quotedMessage.content ||
    quotedMessage.message ||
    quotedMessage.caption ||
    quotedMessage.preview ||
    quotedMessage.text?.body ||
    quotedMessage.text?.text ||
    quotedMessage.interactive?.body?.text ||
    quotedMessage.button?.text ||
    "";
  return typeof text === "object" ? text.body || text.text || "" : String(text || "");
};

export function CustomerMessageThread({
  conversation,
  messages,
  loading,
  messageText,
  chatSearch,
  replyTo,
  canSendText,
  showJumpLatest,
  messagesEndRef,
  messagesContainerRef,
  onCloseChat,
  onChatSearch,
  onLoadOlder,
  onScroll,
  onCopy,
  onReply,
  onCancelReply,
  onChangeMessage,
  onSend,
  onRetry,
  onOpenTemplates,
  onJumpLatest,
}) {
  if (!conversation) {
    return (
      <section className="grid h-full min-h-[520px] flex-1 place-items-center bg-[#f0f2f5]">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d9fdd3] text-2xl font-bold text-[#008069]">W</div>
          <h2 className="mt-4 text-lg font-semibold text-[#111b21]">Customer WhatsApp</h2>
          <p className="mt-1 text-sm text-[#667781]">Select a customer chat to open the conversation.</p>
        </div>
      </section>
    );
  }

  let lastDate = "";

  return (
    <section className="relative flex h-full min-h-[520px] min-w-0 flex-1 flex-col bg-[#efeae2]">
      <header className="flex items-center justify-between gap-3 border-b border-[#d9e1dd] bg-[#f0f2f5] px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[#111b21]">{conversation.name || conversation.phone}</h2>
          <p className="truncate text-xs text-[#667781]">{conversation.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg bg-white px-3 py-2 md:flex">
            <MagnifyingGlassIcon className="h-4 w-4 text-[#667781]" />
            <input
              value={chatSearch}
              onChange={(event) => onChatSearch(event.target.value)}
              placeholder="Search in chat"
              className="w-44 bg-transparent text-sm outline-none"
            />
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-sm hover:bg-red-100"
            onClick={onCloseChat}
            title="Close chat"
            aria-label="Close chat"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage:
            "radial-gradient(circle at 20px 20px, rgba(17,27,33,0.05) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      >
        <div className="mb-3 flex justify-center">
          <button className="rounded-full bg-white/90 px-3 py-1 text-xs text-[#54656f] shadow-sm" onClick={onLoadOlder}>
            Load older messages
          </button>
        </div>
        {loading && messages.length === 0 ? (
          <p className="text-center text-sm text-[#667781]">Loading messages...</p>
        ) : (
          messages.map((message) => {
            const currentDate = formatDateLabel(message.sentAt);
            const showDate = currentDate && currentDate !== lastDate;
            lastDate = currentDate || lastDate;
            const outbound = message.direction === "outbound";
            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-lg bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#54656f] shadow-sm">
                      {currentDate}
                    </span>
                  </div>
                )}
                <div className={`mb-2 flex ${outbound ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-lg px-3 py-2 shadow-sm ${outbound ? "bg-[#d9fdd3]" : "bg-white"}`}>
                    {message.quotedMessage && (
                      <div className="mb-2 border-l-4 border-[#00a884] bg-black/5 px-2 py-1 text-xs text-[#54656f]">
                        {getQuotedText(message.quotedMessage) || "Original message unavailable"}
                      </div>
                    )}
                    {message.templateName && <p className="mb-1 text-[11px] font-semibold text-[#008069]">{message.templateName}</p>}
                    {message.templateHeaderMediaUrl && (
                      <img src={message.templateHeaderMediaUrl} alt="" className="mb-2 max-h-44 rounded object-cover" />
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[#111b21]">{message.text || `[${message.type}]`}</p>
                    {message.errorMessage && <p className="mt-1 text-xs text-red-600">{message.errorMessage}</p>}
                    <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-[#667781]">
                      <button type="button" onClick={() => onCopy(message)} title="Copy message">
                        <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => onReply(message)} className="font-semibold text-[#008069]">
                        Reply
                      </button>
                      {message.providerStatus === "failed" && (
                        <button type="button" onClick={() => onRetry(message)} className="font-semibold text-red-600">
                          Retry
                        </button>
                      )}
                      <span>{formatTime(message.sentAt)}</span>
                      {outbound && <span className={String(message.providerStatus).toLowerCase() === "read" ? "text-blue-500" : ""}>{statusLabel(message.providerStatus)}</span>}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {showJumpLatest && (
        <button
          type="button"
          onClick={onJumpLatest}
          className="absolute bottom-24 right-5 grid h-10 w-10 place-items-center rounded-full bg-white text-[#54656f] shadow"
          title="Jump to latest"
        >
          <ArrowDownIcon className="h-5 w-5" />
        </button>
      )}

      <footer className="border-t border-[#d9e1dd] bg-[#f0f2f5] px-4 py-3">
        {!canSendText && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <span>24-hour session expired. You can only send template messages.</span>
            <button type="button" onClick={onOpenTemplates} className="rounded bg-[#00a884] px-3 py-1 font-semibold text-white">
              Use Template
            </button>
          </div>
        )}
        {replyTo && (
          <div className="mb-2 flex items-start justify-between gap-2 rounded bg-white px-3 py-2">
            <div className="min-w-0 border-l-4 border-[#00a884] pl-2">
              <p className="text-xs font-semibold text-[#008069]">Replying to message</p>
              <p className="truncate text-sm text-[#54656f]">{replyTo.text}</p>
              {!replyTo.metaMessageId && (
                <p className="text-xs text-amber-700">Original WhatsApp message id unavailable. This will send as a normal message.</p>
              )}
            </div>
            <button type="button" onClick={onCancelReply}>
              <XMarkIcon className="h-5 w-5 text-[#54656f]" />
            </button>
          </div>
        )}
        <form onSubmit={onSend} className="flex items-center gap-2">
          <button type="button" onClick={onOpenTemplates} className="rounded bg-white px-3 py-2 text-sm font-semibold text-[#008069]">
            Use Template
          </button>
          <input
            value={messageText}
            onChange={(event) => onChangeMessage(event.target.value)}
            disabled={!canSendText}
            placeholder={canSendText ? "Type a message" : "Session expired"}
            className="min-w-0 flex-1 rounded-lg bg-white px-4 py-2 text-sm outline-none disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!canSendText || !messageText.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#00a884] text-white disabled:opacity-50"
            title="Send"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </footer>
    </section>
  );
}

export default CustomerMessageThread;
