import React from "react";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const DeliveryMark = ({ status }) => {
  if (!status) return null;
  const normalized = String(status).toLowerCase();

  if (normalized === "pending" || normalized === "sending") {
    return <span className="w-5 text-xs font-semibold text-gray-400">...</span>;
  }

  if (normalized === "failed") {
    return <span className="w-5 text-xs font-bold text-red-500">!</span>;
  }

  const color = normalized === "read" ? "text-blue-500" : "text-gray-400";
  const showDouble = normalized === "read" || normalized === "delivered";

  return (
    <span className={`inline-flex w-5 items-center ${color}`}>
      <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
      {showDouble && <CheckIcon className="-ml-2 h-3.5 w-3.5 stroke-[3]" />}
    </span>
  );
};

export function CustomerChatList({
  conversations,
  selectedId,
  search,
  loading,
  page,
  totalPages,
  onSearch,
  onSelect,
  onPageChange,
}) {
  const normalizedTotalPages = Number(totalPages) || 1;
  const isFirstPage = page <= 1;
  const isLastPage = page >= normalizedTotalPages;
  const paginationButtonClass = "rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-[#d9e1dd] bg-white md:w-[360px]">
      <div className="border-b border-[#d9e1dd] bg-[#f0f2f5] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#25d366] text-lg font-bold text-white">W</span>
          <div>
            <h2 className="text-lg font-semibold text-[#111b21]">Chats</h2>
            <p className="text-xs font-medium text-[#54656f]">Customers only</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2">
          <MagnifyingGlassIcon className="h-4 w-4 text-[#667781]" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search customer name or phone"
            className="w-full bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-4 text-sm text-[#667781]">Loading chats...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-[#667781]">No customer chats found.</div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation)}
              className={`flex w-full gap-3 border-b border-[#eef1ef] px-4 py-3 text-left hover:bg-[#f5f6f6] ${
                selectedId === conversation.id ? "bg-[#e9edef]" : "bg-white"
              }`}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#dfe5e7] text-sm font-semibold text-[#3b4a54]">
                {(conversation.name || conversation.phone || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[#111b21]">{conversation.name || conversation.phone}</p>
                  <span className="shrink-0 text-[11px] text-[#667781]">{formatTime(conversation.lastTime)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {conversation.isLastOutbound && <DeliveryMark status={conversation.lastStatus} />}
                  <p className="min-w-0 flex-1 truncate text-xs text-[#667781]">{conversation.lastMessage || conversation.phone}</p>
                  {conversation.unread > 0 && (
                    <span className="grid min-w-[20px] place-items-center rounded-full bg-[#25d366] px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#d9e1dd] bg-white px-3 py-2 text-xs">
        <button className={paginationButtonClass} disabled={isFirstPage || loading} onClick={() => onPageChange(1)}>First</button>
        <button className={paginationButtonClass} disabled={isFirstPage || loading} onClick={() => onPageChange(page - 1)}>Previous</button>
        <span className="font-semibold text-[#3b4a54]">
          Page {page} of {normalizedTotalPages}
        </span>
        <button className={paginationButtonClass} disabled={isLastPage || loading} onClick={() => onPageChange(page + 1)}>Next</button>
        <button className={paginationButtonClass} disabled={isLastPage || loading} onClick={() => onPageChange(normalizedTotalPages)}>Last</button>
      </div>
    </aside>
  );
}

export default CustomerChatList;
