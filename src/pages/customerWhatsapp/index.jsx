import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CustomerChatList from "./components/CustomerChatList";
import CustomerMessageThread from "./components/CustomerMessageThread";
import TemplatePicker from "./components/TemplatePicker";
import { customerWhatsappApi, getWhatsappToken, normalizeMessage } from "./customerWhatsappApi";

const CONVERSATION_LIMIT = 20;
const MESSAGE_LIMIT = 50;

const friendlyError = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || error?.message || "").toLowerCase();
  if (status === 401 || status === 403 || message.includes("unauthorized") || message.includes("token")) {
    return "Please login again.";
  }
  if (message.includes("24") || message.includes("session")) {
    return "Session expired. Please send a template message.";
  }
  return "Unable to complete the action. Please try again.";
};

export default function CustomerWhatsappPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [search, setSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateValues, setTemplateValues] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false);
  const [templateDetailError, setTemplateDetailError] = useState("");
  const [templateLanguageCode, setTemplateLanguageCode] = useState("");
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [sseFailures, setSseFailures] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const abortRef = useRef(null);
  const selectedIdRef = useRef("");
  const searchRef = useRef("");
  const pageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const token = getWhatsappToken();

  const activeMessages = useMemo(
    () => messagesByConversation[selectedConversation?.id] || [],
    [messagesByConversation, selectedConversation?.id]
  );

  const canSendText = selectedConversation?.isSessionWindowOpen !== false;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
  }, []);

  const loadConversations = useCallback(async ({ silent = false, nextPage = pageRef.current, nextSearch = searchRef.current } = {}) => {
    if (!silent) setLoadingChats(true);
    try {
      const requestedPage = Math.max(1, Number(nextPage) || 1);
      const response = await customerWhatsappApi.loadConversations({
        search: nextSearch,
        page: requestedPage,
        limit: CONVERSATION_LIMIT,
      });
      setConversations(response.items);
      const nextTotalPages = Math.max(1, Number(response.pagination?.totalPages || response.pagination?.total_pages || 1) || 1);
      const responsePage = Math.min(nextTotalPages, Math.max(1, Number(response.pagination?.page || requestedPage) || requestedPage));
      setTotalPages(nextTotalPages);
      totalPagesRef.current = nextTotalPages;
      pageRef.current = responsePage;
      setPage(responsePage);
      setError("");
    } catch (err) {
      if (!silent) setError(friendlyError(err));
    } finally {
      if (!silent) setLoadingChats(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, { silent = false, searchText = chatSearch, nextPage = 1, appendOlder = false } = {}) => {
    if (!conversationId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const response = await customerWhatsappApi.loadMessages(conversationId, {
        page: nextPage,
        limit: MESSAGE_LIMIT,
        search: searchText,
      });
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: appendOlder ? [...response.items, ...(prev[conversationId] || [])] : response.items,
      }));
      setError("");
      if (!appendOlder) scrollToBottom();
    } catch (err) {
      if (!silent) setError(friendlyError(err));
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [chatSearch, scrollToBottom]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      pageRef.current = 1;
      searchRef.current = search;
      loadConversations({ nextPage: 1, nextSearch: search });
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, loadConversations]);

  useEffect(() => {
    selectedIdRef.current = selectedConversation?.id || "";
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    const timeout = setTimeout(() => {
      setMessagePage(1);
      loadMessages(selectedConversation.id, { searchText: chatSearch, nextPage: 1 });
    }, 300);
    return () => clearTimeout(timeout);
  }, [chatSearch, selectedConversation?.id, loadMessages]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setReplyTo(null);
    setChatSearch("");
    setMessagePage(1);
    await loadMessages(conversation.id, { searchText: "", nextPage: 1 });
    try {
      await customerWhatsappApi.markRead(conversation.id);
      setConversations((prev) => prev.map((item) => item.id === conversation.id ? { ...item, unread: 0 } : item));
    } catch {
      // Opening the chat should still succeed even if mark-read fails.
    }
  };

  const reloadActiveSilently = useCallback(() => {
    const activeId = selectedIdRef.current;
    loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
    if (activeId) loadMessages(activeId, { silent: true, searchText: "", nextPage: 1 });
  }, [loadConversations, loadMessages]);

  useEffect(() => {
    if (!token || sseFailures >= 3) return undefined;
    let cancelled = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const connect = async () => {
      try {
        const response = await fetch(customerWhatsappApi.getEventsUrl(), {
          headers: { ...customerWhatsappApi.authHeaders(), Accept: "text/event-stream" },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error("SSE failed");
        setSseFailures(0);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          events.forEach((eventText) => {
            const eventName = eventText.split("\n").find((line) => line.startsWith("event:"))?.replace("event:", "").trim();
            const dataLine = eventText.split("\n").find((line) => line.startsWith("data:"));
            let data = {};
            try {
              data = dataLine ? JSON.parse(dataLine.replace("data:", "").trim()) : {};
            } catch {
              data = {};
            }
            if (["connected", "message_new"].includes(eventName)) {
              reloadActiveSilently();
            }
            if (eventName === "message_status") {
              const messageId = data.messageId || data.message_id || data.metaMessageId || data.meta_message_id;
              const status = data.status || data.providerStatus || data.provider_status;
              const conversationId = String(data.conversationId || data.conversation_id || data.threadId || data.thread_id || "");
              setMessagesByConversation((prev) => {
                const activeId = selectedIdRef.current;
                const rows = prev[activeId] || [];
                return {
                  ...prev,
                  [activeId]: rows.map((message) =>
                    [message.id, message.metaMessageId].includes(String(messageId)) ? { ...message, providerStatus: status } : message
                  ),
                };
              });
              if (conversationId && status) {
                setConversations((prev) =>
                  prev.map((conversation) =>
                    conversation.id === conversationId ? { ...conversation, lastStatus: status, isLastOutbound: true } : conversation
                  )
                );
              }
              loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
            }
          });
        }
      } catch {
        if (!cancelled) setSseFailures((count) => count + 1);
      }
    };

    connect();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, sseFailures, reloadActiveSilently, loadConversations]);

  useEffect(() => {
    if (!token || sseFailures < 3) return undefined;
    const refreshChats = setInterval(() => {
      if (!document.hidden) {
        loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
      }
    }, 10000);
    const refreshMessages = setInterval(() => {
      if (!document.hidden && selectedIdRef.current) loadMessages(selectedIdRef.current, { silent: true, searchText: "", nextPage: 1 });
    }, 4000);
    return () => {
      clearInterval(refreshChats);
      clearInterval(refreshMessages);
    };
  }, [token, sseFailures, loadConversations, loadMessages]);

  const handleThreadPageChange = (targetPage) => {
    const nextPage = Math.min(totalPagesRef.current, Math.max(1, Number(targetPage) || 1));
    if (nextPage === pageRef.current || loadingChats) return;

    pageRef.current = nextPage;
    setPage(nextPage);
    loadConversations({ nextPage, nextSearch: searchRef.current });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedConversation || !messageText.trim()) return;
    if (!canSendText) {
      setError("Session expired. Please send a template message.");
      return;
    }
    const text = messageText.trim();
    const localId = `local-${Date.now()}`;
    const optimistic = normalizeMessage({
      id: localId,
      text,
      direction: "outbound",
      status: "sending",
      created_at: new Date().toISOString(),
      quotedMessage: replyTo ? { text: replyTo.text } : null,
    });
    setMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), optimistic],
    }));
    setMessageText("");
    setReplyTo(null);
    scrollToBottom();
    try {
      await customerWhatsappApi.sendReply(selectedConversation.id, text, replyTo?.metaMessageId || "");
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation.id]: (prev[selectedConversation.id] || []).filter((message) => message.id !== localId),
      }));
      await loadMessages(selectedConversation.id, { silent: true, searchText: "", nextPage: 1 });
      await loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
    } catch (err) {
      setError(friendlyError(err));
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation.id]: (prev[selectedConversation.id] || []).map((message) =>
          message.id === localId ? { ...message, providerStatus: "failed", errorMessage: friendlyError(err) } : message
        ),
      }));
    }
  };

  const handleRetry = (message) => {
    setMessageText(message.text);
    setReplyTo(null);
  };

  const resetTemplateState = () => {
    setTemplatesError("");
    setSelectedTemplateId(null);
    setSelectedTemplate(null);
    setTemplateValues([]);
    setTemplateDetailLoading(false);
    setTemplateDetailError("");
    setTemplateLanguageCode("");
  };

  const closeTemplatePicker = () => {
    setTemplateOpen(false);
    setTemplates([]);
    setTemplatesLoading(false);
    setTemplateSubmitting(false);
    resetTemplateState();
  };

  const openTemplates = async () => {
    if (!selectedConversation?.id) return;
    setTemplateOpen(true);
    setTemplatesLoading(true);
    resetTemplateState();
    try {
      const items = await customerWhatsappApi.loadTemplates(selectedConversation.id);
      setTemplates(items);
    } catch (err) {
      setTemplatesError(friendlyError(err));
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const selectTemplate = async (templateId) => {
    if (!templateId) return;
    setSelectedTemplateId(String(templateId));
    setSelectedTemplate(null);
    setTemplateValues([]);
    setTemplateDetailLoading(true);
    setTemplateDetailError("");
    try {
      const template = await customerWhatsappApi.loadTemplateDetails(templateId);
      setSelectedTemplate(template);
      setTemplateValues(Array.from({ length: template.variables.length }, () => ""));
      setTemplateLanguageCode(template.languageCode || "");
    } catch (err) {
      setTemplateDetailError(friendlyError(err));
    } finally {
      setTemplateDetailLoading(false);
    }
  };

  const sendTemplate = async () => {
    if (!selectedConversation?.id || !selectedTemplateId) return;
    setTemplateSubmitting(true);
    try {
      const payload = {
        templateId: selectedTemplateId,
      };
      if (templateValues.length > 0) {
        payload.bodyParameters = templateValues;
      }
      if (templateLanguageCode) {
        payload.languageCode = templateLanguageCode;
      }
      await customerWhatsappApi.sendTemplate(selectedConversation.id, payload);
      closeTemplatePicker();
      await loadMessages(selectedConversation.id, { silent: true, searchText: "", nextPage: 1 });
      await loadConversations({ silent: true, nextPage: pageRef.current, nextSearch: searchRef.current });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const loadOlder = () => {
    if (!selectedConversation?.id) return;
    const next = messagePage + 1;
    setMessagePage(next);
    loadMessages(selectedConversation.id, { nextPage: next, appendOlder: true });
  };

  return (
    <div className="flex h-[calc(100vh-155px)] min-h-[620px] overflow-hidden rounded-lg border border-[#d9e1dd] bg-white shadow-sm">
      <CustomerChatList
        conversations={conversations}
        selectedId={selectedConversation?.id}
        search={search}
        loading={loadingChats}
        page={page}
        totalPages={totalPages}
        onSearch={setSearch}
        onSelect={handleSelectConversation}
        onPageChange={handleThreadPageChange}
      />
      <CustomerMessageThread
        conversation={selectedConversation}
        messages={activeMessages}
        loading={loadingMessages}
        messageText={messageText}
        chatSearch={chatSearch}
        replyTo={replyTo}
        canSendText={canSendText}
        showJumpLatest={showJumpLatest}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        onCloseChat={() => setSelectedConversation(null)}
        onChatSearch={setChatSearch}
        onLoadOlder={loadOlder}
        onScroll={() => {
          const el = messagesContainerRef.current;
          if (!el) return;
          setShowJumpLatest(el.scrollHeight - el.scrollTop - el.clientHeight > 180);
        }}
        onCopy={(message) => navigator.clipboard?.writeText(message.text || "")}
        onReply={setReplyTo}
        onCancelReply={() => setReplyTo(null)}
        onChangeMessage={setMessageText}
        onSend={handleSend}
        onRetry={handleRetry}
        onOpenTemplates={openTemplates}
        onJumpLatest={scrollToBottom}
      />
      {error && (
        <div className="fixed bottom-5 right-5 z-[80] rounded bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {error}
          <button className="ml-3 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      <TemplatePicker
        open={templateOpen}
        templates={templates}
        selectedTemplate={selectedTemplate}
        selectedTemplateId={selectedTemplateId}
        loading={templatesLoading}
        detailLoading={templateDetailLoading}
        submitting={templateSubmitting}
        templatesError={templatesError}
        detailError={templateDetailError}
        values={templateValues}
        onClose={closeTemplatePicker}
        onSelectTemplate={selectTemplate}
        onValueChange={(index, value) => {
          setTemplateValues((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
          });
        }}
        onSend={sendTemplate}
      />
    </div>
  );
}
