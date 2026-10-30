import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { formatChatTime, getInitials } from "../utils/whatsappUtils";

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-11 w-11 animate-pulse rounded-full bg-blue-gray-100" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-2/5 animate-pulse rounded bg-blue-gray-100" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-blue-gray-50" />
      </div>
    </div>
  );
}

function ConversationListItem({ conversation, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`flex w-full items-center gap-3 border-b border-blue-gray-50 px-4 py-3 text-left transition ${
        active ? "bg-[#E7FCE3]" : "bg-white hover:bg-[#F5FBF8]"
      }`}
      aria-current={active ? "true" : undefined}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D9FDD3] text-sm font-semibold text-[#008069]">
        {conversation.avatarUrl ? (
          <img src={conversation.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          getInitials(conversation.name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-blue-gray-900">{conversation.name}</p>
          <span className="shrink-0 text-[11px] text-blue-gray-400">{formatChatTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-blue-gray-500">{conversation.lastMessage || conversation.phoneNumber || "No messages yet"}</p>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#00A884] px-1.5 text-[11px] font-bold text-white">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  search,
  onSearchChange,
  audienceType,
  page,
  onSelect,
  onLoadMore,
  onLoadPrevious,
  onLoadFirst,
  hasMore,
  loading,
  error,
}) {
  const listRef = React.useRef(null);

  const handleScroll = () => {
    const element = listRef.current;
    if (!element || loading || !hasMore) return;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 80) {
      onLoadMore();
    }
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col border-r border-blue-gray-200 bg-white md:max-w-[325px]">
      <div className="border-b border-blue-gray-100 bg-[#F0F2F5] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-sm font-bold text-white">
            W
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight text-blue-gray-900">Chats</h1>
            <p className="text-xs text-blue-gray-700">
              {audienceType === "DRIVER" ? "Drivers only" : "Driver conversations"}
            </p>
          </div>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-blue-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search driver name or phone"
            className="w-full rounded-lg border border-transparent bg-white px-4 py-2 pl-9 text-sm outline-none transition focus:border-[#00A884] focus:ring-2 focus:ring-[#D9FDD3]"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {error && <div className="m-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</div>}

      <div ref={listRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Driver conversations">
        {loading && conversations.length === 0
          ? Array.from({ length: 8 }).map((_, index) => <ConversationSkeleton key={index} />)
          : conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === selectedConversationId}
                onSelect={onSelect}
              />
            ))}
        {!loading && conversations.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-blue-gray-500">No conversations found</div>
        )}
        {loading && conversations.length > 0 && <ConversationSkeleton />}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-blue-gray-100 bg-white px-3 py-2">
        <button
          type="button"
          onClick={onLoadFirst}
          disabled={loading || page <= 1}
          className="rounded border border-blue-gray-100 px-3 py-1 text-xs text-blue-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          First
        </button>
        <button
          type="button"
          onClick={onLoadPrevious}
          disabled={loading || page <= 1}
          className="rounded border border-blue-gray-100 px-3 py-1 text-xs text-blue-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="shrink-0 text-xs font-semibold text-blue-gray-800">Page {page || 1}</span>
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading || !hasMore}
          className="rounded border border-blue-gray-100 px-3 py-1 text-xs text-blue-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
