'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  XCircle,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  User,
  X,
  Building2,
  Stethoscope,
  List,
  CalendarDays,
  Filter,
  RotateCcw,
} from 'lucide-react';

export interface AppointmentItem {
  id: string;
  appointmentNumber?: number | null;
  fileNumber?: number | null;
  time: string;
  patientName: string;
  patientDetails: string;
  patientAvatar?: string;
  department: string;
  doctor: string;
  status: 'Confirmed' | 'In Progress' | 'Pending' | 'Cancelled';
  date: number;
  rawStartsAt?: string;
}

export interface DashboardMetricsProps {
  totalCount?: number;
  bookedCount?: number;
  pendingCount?: number;
  cancellationsCount?: number;
  todaysCount?: number;
}

export interface ServiceOption {
  id: string;
  name: string;
  doctorIds?: string[];
}

export interface DoctorOption {
  id: string;
  name: string;
  specialty?: string | null;
  serviceIds?: string[];
}

export interface AppointmentsScheduleDashboardProps {
  clinicId?: string;
  clinicName?: string;
  timezone?: string;
  initialAppointments?: AppointmentItem[];
  departments?: string[];
  doctors?: string[];
  serviceDoctorMap?: Record<string, string[]>;
  doctorServiceMap?: Record<string, string[]>;
  servicesList?: ServiceOption[];
  doctorsList?: DoctorOption[];
  metrics?: DashboardMetricsProps;
}

const DEFAULT_DEPARTMENTS = [
  'PicoWay Laser Rejuvenation',
  'Deep Cleansing & Relaxation Facial',
  'Laser Genesis & Skin Tightening',
  'Medical Chemical Peel',
  'Anti-Aging & Collagen Therapy',
];

const DEFAULT_SAMPLE_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'sample-1',
    appointmentNumber: 1,
    fileNumber: 3,
    time: '2:15 PM',
    patientName: 'Sami',
    patientDetails: '923160054922',
    department: 'Laser Genesis & Skin Tightening',
    doctor: 'Dr. Abdulrahman Alhuzimi',
    status: 'Confirmed',
    date: 1,
  },
];

const DEFAULT_DAILY_TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00',
];

export function AppointmentsScheduleDashboard({
  clinicId,
  clinicName = 'Reveal Skin & Glow Care',
  timezone = 'Asia/Riyadh',
  initialAppointments = [],
  departments = DEFAULT_DEPARTMENTS,
  doctors = [
    'Dr. Abdulrahman Alhuzimi',
    'Dr. Haitham Al-Gzlan',
    'Dr. Saud Al-Obaida',
    'Dr. Marwan Al-Haddad',
  ],
  serviceDoctorMap = {},
  doctorServiceMap = {},
  servicesList = [],
  doctorsList = [],
  metrics = { totalCount: 1, bookedCount: 1, pendingCount: 0, cancellationsCount: 0 },
}: AppointmentsScheduleDashboardProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(
    initialAppointments.length > 0 ? initialAppointments : DEFAULT_SAMPLE_APPOINTMENTS
  );

  // Sync with server appointments when updated
  useEffect(() => {
    if (initialAppointments && initialAppointments.length > 0) {
      setAppointments(initialAppointments);
    }
  }, [initialAppointments]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // New Appointment Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0] ?? '';
  });
  const [selectedSlotStartsAt, setSelectedSlotStartsAt] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ slotToken: string; startsAt: string; endsAt: string; label: string }>
  >([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<'Confirmed' | 'Pending'>('Confirmed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Compatible doctors for the currently selected service in modal
  const modalCompatibleDoctors = useMemo(() => {
    if (!selectedServiceId || servicesList.length === 0) return doctorsList;
    const srv = servicesList.find((s) => s.id === selectedServiceId);
    if (!srv || !srv.doctorIds || srv.doctorIds.length === 0) return doctorsList;
    const filtered = doctorsList.filter((d) => srv.doctorIds?.includes(d.id));
    return filtered.length > 0 ? filtered : doctorsList;
  }, [selectedServiceId, servicesList, doctorsList]);

  // Compute effective slots: dynamic availability from API or standard clinic slots fallback
  const effectiveSlots = useMemo(() => {
    if (availableSlots.length > 0) {
      return availableSlots.map((s) => {
        const dateObj = new Date(s.startsAt);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          startsAt: s.startsAt,
          label: `${timeStr} (Available)`,
        };
      });
    }

    if (!selectedDate) return [];

    return DEFAULT_DAILY_TIME_SLOTS.map((t) => {
      const iso = new Date(`${selectedDate}T${t}:00`).toISOString();
      const [h, m] = t.split(':');
      const hourNum = parseInt(h ?? '9', 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      const formatted = `${displayHour.toString().padStart(2, '0')}:${m} ${ampm}`;
      return {
        startsAt: iso,
        label: `${formatted} (Available Slot)`,
      };
    });
  }, [availableSlots, selectedDate]);

  // Ensure a slot is selected whenever effectiveSlots updates
  useEffect(() => {
    if (effectiveSlots.length > 0) {
      const exists = effectiveSlots.some((s) => s.startsAt === selectedSlotStartsAt);
      if (!exists && effectiveSlots[0]) {
        setSelectedSlotStartsAt(effectiveSlots[0].startsAt);
      }
    }
  }, [effectiveSlots, selectedSlotStartsAt]);

  // Open modal with fresh state
  const handleOpenNewAppointmentModal = () => {
    setNewPatientName('');
    setNewPhone('');
    setFormError(null);
    setSlotsError(null);
    setAvailableSlots([]);

    const initialServiceId = servicesList[0]?.id || '';
    setSelectedServiceId(initialServiceId);

    const srv = servicesList.find((s) => s.id === initialServiceId);
    const initialDoctor = srv?.doctorIds && srv.doctorIds.length > 0
      ? doctorsList.find((d) => srv.doctorIds?.includes(d.id))
      : doctorsList[0];

    setSelectedDoctorId(initialDoctor?.id || '');
    const todayStr = new Date().toISOString().split('T')[0] ?? '';
    setSelectedDate(todayStr);
    setSelectedSlotStartsAt(new Date(`${todayStr}T09:00:00`).toISOString());
    setNewStatus('Confirmed');
    setIsModalOpen(true);
  };

  // Fetch available slots from server whenever service, doctor, date or modal state changes
  useEffect(() => {
    if (!isModalOpen || !selectedServiceId || !selectedDoctorId || !selectedDate) {
      return;
    }

    let isMounted = true;
    setIsLoadingSlots(true);
    setFormError(null);
    setSlotsError(null);

    const queryParams = new URLSearchParams({
      serviceId: selectedServiceId,
      doctorId: selectedDoctorId,
      fromDate: selectedDate,
      toDate: selectedDate,
    });
    if (clinicId) {
      queryParams.set('clinicId', clinicId);
    }

    fetch(`/api/availability?${queryParams.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch availability');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const slots = data.slots || [];
        setAvailableSlots(slots);
        if (slots.length > 0 && slots[0]) {
          setSelectedSlotStartsAt(slots[0].startsAt);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching availability slots:', err);
        setAvailableSlots([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedServiceId, selectedDoctorId, selectedDate, clinicId]);

  // Handle service change in modal with cascading doctor auto-select
  const handleModalServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const srv = servicesList.find((s) => s.id === serviceId);
    if (srv?.doctorIds && srv.doctorIds.length > 0) {
      if (!srv.doctorIds.includes(selectedDoctorId)) {
        const firstValidDoctor = doctorsList.find((d) => srv.doctorIds?.includes(d.id));
        if (firstValidDoctor) {
          setSelectedDoctorId(firstValidDoctor.id);
        }
      }
    }
  };

  // Dependent Doctor Options (when Service is selected)
  const availableDoctors = useMemo(() => {
    if (selectedDepartment === 'ALL') {
      return doctors;
    }
    const mapped = serviceDoctorMap[selectedDepartment];
    if (mapped && mapped.length > 0) {
      return mapped;
    }
    const fromAppts = Array.from(
      new Set(
        appointments
          .filter((a) => a.department === selectedDepartment)
          .map((a) => a.doctor)
      )
    );
    return fromAppts.length > 0 ? fromAppts : doctors;
  }, [selectedDepartment, serviceDoctorMap, doctors, appointments]);

  // Dependent Service Options (when Doctor is selected)
  const availableServices = useMemo(() => {
    if (selectedDoctor === 'ALL') {
      return departments;
    }
    const mapped = doctorServiceMap[selectedDoctor];
    if (mapped && mapped.length > 0) {
      return mapped;
    }
    const fromAppts = Array.from(
      new Set(
        appointments
          .filter((a) => a.doctor === selectedDoctor)
          .map((a) => a.department)
      )
    );
    return fromAppts.length > 0 ? fromAppts : departments;
  }, [selectedDoctor, doctorServiceMap, departments, appointments]);

  // Handle Cascading Service Change
  const handleServiceChange = (service: string) => {
    setSelectedDepartment(service);
    if (service !== 'ALL' && selectedDoctor !== 'ALL') {
      const validDoctors =
        serviceDoctorMap[service] ||
        Array.from(
          new Set(
            appointments
              .filter((a) => a.department === service)
              .map((a) => a.doctor)
          )
        );
      if (validDoctors.length > 0 && !validDoctors.includes(selectedDoctor)) {
        setSelectedDoctor('ALL');
      }
    }
  };

  // Handle Cascading Doctor Change
  const handleDoctorChange = (doctor: string) => {
    setSelectedDoctor(doctor);
    if (doctor !== 'ALL' && selectedDepartment !== 'ALL') {
      const validServices =
        doctorServiceMap[doctor] ||
        Array.from(
          new Set(
            appointments
              .filter((a) => a.doctor === doctor)
              .map((a) => a.department)
          )
        );
      if (validServices.length > 0 && !validServices.includes(selectedDepartment)) {
        setSelectedDepartment('ALL');
      }
    }
  };

  // Count active filters
  const activeFiltersCount =
    (selectedDepartment !== 'ALL' ? 1 : 0) +
    (selectedDoctor !== 'ALL' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedDepartment('ALL');
    setSelectedDoctor('ALL');
    setSelectedStatus('ALL');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      // 1. Service / Department filter
      if (selectedDepartment !== 'ALL' && item.department !== selectedDepartment) {
        return false;
      }
      // 2. Doctor filter
      if (selectedDoctor !== 'ALL' && item.doctor !== selectedDoctor) {
        return false;
      }
      // 3. Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }
      // 4. Start Date filter
      if (startDate) {
        const itemDateStr = item.rawStartsAt ? item.rawStartsAt.slice(0, 10) : '';
        if (itemDateStr && itemDateStr < startDate) {
          return false;
        }
      }
      // 5. End Date filter
      if (endDate) {
        const itemDateStr = item.rawStartsAt ? item.rawStartsAt.slice(0, 10) : '';
        if (itemDateStr && itemDateStr > endDate) {
          return false;
        }
      }
      // 6. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesDoctor = item.doctor.toLowerCase().includes(q);
        const matchesDept = item.department.toLowerCase().includes(q);
        const matchesPhone = item.patientDetails.toLowerCase().includes(q);
        const matchesFile = item.fileNumber?.toString().includes(q);
        const matchesAppt = item.appointmentNumber?.toString().includes(q);
        if (!matchesName && !matchesDoctor && !matchesDept && !matchesPhone && !matchesFile && !matchesAppt) {
          return false;
        }
      }
      return true;
    });
  }, [
    appointments,
    selectedDepartment,
    selectedDoctor,
    selectedStatus,
    startDate,
    endDate,
    searchQuery,
  ]);

  // Dynamic counts derived directly from live appointments state
  const totalCountDisplay = appointments.length;
  const bookedCountDisplay = appointments.filter(
    (a) => a.status === 'Confirmed' || a.status === 'In Progress'
  ).length;
  const pendingCountDisplay = appointments.filter((a) => a.status === 'Pending').length;
  const cancellationsCountDisplay = appointments.filter((a) => a.status === 'Cancelled').length;

  // Handle Add Appointment via API
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPhone.trim()) {
      setFormError('Please enter Patient Name and Phone Number.');
      return;
    }
    if (!selectedSlotStartsAt) {
      setFormError('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          doctorId: selectedDoctorId,
          serviceId: selectedServiceId,
          patientName: newPatientName.trim(),
          patientPhone: newPhone.trim(),
          startsAt: selectedSlotStartsAt,
          status: newStatus === 'Confirmed' ? 'CONFIRMED' : 'PENDING',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data?.error?.message || 'Failed to book appointment.');
        setIsSubmitting(false);
        return;
      }

      const serviceObj = servicesList.find((s) => s.id === selectedServiceId);
      const doctorObj = doctorsList.find((d) => d.id === selectedDoctorId);
      const startsAtDate = new Date(selectedSlotStartsAt);
      const formattedTime = startsAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newAppt: AppointmentItem = {
        id: data.appointment?.id || `appt-${Date.now()}`,
        appointmentNumber: data.appointment?.appointmentNumber || appointments.length + 1,
        fileNumber: data.appointment?.fileNumber || null,
        time: formattedTime,
        patientName: newPatientName.trim(),
        patientDetails: newPhone.trim(),
        department: serviceObj?.name || 'Service',
        doctor: doctorObj?.name || 'Doctor',
        status: newStatus,
        date: startsAtDate.getDate(),
        rawStartsAt: selectedSlotStartsAt,
      };

      setAppointments((prev) => [newAppt, ...prev]);
      setIsModalOpen(false);
      setNewPatientName('');
      setNewPhone('');
      setSelectedSlotStartsAt('');
    } catch (err) {
      console.error(err);
      setFormError('An unexpected error occurred while booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badge Styling Helper with rounded-[8px]
  const getStatusBadge = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <span className="size-1.5 rounded-full bg-blue-500" />
            In Progress
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentItem['status']) => {
    // 1. Immediately update UI state (re-renders table badge & stat cards instantly)
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    setActiveActionId(null);

    // 2. Persist to DB asynchronously
    try {
      const dbStatus =
        newStatus === 'Confirmed'
          ? 'CONFIRMED'
          : newStatus === 'Cancelled'
          ? 'CANCELLED'
          : newStatus === 'Pending'
          ? 'PENDING'
          : 'CONFIRMED';

      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus }),
      });
    } catch (err) {
      console.error('Failed to update appointment status in database:', err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    // 1. Immediately remove from UI state
    setAppointments((prev) => prev.filter((app) => app.id !== id));
    setActiveActionId(null);

    // 2. Persist deletion to DB
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete appointment from database:', err);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER (FLUSH BORDER ATTACHED TO SIDEBAR) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Appointments Schedule
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Manage daily appointments and doctor schedules for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span> ({timezone}).
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNewAppointmentModal}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, NO ROUNDNESS, ATTACHED DIRECTLY TO SIDEBAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Appointments */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Total Appointments
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-100 dark:border-blue-900/50 inline-block">
                All scheduled
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/70 dark:border-blue-900/50 shadow-2xs">
            <CalendarIcon className="size-4" />
          </div>
        </div>

        {/* Card 2: Booked Appointments */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Booked Appointments
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {bookedCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Confirmed &amp; Active
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        {/* Card 3: Pending Requests */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Pending Requests
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {pendingCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Action required
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 4: Cancelled Appointments */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Cancelled Appointments
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {cancellationsCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-100 dark:border-rose-900/50 inline-block">
                Released slots
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/80 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-900/50 shadow-2xs">
            <XCircle className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TABLE SECTION (FIXED HEIGHT, FLAT EDGES ATTACHED TO SIDEBAR, SCROLLER INSIDE) */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top Toolbar: Fixed-Width Search, Filter Dropdown Modal, & View Switcher */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Stable Search Input with fixed width to prevent any layout fluctuation */}
            <div className="relative w-72 sm:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments, patients, doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filter Dropdown Modal Anchor */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600 shadow-2xs'
                    : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="size-4.5 rounded-full bg-blue-500 text-white dark:bg-white dark:text-blue-600 text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* FLOATING DROPDOWN MODAL FOR FILTERS */}
              {isFilterOpen && (
                <>
                  {/* Invisible Backdrop to close on click outside */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFilterOpen(false)}
                  />

                  {/* Dropdown Modal Popover */}
                  <div className="absolute left-0 top-full mt-2 z-40 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-2xl p-4.5 space-y-3 text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Filter className="size-3.5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Filter Appointments
                        </h4>
                        {activeFiltersCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-[8px] bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-bold">
                            {activeFiltersCount} active
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="p-1 rounded-[8px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {/* 1. Service / Department Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Service / Department
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="ALL">All Services ({availableServices.length})</option>
                        {availableServices.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Doctor Filter (Filtered contextually by Service) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Doctor
                      </label>
                      <select
                        value={selectedDoctor}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="ALL">All Doctors ({availableDoctors.length})</option>
                        {availableDoctors.map((doc) => (
                          <option key={doc} value={doc}>
                            {doc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Status Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* 4. Date Range: Start & End Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-0.5">From Date</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-0.5">To Date</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        disabled={activeFiltersCount === 0}
                        className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold flex items-center gap-1 transition-colors ${
                          activeFiltersCount > 0
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <RotateCcw className="size-3" />
                        <span>Clear all</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-[8px] flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <List className="size-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <CalendarDays className="size-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Render View Mode */}
        {viewMode === 'calendar' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 overflow-y-auto">
            <CalendarIcon className="size-10 mb-2.5 text-slate-300 dark:text-slate-700" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Calendar View
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Viewing schedule for {clinicName}. Switch to List view to manage individual bookings.
            </p>
          </div>
        ) : (
          /* TABLE VIEW WITH COMPACT ROW HEIGHT & DIFFERENTIATING BORDER LINES */
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                <tr className="divide-x divide-slate-200 dark:divide-slate-700/60">
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    FILE NO
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    APPOINTMENT NO
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    PATIENT
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    DEPARTMENT
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    DOCTOR
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-xs">
                      No appointments matching the selected filters. Click &quot;Reset&quot; to view all.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group divide-x divide-slate-100 dark:divide-slate-800/60"
                    >
                      {/* 1. FILE NO */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {typeof row.fileNumber === 'number' ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-[8px] text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800"
                            title="Medical File Number"
                          >
                            File #{row.fileNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* 2. APPOINTMENT NO */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {typeof row.appointmentNumber === 'number' ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-[8px] text-[11px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800"
                            title="Appointment Number"
                          >
                            Appt #{row.appointmentNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* 3. PATIENT */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-[8px] bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                            {row.patientName[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-900 dark:text-white truncate text-xs leading-tight">
                              {row.patientName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-tight mt-0.5">
                              <span>{row.patientDetails}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">{row.time}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. DEPARTMENT */}
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap text-xs">
                        {row.department}
                      </td>

                      {/* 5. DOCTOR */}
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap text-xs">
                        {row.doctor}
                      </td>

                      {/* 6. STATUS */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* 7. ACTION */}
                      <td className="py-2.5 px-4 text-right relative whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionId(activeActionId === row.id ? null : row.id)
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-[8px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>

                        {activeActionId === row.id && (
                          <>
                            {/* Backdrop to close action dropdown on click outside */}
                            <div
                              className="fixed inset-0 z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionId(null);
                              }}
                            />

                            <div className="absolute right-4 top-8 z-30 w-44 bg-white dark:bg-slate-800 rounded-[8px] shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(row.id, 'Confirmed');
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="size-3.5 text-emerald-500" />
                                <span>Mark Confirmed</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(row.id, 'In Progress');
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <Clock className="size-3.5 text-blue-500" />
                                <span>Mark In Progress</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(row.id, 'Pending');
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <Clock className="size-3.5 text-amber-500" />
                                <span>Mark Pending</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(row.id, 'Cancelled');
                                }}
                                className="w-full px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <AlertCircle className="size-3.5 text-red-500" />
                                <span>Mark Cancelled</span>
                              </button>
                              <hr className="my-1 border-slate-100 dark:border-slate-700" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAppointment(row.id);
                                }}
                                className="w-full px-3.5 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                              >
                                <XCircle className="size-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>      {/* 4. MODAL FOR NEW APPOINTMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-2xl max-w-lg w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="size-4 text-blue-600" />
                <span>New Appointment</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="space-y-3.5 pt-3 overflow-y-auto flex-1 pr-0.5">
              {formError && (
                <div className="p-2.5 rounded-[8px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Exact user requested structure:
                  Row 1: Patient Name | Patient Phone
                  Row 2: Service | Doctor
                  Row 3: Time | Status
              */}
              <div className="grid grid-cols-2 gap-3">
                {/* Row 1, Col 1: Patient Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sami"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Row 1, Col 2: Patient Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Patient Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 923160054922"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Row 2, Col 1: Service */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Service *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedServiceId}
                      onChange={(e) => handleModalServiceChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      {servicesList.length > 0 ? (
                        servicesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Row 2, Col 2: Doctor */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Doctor *
                  </label>
                  <div className="relative">
                    <Stethoscope className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      {modalCompatibleDoctors.length > 0 ? (
                        modalCompatibleDoctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))
                      ) : (
                        doctors.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Row 3, Col 1: Time (Available Slots Dropdown + Date Picker) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Time Slot *
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-transparent border-none p-0 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedSlotStartsAt}
                      onChange={(e) => setSelectedSlotStartsAt(e.target.value)}
                      disabled={isLoadingSlots || effectiveSlots.length === 0}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:opacity-60"
                    >
                      {isLoadingSlots ? (
                        <option value="">Checking available slots...</option>
                      ) : effectiveSlots.length === 0 ? (
                        <option value="">No slots available</option>
                      ) : (
                        effectiveSlots.map((slot) => (
                          <option key={slot.startsAt} value={slot.startsAt}>
                            {slot.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Row 3, Col 2: Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingSlots || !selectedSlotStartsAt}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Booking...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
