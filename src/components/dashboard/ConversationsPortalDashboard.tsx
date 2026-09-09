'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LuMessagesSquare,
  LuMessageCircle,
  LuClock,
  LuCircleCheck,
  LuCircleAlert,
  LuBot,
  LuUser,
  LuSearch,
  LuFilter,
  LuRotateCcw,
  LuList,
  LuColumns2,
  LuEllipsis,
  LuSend,
  LuSparkles,
  LuPhone,
  LuCalendar,
  LuExternalLink,
  LuShieldCheck,
  LuPower,
  LuX,
  LuCircleX,
  LuCheck,
  LuCheckCheck,
  LuMail,
  LuMailOpen,
  LuTrash2,
  LuMousePointerClick,
} from 'react-icons/lu';
import { FaUserDoctor } from 'react-icons/fa6';

export interface MessageItem {
  id: string;
  sender: 'PATIENT' | 'AI' | 'HUMAN' | 'SYSTEM';
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  toolCalls?: any;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  email?: string | null;
  fileNumber?: number | null;
  status: 'ACTIVE' | 'ESCALATED' | 'CLOSED';
  lastMessageAt: string;
  lastMessagePreview?: string | null;
  escalationReason?: string | null;
  aiEnabled: boolean;
  messageCount: number;
  unreadCount?: number;
  messages: MessageItem[];
}

export interface ConversationsPortalDashboardProps {
  clinicName?: string;
  timezone?: string;
  initialConversations?: ConversationItem[];
  defaultSelectedId?: string;
}

/** Helper to parse button click reply strings like [Button Click: 🇬🇧 English | ID: select_language:en] */
function parseButtonClick(body: string): { isButton: boolean; title: string; id?: string } {
  if (!body) return { isButton: false, title: '' };
  const match = body.match(/\[Button Click:\s*([\s\S]*?)\s*\|\s*(?:ID|Payload):\s*([\s\S]*?)\]/i);
  if (match) {
    return { isButton: true, title: match[1]?.trim() || 'Option', id: match[2]?.trim() };
  }
  const simpleMatch = body.match(/\[Button Click:\s*([\s\S]*?)\]/i);
  if (simpleMatch) {
    return { isButton: true, title: simpleMatch[1]?.trim() || 'Option' };
  }
  return { isButton: false, title: body };
}

/** Helper to extract or infer interactive quick-reply buttons on outbound messages */
function getMessageButtons(msg: MessageItem): Array<{ id: string; title: string }> {
  // 1. From database toolCalls payload
  if (msg.toolCalls && typeof msg.toolCalls === 'object') {
    const tc = msg.toolCalls as any;
    if (Array.isArray(tc.buttons) && tc.buttons.length > 0) {
      return tc.buttons;
    }
    if (tc.args && Array.isArray(tc.args.buttons) && tc.args.buttons.length > 0) {
      return tc.args.buttons;
    }
  }

  // 2. Infer buttons if standard prompt text is present
  const body = msg.body || '';
  if (
    body.includes('يرجى اختيار لغتك المفضلة للمتابعة') ||
    body.includes('Please select your preferred language to continue') ||
    body.includes('select your preferred language')
  ) {
    return [
      { id: 'select_language:en', title: '🇬🇧 English' },
      { id: 'select_language:ar', title: '🇸🇦 العربية' },
    ];
  }

  if (
    body.includes('هل قمت بزيارتنا من قبل') ||
    body.includes('Have you visited') ||
    body.includes('هل زرت العيادة من قبل')
  ) {
    return [
      { id: 'visited_before:yes', title: 'نعم، مريض سابق' },
      { id: 'visited_before:no', title: 'لا، أول زيارة' },
    ];
  }

  return [];
}

/** Format last message preview for the left list */
function formatPreviewText(rawPreview?: string | null): string {
  if (!rawPreview) return 'No messages yet';
  const btn = parseButtonClick(rawPreview);
  if (btn.isButton) {
    return `🔘 ${btn.title}`;
  }
  return rawPreview;
}

export function ConversationsPortalDashboard({
  clinicName = 'Clinic',
  timezone = 'Asia/Riyadh',
  initialConversations = [],
  defaultSelectedId,
}: ConversationsPortalDashboardProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    defaultSelectedId || (initialConversations && initialConversations.length > 0 ? initialConversations[0]?.id ?? null : null)
  );

  // Sync with server if initialConversations updates
  useEffect(() => {
    if (initialConversations && initialConversations.length > 0) {
      setConversations(initialConversations);
      if (!selectedConversationId && initialConversations[0]) {
        setSelectedConversationId(initialConversations[0].id);
      }
    }
  }, [initialConversations]);

  // Toolbar & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAiFilter, setSelectedAiFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');

  // Action Menu State
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Reply Composer State
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Mark conversation as read in DB and update local state
  const markConversationAsRead = useCallback(async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread: false }),
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            unreadCount: 0,
            messages: c.messages.map((m) =>
              m.direction === 'INBOUND' && m.status !== 'READ' ? { ...m, status: 'READ' } : m
            ),
          };
        })
      );

      window.dispatchEvent(new CustomEvent('inbox-updated'));
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, []);

  // Mark conversation as unread in DB and update local state
  const markConversationAsUnread = useCallback(async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread: true }),
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            unreadCount: Math.max(1, (c.unreadCount || 0) + 1),
          };
        })
      );

      window.dispatchEvent(new CustomEvent('inbox-updated'));
    } catch (err) {
      console.error('Failed to mark conversation as unread:', err);
    }
  }, []);

  // Auto-mark conversation as read when selected
  useEffect(() => {
    if (!selectedConversationId) return;
    const current = conversations.find((c) => c.id === selectedConversationId);
    if (current && (current.unreadCount ?? 0) > 0) {
      markConversationAsRead(selectedConversationId);
    }
  }, [selectedConversationId, conversations, markConversationAsRead]);

  // Active Filters Count
  const activeFiltersCount =
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (selectedAiFilter !== 'ALL' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedStatus('ALL');
    setSelectedAiFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      // 1. Status Filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }
      // 2. AI Filter
      if (selectedAiFilter === 'AI_ON' && !item.aiEnabled) {
        return false;
      }
      if (selectedAiFilter === 'AI_OFF' && item.aiEnabled) {
        return false;
      }
      // 3. Start Date Filter
      if (startDate) {
        const itemDateStr = item.lastMessageAt ? item.lastMessageAt.slice(0, 10) : '';
        if (itemDateStr && itemDateStr < startDate) {
          return false;
        }
      }
      // 4. End Date Filter
      if (endDate) {
        const itemDateStr = item.lastMessageAt ? item.lastMessageAt.slice(0, 10) : '';
        if (itemDateStr && itemDateStr > endDate) {
          return false;
        }
      }
      // 5. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesPhone = item.phone.toLowerCase().includes(q);
        const matchesPreview = item.lastMessagePreview
          ? item.lastMessagePreview.toLowerCase().includes(q)
          : false;
        const matchesFile = item.fileNumber?.toString().includes(q);
        if (!matchesName && !matchesPhone && !matchesPreview && !matchesFile) {
          return false;
        }
      }
      return true;
    });
  }, [conversations, selectedStatus, selectedAiFilter, startDate, endDate, searchQuery]);

  // Active Selected Conversation
  const selectedConversation = useMemo(() => {
    return (
      conversations.find((c) => c.id === selectedConversationId) ||
      (filteredConversations.length > 0 ? filteredConversations[0] : null)
    );
  }, [conversations, selectedConversationId, filteredConversations]);

  // Reactive Stat Counts
  const totalConversationsCount = conversations.length;
  const activeCount = conversations.filter((c) => c.status === 'ACTIVE').length;
  const escalatedCount = conversations.filter((c) => c.status === 'ESCALATED').length;
  const closedCount = conversations.filter((c) => c.status === 'CLOSED').length;

  // Status Badge Helper
  const getStatusBadge = (status: ConversationItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Escalated (Human)
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="size-1.5 rounded-full bg-slate-400" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  // WhatsApp Seen / Delivery Status Tick Helper
  const renderMessageStatusTick = (status?: MessageItem['status']) => {
    switch (status) {
      case 'READ':
        return (
          <LuCheckCheck
            className="size-3.5 text-[#38bdf8] dark:text-[#38bdf8] shrink-0 inline stroke-[2.5]"
            title="Seen / Read (Double Blue Check)"
          />
        );
      case 'DELIVERED':
        return (
          <LuCheckCheck
            className="size-3.5 text-slate-300 dark:text-slate-400 shrink-0 inline stroke-[2]"
            title="Delivered (Double Grey Check)"
          />
        );
      case 'SENT':
        return (
          <LuCheck
            className="size-3 text-slate-300 dark:text-slate-400 shrink-0 inline stroke-[2]"
            title="Sent (Single Grey Check)"
          />
        );
      case 'PENDING':
        return (
          <LuClock
            className="size-3 text-slate-300 dark:text-slate-400 shrink-0 inline"
            title="Sending…"
          />
        );
      case 'FAILED':
        return (
          <LuCircleAlert
            className="size-3 text-rose-400 shrink-0 inline"
            title="Failed to deliver"
          />
        );
      default:
        return (
          <LuCheckCheck
            className="size-3.5 text-[#38bdf8] dark:text-[#38bdf8] shrink-0 inline stroke-[2.5]"
            title="Seen / Read"
          />
        );
    }
  };

  /** Calculate effective status of an outbound message: If followed by patient response, it was seen (READ) */
  const getEffectiveStatus = (msg: MessageItem, allMessages: MessageItem[]): MessageItem['status'] => {
    if (msg.direction === 'INBOUND') return msg.status;
    if (msg.status === 'READ') return 'READ';
    if (msg.status === 'FAILED') return 'FAILED';
    const msgIndex = allMessages.findIndex((m) => m.id === msg.id);
    if (msgIndex !== -1) {
      const hasLaterInbound = allMessages
        .slice(msgIndex + 1)
        .some((m) => m.direction === 'INBOUND' || m.sender === 'PATIENT');
      if (hasLaterInbound) return 'READ';
    }
    return msg.status || 'SENT';
  };

  // Instant Status Changer
  const handleUpdateStatus = async (id: string, newStatus: ConversationItem['status']) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    setActiveActionId(null);

    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update conversation status:', err);
    }
  };

  // Toggle AI Automation
  const handleToggleAi = async (id: string, enabled: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, aiEnabled: enabled } : c))
    );

    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiEnabled: enabled }),
      });
    } catch (err) {
      console.error('Failed to toggle AI state:', err);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveActionId(null);
    if (selectedConversationId === id) {
      setSelectedConversationId(null);
    }

    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      window.dispatchEvent(new CustomEvent('inbox-updated'));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send Staff Reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedConversation || isSending) return;

    const messageContent = replyText.trim();
    const tempMessage: MessageItem = {
      id: `temp-${Date.now()}`,
      sender: 'HUMAN',
      direction: 'OUTBOUND',
      body: messageContent,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };

    // Instant local UI append
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? {
              ...c,
              lastMessageAt: new Date().toISOString(),
              lastMessagePreview: messageContent,
              messages: [...c.messages, tempMessage],
            }
          : c
      )
    );
    setReplyText('');
    setIsSending(true);

    try {
      await fetch(`/api/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }),
      });
      window.dispatchEvent(new CustomEvent('inbox-updated'));
    } catch (err) {
      console.error('Failed to send outbound reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatFriendlyTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatFriendlyDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER (FLUSH BORDER ATTACHED TO SIDEBAR) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <LuMessagesSquare className="size-5 text-[#0d8276]" />
            WhatsApp Conversations &amp; Patient Chat
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Direct patient WhatsApp communications, AI automation &amp; staff handoff for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span> ({timezone}).
          </p>
        </div>
      </div>

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, FLUSH WITH THEME) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Conversations */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Total Conversations
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalConversationsCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-teal-50 dark:bg-teal-950/70 text-[#0d6157] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-teal-100 dark:border-teal-900/50 inline-block">
                All patient threads
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-teal-50/80 dark:bg-teal-950/60 text-[#0d8276] dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-100/70 dark:border-teal-900/50 shadow-2xs">
            <LuMessagesSquare className="size-4" />
          </div>
        </div>

        {/* Card 2: Active Chats */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Active Chats
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {activeCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                In progress
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <LuMessageCircle className="size-4" />
          </div>
        </div>

        {/* Card 3: Escalated (Human Handoff) */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Escalated / Needs Staff
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {escalatedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Human required
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <LuCircleAlert className="size-4" />
          </div>
        </div>

        {/* Card 4: Resolved / Closed */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Closed / Resolved
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {closedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-slate-200 dark:border-slate-700 inline-block">
                Archived
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <LuCircleCheck className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: TOOLBAR & SPLIT LIVE CHAT OR TABLE VIEW */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top Toolbar: Search, Filters, & View Switcher */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Fixed-Width Stable Search */}
            <div className="relative w-72 sm:w-80 shrink-0">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations, patients, messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 focus:border-[#0d8276] transition-all"
              />
            </div>

            {/* Filter Dropdown Modal Anchor */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-[#0d6157] text-white border-[#0d6157] shadow-2xs'
                    : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <LuFilter className="size-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="size-4.5 rounded-full bg-white text-[#0d6157] text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* FLOATING DROPDOWN MODAL FOR FILTERS */}
              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFilterOpen(false)}
                  />

                  <div className="absolute left-0 top-full mt-2 z-40 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-2xl p-4.5 space-y-3 text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <LuFilter className="size-3.5 text-[#0d8276]" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Filter Conversations
                        </h4>
                        {activeFiltersCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-[8px] bg-teal-50 text-[#0d6157] dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-bold">
                            {activeFiltersCount} active
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="p-1 rounded-[8px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <LuX className="size-3.5" />
                      </button>
                    </div>

                    {/* 1. Status Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Thread Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="ESCALATED">Escalated (Needs Staff)</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    {/* 2. AI Assistant State */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        AI Automation
                      </label>
                      <select
                        value={selectedAiFilter}
                        onChange={(e) => setSelectedAiFilter(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 cursor-pointer"
                      >
                        <option value="ALL">All Automation States</option>
                        <option value="AI_ON">AI Assistant Enabled</option>
                        <option value="AI_OFF">Human Managed (AI Paused)</option>
                      </select>
                    </div>

                    {/* 3. Date Range */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Last Message Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-0.5">From Date</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-0.5">To Date</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        disabled={activeFiltersCount === 0}
                        className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold flex items-center gap-1 transition-colors ${
                          activeFiltersCount > 0
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <LuRotateCcw className="size-3" />
                        <span>Clear all</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="px-4 py-1.5 rounded-[8px] bg-[#0d6157] hover:bg-[#0d8276] text-white font-semibold text-xs shadow-xs cursor-pointer"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-[8px] flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <LuColumns2 className="size-3.5" />
              <span>Live Chat Stream</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <LuList className="size-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: SPLIT INBOX & LIVE WHATSAPP CHAT STREAM */}
        {viewMode === 'split' ? (
          <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {/* THREADS LIST (LEFT PANEL) - FIXED HEIGHT WITH INTERNAL SCROLLER */}
            <div className="w-full md:w-80 lg:w-96 md:shrink-0 flex flex-col h-full min-h-0 bg-slate-50/40 dark:bg-slate-900/40 overflow-hidden">
              <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase shrink-0">
                <span>Patients &amp; Senders ({filteredConversations.length})</span>
                <span>Last Activity</span>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No conversations matching filters.
                  </div>
                ) : (
                  filteredConversations.map((thread) => {
                    const isSelected = selectedConversation?.id === thread.id;
                    const lastMsg = thread.messages.length > 0 ? thread.messages[thread.messages.length - 1] : null;
                    const isLastMsgOutbound = lastMsg ? lastMsg.direction === 'OUTBOUND' || lastMsg.sender !== 'PATIENT' : false;
                    const hasUnread = (thread.unreadCount ?? 0) > 0;
                    const effectiveLastStatus = lastMsg ? getEffectiveStatus(lastMsg, thread.messages) : undefined;

                    return (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedConversationId(thread.id)}
                        className={`p-3 transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800/90 border-l-3 border-l-[#0d8276] shadow-2xs'
                            : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="size-8 rounded-[8px] bg-teal-50 text-[#0d6157] dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border border-teal-100/60 dark:border-teal-900/40">
                          {thread.patientName ? thread.patientName.charAt(0).toUpperCase() : 'P'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs truncate ${hasUnread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                              {thread.patientName || 'Guest Patient'}
                            </span>
                            <span className={`text-[10px] font-mono shrink-0 ${hasUnread ? 'text-[#0d8276] font-bold' : 'text-slate-400'}`}>
                              {formatFriendlyTime(thread.lastMessageAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {thread.phone}
                            </span>
                            {typeof thread.fileNumber === 'number' && (
                              <span className="px-1 py-0.2 rounded-[8px] text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                FR-{String(thread.fileNumber).padStart(3, '0')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-1">
                            <p className={`text-[11px] line-clamp-1 font-normal flex items-center gap-1 ${hasUnread ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                              {isLastMsgOutbound && renderMessageStatusTick(effectiveLastStatus)}
                              <span>{formatPreviewText(thread.lastMessagePreview)}</span>
                            </p>

                            {hasUnread && (
                              <span className="px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-[#0d8276] text-white font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0">
                                {thread.unreadCount}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-slate-100/80 dark:border-slate-800/60">
                            {getStatusBadge(thread.status)}
                            <span className="text-[10px] flex items-center gap-1 text-slate-400">
                              {thread.aiEnabled ? (
                                <span className="flex items-center gap-1 text-[#0d8276] dark:text-teal-300 font-semibold">
                                  <LuBot className="size-3" /> AI Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <LuUser className="size-3" /> Human Staff
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* LIVE CONVERSATION CHAT STREAM (RIGHT PANEL) - FIXED HEIGHT WITH INTERNAL SCROLLER */}
            <div className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Chat Active Header */}
                  <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-[8px] bg-teal-50 text-[#0d6157] dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center text-xs font-black shrink-0 border border-teal-100/60 dark:border-teal-900/40">
                        {selectedConversation.patientName
                          ? selectedConversation.patientName.charAt(0).toUpperCase()
                          : 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {selectedConversation.patientName || 'Guest Patient'}
                          </h3>
                          {typeof selectedConversation.fileNumber === 'number' && (
                            <span className="px-1.5 py-0.5 rounded-[8px] text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                              FR-{String(selectedConversation.fileNumber).padStart(3, '0')}
                            </span>
                          )}
                          {getStatusBadge(selectedConversation.status)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{selectedConversation.phone}</span>
                          <span>•</span>
                          <span>{timezone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Control Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Mark as Unread / Read Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const isCurrentlyUnread = (selectedConversation.unreadCount ?? 0) > 0;
                          if (isCurrentlyUnread) {
                            markConversationAsRead(selectedConversation.id);
                          } else {
                            markConversationAsUnread(selectedConversation.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded-[8px] text-[11px] font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Toggle seen/unseen status"
                      >
                        {(selectedConversation.unreadCount ?? 0) > 0 ? (
                          <>
                            <LuMailOpen className="size-3.5 text-[#0d8276]" />
                            <span>Mark Read</span>
                          </>
                        ) : (
                          <>
                            <LuMail className="size-3.5 text-slate-500" />
                            <span>Mark Unread</span>
                          </>
                        )}
                      </button>

                      {/* AI Automation Toggle Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleAi(selectedConversation.id, !selectedConversation.aiEnabled)
                        }
                        className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          selectedConversation.aiEnabled
                            ? 'bg-teal-50 text-[#0d6157] border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}
                        title="Toggle AI automated replies"
                      >
                        <LuBot className="size-3.5" />
                        <span>{selectedConversation.aiEnabled ? 'AI Active' : 'AI Paused'}</span>
                      </button>

                      {/* Status Selector */}
                      <select
                        value={selectedConversation.status}
                        onChange={(e) =>
                          handleUpdateStatus(selectedConversation.id, e.target.value as any)
                        }
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="ESCALATED">Escalated</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Escalation Banner if Escalated */}
                  {selectedConversation.status === 'ESCALATED' && (
                    <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0">
                      <div className="flex items-center gap-2">
                        <LuCircleAlert className="size-4 text-amber-600 shrink-0" />
                        <span className="font-semibold">
                          Human intervention requested: {selectedConversation.escalationReason || 'Patient requested to speak with clinic staff'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedConversation.id, 'ACTIVE')}
                        className="px-2.5 py-0.5 rounded-[8px] bg-amber-600 text-white font-bold text-[10px] hover:bg-amber-700 transition-colors"
                      >
                        Mark Handled
                      </button>
                    </div>
                  )}

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <LuMessageCircle className="size-10 mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          No messages in this conversation yet
                        </p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((msg) => {
                        const isPatient =
                          msg.sender === 'PATIENT' || msg.direction === 'INBOUND';
                        const isAi = msg.sender === 'AI';
                        const isHumanStaff = msg.sender === 'HUMAN';
                        const btnClickInfo = isPatient ? parseButtonClick(msg.body) : { isButton: false, title: msg.body };
                        const outboundButtons = !isPatient ? getMessageButtons(msg) : [];
                        const effectiveStatus = !isPatient ? getEffectiveStatus(msg, selectedConversation.messages) : undefined;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isPatient ? 'items-start' : 'items-end'
                            } space-y-1`}
                          >
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                              {isPatient ? (
                                <>
                                  <LuUser className="size-3 text-[#0d8276]" />
                                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                                    {selectedConversation.patientName || 'Patient'}
                                  </span>
                                </>
                              ) : isAi ? (
                                <>
                                  <LuBot className="size-3 text-emerald-500" />
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    AI Assistant
                                  </span>
                                </>
                              ) : (
                                <>
                                  <LuShieldCheck className="size-3 text-[#0d8276]" />
                                  <span className="font-semibold text-[#0d6157] dark:text-teal-300">
                                    Clinic Staff
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatFriendlyTime(msg.createdAt)}</span>
                            </div>

                            <div
                              className={`max-w-lg p-3 rounded-[8px] text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                                isPatient
                                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                                  : isHumanStaff
                                  ? 'bg-[#0d6157] text-white'
                                  : 'bg-[#0d8276] text-white'
                              }`}
                            >
                              {isPatient ? (
                                btnClickInfo.isButton ? (
                                  /* Patient Interactive Quick Reply Button Click */
                                  <div className="flex flex-col gap-1.5">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-slate-100 dark:bg-slate-700/70 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 font-bold text-xs shadow-2xs select-none">
                                      <span className="p-1 rounded bg-[#0d8276]/15 text-[#0d8276] dark:text-teal-300 flex items-center justify-center">
                                        <LuMousePointerClick className="size-3.5" />
                                      </span>
                                      <span>{btnClickInfo.title}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 dark:text-slate-400 px-0.5 flex items-center gap-1 font-medium">
                                      <span>Quick button response</span>
                                    </div>
                                  </div>
                                ) : (
                                  /* Regular Inbound Message */
                                  <div>{msg.body}</div>
                                )
                              ) : (
                                /* Outbound Message Bubble (AI / Staff) with WhatsApp Interactive Buttons */
                                <div className="flex flex-col gap-1.5">
                                  <div className="leading-relaxed whitespace-pre-wrap">{msg.body}</div>

                                  {/* Outbound Interactive Quick-Reply / Menu Buttons */}
                                  {outboundButtons.length > 0 && (
                                    <div className="mt-1 pt-2 border-t border-white/20 dark:border-white/10 flex flex-col gap-1.5">
                                      {outboundButtons.map((btn, bIdx) => (
                                        <div
                                          key={bIdx}
                                          className="w-full py-1.5 px-3 rounded-[8px] bg-white/15 dark:bg-white/10 hover:bg-white/25 transition-colors text-white font-semibold text-xs flex items-center justify-center gap-2 select-none border border-white/10 shadow-2xs"
                                        >
                                          <LuMousePointerClick className="size-3.5 opacity-80 shrink-0" />
                                          <span>{btn.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Message Timestamp & Seen Status Tick */}
                                  <div className="self-end flex items-center gap-1 text-[9px] text-teal-100/90 select-none mt-0.5">
                                    <span>{formatFriendlyTime(msg.createdAt)}</span>
                                    {renderMessageStatusTick(effectiveStatus)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Staff Reply Composer */}
                  <form
                    onSubmit={handleSendReply}
                    className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      placeholder={`Reply directly to ${selectedConversation.patientName || 'patient'} on WhatsApp...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 bg-[#0d6157] hover:bg-[#0d8276] text-white font-semibold text-xs px-4 py-2 rounded-[8px] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <LuSend className="size-3.5" />
                      <span>{isSending ? 'Sending…' : 'Send'}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <LuMessagesSquare className="size-12 mb-3 text-slate-300 dark:text-slate-700" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Select a conversation
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Choose a patient from the list on the left to view the live WhatsApp stream and reply.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: TABLE LIST VIEW */
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                <tr className="divide-x divide-slate-200 dark:divide-slate-700/60">
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                    FILE NO
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    PATIENT
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                    PHONE
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    STATUS
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    AI AUTOMATION
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    LAST MESSAGE
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                    LAST ACTIVITY
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-xs">
                      No conversations matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredConversations.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group divide-x divide-slate-100 dark:divide-slate-800/60"
                    >
                      {/* 1. FILE NO */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {typeof row.fileNumber === 'number' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[8px] text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            FR-{String(row.fileNumber).padStart(3, '0')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* 2. PATIENT */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-[8px] bg-teal-50 text-[#0d6157] dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center text-[11px] font-bold shrink-0 border border-teal-100/60 dark:border-teal-900/40">
                            {row.patientName && row.patientName.length > 0
                              ? row.patientName.charAt(0).toUpperCase()
                              : 'P'}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white truncate block text-xs">
                            {row.patientName || 'Guest Patient'}
                          </span>
                        </div>
                      </td>

                      {/* 3. PHONE */}
                      <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {row.phone}
                      </td>

                      {/* 4. STATUS */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* 5. AI STATUS */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold flex items-center gap-1">
                          {row.aiEnabled ? (
                            <span className="text-[#0d8276] dark:text-teal-300 flex items-center gap-1">
                              <LuBot className="size-3.5" /> Enabled
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <LuUser className="size-3.5" /> Paused
                            </span>
                          )}
                        </span>
                      </td>

                      {/* 6. LAST MESSAGE */}
                      <td className="py-2.5 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {formatPreviewText(row.lastMessagePreview) || '—'}
                      </td>

                      {/* 7. LAST ACTIVITY */}
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                        {formatFriendlyDate(row.lastMessageAt)}
                      </td>

                      {/* 8. ACTION */}
                      <td className="py-2.5 px-4 text-right relative whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionId(activeActionId === row.id ? null : row.id)
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-[8px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <LuEllipsis className="size-4" />
                        </button>

                        {activeActionId === row.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionId(null);
                              }}
                            />

                            <div className="absolute right-4 top-8 z-30 w-48 bg-white dark:bg-slate-800 rounded-[8px] shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(row.id, 'ACTIVE');
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="size-2 rounded-full bg-emerald-500" />
                                <span>Mark Active</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(row.id, 'ESCALATED');
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="size-2 rounded-full bg-amber-500" />
                                <span>Mark Escalated</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(row.id, 'CLOSED');
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="size-2 rounded-full bg-slate-400" />
                                <span>Close Chat</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAi(row.id, !row.aiEnabled);
                                  setActiveActionId(null);
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <LuBot className="size-3.5 text-[#0d8276]" />
                                <span>{row.aiEnabled ? 'Pause AI' : 'Enable AI'}</span>
                              </button>

                              <hr className="my-1 border-slate-100 dark:border-slate-700" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(row.id);
                                }}
                                className="w-full px-3.5 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                              >
                                <LuTrash2 className="size-3.5" />
                                <span>Delete Thread</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
