'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Stethoscope,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Phone,
} from 'lucide-react';
import { AppointmentItem } from './AppointmentsScheduleDashboard';

interface AppointmentsCalendarViewProps {
  appointments: AppointmentItem[];
  clinicName?: string;
  timezone?: string;
  userRole?: string;
  onOpenNewAppointment: (prefillDate?: string, prefillTime?: string) => void;
  onUpdateStatus: (id: string, status: AppointmentItem['status']) => void;
  onOpenCompleteModal: (item: AppointmentItem) => void;
  onDeleteAppointment: (item: AppointmentItem) => void;
  getStatusBadge: (status: AppointmentItem['status']) => React.ReactNode;
}

type CalendarSubView = 'month' | 'week' | 'day';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 AM to 8:00 PM (20:00)

export function AppointmentsCalendarView({
  appointments,
  userRole,
  onOpenNewAppointment,
  onUpdateStatus,
  onOpenCompleteModal,
  onDeleteAppointment,
  getStatusBadge,
}: AppointmentsCalendarViewProps) {
  const [subView, setSubView] = useState<CalendarSubView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  // Helper to get normalized date string "YYYY-MM-DD" from any Date object
  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const selectedDateKey = useMemo(() => formatDateKey(currentDate), [currentDate]);

  // Parse appointment date correctly from rawStartsAt or date property
  const getAppointmentDateTime = (appt: AppointmentItem): { dateKey: string; hour: number; minute: number; timeStr: string } => {
    if (appt.rawStartsAt) {
      const d = new Date(appt.rawStartsAt);
      if (!isNaN(d.getTime())) {
        return {
          dateKey: formatDateKey(d),
          hour: d.getHours(),
          minute: d.getMinutes(),
          timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
    }

    // Fallback: derive from current viewing month/year or appt.date
    const now = new Date();
    const day = appt.date || now.getDate();
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    let hour = 9;
    let minute = 0;
    if (appt.time) {
      const match = appt.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match && match[1] && match[2]) {
        let h = parseInt(match[1], 10);
        minute = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        hour = h;
      }
    }

    return {
      dateKey: formatDateKey(d),
      hour,
      minute,
      timeStr: appt.time || `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  };

  // Group appointments by dateKey "YYYY-MM-DD"
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentItem[]>();
    appointments.forEach((appt) => {
      const { dateKey } = getAppointmentDateTime(appt);
      const list = map.get(dateKey) || [];
      list.push(appt);
      map.set(dateKey, list);
    });
    return map;
  }, [appointments, currentDate]);

  // Navigation helpers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (subView === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (subView === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (subView === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (subView === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Compute month calendar days
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      items: AppointmentItem[];
    }> = [];

    // Prev month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        items: appointmentsByDate.get(key) || [],
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        items: appointmentsByDate.get(key) || [],
      });
    }

    // Next month padding to fill full grid (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        items: appointmentsByDate.get(key) || [],
      });
    }

    return days;
  }, [currentDate, appointmentsByDate, todayKey, selectedDateKey]);

  // Compute week calendar days
  const weekCalendarDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0 is Sun
    const diff = d.getDate() - day; // Sunday of this week
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      weekdayName: string;
      isToday: boolean;
      isSelected: boolean;
      items: AppointmentItem[];
    }> = [];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(startOfWeek);
      cur.setDate(startOfWeek.getDate() + i);
      const key = formatDateKey(cur);
      days.push({
        date: cur,
        dateKey: key,
        dayNumber: cur.getDate(),
        weekdayName: WEEKDAYS[i] || '',
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        items: appointmentsByDate.get(key) || [],
      });
    }
    return days;
  }, [currentDate, appointmentsByDate, todayKey, selectedDateKey]);

  // Appointments for the currently selected day in Day View
  const selectedDayAppointments = useMemo(() => {
    return appointmentsByDate.get(selectedDateKey) || [];
  }, [appointmentsByDate, selectedDateKey]);

  // Status Color Indicator Helper
  const getStatusColorConfig = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'Confirmed':
        return {
          badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80',
          dotBg: 'bg-emerald-500',
          borderLeft: 'border-l-emerald-500',
          cardBg: 'bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border-emerald-200/60',
        };
      case 'Checked In':
        return {
          badgeBg: 'bg-teal-50 text-[#0d5c56] dark:bg-teal-950/60 dark:text-teal-300 border-[#0d8276]/30',
          dotBg: 'bg-[#0d8276]',
          borderLeft: 'border-l-[#0d8276]',
          cardBg: 'bg-[#e6f6f3]/60 hover:bg-[#e6f6f3] dark:bg-[#0d6157]/20 dark:hover:bg-[#0d6157]/30 border-[#0d8276]/40',
        };
      case 'In Progress':
        return {
          badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80',
          dotBg: 'bg-blue-500',
          borderLeft: 'border-l-blue-500',
          cardBg: 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border-blue-200/60',
        };
      case 'Pending':
        return {
          badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80',
          dotBg: 'bg-amber-500',
          borderLeft: 'border-l-amber-500',
          cardBg: 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border-amber-200/60',
        };
      case 'Completed':
        return {
          badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80',
          dotBg: 'bg-teal-500',
          borderLeft: 'border-l-teal-500',
          cardBg: 'bg-teal-50/50 hover:bg-teal-50 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 border-teal-200/60',
        };
      case 'Cancelled':
        return {
          badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80',
          dotBg: 'bg-rose-500',
          borderLeft: 'border-l-rose-500',
          cardBg: 'bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border-rose-200/60',
        };
      default:
        return {
          badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
          dotBg: 'bg-slate-400',
          borderLeft: 'border-l-slate-400',
          cardBg: 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 border-slate-200',
        };
    }
  };

  // Header period title string
  const headerTitle = useMemo(() => {
    if (subView === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (subView === 'week') {
      const first = weekCalendarDays[0]?.date;
      const last = weekCalendarDays[6]?.date;
      if (!first || !last) return '';
      const firstMonth = first.toLocaleDateString('en-US', { month: 'short' });
      const lastMonth = last.toLocaleDateString('en-US', { month: 'short' });
      if (firstMonth === lastMonth) {
        return `${firstMonth} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
      }
      return `${firstMonth} ${first.getDate()} – ${lastMonth} ${last.getDate()}, ${last.getFullYear()}`;
    }
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [subView, currentDate, weekCalendarDays]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 overflow-hidden">
      {/* 1. CALENDAR CONTROLS TOOLBAR */}
      <div className="px-5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        {/* Left: Month/Week/Day Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800 rounded-[8px] p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#0d6157] hover:bg-white dark:hover:bg-slate-700 rounded-[6px] transition-all cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0d6157] hover:bg-white dark:hover:bg-slate-700 rounded-[6px] transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#0d6157] hover:bg-white dark:hover:bg-slate-700 rounded-[6px] transition-all cursor-pointer"
              title="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-[#0d3d38] dark:text-white tracking-tight ml-1">
            {headerTitle}
          </h2>
        </div>

        {/* Right: Subview Switcher & Action */}
        <div className="flex items-center gap-2.5">
          {/* Subview Segmented Tab */}
          <div className="bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-[8px] flex items-center gap-0.5 border border-slate-200/60 dark:border-slate-700/60">
            {(['month', 'week', 'day'] as CalendarSubView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSubView(v)}
                className={`px-3 py-1 rounded-[6px] text-xs font-semibold capitalize transition-all cursor-pointer ${
                  subView === v
                    ? 'bg-white dark:bg-slate-700 text-[#0d5c56] dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#0d6157]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => onOpenNewAppointment(selectedDateKey)}
            className="inline-flex items-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs font-semibold px-3 py-1.5 rounded-[8px] shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Slot</span>
          </button>
        </div>
      </div>

      {/* 2. CALENDAR VIEW BODY */}
      <div className="flex-1 overflow-auto min-h-0 bg-slate-50/50 dark:bg-slate-950 flex flex-col">
        {/* ===================== 2A. MONTH VIEW ===================== */}
        {subView === 'month' && (
          <div className="flex-1 flex flex-col min-h-full">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-[#f8fcfa] dark:bg-slate-900 sticky top-0 z-10">
              {WEEKDAYS.map((day, idx) => (
                <div
                  key={day}
                  className={`py-2 text-center text-[11px] font-bold tracking-wider uppercase ${
                    idx === 0 || idx === 6
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-[#0d5c56] dark:text-teal-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200/70 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
              {monthCalendarDays.map((cell) => {
                const isSelected = cell.dateKey === selectedDateKey;
                return (
                  <div
                    key={cell.dateKey}
                    onClick={() => {
                      setCurrentDate(cell.date);
                    }}
                    className={`min-h-[110px] p-1.5 flex flex-col transition-colors group relative cursor-pointer ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/60 dark:bg-slate-950/40 text-slate-300 dark:text-slate-600'
                        : isSelected
                        ? 'bg-teal-50/40 dark:bg-teal-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {/* Day Header Row */}
                    <div className="flex items-center justify-between mb-1 px-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold size-5 flex items-center justify-center rounded-full transition-all ${
                            cell.isToday
                              ? 'bg-[#0d6157] text-white shadow-2xs font-extrabold'
                              : isSelected
                              ? 'text-[#0d6157] font-extrabold ring-1 ring-[#0d6157]/40'
                              : cell.isCurrentMonth
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {cell.isToday && (
                          <span className="text-[9px] font-bold text-[#0d6157] uppercase tracking-wide">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Day Appointment Count Badge */}
                      {cell.items.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/30 dark:text-teal-300 border border-[#0d8276]/20">
                          {cell.items.length}
                        </span>
                      )}
                    </div>

                    {/* Appointments list inside day cell */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[90px] pr-0.5">
                      {cell.items.slice(0, 3).map((appt) => {
                        const { timeStr } = getAppointmentDateTime(appt);
                        const colors = getStatusColorConfig(appt.status);
                        return (
                          <div
                            key={appt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appt);
                            }}
                            className={`group/item px-1.5 py-0.5 rounded-[6px] text-[11px] border font-medium flex items-center gap-1 transition-all hover:scale-[1.01] shadow-2xs cursor-pointer truncate ${colors.badgeBg}`}
                            title={`${timeStr} - ${appt.patientName} (${appt.doctor}) - ${appt.status}`}
                          >
                            <span className={`size-1.5 rounded-full shrink-0 ${colors.dotBg}`} />
                            <span className="font-semibold text-[10px] shrink-0 opacity-80">{timeStr}</span>
                            <span className="truncate font-semibold">{appt.patientName}</span>
                          </div>
                        );
                      })}

                      {cell.items.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentDate(cell.date);
                            setSubView('day');
                          }}
                          className="w-full text-center text-[10px] font-bold text-[#0d5c56] dark:text-teal-300 hover:underline py-0.5"
                        >
                          +{cell.items.length - 3} more
                        </button>
                      )}
                    </div>

                    {/* Quick Add on Hover button in corner */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewAppointment(cell.dateKey);
                      }}
                      className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-[#0d6157] text-white rounded-[6px] hover:bg-[#0a4e46] shadow-2xs transition-all cursor-pointer"
                      title={`Add appointment on ${cell.dateKey}`}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== 2B. WEEK VIEW ===================== */}
        {subView === 'week' && (
          <div className="flex-1 flex flex-col min-h-full">
            {/* Week Header: 7 Day Columns */}
            <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-[#f8fcfa] dark:bg-slate-900 sticky top-0 z-20 shadow-2xs">
              {/* Time Gutter Header */}
              <div className="py-2.5 px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center border-r border-slate-200/80 dark:border-slate-800">
                Time
              </div>
              {/* 7 Days */}
              {weekCalendarDays.map((d) => (
                <div
                  key={d.dateKey}
                  onClick={() => {
                    setCurrentDate(d.date);
                  }}
                  className={`py-2 px-1 text-center border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 cursor-pointer transition-colors ${
                    d.isToday
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                      : d.dateKey === selectedDateKey
                      ? 'bg-teal-50/30 dark:bg-teal-950/10'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {d.weekdayName}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-extrabold mt-0.5 ${
                      d.isToday
                        ? 'bg-[#0d6157] text-white shadow-2xs'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            {/* Time Grid Rows */}
            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
              {HOURS.map((hour) => {
                const hourFormatted = hour >= 12 ? `${hour === 12 ? 12 : hour - 12}:00 PM` : `${hour}:00 AM`;
                const hourStr = String(hour).padStart(2, '0');

                return (
                  <div key={hour} className="grid grid-cols-8 min-h-[70px] divide-x divide-slate-100 dark:divide-slate-800/80">
                    {/* Time Gutter */}
                    <div className="p-2 text-right pr-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/30 select-none">
                      {hourFormatted}
                    </div>

                    {/* 7 Day Slot Columns */}
                    {weekCalendarDays.map((d) => {
                      // Find appointments in this specific day & hour
                      const hourAppointments = d.items.filter((appt) => {
                        const { hour: apptHour } = getAppointmentDateTime(appt);
                        return apptHour === hour;
                      });

                      return (
                        <div
                          key={d.dateKey}
                          onClick={() => {
                            onOpenNewAppointment(d.dateKey, `${hourStr}:00`);
                          }}
                          className={`p-1 relative group hover:bg-[#e6f6f3]/30 dark:hover:bg-[#0d6157]/10 transition-colors cursor-pointer flex flex-col gap-1 overflow-y-auto ${
                            d.isToday ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                          }`}
                        >
                          {hourAppointments.map((appt) => {
                            const { timeStr } = getAppointmentDateTime(appt);
                            const colors = getStatusColorConfig(appt.status);
                            return (
                              <div
                                key={appt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(appt);
                                }}
                                className={`p-1.5 rounded-[6px] border text-[11px] font-medium transition-all hover:scale-[1.02] shadow-2xs cursor-pointer ${colors.badgeBg} ${colors.borderLeft} border-l-3`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-[10px] text-[#0d3d38] dark:text-white">
                                    {timeStr}
                                  </span>
                                  <span className={`size-1.5 rounded-full ${colors.dotBg}`} />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                                  {appt.patientName}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                                  {appt.doctor}
                                </span>
                              </div>
                            );
                          })}

                          {/* Hover '+' hint */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-60 pointer-events-none">
                            <Plus className="size-4 text-[#0d8276]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== 2C. DAY VIEW ===================== */}
        {subView === 'day' && (
          <div className="flex-1 flex flex-col p-4 max-w-5xl mx-auto w-full">
            {/* Day Header Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#e6f6f3]/80 to-white dark:from-[#0d6157]/20 dark:to-slate-900 border border-[#0d8276]/20 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-4 shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
                  Daily Schedule View
                </span>
                <h3 className="text-lg font-extrabold text-[#0d3d38] dark:text-white mt-0.5">
                  {currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDayAppointments.length} appointment{selectedDayAppointments.length !== 1 ? 's' : ''} scheduled for this day.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenNewAppointment(selectedDateKey)}
                  className="px-4 py-2 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs rounded-[8px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                  <span>Book on this Date</span>
                </button>
              </div>
            </div>

            {/* Time Slot Timeline */}
            <div className="space-y-3">
              {HOURS.map((hour) => {
                const hourFormatted = hour >= 12 ? `${hour === 12 ? 12 : hour - 12}:00 PM` : `${hour}:00 AM`;
                const hourStr = String(hour).padStart(2, '0');

                const hourAppointments = selectedDayAppointments.filter((appt) => {
                  const { hour: apptHour } = getAppointmentDateTime(appt);
                  return apptHour === hour;
                });

                return (
                  <div
                    key={hour}
                    className="flex items-start gap-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-[#0d8276]/40 transition-colors"
                  >
                    {/* Time Column */}
                    <div className="w-20 pt-1 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      {hourFormatted}
                    </div>

                    {/* Slot Content */}
                    <div className="flex-1 space-y-2.5">
                      {hourAppointments.length === 0 ? (
                        <div
                          onClick={() => onOpenNewAppointment(selectedDateKey, `${hourStr}:00`)}
                          className="py-2.5 px-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:border-[#0d8276]/60 hover:bg-[#e6f6f3]/20 dark:hover:bg-[#0d6157]/10 text-xs text-slate-400 hover:text-[#0d6157] font-medium flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="size-3.5 opacity-60" />
                            <span>Available slot · No appointments</span>
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-[11px] font-bold text-[#0d6157] dark:text-teal-300 flex items-center gap-1">
                            <Plus className="size-3" />
                            <span>Quick Book</span>
                          </span>
                        </div>
                      ) : (
                        hourAppointments.map((appt) => {
                          const { timeStr } = getAppointmentDateTime(appt);
                          const colors = getStatusColorConfig(appt.status);

                          return (
                            <div
                              key={appt.id}
                              className={`p-3.5 rounded-xl border ${colors.cardBg} ${colors.borderLeft} border-l-4 transition-all shadow-xs`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-xs font-bold text-[#0d6157] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/30 px-2 py-0.5 rounded-[6px] border border-[#0d8276]/20">
                                    {appt.fileNumber ? `FR-${String(appt.fileNumber).padStart(3, '0')}` : 'FR-001'}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[6px]">
                                    {appt.appointmentNumber ? `AP-${String(appt.appointmentNumber).padStart(3, '0')}` : 'AP-001'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <Clock className="size-3.5 text-slate-400" />
                                    {timeStr}
                                  </span>
                                </div>

                                <div>{getStatusBadge(appt.status)}</div>
                              </div>

                              {/* Patient & Doctor Row */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
                                <div className="flex items-center gap-2.5">
                                  <div className="size-8 rounded-lg bg-[#0d6157] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {appt.patientName ? appt.patientName.charAt(0).toUpperCase() : 'P'}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                      {appt.patientName}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Phone className="size-3" />
                                      <span>{appt.patientDetails || 'No phone recorded'}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Service & Doctor
                                    </span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                      {appt.department}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {appt.doctor}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons Row */}
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-200/50 dark:border-slate-800/80">
                                {appt.status !== 'Checked In' && appt.status !== 'Completed' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateStatus(appt.id, 'Checked In')}
                                    className="px-2.5 py-1 rounded-[6px] text-xs font-bold bg-[#0d6157] hover:bg-[#0a4e46] text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                  >
                                    <UserCheck className="size-3.5" />
                                    <span>Check In Patient</span>
                                  </button>
                                )}

                                {userRole === 'NURSE' ? (
                                  <Link
                                    href="/portal/nurse"
                                    className="px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[#e6f6f3] text-[#0d5c56] hover:bg-[#d5eee8] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <HeartPulse className="size-3.5 text-[#0d8276]" />
                                    <span>Nurse Station</span>
                                  </Link>
                                ) : (
                                  <>
                                    <Link
                                      href="/portal/consultations"
                                      className="px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <Stethoscope className="size-3.5 text-teal-600" />
                                      <span>Consultation Desk</span>
                                    </Link>

                                    {appt.status !== 'Completed' && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenCompleteModal(appt)}
                                        className="px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                        <span>Complete &amp; Discount</span>
                                      </button>
                                    )}
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedAppointment(appt)}
                                  className="px-2.5 py-1 rounded-[6px] text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                >
                                  More Details
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. APPOINTMENT DETAIL / ACTION MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 relative text-xs animate-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#0d6157] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/30 px-2.5 py-0.5 rounded-[6px] border border-[#0d8276]/20">
                  {selectedAppointment.fileNumber
                    ? `FR-${String(selectedAppointment.fileNumber).padStart(3, '0')}`
                    : 'FR-001'}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[6px]">
                  {selectedAppointment.appointmentNumber
                    ? `AP-${String(selectedAppointment.appointmentNumber).padStart(3, '0')}`
                    : 'AP-001'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAppointment(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Patient Info Card */}
            <div className="py-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#0d6157] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {selectedAppointment.patientName ? selectedAppointment.patientName.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedAppointment.patientName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="size-3 text-slate-400" />
                      <span>{selectedAppointment.patientDetails || 'No phone recorded'}</span>
                    </p>
                  </div>
                </div>

                <div>{getStatusBadge(selectedAppointment.status)}</div>
              </div>

              {/* Details Grid */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Doctor
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedAppointment.doctor}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Department
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedAppointment.department}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Scheduled Time
                  </span>
                  <span className="font-semibold text-[#0d6157] dark:text-teal-300">
                    {selectedAppointment.time}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Service Price
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    SAR {selectedAppointment.servicePrice ? selectedAppointment.servicePrice.toFixed(2) : '350.00'}
                  </span>
                </div>
              </div>

              {/* Quick Status Changers */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Quick Actions &amp; Status Change:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(selectedAppointment.id, 'Checked In');
                      setSelectedAppointment((prev) => (prev ? { ...prev, status: 'Checked In' } : null));
                    }}
                    className="p-2 rounded-lg bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 hover:bg-[#d5eee8] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserCheck className="size-3.5" />
                    <span>Check In Patient</span>
                  </button>

                  {userRole === 'NURSE' ? (
                    <Link
                      href="/portal/nurse"
                      className="p-2 rounded-lg bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 hover:bg-[#d5eee8] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#0d8276]/30"
                    >
                      <HeartPulse className="size-3.5 text-[#0d8276]" />
                      <span>Nurse Station (Triage)</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const appt = selectedAppointment;
                        setSelectedAppointment(null);
                        onOpenCompleteModal(appt);
                      }}
                      className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-200/80 dark:border-emerald-800"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Complete &amp; Discount</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(selectedAppointment.id, 'Confirmed');
                      setSelectedAppointment((prev) => (prev ? { ...prev, status: 'Confirmed' } : null));
                    }}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>Mark Confirmed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(selectedAppointment.id, 'In Progress');
                      setSelectedAppointment((prev) => (prev ? { ...prev, status: 'In Progress' } : null));
                    }}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="size-3.5 text-blue-500" />
                    <span>In Progress</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(selectedAppointment.id, 'Pending');
                      setSelectedAppointment((prev) => (prev ? { ...prev, status: 'Pending' } : null));
                    }}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="size-3.5 text-amber-500" />
                    <span>Mark Pending</span>
                  </button>

                  {userRole !== 'NURSE' && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateStatus(selectedAppointment.id, 'Cancelled');
                        setSelectedAppointment((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
                      }}
                      className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/80"
                    >
                      <AlertCircle className="size-3.5 text-rose-500" />
                      <span>Mark Cancelled</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {userRole !== 'NURSE' ? (
                <button
                  type="button"
                  onClick={() => {
                    const toDel = selectedAppointment;
                    setSelectedAppointment(null);
                    onDeleteAppointment(toDel);
                  }}
                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Remove Appointment</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Nurse View (Limited Actions)</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-1.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
