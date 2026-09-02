'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDoctorActiveTab } from '@/lib/stores/doctorTabStore';
import {
  ArrowLeft,
  Stethoscope,
  Calendar,
  Clock,
  Plus,
  Save,
  Trash2,
  Check,
  Tag,
  Info,
  CalendarOff,
  UserCheck,
  X,
  Search,
  Coffee,
  Coins,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  Calculator,
  Percent,
  Receipt,
  HelpCircle,
  Star,
  Filter,
  Folder,
  Key,
  Copy,
  Lock,
  CheckCheck,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';

export interface DoctorAppointmentTypeItem {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
  serviceId: string; // 'ALL' or specific service ID
  isActive?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes?: number;
  priceMinor?: number | null;
  currency?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface StaffItem {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role?: string;
  salary?: number | null;
  commissionPercent?: number | null;
  isActive?: boolean;
  createdAt?: string | Date;
  coordinatedDoctors?: Array<{ id: string; name: string }>;
}

export interface BreakItem {
  id?: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  label?: string | null;
}

export interface OtherPaymentItem {
  id?: string;
  label: string;
  type: string;
  value: number | string;
}

export interface PaymentStructureItem {
  id?: string;
  clinicId?: string;
  fixedMonthlyAmount?: number;
  revenueIncentivePercent?: number;
  procedureFeeType?: string;
  procedureFeeAmount?: number | null;
  procedureFeePercent?: number | null;
  otherPayments?: OtherPaymentItem[];
}

export interface DoctorDetailProps {
  doctor: {
    id: string;
    clinicId: string;
    name: string;
    specialty: string | null;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    appointmentMinutes: number | null;
    bufferMinutes: number | null;
    coordinatorId: string | null;
    coordinator?: { id: string; name: string; username?: string | null; email: string } | null;
    clinic: { id: string; name: string; timezone: string };
    services: Array<{
      serviceId: string;
      service: {
        id: string;
        name: string;
        durationMinutes: number;
        isActive: boolean;
        priceMinor?: number | null;
        currency?: string | null;
        description?: string | null;
      };
    }>;
    schedules: Array<{
      weekday: number;
      startMinute: number;
      endMinute: number;
    }>;
    breaks: Array<{
      id?: string;
      weekday: number;
      startMinute: number;
      endMinute: number;
      label: string | null;
    }>;
    timeOff: Array<{
      id: string;
      reason: string | null;
      startDate: string;
      endDate: string;
      startMinute: number | null;
      endMinute: number | null;
    }>;
    paymentStructure?: PaymentStructureItem | null;
    appointments: Array<{
      id: string;
      appointmentNumber?: number | null;
      startsAt: string;
      status: string;
      timezone: string;
      service: { name: string };
      patient: { id: string; name: string | null; phone: string; fileNumber: number | null };
    }>;
    _count?: { appointments: number };
  };
  availableServices?: ServiceItem[];
  availableStaff?: StaffItem[];
  backHref?: string;
  userRole?: string;
}

export function DoctorDetailPortalView({
  doctor: initialDoctor,
  availableServices: initialServices = [],
  availableStaff: initialStaff = [],
  backHref = '/portal/doctors',
  userRole,
}: DoctorDetailProps) {
  const [doctor, setDoctor] = useState(initialDoctor);
  const [staffList, setStaffList] = useState<StaffItem[]>(initialStaff);
  const [servicesList, setServicesList] = useState<ServiceItem[]>(() => {
    // Combine initialServices and doctor's attached services to ensure full info
    const map = new Map<string, ServiceItem>();
    initialServices.forEach((s) => map.set(s.id, s));
    initialDoctor.services.forEach((ds) => {
      if (!map.has(ds.service.id)) {
        map.set(ds.service.id, ds.service);
      }
    });
    return Array.from(map.values());
  });

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  // Instant shared synchronous activeTab state (0ms latency, ClickUp style)
  const [activeTab, setActiveTab] = useDoctorActiveTab(tabFromUrl);

  useEffect(() => {
    if (userRole === 'DOCTOR' && activeTab === 'payment-structure') {
      setActiveTab('schedule');
    }
  }, [userRole, activeTab, setActiveTab]);

  const [doctorName, setDoctorName] = useState(doctor.name);
  const [doctorSpecialty, setDoctorSpecialty] = useState(doctor.specialty || '');
  const [doctorDescription, setDoctorDescription] = useState(doctor.description || '');
  const [doctorImageUrl, setDoctorImageUrl] = useState(doctor.imageUrl || '');

  const isDoctor = userRole === 'DOCTOR';
  const displayDoctorName = doctorName.trim().startsWith('Dr.') || doctorName.trim().startsWith('Dr ')
    ? doctorName.trim()
    : `Dr. ${doctorName.trim()}`;

  // Operational Settings Form State
  const [isActive, setIsActive] = useState(doctor.isActive);
  const [slotDuration, setSlotDuration] = useState<number>(doctor.appointmentMinutes || 30);
  const [bufferMinutes, setBufferMinutes] = useState<number>(doctor.bufferMinutes || 0);
  const [coordinatorId, setCoordinatorId] = useState<string>(doctor.coordinatorId || '');
  const [coordinatorSearch, setCoordinatorSearch] = useState('');

  // Schedule Form State (Weekdays 1 to 7: 1=Mon, 7=Sun)
  const [scheduleState, setScheduleState] = useState<
    Record<number, { isWorking: boolean; startMinute: number; endMinute: number }>
  >(() => {
    const map: Record<number, { isWorking: boolean; startMinute: number; endMinute: number }> = {
      1: { isWorking: false, startMinute: 540, endMinute: 1020 },
      2: { isWorking: false, startMinute: 540, endMinute: 1020 },
      3: { isWorking: false, startMinute: 540, endMinute: 1020 },
      4: { isWorking: false, startMinute: 540, endMinute: 1020 },
      5: { isWorking: false, startMinute: 540, endMinute: 1020 },
      6: { isWorking: false, startMinute: 540, endMinute: 1020 },
      7: { isWorking: false, startMinute: 540, endMinute: 1020 },
    };
    doctor.schedules.forEach((s) => {
      map[s.weekday] = { isWorking: true, startMinute: s.startMinute, endMinute: s.endMinute };
    });
    return map;
  });

  // Breaks Form State per Day
  const [breaksState, setBreaksState] = useState<
    Record<number, Array<{ id: string; startMinute: number; endMinute: number; label: string }>>
  >(() => {
    const map: Record<
      number,
      Array<{ id: string; startMinute: number; endMinute: number; label: string }>
    > = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    };
    (doctor.breaks || []).forEach((b, idx) => {
      const list = map[b.weekday];
      if (list) {
        list.push({
          id: b.id || `brk-${b.weekday}-${idx}-${Date.now()}`,
          startMinute: b.startMinute,
          endMinute: b.endMinute,
          label: b.label || 'Break',
        });
      }
    });
    return map;
  });

  // Selected Services / Appointment Types State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    doctor.services.map((s) => s.serviceId)
  );
  const [appointmentTypeSearch, setAppointmentTypeSearch] = useState('');

  // Doctor Appointment Types State (attached to real services)
  const [appointmentTypesList, setAppointmentTypesList] = useState<DoctorAppointmentTypeItem[]>([]);

  // Expand / Collapse State for Service Rows (all expanded by default)
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(() => {
    return new Set<string>(doctor.services.map((s) => s.serviceId));
  });

  const toggleExpandService = (serviceId: string) => {
    setExpandedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  // Target Service Dropdown State for Create Appointment Type Modal (specific serviceId)
  const [newServiceTargetServiceId, setNewServiceTargetServiceId] = useState<string>(
    doctor.services[0]?.serviceId || ''
  );

  // Payment Structure Form State
  const initialPS = doctor.paymentStructure;
  const [fixedMonthlyAmount, setFixedMonthlyAmount] = useState<number | string>(
    initialPS?.fixedMonthlyAmount ?? 0
  );
  const [revenueIncentivePercent, setRevenueIncentivePercent] = useState<number | string>(
    initialPS?.revenueIncentivePercent ?? 0
  );
  const [procedureFeeType, setProcedureFeeType] = useState<'FIXED' | 'PERCENTAGE'>(
    initialPS?.procedureFeeType === 'FIXED' ? 'FIXED' : 'PERCENTAGE'
  );
  const [procedureFeeAmount, setProcedureFeeAmount] = useState<number | string>(
    initialPS?.procedureFeeAmount ?? 0
  );
  const [procedureFeePercent, setProcedureFeePercent] = useState<number | string>(
    initialPS?.procedureFeePercent ?? 0
  );
  const [otherPayments, setOtherPayments] = useState<OtherPaymentItem[]>(
    initialPS?.otherPayments || []
  );

  // Live calculation preview sample
  const [sampleProcedureValue, setSampleProcedureValue] = useState<number>(1500);

  // Time-Off / Blocked Periods State
  const [timeOffList, setTimeOffList] = useState(doctor.timeOff);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [newBlockedReason, setNewBlockedReason] = useState('Leave');
  const [newBlockedStartDate, setNewBlockedStartDate] = useState('');
  const [newBlockedEndDate, setNewBlockedEndDate] = useState('');
  const [newBlockedStartHour, setNewBlockedStartHour] = useState('');
  const [newBlockedEndHour, setNewBlockedEndHour] = useState('');

  // Add Coordinator Modal State (Full name + Salary + Commission + Set Password)
  const [isAddCoordinatorModalOpen, setIsAddCoordinatorModalOpen] = useState(false);
  const [isSubmittingCoordinator, setIsSubmittingCoordinator] = useState(false);
  const [newCoordinatorName, setNewCoordinatorName] = useState('');
  const [newCoordinatorSalary, setNewCoordinatorSalary] = useState('');
  const [newCoordinatorCommissionPercent, setNewCoordinatorCommissionPercent] = useState('');
  const [newCoordinatorPassword, setNewCoordinatorPassword] = useState('');

  // Edit Coordinator Modal State
  const [isEditCoordinatorModalOpen, setIsEditCoordinatorModalOpen] = useState(false);
  const [coordinatorToEdit, setCoordinatorToEdit] = useState<StaffItem | null>(null);
  const [editCoordinatorName, setEditCoordinatorName] = useState('');
  const [editCoordinatorSalary, setEditCoordinatorSalary] = useState('');
  const [editCoordinatorCommissionPercent, setEditCoordinatorCommissionPercent] = useState('');
  const [editCoordinatorPassword, setEditCoordinatorPassword] = useState('');
  const [isSubmittingEditCoordinator, setIsSubmittingEditCoordinator] = useState(false);

  // 3-Dot Action Dropdown State
  const [activeActionStaffId, setActiveActionStaffId] = useState<string | null>(null);

  // Reset Coordinator Password Modal State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [coordinatorToReset, setCoordinatorToReset] = useState<StaffItem | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Delete Coordinator Modal State
  const [isDeleteCoordinatorModalOpen, setIsDeleteCoordinatorModalOpen] = useState(false);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<StaffItem | null>(null);
  const [isDeletingCoordinator, setIsDeletingCoordinator] = useState(false);

  // Username Copied Feedback State
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);

  // Add Appointment Type / Service Modal State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  // Delete Appointment Type Confirmation Modal State
  const [isDeleteAptModalOpen, setIsDeleteAptModalOpen] = useState(false);
  const [aptToDelete, setAptToDelete] = useState<DoctorAppointmentTypeItem | null>(null);
  const [isDeletingApt, setIsDeletingApt] = useState(false);

  // UI Save Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Weekdays Helper
  const WEEKDAYS = [
    { num: 1, name: 'Monday' },
    { num: 2, name: 'Tuesday' },
    { num: 3, name: 'Wednesday' },
    { num: 4, name: 'Thursday' },
    { num: 5, name: 'Friday' },
    { num: 6, name: 'Saturday' },
    { num: 7, name: 'Sunday' },
  ];

  const minuteToTimeStr = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const timeStrToMinute = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Breaks Management Handlers
  const handleAddBreak = (weekdayNum: number) => {
    const newBreak = {
      id: `brk-${weekdayNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startMinute: 780, // 01:00 PM (13:00)
      endMinute: 840, // 02:00 PM (14:00)
      label: 'Lunch Break',
    };
    setBreaksState((prev) => ({
      ...prev,
      [weekdayNum]: [...(prev[weekdayNum] || []), newBreak],
    }));
  };

  const handleRemoveBreak = (weekdayNum: number, breakId: string) => {
    setBreaksState((prev) => ({
      ...prev,
      [weekdayNum]: (prev[weekdayNum] || []).filter((b) => b.id !== breakId),
    }));
  };

  const handleUpdateBreak = (
    weekdayNum: number,
    breakId: string,
    field: 'startMinute' | 'endMinute' | 'label',
    value: any
  ) => {
    setBreaksState((prev) => ({
      ...prev,
      [weekdayNum]: (prev[weekdayNum] || []).map((b) =>
        b.id === breakId ? { ...b, [field]: value } : b
      ),
    }));
  };

  // Other Payments Management Handlers
  const handleAddOtherPayment = () => {
    const newOther: OtherPaymentItem = {
      id: `oth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: '',
      type: 'AMOUNT',
      value: '',
    };
    setOtherPayments((prev) => [...prev, newOther]);
  };

  const handleUpdateOtherPayment = (index: number, field: keyof OtherPaymentItem, val: any) => {
    setOtherPayments((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (target) {
        copy[index] = { ...target, [field]: val };
      }
      return copy;
    });
  };

  const handleRemoveOtherPayment = (index: number) => {
    setOtherPayments((prev) => prev.filter((_, i) => i !== index));
  };

  // Filtered Coordinators for selection list
  const filteredStaff = useMemo(() => {
    if (!coordinatorSearch.trim()) return staffList;
    const q = coordinatorSearch.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q)
    );
  }, [staffList, coordinatorSearch]);

  // Only services that belong to / are assigned to this doctor
  const doctorAssignedServices = useMemo(() => {
    return servicesList.filter((s) => selectedServiceIds.includes(s.id));
  }, [servicesList, selectedServiceIds]);

  // Filtered Assigned Services (supporting search by service name or nested appointment type name)
  const filteredAssignedServices = useMemo(() => {
    if (!appointmentTypeSearch.trim()) return doctorAssignedServices;
    const q = appointmentTypeSearch.toLowerCase();
    return doctorAssignedServices.filter((s) => {
      const matchService =
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q));
      const matchChild = appointmentTypesList.some(
        (at) =>
          (at.serviceId === s.id || at.serviceId === 'ALL') &&
          at.name.toLowerCase().includes(q)
      );
      return matchService || matchChild;
    });
  }, [doctorAssignedServices, appointmentTypeSearch, appointmentTypesList]);

  // Save All Settings (Profile + Schedule + Breaks + Services + Payment Structure + Coordinator)
  const handleSaveOperational = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const activeSchedules: Array<{ weekday: number; startMinute: number; endMinute: number }> = [];
    const activeBreaks: Array<{
      weekday: number;
      startMinute: number;
      endMinute: number;
      label: string;
    }> = [];

    Object.entries(scheduleState).forEach(([day, cfg]) => {
      const weekdayNum = Number(day);
      if (cfg.isWorking) {
        activeSchedules.push({
          weekday: weekdayNum,
          startMinute: cfg.startMinute,
          endMinute: cfg.endMinute,
        });

        const dayBreaks = breaksState[weekdayNum] || [];
        dayBreaks.forEach((b) => {
          if (b.startMinute < b.endMinute) {
            activeBreaks.push({
              weekday: weekdayNum,
              startMinute: b.startMinute,
              endMinute: b.endMinute,
              label: b.label?.trim() || 'Break',
            });
          }
        });
      }
    });

    const paymentStructurePayload = {
      fixedMonthlyAmount: Math.max(0, Number(fixedMonthlyAmount) || 0),
      revenueIncentivePercent: Math.min(100, Math.max(0, Number(revenueIncentivePercent) || 0)),
      procedureFeeType,
      procedureFeeAmount:
        procedureFeeType === 'FIXED' ? Math.max(0, Number(procedureFeeAmount) || 0) : 0,
      procedureFeePercent:
        procedureFeeType === 'PERCENTAGE'
          ? Math.min(100, Math.max(0, Number(procedureFeePercent) || 0))
          : 0,
      otherPayments: otherPayments
        .filter((op) => op.label && op.label.trim().length > 0)
        .map((op) => ({
          label: op.label.trim(),
          type: op.type,
          value: Math.max(0, Number(op.value) || 0),
        })),
    };

    const payload = {
      name: doctorName.trim(),
      specialty: doctorSpecialty.trim() || undefined,
      description: doctorDescription.trim() || undefined,
      imageUrl: doctorImageUrl.trim() || undefined,
      isActive,
      appointmentMinutes: Number(slotDuration),
      bufferMinutes: Number(bufferMinutes),
      coordinatorId: coordinatorId || null,
      serviceIds: selectedServiceIds,
      schedules: activeSchedules,
      breaks: activeBreaks,
      paymentStructure: paymentStructurePayload,
    };

    try {
      const res = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setDoctor((prev) => ({
          ...prev,
          name: doctorName,
          specialty: doctorSpecialty,
          description: doctorDescription,
          imageUrl: doctorImageUrl,
          isActive,
          appointmentMinutes: slotDuration,
          bufferMinutes,
          coordinatorId: coordinatorId || null,
          coordinator: staffList.find((s) => s.id === coordinatorId) || null,
          schedules: activeSchedules,
          breaks: activeBreaks,
          paymentStructure: {
            ...paymentStructurePayload,
            otherPayments: paymentStructurePayload.otherPayments.map((op, idx) => ({
              id: `oth-${idx}`,
              ...op,
            })),
          },
        }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setSaveError(data.error || 'Failed to save changes.');
      }
    } catch (err: any) {
      console.error('Failed to update doctor settings:', err);
      setSaveError(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Blocked Period
  const handleAddBlockedPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedStartDate || !newBlockedEndDate) return;

    const payload: any = {
      reason: newBlockedReason,
      startDate: newBlockedStartDate,
      endDate: newBlockedEndDate,
    };

    if (newBlockedStartHour && newBlockedEndHour) {
      payload.startMinute = timeStrToMinute(newBlockedStartHour);
      payload.endMinute = timeStrToMinute(newBlockedEndHour);
    }

    try {
      const res = await fetch(`/api/doctors/${doctor.id}/blocked-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.timeOff) {
        setTimeOffList([data.timeOff, ...timeOffList]);
        setIsBlockedModalOpen(false);
        setNewBlockedStartDate('');
        setNewBlockedEndDate('');
        setNewBlockedStartHour('');
        setNewBlockedEndHour('');
      }
    } catch (err) {
      console.error('Failed to create blocked period:', err);
    }
  };

  // Delete Blocked Period
  const handleDeleteBlockedPeriod = async (timeOffId: string) => {
    setTimeOffList(timeOffList.filter((t) => t.id !== timeOffId));
    try {
      await fetch(`/api/doctors/${doctor.id}/blocked-periods?id=${timeOffId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete blocked period:', err);
    }
  };

  // Instantly assign/unassign coordinator and persist to DB
  const [isAssigningStaffId, setIsAssigningStaffId] = useState<string | null>(null);

  const handleAssignCoordinator = async (targetStaffId: string | null) => {
    setIsAssigningStaffId(targetStaffId || 'none');
    const newId = targetStaffId || '';
    setCoordinatorId(newId);
    setDoctor((prev) => ({
      ...prev,
      coordinatorId: targetStaffId || null,
      coordinator: targetStaffId ? staffList.find((s) => s.id === targetStaffId) || null : null,
    }));

    try {
      await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorId: targetStaffId || null,
        }),
      });
    } catch (err) {
      console.error('Failed to assign coordinator:', err);
    } finally {
      setIsAssigningStaffId(null);
    }
  };

  // Create Coordinator Handler (name + salary + password, auto-generates username)
  const handleCreateCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoordinatorName.trim() || !newCoordinatorPassword.trim()) return;

    setIsSubmittingCoordinator(true);
    try {
      const payload: any = {
        name: newCoordinatorName.trim(),
        password: newCoordinatorPassword.trim(),
        commissionPercent: newCoordinatorCommissionPercent ? parseFloat(newCoordinatorCommissionPercent) : 0,
      };
      if (!isDoctor && newCoordinatorSalary) {
        payload.salary = parseFloat(newCoordinatorSalary);
      }

      const res = await fetch('/api/coordinators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.coordinator) {
        setStaffList((prev) => [data.coordinator, ...prev]);
        if (!coordinatorId) {
          await handleAssignCoordinator(data.coordinator.id);
        }
        setIsAddCoordinatorModalOpen(false);
        setNewCoordinatorName('');
        setNewCoordinatorSalary('');
        setNewCoordinatorCommissionPercent('');
        setNewCoordinatorPassword('');
      }
    } catch (err) {
      console.error('Failed to create coordinator:', err);
    } finally {
      setIsSubmittingCoordinator(false);
    }
  };

  // Edit Coordinator Handlers
  const promptEditCoordinator = (staff: StaffItem) => {
    setCoordinatorToEdit(staff);
    setEditCoordinatorName(staff.name || '');
    setEditCoordinatorSalary(staff.salary !== undefined && staff.salary !== null ? String(staff.salary) : '');
    setEditCoordinatorCommissionPercent(staff.commissionPercent !== undefined && staff.commissionPercent !== null ? String(staff.commissionPercent) : '');
    setEditCoordinatorPassword('');
    setIsEditCoordinatorModalOpen(true);
  };

  const handleSaveEditCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatorToEdit || !editCoordinatorName.trim()) return;

    setIsSubmittingEditCoordinator(true);
    try {
      const payload: any = {
        coordinatorId: coordinatorToEdit.id,
        name: editCoordinatorName.trim(),
        commissionPercent: editCoordinatorCommissionPercent ? parseFloat(editCoordinatorCommissionPercent) : 0,
      };
      if (!isDoctor && editCoordinatorSalary) {
        payload.salary = parseFloat(editCoordinatorSalary);
      }
      if (editCoordinatorPassword.trim().length >= 6) {
        payload.password = editCoordinatorPassword.trim();
      }

      const res = await fetch('/api/coordinators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.coordinator) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === data.coordinator.id ? { ...s, ...data.coordinator } : s))
        );
        setIsEditCoordinatorModalOpen(false);
        setCoordinatorToEdit(null);
      }
    } catch (err) {
      console.error('Failed to update coordinator:', err);
    } finally {
      setIsSubmittingEditCoordinator(false);
    }
  };

  // Reset Coordinator Password Handlers
  const promptResetPassword = (staff: StaffItem) => {
    setCoordinatorToReset(staff);
    setResetNewPassword('');
    setResetSuccessMessage(null);
    setIsResetPasswordModalOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatorToReset || !resetNewPassword.trim()) return;

    setIsResettingPassword(true);
    try {
      const res = await fetch('/api/coordinators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorId: coordinatorToReset.id,
          password: resetNewPassword.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResetSuccessMessage('Password updated successfully!');
        setTimeout(() => {
          setIsResetPasswordModalOpen(false);
          setCoordinatorToReset(null);
          setResetNewPassword('');
          setResetSuccessMessage(null);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Delete Coordinator Handlers
  const promptDeleteCoordinator = (staff: StaffItem) => {
    setCoordinatorToDelete(staff);
    setIsDeleteCoordinatorModalOpen(true);
  };

  const handleConfirmDeleteCoordinator = async () => {
    if (!coordinatorToDelete) return;
    setIsDeletingCoordinator(true);
    try {
      const res = await fetch(`/api/coordinators?id=${coordinatorToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setStaffList((prev) => prev.filter((s) => s.id !== coordinatorToDelete.id));
        if (coordinatorId === coordinatorToDelete.id) {
          setCoordinatorId('');
        }
        setIsDeleteCoordinatorModalOpen(false);
        setCoordinatorToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete coordinator:', err);
    } finally {
      setIsDeletingCoordinator(false);
    }
  };

  // Copy Login Username Helper
  const handleCopyUsername = (staff: StaffItem) => {
    const loginText = staff.username || staff.email;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(loginText);
      setCopiedStaffId(staff.id);
      setTimeout(() => setCopiedStaffId(null), 2000);
    }
  };

  // Create Appointment Type Handler (creates only appointment type attached to target service)
  const handleCreateAppointmentType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setIsSubmittingService(true);
    try {
      const targetServiceId = newServiceTargetServiceId || doctorAssignedServices[0]?.id || '';
      const generatedId = `apt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const newApt: DoctorAppointmentTypeItem = {
        id: generatedId,
        name: newServiceName.trim(),
        durationMinutes: Number(newServiceDuration),
        price: newServicePrice ? Number(newServicePrice) : null,
        currency: 'SAR',
        description: newServiceDescription.trim() || null,
        serviceId: targetServiceId,
        isActive: true,
      };

      setAppointmentTypesList((prev) => [newApt, ...prev]);

      // Auto-expand the target service so the new appointment type is immediately visible
      if (targetServiceId) {
        setExpandedServiceIds((prev) => new Set(prev).add(targetServiceId));
      }

      setIsAddServiceModalOpen(false);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDescription('');
      setNewServiceTargetServiceId(doctorAssignedServices[0]?.id || '');
    } catch (err) {
      console.error('Failed to create appointment type:', err);
    } finally {
      setIsSubmittingService(false);
    }
  };

  // Open Delete Confirmation Modal
  const promptDeleteAppointmentType = (at: DoctorAppointmentTypeItem) => {
    setAptToDelete(at);
    setIsDeleteAptModalOpen(true);
  };

  // Confirm Delete Appointment Type (removes appointment type only)
  const confirmDeleteAppointmentType = async () => {
    if (!aptToDelete) return;
    setIsDeletingApt(true);

    try {
      // Remove from appointment types list
      setAppointmentTypesList((prev) => prev.filter((at) => at.id !== aptToDelete.id));

      setIsDeleteAptModalOpen(false);
      setAptToDelete(null);
    } catch (err) {
      console.error('Failed to delete appointment type:', err);
    } finally {
      setIsDeletingApt(false);
    }
  };

  const formatFriendlyDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const upcomingAppointments = doctor.appointments.filter(
    (a) => new Date(a.startsAt) >= new Date()
  );
  const pastAppointments = doctor.appointments.filter(
    (a) => new Date(a.startsAt) < new Date()
  );

  // Dynamic Formula Computation for Summary Card
  const fixedNum = Number(fixedMonthlyAmount) || 0;
  const incentiveNum = Number(revenueIncentivePercent) || 0;
  const procedureFeeAmtNum = Number(procedureFeeAmount) || 0;
  const procedureFeePctNum = Number(procedureFeePercent) || 0;
  const validOtherPayments = otherPayments.filter((op) => op.label && op.label.trim().length > 0);

  // Live calculation preview math
  const calculatedProcedureDoctorShare =
    procedureFeeType === 'PERCENTAGE'
      ? (sampleProcedureValue * (procedureFeePctNum / 100)).toFixed(0)
      : procedureFeeAmtNum.toFixed(0);

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER (UNIFIED HEADER) */}
      <div className="px-3.5 pt-2.5 pb-1 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        {/* Left: Doctor Name & Badges */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={backHref}
            className="p-1 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Back to Doctors"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              {doctorName}
            </h1>
            <button
              type="button"
              className="text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors cursor-pointer shrink-0"
              title="Bookmark / Favorite"
            >
              <Star className="size-4" />
            </button>
            <span
              className={`ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isActive ? 'Active on WhatsApp' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Right: Compact Black / Dark Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-200">
              <Check className="size-3.5 stroke-[2.5]" /> Changes saved
            </span>
          )}
          {saveError && (
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in duration-200">
              {saveError}
            </span>
          )}

          {/* Create Appointment Type Button */}
          <button
            type="button"
            onClick={() => setIsAddServiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs px-3 py-1.5 rounded-[7px] shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Create Appointment Type</span>
          </button>

          {/* Add Blocked Period Button */}
          <button
            type="button"
            onClick={() => setIsBlockedModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs px-3 py-1.5 rounded-[7px] shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Add Blocked Period</span>
          </button>

          {/* Save Changes Button */}
          <button
            type="button"
            onClick={handleSaveOperational}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[7px] shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="size-3.5 stroke-[2.5]" />
            <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-slate-950">
        {/* TAB 1: SCHEDULE CONFIGURATION & BREAKS */}
        {activeTab === 'schedule' && (
          <div>
            {/* Slot Duration & Booking Status Bar */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="size-4 text-blue-600" />
                <span>Slot Duration &amp; Active Booking Status</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Doctor Booking Status
                  </label>
                  <select
                    value={isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="ACTIVE">Active (Accepting Bookings on WhatsApp)</option>
                    <option value="INACTIVE">Inactive (Hidden from WhatsApp &amp; New Bookings)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Default Slot Duration
                  </label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes (Standard)</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 Hour)</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Post-Appointment Buffer Gap
                  </label>
                  <select
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  >
                    <option value={0}>0 minutes (No gap)</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Weekly Working Hours & Breaks Header */}
            <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="size-4 text-blue-600" />
                  <span>Weekly Working Hours &amp; Break Times ({doctor.clinic.timezone})</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Toggle active working days with the circular selectors. Add customized daily break times to block slots automatically.
                </p>
              </div>
            </div>

            {/* Attached Day Rows */}
            <div className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
              {WEEKDAYS.map((day) => {
                const cfg = scheduleState[day.num] || {
                  isWorking: false,
                  startMinute: 540,
                  endMinute: 1020,
                };
                const dayBreaks = breaksState[day.num] || [];

                return (
                  <div
                    key={day.num}
                    className={`px-6 py-3.5 transition-colors ${
                      cfg.isWorking ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/50 dark:bg-slate-900/30 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Circular Checkbox and Day Name */}
                      <div
                        className="flex items-center gap-3 cursor-pointer select-none group w-44"
                        onClick={() =>
                          setScheduleState({
                            ...scheduleState,
                            [day.num]: { ...cfg, isWorking: !cfg.isWorking },
                          })
                        }
                      >
                        <div
                          className={`size-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            cfg.isWorking
                              ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-500/20'
                              : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400'
                          }`}
                        >
                          {cfg.isWorking && <Check className="size-3 stroke-[3]" />}
                        </div>

                        <span
                          className={`text-xs font-bold transition-colors ${
                            cfg.isWorking
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {day.name}
                        </span>
                      </div>

                      {/* Working Hours Time Inputs or Day Off Label */}
                      {cfg.isWorking ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Shift Start */}
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1 text-xs shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20">
                            <input
                              type="time"
                              value={minuteToTimeStr(cfg.startMinute)}
                              onChange={(e) =>
                                setScheduleState({
                                  ...scheduleState,
                                  [day.num]: {
                                    ...cfg,
                                    startMinute: timeStrToMinute(e.target.value),
                                  },
                                })
                              }
                              className="bg-transparent text-xs text-slate-900 dark:text-white outline-none font-mono font-medium cursor-pointer"
                            />
                            <Clock className="size-3.5 text-slate-400 shrink-0 pointer-events-none" />
                          </div>

                          <span className="text-slate-400 text-xs font-bold px-0.5">to</span>

                          {/* Shift End */}
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1 text-xs shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20">
                            <input
                              type="time"
                              value={minuteToTimeStr(cfg.endMinute)}
                              onChange={(e) =>
                                setScheduleState({
                                  ...scheduleState,
                                  [day.num]: {
                                    ...cfg,
                                    endMinute: timeStrToMinute(e.target.value),
                                  },
                                })
                              }
                              className="bg-transparent text-xs text-slate-900 dark:text-white outline-none font-mono font-medium cursor-pointer"
                            />
                            <Clock className="size-3.5 text-slate-400 shrink-0 pointer-events-none" />
                          </div>

                          {/* Add Break Button */}
                          <button
                            type="button"
                            onClick={() => handleAddBreak(day.num)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 rounded-[8px] px-2.5 py-1 transition-all cursor-pointer shadow-2xs"
                            title="Add break time slot for this day"
                          >
                            <Coffee className="size-3 text-blue-600 dark:text-blue-400" />
                            <span>+ Break</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-semibold italic text-[11px] px-2">
                          Day Off
                        </span>
                      )}
                    </div>

                    {/* Daily Break Slots List */}
                    {cfg.isWorking && dayBreaks.length > 0 && (
                      <div className="mt-2.5 ml-8 pl-3 border-l-2 border-blue-200 dark:border-blue-900/60 space-y-2">
                        {dayBreaks.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-[8px] p-2 text-xs"
                          >
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                              <Coffee className="size-3 text-amber-500" />
                              <span>Break:</span>
                            </div>

                            <input
                              type="text"
                              placeholder="Break label (e.g. Lunch)"
                              value={b.label}
                              onChange={(e) =>
                                handleUpdateBreak(day.num, b.id, 'label', e.target.value)
                              }
                              className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-0.5 text-xs">
                              <input
                                type="time"
                                value={minuteToTimeStr(b.startMinute)}
                                onChange={(e) =>
                                  handleUpdateBreak(
                                    day.num,
                                    b.id,
                                    'startMinute',
                                    timeStrToMinute(e.target.value)
                                  )
                                }
                                className="bg-transparent text-xs text-slate-900 dark:text-white outline-none font-mono cursor-pointer"
                              />
                            </div>

                            <span className="text-slate-400 text-[11px] font-bold">to</span>

                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-0.5 text-xs">
                              <input
                                type="time"
                                value={minuteToTimeStr(b.endMinute)}
                                onChange={(e) =>
                                  handleUpdateBreak(
                                    day.num,
                                    b.id,
                                    'endMinute',
                                    timeStrToMinute(e.target.value)
                                  )
                                }
                                className="bg-transparent text-xs text-slate-900 dark:text-white outline-none font-mono cursor-pointer"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBreak(day.num, b.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto cursor-pointer"
                              title="Remove break"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENT TYPES & SERVICES (CLEAN COLLAPSIBLE SERVICES TABLE) */}
        {activeTab === 'appointment-types' && (
          <div className="p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[10px] shadow-2xs overflow-hidden">
              {/* Header Toolbar */}
              <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-[7px] bg-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Layers className="size-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Assigned Services &amp; Appointment Types
                      </h3>
                      <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 whitespace-nowrap">
                        {doctorAssignedServices.length} Services Assigned
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Clinical treatments performed by Dr. {doctorName}. Expand any service to view or add custom appointment types.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search doctor services..."
                      value={appointmentTypeSearch}
                      onChange={(e) => setAppointmentTypeSearch(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewServiceTargetServiceId(doctorAssignedServices[0]?.id || '');
                      setIsAddServiceModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-semibold text-xs px-3 py-1.5 rounded-[7px] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="size-3.5 stroke-[2.5]" />
                    <span>+ Create Appointment Type</span>
                  </button>
                </div>
              </div>

              {/* Single Unified Collapsible Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-5 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                        SERVICE NAME / APPOINTMENT TYPE
                      </th>
                      <th className="py-2.5 px-5 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                        CUSTOM SUB-TYPES
                      </th>
                      <th className="py-2.5 px-5 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                        BASE DURATION
                      </th>
                      <th className="py-2.5 px-5 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                        BASE PRICE
                      </th>
                      <th className="py-2.5 px-5 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider whitespace-nowrap">
                        STATUS
                      </th>
                      <th className="py-2.5 px-5 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider text-right whitespace-nowrap">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                    {/* 2. ASSIGNED SERVICES & SPECIALIZED PROCEDURES ACCORDION GROUPS */}
                    {filteredAssignedServices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs italic">
                          No doctor services found.
                        </td>
                      </tr>
                    ) : (
                      filteredAssignedServices.map((srv) => {
                        const isExpanded = expandedServiceIds.has(srv.id);
                        const specificTypes = appointmentTypesList.filter(
                          (at) => at.serviceId === srv.id
                        );
                        const price =
                          srv.priceMinor !== undefined && srv.priceMinor !== null
                            ? `${(srv.priceMinor / 100).toFixed(0)} ${srv.currency || 'SAR'}`
                            : 'Standard';

                        return (
                          <React.Fragment key={srv.id}>
                            {/* PARENT ROW: SERVICE */}
                            <tr className="bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-850/80 transition-colors">
                              <td className="py-3 px-5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandService(srv.id)}
                                    className="p-1 rounded-[5px] text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                                    title={isExpanded ? 'Collapse service' : 'Expand service'}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="size-4 text-purple-600 stroke-[2.5]" />
                                    ) : (
                                      <ChevronRight className="size-4 stroke-[2.5]" />
                                    )}
                                  </button>
                                  <div className="size-5 rounded-[5px] bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                                    <Layers className="size-3 stroke-[2.5]" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                      {srv.name}
                                    </span>
                                    {srv.description && (
                                      <p className="text-[11px] text-slate-400 block truncate max-w-sm mt-0.5">
                                        {srv.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-5 whitespace-nowrap">
                                {specificTypes.length > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 whitespace-nowrap">
                                    <Tag className="size-3" />
                                    {specificTypes.length} Specific Type{specificTypes.length === 1 ? '' : 's'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">
                                    Uses General Types
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-5 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold">
                                  <Clock className="size-3 text-blue-500" />
                                  {srv.durationMinutes || 30} min
                                </span>
                              </td>
                              <td className="py-3 px-5 whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                  {price}
                                </span>
                              </td>
                              <td className="py-3 px-5 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                                  Active
                                </span>
                              </td>
                              <td className="py-3 px-5 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewServiceTargetServiceId(srv.id);
                                    setIsAddServiceModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-white hover:bg-[#0f172a] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-[6px] transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                                  title={`Add specific appointment type for ${srv.name}`}
                                >
                                  <Plus className="size-3 stroke-[2.5]" />
                                  <span>+ Specific Type</span>
                                </button>
                              </td>
                            </tr>

                            {/* CHILD ROWS: SERVICE-SPECIFIC TYPES */}
                            {isExpanded && (
                              <>
                                {specificTypes.length === 0 ? (
                                  <tr className="bg-slate-50/50 dark:bg-slate-950/40">
                                    <td colSpan={6} className="py-2.5 pl-12 pr-5 text-[11px] text-slate-500 dark:text-slate-400">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="italic">
                                          ℹ️ Currently using Dr. {doctorName}&apos;s general appointment types. Click &ldquo;+ Specific Type&rdquo; to add custom durations/pricing for this treatment.
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNewServiceTargetServiceId(srv.id);
                                            setIsAddServiceModalOpen(true);
                                          }}
                                          className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer shrink-0"
                                        >
                                          + Add Type for {srv.name}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  specificTypes.map((at) => (
                                    <tr
                                      key={at.id}
                                      className="bg-purple-50/20 dark:bg-purple-950/10 hover:bg-purple-50/40 transition-colors"
                                    >
                                      <td className="py-2.5 pl-12 pr-5">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-purple-400 font-mono font-bold text-xs shrink-0">↳</span>
                                          <div className="size-4 rounded-[4px] bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                                            <Tag className="size-2.5 stroke-[2.5]" />
                                          </div>
                                          <div className="min-w-0">
                                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate">
                                              {at.name}
                                            </span>
                                            {at.description && (
                                              <span className="text-[11px] text-slate-400 block truncate max-w-sm">
                                                — {at.description}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-5 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 whitespace-nowrap">
                                          Specific to {srv.name}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-5 whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-300">
                                        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold">
                                          <Clock className="size-3 text-purple-500" />
                                          {at.durationMinutes} min
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-5 whitespace-nowrap">
                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-[5px]">
                                          {at.price ? `${at.price} ${at.currency || 'SAR'}` : 'Standard'}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-5 whitespace-nowrap">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 inline-flex items-center gap-1.5 whitespace-nowrap">
                                          <span className="size-1.5 rounded-full bg-emerald-500" />
                                          Active on WhatsApp
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-5 text-right whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => promptDeleteAppointmentType(at)}
                                          className="p-1.5 rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                          title="Delete appointment type"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BLOCKED PERIODS (ATTACHED BORDER-WITH-BORDER TABLE) */}
        {activeTab === 'blocked' && (
          <div>
            {/* Attached Header Bar */}
            <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarOff className="size-4 text-rose-500" />
                <span>Doctor Blocked Periods &amp; Leaves</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Slots inside blocked periods will be automatically removed from WhatsApp &amp; Portal availability.
              </p>
            </div>

            {/* Attached Table List */}
            {timeOffList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium bg-white dark:bg-slate-950">
                No active blocked periods or leaves recorded for this doctor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                        REASON
                      </th>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                        DATE RANGE
                      </th>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                        HOURS
                      </th>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px] text-right">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {timeOffList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                        <td className="py-3 px-6 font-semibold text-slate-900 dark:text-white">
                          <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            {item.reason || 'Blocked'}
                          </span>
                        </td>
                        <td className="py-3 px-6 font-mono text-slate-700 dark:text-slate-300">
                          {item.startDate} {item.startDate !== item.endDate ? `➔ ${item.endDate}` : ''}
                        </td>
                        <td className="py-3 px-6 text-slate-600 dark:text-slate-400 font-mono">
                          {item.startMinute !== null && item.endMinute !== null
                            ? `${minuteToTimeStr(item.startMinute)} – ${minuteToTimeStr(item.endMinute)}`
                            : 'All Day'}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteBlockedPeriod(item.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                            title="Delete Blocked Period"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: APPOINTMENTS HISTORY (ATTACHED BORDER TABLE) */}
        {activeTab === 'appointments' && (
          <div>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="size-3.5 text-blue-600" />
                <span>Upcoming Bookings ({upcomingAppointments.length})</span>
              </h3>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border-b border-slate-200 dark:border-slate-800">
                No upcoming appointments scheduled for this doctor.
              </div>
            ) : (
              <div className="overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                        APPT NO
                      </th>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                        PATIENT
                      </th>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                        SERVICE
                      </th>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                        DATE &amp; TIME
                      </th>
                      <th className="py-2.5 px-6 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {upcomingAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {app.appointmentNumber ? `AP-${String(app.appointmentNumber).padStart(3, '0')}` : '—'}
                        </td>
                        <td className="py-2.5 px-6 font-semibold text-slate-900 dark:text-white">
                          {app.patient.name || 'Patient'}
                          {app.patient.fileNumber && (
                            <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                              (FR-{String(app.patient.fileNumber).padStart(3, '0')})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-6 text-slate-700 dark:text-slate-300">
                          {app.service.name}
                        </td>
                        <td className="py-2.5 px-6 text-slate-600 dark:text-slate-400">
                          {formatFriendlyDate(app.startsAt)}
                        </td>
                        <td className="py-2.5 px-6">
                          <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Past Bookings ({pastAppointments.length})
              </h3>
            </div>
            {pastAppointments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No past appointments recorded.
              </div>
            ) : (
              <div className="p-6 text-xs text-slate-500 dark:text-slate-400">
                {pastAppointments.length} completed appointments recorded.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DOCTOR PROFILE OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="size-4 text-blue-600" />
                  <span>Doctor Credentials &amp; Profile</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure professional details displayed to patients on WhatsApp and in the clinic portal.
                </p>
              </div>
            </div>

            <div className="p-6 max-w-3xl space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Specialty &amp; Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorSpecialty}
                    onChange={(e) => setDoctorSpecialty(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Profile Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={doctorImageUrl}
                    onChange={(e) => setDoctorImageUrl(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Doctor Bio / Clinical Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Doctor qualifications, education, and clinical background..."
                    value={doctorDescription}
                    onChange={(e) => setDoctorDescription(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COORDINATOR TABLE VIEW (ATTACHED BORDER TABLE) */}
        {activeTab === 'coordinator' && (
          <div>
            {/* Top Toolbar - Flush attached header */}
            <div className="px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="size-4 text-emerald-600" />
                  <span>Clinic Coordinators &amp; Staff</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage login credentials and designate staff to manage {displayDoctorName}&apos;s schedule and patient appointments.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username..."
                    value={coordinatorSearch}
                    onChange={(e) => setCoordinatorSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCoordinatorModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Add Coordinator</span>
                </button>
              </div>
            </div>

            {/* Coordinator Table - Flush Attached Border */}
            <div className="overflow-x-auto border-b border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-6">Coordinator Name</th>
                    <th className="py-3 px-4">Login Username</th>
                    {!isDoctor && <th className="py-3 px-4">Base Salary</th>}
                    <th className="py-3 px-4">Service Commission</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Doctor Assignment</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={isDoctor ? 6 : 7} className="py-12 text-center text-slate-400 italic">
                        {coordinatorSearch
                          ? 'No coordinator matches your search.'
                          : 'No coordinators created yet. Click "+ Add Coordinator" to create login credentials.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const isAssignedToThisDoctor = coordinatorId === staff.id;
                      const isCopied = copiedStaffId === staff.id;
                      const displayUsername = staff.username || staff.email;

                      return (
                        <tr
                          key={staff.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            isAssignedToThisDoctor ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          {/* 1. Name & Avatar */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700">
                                {staff.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{staff.name}</span>
                                  {isAssignedToThisDoctor && (
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {staff.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Login Username with Copy Button */}
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                              <span>{displayUsername}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyUsername(staff)}
                                className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Copy login username"
                              >
                                {isCopied ? (
                                  <CheckCheck className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                            {isCopied && (
                              <span className="text-[10px] text-emerald-600 font-semibold ml-1.5 animate-in fade-in">
                                Copied!
                              </span>
                            )}
                          </td>

                          {/* 3. Base Salary (Clinic only - hidden for DOCTOR role) */}
                          {!isDoctor && (
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-baseline gap-1 font-mono font-bold text-xs text-slate-900 dark:text-white">
                                <span>{staff.salary ? `${Number(staff.salary).toLocaleString()} SAR` : '0 SAR'}</span>
                                <span className="text-[10px] font-normal text-slate-400">/mo</span>
                              </div>
                              <div className="text-[10px] text-slate-400">Clinic salary</div>
                            </td>
                          )}

                          {/* 4. Service Commission (%) */}
                          <td className="py-3.5 px-4">
                            {staff.commissionPercent ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                                <Percent className="size-3" />
                                <span>{staff.commissionPercent}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">0%</span>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">On doctor services</div>
                          </td>

                          {/* 5. Status */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>

                          {/* 6. Assignment Toggle */}
                          <td className="py-3.5 px-4">
                            {isAssignedToThisDoctor ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-emerald-600 text-white font-semibold text-[11px] shadow-2xs">
                                  <Check className="size-3 stroke-[3]" />
                                  <span>Assigned to {displayDoctorName}</span>
                                </span>
                                <button
                                  type="button"
                                  disabled={isAssigningStaffId !== null}
                                  onClick={() => handleAssignCoordinator(null)}
                                  className="text-[10px] text-slate-400 hover:text-rose-600 underline font-medium cursor-pointer disabled:opacity-50"
                                >
                                  {isAssigningStaffId === 'none' ? 'Unassigning...' : 'Unassign'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isAssigningStaffId !== null}
                                onClick={() => handleAssignCoordinator(staff.id)}
                                className="px-2.5 py-1 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isAssigningStaffId === staff.id ? 'Assigning...' : `Assign to ${displayDoctorName}`}
                              </button>
                            )}
                          </td>

                          {/* 7. Actions: Professional 3-Dot Dropdown Menu */}
                          <td className="py-3.5 px-6 text-right relative whitespace-nowrap">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionStaffId(activeActionStaffId === staff.id ? null : staff.id);
                                }}
                                className="size-8 rounded-[8px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
                                title="Actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </div>

                            {activeActionStaffId === staff.id && (
                              <>
                                {/* Click-away backdrop */}
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionStaffId(null);
                                  }}
                                />

                                <div className="absolute right-6 top-11 z-40 w-44 bg-white dark:bg-slate-800 rounded-[8px] shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionStaffId(null);
                                      promptEditCoordinator(staff);
                                    }}
                                    className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5 cursor-pointer transition-colors"
                                  >
                                    <Pencil className="size-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Edit Coordinator</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionStaffId(null);
                                      promptResetPassword(staff);
                                    }}
                                    className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5 cursor-pointer transition-colors"
                                  >
                                    <Key className="size-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Reset Password</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-100 dark:border-slate-700/80" />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionStaffId(null);
                                      promptDeleteCoordinator(staff);
                                    }}
                                    className="w-full px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="size-3.5 text-rose-600 dark:text-rose-400" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PAYMENT STRUCTURE (Hidden for DOCTOR role) */}
        {activeTab === 'payment-structure' && userRole !== 'DOCTOR' && (
          <div>
            {/* Header Bar */}
            <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="size-6 rounded-[6px] bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                  <Coins className="size-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Payment Structure — Dr. {doctorName}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-8.5">
                How this doctor is paid. These figures feed the Doctor Payments run under Accounts &amp; Finance at month end.
              </p>
            </div>

            <div className="p-6 max-w-4xl space-y-5">
              {/* 1. Fixed Monthly Payment & 2. Revenue Incentive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fixed Monthly Payment Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[10px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                      Fixed Monthly Payment (SAR)
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                      Paid regardless of volume. Enter 0 for commission-only doctors.
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="e.g. 18000"
                      value={fixedMonthlyAmount}
                      onChange={(e) => setFixedMonthlyAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      SAR
                    </span>
                  </div>
                </div>

                {/* Incentive on Collected Revenue Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[10px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                      Incentive on Collected Revenue (%)
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                      Applied to revenue actually collected against this doctor&apos;s invoices.
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="e.g. 12"
                      value={revenueIncentivePercent}
                      onChange={(e) => setRevenueIncentivePercent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Procedure-Based Fee Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[10px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Procedure-Based Fee
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure how procedure compensation is calculated per treatment performed.
                    </p>
                  </div>

                  {/* Toggle Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-[8px] text-xs font-semibold shrink-0">
                    <button
                      type="button"
                      onClick={() => setProcedureFeeType('FIXED')}
                      className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                        procedureFeeType === 'FIXED'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Fixed amount (SAR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProcedureFeeType('PERCENTAGE')}
                      className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                        procedureFeeType === 'PERCENTAGE'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Percentage (%)
                    </button>
                  </div>
                </div>

                {/* Procedure fee inputs */}
                {procedureFeeType === 'FIXED' ? (
                  <div className="max-w-md space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Procedure Fee (SAR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        placeholder="e.g. 300"
                        value={procedureFeeAmount}
                        onChange={(e) => setProcedureFeeAmount(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        SAR per procedure
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-w-md space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Share of Procedure Value (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="e.g. 20"
                          value={procedureFeePercent}
                          onChange={(e) => setProcedureFeePercent(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Live Calculation Preview Box */}
                    <div className="p-3.5 rounded-[8px] bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-200">
                        <span className="flex items-center gap-1.5">
                          <Calculator className="size-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Live Calculation Preview</span>
                        </span>
                        <div className="flex items-center gap-1.5 font-normal text-[11px]">
                          <span>Sample Procedure Value:</span>
                          <input
                            type="number"
                            min="100"
                            step="100"
                            value={sampleProcedureValue}
                            onChange={(e) => setSampleProcedureValue(Number(e.target.value) || 0)}
                            className="w-20 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-blue-900 dark:text-blue-100 text-xs"
                          />
                          <span>SAR</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 text-xs pt-1">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Doctor earns: </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {calculatedProcedureDoctorShare} SAR
                          </span>
                        </div>
                        <div className="font-mono text-slate-500 dark:text-slate-400">
                          Calculation: {sampleProcedureValue.toLocaleString()} SAR × {procedureFeePctNum}% = {calculatedProcedureDoctorShare} SAR
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Other Payments Section */}
              <div className="bg-white dark:bg-slate-900 rounded-[10px] border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Other Payments &amp; Allowances
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Allowances, retainers or deductions specific to this doctor. Each can be a fixed amount or a percentage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOtherPayment}
                    className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-xs px-3 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="size-3.5" />
                    <span>Add other payment</span>
                  </button>
                </div>

                {/* List of Other Payments */}
                {otherPayments.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50/50 dark:bg-slate-900/30 rounded-[8px]">
                    No other payments or allowances configured for this doctor. Click &ldquo;Add other payment&rdquo; to add one.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {otherPayments.map((op, idx) => (
                      <div
                        key={op.id || idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. On-call allowance, Housing retainer"
                            value={op.label}
                            onChange={(e) => handleUpdateOtherPayment(idx, 'label', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[6px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        </div>

                        <div className="w-full sm:w-36">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Type
                          </label>
                          <select
                            value={op.type}
                            onChange={(e) => handleUpdateOtherPayment(idx, 'type', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="AMOUNT">Amount (SAR)</option>
                            <option value="PERCENTAGE">Percentage (%)</option>
                          </select>
                        </div>

                        <div className="w-full sm:w-32">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Value
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            placeholder="e.g. 1500"
                            value={op.value}
                            onChange={(e) => handleUpdateOtherPayment(idx, 'value', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[6px] px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:pt-4 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveOtherPayment(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[6px] transition-colors cursor-pointer"
                            title="Remove other payment"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Monthly Payout Formula Summary Card */}
              <div className="bg-slate-900 text-white rounded-[10px] p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-400 uppercase">
                  <Receipt className="size-4" />
                  <span>Monthly Payout Formula</span>
                </div>

                <div className="space-y-1.5 font-mono text-xs text-slate-200 pl-6 border-l-2 border-amber-400/60">
                  <div className="font-bold text-white text-sm">
                    {fixedNum > 0 ? `SAR ${fixedNum.toLocaleString()} fixed` : 'Commission only (0 SAR fixed)'}
                  </div>

                  {incentiveNum > 0 && (
                    <div className="text-emerald-400">
                      + {incentiveNum}% of collected revenue
                    </div>
                  )}

                  {procedureFeeType === 'PERCENTAGE' && procedureFeePctNum > 0 && (
                    <div className="text-blue-300">
                      + {procedureFeePctNum}% per procedure value
                    </div>
                  )}

                  {procedureFeeType === 'FIXED' && procedureFeeAmtNum > 0 && (
                    <div className="text-blue-300">
                      + SAR {procedureFeeAmtNum.toLocaleString()} per procedure
                    </div>
                  )}

                  {validOtherPayments.map((op, idx) => (
                    <div key={idx} className="text-amber-200">
                      + {op.type === 'AMOUNT' ? `SAR ${(Number(op.value) || 0).toLocaleString()}` : `${Number(op.value) || 0}%`} {op.label}
                    </div>
                  ))}

                  {fixedNum === 0 && incentiveNum === 0 && procedureFeeAmtNum === 0 && procedureFeePctNum === 0 && validOtherPayments.length === 0 && (
                    <div className="text-slate-400 italic font-sans text-xs">
                      No payment structure configured yet. Enter values above to construct the formula.
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  * This formula will be applied to the doctor&apos;s verified invoices and procedures during the monthly Accounts &amp; Finance payout calculation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: ADD BLOCKED PERIOD */}
      {isBlockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarOff className="size-4 text-rose-600" />
                <span>Add Blocked Period / Leave</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockedModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddBlockedPeriod} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Reason / Type *
                </label>
                <select
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="Leave">Annual Leave / Vacation</option>
                  <option value="Meeting">Staff Meeting / Conference</option>
                  <option value="Break">Clinical Break</option>
                  <option value="Holiday">Official Holiday</option>
                  <option value="Personal">Personal Time</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBlockedStartDate}
                    onChange={(e) => setNewBlockedStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBlockedEndDate}
                    onChange={(e) => setNewBlockedEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Specific Hours (Optional - leave empty for all day)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    placeholder="From"
                    value={newBlockedStartHour}
                    onChange={(e) => setNewBlockedStartHour(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                  />
                  <input
                    type="time"
                    placeholder="To"
                    value={newBlockedEndHour}
                    onChange={(e) => setNewBlockedEndHour(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlockedModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs cursor-pointer"
                >
                  Add Blocked Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADD COORDINATOR */}
      {isAddCoordinatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="size-4 text-emerald-600" />
                <span>Add Clinic Coordinator</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCoordinatorModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoordinator} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Coordinator Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sara Ahmed"
                  value={newCoordinatorName}
                  onChange={(e) => setNewCoordinatorName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Doctor Service Commission (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="e.g. 5 (Percentage given by doctor on services)"
                    value={newCoordinatorCommissionPercent}
                    onChange={(e) => setNewCoordinatorCommissionPercent(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Optional commission percentage provided by the doctor on completed services/procedures.
                </p>
              </div>

              {!isDoctor && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Clinic Monthly Base Salary (SAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 4000 (Base salary paid by clinic)"
                    value={newCoordinatorSalary}
                    onChange={(e) => setNewCoordinatorSalary(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Fixed monthly base compensation paid directly by the clinic.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Set Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter login password (min 6 characters)"
                  value={newCoordinatorPassword}
                  onChange={(e) => setNewCoordinatorPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-2.5 rounded-[8px] bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                A unique login username (e.g. <span className="font-mono font-bold">{newCoordinatorName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.') || 'sara.ahmed'}</span>) will be generated automatically. You can provide this username and password to the coordinator to log in and manage appointments.
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCoordinatorModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCoordinator}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingCoordinator ? 'Creating...' : 'Create Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5B. MODAL: EDIT CLINIC COORDINATOR */}
      {isEditCoordinatorModalOpen && coordinatorToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="size-4 text-blue-600" />
                <span>Edit Clinic Coordinator</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditCoordinatorModalOpen(false);
                  setCoordinatorToEdit(null);
                }}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCoordinator} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Coordinator Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sara Ahmed"
                  value={editCoordinatorName}
                  onChange={(e) => setEditCoordinatorName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Doctor Service Commission (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="e.g. 5"
                    value={editCoordinatorCommissionPercent}
                    onChange={(e) => setEditCoordinatorCommissionPercent(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Commission percentage given by the doctor on services provided.
                </p>
              </div>

              {!isDoctor && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Clinic Monthly Base Salary (SAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 4000"
                    value={editCoordinatorSalary}
                    onChange={(e) => setEditCoordinatorSalary(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Fixed base salary paid directly by the clinic.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Update Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing password"
                  value={editCoordinatorPassword}
                  onChange={(e) => setEditCoordinatorPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Only enter a password if you want to reset it (min 6 characters).</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCoordinatorModalOpen(false);
                    setCoordinatorToEdit(null);
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditCoordinator}
                  className="px-4 py-1.5 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingEditCoordinator ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET COORDINATOR PASSWORD */}
      {isResetPasswordModalOpen && coordinatorToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="size-4 text-amber-600" />
                <span>Reset Coordinator Password</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordModalOpen(false);
                  setCoordinatorToReset(null);
                }}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[8px] border border-slate-200 dark:border-slate-700 mb-3.5 space-y-1">
              <div className="text-[11px] text-slate-500">Coordinator:</div>
              <div className="font-bold text-slate-900 dark:text-white text-xs">{coordinatorToReset.name}</div>
              <div className="font-mono text-[11px] text-slate-500">Username: {coordinatorToReset.username || coordinatorToReset.email}</div>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 6 characters)"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {resetSuccessMessage && (
                <div className="p-2 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs text-center animate-in fade-in">
                  {resetSuccessMessage}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setCoordinatorToReset(null);
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-4 py-1.5 rounded-[8px] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isResettingPassword ? 'Saving...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE COORDINATOR */}
      {isDeleteCoordinatorModalOpen && coordinatorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-sm w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Coordinator
                </h3>
                <p className="text-[11px] text-slate-400">Remove staff member</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to delete coordinator <span className="font-bold text-slate-900 dark:text-white">&ldquo;{coordinatorToDelete.name}&rdquo;</span>? This user will no longer be able to log in or manage doctor schedules.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeletingCoordinator}
                onClick={() => {
                  setIsDeleteCoordinatorModalOpen(false);
                  setCoordinatorToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCoordinator}
                onClick={handleConfirmDeleteCoordinator}
                className="px-4 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                {isDeletingCoordinator ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Delete Coordinator</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: CREATE APPOINTMENT TYPE WITH SERVICE SCOPE DROPDOWN */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="size-4 text-blue-600" />
                <span>Create Appointment Type</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointmentType} className="space-y-3.5">
              {/* Service Selection Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Applicable Service *
                </label>
                <select
                  value={newServiceTargetServiceId}
                  onChange={(e) => setNewServiceTargetServiceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                >
                  {doctorAssignedServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes || 30} min)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select the doctor treatment service this appointment type belongs to.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Appointment Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up Visit, Consultation, Treatment Session"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Duration (Minutes) *
                  </label>
                  <select
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes (Follow-up)</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes (Standard)</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 Hour)</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes (2 Hours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Price (SAR, Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 150"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description for patients & coordinator..."
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
              </div>

              <div className="p-2.5 rounded-[8px] bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 text-[11px] text-purple-900 dark:text-purple-200">
                This appointment type will be attached to <span className="font-bold">{doctorAssignedServices.find((s) => s.id === newServiceTargetServiceId)?.name || 'the selected service'}</span>.
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingService ? 'Creating...' : 'Create & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: CONFIRM DELETE APPOINTMENT TYPE */}
      {isDeleteAptModalOpen && aptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-sm w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Appointment Type
                </h3>
                <p className="text-[11px] text-slate-400">Permanently delete from database</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">&ldquo;{aptToDelete.name}&rdquo;</span>? This will remove it from the database and disable it for WhatsApp booking availability.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeletingApt}
                onClick={() => {
                  setIsDeleteAptModalOpen(false);
                  setAptToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingApt}
                onClick={confirmDeleteAppointmentType}
                className="px-4 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                {isDeletingApt ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Delete Appointment Type</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
