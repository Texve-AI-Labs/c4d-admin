import React from "react";
import ConversationList from "./components/ConversationList";
import ChatWindow from "./components/ChatWindow";
import { useWhatsAppDriver } from "./hooks/useWhatsAppDriver";

export default function WhatsAppDriverPage() {
  const whatsapp = useWhatsAppDriver();
  const liveText = whatsapp.eventState.live
    ? "Live"
    : whatsapp.eventState.reconnecting
    ? "Reconnecting"
    : "Offline";

  return (
    <div className="h-[calc(100vh-150px)] min-h-[620px] overflow-hidden rounded-xl border border-blue-gray-100 bg-white shadow-sm">
      <div className="sr-only" aria-live="polite">
        WhatsApp Driver stream is {liveText}
      </div>
      <div className="flex h-full min-h-0 flex-col md:flex-row">
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
