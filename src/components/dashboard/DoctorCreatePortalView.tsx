'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronsLeft,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Save,
  Trash2,
  Check,
  AlertCircle,
  Tag,
  ShieldCheck,
  Users,
  FileText,
  UserCheck,
  X,
  Mail,
  Lock,
  Search,
  ChevronDown,
  Sparkles,
  Image as ImageIcon,
  Flag,
  CalendarDays,
  UserPlus,
} from 'lucide-react';

export interface DoctorCreateProps {
  clinicName?: string;
  timezone?: string;
  availableServices?: Array<{ id: string; name: string }>;
  availableStaff?: Array<{ id: string; name: string; email: string }>;
  backHref?: string;
}

const WEEKDAYS = [
  { num: 1, name: 'Monday', short: 'Mon' },
  { num: 2, name: 'Tuesday', short: 'Tue' },
  { num: 3, name: 'Wednesday', short: 'Wed' },
  { num: 4, name: 'Thursday', short: 'Thu' },
  { num: 5, name: 'Friday', short: 'Fri' },
  { num: 6, name: 'Saturday', short: 'Sat' },
  { num: 7, name: 'Sunday', short: 'Sun' },
];

export function DoctorCreatePortalView({
  clinicName = 'Reveal Skin & Glow Care',
  timezone = 'Asia/Riyadh',
  availableServices: initialServices = [],
  availableStaff: initialStaff = [],
  backHref = '/portal/doctors',
}: DoctorCreateProps) {
  const router = useRouter();
  const [servicesList, setServicesList] = useState(initialServices);
  const [staffList, setStaffList] = useState(initialStaff);

  // Form State
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [slotDuration, setSlotDuration] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [coordinatorId, setCoordinatorId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Status (Only 2 Statuses: ACTIVE & INACTIVE)
  const [doctorStatus, setDoctorStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Schedule Configuration
  const [scheduleMode, setScheduleMode] = useState<'standard' | 'custom'>('standard');
  const [scheduleState, setScheduleState] = useState<
    Record<number, { isWorking: boolean; startMinute: number; endMinute: number }>
  >({
    1: { isWorking: true, startMinute: 540, endMinute: 1020 },
    2: { isWorking: true, startMinute: 540, endMinute: 1020 },
    3: { isWorking: true, startMinute: 540, endMinute: 1020 },
    4: { isWorking: true, startMinute: 540, endMinute: 1020 },
    5: { isWorking: true, startMinute: 540, endMinute: 1020 },
    6: { isWorking: false, startMinute: 540, endMinute: 1020 },
    7: { isWorking: false, startMinute: 540, endMinute: 1020 },
  });

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isNameInvalid = attemptedSubmit && !name.trim();
  const isSpecialtyInvalid = attemptedSubmit && !specialty.trim();

  // Dropdown States
  const [isCoordinatorDropdownOpen, setIsCoordinatorDropdownOpen] = useState(false);
  const [coordinatorSearch, setCoordinatorSearch] = useState('');
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  // Refs for Outside Click Handling
  const coordinatorRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  // Outside Click Listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (coordinatorRef.current && !coordinatorRef.current.contains(event.target as Node)) {
        setIsCoordinatorDropdownOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal States for Coordinator & Service Creation
  const [isAddCoordinatorModalOpen, setIsAddCoordinatorModalOpen] = useState(false);
  const [newCoordName, setNewCoordName] = useState('');
  const [newCoordEmail, setNewCoordEmail] = useState('');
  const [newCoordPassword, setNewCoordPassword] = useState('');
  const [isCreatingCoord, setIsCreatingCoord] = useState(false);

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [isCreatingService, setIsCreatingService] = useState(false);

  const minuteToTimeStr = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const timeStrToMinute = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Filtered Coordinators
  const filteredStaff = useMemo(() => {
    if (!coordinatorSearch.trim()) return staffList;
    const q = coordinatorSearch.toLowerCase();
    return staffList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [staffList, coordinatorSearch]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return servicesList;
    const q = serviceSearch.toLowerCase();
    return servicesList.filter((s) => s.name.toLowerCase().includes(q));
  }, [servicesList, serviceSearch]);

  const selectedCoordObject = staffList.find((s) => s.id === coordinatorId);

  // Modal Coordinator Create Handler
  const handleModalCreateCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoordName.trim() || !newCoordEmail.trim()) return;

    setIsCreatingCoord(true);
    try {
      const res = await fetch('/api/coordinators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCoordName.trim(),
          email: newCoordEmail.trim(),
          password: newCoordPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.coordinator) {
        setStaffList([data.coordinator, ...staffList]);
        setCoordinatorId(data.coordinator.id);
        setIsAddCoordinatorModalOpen(false);
        setNewCoordName('');
        setNewCoordEmail('');
        setNewCoordPassword('');
      }
    } catch (err) {
      console.error('Failed to create coordinator:', err);
    } finally {
      setIsCreatingCoord(false);
    }
  };

  // Modal Service Create Handler
  const handleModalCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setIsCreatingService(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServiceName.trim(),
          durationMinutes: Number(newServiceDuration),
          isActive: true,
          doctorIds: [],
        }),
      });
      const data = await res.json();
      if (data.ok && data.service) {
        const createdSrv = { id: data.service.id, name: data.service.name };
        setServicesList([createdSrv, ...servicesList]);
        setSelectedServiceIds([...selectedServiceIds, data.service.id]);
        setIsAddServiceModalOpen(false);
        setNewServiceName('');
      }
    } catch (err) {
      console.error('Failed to create service:', err);
    } finally {
      setIsCreatingService(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setErrorMsg('');

    if (!name.trim() || !specialty.trim()) {
      return;
    }

    setIsSubmitting(true);
    const activeSchedules: Array<{ weekday: number; startMinute: number; endMinute: number }> = [];
    Object.entries(scheduleState).forEach(([day, cfg]) => {
      if (cfg.isWorking) {
        activeSchedules.push({
          weekday: Number(day),
          startMinute: cfg.startMinute,
          endMinute: cfg.endMinute,
        });
      }
    });

    const isDoctorActive = doctorStatus === 'ACTIVE';

    const payload = {
      name: name.trim(),
      specialty: specialty.trim() || undefined,
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      description: description.trim() || undefined,
      isActive: isDoctorActive,
      appointmentMinutes: Number(slotDuration),
      bufferMinutes: Number(bufferMinutes),
      coordinatorId: coordinatorId || undefined,
      serviceIds: selectedServiceIds,
      schedules: activeSchedules,
      breaks: [],
    };

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.doctor) {
        router.push(`/portal/doctors/${data.doctor.id}`);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Failed to create doctor.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* 1. FIXED TOP HEADER — shrink-0 keeps it pinned, never scrolls */}
      <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 shadow-sm z-30">
        {/* Left Breadcrumbs: << 🩺 [Clinic Name] / Doctors / Create */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={backHref}
            className="p-1 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Back to Doctors"
          >
            <ChevronsLeft className="size-4" />
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
            <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Stethoscope className="size-4 text-blue-600" />
              <span>{clinicName}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <Link href="/portal/doctors" className="hover:text-blue-600 hover:underline">
              Doctors
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Create</span>
          </div>
        </div>

        {/* Right Action Controls: Discard / Close */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={backHref}
            className="px-3 py-1.5 rounded-[8px] border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <X className="size-3.5 text-slate-400" />
            <span>Discard</span>
          </Link>

          <Link
            href={backHref}
            className="p-1.5 rounded-[8px] border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN BODY — flex-1 min-h-0 overflow-hidden so only columns scroll */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {/* ========================================================= */}
        {/* LEFT COLUMN: DOCTOR FORM (~70% width) — own scroll        */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 min-h-0">
          {/* Section Header: 📄 Doctor Details & Profile */}
          <div className="flex items-center gap-2">
            <FileText className="size-4.5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Doctor Details &amp; Profile
            </h2>
          </div>

          <div className="space-y-5">
            {/* ROW 1: Doctor Name & Specialty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Doctor Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Al-Otaibi"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  className={`w-full bg-white dark:bg-slate-800 border rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                    isNameInvalid
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Specialty Free-Text Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Specialty / Professional Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Consultant Dermatologist"
                  value={specialty}
                  onChange={(e) => {
                    setSpecialty(e.target.value);
                  }}
                  className={`w-full bg-white dark:bg-slate-800 border rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                    isSpecialtyInvalid
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* ROW 2: Login Credentials (Email & Password) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Doctor Login Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Doctor Login Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Defaults to Doctor123!"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* ROW 3: Slot Duration & Buffer Gap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Per-Doctor Slot Duration <span className="text-rose-500">*</span>
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono cursor-pointer"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes (Standard)</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (1 Hour)</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Buffer Gap After Appointments
                </label>
                <select
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono cursor-pointer"
                >
                  <option value={0}>0 minutes (No gap)</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                </select>
              </div>
            </div>

            {/* ROW 4: Coordinator & Services Dropdowns with z-30 stacking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-30">
              {/* Assigned Coordinator */}
              <div ref={coordinatorRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Clinic Coordinator
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCoordinatorDropdownOpen(!isCoordinatorDropdownOpen);
                    setIsServicesDropdownOpen(false);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <span className="flex items-center gap-2 truncate text-slate-500 dark:text-slate-400">
                    <Search className="size-3.5 text-slate-400 shrink-0" />
                    <span className={selectedCoordObject ? 'text-slate-900 dark:text-white font-medium' : ''}>
                      {selectedCoordObject ? selectedCoordObject.name : 'Select or create coordinator...'}
                    </span>
                  </span>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0 ml-1" />
                </button>

                {isCoordinatorDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-2xl z-50 p-2.5 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search coordinator..."
                        value={coordinatorSearch}
                        onChange={(e) => setCoordinatorSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8 pr-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
                      <div
                        onClick={() => {
                          setCoordinatorId('');
                          setIsCoordinatorDropdownOpen(false);
                        }}
                        className={`p-2 rounded-[8px] cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          coordinatorId === ''
                            ? 'bg-blue-50/80 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-xs">None</span>
                        {coordinatorId === '' && <Check className="size-3.5 text-blue-600 shrink-0" />}
                      </div>

                      {filteredStaff.map((staff) => {
                        const isSel = coordinatorId === staff.id;
                        return (
                          <div
                            key={staff.id}
                            onClick={() => {
                              setCoordinatorId(staff.id);
                              setIsCoordinatorDropdownOpen(false);
                            }}
                            className={`p-2 rounded-[8px] cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                              isSel
                                ? 'bg-blue-50/80 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-xs truncate">{staff.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {staff.email}
                              </div>
                            </div>
                            {isSel && <Check className="size-3.5 text-blue-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Button opens Add Coordinator Modal */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCoordinatorDropdownOpen(false);
                          setIsAddCoordinatorModalOpen(true);
                        }}
                        className="w-full py-1.5 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-[8px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3.5" />
                        <span>+ Create New Coordinator</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Assigned Services */}
              <div ref={servicesRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Clinical Services Offered ({selectedServiceIds.length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsServicesDropdownOpen(!isServicesDropdownOpen);
                    setIsCoordinatorDropdownOpen(false);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <span className="flex items-center gap-2 truncate text-slate-500 dark:text-slate-400">
                    <Search className="size-3.5 text-slate-400 shrink-0" />
                    <span className={selectedServiceIds.length > 0 ? 'text-slate-900 dark:text-white font-medium' : ''}>
                      {selectedServiceIds.length === 0
                        ? 'Select or create services...'
                        : `${selectedServiceIds.length} services selected`}
                    </span>
                  </span>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0 ml-1" />
                </button>

                {isServicesDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-2xl z-50 p-2.5 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8 pr-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                      {filteredServices.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-2 text-center">No services found.</p>
                      ) : (
                        filteredServices.map((srv) => {
                          const checked = selectedServiceIds.includes(srv.id);
                          return (
                            <div
                              key={srv.id}
                              onClick={() => {
                                if (checked) {
                                  setSelectedServiceIds(
                                    selectedServiceIds.filter((id) => id !== srv.id)
                                  );
                                } else {
                                  setSelectedServiceIds([...selectedServiceIds, srv.id]);
                                }
                              }}
                              className={`flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-blue-50/80 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`size-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                    checked
                                      ? 'bg-blue-600 text-white ring-2 ring-blue-500/20'
                                      : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                  }`}
                                >
                                  {checked && <Check className="size-2.5 stroke-[3]" />}
                                </div>
                                <span className="text-xs truncate">{srv.name}</span>
                              </div>
                              {checked && <Check className="size-3.5 text-blue-600 shrink-0" />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Button opens Add Service Modal */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsServicesDropdownOpen(false);
                          setIsAddServiceModalOpen(true);
                        }}
                        className="w-full py-1.5 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-[8px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3.5" />
                        <span>+ Create New Service</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 5: Working Schedule */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                {/* Standard Hours Option */}
                <div
                  onClick={() => setScheduleMode('standard')}
                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none group"
                >
                  <div
                    className={`size-4 rounded-full flex items-center justify-center border transition-all ${
                      scheduleMode === 'standard'
                        ? 'border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400'
                    }`}
                  >
                    {scheduleMode === 'standard' && (
                      <div className="size-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <span className={`font-medium ${scheduleMode === 'standard' ? 'text-slate-900 dark:text-white font-semibold' : ''}`}>
                    Standard Working Hours (Mon–Fri 09:00 AM – 05:00 PM)
                  </span>
                </div>

                {/* Custom Hours Option */}
                <div
                  onClick={() => setScheduleMode('custom')}
                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none group"
                >
                  <div
                    className={`size-4 rounded-full flex items-center justify-center border transition-all ${
                      scheduleMode === 'custom'
                        ? 'border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400'
                    }`}
                  >
                    {scheduleMode === 'custom' && (
                      <div className="size-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <span className={`font-medium ${scheduleMode === 'custom' ? 'text-slate-900 dark:text-white font-semibold' : ''}`}>
                    Customize weekly hours &amp; daily shifts
                  </span>
                </div>
              </div>

              {scheduleMode === 'custom' && (
                <div className="bg-white dark:bg-slate-900/80 rounded-[12px] border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in duration-150 overflow-hidden">
                  {WEEKDAYS.map((day) => {
                    const cfg = scheduleState[day.num] || {
                      isWorking: false,
                      startMinute: 540,
                      endMinute: 1020,
                    };

                    return (
                      <div
                        key={day.num}
                        className={`flex items-center justify-between px-4 py-3 transition-colors ${
                          cfg.isWorking
                            ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Day Label with Circular Checkbox */}
                        <div
                          className="flex items-center gap-3 cursor-pointer select-none group"
                          onClick={() =>
                            setScheduleState({
                              ...scheduleState,
                              [day.num]: { ...cfg, isWorking: !cfg.isWorking },
                            })
                          }
                        >
                          <div
                            className={`size-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              cfg.isWorking
                                ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-500/20'
                                : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                            }`}
                          >
                            {cfg.isWorking && <Check className="size-3 stroke-[3]" />}
                          </div>

                          <span
                            className={`text-xs font-semibold tracking-tight transition-colors ${
                              cfg.isWorking
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                            }`}
                          >
                            {day.name}
                          </span>
                        </div>

                        {/* Working Hours Time Inputs or Day Off Label */}
                        {cfg.isWorking ? (
                          <div className="flex items-center gap-2">
                            {/* Start Time Pill */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                              <input
                                type="time"
                                value={minuteToTimeStr(cfg.startMinute)}
                                onChange={(e) =>
                                  setScheduleState({
                                    ...scheduleState,
                                    [day.num]: {
                                      ...cfg,
                                      startMinute: timeStrToMinute(e.target.value),
                                    },
                                  })
                                }
                                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none font-medium cursor-pointer"
                              />
                              <Clock className="size-3.5 text-slate-400 shrink-0 pointer-events-none" />
                            </div>

                            <span className="text-slate-400 text-xs font-medium px-0.5">to</span>

                            {/* End Time Pill */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                              <input
                                type="time"
                                value={minuteToTimeStr(cfg.endMinute)}
                                onChange={(e) =>
                                  setScheduleState({
                                    ...scheduleState,
                                    [day.num]: {
                                      ...cfg,
                                      endMinute: timeStrToMinute(e.target.value),
                                    },
                                  })
                                }
                                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none font-medium cursor-pointer"
                              />
                              <Clock className="size-3.5 text-slate-400 shrink-0 pointer-events-none" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-xs font-normal px-2">
                            Day Off
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ROW 6: Bio & Description */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Doctor Bio &amp; Qualifications</span>
              </h3>

              <textarea
                rows={4}
                placeholder="Doctor credentials, medical education, certifications, and clinical background..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR: ONLY 2 STATUSES (ACTIVE / INACTIVE)        */}
        {/* ========================================================= */}
        <div className="w-full lg:w-80 overflow-y-auto p-6 space-y-6 bg-slate-50/40 dark:bg-slate-900/40 shrink-0 min-h-0">
          {/* 1. Status Section (Only Active & Inactive) */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Active */}
              <button
                type="button"
                onClick={() => setDoctorStatus('ACTIVE')}
                className={`px-3 py-2 rounded-[8px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  doctorStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="size-2 rounded-full bg-emerald-500"></span>
                <span>Active</span>
              </button>

              {/* Inactive */}
              <button
                type="button"
                onClick={() => setDoctorStatus('INACTIVE')}
                className={`px-3 py-2 rounded-[8px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  doctorStatus === 'INACTIVE'
                    ? 'bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="size-2 rounded-full bg-slate-400"></span>
                <span>Inactive</span>
              </button>
            </div>
          </div>

          {/* Booking Channel Info Card */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3.5 rounded-[8px] bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-blue-600" />
                <span>WhatsApp AI Booking</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When saved, Dr. {name || 'Doctor'} will be registered in {clinicName} ({timezone}) and offered to patients for matching services.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FIXED BOTTOM FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 px-6 py-3 flex items-center justify-between gap-4 shadow-xs z-30">
        <Link
          href={backHref}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          ← Back to Doctors List
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href={backHref}
            className="px-4 py-1.5 rounded-[8px] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            <Save className="size-3.5" />
            <span>{isSubmitting ? 'Creating Doctor...' : 'Create Doctor'}</span>
          </button>
        </div>
      </footer>

      {/* 4. MODAL: ADD COORDINATOR */}
      {isAddCoordinatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="size-4 text-emerald-600" />
                <span>Add Clinic Coordinator</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCoordinatorModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleModalCreateCoordinator} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Coordinator Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sara Ahmed"
                  value={newCoordName}
                  onChange={(e) => setNewCoordName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sara@example.com"
                  value={newCoordEmail}
                  onChange={(e) => setNewCoordEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  placeholder="Defaults to ClinicStaff123!"
                  value={newCoordPassword}
                  onChange={(e) => setNewCoordPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCoordinatorModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCoord}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isCreatingCoord ? 'Creating...' : 'Create Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADD SERVICE */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="size-4 text-purple-600" />
                <span>Create New Clinic Service</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleModalCreateService} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydrafacial & Deep Cleansing"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Duration (Minutes) *
                </label>
                <select
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (1h)</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingService}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isCreatingService ? 'Creating...' : 'Create & Link Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
