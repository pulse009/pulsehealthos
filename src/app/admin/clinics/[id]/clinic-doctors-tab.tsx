'use client';

import React, { useState } from 'react';
import { Badge, Button, Card, EmptyState, Table, Td, Th } from '@/components/ui/primitives';
import { WeeklyScheduleCalendar } from '@/components/calendar/WeeklyScheduleCalendar';
import { DoctorScheduleEditor } from '@/components/doctors/DoctorScheduleEditor';
import { DoctorTimeOffModal } from '@/components/doctors/DoctorTimeOffModal';
import { ConfirmButton } from '@/components/forms/action-form';
import { deleteDoctorAction, deleteDoctorTimeOffAction } from '@/app/admin/doctors/actions';

interface DoctorTabProps {
  clinicId: string;
  clinicName: string;
  doctors: Array<{
    id: string;
    name: string;
    specialty?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    isActive: boolean;
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
    services: Array<{ service: { id: string; name: string } }>;
  }>;
  services: Array<{ id: string; name: string }>;
}

export function ClinicDoctorsTab({ clinicId, clinicName, doctors, services }: DoctorTabProps) {
  const [activeView, setActiveView] = useState<'calendar' | 'add' | 'edit' | 'timeoff'>('calendar');
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  const editingDoctor = doctors.find((d) => d.id === editingDoctorId);

  const formattedDoctorsForCalendar = doctors.map((d) => ({
    ...d,
    serviceIds: d.services.map((s) => s.service.id),
  }));

  const handleEditDoctor = (docId: string) => {
    setEditingDoctorId(docId);
    setActiveView('edit');
  };

  return (
    <div className="space-y-6">
      {/* Subnav / Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant={activeView === 'calendar' ? 'primary' : 'secondary'}
            onClick={() => {
              setActiveView('calendar');
              setEditingDoctorId(null);
            }}
          >
            📅 Visual Weekly Schedule
          </Button>
          <Button
            variant={activeView === 'add' ? 'primary' : 'secondary'}
            onClick={() => {
              setActiveView('add');
              setEditingDoctorId(null);
            }}
          >
            + Add New Doctor
          </Button>
          {doctors.length > 0 && (
            <Button
              variant={activeView === 'timeoff' ? 'primary' : 'secondary'}
              onClick={() => setActiveView('timeoff')}
            >
              🚫 Add Date Override / Leave
            </Button>
          )}
        </div>
      </div>

      {/* Mode Views */}
      {activeView === 'calendar' && (
        <WeeklyScheduleCalendar
          doctors={formattedDoctorsForCalendar}
          clinicName={clinicName}
        />
      )}

      {(activeView === 'add' || (activeView === 'edit' && editingDoctor)) && (
        <Card className="p-4">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="text-base font-semibold">
              {activeView === 'add' ? 'Add New Doctor Schedule' : `Edit Schedule: ${editingDoctor?.name}`}
            </h3>
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => {
                setActiveView('calendar');
                setEditingDoctorId(null);
              }}
            >
              Close Editor
            </Button>
          </div>
          <DoctorScheduleEditor
            clinicId={clinicId}
            availableServices={services}
            initialData={
              editingDoctor
                ? {
                    ...editingDoctor,
                    serviceIds: editingDoctor.services.map((s) => s.service.id),
                  }
                : undefined
            }
            onSuccess={() => {
              setActiveView('calendar');
              setEditingDoctorId(null);
            }}
            onCancel={() => {
              setActiveView('calendar');
              setEditingDoctorId(null);
            }}
          />
        </Card>
      )}

      {activeView === 'timeoff' && (
        <DoctorTimeOffModal
          clinicId={clinicId}
          doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
          onSuccess={() => setActiveView('calendar')}
          onCancel={() => setActiveView('calendar')}
        />
      )}

      {/* Doctor Roster & Schedules Table */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Doctor Roster & Availability Rules</h3>
            <p className="text-xs text-muted">
              Configure working shifts, lunch breaks, duration overrides, and date-specific leave.
            </p>
          </div>
        </div>

        {doctors.length === 0 ? (
          <EmptyState
            title="No doctors added yet"
            description="Add doctors to enable WhatsApp appointment scheduling for this clinic."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Doctor</Th>
                <Th>Assigned Services</Th>
                <Th>Working Days & Shifts</Th>
                <Th>Overrides</Th>
                <Th>Date Overrides / Leave</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => {
                const shiftDays = [...new Set(doc.schedules.map((s) => s.weekday))].sort();
                return (
                  <tr key={doc.id}>
                    <Td>
                      <span className="font-semibold text-sm block">{doc.name}</span>
                      <span className="text-xs text-muted block">
                        {doc.specialty || 'General Practitioner'}
                      </span>
                    </Td>

                    <Td className="text-xs">
                      {doc.services.length === 0 ? (
                        <Badge tone="warning">None assigned</Badge>
                      ) : (
                        doc.services.map((s) => s.service.name).join(', ')
                      )}
                    </Td>

                    <Td className="text-xs">
                      {shiftDays.length === 0 ? (
                        <Badge tone="warning">No shifts set</Badge>
                      ) : (
                        <span>{shiftDays.length} day(s) / week</span>
                      )}
                    </Td>

                    <Td className="text-xs text-muted">
                      {doc.appointmentMinutes ? `${doc.appointmentMinutes}m slot` : 'Default'}
                      {doc.bufferMinutes ? ` · ${doc.bufferMinutes}m buffer` : ''}
                    </Td>

                    <Td className="text-xs">
                      {doc.timeOff.length === 0 ? (
                        <span className="text-subtle">—</span>
                      ) : (
                        <div className="space-y-1">
                          {doc.timeOff.map((t) => (
                            <div key={t.id} className="flex items-center gap-1.5">
                              <span className="font-medium text-rose-700 dark:text-rose-400">
                                {t.startDate}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteDoctorTimeOffAction(clinicId, t.id)}
                                className="text-[10px] text-muted hover:text-rose-600"
                                title="Delete override"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Td>

                    <Td>
                      <Badge tone={doc.isActive ? 'success' : 'neutral'}>
                        {doc.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>

                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-7 text-xs px-2"
                          onClick={() => handleEditDoctor(doc.id)}
                        >
                          Edit Schedule
                        </Button>
                        <ConfirmButton
                          confirmMessage={`Delete doctor "${doc.name}"?`}
                          onConfirm={async () => {
                            await deleteDoctorAction(clinicId, doc.id);
                          }}
                        >
                          Delete
                        </ConfirmButton>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
