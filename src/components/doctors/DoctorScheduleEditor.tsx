'use client';

import React, { useState, useTransition } from 'react';
import { Button, Card, Input } from '@/components/ui/primitives';
import { saveDoctorAction, addDoctorTimeOffAction, deleteDoctorTimeOffAction } from '@/app/admin/doctors/actions';

export interface DoctorEditorService {
  id: string;
  name: string;
}

export interface DoctorEditorData {
  id?: string;
  name: string;
  specialty?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  appointmentMinutes?: number | null;
  bufferMinutes?: number | null;
  serviceIds: string[];
  schedules: Array<{ weekday: number; startMinute: number; endMinute: number }>;
  breaks: Array<{ weekday: number; startMinute: number; endMinute: number; label?: string | null }>;
  timeOff?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    startMinute?: number | null;
    endMinute?: number | null;
    reason?: string | null;
  }>;
}

interface DoctorScheduleEditorProps {
  clinicId: string;
  availableServices: DoctorEditorService[];
  initialData?: DoctorEditorData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const WEEKDAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 7, name: 'Sunday' },
];

function minuteToTimeString(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStringToMinute(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function DoctorScheduleEditor({
  clinicId,
  availableServices,
  initialData,
  onSuccess,
  onCancel,
}: DoctorScheduleEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(initialData?.name ?? '');
  const [specialty, setSpecialty] = useState(initialData?.specialty ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [appointmentMinutes, setAppointmentMinutes] = useState<string>(
    initialData?.appointmentMinutes ? String(initialData.appointmentMinutes) : '',
  );
  const [bufferMinutes, setBufferMinutes] = useState<string>(
    initialData?.bufferMinutes ? String(initialData.bufferMinutes) : '',
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialData?.serviceIds ?? [],
  );

  // Weekly Schedules State
  const [schedules, setSchedules] = useState<
    Array<{ weekday: number; startTime: string; endTime: string }>
  >(
    initialData?.schedules.map((s) => ({
      weekday: s.weekday,
      startTime: minuteToTimeString(s.startMinute),
      endTime: minuteToTimeString(s.endMinute),
    })) ?? [
      { weekday: 1, startTime: '09:00', endTime: '17:00' },
      { weekday: 2, startTime: '09:00', endTime: '17:00' },
      { weekday: 3, startTime: '09:00', endTime: '17:00' },
      { weekday: 4, startTime: '09:00', endTime: '17:00' },
      { weekday: 5, startTime: '09:00', endTime: '17:00' },
    ],
  );

  // Breaks State
  const [breaks, setBreaks] = useState<
    Array<{ weekday: number; startTime: string; endTime: string; label: string }>
  >(
    initialData?.breaks.map((b) => ({
      weekday: b.weekday,
      startTime: minuteToTimeString(b.startMinute),
      endTime: minuteToTimeString(b.endMinute),
      label: b.label ?? 'Lunch Break',
    })) ?? [
      { weekday: 1, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
      { weekday: 2, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
      { weekday: 3, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
      { weekday: 4, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
      { weekday: 5, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
    ],
  );

  // Time off state
  const timeOffs = initialData?.timeOff ?? [];

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleAddShift = (weekday: number) => {
    setSchedules((prev) => [
      ...prev,
      { weekday, startTime: '09:00', endTime: '17:00' },
    ]);
  };

  const handleRemoveShift = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBreak = (weekday: number) => {
    setBreaks((prev) => [
      ...prev,
      { weekday, startTime: '13:00', endTime: '14:00', label: 'Rest Break' },
    ]);
  };

  const handleRemoveBreak = (index: number) => {
    setBreaks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formattedSchedules = schedules.map((s) => ({
      weekday: s.weekday,
      startMinute: timeStringToMinute(s.startTime),
      endMinute: timeStringToMinute(s.endTime),
    }));

    const formattedBreaks = breaks.map((b) => ({
      weekday: b.weekday,
      startMinute: timeStringToMinute(b.startTime),
      endMinute: timeStringToMinute(b.endTime),
      label: b.label || undefined,
    }));

    const payload = {
      name,
      specialty: specialty || undefined,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      isActive,
      appointmentMinutes: appointmentMinutes ? Number(appointmentMinutes) : undefined,
      bufferMinutes: bufferMinutes ? Number(bufferMinutes) : undefined,
      serviceIds: selectedServices,
      schedules: formattedSchedules,
      breaks: formattedBreaks,
    };

    startTransition(async () => {
      const res = await saveDoctorAction(clinicId, initialData?.id, { status: 'idle' }, payload);
      if (res.status === 'error') {
        setErrorMsg(res.message || 'Failed to save doctor schedule.');
      } else {
        setSuccessMsg(res.message || 'Saved successfully!');
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Doctor Basics */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] border-b pb-2">
          Doctor Profile & Overrides
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Full Name *
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Sarah Jenkins"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Specialty
            </label>
            <Input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Dermatologist / General Physician"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Slot Duration Override (min)
            </label>
            <Input
              type="number"
              min={5}
              max={480}
              value={appointmentMinutes}
              onChange={(e) => setAppointmentMinutes(e.target.value)}
              placeholder="Default (from service/clinic)"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Buffer Time Override (min)
            </label>
            <Input
              type="number"
              min={0}
              max={240}
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(e.target.value)}
              placeholder="Default (from clinic)"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted block mb-1">
            Assigned Services
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {availableServices.length === 0 ? (
              <span className="text-xs text-muted">No clinic services available yet.</span>
            ) : (
              availableServices.map((service) => (
                <label
                  key={service.id}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs cursor-pointer select-none transition-colors ${
                    selectedServices.includes(service.id)
                      ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)] text-[var(--color-brand-800)] font-medium'
                      : 'border-[var(--border)] surface-muted text-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => handleToggleService(service.id)}
                    className="sr-only"
                  />
                  <span>{service.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded border"
          />
          <label htmlFor="isActive" className="text-xs font-medium text-[var(--text)]">
            Active for online WhatsApp booking
          </label>
        </div>
      </Card>

      {/* Shifts & Schedules Builder */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] border-b pb-2">
          Weekly Shift Schedule & Breaks
        </h3>

        <div className="space-y-4">
          {WEEKDAYS.map((day) => {
            const daySchedules = schedules
              .map((s, idx) => ({ ...s, originalIndex: idx }))
              .filter((s) => s.weekday === day.id);

            const dayBreaks = breaks
              .map((b, idx) => ({ ...b, originalIndex: idx }))
              .filter((b) => b.weekday === day.id);

            return (
              <div
                key={day.id}
                className="rounded-lg border bg-[var(--surface-muted)]/30 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text)]">
                    {day.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddShift(day.id)}
                      className="text-[11px] font-semibold text-[var(--color-brand-600)] hover:underline"
                    >
                      + Add Shift
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBreak(day.id)}
                      className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      + Add Break
                    </button>
                  </div>
                </div>

                {daySchedules.length === 0 && dayBreaks.length === 0 ? (
                  <p className="text-[11px] text-subtle italic">No shifts or breaks defined (Day Off)</p>
                ) : (
                  <div className="space-y-1.5">
                    {/* Working Shifts */}
                    {daySchedules.map((shift) => (
                      <div
                        key={shift.originalIndex}
                        className="flex flex-wrap items-center gap-2 rounded border border-emerald-600/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs"
                      >
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                          Shift:
                        </span>
                        <input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => {
                            const newTime = e.target.value;
                            setSchedules((prev) =>
                              prev.map((item, i) =>
                                i === shift.originalIndex ? { ...item, startTime: newTime } : item,
                              ),
                            );
                          }}
                          className="h-7 rounded border bg-[var(--surface)] px-1.5 text-xs"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => {
                            const newTime = e.target.value;
                            setSchedules((prev) =>
                              prev.map((item, i) =>
                                i === shift.originalIndex ? { ...item, endTime: newTime } : item,
                              ),
                            );
                          }}
                          className="h-7 rounded border bg-[var(--surface)] px-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveShift(shift.originalIndex)}
                          className="text-rose-600 hover:text-rose-800 text-xs ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {/* Breaks */}
                    {dayBreaks.map((b) => (
                      <div
                        key={b.originalIndex}
                        className="flex flex-wrap items-center gap-2 rounded border border-amber-600/30 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs"
                      >
                        <span className="font-semibold text-amber-800 dark:text-amber-300">
                          Break:
                        </span>
                        <input
                          type="text"
                          value={b.label}
                          placeholder="Label (e.g. Lunch)"
                          onChange={(e) => {
                            const val = e.target.value;
                            setBreaks((prev) =>
                              prev.map((item, i) =>
                                i === b.originalIndex ? { ...item, label: val } : item,
                              ),
                            );
                          }}
                          className="h-7 w-28 rounded border bg-[var(--surface)] px-1.5 text-xs"
                        />
                        <input
                          type="time"
                          value={b.startTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBreaks((prev) =>
                              prev.map((item, i) =>
                                i === b.originalIndex ? { ...item, startTime: val } : item,
                              ),
                            );
                          }}
                          className="h-7 rounded border bg-[var(--surface)] px-1.5 text-xs"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={b.endTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBreaks((prev) =>
                              prev.map((item, i) =>
                                i === b.originalIndex ? { ...item, endTime: val } : item,
                              ),
                            );
                          }}
                          className="h-7 rounded border bg-[var(--surface)] px-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBreak(b.originalIndex)}
                          className="text-rose-600 hover:text-rose-800 text-xs ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Date Overrides / Time Off */}
      {initialData?.id && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-[var(--text)] border-b pb-2">
            Date-Specific Overrides / Leave
          </h3>
          {timeOffs.length === 0 ? (
            <p className="text-xs text-muted">No date overrides configured for this doctor.</p>
          ) : (
            <div className="space-y-2">
              {timeOffs.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded border bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-rose-800 dark:text-rose-300">
                      {t.startDate} {t.startDate !== t.endDate ? `to ${t.endDate}` : ''}
                    </span>
                    {t.reason && <span className="text-muted ml-2">({t.reason})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(async () => {
                        await deleteDoctorTimeOffAction(clinicId, t.id);
                        if (onSuccess) onSuccess();
                      });
                    }}
                    className="text-rose-600 hover:underline text-xs"
                  >
                    Delete Override
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving Doctor...' : initialData?.id ? 'Update Schedule' : 'Create Doctor'}
        </Button>
      </div>
    </form>
  );
}
