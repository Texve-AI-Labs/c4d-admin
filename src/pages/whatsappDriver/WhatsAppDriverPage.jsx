import React from "react";
import ConversationList from "./components/ConversationList";
import ChatWindow from "./components/ChatWindow";
import { useWhatsAppDriver } from "./hooks/useWhatsAppDriver";
import WhatsAppFullscreenButton from "@/components/whatsapp/WhatsAppFullscreenButton";

export default function WhatsAppDriverPage() {
  const whatsappShellRef = React.useRef(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const whatsapp = useWhatsAppDriver();
  const liveText = whatsapp.eventState.live
    ? "Live"
    : whatsapp.eventState.reconnecting
    ? "Reconnecting"
    : "Offline";

  return (
    <div ref={whatsappShellRef} className={`relative flex flex-col overflow-hidden rounded-xl border border-blue-gray-100 bg-white shadow-sm ${isExpanded ? "fixed inset-0 z-[9999] h-screen w-screen" : "h-[calc(100vh-150px)] min-h-[620px] w-full"}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-blue-gray-100 bg-[#F0F2F5] px-3 py-2">
        <p className="text-sm font-semibold text-blue-gray-900">Driver WhatsApp</p>
        <WhatsAppFullscreenButton containerRef={whatsappShellRef} expanded={isExpanded} onExpandedChange={setIsExpanded} />
      </div>
      <div className="sr-only" aria-live="polite">
        Driver WhatsApp stream is {liveText}
      </div>
      <div className="flex h-full min-h-0 flex-1 flex-col md:flex-row">
        <ConversationList
          conversations={whatsapp.conversations}
          selectedConversationId={whatsapp.selectedConversationId}
          search={whatsapp.search}
          onSearchChange={whatsapp.setSearch}
          audienceType={whatsapp.audienceType}
          page={whatsapp.conversationPage}
          onSelect={whatsapp.openConversation}
          onLoadMore={whatsapp.loadMoreConversations}
          onLoadPrevious={whatsapp.loadPreviousConversations}
          onLoadFirst={whatsapp.loadFirstConversations}
          hasMore={whatsapp.hasMoreConversations}
          loading={whatsapp.loadingConversations}
          error={whatsapp.conversationError}
        />
        <ChatWindow
          conversation={whatsapp.selectedConversation}
          messages={whatsapp.messages}
          loading={whatsapp.loadingMessages}
          error={whatsapp.messageError}
          hasMore={whatsapp.hasMoreMessages}
          onLoadOlder={whatsapp.loadOlderMessages}
          messageSearch={whatsapp.messageSearch}
          onMessageSearchChange={whatsapp.setMessageSearch}
          onMessageSearch={whatsapp.searchMessages}
          replyTo={whatsapp.replyTo}
          onReply={whatsapp.setReplyTo}
          onClearReply={() => whatsapp.setReplyTo(null)}
          onClose={whatsapp.closeConversation}
          onSend={whatsapp.sendReply}
          onSendMedia={whatsapp.sendMediaReply}
          onRetry={whatsapp.retryMessage}
          conversations={whatsapp.conversations}
          onForwardMessage={whatsapp.forwardMessage}
          templates={whatsapp.templates}
          templateDetail={whatsapp.templateDetail}
          setTemplateDetail={whatsapp.setTemplateDetail}
          loadTemplates={whatsapp.loadTemplates}
          loadTemplateDetail={whatsapp.loadTemplateDetail}
          sendTemplateReply={whatsapp.sendTemplateReply}
          loadingTemplates={whatsapp.loadingTemplates}
          sending={whatsapp.sending}
          eventState={whatsapp.eventState}
        />
      </div>
    </div>
  );
}
