'use client';

import React, { useState, useMemo } from 'react';
import {
  LuBuilding2 as Building2,
  LuUsers as Users,
  LuWallet as Wallet,
  LuBoxes as Boxes,
  LuClock as Clock,
  LuCircleCheck as CheckCircle2,
  LuTriangleAlert as AlertTriangle,
  LuSearch as Search,
  LuUserCheck as UserCheck,
  LuDollarSign as DollarSign,
  LuFileText as FileText,
  LuPhone as Phone,
  LuCheck as Check,
  LuX as X,
  LuRefreshCw as RefreshCw,
  LuShieldAlert as ShieldAlert,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
import {
  LuHeartPulse as HeartPulse,
  LuPill as Pill,
  LuFlaskConical as FlaskConical,
  LuPlus as Plus,
  LuCalendarDays as CalendarDays,
} from 'react-icons/lu';
import { cn } from '@/components/ui/primitives';

export interface ManagerStaffMember {
  id: string;
  name: string;
  role: 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'RECEPTIONIST' | 'COORDINATOR' | 'LAB_TECHNICIAN' | 'MANAGER' | string;
  email: string;
  phone?: string | null;
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';
  shiftTime: string;
  location: string;
}

export interface ManagerCashAudit {
  id: string;
  receptionistName: string;
  terminalName: string;
  openingCash: number;
  cashCollected: number;
  cardCollected: number;
  totalCollected: number;
  expectedInDrawer: number;
  actualInDrawer: number;
  discrepancy: number;
  status: 'PENDING_AUDIT' | 'APPROVED' | 'DISCREPANCY_FLAGGED';
  submittedAt: string;
}

export interface ManagerApprovalRequest {
  id: string;
  requestType: 'PURCHASE_ORDER' | 'STOCK_REQUEST' | 'DISCOUNT_OVERRIDE';
  requestedBy: string;
  requesterRole: string;
  title: string;
  amount?: number;
  itemsCount?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialty?: string | null;
}

interface ManagerPortalViewProps {
  clinicName: string;
  managerName: string;
  staffList: ManagerStaffMember[];
  cashAudits: ManagerCashAudit[];
  approvals: ManagerApprovalRequest[];
  todayRevenue: number;
  appointmentsCount: number;
  doctors?: DoctorOption[];
}

export function ManagerPortalView({
  clinicName,
  managerName,
  staffList: initialStaff,
  cashAudits: initialAudits,
  approvals: initialApprovals,
  todayRevenue,
  appointmentsCount,
  doctors = [],
}: ManagerPortalViewProps) {
  const [staffList, setStaffList] = useState<ManagerStaffMember[]>(initialStaff);
  const [cashAudits, setCashAudits] = useState<ManagerCashAudit[]>(initialAudits);
  const [approvals, setApprovals] = useState<ManagerApprovalRequest[]>(initialApprovals);

  const [activeTab, setActiveTab] = useState<'ROSTER' | 'CASH_AUDIT' | 'APPROVALS'>('ROSTER');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'NURSE' | 'MANAGER' | 'PHARMACIST' | 'RECEPTIONIST' | 'COORDINATOR' | 'LAB_TECHNICIAN'>('NURSE');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setFullName('');
    setUsername('');
    setRole('NURSE');
    setSelectedDoctorId(doctors[0]?.id || '');
    setPassword('');
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setModalError('Please enter the staff member full name.');
      return;
    }
    if (!password || password.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

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

      const createdRole = data.staff.role || role;
      const location =
        createdRole === 'DOCTOR'
          ? 'Clinic Room 102'
          : createdRole === 'NURSE'
          ? 'Triage Station A'
          : createdRole === 'PHARMACIST'
          ? 'Main Dispensary'
          : createdRole === 'RECEPTIONIST'
          ? 'Front Desk Terminal 1'
          : createdRole === 'LAB_TECHNICIAN'
          ? 'Diagnostics Laboratory'
          : createdRole === 'MANAGER'
          ? 'Operations Office'
          : 'Care Management Desk';

      const newMember: ManagerStaffMember = {
        id: data.staff.id,
        name: data.staff.name || fullName,
        email: data.staff.email,
        role: createdRole,
        status: 'ON_DUTY',
        shiftTime: '08:00 AM - 05:00 PM',
        location,
      };

      setStaffList((prev) => [newMember, ...prev]);
      setIsAddModalOpen(false);
      setNotification(`Staff account for "${fullName}" created successfully with username "${data.staff.username}".`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while creating the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const onDutyCount = staffList.filter((s) => s.status === 'ON_DUTY').length;
    const pendingAuditsCount = cashAudits.filter((a) => a.status === 'PENDING_AUDIT').length;
    const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

    return { onDutyCount, pendingAuditsCount, pendingApprovalsCount };
  }, [staffList, cashAudits, approvals]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [staffList, roleFilter, searchQuery]);

  const handleApproveAudit = (auditId: string) => {
    setCashAudits((prev) =>
      prev.map((a) => (a.id === auditId ? { ...a, status: 'APPROVED' } : a))
    );
    setNotification('Cash Drawer Z-Report successfully signed off and approved.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApproveRequest = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' } : a))
    );
    setNotification('Operational request approved and dispatched.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRejectRequest = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' } : a))
    );
    setNotification('Operational request rejected.');
    setTimeout(() => setNotification(null), 4000);
  };

  const getRoleBadge = (role: ManagerStaffMember['role']) => {
    switch (role) {
      case 'DOCTOR':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200"><Stethoscope className="size-3" /> Doctor</span>;
      case 'NURSE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200"><HeartPulse className="size-3 text-purple-600" /> Nurse</span>;
      case 'PHARMACIST':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/30"><Pill className="size-3 text-[#0d6157]" /> Pharmacist</span>;
      case 'RECEPTIONIST':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200"><UserCheck className="size-3" /> Receptionist</span>;
      case 'COORDINATOR':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200"><Users className="size-3" /> Coordinator</span>;
      case 'LAB_TECHNICIAN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200"><FlaskConical className="size-3 text-indigo-600" /> Lab Tech</span>;
      case 'MANAGER':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300"><Building2 className="size-3 text-amber-600" /> Manager</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">{role}</span>;
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
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Clinic Operations &amp; Governance</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Building2 className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Clinic Operations &amp; Manager Hub</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            General Manager: <span className="font-semibold text-slate-700 dark:text-slate-200">{managerName}</span> • Staff shift roster, cash drawer reconciliations, and purchase approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="size-3.5" />
            <span>Add Staff Member</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Sync Ops</span>
          </button>
        </div>
      </div>

      {/* Notification Alert */}
      {notification && (
        <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, DIVIDED) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Staff on Duty */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Staff On Duty
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.onDutyCount} / {staffList.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                Across 5 Departments
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Users className="size-4" />
          </div>
        </div>

        {/* Card 2: Revenue Collected */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Today's Collections
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              SAR {todayRevenue.toLocaleString()}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-200/80 dark:border-emerald-900/50 inline-block">
                {appointmentsCount} Scheduled Appts
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs">
            <Wallet className="size-4" />
          </div>
        </div>

        {/* Card 3: Cash Drawer Audits */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Cash Drawer Audits
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.pendingAuditsCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block">
                Awaiting Sign-Off
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 4: Procurement Approvals */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Pending PO Approvals
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.pendingApprovalsCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-purple-200/80 dark:border-purple-900/50 inline-block">
                Procurement &amp; Orders
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-purple-50/90 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-900/50 shadow-2xs">
            <Boxes className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR ROW (SEGMENTED TABS & SEARCH) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {[
            { id: 'ROSTER', label: `Staff Attendance & Shift Roster (${staffList.length})` },
            { id: 'CASH_AUDIT', label: `Cash Register Z-Reports (${stats.pendingAuditsCount})` },
            { id: 'APPROVALS', label: `Procurement & PO Approvals (${stats.pendingApprovalsCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

        {activeTab === 'ROSTER' && (
          <div className="flex items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
            >
              <option value="ALL">All Roles</option>
              <option value="DOCTOR">Doctors</option>
              <option value="NURSE">Nurses</option>
              <option value="PHARMACIST">Pharmacists</option>
              <option value="RECEPTIONIST">Receptionists</option>
              <option value="COORDINATOR">Coordinators</option>
            </select>

            <div className="relative w-56 sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN DATA TABLE SECTION */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {activeTab === 'ROSTER' && (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Staff Member</th>
                  <th className="py-3 px-6">Role / Department</th>
                  <th className="py-3 px-6">Shift Schedule</th>
                  <th className="py-3 px-6">Station / Location</th>
                  <th className="py-3 px-6">Live Status</th>
                  <th className="py-3 px-6 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-[8px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{staff.name}</p>
                          <p className="text-[11px] text-slate-400">{staff.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      {getRoleBadge(staff.role)}
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="size-3.5 text-slate-400" />
                        {staff.shiftTime}
                      </p>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{staff.location}</span>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      {staff.status === 'ON_DUTY' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          On Duty
                        </span>
                      ) : staff.status === 'ON_BREAK' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                          On Break
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                          Off Duty
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <a
                        href={`tel:${staff.phone || ''}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#0d6157] bg-[#e6f6f3] hover:bg-[#d6f0eb] border border-[#0d8276]/30 rounded-[8px] transition-colors"
                      >
                        <Phone className="size-3" />
                        <span>Call</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'CASH_AUDIT' && (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    TERMINAL / DESK
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    RECEPTIONIST
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    OPENING CASH
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    COLLECTIONS (CASH / CARD)
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    DRAWER VARIANCE
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    AUDIT STATUS
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{audit.terminalName}</p>
                          <p className="text-[10px] text-slate-400">Submitted at {audit.submittedAt}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {audit.receptionistName}
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      SAR {audit.openingCash.toFixed(2)}
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <p className="font-bold font-mono text-slate-900 dark:text-white">
                        SAR {audit.totalCollected.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Cash: SAR {audit.cashCollected.toFixed(2)} | Card: SAR {audit.cardCollected.toFixed(2)}
                      </p>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      {audit.discrepancy === 0 ? (
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Balanced (SAR 0.00)
                        </span>
                      ) : (
                        <span className="font-mono text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          {audit.discrepancy > 0 ? `+SAR ${audit.discrepancy.toFixed(2)}` : `-SAR ${Math.abs(audit.discrepancy).toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      {audit.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" /> Approved &amp; Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="size-3" /> Pending Review
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      {audit.status === 'PENDING_AUDIT' ? (
                        <button
                          onClick={() => handleApproveAudit(audit.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="size-3.5" />
                          <span>Sign Off &amp; Close</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'APPROVALS' && (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    REQUEST DETAILS
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    REQUESTED BY
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    QUANTITY / VALUE
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    SUBMISSION DATE
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    STATUS
                  </th>
                  <th className="py-3 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {approvals.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap">
                      <p className="font-bold text-slate-900 dark:text-white">{req.title}</p>
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {req.requestType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{req.requestedBy}</p>
                      <p className="text-[11px] text-slate-400">{req.requesterRole}</p>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {req.amount ? `SAR ${req.amount.toFixed(2)}` : `${req.itemsCount || 0} items`}
                      </span>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="text-slate-500">{req.createdAt}</span>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      {req.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" /> Approved
                        </span>
                      ) : req.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="size-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="size-3" /> Awaiting Decision
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="size-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <X className="size-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-2xl max-w-lg w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-[8px] bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 flex items-center justify-center font-bold">
                  <UserCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Clinic Staff Member
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Create credentials and assign a role within the clinic.
                  </p>
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
              {modalError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>{modalError}</span>
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
                  placeholder="e.g. Nurse Fatima Al-Salem / Ahmed Mansoor"
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
                      <UserCheck className="size-3 text-emerald-600" />
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
                      <Users className="size-3 text-blue-600" />
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

              {/* Temporary Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-4 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Creating Account…</span>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Create Staff Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
