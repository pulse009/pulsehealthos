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
  HeartPulse,
  Building2,
  Pill,
  FlaskConical,
} from 'lucide-react';

export type ClinicStaffRole = 'COORDINATOR' | 'RECEPTIONIST' | 'NURSE' | 'MANAGER' | 'PHARMACIST' | 'LAB_TECHNICIAN';

export interface StaffUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: ClinicStaffRole;
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
  const activeTab: 'ALL' | ClinicStaffRole = useMemo(() => {
    if (tabParam === 'managers') return 'MANAGER';
    if (tabParam === 'nurses') return 'NURSE';
    if (tabParam === 'pharmacists') return 'PHARMACIST';
    if (tabParam === 'lab') return 'LAB_TECHNICIAN';
    if (tabParam === 'receptionists') return 'RECEPTIONIST';
    if (tabParam === 'coordinators') return 'COORDINATOR';
    return 'ALL';
  }, [tabParam]);

  const handleTabChange = (tab: 'ALL' | ClinicStaffRole) => {
    const map: Record<string, string> = {
      MANAGER: 'managers',
      NURSE: 'nurses',
      PHARMACIST: 'pharmacists',
      LAB_TECHNICIAN: 'lab',
      RECEPTIONIST: 'receptionists',
      COORDINATOR: 'coordinators',
      ALL: 'all',
    };
    router.replace(`/portal/roles?tab=${map[tab] || 'all'}`, { scroll: false });
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState<ClinicStaffRole>('MANAGER');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      if (activeTab !== 'ALL' && staff.role !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = staff.name.toLowerCase().includes(query);
        const matchesEmail = staff.email.toLowerCase().includes(query);
        const matchesUser = staff.username?.toLowerCase().includes(query) || false;
        return matchesName || matchesEmail || matchesUser;
      }
      return true;
    });
  }, [staffList, activeTab, searchQuery]);

  // Statistics
  const managerCount = useMemo(() => staffList.filter((s) => s.role === 'MANAGER').length, [staffList]);
  const nurseCount = useMemo(() => staffList.filter((s) => s.role === 'NURSE').length, [staffList]);
  const pharmacistCount = useMemo(() => staffList.filter((s) => s.role === 'PHARMACIST').length, [staffList]);
  const labTechCount = useMemo(() => staffList.filter((s) => s.role === 'LAB_TECHNICIAN').length, [staffList]);
  const receptionistCount = useMemo(() => staffList.filter((s) => s.role === 'RECEPTIONIST').length, [staffList]);
  const coordinatorCount = useMemo(() => staffList.filter((s) => s.role === 'COORDINATOR').length, [staffList]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddModal = () => {
    setFullName('');
    setUsername('');
    setRole('NURSE');
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

  const getRoleBadge = (role: ClinicStaffRole) => {
    switch (role) {
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <Building2 className="size-3 text-amber-600" />
            Clinic Manager
          </span>
        );
      case 'NURSE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
            <HeartPulse className="size-3 text-purple-600" />
            Staff Nurse
          </span>
        );
      case 'PHARMACIST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/30">
            <Pill className="size-3 text-[#0d6157]" />
            Pharmacist
          </span>
        );
      case 'LAB_TECHNICIAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <FlaskConical className="size-3 text-blue-600" />
            Lab Technologist
          </span>
        );
      case 'RECEPTIONIST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <CalendarDays className="size-3 text-emerald-600" />
            Receptionist
          </span>
        );
      case 'COORDINATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <Stethoscope className="size-3 text-blue-500" />
            Coordinator
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  const getOperationalScope = (user: StaffUser) => {
    switch (user.role) {
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium text-[11px]">
            <span className="size-1.5 rounded-full bg-amber-500"></span>
            Clinic Operations &amp; Shift Audits
          </span>
        );
      case 'NURSE':
        return (
          <span className="inline-flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-medium text-[11px]">
            <span className="size-1.5 rounded-full bg-purple-500"></span>
            Vitals Triage &amp; Patient Preparation
          </span>
        );
      case 'PHARMACIST':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#0d5c56] dark:text-teal-400 font-medium text-[11px]">
            <span className="size-1.5 rounded-full bg-[#0d6157]"></span>
            Prescription Dispensing &amp; Stock
          </span>
        );
      case 'LAB_TECHNICIAN':
        return (
          <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium text-[11px]">
            <span className="size-1.5 rounded-full bg-blue-500"></span>
            Diagnostic Testing &amp; Path Releases
          </span>
        );
      case 'RECEPTIONIST':
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
            <span className="size-1.5 rounded-full bg-emerald-500"></span>
            Front Desk Queue &amp; Invoicing
          </span>
        );
      case 'COORDINATOR':
        const assignedDoc = user.coordinatedDoctors?.[0];
        return assignedDoc ? (
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-medium text-xs">
            <span className="size-1.5 rounded-full bg-blue-500"></span>
            <span>Dr. {assignedDoc.name.replace(/^Dr\.\s*/i, '')}</span>
          </div>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
            • Unassigned Doctor
          </span>
        );
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Staff &amp; Access Governance</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Users className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Clinic Roles &amp; Team Directory</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Manage credentials, permissions, and specialized roles for Managers, Nurses, Pharmacists, Receptionists, and Coordinators.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0 hover:scale-[1.01] active:scale-[0.99]"
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

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, DIVIDED) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Staff */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Active Staff
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {staffList.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                All-Staff Accounts
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Users className="size-4" />
          </div>
        </div>

        {/* Card 2: Clinical Nurses */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Clinical Nurses
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {nurseCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-purple-200/80 dark:border-purple-900/50 inline-block">
                Vitals &amp; Triage
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-purple-50/90 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-900/50 shadow-2xs">
            <HeartPulse className="size-4" />
          </div>
        </div>

        {/* Card 3: Clinic Managers & Pharmacists */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Managers &amp; Pharmacy
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {managerCount + pharmacistCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block">
                {managerCount} Mgr • {pharmacistCount} Pharm
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
            <Building2 className="size-4" />
          </div>
        </div>

        {/* Card 4: Reception & Coordinators */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Front Desk &amp; Triage
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {receptionistCount + coordinatorCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-200/80 dark:border-emerald-900/50 inline-block">
                {receptionistCount} Rec • {coordinatorCount} Coord
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs">
            <CalendarDays className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR ROW (SEGMENTED TABS & SEARCH) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {[
            { id: 'ALL', label: `All Roles (${staffList.length})` },
            { id: 'MANAGER', label: `Managers (${managerCount})` },
            { id: 'NURSE', label: `Nurses (${nurseCount})` },
            { id: 'PHARMACIST', label: `Pharmacists (${pharmacistCount})` },
            { id: 'LAB_TECHNICIAN', label: `Lab Technologists (${labTechCount})` },
            { id: 'RECEPTIONIST', label: `Receptionists (${receptionistCount})` },
            { id: 'COORDINATOR', label: `Coordinators (${coordinatorCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0d6157] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all"
          />
        </div>
      </div>

      {/* 4. MAIN TABLE SECTION */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full min-w-[900px] text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-850 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700 z-10 backdrop-blur-xs whitespace-nowrap">
              <tr>
                <th className="py-3 px-6">Staff Member</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Operational Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <UserCog className="size-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No team members found in this category.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search query.'
                        : 'Click "Add Team Member" above to create credentials.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user) => {
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-6 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-[#0d6157] dark:text-teal-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200 dark:border-slate-700">
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
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[8px] text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
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
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Operational Scope */}
                      <td className="py-3 px-4">
                        {getOperationalScope(user)}
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-[8px] transition-colors cursor-pointer"
                            title="Reset password"
                          >
                            <KeyRound className="size-3" />
                            <span>Reset Password</span>
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(user)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-[8px] transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-xl max-w-lg w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300">
                  <UserCog className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Add Staff Member</h3>
                  <p className="text-[10px] text-slate-400">Create user login credentials with role-specific access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                  placeholder="e.g. Nurse Fatima Al-Salem / Dr. Manager"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] font-medium"
                />
              </div>

              {/* Username (Optional) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Username <span className="text-slate-400 font-normal normal-case">(Optional, auto-generated if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. fatima.nurse"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] font-medium"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Select Clinic Role *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('NURSE')}
                    className={`p-2 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'NURSE'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 ring-1 ring-purple-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <HeartPulse className="size-3 text-purple-600" />
                      <span>Nurse</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Vitals &amp; Patient Prep.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('MANAGER')}
                    className={`p-2 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'MANAGER'
                        ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-1 ring-amber-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Building2 className="size-3 text-amber-600" />
                      <span>Manager</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Operations &amp; Audits.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('PHARMACIST')}
                    className={`p-2 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'PHARMACIST'
                        ? 'border-[#0d6157] bg-[#e6f6f3] dark:bg-[#0d6157]/30 text-[#0d5c56] dark:text-teal-200 ring-1 ring-[#0d6157]'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Pill className="size-3 text-[#0d6157]" />
                      <span>Pharmacist</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Dispensing &amp; Stock.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('RECEPTIONIST')}
                    className={`p-2 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'RECEPTIONIST'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <CalendarDays className="size-3 text-emerald-600" />
                      <span>Receptionist</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Front Desk &amp; Billing.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('COORDINATOR')}
                    className={`p-2 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'COORDINATOR'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Stethoscope className="size-3 text-blue-600" />
                      <span>Coordinator</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Doctor WhatsApp Triage.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('LAB_TECHNICIAN')}
                    className={`p-2 text-left rounded-[8px] border transition-all cursor-pointer ${
                      role === 'LAB_TECHNICIAN'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <FlaskConical className="size-3 text-indigo-600" />
                      <span>Lab Tech</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Diagnostics &amp; LIS.
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] font-medium"
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
                  Set Initial Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] font-medium"
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
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[8px] bg-blue-50 dark:bg-blue-950 text-blue-600">
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
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] font-medium"
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
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[8px] bg-red-50 dark:bg-red-950 text-red-600">
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
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

