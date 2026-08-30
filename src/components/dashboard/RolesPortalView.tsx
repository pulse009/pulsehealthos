'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  UserCheck,
  UserCog,
  Shield,
  KeyRound,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  CalendarDays,
  Lock,
  Copy,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';

export interface StaffUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: 'COORDINATOR' | 'RECEPTIONIST';
  isActive: boolean;
  createdAt: string | Date;
  coordinatedDoctors?: Array<{ id: string; name: string }>;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialty?: string | null;
}

interface RolesPortalViewProps {
  initialStaff: StaffUser[];
  doctors: DoctorOption[];
  clinicName: string;
}

export function RolesPortalView({
  initialStaff,
  doctors,
  clinicName,
}: RolesPortalViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [staffList, setStaffList] = useState<StaffUser[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync tab with URL search parameter
  const tabParam = searchParams.get('tab');
  const activeTab: 'ALL' | 'COORDINATOR' | 'RECEPTIONIST' = useMemo(() => {
    if (tabParam === 'coordinators') return 'COORDINATOR';
    if (tabParam === 'receptionists') return 'RECEPTIONIST';
    return 'ALL';
  }, [tabParam]);

  const handleTabChange = (tab: 'ALL' | 'COORDINATOR' | 'RECEPTIONIST') => {
    const paramVal = tab === 'COORDINATOR' ? 'coordinators' : tab === 'RECEPTIONIST' ? 'receptionists' : 'all';
    router.replace(`/portal/roles?tab=${paramVal}`, { scroll: false });
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'COORDINATOR' | 'RECEPTIONIST'>('COORDINATOR');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (activeTab !== 'ALL' && s.role !== activeTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [staffList, activeTab, searchQuery]);

  // Statistics
  const coordinatorCount = useMemo(
    () => staffList.filter((s) => s.role === 'COORDINATOR').length,
    [staffList]
  );
  const receptionistCount = useMemo(
    () => staffList.filter((s) => s.role === 'RECEPTIONIST').length,
    [staffList]
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddModal = () => {
    setFullName('');
    setUsername('');
    setRole('COORDINATOR');
    setSelectedDoctorId(doctors[0]?.id || '');
    setPassword('');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter the staff member full name.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          username: username.trim() || undefined,
          role,
          doctorId: role === 'COORDINATOR' && selectedDoctorId ? selectedDoctorId : undefined,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create staff member.');
      }

      // Re-fetch or append
      const assignedDoc = doctors.find((d) => d.id === selectedDoctorId);
      const createdUser: StaffUser = {
        ...data.staff,
        coordinatedDoctors:
          role === 'COORDINATOR' && assignedDoc ? [{ id: assignedDoc.id, name: assignedDoc.name }] : [],
      };

      setStaffList((prev) => [createdUser, ...prev]);
      setIsAddModalOpen(false);
      setSuccessMsg(`Account for "${fullName}" created successfully with username "${data.staff.username}".`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResetModal = (user: StaffUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setErrorMsg(null);
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setIsResetModalOpen(false);
      setSuccessMsg(`Password for "${selectedUser.name}" reset successfully.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (user: StaffUser) => {
    setSelectedUser(user);
    setErrorMsg(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStaff = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/roles?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to remove staff account.');
      }

      setStaffList((prev) => prev.filter((s) => s.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSuccessMsg(`Staff account "${selectedUser.name}" has been removed.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER (FLUSH BORDER ATTACHED TO SIDEBAR) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <span>Clinic Roles &amp; Staff</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Manage user credentials, roles, and doctor assignments for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, DIVIDED, MATCHING DASHBOARD THEME) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Staff */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Total Staff
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {staffList.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-slate-200 dark:border-slate-700 inline-block">
                Active accounts
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Users className="size-4" />
          </div>
        </div>

        {/* Card 2: Medical Coordinators */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
              Medical Coordinators
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {coordinatorCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-100 dark:border-blue-900/50 inline-block">
                Assigned to doctors
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/70 dark:border-blue-900/50 shadow-2xs">
            <Stethoscope className="size-4" />
          </div>
        </div>

        {/* Card 3: Receptionists */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Receptionists
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {receptionistCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Global appointment managers
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CalendarDays className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR ROW (FLAT, BORDER-B, FIXED SEARCH & SEGMENTED TABS) */}
      <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-[8px]">
            <button
              onClick={() => handleTabChange('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Roles ({staffList.length})
            </button>
            <button
              onClick={() => handleTabChange('COORDINATOR')}
              className={`px-3 py-1 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                activeTab === 'COORDINATOR'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Coordinators ({coordinatorCount})
            </button>
            <button
              onClick={() => handleTabChange('RECEPTIONIST')}
              className={`px-3 py-1 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                activeTab === 'RECEPTIONIST'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Receptionists ({receptionistCount})
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 4. MAIN TABLE SECTION (FULL-HEIGHT SCROLLER, STICKY HEADERS, EXACT THEME DESIGN) */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-6">Staff Member</th>
                <th className="py-2.5 px-4">Username</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Operational Scope</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <UserCog className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No team members found.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search criteria.'
                        : 'Click "Add Team Member" above to create credentials.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user) => {
                  const isCoord = user.role === 'COORDINATOR';
                  const assignedDoc = user.coordinatedDoctors?.[0];

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-6 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200 dark:border-slate-700">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-semibold text-slate-900 dark:text-white truncate">
                              {user.name}
                            </span>
                            <span className="block text-[10px] text-slate-400 truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[6px] text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          <span>@{user.username || 'unassigned'}</span>
                          {user.username && (
                            <button
                              onClick={() => handleCopy(user.username!, user.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy username"
                            >
                              {copiedId === user.id ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        {isCoord ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                            <Stethoscope className="size-3 text-blue-500" />
                            Coordinator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            <CalendarDays className="size-3 text-emerald-500" />
                            Receptionist
                          </span>
                        )}
                      </td>

                      {/* Operational Scope */}
                      <td className="py-3 px-4">
                        {isCoord ? (
                          assignedDoc ? (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                              <span className="size-1.5 rounded-full bg-blue-500"></span>
                              <span>Dr. {assignedDoc.name.replace(/^Dr\.\s*/i, '')}</span>
                            </div>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                              • Unassigned Doctor
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                            All Doctors (Full Appointments)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
                          <span className="size-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenResetModal(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-[6px] transition-colors cursor-pointer"
                            title="Reset password"
                          >
                            <KeyRound className="size-3" />
                            <span>Reset Password</span>
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(user)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-[6px] transition-colors cursor-pointer"
                            title="Remove staff member"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD STAFF / ROLE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <UserCog className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Add Staff Member</h3>
                  <p className="text-[10px] text-slate-400">Create user login credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              {/* Username (Optional) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Username <span className="text-slate-400 font-normal normal-case">(Optional, auto-generated if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. sarah.rec"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Select Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('COORDINATOR')}
                    className={`p-2.5 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'COORDINATOR'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Stethoscope className="size-3 text-blue-600" />
                      <span>Coordinator</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Assigned to specific doctor.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('RECEPTIONIST')}
                    className={`p-2.5 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'RECEPTIONIST'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <CalendarDays className="size-3 text-emerald-600" />
                      <span>Receptionist</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      All doctors' appointments.
                    </p>
                  </button>
                </div>
              </div>

              {/* Assigned Doctor (Only for Coordinator) */}
              {role === 'COORDINATOR' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Assign to Doctor
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="">-- Assign Later --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name.replace(/^Dr\.\s*/i, '')} {d.specialty ? `(${d.specialty})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Set Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Set Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Reset Password</h3>
                  <p className="text-[10px] text-slate-400">Set new password for {selectedUser?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-[8px] text-[11px] space-y-0.5 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-slate-500">
                  Account: <strong className="text-slate-800 dark:text-white">{selectedUser?.name}</strong>
                </p>
                <p className="text-slate-500">
                  Username: <strong className="text-slate-800 dark:text-white">@{selectedUser?.username}</strong>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-red-50 dark:bg-red-950 text-red-600">
                  <Trash2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Remove Staff Member</h3>
                  <p className="text-[10px] text-slate-400">Confirm account deletion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{selectedUser?.name}</strong> (@{selectedUser?.username})? They will immediately lose access to the clinic platform.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDeleteStaff}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Removing...' : 'Yes, Remove Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
