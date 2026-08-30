'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  MessagesSquare,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bot,
  User,
  Search,
  Filter,
  RotateCcw,
  List,
  Columns,
  MoreHorizontal,
  Send,
  Sparkles,
  Phone,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Power,
  X,
  XCircle,
} from 'lucide-react';

export interface MessageItem {
  id: string;
  sender: 'PATIENT' | 'AI' | 'HUMAN' | 'SYSTEM';
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
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
  messages: MessageItem[];
}

export interface ConversationsPortalDashboardProps {
  clinicName?: string;
  timezone?: string;
  initialConversations?: ConversationItem[];
  defaultSelectedId?: string;
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
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            WhatsApp Conversations &amp; Patient Chat
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Direct patient WhatsApp communications, AI automation &amp; staff handoff for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span> ({timezone}).
          </p>
        </div>
      </div>

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, NO ROUNDNESS, ATTACHED DIRECTLY TO SIDEBAR) */}
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
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-100 dark:border-blue-900/50 inline-block">
                All patient threads
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/70 dark:border-blue-900/50 shadow-2xs">
            <MessagesSquare className="size-4" />
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
            <MessageCircle className="size-4" />
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
            <AlertCircle className="size-4" />
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
            <CheckCircle2 className="size-4" />
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations, patients, messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filter Dropdown Modal Anchor */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600 shadow-2xs'
                    : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="size-4.5 rounded-full bg-blue-500 text-white dark:bg-white dark:text-blue-600 text-[10px] font-bold flex items-center justify-center">
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
                        <Filter className="size-3.5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Filter Conversations
                        </h4>
                        {activeFiltersCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-[8px] bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-bold">
                            {activeFiltersCount} active
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="p-1 rounded-[8px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="size-3.5" />
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
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-0.5">To Date</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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
                        <RotateCcw className="size-3" />
                        <span>Clear all</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer"
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
              <Columns className="size-3.5" />
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
              <List className="size-3.5" />
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
                    return (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedConversationId(thread.id)}
                        className={`p-3 transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800/90 border-l-3 border-l-blue-600 shadow-2xs'
                            : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="size-8 rounded-[8px] bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {thread.patientName ? thread.patientName.charAt(0).toUpperCase() : 'P'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {thread.patientName || 'Guest Patient'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
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

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-normal">
                            {thread.lastMessagePreview || 'No messages yet'}
                          </p>

                          <div className="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-slate-100/80 dark:border-slate-800/60">
                            {getStatusBadge(thread.status)}
                            <span className="text-[10px] flex items-center gap-1 text-slate-400">
                              {thread.aiEnabled ? (
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                                  <Bot className="size-3" /> AI Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <User className="size-3" /> Human Staff
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
                      <div className="size-8 rounded-[8px] bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0">
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
                      {/* AI Automation Toggle Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleAi(selectedConversation.id, !selectedConversation.aiEnabled)
                        }
                        className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          selectedConversation.aiEnabled
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}
                        title="Toggle AI automated replies"
                      >
                        <Bot className="size-3.5" />
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
                        <AlertCircle className="size-4 text-amber-600 shrink-0" />
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
                        <MessageCircle className="size-10 mb-2 text-slate-300 dark:text-slate-700" />
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
                                  <User className="size-3 text-blue-500" />
                                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                                    {selectedConversation.patientName || 'Patient'}
                                  </span>
                                </>
                              ) : isAi ? (
                                <>
                                  <Bot className="size-3 text-emerald-500" />
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    AI Assistant
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="size-3 text-purple-500" />
                                  <span className="font-semibold text-purple-600 dark:text-purple-400">
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
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {msg.body}
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
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-[8px] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="size-3.5" />
                      <span>{isSending ? 'Sending…' : 'Send'}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessagesSquare className="size-12 mb-3 text-slate-300 dark:text-slate-700" />
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
                          <div className="size-7 rounded-[8px] bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold shrink-0">
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
                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Bot className="size-3.5" /> Enabled
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <User className="size-3.5" /> Paused
                            </span>
                          )}
                        </span>
                      </td>

                      {/* 6. LAST MESSAGE */}
                      <td className="py-2.5 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {row.lastMessagePreview || '—'}
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
                          <MoreHorizontal className="size-4" />
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
                                <Bot className="size-3.5 text-blue-500" />
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
                                <XCircle className="size-3.5" />
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
