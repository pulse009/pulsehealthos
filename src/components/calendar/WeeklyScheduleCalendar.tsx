'use client';

import React, { useState } from 'react';
import { Badge, Button, Card } from '@/components/ui/primitives';

export interface CalendarDoctorSchedule {
  id: string;
  name: string;
  specialty?: string | null;
  appointmentMinutes?: number | null;
  bufferMinutes?: number | null;
  schedules: Array<{ weekday: number; startMinute: number; endMinute: number }>;
  breaks: Array<{ weekday: number; startMinute: number; endMinute: number; label?: string | null }>;
  timeOff: Array<{
    id: string;
    startDate: string;
    endDate: string;
    startMinute?: number | null;
    endMinute?: number | null;
    reason?: string | null;
  }>;
  services?: Array<{ service: { id: string; name: string } }>;
}

export interface CalendarAppointment {
  id: string;
  doctorId: string;
  doctorName?: string;
  serviceName: string;
  patientName?: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  status: string;
}

interface WeeklyScheduleCalendarProps {
  doctors: CalendarDoctorSchedule[];
  appointments?: CalendarAppointment[];
  timezone?: string;
  clinicName?: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

function formatTime(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function WeeklyScheduleCalendar({
  doctors,
  appointments = [],
  clinicName,
}: WeeklyScheduleCalendarProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Compute Monday of current week
  const getMonday = (offsetWeeks: number) => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offsetWeeks * 7;
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const currentMonday = getMonday(weekOffset);

  const getWeekDateString = (dayIndex: number): string => {
    const target = new Date(currentMonday);
    target.setDate(currentMonday.getDate() + dayIndex);
    return target.toISOString().slice(0, 10);
  };

  const filteredDoctors =
    selectedDoctorId === 'ALL'
      ? doctors
      : doctors.filter((doc) => doc.id === selectedDoctorId);

  return (
    <Card className="p-4 space-y-4">
      {/* Calendar Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">
            Weekly Availability Calendar
          </h3>
          <p className="text-xs text-muted">
            {clinicName ? `${clinicName} · ` : ''}
            Showing Week of {currentMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Doctor Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted">Doctor:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="h-8 rounded-lg border bg-[var(--surface)] px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)]"
            >
              <option value="ALL">All Doctors ({doctors.length})</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} {doc.specialty ? `(${doc.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs"
              onClick={() => setWeekOffset((prev) => prev - 1)}
            >
              ← Prev Week
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs"
              onClick={() => setWeekOffset((prev) => prev + 1)}
            >
              Next Week →
            </Button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted bg-[var(--surface-muted)] p-2.5 rounded-lg">
        <span className="text-xs font-semibold text-[var(--text)]">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-emerald-500/20 border border-emerald-600"></span>
          <span>Working Shift</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-amber-500/20 border border-amber-600"></span>
          <span>Break / Rest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-rose-500/20 border border-rose-600"></span>
          <span>Time-off / Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-indigo-500/20 border border-indigo-600"></span>
          <span>Booked Appointment</span>
        </div>
      </div>

      {/* Doctor Schedule Cards View */}
      <div className="space-y-6">
        {filteredDoctors.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            No doctors configured for this view.
          </div>
        ) : (
          filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border bg-[var(--surface)] p-3 space-y-3 shadow-sm"
            >
              {/* Doctor Header */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] font-semibold text-xs">
                    {doc.name.replace(/^Dr\.\s*/i, '').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text)]">
                      {doc.name}
                    </h4>
                    <p className="text-[11px] text-muted">
                      {doc.specialty ?? 'General Practice'}
                      {doc.appointmentMinutes ? ` · ${doc.appointmentMinutes}m slot` : ''}
                      {doc.bufferMinutes ? ` · ${doc.bufferMinutes}m buffer` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {doc.services && doc.services.length > 0 && (
                    <Badge tone="neutral" className="text-[10px]">
                      {doc.services.length} Service{doc.services.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Weekly Grid for Doctor */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {WEEKDAYS.map((dayName, dayIdx) => {
                  const weekdayNumber = dayIdx + 1;
                  const dateStr = getWeekDateString(dayIdx);

                  // Doctor shift windows for this day
                  const shifts = doc.schedules.filter((s) => s.weekday === weekdayNumber);
                  const breaks = doc.breaks.filter((b) => b.weekday === weekdayNumber);
                  const timeOffs = doc.timeOff.filter(
                    (t) => dateStr >= t.startDate && dateStr <= t.endDate,
                  );

                  // Booked appointments for this doctor on this day
                  const dayAppointments = appointments.filter((app) => {
                    if (app.doctorId !== doc.id) return false;
                    const appDate = new Date(app.startsAt).toISOString().split('T')[0];
                    return appDate === dateStr;
                  });

                  const isWorking = shifts.length > 0;
                  const isOff = timeOffs.some((t) => t.startMinute == null && t.endMinute == null);

                  return (
                    <div
                      key={dayName}
                      className={`flex flex-col rounded-lg border p-2 min-h-[130px] transition-colors ${
                        isOff
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                          : isWorking
                          ? 'bg-[var(--surface-muted)]/40 border-[var(--border)]'
                          : 'bg-gray-50/40 dark:bg-gray-900/30 border-dashed border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800 pb-1 mb-1.5">
                        <span className="text-[11px] font-bold text-[var(--text)]">
                          {dayName.slice(0, 3)}
                        </span>
                        <span className="text-[10px] text-muted">
                          {dateStr.slice(5)}
                        </span>
                      </div>

                      {/* Content Blocks */}
                      <div className="flex-1 space-y-1.5 text-[11px]">
                        {isOff ? (
                          <div className="rounded bg-rose-100 dark:bg-rose-900/40 p-1.5 text-rose-700 dark:text-rose-300 font-medium text-center text-[10px]">
                            🚫 Time Off
                            {timeOffs[0]?.reason ? `: ${timeOffs[0].reason}` : ''}
                          </div>
                        ) : !isWorking ? (
                          <div className="text-[10px] text-subtle italic text-center py-2">
                            Not working
                          </div>
                        ) : (
                          <>
                            {/* Shifts */}
                            {shifts.map((s, idx) => (
                              <div
                                key={idx}
                                className="rounded border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 p-1 text-emerald-800 dark:text-emerald-200 font-medium"
                              >
                                ⏰ {formatTime(s.startMinute)} – {formatTime(s.endMinute)}
                              </div>
                            ))}

                            {/* Breaks */}
                            {breaks.map((b, idx) => (
                              <div
                                key={idx}
                                className="rounded border border-amber-600/40 bg-amber-50 dark:bg-amber-950/30 p-1 text-amber-800 dark:text-amber-200 font-medium text-[10px]"
                              >
                                ☕ Break: {formatTime(b.startMinute)} – {formatTime(b.endMinute)}
                                {b.label ? ` (${b.label})` : ''}
                              </div>
                            ))}

                            {/* Partial Time Off */}
                            {timeOffs
                              .filter((t) => t.startMinute != null && t.endMinute != null)
                              .map((t, idx) => (
                                <div
                                  key={idx}
                                  className="rounded border border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-1 text-rose-800 dark:text-rose-200 font-medium text-[10px]"
                                >
                                  🚫 Off: {formatTime(t.startMinute!)} – {formatTime(t.endMinute!)}
                                </div>
                              ))}

                            {/* Appointments */}
                            {dayAppointments.map((app) => {
                              const startT = new Date(app.startsAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              return (
                                <div
                                  key={app.id}
                                  className="rounded border border-indigo-600/40 bg-indigo-50 dark:bg-indigo-950/30 p-1 text-indigo-900 dark:text-indigo-200 text-[10px]"
                                >
                                  📅 <span className="font-semibold">{startT}</span> - {app.patientName || 'Patient'} ({app.serviceName})
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
