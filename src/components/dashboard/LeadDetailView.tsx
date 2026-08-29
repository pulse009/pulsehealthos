'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Phone,
  Mail,
  FileText,
  Tag,
  ExternalLink,
  Bot,
  User,
  Sparkles,
  Save,
  Check,
  Send,
  Building2,
  Stethoscope,
} from 'lucide-react';

export interface LeadDetailViewProps {
  lead: {
    id: string;
    clinicId: string;
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'BOOKED' | 'LOST';
    source: string;
    notes: string | null;
    tags: string[];
    lostReason: string | null;
    firstContactAt: string;
    lastContactAt: string;
    qualifiedAt: string | null;
    bookedAt: string | null;
    clinic: { id?: string; name: string; timezone: string };
    patient: {
      id: string;
      name: string | null;
      phone: string;
      email: string | null;
      fileNumber: number | null;
      notes: string | null;
      tags: string[];
      conversations: Array<{
        id: string;
        status: string;
        lastMessageAt: string;
        lastMessagePreview: string | null;
        messages?: Array<{
          id: string;
          sender: string;
          direction: string;
          body: string;
          createdAt: string;
        }>;
      }>;
    };
    appointments: Array<{
      id: string;
      appointmentNumber?: number | null;
      startsAt: string;
      status: string;
      timezone: string;
      doctor: { name: string };
      service: { name: string };
    }>;
  };
  conversationHrefPrefix?: string;
  backHref?: string;
}

export function LeadDetailView({
  lead: initialLead,
  conversationHrefPrefix = '/portal/conversations',
  backHref = '/portal/leads',
}: LeadDetailViewProps) {
  const [leadStatus, setLeadStatus] = useState<LeadDetailViewProps['lead']['status']>(
    initialLead.status
  );
  const [notes, setNotes] = useState(initialLead.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'appointments'>('chat');

  const tz = initialLead.clinic.timezone || 'Asia/Riyadh';
  const primaryConversation = initialLead.patient.conversations[0];
  const messagesList = primaryConversation?.messages || [];

  // Update Lead Funnel Status
  const handleStatusChange = async (newStatus: LeadDetailViewProps['lead']['status']) => {
    setLeadStatus(newStatus);
    try {
      await fetch(`/api/leads/${initialLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesSavedSuccess(false);
    try {
      await fetch(`/api/leads/${initialLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <span className="size-1.5 rounded-full bg-blue-500" />
            New Lead
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Contacted
          </span>
        );
      case 'QUALIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
            <span className="size-1.5 rounded-full bg-indigo-500" />
            Qualified
          </span>
        );
      case 'BOOKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Booked
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Lost
          </span>
        );
      default:
        return null;
    }
  };

  const formatFriendlyDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER (FLUSH ATTACHED TO SIDEBAR) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href={backHref}
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Back to Leads"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="size-9 rounded-[8px] bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0">
            {initialLead.patient.name ? initialLead.patient.name.charAt(0).toUpperCase() : 'P'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                {initialLead.patient.name || 'Guest Patient'}
              </h1>
              {typeof initialLead.patient.fileNumber === 'number' && (
                <span className="px-2 py-0.5 rounded-[8px] text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  File #{initialLead.patient.fileNumber}
                </span>
              )}
              {getStatusBadge(leadStatus)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              <span>{initialLead.patient.phone}</span>
              {initialLead.patient.email && (
                <>
                  <span>•</span>
                  <span>{initialLead.patient.email}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status Quick Changer */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Stage:</span>
            <select
              value={leadStatus}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="BOOKED">Booked</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          {/* Open WhatsApp Conversation Link */}
          {primaryConversation ? (
            <Link
              href={`${conversationHrefPrefix}/${primaryConversation.id}`}
              className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all"
            >
              <MessageCircle className="size-3.5 text-emerald-400" />
              <span>Open Chat</span>
            </Link>
          ) : (
            <a
              href={`https://wa.me/${initialLead.patient.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all"
            >
              <MessageCircle className="size-3.5 text-emerald-400" />
              <span>Message on WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. STAT CARDS ROW (FLAT, FLUSH BORDER ATTACHED) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: First Contact */}
        <div className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              First Contact
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {formatFriendlyDate(initialLead.firstContactAt)}
            </div>
            <div className="text-[10px] text-slate-400 capitalize">
              Via {initialLead.source}
            </div>
          </div>
          <div className="size-8 rounded-[8px] bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Calendar className="size-3.5" />
          </div>
        </div>

        {/* Card 2: Last Activity */}
        <div className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Last Activity
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {formatFriendlyDate(initialLead.lastContactAt)}
            </div>
            <div className="text-[10px] text-slate-400">
              WhatsApp interaction
            </div>
          </div>
          <div className="size-8 rounded-[8px] bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50">
            <Clock className="size-3.5" />
          </div>
        </div>

        {/* Card 3: Total Appointments */}
        <div className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Appointments
            </span>
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {initialLead.appointments.length} Booked
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {initialLead.appointments.filter((a) => a.status === 'CONFIRMED').length} Confirmed
            </div>
          </div>
          <div className="size-8 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle2 className="size-3.5" />
          </div>
        </div>

        {/* Card 4: Clinic Context */}
        <div className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Clinic &amp; Timezone
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
              {initialLead.clinic.name}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {tz}
            </div>
          </div>
          <div className="size-8 rounded-[8px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <Building2 className="size-3.5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN SPLIT BODY (2 COLUMNS: PROFILE/FUNNEL ON LEFT, CHAT & APPOINTMENTS ON RIGHT) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {/* LEFT COLUMN: CONTACT INFO & FUNNEL (SCROLLABLE) */}
        <div className="w-full lg:w-80 lg:shrink-0 flex flex-col min-h-0 bg-slate-50/40 dark:bg-slate-900/40 overflow-y-auto p-4 space-y-4">
          {/* Patient Details Box */}
          <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="size-3.5 text-blue-600" />
              <span>Contact Profile</span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-1 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Full Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {initialLead.patient.name || '—'}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Phone:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {initialLead.patient.phone}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Email:</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                  {initialLead.patient.email || '—'}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">File Number:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {initialLead.patient.fileNumber ? `#${initialLead.patient.fileNumber}` : 'Not assigned'}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Source:</span>
                <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                  {initialLead.source}
                </span>
              </div>
            </div>
          </div>

          {/* Funnel Progress Stepper */}
          <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Funnel Stage</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {[
                { stage: 'NEW', label: '1. New Inquiry', date: initialLead.firstContactAt },
                { stage: 'CONTACTED', label: '2. Contacted', date: initialLead.lastContactAt },
                { stage: 'QUALIFIED', label: '3. Qualified', date: initialLead.qualifiedAt },
                { stage: 'BOOKED', label: '4. Booked Appointment', date: initialLead.bookedAt },
              ].map((step, idx) => {
                const isCurrent = leadStatus === step.stage;
                const isPassed =
                  (leadStatus === 'CONTACTED' && idx <= 1) ||
                  (leadStatus === 'QUALIFIED' && idx <= 2) ||
                  (leadStatus === 'BOOKED' && idx <= 3);

                return (
                  <div
                    key={step.stage}
                    onClick={() => handleStatusChange(step.stage as any)}
                    className={`flex items-center justify-between p-2 rounded-[8px] border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-bold'
                        : isPassed
                        ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                        : 'border-transparent text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          isPassed || isCurrent ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                      />
                      <span>{step.label}</span>
                    </div>
                    {step.date && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatFriendlyDate(step.date).slice(0, 6)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical & Inquiry Notes */}
          <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="size-3.5 text-indigo-500" />
                <span>Staff Notes</span>
              </h3>
              {notesSavedSuccess && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="size-3" /> Saved
                </span>
              )}
            </div>

            <textarea
              rows={3}
              placeholder="Record inquiry details, medical concerns, or patient preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1 rounded-[8px] transition-all cursor-pointer disabled:opacity-60"
              >
                <Save className="size-3" />
                <span>{isSavingNotes ? 'Saving…' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT STREAM & APPOINTMENTS HISTORY (FLEX-1) */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Tabs Bar */}
          <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-[8px]">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <MessageCircle className="size-3.5" />
                <span>WhatsApp Conversation ({messagesList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'appointments'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Calendar className="size-3.5" />
                <span>Appointments ({initialLead.appointments.length})</span>
              </button>
            </div>

            {primaryConversation && (
              <Link
                href={`${conversationHrefPrefix}/${primaryConversation.id}`}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Chat View</span>
                <ExternalLink className="size-3" />
              </Link>
            )}
          </div>

          {/* TAB 1: WHATSAPP CHAT STREAM */}
          {activeTab === 'chat' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
              {messagesList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessageCircle className="size-10 mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No messages recorded yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    When {initialLead.patient.name || 'the patient'} sends messages on WhatsApp, the full conversation thread will stream here in real-time.
                  </p>
                </div>
              ) : (
                messagesList.map((msg) => {
                  const isPatient = msg.sender === 'PATIENT' || msg.direction === 'INBOUND';
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
                              {initialLead.patient.name || 'Patient'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Bot className="size-3 text-emerald-500" />
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              AI Clinic Assistant
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatFriendlyDate(msg.createdAt)}</span>
                      </div>

                      <div
                        className={`max-w-lg p-3 rounded-[8px] text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                          isPatient
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                            : 'bg-blue-600 text-white dark:bg-blue-600'
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: APPOINTMENTS HISTORY */}
          {activeTab === 'appointments' && (
            <div className="flex-1 overflow-y-auto min-h-0">
              {initialLead.appointments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Calendar className="size-10 mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No appointments booked yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Bookings made by this patient through WhatsApp or portal will appear here with medical file records.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                    <tr className="divide-x divide-slate-200 dark:divide-slate-700/60">
                      <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        APPOINTMENT NO
                      </th>
                      <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        SERVICE / DEPARTMENT
                      </th>
                      <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        DOCTOR
                      </th>
                      <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        DATE &amp; TIME
                      </th>
                      <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                    {initialLead.appointments.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 divide-x divide-slate-100 dark:divide-slate-800/60"
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {typeof app.appointmentNumber === 'number' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[8px] text-[11px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                              Appt #{app.appointmentNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {app.service.name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {app.doctor.name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatFriendlyDate(app.startsAt)}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {getStatusBadge(app.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
