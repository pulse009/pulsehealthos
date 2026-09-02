'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RotateCcw,
  LayoutGrid,
  List,
  ChevronRight,
  ShieldCheck,
  Building2,
  Tag,
  Power,
  Users,
  Plus,
  UserCheck,
} from 'lucide-react';

export interface DoctorCardItem {
  id: string;
  name: string;
  specialty: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  appointmentMinutes: number | null;
  bufferMinutes: number | null;
  coordinator?: { id: string; name: string; email: string } | null;
  user?: { id: string; username: string | null; email: string } | null;
  services: Array<{ id: string; name: string }>;
  schedules: Array<{ weekday: number; startMinute: number; endMinute: number }>;
  upcomingAppointmentsCount: number;
}

export interface DoctorsPortalDashboardProps {
  clinicName?: string;
  timezone?: string;
  initialDoctors?: DoctorCardItem[];
  specialties?: string[];
  availableServices?: Array<{ id: string; name: string }>;
  availableStaff?: Array<{ id: string; name: string; email: string }>;
}

export function DoctorsPortalDashboard({
  clinicName = 'Clinic',
  timezone = 'Asia/Riyadh',
  initialDoctors = [],
  specialties = [],
}: DoctorsPortalDashboardProps) {
  const [doctors, setDoctors] = useState<DoctorCardItem[]>(initialDoctors);

  useEffect(() => {
    if (initialDoctors && initialDoctors.length > 0) setDoctors(initialDoctors);
  }, [initialDoctors]);

  // Toolbar & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Available Specialties list
  const availableSpecialties = useMemo(() => {
    const list = new Set(doctors.map((d) => d.specialty).filter(Boolean) as string[]);
    specialties.forEach((s) => list.add(s));
    return Array.from(list);
  }, [doctors, specialties]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (selectedSpecialty !== 'ALL' && doc.specialty !== selectedSpecialty) return false;
      if (selectedStatus === 'ACTIVE' && !doc.isActive) return false;
      if (selectedStatus === 'INACTIVE' && doc.isActive) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpec = doc.specialty ? doc.specialty.toLowerCase().includes(q) : false;
        const matchesService = doc.services.some((s) => s.name.toLowerCase().includes(q));
        if (!matchesName && !matchesSpec && !matchesService) return false;
      }
      return true;
    });
  }, [doctors, selectedSpecialty, selectedStatus, searchQuery]);

  // Reactive Live Counts
  const totalDoctorsCount = doctors.length;
  const activeDoctorsCount = doctors.filter((d) => d.isActive).length;
  const totalUpcomingAppointments = doctors.reduce((acc, d) => acc + d.upcomingAppointmentsCount, 0);
  const totalServicesCovered = new Set(doctors.flatMap((d) => d.services.map((s) => s.id))).size;

  // Toggle Doctor Active Status
  const handleToggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = !currentStatus;

    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: newStatus } : d))
    );

    try {
      await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update doctor status:', err);
    }
  };

  const getWeekdayShort = (w: number) => {
    const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[w] || '';
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Clinic Doctors &amp; Specialists
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Configure working schedules, per-doctor slot duration &amp; availability for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span> ({timezone}).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/portal/doctors/create"
            className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Doctor</span>
          </Link>
        </div>
      </div>

      {/* 2. STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Total Doctors
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalDoctorsCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-100 dark:border-blue-900/50 inline-block">
                Assigned to clinic
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100/70 dark:border-blue-900/50 shadow-2xs">
            <Stethoscope className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Active on WhatsApp
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {activeDoctorsCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Accepting bookings
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Upcoming Bookings
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalUpcomingAppointments}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Across all doctors
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Calendar className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Services Covered
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalServicesCovered}
            </div>
            <div className="pt-0.5">
              <span className="bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-purple-100 dark:border-purple-900/50 inline-block">
                Clinical services
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-purple-50/80 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center shrink-0 border border-purple-100/70 dark:border-purple-900/50 shadow-2xs">
            <Tag className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: TOOLBAR & TABLE / CARDS */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top Toolbar */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-72 sm:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors, specialty, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Specialties</option>
              {availableSpecialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[8px] flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-[8px] flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Cards</span>
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

        {/* VIEW 1: GRID CARDS VIEW */}
        {viewMode === 'grid' ? (
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/40 dark:bg-slate-950/40 min-h-0">
            {filteredDoctors.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium">
                No doctors matching selected filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map((doc) => {
                  const workingDays = Array.from(
                    new Set(doc.schedules.map((s) => s.weekday))
                  ).sort();

                  return (
                    <div
                      key={doc.id}
                      className="bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 rounded-[8px] p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {doc.imageUrl ? (
                              <img
                                src={doc.imageUrl}
                                alt={doc.name}
                                className="size-11 rounded-[8px] object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="size-11 rounded-[8px] bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-sm font-black shrink-0 border border-blue-200/60 dark:border-blue-800">
                                {doc.name ? doc.name.replace('Dr. ', '').charAt(0).toUpperCase() : 'D'}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {doc.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                {doc.specialty || 'General Practitioner'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {doc.user?.username && (
                                  <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                                    @{doc.user.username}
                                  </span>
                                )}
                                {doc.coordinator && (
                                  <span className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-0.5">
                                    <UserCheck className="size-3" />
                                    <span>{doc.coordinator.name}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(doc.id, doc.isActive, e)}
                            className={`px-2 py-0.5 rounded-[8px] text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                              doc.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {doc.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Slot Duration:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              {doc.appointmentMinutes ? `${doc.appointmentMinutes} mins` : 'Clinic Default (30m)'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Working Days:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5, 6, 7].map((w) => {
                                const isWorking = workingDays.includes(w);
                                return (
                                  <span
                                    key={w}
                                    className={`size-5 rounded-[4px] text-[9px] font-bold flex items-center justify-center ${
                                      isWorking
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800'
                                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600'
                                    }`}
                                  >
                                    {getWeekdayShort(w).charAt(0)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Upcoming Bookings:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {doc.upcomingAppointmentsCount}
                            </span>
                          </div>

                          <div className="pt-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Assigned Services ({doc.services.length})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {doc.services.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">No services linked</span>
                              ) : (
                                doc.services.slice(0, 3).map((srv) => (
                                  <span
                                    key={srv.id}
                                    className="px-1.5 py-0.2 rounded-[6px] text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  >
                                    {srv.name}
                                  </span>
                                ))
                              )}
                              {doc.services.length > 3 && (
                                <span className="px-1.5 py-0.2 rounded-[6px] text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  +{doc.services.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/portal/doctors/${doc.id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs py-1.5 rounded-[8px] shadow-2xs transition-all"
                        >
                          <span>Manage Profile &amp; Schedule</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: TABLE LIST VIEW */
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                <tr className="divide-x divide-slate-200 dark:divide-slate-700/60">
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    DOCTOR
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    LOGIN USERNAME
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    SPECIALTY / DEPARTMENT
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    STATUS
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                    SLOT DURATION
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    SERVICES
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                    UPCOMING APPOINTMENTS
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-xs">
                      No doctors found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group divide-x divide-slate-100 dark:divide-slate-800/60"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {row.imageUrl ? (
                            <img
                              src={row.imageUrl}
                              alt={row.name}
                              className="size-7 rounded-[8px] object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="size-7 rounded-[8px] bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                              {row.name ? row.name.replace('Dr. ', '').charAt(0).toUpperCase() : 'D'}
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/portal/doctors/${row.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 hover:underline truncate block"
                            >
                              {row.name}
                            </Link>
                            {row.coordinator && (
                              <span className="text-[10px] text-emerald-600 font-medium block mt-0.2">
                                Coord: {row.coordinator.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-mono">
                        {row.user?.username ? (
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                              @{row.user.username}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-sans truncate max-w-[140px]">
                              {row.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No login linked</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                        {row.specialty || 'General Practitioner'}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(row.id, row.isActive, e)}
                          className={`px-2 py-0.5 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${
                            row.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {row.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                        {row.appointmentMinutes ? `${row.appointmentMinutes} mins` : 'Default (30m)'}
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          {row.services.length} services
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {row.upcomingAppointmentsCount} Bookings
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/portal/doctors/${row.id}`}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-bold text-xs"
                        >
                          <span>Manage</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
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
