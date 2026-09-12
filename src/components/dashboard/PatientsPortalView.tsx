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
  Loader2,
  CheckSquare,
  Square,
  MinusSquare,
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
  userRole?: string;
}

export function PatientsPortalView({
  clinicName,
  initialPatients = [],
  userRole,
}: PatientsPortalViewProps) {
  const isNurse = userRole === 'NURSE';
  const [patients, setPatients] = useState<PatientItem[]>(initialPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');

  // Checkbox & Bulk Selection State
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

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

  // Delete Confirmation Modal State (Unified for Single & Bulk)
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'SINGLE' | 'BULK';
    patient?: PatientItem;
    count?: number;
  }>({
    isOpen: false,
    type: 'SINGLE',
  });
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

  // Selection Handlers
  const isAllSelected =
    filteredPatients.length > 0 &&
    filteredPatients.every((p) => selectedPatientIds.includes(p.id));

  const isSomeSelected =
    selectedPatientIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all currently visible
      const visibleIdSet = new Set(filteredPatients.map((p) => p.id));
      setSelectedPatientIds((prev) => prev.filter((id) => !visibleIdSet.has(id)));
    } else {
      // Select all visible
      const newIds = new Set([...selectedPatientIds, ...filteredPatients.map((p) => p.id)]);
      setSelectedPatientIds(Array.from(newIds));
    }
  };

  const handleToggleSelectPatient = (id: string) => {
    setSelectedPatientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePromptDeleteSingle = (patient: PatientItem) => {
    if (isNurse) return;
    setDeleteError(null);
    setDeleteModalState({
      isOpen: true,
      type: 'SINGLE',
      patient,
    });
  };

  const handlePromptDeleteBulk = () => {
    if (isNurse || selectedPatientIds.length === 0) return;
    setDeleteError(null);
    setDeleteModalState({
      isOpen: true,
      type: 'BULK',
      count: selectedPatientIds.length,
    });
  };

  const handleConfirmDelete = async () => {
    if (isNurse) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deleteModalState.type === 'SINGLE' && deleteModalState.patient) {
        const pId = deleteModalState.patient.id;
        const res = await fetch(`/api/patients?id=${encodeURIComponent(pId)}`, {
          method: 'DELETE',
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || data?.message || 'Failed to delete patient.');
        }

        setPatients((prev) => prev.filter((p) => p.id !== pId));
        setSelectedPatientIds((prev) => prev.filter((id) => id !== pId));
        showToast(`Patient "${deleteModalState.patient.name}" deleted successfully.`);
      } else if (deleteModalState.type === 'BULK' && selectedPatientIds.length > 0) {
        const res = await fetch('/api/patients', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedPatientIds }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || data?.message || 'Failed to delete selected patients.');
        }

        const deletedSet = new Set(selectedPatientIds);
        setPatients((prev) => prev.filter((p) => !deletedSet.has(p.id)));
        setSelectedPatientIds([]);
        showToast(`${data.count || selectedPatientIds.length} patients permanently deleted from clinic.`);
      }

      setDeleteModalState({ isOpen: false, type: 'SINGLE' });
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

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
      showToast(`Patient "${created.name}" registered successfully.`);
    } catch (err: any) {
      setModalError(err.message || 'Error creating patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-2 bg-[#0d6157] text-white px-4 py-2.5 rounded-[8px] shadow-lg border border-[#0d6157]/40 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

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

      {/* Bulk Action Strip */}
      {!isNurse && selectedPatientIds.length > 0 && (
        <div className="px-6 py-2.5 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-4 animate-in fade-in duration-150 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <span className="inline-flex items-center justify-center bg-blue-600 text-white size-5 rounded-full text-[10px] font-bold">
              {selectedPatientIds.length}
            </span>
            <span>patient{selectedPatientIds.length === 1 ? '' : 's'} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedPatientIds([])}
              className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-[6px] transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handlePromptDeleteBulk}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Selected ({selectedPatientIds.length})</span>
            </button>
          </div>
        </div>
      )}

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
                {!isNurse && (
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      title={isAllSelected ? 'Deselect all' : 'Select all visible'}
                      className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="size-4 text-blue-600 dark:text-blue-400" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="size-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="size-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
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
                {!isNurse && (
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider text-right whitespace-nowrap">
                    ACTION
                  </th>
                )}
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
                const isSelected = selectedPatientIds.includes(p.id);

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/30'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/40'
                    }`}
                  >
                    {!isNurse && (
                      <td className="py-3 px-4 w-10 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectPatient(p.id)}
                          className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="size-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="py-3 px-4 whitespace-nowrap">
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
                    {!isNurse && (
                      <td className="py-3 px-6 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handlePromptDeleteSingle(p)}
                          className="p-1.5 rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete patient and all records"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    )}
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

      {/* Delete Patient Confirmation Modal (Single & Bulk) */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-2xl max-w-md w-full p-6 relative text-xs animate-in zoom-in-95 duration-100 flex flex-col space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {deleteModalState.type === 'SINGLE'
                    ? 'Delete Patient Record?'
                    : `Delete ${deleteModalState.count} Patient Records?`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {deleteModalState.type === 'SINGLE' && deleteModalState.patient ? (
                    <>
                      Are you sure you want to permanently delete{' '}
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {deleteModalState.patient.name}
                      </span>{' '}
                      (<span className="font-mono">{deleteModalState.patient.patientId || `PID-${deleteModalState.patient.id.slice(0, 6)}`}</span>)?
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete{' '}
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {deleteModalState.count} selected patients
                      </span>{' '}
                      from the clinic?
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Cascade Warning Box */}
            <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 rounded-[8px] text-rose-900 dark:text-rose-200 space-y-1 text-xs">
              <p className="font-semibold text-[11px] text-rose-800 dark:text-rose-300">
                ⚠️ Permanent Cascade Deletion:
              </p>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                This will permanently delete all associated data including appointments, conversations, messages, reminders, and patient portal accounts. This action <strong>cannot</strong> be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalState({ isOpen: false, type: 'SINGLE' })}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-[8px] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                <span>
                  {isDeleting
                    ? 'Deleting...'
                    : deleteModalState.type === 'SINGLE'
                    ? 'Confirm Delete'
                    : `Delete ${deleteModalState.count} Patients`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
