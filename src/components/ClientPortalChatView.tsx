import React, { useState, useEffect, useRef } from 'react';
import { Send, Mail, Check, CheckCheck, AlertCircle, ArrowLeft, Shield, Paperclip } from 'lucide-react';
import {
  fetchClientPortalData,
  sendClientPortalMessage,
  sendClientPortalPresence,
} from '../lib/api';
import { ClientMessageItem, ConversationItem } from '../data/zendoProposalsData';

interface ClientPortalProps {
  token: string;
  onBackToApp?: () => void;
}

export const ClientPortalChatView: React.FC<ClientPortalProps> = ({ token, onBackToApp }) => {
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ClientMessageItem[]>([]);
  const [agencyInfo, setAgencyInfo] = useState<{
    name: string;
    workspaceName: string;
    brandColor: string;
  }>({
    name: 'Alex Morgan',
    workspaceName: 'Zendo Studio',
    brandColor: '#1f7a4c',
  });
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load portal data and start heartbeat
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchClientPortalData(token);
        if (!mounted) return;
        setConversation(data.conversation);
        setMessages(data.messages || []);
        if (data.agency) {
          setAgencyInfo(data.agency);
        }
        setIsLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        setErrorMessage(err instanceof Error ? err.message : 'Portal not found');
        setIsLoading(false);
      }
    }

    void loadData();

    // Heartbeat every 45 seconds to let agency know client is active in portal
    const heartbeatTimer = setInterval(() => {
      void sendClientPortalPresence(token);
    }, 45000);

    // Refresh messages every 4 seconds for real-time syncing
    const refreshTimer = setInterval(() => {
      fetchClientPortalData(token)
        .then((data) => {
          if (mounted && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        })
        .catch(() => {});
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(heartbeatTimer);
      clearInterval(refreshTimer);
    };
  }, [token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    const text = replyText.trim();
    setIsSending(true);

    try {
      const res = await sendClientPortalMessage(
        token,
        text,
        conversation?.clientName || 'Client'
      );
      if (res && res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      setReplyText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfa] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1f7a4c] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Connecting to secure client portal...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !conversation) {
    return (
      <div className="min-h-screen bg-[#fafbfa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Private Portal Not Found</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            This private collaboration link may have expired or is unavailable. Please verify the URL or contact your agency project lead.
          </p>
          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Zendo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl sm:rounded-3xl border border-[#e2e9e4] shadow-md overflow-hidden flex flex-col h-[90vh] max-h-[840px]">
        {/* Header */}
        <header className="px-6 py-4 border-b border-[#e5ebe7] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
              style={{ backgroundColor: agencyInfo.brandColor || '#1f7a4c' }}
            >
              {agencyInfo.workspaceName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900">
                  {conversation?.clientCompany} Client Portal
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct channel with {agencyInfo.name} ({agencyInfo.workspaceName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Encrypted Portal</span>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAF9F6]">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No messages yet. Send a note to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isClient = msg.senderRole === 'client' || msg.senderType === 'client';
              const isEmail = msg.channel === 'email';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
                    <span className="font-semibold text-slate-700">{msg.senderName}</span>
                    <span>·</span>
                    <span>{msg.timeLabel || 'Recent'}</span>
                    {isEmail && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Mail className="w-2.5 h-2.5" />
                        via email
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isClient
                        ? 'bg-[#1f7a4c] text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-[#e2e8f0] rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.messageText}

                    {/* Attachments if any */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/20 flex flex-wrap gap-1.5">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-[11px] font-medium text-inherit transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delivery status indicator for outgoing client messages */}
                  {isClient && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                      {msg.deliveryStatus === 'delivered' ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span>Delivered</span>
                        </>
                      ) : msg.deliveryStatus === 'bounced' ? (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span className="text-rose-500">Failed to deliver</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Sent</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-[#e5ebe7] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Message ${agencyInfo.name} at ${agencyInfo.workspaceName}...`}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1f7a4c]"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || isSending}
            className="px-5 py-3 rounded-xl bg-[#1f7a4c] hover:bg-[#165a37] disabled:opacity-40 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Reply</span>
          </button>
        </form>
      </div>
    </div>
  );
};
