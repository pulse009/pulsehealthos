'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  User,
  X,
  UserCheck,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  FileText,
  Building2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export interface PatientItem {
  id: string;
  patientId?: string;
  fileNumber: number | null;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  nationality: string | null;
  title: string | null;
  createdAt: string;
  appointmentsCount: number;
  latestAppointmentDate?: string | null;
}

interface PatientsPortalViewProps {
  clinicName: string;
  initialPatients: PatientItem[];
}

export function PatientsPortalView({
  clinicName,
  initialPatients = [],
}: PatientsPortalViewProps) {
  const [patients, setPatients] = useState<PatientItem[]>(initialPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');

  // Add Patient Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('Mr.');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newNationality, setNewNationality] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Patient Modal State
  const [patientToDelete, setPatientToDelete] = useState<PatientItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (selectedGender !== 'ALL' && p.gender !== selectedGender) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPhone = p.phone.toLowerCase().includes(q);
        const matchesEmail = p.email ? p.email.toLowerCase().includes(q) : false;
        const matchesId = (p.patientId || '').toLowerCase().includes(q);
        const matchesFile = p.fileNumber ? p.fileNumber.toString().includes(q) : false;
        const matchesNat = p.nationality ? p.nationality.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesId && !matchesFile && !matchesNat) {
          return false;
        }
      }
      return true;
    });
  }, [patients, searchQuery, selectedGender]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      setModalError('Please enter Patient Name and Phone Number.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          gender: newGender,
          nationality: newNationality.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create patient record');
      }

      const created: PatientItem = {
        id: data.patient.id,
        patientId: data.patient.patientId || (data.patient.fileNumber ? `PID-${data.patient.fileNumber.toString().padStart(4, '0')}` : `PID-${data.patient.id.slice(0, 6)}`),
        fileNumber: data.patient.fileNumber,
        name: data.patient.name,
        phone: data.patient.phone,
        email: data.patient.email || null,
        gender: data.patient.gender || newGender,
        nationality: data.patient.nationality || newNationality || null,
        title: data.patient.title || newTitle,
        createdAt: data.patient.createdAt || new Date().toISOString(),
        appointmentsCount: 0,
        latestAppointmentDate: null,
      };

      setPatients((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewNationality('');
    } catch (err: any) {
      setModalError(err.message || 'Error creating patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    if (deleteConfirmText.trim() !== 'CONFIRM DELETE') {
      setDeleteError('Please type CONFIRM DELETE exactly to proceed.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/patients?id=${encodeURIComponent(patientToDelete.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || data?.message || 'Failed to delete patient.');
      }

      setPatients((prev) => prev.filter((p) => p.id !== patientToDelete.id));
      setPatientToDelete(null);
      setDeleteConfirmText('');
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'An error occurred while deleting patient.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Patients Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {patients.length} Patient{patients.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registered clinic patients for {clinicName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>+ Add Patient</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient ID, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="flex-1 overflow-auto min-h-0">
        {filteredPatients.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center gap-2">
            <Users className="size-8 text-slate-300 stroke-[1.5]" />
            <p>No patients found matching your search or filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  PATIENT ID
                </th>
                <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  PATIENT NAME
                </th>
                <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  CONTACT NUMBER
                </th>
                <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  GENDER / NATIONALITY
                </th>
                <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  APPOINTMENTS
                </th>
                <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  REGISTERED ON
                </th>
                <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider text-right whitespace-nowrap">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPatients.map((p) => {
                const pid = p.patientId || (p.fileNumber ? `PID-${p.fileNumber.toString().padStart(4, '0')}` : `PID-${p.id.slice(0, 6).toUpperCase()}`);
                const dateFormatted = new Date(p.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors"
                  >
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-[5px]">
                        {pid}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">
                            {p.title ? `${p.title} ` : ''}{p.name}
                          </span>
                          {p.email && (
                            <span className="text-[11px] text-slate-400 block truncate">
                              {p.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3 text-slate-400" />
                        {p.phone}
                      </span>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {p.gender || '—'} {p.nationality ? `• ${p.nationality}` : ''}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                        <Calendar className="size-3" />
                        {p.appointmentsCount} Booked
                      </span>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {dateFormatted}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPatientToDelete(p);
                          setDeleteConfirmText('');
                          setDeleteError(null);
                        }}
                        className="p-1.5 rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete patient and all records"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="size-4 text-blue-600" />
                <span>Add New Patient</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-3">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <select
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Patient full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Mobile Number (with Country Code) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 966501234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Nationality (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saudi"
                    value={newNationality}
                    onChange={(e) => setNewNationality(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Adding...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal (Requires typing CONFIRM DELETE) */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-2xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100 flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Delete Patient Record
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Permanent deletion with full cascade
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 rounded-[8px] text-rose-900 dark:text-rose-200 space-y-1.5">
              <p className="font-semibold text-xs">
                Are you sure you want to delete {patientToDelete.name}?
              </p>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                This will permanently delete this patient and <strong>ALL associated data</strong> including all appointments, conversations, messages, reminders, and user accounts. This action <strong>cannot</strong> be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            {/* Confirmation Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Type <span className="font-mono text-rose-600 dark:text-rose-400 uppercase font-extrabold select-all">CONFIRM DELETE</span> to verify:
              </label>
              <input
                type="text"
                placeholder="CONFIRM DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmText.trim() !== 'CONFIRM DELETE'}
                onClick={handleDeletePatient}
                className="px-4 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Trash2 className="size-3.5" />
                <span>{isDeleting ? 'Deleting All Data…' : 'Delete Patient Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
