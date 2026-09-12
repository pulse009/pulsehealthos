'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LuActivity as Activity,
  LuHeartPulse as HeartPulse,
  LuThermometer as Thermometer,
  LuSearch as Search,
  LuPlus as Plus,
  LuCircleCheck as CheckCircle2,
  LuClock as Clock,
  LuTriangleAlert as AlertTriangle,
  LuUser as User,
  LuPhone as Phone,
  LuClipboardCheck as ClipboardCheck,
  LuFileText as FileText,
  LuScale as Scale,
  LuX as X,
  LuArrowRight as ArrowRight,
  LuRefreshCw as RefreshCw,
  LuBadgeAlert as BadgeAlert,
  LuCheck as Check,
  LuUndo2 as Undo2,
  LuLoader as Loader2,
  LuShieldAlert as ShieldAlert,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
import { cn } from '@/components/ui/primitives';

export interface NursePatientItem {
  id: string;
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  name: string;
  fileNumber?: number | null;
  phone: string;
  gender?: string | null;
  age?: number | string | null;
  doctorName?: string | null;
  serviceName?: string | null;
  timeSlot?: string | null;
  status: 'WAITING' | 'VITALS_DONE' | 'IN_CONSULTATION' | 'COMPLETED';
  triagePriority?: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  allergies?: string[];
  chiefComplaint?: string;
  vitals?: {
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    bloodSugar?: number;
    height?: number; // cm
    weight?: number; // kg
    bmi?: number;
    notes?: string;
    recordedAt?: string;
  };
}

interface NursePortalViewProps {
  clinicName: string;
  nurseName: string;
  initialPatients: NursePatientItem[];
}

const COMMON_ALLERGIES = [
  'Penicillin',
  'Latex',
  'NSAIDs',
  'Sulfa Drugs',
  'Aspirin',
  'Peanuts',
  'Contrast Dye',
  'No Known Allergies (NKDA)',
];

export function NursePortalView({ clinicName, nurseName, initialPatients }: NursePortalViewProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const initialTab = useMemo(() => {
    if (tabParam === 'history') return 'HISTORY';
    if (tabParam === 'queue') return 'QUEUE';
    if (tabParam === 'recorded') return 'RECORDED';
    return 'QUEUE';
  }, [tabParam]);

  const [patients, setPatients] = useState<NursePatientItem[]>(initialPatients);
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'RECORDED' | 'ALL' | 'HISTORY'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'NORMAL' | 'URGENT' | 'EMERGENCY'>('ALL');
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<NursePatientItem | null>(() => initialPatients[0] || null);

  useEffect(() => {
    if (tabParam === 'history') setActiveTab('HISTORY');
    else if (tabParam === 'queue') setActiveTab('QUEUE');
    else if (tabParam === 'recorded') setActiveTab('RECORDED');
    else if (tabParam === 'triage') setActiveTab('QUEUE');
  }, [tabParam]);
  
  // Drawer & Selection state
  const [selectedPatient, setSelectedPatient] = useState<NursePatientItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Vitals form state
  const [formData, setFormData] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    temperature: '',
    spo2: '',
    bloodSugar: '',
    height: '',
    weight: '',
    triagePriority: 'NORMAL' as 'NORMAL' | 'URGENT' | 'EMERGENCY',
    notes: '',
  });

  // Allergy chips state
  const [allergyChips, setAllergyChips] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [deletedChipsHistory, setDeletedChipsHistory] = useState<string[]>([]);
  const allergyInputRef = useRef<HTMLInputElement>(null);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Calculate BMI dynamically
  const calculatedBMI = useMemo(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      const val = (w / (h * h)).toFixed(1);
      return parseFloat(val);
    }
    return null;
  }, [formData.height, formData.weight]);

  const bmiCategory = useMemo(() => {
    if (!calculatedBMI) return null;
    if (calculatedBMI < 18.5) return { label: 'Underweight', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40' };
    if (calculatedBMI < 25) return { label: 'Normal Weight', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40' };
    if (calculatedBMI < 30) return { label: 'Overweight', color: 'text-orange-700 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40' };
    return { label: 'Obese', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40' };
  }, [calculatedBMI]);

  // Blood Pressure risk assessment
  const bpRisk = useMemo(() => {
    const sys = parseInt(formData.bpSystolic);
    const dia = parseInt(formData.bpDiastolic);
    if (!sys || !dia) return null;
    if (sys >= 180 || dia >= 120) return { label: 'Hypertensive Crisis', urgent: true, color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 font-bold' };
    if (sys >= 140 || dia >= 90) return { label: 'Stage 2 HTN', urgent: false, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
    if (sys >= 130 || dia >= 80) return { label: 'Stage 1 HTN', urgent: false, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    if (sys >= 120 && dia < 80) return { label: 'Elevated BP', urgent: false, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800' };
    return { label: 'Optimal BP', urgent: false, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
  }, [formData.bpSystolic, formData.bpDiastolic]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (activeTab === 'QUEUE' && p.status !== 'WAITING') return false;
      if (activeTab === 'RECORDED' && p.status === 'WAITING') return false;

      if (priorityFilter !== 'ALL' && p.triagePriority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPhone = p.phone.toLowerCase().includes(q);
        const matchesFile = p.fileNumber ? String(p.fileNumber).includes(q) : false;
        const matchesDoc = p.doctorName ? p.doctorName.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesFile && !matchesDoc) return false;
      }
      return true;
    });
  }, [patients, activeTab, priorityFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const waitingCount = patients.filter((p) => p.status === 'WAITING').length;
    const recordedCount = patients.filter((p) => p.status !== 'WAITING').length;
    const urgentCount = patients.filter((p) => p.triagePriority === 'URGENT' || p.triagePriority === 'EMERGENCY').length;
    const highAlertCount = patients.filter((p) => (p.allergies && p.allergies.length > 0) || (p.vitals?.bpSystolic && p.vitals.bpSystolic >= 140)).length;

    return { waitingCount, recordedCount, urgentCount, highAlertCount };
  }, [patients]);

  const handleOpenVitalsDrawer = (patient: NursePatientItem) => {
    setSelectedPatient(patient);
    setFormData({
      bpSystolic: patient.vitals?.bpSystolic ? String(patient.vitals.bpSystolic) : '',
      bpDiastolic: patient.vitals?.bpDiastolic ? String(patient.vitals.bpDiastolic) : '',
      heartRate: patient.vitals?.heartRate ? String(patient.vitals.heartRate) : '',
      temperature: patient.vitals?.temperature ? String(patient.vitals.temperature) : '',
      spo2: patient.vitals?.spo2 ? String(patient.vitals.spo2) : '',
      bloodSugar: patient.vitals?.bloodSugar ? String(patient.vitals.bloodSugar) : '',
      height: patient.vitals?.height ? String(patient.vitals.height) : '',
      weight: patient.vitals?.weight ? String(patient.vitals.weight) : '',
      triagePriority: patient.triagePriority || 'NORMAL',
      notes: patient.vitals?.notes || patient.chiefComplaint || '',
    });
    setAllergyChips(patient.allergies || []);
    setAllergyInput('');
    setDeletedChipsHistory([]);
    setIsDrawerOpen(true);
  };

  // Allergy Chip Helpers
  const addAllergyChip = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!allergyChips.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setAllergyChips((prev) => [...prev, trimmed]);
    }
    setAllergyInput('');
  };

  const removeAllergyChip = (indexToRemove: number) => {
    const chipToRemove = allergyChips[indexToRemove];
    if (chipToRemove) {
      setDeletedChipsHistory((prev) => [...prev, chipToRemove]);
      setAllergyChips((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const undoDeleteChip = () => {
    if (deletedChipsHistory.length === 0) return;
    const lastDeleted = deletedChipsHistory[deletedChipsHistory.length - 1];
    setDeletedChipsHistory((prev) => prev.slice(0, -1));
    if (lastDeleted && !allergyChips.includes(lastDeleted)) {
      setAllergyChips((prev) => [...prev, lastDeleted]);
    }
  };

  const handleAllergyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key adds the chip
    if (e.key === 'Enter') {
      e.preventDefault();
      addAllergyChip(allergyInput);
    }
    // Backspace on empty input removes last chip
    else if (e.key === 'Backspace' && allergyInput === '' && allergyChips.length > 0) {
      removeAllergyChip(allergyChips.length - 1);
    }
    // Ctrl+Z / Cmd+Z to undo deleted chip
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undoDeleteChip();
    }
  };

  // Save Vitals to Database via API
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setIsSaving(true);

    const vitalsPayload = {
      bpSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic) : undefined,
      bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic) : undefined,
      heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      spo2: formData.spo2 ? parseInt(formData.spo2) : undefined,
      bloodSugar: formData.bloodSugar ? parseInt(formData.bloodSugar) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      bmi: calculatedBMI || undefined,
      triagePriority: formData.triagePriority,
      notes: formData.notes,
    };

    try {
      // Persist to Neon Postgres DB via /api/encounters
      const res = await fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedPatient.appointmentId,
          patientId: selectedPatient.patientId || selectedPatient.id,
          doctorId: selectedPatient.doctorId,
          vitalsJson: vitalsPayload,
          allergies: allergyChips,
          chiefComplaint: formData.notes || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save vitals to database');
      }

      // Update state locally
      const updatedPatients = patients.map((p) => {
        if (p.id === selectedPatient.id) {
          return {
            ...p,
            status: 'VITALS_DONE' as const,
            triagePriority: formData.triagePriority,
            allergies: allergyChips,
            chiefComplaint: formData.notes,
            vitals: {
              ...vitalsPayload,
              recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          };
        }
        return p;
      });

      setPatients(updatedPatients);
      setIsDrawerOpen(false);
      setSelectedPatient(null);
      setSaveSuccessMsg(`Vitals & Triage saved successfully to database for ${selectedPatient.name}!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving vitals to database. Please check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToDoctor = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status: 'IN_CONSULTATION' } : p))
    );
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* SUCCESS TOAST NOTIFICATION */}
      {saveSuccessMsg && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-2 bg-[#0d6157] text-white px-4 py-2.5 rounded-[8px] shadow-lg border border-[#0d6157]/40 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Clinical Nursing &amp; Triage</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <HeartPulse className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Nurse Clinical Station</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            On Duty: <span className="font-semibold text-slate-700 dark:text-slate-200">{nurseName}</span> • Patient triage, live vital signs recording, and physician prep.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Waiting */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider whitespace-nowrap">
              Waiting in Triage
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.waitingCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block whitespace-nowrap">
                Requires Vitals
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 2: Recorded Today */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Vitals Recorded
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.recordedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block whitespace-nowrap">
                Ready for Doctor
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <ClipboardCheck className="size-4" />
          </div>
        </div>

        {/* Card 3: Urgent */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider whitespace-nowrap">
              Urgent Cases
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.urgentCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-200/80 dark:border-rose-900/50 inline-block whitespace-nowrap">
                Priority Triage
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        {/* Card 4: Allergy & High Alerts */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider whitespace-nowrap">
              Allergy Alerts
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.highAlertCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-purple-200/80 dark:border-purple-900/50 inline-block whitespace-nowrap">
                Flagged for Physician
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-purple-50/90 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-900/50 shadow-2xs">
            <BadgeAlert className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR ROW (TABS & SEARCH) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {[
            { id: 'QUEUE', label: `Waiting Queue (${stats.waitingCount})` },
            { id: 'RECORDED', label: `Recorded Vitals (${stats.recordedCount})` },
            { id: 'ALL', label: `All Patients Today (${patients.length})` },
            { id: 'HISTORY', label: `Clinical History` },
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

        <div className="flex items-center gap-2.5">
          {activeTab !== 'HISTORY' && (
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#0d6157] cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          )}

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

      {/* 4. MAIN CONTENT (HISTORY VIEW OR DATA TABLE) */}
      {activeTab === 'HISTORY' ? (
        <div className="w-full flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/50 dark:bg-slate-950 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Panel: Patient List for Clinical History */}
          <div className="w-full md:w-80 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Select Patient ({filteredPatients.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPatients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No matching patients found.
                </div>
              ) : (
                filteredPatients.map((p) => {
                  const isSelected = (selectedHistoryPatient?.id || filteredPatients[0]?.id) === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedHistoryPatient(p)}
                      className={cn(
                        'p-3 transition-colors cursor-pointer flex items-center justify-between gap-2',
                        isSelected
                          ? 'bg-[#e6f6f3] dark:bg-[#0d6157]/20 border-l-4 border-l-[#0d6157]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          MRN #{p.fileNumber || '---'} • {p.phone}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {p.status === 'VITALS_DONE' ? 'Vitals Ready' : 'In Triage'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Selected Patient's Clinical Dossier */}
          <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto min-h-0">
            {(() => {
              const currentP = selectedHistoryPatient || filteredPatients[0];
              if (!currentP) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <FileText className="size-10 mb-2 opacity-40 text-[#0d6157]" />
                    <p className="font-semibold text-sm">No Patient Selected</p>
                    <p className="text-xs text-slate-400 mt-1">Please select a patient on the left to view clinical history.</p>
                  </div>
                );
              }

              const hasVitals = !!(currentP.vitals?.bpSystolic || currentP.vitals?.heartRate || currentP.vitals?.temperature);

              return (
                <div className="max-w-4xl space-y-6">
                  {/* Dossier Header */}
                  <div className="p-4 rounded-xl bg-[#f8fcfa] dark:bg-slate-800/60 border border-[#0d8276]/20 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="size-12 rounded-xl bg-[#0d6157] text-white font-black text-base flex items-center justify-center shadow-xs">
                        {currentP.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {currentP.name}
                          </h2>
                          <span className="font-mono text-xs font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/30 px-2.5 py-0.5 rounded-[6px] border border-[#0d8276]/20">
                            MRN #{currentP.fileNumber || '---'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          📞 {currentP.phone} {currentP.gender ? `• Gender: ${currentP.gender}` : ''} • Physician: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentP.doctorName || 'General OPD'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenVitalsDrawer(currentP)}
                      className="px-4 py-2 bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs font-bold rounded-[8px] shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <HeartPulse className="size-4" />
                      <span>{hasVitals ? 'Update Vitals & Triage' : 'Record New Vitals'}</span>
                    </button>
                  </div>

                  {/* Allergy Alerts Box */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                      <BadgeAlert className="size-4 text-purple-600" />
                      <span>Known Allergies &amp; Clinical Warnings</span>
                    </div>
                    {currentP.allergies && currentP.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {currentP.allergies.map((allergy, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-[6px] text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200"
                          >
                            ⚠️ {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No known drug or food allergies recorded (NKDA).
                      </p>
                    )}
                  </div>

                  {/* Latest Vitals Matrix */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="size-4 text-[#0d6157]" />
                      <span>Recorded Vital Signs &amp; Triage Measurements</span>
                    </h3>

                    {hasVitals ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Blood Pressure
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                            {currentP.vitals?.bpSystolic}/{currentP.vitals?.bpDiastolic || '--'} <span className="text-xs font-normal text-slate-500">mmHg</span>
                          </span>
                          {currentP.vitals?.bpSystolic && (
                            <span className={cn(
                              'inline-block text-[10px] font-semibold px-2 py-0.2 rounded mt-1',
                              currentP.vitals.bpSystolic >= 140 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            )}>
                              {currentP.vitals.bpSystolic >= 140 ? 'Stage 2 HTN' : 'Normal BP'}
                            </span>
                          )}
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Heart Rate / Pulse
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                            {currentP.vitals?.heartRate || '--'} <span className="text-xs font-normal text-slate-500">BPM</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Resting rhythm</span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Body Temperature
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                            {currentP.vitals?.temperature || '--'} <span className="text-xs font-normal text-slate-500">°C</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Oral / Axillary</span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Oxygen Saturation (SpO2)
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                            {currentP.vitals?.spo2 || '--'} <span className="text-xs font-normal text-slate-500">%</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Room air</span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Blood Glucose (Sugar)
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                            {currentP.vitals?.bloodSugar || '--'} <span className="text-xs font-normal text-slate-500">mg/dL</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Random / Fasting</span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Height &amp; Weight (BMI)
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                            {currentP.vitals?.bmi ? `${currentP.vitals.bmi} BMI` : '--'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {currentP.vitals?.height ? `${currentP.vitals.height}cm` : ''} {currentP.vitals?.weight ? `• ${currentP.vitals.weight}kg` : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        No vital signs recorded for today yet. Click "Record New Vitals" to input measurements.
                      </div>
                    )}
                  </div>

                  {/* Triage Notes & Chief Complaint */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="size-4 text-[#0d6157]" />
                        <span>Chief Complaint &amp; Nurse Triage Notes</span>
                      </span>
                      {currentP.vitals?.recordedAt && (
                        <span className="text-[11px] text-slate-400">
                          Recorded at {currentP.vitals.recordedAt}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {currentP.vitals?.notes || currentP.chiefComplaint || 'No clinical notes added.'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* 4B. MAIN DATA TABLE SECTION (SINGLE-LINE CLEAN FORMATTING) */
        <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5 whitespace-nowrap">PATIENT / FILE NO</th>
                  <th className="py-3 px-5 whitespace-nowrap">TRIAGE PRIORITY</th>
                  <th className="py-3 px-5 whitespace-nowrap">DOCTOR / SERVICE</th>
                  <th className="py-3 px-5 whitespace-nowrap">LATEST VITALS SUMMARY</th>
                  <th className="py-3 px-5 whitespace-nowrap">ALLERGIES / ALERTS</th>
                  <th className="py-3 px-5 whitespace-nowrap">STATUS</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <HeartPulse className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No patients found in this queue</p>
                      <p className="text-xs text-slate-400 mt-0.5">Checked-in patients from reception will appear here immediately</p>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const hasVitals = !!(patient.vitals?.bpSystolic || patient.vitals?.heartRate || patient.vitals?.temperature);
                    const hasAllergies = patient.allergies && patient.allergies.length > 0;

                    return (
                      <tr key={patient.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* 1. Patient Info */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-[8px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shrink-0">
                              {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap flex items-center gap-1.5">
                                <span>{patient.name}</span>
                                {patient.gender && (
                                  <span className="text-[10px] font-normal text-slate-400">({patient.gender})</span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                                MRN #{patient.fileNumber || '---'} • {patient.phone}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Priority */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {patient.triagePriority === 'EMERGENCY' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-rose-600 text-white animate-pulse whitespace-nowrap">
                              <AlertTriangle className="size-3" /> Emergency
                            </span>
                          ) : patient.triagePriority === 'URGENT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-500 text-white whitespace-nowrap">
                              <Clock className="size-3" /> Urgent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                              Routine
                            </span>
                          )}
                        </td>

                        {/* 3. Doctor / Service */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {patient.doctorName || 'General OPD'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {patient.serviceName || 'Consultation'}{patient.timeSlot ? ` • ${patient.timeSlot}` : ''}
                          </p>
                        </td>

                        {/* 4. Latest Vitals Summary */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {hasVitals ? (
                            <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                              {patient.vitals?.bpSystolic && (
                                <span className={cn(
                                  'px-2 py-0.5 rounded-[6px] text-[11px] font-bold border whitespace-nowrap',
                                  patient.vitals.bpSystolic >= 140
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                )}>
                                  BP: {patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic || '--'}
                                </span>
                              )}
                              {patient.vitals?.heartRate && (
                                <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap">
                                  HR: {patient.vitals.heartRate} bpm
                                </span>
                              )}
                              {patient.vitals?.spo2 && (
                                <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap">
                                  SpO2: {patient.vitals.spo2}%
                                </span>
                              )}
                              {patient.vitals?.temperature && (
                                <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap">
                                  {patient.vitals.temperature}°C
                                </span>
                              )}
                              {patient.vitals?.bmi && (
                                <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700 whitespace-nowrap">
                                  BMI {patient.vitals.bmi}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic whitespace-nowrap">
                              Pending Vitals Intake
                            </span>
                          )}
                        </td>

                        {/* 5. Allergies / Alerts */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {hasAllergies ? (
                            <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap overflow-x-auto max-w-[220px]">
                              {patient.allergies?.map((allergy, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-[6px] text-[10.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/40 whitespace-nowrap shrink-0"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">No known allergies</span>
                          )}
                        </td>

                        {/* 6. Status */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {patient.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                              <Check className="size-3" /> Completed
                            </span>
                          ) : patient.status === 'IN_CONSULTATION' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-teal-50 text-[#0d5c56] dark:bg-[#0d6157]/30 dark:text-teal-300 border border-[#0d8276]/30 whitespace-nowrap">
                              <Stethoscope className="size-3 text-[#0d8276]" /> With Doctor
                            </span>
                          ) : patient.status === 'VITALS_DONE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/30 dark:text-teal-300 border border-[#0d8276]/30 whitespace-nowrap">
                              <CheckCircle2 className="size-3 text-[#0d8276]" /> Vitals Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                              <Clock className="size-3" /> In Queue
                            </span>
                          )}
                        </td>

                        {/* 7. Action Button */}
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenVitalsDrawer(patient)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-2xs transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02]"
                            >
                              <HeartPulse className="size-3.5" />
                              <span>{hasVitals ? 'Edit Vitals' : 'Record Vitals'}</span>
                            </button>

                            {patient.status === 'VITALS_DONE' && (
                              <button
                                onClick={() => handleSendToDoctor(patient.id)}
                                title="Call into Doctor's Office"
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800/40 border border-emerald-200 rounded-[8px] transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <ArrowRight className="size-3.5" />
                                <span>Call In</span>
                              </button>
                            )}
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
      )}

      {/* ========================================================================= */}
      {/* 5. SLIDE-OVER RIGHT DRAWER FOR RECORDING VITALS & TRIAGE */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => !isSaving && setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl sm:max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[8px] bg-[#0d6157]/10 dark:bg-teal-950/60 border border-[#0d6157]/30 text-[#0d6157] dark:text-teal-400 flex items-center justify-center font-bold">
                    <HeartPulse className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Record Patient Vitals &amp; Triage
                    </h2>
                    {selectedPatient && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Patient: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.name}</span> (MRN #{selectedPatient.fileNumber || '---'}) • Assigned to {selectedPatient.doctorName || 'Physician'}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  disabled={isSaving}
                  className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Drawer Body (Scrollable Form) */}
              <form id="vitals-drawer-form" onSubmit={handleSaveVitals} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* 1. Triage Priority Selector */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-[8px] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Triage Priority Level
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Determines doctor queue sorting</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['NORMAL', 'URGENT', 'EMERGENCY'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setFormData({ ...formData, triagePriority: p })}
                        className={cn(
                          'py-2 px-3 text-xs font-bold rounded-[8px] border transition-all cursor-pointer text-center',
                          formData.triagePriority === p
                            ? p === 'EMERGENCY'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : p === 'URGENT'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-[#0d6157] text-white border-[#0d6157] shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                        )}
                      >
                        {p === 'EMERGENCY' ? '🚨 Emergency' : p === 'URGENT' ? '⚠️ Urgent' : '✅ Routine / Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Vital Signs Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Activity className="size-3.5 text-[#0d6157]" />
                      <span>Objective Vital Signs</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        BP Systolic (mmHg)
                      </label>
                      <input
                        type="number"
                        placeholder="120"
                        value={formData.bpSystolic}
                        onChange={(e) => setFormData({ ...formData, bpSystolic: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        BP Diastolic (mmHg)
                      </label>
                      <input
                        type="number"
                        placeholder="80"
                        value={formData.bpDiastolic}
                        onChange={(e) => setFormData({ ...formData, bpDiastolic: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Pulse (BPM)
                      </label>
                      <input
                        type="number"
                        placeholder="75"
                        value={formData.heartRate}
                        onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        SpO2 (%)
                      </label>
                      <input
                        type="number"
                        placeholder="98"
                        value={formData.spo2}
                        onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Temp (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="36.8"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        placeholder="105"
                        value={formData.bloodSugar}
                        onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="172"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="70"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Real-Time Clinical Interpretation (BMI & BP Assessment) */}
                {(calculatedBMI || bpRisk) && (
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-[8px]">
                    {bpRisk && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500">BP Analysis:</span>
                        <span className={cn('px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold border', bpRisk.color)}>
                          {bpRisk.label}
                        </span>
                      </div>
                    )}

                    {calculatedBMI && bmiCategory && (
                      <div className="flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-3">
                        <span className="text-[11px] font-bold text-slate-500">BMI:</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{calculatedBMI} kg/m²</span>
                        <span className={cn('px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold border', bmiCategory.color)}>
                          {bmiCategory.label}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Interactive Allergy Tag Chip Manager */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-[8px] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldAlert className="size-4 text-rose-600" />
                      <span>Known Patient Allergies &amp; Drug Sensitivities</span>
                    </label>

                    {deletedChipsHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={undoDeleteChip}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <Undo2 className="size-3" />
                        <span>Undo Delete (Ctrl+Z)</span>
                      </button>
                    )}
                  </div>

                  {/* Active Chips List */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px]">
                    {allergyChips.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No allergy tags added yet. Type below or pick a preset.</span>
                    ) : (
                      allergyChips.map((chip, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300"
                        >
                          <span>{chip}</span>
                          <button
                            type="button"
                            onClick={() => removeAllergyChip(idx)}
                            className="hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer p-0.5"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Tag Input Field with Dedicated "Add" Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={allergyInputRef}
                        type="text"
                        placeholder="Type allergy name (e.g. Amoxicillin, Dust, Iodine) and press Enter..."
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        onKeyDown={handleAllergyKeyDown}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-[#0d6157]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => addAllergyChip(allergyInput)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
                    >
                      <Plus className="size-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Quick Preset Badges */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Quick Add Common Allergies:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_ALLERGIES.map((preset) => {
                        const isAdded = allergyChips.some((c) => c.toLowerCase() === preset.toLowerCase());
                        return (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => {
                              if (isAdded) {
                                const idx = allergyChips.findIndex((c) => c.toLowerCase() === preset.toLowerCase());
                                removeAllergyChip(idx);
                              } else {
                                addAllergyChip(preset);
                              }
                            }}
                            className={cn(
                              'text-[11px] px-2.5 py-1 rounded-[6px] border font-medium transition-colors cursor-pointer flex items-center gap-1',
                              isAdded
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-bold'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            )}
                          >
                            {isAdded ? <Check className="size-3" /> : <Plus className="size-3" />}
                            <span>{preset}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. Clinical Observation / Notes */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nurse Clinical Observation / Patient Complaints
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Patient reports mild headache and dizziness since yesterday. Alert and oriented..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-[#0d6157]"
                  />
                </div>
              </form>

              {/* Drawer Sticky Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-[8px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="vitals-drawer-form"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] disabled:opacity-70 rounded-[8px] shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Save Vitals &amp; Mark Ready</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
