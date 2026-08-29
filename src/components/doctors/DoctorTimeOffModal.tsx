'use client';

import React, { useState, useTransition } from 'react';
import { Button, Card, Input } from '@/components/ui/primitives';
import { addDoctorTimeOffAction } from '@/app/admin/doctors/actions';

interface DoctorTimeOffModalProps {
  clinicId: string;
  doctors: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DoctorTimeOffModal({
  clinicId,
  doctors,
  onSuccess,
  onCancel,
}: DoctorTimeOffModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id ?? '');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setErrorMsg('Please select a doctor.');
      return;
    }

    const formData = new FormData();
    formData.set('startDate', startDate);
    formData.set('endDate', endDate);
    if (reason) formData.set('reason', reason);

    startTransition(async () => {
      const res = await addDoctorTimeOffAction(clinicId, selectedDoctorId, { status: 'idle' }, formData);
      if (res.status === 'error') {
        setErrorMsg(res.message || 'Failed to add date override.');
      } else {
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <Card className="p-4 space-y-4 max-w-md mx-auto">
      <h3 className="text-sm font-bold text-[var(--text)] border-b pb-2">
        Add Doctor Date Override / Time-off
      </h3>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="font-semibold text-muted block mb-1">Select Doctor</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full h-8 rounded-lg border bg-[var(--surface)] px-2 text-xs"
            required
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-semibold text-muted block mb-1">Start Date</label>
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="font-semibold text-muted block mb-1">End Date</label>
            <Input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-muted block mb-1">Reason (Optional)</label>
          <Input
            type="text"
            placeholder="e.g. Annual Leave, Medical Conference, Holiday"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Add Override'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
