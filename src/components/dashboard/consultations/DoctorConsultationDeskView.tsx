'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LuStethoscope as Stethoscope,
  LuActivity as Activity,
  LuHeartPulse as HeartPulse,
  LuClock as Clock,
  LuSearch as Search,
  LuCircleCheck as CheckCircle2,
  LuTriangleAlert as AlertTriangle,
  LuArrowRight as ArrowRight,
  LuFileText as FileText,
  LuPill as Pill,
  LuFlaskConical as FlaskConical,
  LuCalendar as Calendar,
  LuRefreshCw as RefreshCw,
  LuPhone as Phone,
  LuUser as User,
  LuBadgeAlert as BadgeAlert,
  LuClipboardCheck as ClipboardCheck,
} from 'react-icons/lu';

export interface ConsultationQueueItem {
  id: string;
  appointmentId?: string;
  encounterId?: string;
  patientId: string;
  patientName: string;
  fileNumber?: number | null;
  phone: string;
  gender?: string | null;
  age?: number | string | null;
  doctorId: string;
  doctorName: string;
  specialty?: string | null;
  serviceName?: string | null;
  timeSlot: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
  triagePriority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  allergies?: string[];
  vitals?: {
    bpSystolic?: number | string;
    bpDiastolic?: number | string;
    heartRate?: number | string;
    temperature?: number | string;
    spo2?: number | string;
    bloodSugar?: number | string;
    bmi?: number | string;
    notes?: string;
  };
  primaryDiagnosis?: string | null;
}

interface DoctorConsultationDeskViewProps {
  clinicName: string;
  currentUserName: string;
  userRole: string;
  doctors: { id: string; name: string; specialty?: string | null }[];
  initialQueue: ConsultationQueueItem[];
}

export function DoctorConsultationDeskView({
  clinicName,
  currentUserName,
  userRole,
  doctors,
  initialQueue,
}: DoctorConsultationDeskViewProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<ConsultationQueueItem[]>(initialQueue);
  const [activeTab, setActiveTab] = useState<'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL'>('WAITING');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'NORMAL' | 'URGENT' | 'EMERGENCY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStarting, setIsStarting] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const waiting = queue.filter(q => q.status === 'WAITING').length;
    const inProgress = queue.filter(q => q.status === 'IN_CONSULTATION').length;
    const completed = queue.filter(q => q.status === 'COMPLETED').length;
    const urgent = queue.filter(q => q.triagePriority === 'URGENT' || q.triagePriority === 'EMERGENCY').length;
    const allergyCount = queue.filter(q => q.allergies && q.allergies.length > 0).length;
    return { waiting, inProgress, completed, urgent, allergyCount, total: queue.length };
  }, [queue]);

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      if (activeTab === 'WAITING' && item.status !== 'WAITING') return false;
      if (activeTab === 'IN_PROGRESS' && item.status !== 'IN_CONSULTATION') return false;
      if (activeTab === 'COMPLETED' && item.status !== 'COMPLETED') return false;

      if (selectedDoctorId !== 'ALL' && item.doctorId !== selectedDoctorId) return false;
      if (priorityFilter !== 'ALL' && item.triagePriority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesPhone = item.phone.toLowerCase().includes(q);
        const matchesFile = item.fileNumber ? String(item.fileNumber).includes(q) : false;
        const matchesDoc = item.doctorName.toLowerCase().includes(q);
        const matchesDiag = item.primaryDiagnosis ? item.primaryDiagnosis.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesFile && !matchesDoc && !matchesDiag) return false;
      }
      return true;
    });
  }, [queue, activeTab, selectedDoctorId, priorityFilter, searchQuery]);

  const handleStartEncounter = async (item: ConsultationQueueItem) => {
    setIsStarting(item.id);
    try {
      if (item.encounterId) {
        router.push(`/portal/consultations/${item.encounterId}`);
        return;
      }

      const res = await fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: item.appointmentId,
          patientId: item.patientId,
          doctorId: item.doctorId,
          vitalsJson: item.vitals,
        }),
      });

      if (!res.ok) throw new Error('Failed to create encounter');
      const data = await res.json();
      router.push(`/portal/consultations/${data.encounter.id}`);
    } catch (err) {
      console.error('Error starting encounter:', err);
      alert('Could not start encounter. Please try again.');
    } finally {
      setIsStarting(null);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Clinical Workspace &amp; EMR</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Stethoscope className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Doctor Consultation Desk</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Physician: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUserName}</span> • Live queue, nurse vitals handover, SOAP clinical notes &amp; e-Prescriptions
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/portal/nurse"
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer"
          >
            <HeartPulse className="size-3.5 text-rose-500" />
            <span>Nurse Station</span>
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, 4-WAY DIVIDED) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        
        {/* Card 1: Waiting for Doctor */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Waiting for Doctor
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.waiting}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block">
                Ready for Consultation
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 2: In Consultation */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
              In Consultation
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.inProgress}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                Active in Clinic Room
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Activity className="size-4" />
          </div>
        </div>

        {/* Card 3: Completed Today */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Completed Today
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.completed}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-200/80 dark:border-emerald-900/50 inline-block">
                Finalized Encounters
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        {/* Card 4: Urgent & Emergency */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Urgent &amp; Emergency
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.urgent}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-200/80 dark:border-rose-900/50 inline-block">
                Priority Escalation
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

      </div>

      {/* 3. TOOLBAR ROW (SEGMENTED TABS, DOCTOR SELECTOR, SEARCH) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {[
            { id: 'WAITING', label: `Waiting Queue (${stats.waiting})` },
            { id: 'IN_PROGRESS', label: `In Consultation (${stats.inProgress})` },
            { id: 'COMPLETED', label: `Completed (${stats.completed})` },
            { id: 'ALL', label: `All Today (${queue.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0d6157] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5">
          {doctors.length > 1 && (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
            >
              <option value="ALL">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal Priority</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="EMERGENCY">Emergency</option>
          </select>

          <div className="relative w-56 sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, file, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
            />
          </div>
        </div>

      </div>

      {/* 4. MAIN DATA TABLE SECTION */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">Patient / File No</th>
                <th className="py-3 px-6">Triage Priority</th>
                <th className="py-3 px-6">Attending Doctor / Slot</th>
                <th className="py-3 px-6">Nurse Vitals Handover</th>
                <th className="py-3 px-6">Allergies / Alerts</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    <Stethoscope className="size-8 mx-auto mb-2 opacity-30 text-[#0d6157]" />
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No patients in this consultation queue</p>
                    <p className="text-xs text-slate-400 mt-0.5">All patients in this view have been attended to, or no appointments match filters</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const hasVitals = !!item.vitals?.bpSystolic;
                  const isUrgent = item.triagePriority === 'URGENT' || item.triagePriority === 'EMERGENCY';
                  const hasAllergies = item.allergies && item.allergies.length > 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isUrgent ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Patient / File */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-[8px] bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                            {item.patientName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block leading-tight">
                              {item.patientName}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.fileNumber ? (
                                <span className="font-mono font-semibold text-[#0d5c56] dark:text-teal-300">
                                  #{item.fileNumber}
                                </span>
                              ) : (
                                <span className="text-slate-400">No File #</span>
                              )}
                              <span>•</span>
                              <span>{item.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Triage Priority */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        {item.triagePriority === 'EMERGENCY' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-900/50 animate-pulse">
                            <AlertTriangle className="size-3" />
                            EMERGENCY
                          </span>
                        ) : item.triagePriority === 'URGENT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-900/50">
                            <AlertTriangle className="size-3" />
                            URGENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Doctor / Slot */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">
                          Dr. {item.doctorName}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="size-3 text-slate-400" />
                          <span>{item.timeSlot}</span>
                          {item.serviceName && <span>• {item.serviceName}</span>}
                        </div>
                      </td>

                      {/* Vitals Handover */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        {hasVitals ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                              {item.vitals?.bpSystolic}/{item.vitals?.bpDiastolic}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.vitals?.heartRate ? `${item.vitals.heartRate} bpm` : ''}
                            </span>
                            {item.vitals?.bmi && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-[#0d6157] font-semibold">
                                BMI {item.vitals.bmi}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                            Pending at nurse station
                          </span>
                        )}
                      </td>

                      {/* Allergies / Alerts */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        {hasAllergies ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {item.allergies!.map((alg) => (
                              <span
                                key={alg}
                                className="px-2 py-0.5 rounded-[6px] bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-bold dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60"
                              >
                                {alg}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">NKDA (No known)</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        {item.status === 'WAITING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                            Waiting
                          </span>
                        ) : item.status === 'IN_CONSULTATION' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold bg-[#e6f6f3] text-[#0d5c56] border border-[#0d8276]/30 dark:bg-[#0d6157]/30 dark:text-teal-300 animate-pulse">
                            In Consultation
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                            Completed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEncounter(item)}
                            disabled={isStarting === item.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[8px] shadow-2xs transition-colors cursor-pointer ${
                              item.status === 'COMPLETED'
                                ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                : item.status === 'IN_CONSULTATION'
                                ? 'text-white bg-amber-600 hover:bg-amber-700'
                                : 'text-white bg-[#0d6157] hover:bg-[#0a4e46]'
                            }`}
                          >
                            {isStarting === item.id ? (
                              <>
                                <RefreshCw className="size-3.5 animate-spin" />
                                <span>Opening...</span>
                              </>
                            ) : item.status === 'COMPLETED' ? (
                              <>
                                <FileText className="size-3.5" />
                                <span>View Summary</span>
                              </>
                            ) : item.status === 'IN_CONSULTATION' ? (
                              <>
                                <Stethoscope className="size-3.5" />
                                <span>Resume</span>
                                <ArrowRight className="size-3.5" />
                              </>
                            ) : (
                              <>
                                <Stethoscope className="size-3.5" />
                                <span>Start Consult</span>
                                <ArrowRight className="size-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
