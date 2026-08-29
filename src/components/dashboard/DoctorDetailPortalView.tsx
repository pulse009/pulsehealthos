'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Stethoscope,
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
  Building2,
  Users,
  Info,
  CalendarOff,
  UserCheck,
  X,
  Mail,
  Lock,
  Search,
  ChevronDown,
} from 'lucide-react';

export interface DoctorDetailProps {
  doctor: {
    id: string;
    clinicId: string;
    name: string;
    specialty: string | null;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    appointmentMinutes: number | null;
    bufferMinutes: number | null;
    coordinatorId: string | null;
    coordinator?: { id: string; name: string; email: string } | null;
    clinic: { id: string; name: string; timezone: string };
    services: Array<{
      serviceId: string;
      service: { id: string; name: string; durationMinutes: number; isActive: boolean };
    }>;
    schedules: Array<{
      weekday: number;
      startMinute: number;
      endMinute: number;
    }>;
    breaks: Array<{
      weekday: number;
      startMinute: number;
      endMinute: number;
      label: string | null;
    }>;
    timeOff: Array<{
      id: string;
      reason: string | null;
      startDate: string;
      endDate: string;
      startMinute: number | null;
      endMinute: number | null;
    }>;
    appointments: Array<{
      id: string;
      appointmentNumber?: number | null;
      startsAt: string;
      status: string;
      timezone: string;
      service: { name: string };
      patient: { id: string; name: string | null; phone: string; fileNumber: number | null };
    }>;
    _count?: { appointments: number };
  };
  availableServices?: Array<{ id: string; name: string }>;
  availableStaff?: Array<{ id: string; name: string; email: string }>;
  backHref?: string;
}

export function DoctorDetailPortalView({
  doctor: initialDoctor,
  availableServices: initialServices = [],
  availableStaff: initialStaff = [],
  backHref = '/portal/doctors',
}: DoctorDetailProps) {
  const [doctor, setDoctor] = useState(initialDoctor);
  const [staffList, setStaffList] = useState(initialStaff);
  const [servicesList, setServicesList] = useState(initialServices);

  const [activeTab, setActiveTab] = useState<
    'schedule' | 'blocked' | 'services' | 'appointments' | 'overview' | 'coordinator'
  >('schedule');

  // Master & Profile Form State (Fully editable by Clinic Owner)
  const [doctorName, setDoctorName] = useState(doctor.name);
  const [doctorSpecialty, setDoctorSpecialty] = useState(doctor.specialty || '');
  const [doctorDescription, setDoctorDescription] = useState(doctor.description || '');
  const [doctorImageUrl, setDoctorImageUrl] = useState(doctor.imageUrl || '');

  // Operational Settings Form State
  const [isActive, setIsActive] = useState(doctor.isActive);
  const [slotDuration, setSlotDuration] = useState<number>(doctor.appointmentMinutes || 30);
  const [bufferMinutes, setBufferMinutes] = useState<number>(doctor.bufferMinutes || 0);
  const [coordinatorId, setCoordinatorId] = useState<string>(doctor.coordinatorId || '');
  const [coordinatorSearch, setCoordinatorSearch] = useState('');

  // Schedule Form State (Weekdays 1 to 7)
  const [scheduleState, setScheduleState] = useState<
    Record<number, { isWorking: boolean; startMinute: number; endMinute: number }>
  >(() => {
    const map: Record<number, { isWorking: boolean; startMinute: number; endMinute: number }> = {
      1: { isWorking: false, startMinute: 540, endMinute: 1020 },
      2: { isWorking: false, startMinute: 540, endMinute: 1020 },
      3: { isWorking: false, startMinute: 540, endMinute: 1020 },
      4: { isWorking: false, startMinute: 540, endMinute: 1020 },
      5: { isWorking: false, startMinute: 540, endMinute: 1020 },
      6: { isWorking: false, startMinute: 540, endMinute: 1020 },
      7: { isWorking: false, startMinute: 540, endMinute: 1020 },
    };
    doctor.schedules.forEach((s) => {
      map[s.weekday] = { isWorking: true, startMinute: s.startMinute, endMinute: s.endMinute };
    });
    return map;
  });

  // Services Selection State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    doctor.services.map((s) => s.serviceId)
  );

  // Time-Off / Blocked Periods State
  const [timeOffList, setTimeOffList] = useState(doctor.timeOff);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [newBlockedReason, setNewBlockedReason] = useState('Leave');
  const [newBlockedStartDate, setNewBlockedStartDate] = useState('');
  const [newBlockedEndDate, setNewBlockedEndDate] = useState('');
  const [newBlockedStartHour, setNewBlockedStartHour] = useState('');
  const [newBlockedEndHour, setNewBlockedEndHour] = useState('');

  // Add Coordinator Modal State
  const [isAddCoordinatorModalOpen, setIsAddCoordinatorModalOpen] = useState(false);
  const [isSubmittingCoordinator, setIsSubmittingCoordinator] = useState(false);
  const [newCoordinatorName, setNewCoordinatorName] = useState('');
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState('');
  const [newCoordinatorPassword, setNewCoordinatorPassword] = useState('');

  // Add Service Modal State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);

  // UI Save Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Weekdays Helper
  const WEEKDAYS = [
    { num: 1, name: 'Monday' },
    { num: 2, name: 'Tuesday' },
    { num: 3, name: 'Wednesday' },
    { num: 4, name: 'Thursday' },
    { num: 5, name: 'Friday' },
    { num: 6, name: 'Saturday' },
    { num: 7, name: 'Sunday' },
  ];

  const minuteToTimeStr = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const timeStrToMinute = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Filtered Coordinators for selection list
  const filteredStaff = useMemo(() => {
    if (!coordinatorSearch.trim()) return staffList;
    const q = coordinatorSearch.toLowerCase();
    return staffList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [staffList, coordinatorSearch]);

  // Save All Settings (Profile + Schedule + Services + Coordinator)
  const handleSaveOperational = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

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

    const payload = {
      name: doctorName.trim(),
      specialty: doctorSpecialty.trim() || undefined,
      description: doctorDescription.trim() || undefined,
      imageUrl: doctorImageUrl.trim() || undefined,
      isActive,
      appointmentMinutes: Number(slotDuration),
      bufferMinutes: Number(bufferMinutes),
      coordinatorId: coordinatorId || null,
      serviceIds: selectedServiceIds,
      schedules: activeSchedules,
    };

    try {
      const res = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDoctor((prev) => ({
          ...prev,
          name: doctorName,
          specialty: doctorSpecialty,
          description: doctorDescription,
          imageUrl: doctorImageUrl,
          isActive,
          appointmentMinutes: slotDuration,
          bufferMinutes,
          coordinatorId: coordinatorId || null,
          coordinator: staffList.find((s) => s.id === coordinatorId) || null,
        }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to update doctor settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Blocked Period
  const handleAddBlockedPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedStartDate || !newBlockedEndDate) return;

    const payload: any = {
      reason: newBlockedReason,
      startDate: newBlockedStartDate,
      endDate: newBlockedEndDate,
    };

    if (newBlockedStartHour && newBlockedEndHour) {
      payload.startMinute = timeStrToMinute(newBlockedStartHour);
      payload.endMinute = timeStrToMinute(newBlockedEndHour);
    }

    try {
      const res = await fetch(`/api/doctors/${doctor.id}/blocked-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.timeOff) {
        setTimeOffList([data.timeOff, ...timeOffList]);
        setIsBlockedModalOpen(false);
        setNewBlockedStartDate('');
        setNewBlockedEndDate('');
        setNewBlockedStartHour('');
        setNewBlockedEndHour('');
      }
    } catch (err) {
      console.error('Failed to create blocked period:', err);
    }
  };

  // Delete Blocked Period
  const handleDeleteBlockedPeriod = async (timeOffId: string) => {
    setTimeOffList(timeOffList.filter((t) => t.id !== timeOffId));
    try {
      await fetch(`/api/doctors/${doctor.id}/blocked-periods?id=${timeOffId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete blocked period:', err);
    }
  };

  // Create Coordinator Handler
  const handleCreateCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoordinatorName.trim() || !newCoordinatorEmail.trim()) return;

    setIsSubmittingCoordinator(true);
    try {
      const res = await fetch('/api/coordinators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCoordinatorName.trim(),
          email: newCoordinatorEmail.trim(),
          password: newCoordinatorPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.coordinator) {
        setStaffList([data.coordinator, ...staffList]);
        setCoordinatorId(data.coordinator.id);
        setIsAddCoordinatorModalOpen(false);
        setNewCoordinatorName('');
        setNewCoordinatorEmail('');
        setNewCoordinatorPassword('');
      }
    } catch (err) {
      console.error('Failed to create coordinator:', err);
    } finally {
      setIsSubmittingCoordinator(false);
    }
  };

  // Create Service Handler
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setIsSubmittingService(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServiceName.trim(),
          durationMinutes: Number(newServiceDuration),
          isActive: true,
          doctorIds: [doctor.id],
        }),
      });
      const data = await res.json();
      if (data.ok && data.service) {
        const createdSrv = { id: data.service.id, name: data.service.name };
        setServicesList([...servicesList, createdSrv]);
        setSelectedServiceIds([...selectedServiceIds, data.service.id]);
        setIsAddServiceModalOpen(false);
        setNewServiceName('');
      }
    } catch (err) {
      console.error('Failed to create service:', err);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const formatFriendlyDate = (isoString: string) => {
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

  const upcomingAppointments = doctor.appointments.filter(
    (a) => new Date(a.startsAt) >= new Date()
  );
  const pastAppointments = doctor.appointments.filter(
    (a) => new Date(a.startsAt) < new Date()
  );

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href={backHref}
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Back to Doctors"
          >
            <ArrowLeft className="size-4" />
          </Link>

          {doctorImageUrl || doctor.imageUrl ? (
            <img
              src={doctorImageUrl || doctor.imageUrl || ''}
              alt={doctorName}
              className="size-9 rounded-[8px] object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="size-9 rounded-[8px] bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0">
              {doctorName ? doctorName.replace('Dr. ', '').charAt(0).toUpperCase() : 'D'}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                {doctorName}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-[8px] text-[11px] font-bold border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {isActive ? 'Active on WhatsApp' : 'Inactive'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {doctorSpecialty || 'General Practitioner'} • {doctor.clinic.name} ({doctor.clinic.timezone})
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="size-3.5" /> Changes saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveOperational}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. TAB NAVIGATION BAR */}
      <div className="px-6 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1 shrink-0 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="size-3.5" />
          <span>Working Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('blocked')}
          className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'blocked'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarOff className="size-3.5" />
          <span>Blocked Periods ({timeOffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="size-3.5" />
          <span>Assigned Services ({selectedServiceIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="size-3.5" />
          <span>Appointments ({doctor.appointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="size-3.5" />
          <span>Doctor Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coordinator')}
          className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'coordinator'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="size-3.5" />
          <span>Assigned Coordinator</span>
        </button>
      </div>

      {/* 3. TAB CONTENTS CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-slate-950/40 min-h-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* TAB 1: SCHEDULE CONFIGURATION */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="size-4 text-blue-600" />
                  <span>Slot Duration &amp; Active Booking Status</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Doctor Booking Status
                    </label>
                    <select
                      value={isActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="ACTIVE">Active (Accepting Bookings on WhatsApp)</option>
                      <option value="INACTIVE">Inactive (Hidden from WhatsApp &amp; New Bookings)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Per-Doctor Slot Duration
                    </label>
                    <select
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
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
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Post-Appointment Buffer Gap
                    </label>
                    <select
                      value={bufferMinutes}
                      onChange={(e) => setBufferMinutes(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    >
                      <option value={0}>0 minutes (No gap)</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="size-4 text-blue-600" />
                  <span>Weekly Working Hours ({doctor.clinic.timezone})</span>
                </h3>

                <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {WEEKDAYS.map((day) => {
                    const cfg = scheduleState[day.num] || {
                      isWorking: false,
                      startMinute: 540,
                      endMinute: 1020,
                    };

                    return (
                      <div
                        key={day.num}
                        className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 w-36">
                          <input
                            type="checkbox"
                            id={`day-${day.num}`}
                            checked={cfg.isWorking}
                            onChange={(e) =>
                              setScheduleState({
                                ...scheduleState,
                                [day.num]: { ...cfg, isWorking: e.target.checked },
                              })
                            }
                            className="size-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <label
                            htmlFor={`day-${day.num}`}
                            className={`font-bold cursor-pointer ${
                              cfg.isWorking
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {day.name}
                          </label>
                        </div>

                        {cfg.isWorking ? (
                          <div className="flex items-center gap-2">
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
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            />
                            <span className="text-slate-400 font-bold">to</span>
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
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold italic text-[11px]">
                            Day Off
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BLOCKED PERIODS */}
          {activeTab === 'blocked' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CalendarOff className="size-4 text-rose-500" />
                    <span>Doctor Blocked Periods &amp; Leaves</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Slots inside blocked periods will be automatically removed from WhatsApp &amp; Portal availability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBlockedModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Add Blocked Period</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                {timeOffList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No active blocked periods or leaves recorded for this doctor.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                          REASON
                        </th>
                        <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                          DATE RANGE
                        </th>
                        <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                          HOURS
                        </th>
                        <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px] text-right">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {timeOffList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                              {item.reason || 'Blocked'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {item.startDate} {item.startDate !== item.endDate ? `➔ ${item.endDate}` : ''}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                            {item.startMinute !== null && item.endMinute !== null
                              ? `${minuteToTimeStr(item.startMinute)} – ${minuteToTimeStr(item.endMinute)}`
                              : 'All Day'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteBlockedPeriod(item.id)}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete Blocked Period"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNED SERVICES */}
          {activeTab === 'services' && (
            <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Tag className="size-4 text-indigo-500" />
                    <span>Clinical Services Offered by this Doctor</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select which services Dr. {doctorName} can perform. Patients on WhatsApp will only be offered this doctor for selected services.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Create Service</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {servicesList.length === 0 ? (
                  <p className="text-slate-400 text-xs italic col-span-2">
                    No active services configured for this clinic yet.
                  </p>
                ) : (
                  servicesList.map((srv) => {
                    const isSelected = selectedServiceIds.includes(srv.id);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServiceIds(selectedServiceIds.filter((id) => id !== srv.id));
                          } else {
                            setSelectedServiceIds([...selectedServiceIds, srv.id]);
                          }
                        }}
                        className={`p-3 rounded-[8px] border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100 font-bold shadow-2xs'
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="size-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                          />
                          <span>{srv.name}</span>
                        </div>
                        {isSelected && <Check className="size-3.5 text-blue-600" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APPOINTMENTS HISTORY */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="size-3.5 text-blue-600" />
                    <span>Upcoming Bookings ({upcomingAppointments.length})</span>
                  </h3>
                </div>

                {upcomingAppointments.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No upcoming appointments scheduled for this doctor.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                          APPT NO
                        </th>
                        <th className="py-2 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                          PATIENT
                        </th>
                        <th className="py-2 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                          SERVICE
                        </th>
                        <th className="py-2 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                          DATE &amp; TIME
                        </th>
                        <th className="py-2 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {upcomingAppointments.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-4 font-mono font-bold text-blue-600">
                            {app.appointmentNumber ? `#${app.appointmentNumber}` : '—'}
                          </td>
                          <td className="py-2 px-4 font-semibold text-slate-900 dark:text-white">
                            {app.patient.name || 'Patient'}
                            {app.patient.fileNumber && (
                              <span className="ml-1 text-[10px] text-emerald-600 font-mono">
                                (File #{app.patient.fileNumber})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-slate-700 dark:text-slate-300">
                            {app.service.name}
                          </td>
                          <td className="py-2 px-4 text-slate-600 dark:text-slate-400">
                            {formatFriendlyDate(app.startsAt)}
                          </td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Past Bookings ({pastAppointments.length})
                  </h3>
                </div>
                {pastAppointments.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No past appointments recorded.
                  </div>
                ) : (
                  <div className="p-3 text-xs text-slate-500">
                    {pastAppointments.length} completed appointments recorded.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOCTOR PROFILE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="size-4 text-blue-600" />
                    <span>Doctor Credentials &amp; Profile</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure the professional details displayed to patients on WhatsApp and in the portal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Specialty &amp; Professional Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorSpecialty}
                    onChange={(e) => setDoctorSpecialty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Profile Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={doctorImageUrl}
                    onChange={(e) => setDoctorImageUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Doctor Bio / Clinical Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Doctor qualifications, education, and clinical background..."
                    value={doctorDescription}
                    onChange={(e) => setDoctorDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COORDINATOR */}
          {activeTab === 'coordinator' && (
            <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="size-4 text-emerald-600" />
                    <span>Assigned Clinic Coordinator</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Designate a clinic staff member responsible for coordinating Dr. {doctorName}&apos;s appointments and inquiries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCoordinatorModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Add New Coordinator</span>
                </button>
              </div>

              <div className="max-w-md text-xs space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Search &amp; Select Coordinator
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter staff by name or email..."
                      value={coordinatorSearch}
                      onChange={(e) => setCoordinatorSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <select
                    value={coordinatorId}
                    onChange={(e) => setCoordinatorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="">No coordinator assigned</option>
                    {filteredStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.email})
                      </option>
                    ))}
                  </select>
                </div>

                {doctor.coordinator && (
                  <div className="p-3 rounded-[8px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-black flex items-center justify-center text-xs">
                        {doctor.coordinator.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {doctor.coordinator.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {doctor.coordinator.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-[6px]">
                      Currently Assigned
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: ADD BLOCKED PERIOD */}
      {isBlockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarOff className="size-4 text-rose-600" />
                <span>Add Blocked Period / Leave</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockedModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddBlockedPeriod} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Reason / Type *
                </label>
                <select
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="Leave">Annual Leave / Vacation</option>
                  <option value="Meeting">Staff Meeting / Conference</option>
                  <option value="Break">Clinical Break</option>
                  <option value="Holiday">Official Holiday</option>
                  <option value="Personal">Personal Time</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBlockedStartDate}
                    onChange={(e) => setNewBlockedStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBlockedEndDate}
                    onChange={(e) => setNewBlockedEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Specific Hours (Optional - leave empty for all day)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    placeholder="From"
                    value={newBlockedStartHour}
                    onChange={(e) => setNewBlockedStartHour(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                  />
                  <input
                    type="time"
                    placeholder="To"
                    value={newBlockedEndHour}
                    onChange={(e) => setNewBlockedEndHour(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlockedModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Add Blocked Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADD COORDINATOR */}
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

            <form onSubmit={handleCreateCoordinator} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Coordinator Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sara Ahmed"
                  value={newCoordinatorName}
                  onChange={(e) => setNewCoordinatorName(e.target.value)}
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
                  value={newCoordinatorEmail}
                  onChange={(e) => setNewCoordinatorEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Temporary Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Defaults to ClinicStaff123!"
                  value={newCoordinatorPassword}
                  onChange={(e) => setNewCoordinatorPassword(e.target.value)}
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
                  disabled={isSubmittingCoordinator}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingCoordinator ? 'Creating...' : 'Create Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADD SERVICE */}
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

            <form onSubmit={handleCreateService} className="space-y-3.5">
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
                  disabled={isSubmittingService}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingService ? 'Creating...' : 'Create & Link Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
