'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
    <div className="flex-1 overflow-y-auto h-full bg-slate-50/50 dark:bg-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/60">
              <UserCog className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Clinic Roles &amp; Staff
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage user credentials, roles, and doctor assignments for {clinicName}
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>

        {/* Success Notification Alert */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Top 3 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Staff
              </span>
              <div className="size-8.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {staffList.length}
              </span>
              <span className="text-xs text-slate-500">active accounts</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Medical Coordinators
              </span>
              <div className="size-8.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Stethoscope className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {coordinatorCount}
              </span>
              <span className="text-xs text-slate-500">assigned to doctors</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Receptionists
              </span>
              <div className="size-8.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {receptionistCount}
              </span>
              <span className="text-xs text-slate-500">global appointment managers</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {/* Role Segmented Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => handleTabChange('ALL')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Roles ({staffList.length})
            </button>
            <button
              onClick={() => handleTabChange('COORDINATOR')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'COORDINATOR'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Coordinators ({coordinatorCount})
            </button>
            <button
              onClick={() => handleTabChange('RECEPTIONIST')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'RECEPTIONIST'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Receptionists ({receptionistCount})
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Operational Scope</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <UserCog className="size-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No team members found.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchQuery
                          ? 'Try modifying your search filter.'
                          : 'Click "Add Team Member" above to create coordinator or receptionist credentials.'}
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
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="size-8.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
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
                              <span className="block text-[11px] text-slate-400 truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
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
                        <td className="py-3.5 px-4">
                          {isCoord ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                              <Stethoscope className="size-3 text-blue-500" />
                              Coordinator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              <CalendarDays className="size-3 text-emerald-500" />
                              Receptionist
                            </span>
                          )}
                        </td>

                        {/* Operational Scope */}
                        <td className="py-3.5 px-4">
                          {isCoord ? (
                            assignedDoc ? (
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                <span className="size-1.5 rounded-full bg-blue-500"></span>
                                <span>Dr. {assignedDoc.name.replace(/^Dr\.\s*/i, '')}</span>
                              </div>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                                • Unassigned Doctor
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                              <span className="size-1.5 rounded-full bg-emerald-500"></span>
                              All Doctors (Full Appointments)
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenResetModal(user)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              title="Reset password"
                            >
                              <KeyRound className="size-3.5" />
                              <span>Reset Password</span>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(user)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Remove staff member"
                            >
                              <Trash2 className="size-4" />
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative text-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <UserCog className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Staff Member</h3>
                    <p className="text-[11px] text-slate-400">Create login credentials for clinic personnel</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3.5">
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                {/* Username (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Username <span className="text-slate-400 font-normal normal-case">(Optional, auto-generated if blank)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. sarah.rec"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('COORDINATOR')}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        role === 'COORDINATOR'
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Stethoscope className="size-3.5 text-blue-600" />
                        <span>Coordinator</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Assigned to a specific doctor.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('RECEPTIONIST')}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        role === 'RECEPTIONIST'
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-600'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <CalendarDays className="size-3.5 text-emerald-600" />
                        <span>Receptionist</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Manages all doctors' appointments.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Assigned Doctor (Only for Coordinator) */}
                {role === 'COORDINATOR' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Assign to Doctor
                    </label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
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
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Set Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative text-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <KeyRound className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reset Password</h3>
                    <p className="text-[11px] text-slate-400">Set a new login password for {selectedUser?.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                  <p className="text-slate-500">
                    Account: <strong className="text-slate-800 dark:text-white">{selectedUser?.name}</strong>
                  </p>
                  <p className="text-slate-500">
                    Username: <strong className="text-slate-800 dark:text-white">@{selectedUser?.username}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative text-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600">
                    <Trash2 className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remove Staff Member</h3>
                    <p className="text-[11px] text-slate-400">Confirm account deletion</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-4">
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="size-4 shrink-0" />
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
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleDeleteStaff}
                    className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Removing...' : 'Yes, Remove Staff'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
