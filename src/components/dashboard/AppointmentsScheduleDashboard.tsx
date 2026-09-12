'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
  UserCheck,
  UserPlus,
  FileText,
  DollarSign,
  Check,
  Globe,
  Trash2,
  AlertTriangle,
  Send,
  ExternalLink,
  ShieldCheck,
  Layers,
  HeartPulse,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { cn } from '@/components/ui/primitives';
import { AppointmentsCalendarView } from './AppointmentsCalendarView';

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
  status: 'Confirmed' | 'Checked In' | 'In Progress' | 'Pending' | 'Cancelled' | 'Completed';
  date: number;
  rawStartsAt?: string;
  servicePrice?: number;
  invoiceNumber?: string;
  invoiceTotal?: number;
  invoiceDiscount?: number;
  invoiceStatus?: string;
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

export interface WhatsAppInfoProps {
  isConnected: boolean;
  displayPhoneNumber?: string | null;
}

export interface AppointmentTypeItem {
  id: string;
  serviceId: string;
  doctorId?: string | null;
  name: string;
  durationMinutes: number;
  priceMinor?: number | null;
  currency?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface AppointmentsScheduleDashboardProps {
  clinicId?: string;
  clinicName?: string;
  timezone?: string;
  initialAppointments?: AppointmentItem[];
  initialAppointmentTypes?: AppointmentTypeItem[];
  departments?: string[];
  doctors?: string[];
  serviceDoctorMap?: Record<string, string[]>;
  doctorServiceMap?: Record<string, string[]>;
  servicesList?: ServiceOption[];
  doctorsList?: DoctorOption[];
  metrics?: DashboardMetricsProps;
  userRole?: string;
  whatsappInfo?: WhatsAppInfoProps;
  showWhatsAppButton?: boolean;
}

const DEFAULT_DEPARTMENTS = [
  'PicoWay Laser Rejuvenation',
  'Deep Cleansing & Relaxation Facial',
  'Laser Genesis & Skin Tightening',
  'Medical Chemical Peel',
  'Anti-Aging & Collagen Therapy',
];

const DEFAULT_DAILY_TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00',
];

const getLocalTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  initialAppointmentTypes = [],
  metrics = { totalCount: 0, bookedCount: 0, pendingCount: 0, cancellationsCount: 0 },
  userRole,
  whatsappInfo = { isConnected: false },
  showWhatsAppButton = false,
}: AppointmentsScheduleDashboardProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments);
  const [appointmentTypesList, setAppointmentTypesList] = useState<AppointmentTypeItem[]>(
    initialAppointmentTypes || []
  );

  // Sync with server appointments & appointment types when updated
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    if (initialAppointmentTypes && initialAppointmentTypes.length > 0) {
      setAppointmentTypesList(initialAppointmentTypes);
    }
  }, [initialAppointmentTypes]);

  // Fetch live appointment types for this clinic on mount
  useEffect(() => {
    if (clinicId) {
      fetch(`/api/appointment-types?clinicId=${clinicId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && Array.isArray(data.appointmentTypes)) {
            setAppointmentTypesList(data.appointmentTypes);
          }
        })
        .catch(() => {});
    }
  }, [clinicId]);

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
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // New Appointment Form State
  const [patientTab, setPatientTab] = useState<'NEW' | 'EXISTING'>('NEW');
  const [searchFileNumber, setSearchFileNumber] = useState('');
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState<{
    id: string;
    fileNumber: number;
    name: string;
    phone: string;
    title?: string;
    gender?: string;
    nationality?: string;
    email?: string;
    username?: string;
    appointmentsCount?: number;
  } | null>(null);
  const [searchPatientError, setSearchPatientError] = useState<string | null>(null);

  // Patient Intake Fields
  const [patientTitle, setPatientTitle] = useState('Mr.');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientNationality, setPatientNationality] = useState('');
  const [pendingPayment, setPendingPayment] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // Booking Parameters
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedAppointmentTypeId, setSelectedAppointmentTypeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalTodayDateString();
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

  // Delete Appointment Confirmation State
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentItem | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Complete Appointment & Doctor Discount Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<AppointmentItem | null>(null);
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Search Existing Patient by File Number
  const handleSearchPatient = async () => {
    if (!searchFileNumber.trim()) {
      setSearchPatientError('Please enter a File Number to search.');
      return;
    }
    setIsSearchingPatient(true);
    setSearchPatientError(null);
    try {
      const res = await fetch(`/api/patients?fileNumber=${encodeURIComponent(searchFileNumber.trim())}`);
      const data = await res.json();
      if (!res.ok || !data?.patient) {
        setSearchPatientError(`No patient found with File #${searchFileNumber.trim()}`);
        setFoundPatient(null);
      } else {
        setFoundPatient(data.patient);
        setNewPatientName(data.patient.name || '');
        setNewPhone(data.patient.phone || '');
        if (data.patient.title) setPatientTitle(data.patient.title);
        if (data.patient.gender) setPatientGender(data.patient.gender);
        if (data.patient.nationality) setPatientNationality(data.patient.nationality);
      }
    } catch (err) {
      console.error(err);
      setSearchPatientError('Could not connect to patient database.');
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // Doctors available in modal (already role-scoped by server)
  const modalDoctors = useMemo(() => {
    return doctorsList.length > 0
      ? doctorsList
      : doctors.map((d) => ({ id: d, name: d, serviceIds: [] }));
  }, [doctorsList, doctors]);

  // Services dynamically filtered to only those belonging to the currently selected doctor
  const modalCompatibleServices = useMemo(() => {
    if (!selectedDoctorId) {
      if (doctorsList.length > 0) {
        const allDoctorServiceIds = new Set(doctorsList.flatMap((d) => d.serviceIds || []));
        return servicesList.filter((s) => allDoctorServiceIds.has(s.id));
      }
      return servicesList;
    }

    const currentDoc = doctorsList.find((d) => d.id === selectedDoctorId);
    if (currentDoc && currentDoc.serviceIds && currentDoc.serviceIds.length > 0) {
      return servicesList.filter((s) => currentDoc.serviceIds?.includes(s.id));
    }

    // Fallback: check if service has doctorIds containing selectedDoctorId
    const filtered = servicesList.filter((s) => s.doctorIds?.includes(selectedDoctorId));
    return filtered.length > 0 ? filtered : servicesList;
  }, [selectedDoctorId, doctorsList, servicesList]);

  // Compute effective slots: dynamic availability from API or standard clinic slots fallback
  const effectiveSlots = useMemo(() => {
    const nowTime = Date.now();

    if (availableSlots.length > 0) {
      return availableSlots
        .filter((s) => {
          const slotMs = new Date(s.startsAt).getTime();
          return slotMs > nowTime;
        })
        .map((s) => {
          const dateObj = new Date(s.startsAt);
          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            startsAt: s.startsAt,
            label: `${timeStr} (Available)`,
          };
        });
    }

    if (!selectedDate) return [];

    return DEFAULT_DAILY_TIME_SLOTS
      .map((t) => {
        const iso = new Date(`${selectedDate}T${t}:00`).toISOString();
        const slotMs = new Date(iso).getTime();
        const [h, m] = t.split(':');
        const hourNum = parseInt(h ?? '9', 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        const formatted = `${displayHour.toString().padStart(2, '0')}:${m} ${ampm}`;
        return {
          startsAt: iso,
          slotMs,
          label: `${formatted} (Available Slot)`,
        };
      })
      .filter((slot) => {
        // Exclude past slots
        return slot.slotMs > nowTime;
      })
      .map(({ startsAt, label }) => ({
        startsAt,
        label,
      }));
  }, [availableSlots, selectedDate]);

  // Ensure a valid future slot is selected whenever effectiveSlots updates
  useEffect(() => {
    if (effectiveSlots.length > 0) {
      const exists = effectiveSlots.some((s) => s.startsAt === selectedSlotStartsAt);
      if (!exists && effectiveSlots[0]) {
        setSelectedSlotStartsAt(effectiveSlots[0].startsAt);
      }
    } else {
      setSelectedSlotStartsAt('');
    }
  }, [effectiveSlots, selectedSlotStartsAt]);

  // Ensure selectedDoctorId is always valid within modalDoctors
  useEffect(() => {
    if (modalDoctors.length > 0) {
      const exists = modalDoctors.some((d) => d.id === selectedDoctorId);
      if (!exists && modalDoctors[0]) {
        setSelectedDoctorId(modalDoctors[0].id);
      }
    }
  }, [modalDoctors, selectedDoctorId]);

  // Ensure selectedServiceId is always valid within modalCompatibleServices for the current doctor
  useEffect(() => {
    if (modalCompatibleServices.length > 0) {
      const exists = modalCompatibleServices.some((s) => s.id === selectedServiceId);
      if (!exists && modalCompatibleServices[0]) {
        setSelectedServiceId(modalCompatibleServices[0].id);
      }
    }
  }, [modalCompatibleServices, selectedServiceId]);

  // Appointment types matching the currently selected service (and optionally doctor)
  const availableAppointmentTypes = useMemo(() => {
    const sId = selectedServiceId || modalCompatibleServices[0]?.id;
    if (!sId) return [];
    return appointmentTypesList.filter(
      (at) => at.serviceId === sId && (!at.doctorId || !selectedDoctorId || at.doctorId === selectedDoctorId)
    );
  }, [appointmentTypesList, selectedServiceId, modalCompatibleServices, selectedDoctorId]);

  // Ensure selectedAppointmentTypeId is valid within availableAppointmentTypes
  useEffect(() => {
    if (availableAppointmentTypes.length > 0) {
      if (selectedAppointmentTypeId && !availableAppointmentTypes.some((at) => at.id === selectedAppointmentTypeId)) {
        setSelectedAppointmentTypeId('');
      }
    } else {
      setSelectedAppointmentTypeId('');
    }
  }, [availableAppointmentTypes, selectedAppointmentTypeId]);

  // Open modal with fresh state
  const handleOpenNewAppointmentModal = (prefillDate?: string, prefillTime?: string) => {
    setPatientTab('NEW');
    setSearchFileNumber('');
    setFoundPatient(null);
    setSearchPatientError(null);
    setPatientTitle('Mr.');
    setNewPatientName('');
    setNewPhone('');
    setPatientGender('Male');
    setPatientNationality('');
    setPendingPayment('');
    setAppointmentNotes('');
    setSelectedAppointmentTypeId('');
    setFormError(null);
    setSlotsError(null);
    setAvailableSlots([]);

    // Select initial doctor based on scoped doctorsList
    const initialDoctor = doctorsList[0];
    const initialDoctorId = initialDoctor?.id || '';
    setSelectedDoctorId(initialDoctorId);

    // Pick first service assigned specifically to this doctor
    const docServices = servicesList.filter((s) =>
      initialDoctor?.serviceIds?.includes(s.id) || s.doctorIds?.includes(initialDoctorId)
    );
    const initialServiceId = (docServices[0] || servicesList[0])?.id || '';
    setSelectedServiceId(initialServiceId);

    const targetDate = prefillDate || getLocalTodayDateString();
    setSelectedDate(targetDate);
    if (prefillTime && targetDate) {
      setSelectedSlotStartsAt(new Date(`${targetDate}T${prefillTime}:00`).toISOString());
    } else {
      setSelectedSlotStartsAt('');
    }
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

  // Handle doctor change in modal - immediately scopes services to this doctor
  const handleModalDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const doc = doctorsList.find((d) => d.id === doctorId);
    const docServices = servicesList.filter((s) =>
      (doc?.serviceIds && doc.serviceIds.includes(s.id)) ||
      (s.doctorIds && s.doctorIds.includes(doctorId))
    );
    if (docServices.length > 0 && docServices[0] && !docServices.some((s) => s.id === selectedServiceId)) {
      setSelectedServiceId(docServices[0].id);
    }
  };

  // Handle service change in modal
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
    if (patientTab === 'EXISTING' && !foundPatient) {
      setFormError('Please search and select an existing patient by Patient ID first.');
      return;
    }
    if (patientTab === 'NEW' && (!newPatientName.trim() || !newPhone.trim())) {
      setFormError('Please enter Patient Name and Mobile Number.');
      return;
    }
    if (!selectedSlotStartsAt) {
      setFormError('Please select an available time slot.');
      return;
    }
    if (new Date(selectedSlotStartsAt).getTime() <= Date.now()) {
      setFormError('The selected time slot is in the past. Please choose an upcoming time slot.');
      return;
    }

    const effectiveServiceId = selectedServiceId || modalCompatibleServices[0]?.id || servicesList[0]?.id || '';
    const effectiveDoctorId = selectedDoctorId || modalDoctors[0]?.id || doctorsList[0]?.id || '';

    if (!effectiveServiceId) {
      setFormError('Please select a valid service.');
      return;
    }
    if (!effectiveDoctorId) {
      setFormError('Please select a valid doctor.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const pName = patientTab === 'NEW' ? newPatientName.trim() : (foundPatient?.name || '');
      const pPhone = patientTab === 'NEW' ? newPhone.trim() : (foundPatient?.phone || '');
      const pTitle = patientTab === 'NEW' ? patientTitle : (foundPatient?.title || undefined);
      const pGender = patientTab === 'NEW' ? patientGender : (foundPatient?.gender || undefined);
      const pNationality = patientTab === 'NEW' ? (patientNationality.trim() || undefined) : (foundPatient?.nationality || undefined);

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          doctorId: effectiveDoctorId,
          serviceId: effectiveServiceId,
          patientType: patientTab,
          fileNumber: patientTab === 'EXISTING' ? foundPatient?.fileNumber : undefined,
          patientId: patientTab === 'EXISTING' ? foundPatient?.id : undefined,
          title: pTitle,
          gender: pGender,
          nationality: pNationality,
          patientName: pName,
          patientPhone: pPhone,
          pendingPayment: pendingPayment.trim() || undefined,
          notes: appointmentNotes.trim() || undefined,
          appointmentTypeId: selectedAppointmentTypeId || undefined,
          startsAt: selectedSlotStartsAt,
          status: newStatus === 'Confirmed' ? 'CONFIRMED' : 'PENDING',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let errorMsg = data?.error?.message || data?.error || 'Failed to book appointment.';
        if (data?.error?.details?.issues?.length > 0) {
          const detailed = data.error.details.issues
            .map((issue: any) => `${issue.path ? `${issue.path}: ` : ''}${issue.message}`)
            .join(', ');
          errorMsg = `${errorMsg} (${detailed})`;
        } else if (data?.error?.details?.reason) {
          errorMsg = `${errorMsg}: ${data.error.details.reason}`;
        }
        setFormError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const serviceObj = servicesList.find((s) => s.id === effectiveServiceId);
      const doctorObj = doctorsList.find((d) => d.id === effectiveDoctorId);
      const startsAtDate = new Date(selectedSlotStartsAt);
      const formattedTime = startsAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newAppt: AppointmentItem = {
        id: data.appointment?.id || `appt-${Date.now()}`,
        appointmentNumber: data.appointment?.appointmentNumber || appointments.length + 1,
        fileNumber: data.appointment?.fileNumber || (patientTab === 'EXISTING' ? foundPatient?.fileNumber : null),
        time: formattedTime,
        patientName: (pTitle ? `${pTitle} ` : '') + pName,
        patientDetails: pPhone,
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
      setSelectedAppointmentTypeId('');
      setFoundPatient(null);
      setSearchFileNumber('');
      setPendingPayment('');
      setAppointmentNotes('');
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
      case 'Checked In':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/30 dark:text-teal-300 border border-[#0d8276]/30">
            <span className="size-1.5 rounded-full bg-[#0d8276] animate-ping" />
            Checked In
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
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
            <span className="size-1.5 rounded-full bg-teal-500" />
            Completed
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

  const handleOpenCompleteModal = (item: AppointmentItem) => {
    setActiveActionId(null);
    setAppointmentToComplete(item);
    setDiscountType('AMOUNT');
    setDiscountValue(0);
    setCompletionNotes('');
    setCompleteError(null);
    setIsCompleteModalOpen(true);
  };

  const handleConfirmCompleteAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentToComplete) return;
    setIsCompleting(true);
    setCompleteError(null);

    const basePrice = appointmentToComplete.servicePrice ?? 0;
    const computedDiscount =
      discountType === 'PERCENT'
        ? Math.min(basePrice, (basePrice * (discountValue || 0)) / 100)
        : Math.min(basePrice, Math.max(0, discountValue || 0));
    const finalTotal = Math.max(0, basePrice - computedDiscount);

    try {
      const res = await fetch(`/api/appointments/${appointmentToComplete.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          discountAmount: discountType === 'AMOUNT' ? discountValue : undefined,
          discountPercent: discountType === 'PERCENT' ? discountValue : undefined,
          notes: completionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete appointment');
      }

      setAppointments((prev) =>
        prev.map((app) =>
          app.id === appointmentToComplete.id
            ? {
                ...app,
                status: 'Completed',
                invoiceDiscount: computedDiscount,
                invoiceTotal: finalTotal,
              }
            : app
        )
      );

      setIsCompleteModalOpen(false);
      setAppointmentToComplete(null);
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Failed to complete appointment');
    } finally {
      setIsCompleting(false);
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
          : newStatus === 'Checked In'
          ? 'CHECKED_IN'
          : newStatus === 'Cancelled'
          ? 'CANCELLED'
          : newStatus === 'Pending'
          ? 'PENDING'
          : newStatus === 'Completed'
          ? 'COMPLETED'
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

  const handleDeleteAppointment = (item: AppointmentItem) => {
    setActiveActionId(null);
    setAppointmentToDelete(item);
    setDeleteConfirmInput('');
    setDeleteError(null);
  };

  const handleConfirmDeleteAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentToDelete) return;
    if (deleteConfirmInput.trim().toUpperCase() !== 'CONFIRM DELETE') {
      setDeleteError('Please type "CONFIRM DELETE" exactly to proceed.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/appointments/${appointmentToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data?.error?.message || data?.error || 'Failed to delete appointment from database.');
        setIsDeleting(false);
        return;
      }

      // Remove from live UI state
      setAppointments((prev) => prev.filter((app) => app.id !== appointmentToDelete.id));
      setAppointmentToDelete(null);
      setDeleteConfirmInput('');
    } catch (err) {
      console.error('Failed to delete appointment from database:', err);
      setDeleteError('An unexpected error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER (FLUSH BORDER ATTACHED TO SIDEBAR) */}
      <div className="px-6 py-3 border-b border-[#0d8276]/10 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-[#0d3d38] dark:text-white tracking-tight leading-tight">
            Appointments Schedule
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Manage daily appointments and doctor schedules for{' '}
            <span className="font-semibold text-[#0d5c56] dark:text-teal-300">{clinicName}</span> ({timezone}).
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {showWhatsAppButton && (
            whatsappInfo?.isConnected ? (
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/90 dark:border-emerald-700 font-semibold text-xs px-3.5 py-2 rounded-[8px] shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                title="WhatsApp is connected & working"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <FaWhatsapp className="size-4 text-[#25D366]" />
                <span>WhatsApp Activated</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs px-3.5 py-2 rounded-[8px] shadow-[0_4px_14px_rgba(37,211,102,0.28)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                title="Click to connect WhatsApp integration"
              >
                <FaWhatsapp className="size-4" />
                <span>Connect WhatsApp</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => handleOpenNewAppointmentModal()}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-4 py-2 rounded-[8px] shadow-[0_4px_14px_rgba(13,97,87,0.22)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, NO ROUNDNESS, ATTACHED DIRECTLY TO SIDEBAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 border-b border-[#0d8276]/10 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Appointments */}
        <div className="px-5 py-3.5 flex items-center justify-between hover:bg-[#f8fcfa]/80 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Total Appointments
            </span>
            <div className="text-2xl font-bold text-[#0d3d38] dark:text-white tracking-tight leading-none">
              {totalCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#0d8276]/20 inline-block">
                All scheduled
              </span>
            </div>
          </div>
          <div className="size-9 rounded-xl bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <CalendarIcon className="size-4 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Booked Appointments */}
        <div className="px-5 py-3.5 flex items-center justify-between hover:bg-[#f8fcfa]/80 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Booked Appointments
            </span>
            <div className="text-2xl font-bold text-emerald-900 dark:text-white tracking-tight leading-none">
              {bookedCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-emerald-200/80 inline-block">
                Confirmed &amp; Active
              </span>
            </div>
          </div>
          <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="size-4 stroke-[2]" />
          </div>
        </div>

        {/* Card 3: Pending Requests */}
        <div className="px-5 py-3.5 flex items-center justify-between hover:bg-[#f8fcfa]/80 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Pending Requests
            </span>
            <div className="text-2xl font-bold text-amber-900 dark:text-white tracking-tight leading-none">
              {pendingCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-200/80 inline-block">
                Action required
              </span>
            </div>
          </div>
          <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
            <Clock className="size-4 stroke-[2]" />
          </div>
        </div>

        {/* Card 4: Cancelled Appointments */}
        <div className="px-5 py-3.5 flex items-center justify-between hover:bg-[#f8fcfa]/80 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Cancelled Appointments
            </span>
            <div className="text-2xl font-bold text-rose-900 dark:text-white tracking-tight leading-none">
              {cancellationsCountDisplay}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-rose-200/80 inline-block">
                Released slots
              </span>
            </div>
          </div>
          <div className="size-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
            <XCircle className="size-4 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TABLE SECTION (FIXED HEIGHT, FLAT EDGES ATTACHED TO SIDEBAR, SCROLLER INSIDE) */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top Toolbar: Fixed-Width Search, Filter Dropdown Modal, & View Switcher */}
        <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Stable Search Input with fixed width to prevent any layout fluctuation */}
            <div className="relative w-72 sm:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments, patients, doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-xl pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0d8276]/20 focus:border-[#0d8276] transition-all"
              />
            </div>

            {/* Filter Dropdown Modal Anchor */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-[#0d6157] text-white border-[#0d6157] shadow-xs'
                    : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#e6f6f3] hover:text-[#0d6157] hover:border-[#0d8276]/30'
                }`}
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="size-4.5 rounded-full bg-white text-[#0d6157] text-[10px] font-bold flex items-center justify-center">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-[#0d5c56] dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#0d6157] font-medium'
              }`}
            >
              <List className="size-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-[#0d5c56] dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#0d6157] font-medium'
              }`}
            >
              <CalendarDays className="size-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Render View Mode */}
        {viewMode === 'calendar' ? (
          <AppointmentsCalendarView
            appointments={filteredAppointments}
            clinicName={clinicName}
            timezone={timezone}
            userRole={userRole}
            onOpenNewAppointment={handleOpenNewAppointmentModal}
            onUpdateStatus={handleUpdateStatus}
            onOpenCompleteModal={handleOpenCompleteModal}
            onDeleteAppointment={handleDeleteAppointment}
            getStatusBadge={getStatusBadge}
          />
        ) : (
          /* TABLE VIEW WITH COMPACT ROW HEIGHT & DIFFERENTIATING BORDER LINES */
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#f8fcfa] dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
                <tr className="divide-x divide-slate-200/70 dark:divide-slate-700/60">
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#0d5c56] dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    FILE NO
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#0d5c56] dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    APPOINTMENT NO
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#0d5c56] dark:text-slate-300 uppercase tracking-wider">
                    PATIENT
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#0d5c56] dark:text-slate-300 uppercase tracking-wider">
                    DEPARTMENT
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#0d5c56] dark:text-slate-300 uppercase tracking-wider">
                    DOCTOR
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#0d5c56] dark:text-slate-300 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="sticky top-0 right-0 z-20 bg-[#f8fcfa] dark:bg-slate-800 py-2.5 px-4 text-[11px] font-semibold text-[#0d5c56] dark:text-slate-300 uppercase tracking-wider text-right whitespace-nowrap shadow-[-4px_0_8px_rgba(0,0,0,0.04)] border-l border-slate-200/70 dark:border-slate-700">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-xs">
                      No appointments found matching your selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-[#f0f9f7]/40 dark:hover:bg-slate-800/40 transition-colors group divide-x divide-slate-100 dark:divide-slate-800/60 ${
                        activeActionId === row.id ? 'relative z-30' : 'relative z-0'
                      }`}
                    >
                      {/* 1. FILE NO */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-[#0d6157] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/20 px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20">
                          {row.fileNumber ? `FR-${String(row.fileNumber).padStart(3, '0')}` : 'FR-001'}
                        </span>
                      </td>

                      {/* 2. APPOINTMENT NO */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[8px] border border-slate-200 dark:border-slate-700">
                          {row.appointmentNumber
                            ? `AP-${String(row.appointmentNumber).padStart(3, '0')}`
                            : 'AP-001'}
                        </span>
                      </td>

                      {/* 3. PATIENT */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 border border-[#0d8276]/20">
                            {row.patientName ? row.patientName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {row.patientName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.2">
                              {row.patientDetails && <span>{row.patientDetails}</span>}
                              <span>•</span>
                              <span className="font-medium text-slate-600 dark:text-slate-300">
                                {row.time}
                              </span>
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
                      <td
                        className={`sticky right-0 ${
                          activeActionId === row.id ? 'z-30' : 'z-10'
                        } bg-white group-hover:bg-[#f0f9f7]/40 dark:bg-slate-900 dark:group-hover:bg-slate-800/80 py-2.5 px-4 text-right whitespace-nowrap shadow-[-4px_0_8px_rgba(0,0,0,0.04)] border-l border-slate-100 dark:border-slate-800 transition-colors`}
                      >
                        <div className="relative inline-block text-right">
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
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionId(null);
                                }}
                              />

                                <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white dark:bg-slate-800 rounded-[8px] shadow-2xl border border-slate-200 dark:border-slate-700 py-1 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(row.id, 'Checked In');
                                    }}
                                    className="w-full px-3.5 py-2 text-[#0d5c56] dark:text-teal-300 hover:bg-[#e6f6f3] dark:hover:bg-[#0d6157]/20 flex items-center gap-2 font-bold cursor-pointer border-b border-slate-100 dark:border-slate-700/60"
                                  >
                                    <UserCheck className="size-3.5 text-[#0d8276]" />
                                    <span>Check In Patient (Arrived)</span>
                                  </button>

                                  {userRole === 'NURSE' ? (
                                    <Link
                                      href="/portal/nurse"
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full px-3.5 py-2 text-[#0d5c56] dark:text-teal-300 hover:bg-[#e6f6f3] dark:hover:bg-[#0d6157]/20 flex items-center gap-2 font-bold cursor-pointer border-b border-slate-100 dark:border-slate-700/60"
                                    >
                                      <HeartPulse className="size-3.5 text-[#0d8276]" />
                                      <span>Nurse Station (Triage &amp; Vitals)</span>
                                    </Link>
                                  ) : (
                                    <>
                                      <Link
                                        href="/portal/consultations"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 font-semibold cursor-pointer border-b border-slate-100 dark:border-slate-700/60"
                                      >
                                        <Stethoscope className="size-3.5 text-teal-600" />
                                        <span>Doctor Consultation Desk</span>
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenCompleteModal(row);
                                        }}
                                        className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 font-semibold cursor-pointer border-b border-slate-100 dark:border-slate-700/60"
                                      >
                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                        <span>Complete &amp; Apply Discount</span>
                                      </button>
                                    </>
                                  )}

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

                                  {userRole !== 'NURSE' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateStatus(row.id, 'Cancelled');
                                        }}
                                        className="w-full px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-semibold"
                                      >
                                        <AlertCircle className="size-3.5 text-rose-500" />
                                        <span>Mark Cancelled</span>
                                      </button>
                                      <hr className="my-1 border-slate-100 dark:border-slate-700" />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAppointment(row);
                                        }}
                                        className="w-full px-3.5 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                                      >
                                        <Trash2 className="size-3.5" />
                                        <span>Remove</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>      {/* 4. MODAL FOR NEW APPOINTMENT (EXISTING / NEW PATIENT FLOWS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative text-xs animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-[#0d3d38] dark:text-white flex items-center gap-2">
                <CalendarIcon className="size-4 text-[#0d8276]" />
                <span>Create Appointment</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Segmented Tab: Existing Patient vs New Patient */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mt-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPatientTab('NEW');
                  setFormError(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  patientTab === 'NEW'
                    ? 'bg-white dark:bg-slate-900 text-[#0d6157] dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="size-3.5" />
                <span>New Patient</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientTab('EXISTING');
                  setFormError(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  patientTab === 'EXISTING'
                    ? 'bg-white dark:bg-slate-900 text-[#0d6157] dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="size-3.5" />
                <span>Existing Patient</span>
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="space-y-3 pt-3 overflow-y-auto flex-1 pr-0.5 min-h-0">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: EXISTING PATIENT ID SEARCH */}
              {patientTab === 'EXISTING' && (
                <div className="space-y-2.5 bg-[#e6f6f3]/60 dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#0d8276]/20 dark:border-slate-700/80">
                  <label className="block text-[11px] font-bold text-[#0d3d38] dark:text-slate-300 uppercase tracking-wider">
                    Search Patient by Patient ID *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. PID-0001, 1001, or phone number"
                        value={searchFileNumber}
                        onChange={(e) => setSearchFileNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchPatient();
                          }
                        }}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 focus:border-[#0d8276]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchPatient}
                      disabled={isSearchingPatient || !searchFileNumber.trim()}
                      className="px-3.5 py-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 transition-all shadow-xs"
                    >
                      {isSearchingPatient ? (
                        <span>Searching...</span>
                      ) : (
                        <>
                          <Search className="size-3.5" />
                          <span>Search</span>
                        </>
                      )}
                    </button>
                  </div>

                  {searchPatientError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {searchPatientError}
                    </p>
                  )}

                  {/* Found Patient Profile Summary Card */}
                  {foundPatient && (
                    <div className="mt-2 p-2.5 bg-white dark:bg-slate-900 rounded-[8px] border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {foundPatient.title ? `${foundPatient.title} ` : ''}
                            {foundPatient.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {foundPatient.fileNumber ? `PID-${String(foundPatient.fileNumber).padStart(4, '0')}` : `PID-${foundPatient.id.slice(0, 6).toUpperCase()}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          📞 {foundPatient.phone} {foundPatient.gender ? `• ${foundPatient.gender}` : ''} {foundPatient.nationality ? `• ${foundPatient.nationality}` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="size-3.5 stroke-[3]" />
                        <span>Attached</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: NEW PATIENT INTAKE FIELDS */}
              {patientTab === 'NEW' && (
                <div className="space-y-2.5">
                  {/* Row 1: Title & Name */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Title
                      </label>
                      <select
                        value={patientTitle}
                        onChange={(e) => setPatientTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Patient Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                        <input
                          type="text"
                          required={patientTab === 'NEW'}
                          placeholder="e.g. Sami Ullah"
                          value={newPatientName}
                          onChange={(e) => setNewPatientName(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Mobile Number & Gender */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required={patientTab === 'NEW'}
                        placeholder="e.g. 966500000000"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Gender
                      </label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Nationality & Pending Payments */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Nationality
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="e.g. Saudi, Pakistani"
                          value={patientNationality}
                          onChange={(e) => setPatientNationality(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Pending Payments
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="e.g. 0 SAR, 150 SAR"
                          value={pendingPayment}
                          onChange={(e) => setPendingPayment(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BOOKING DETAILS (COMMON FOR BOTH TABS) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                {/* Service & Doctor */}
                <div className="grid grid-cols-2 gap-2">
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
                        {modalCompatibleServices.length > 0 ? (
                          modalCompatibleServices.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))
                        ) : (
                          <option value="">No services available for this doctor</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Doctor *
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => handleModalDoctorChange(e.target.value)}
                        disabled={userRole === 'DOCTOR' && modalDoctors.length <= 1}
                        className={cn(
                          'w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer',
                          userRole === 'DOCTOR' && modalDoctors.length <= 1 && 'opacity-90 cursor-not-allowed bg-slate-100 dark:bg-slate-800/70'
                        )}
                      >
                        {modalDoctors.length > 0 ? (
                          modalDoctors.map((d) => (
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
                </div>

                {/* Appointment Type Dropdown (ONLY shown if appointment types exist for selected service) */}
                {availableAppointmentTypes.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Appointment Type
                    </label>
                    <div className="relative">
                      <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                      <select
                        value={selectedAppointmentTypeId}
                        onChange={(e) => setSelectedAppointmentTypeId(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="">General / Standard Consultation</option>
                        {availableAppointmentTypes.map((at) => (
                          <option key={at.id} value={at.id}>
                            {at.name} ({at.durationMinutes}m{at.priceMinor !== undefined && at.priceMinor !== null ? ` - ${(at.priceMinor / 100).toFixed(0)} ${at.currency || 'SAR'}` : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Date & Time Slot */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Date *
                      </label>
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      min={getLocalTodayDateString()}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlotStartsAt('');
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Time Slot *
                    </label>
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
                          <option value="">No upcoming slots available</option>
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
                </div>

                {/* Status & Notes */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Status *
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Skin consultation, first session..."
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
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
                  disabled={isSubmitting || isLoadingSlots || !selectedSlotStartsAt || (patientTab === 'EXISTING' && !foundPatient)}
                  className="px-4 py-2 rounded-xl bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs shadow-[0_4px_14px_rgba(13,97,87,0.22)] cursor-pointer disabled:opacity-60 flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    'Booking...'
                  ) : (
                    <>
                      <Check className="size-3.5 stroke-[2.5]" />
                      <span>{patientTab === 'EXISTING' ? 'Attach & Create Appointment' : 'Create Appointment'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL FOR DELETE APPOINTMENT CONFIRMATION */}
      {appointmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-2xl max-w-md w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100 flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete Appointment
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    This action permanently deletes this record from the database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppointmentToDelete(null)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Appointment Details Preview Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-[10px] border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  {appointmentToDelete.patientName}
                </span>
                <div className="flex items-center gap-1.5">
                  {appointmentToDelete.fileNumber && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      FR-{String(appointmentToDelete.fileNumber).padStart(3, '0')}
                    </span>
                  )}
                  {appointmentToDelete.appointmentNumber && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      AP-{String(appointmentToDelete.appointmentNumber).padStart(3, '0')}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                • {appointmentToDelete.department} — {appointmentToDelete.doctor}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                • Scheduled Time: {appointmentToDelete.time}
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-[8px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Confirmation Form with Required Text */}
            <form onSubmit={handleConfirmDeleteAppointment} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Type <span className="text-rose-600 dark:text-rose-400 font-mono font-black select-all">CONFIRM DELETE</span> to proceed *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type CONFIRM DELETE"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAppointmentToDelete(null)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeleting ||
                    deleteConfirmInput.trim().toUpperCase() !== 'CONFIRM DELETE'
                  }
                  className="px-4 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      <span>Delete Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── WHATSAPP STATUS / CONNECT MODAL ─── */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-[#0d8276]/20 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Top Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-[8px] bg-[#25D366]/15 text-[#25D366] flex items-center justify-center border border-[#25D366]/30 shadow-2xs">
                  <FaWhatsapp className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {whatsappInfo?.isConnected ? 'WhatsApp Integration Active' : 'Connect WhatsApp'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {whatsappInfo?.isConnected ? 'Live patient messaging and automated reminders' : 'Enable automated messaging for your clinic'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              {whatsappInfo?.isConnected ? (
                <>
                  {/* Status Banner */}
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-[8px] flex items-start gap-3">
                    <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="size-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-xs">
                        WhatsApp Activated & Connected
                      </h4>
                      <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                        Meta Cloud API webhook is active and connected. Real-time patient confirmations and reminders are transmitting normally.
                      </p>
                    </div>
                  </div>

                  {/* Connected Details Grid */}
                  <div className="grid grid-cols-1 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-[8px] border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Connection Status:</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-[8px] font-bold text-[11px]">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active & Online
                      </span>
                    </div>
                    {whatsappInfo?.displayPhoneNumber && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">WhatsApp Number:</span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">
                          {whatsappInfo.displayPhoneNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Automations:</span>
                      <span className="font-semibold text-[#0d5c56] dark:text-teal-300">
                        24h & 2h Reminders Enabled
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Connect Guidance */}
                  <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-[8px] space-y-2">
                    <h4 className="font-bold text-[#0d3d38] dark:text-teal-200 text-xs flex items-center gap-1.5">
                      <FaWhatsapp className="size-4 text-[#25D366]" />
                      Direct WhatsApp Integration
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Connect your WhatsApp Business Account (via Meta Cloud API) to send automated booking confirmations, patient intake flows, and reschedule reminders.
                    </p>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <span className="size-4 rounded-full bg-[#0d6157]/10 text-[#0d6157] font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span>Configure your WhatsApp Phone ID & credentials in Organization Settings.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <span className="size-4 rounded-full bg-[#0d6157]/10 text-[#0d6157] font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span>Setup Webhook token to receive inbound patient messages automatically.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <span className="size-4 rounded-full bg-[#0d6157]/10 text-[#0d6157] font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <span>Instant status activation with active green badge on dashboard.</span>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href="/portal/organization"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{whatsappInfo?.isConnected ? 'Manage WhatsApp Settings' : 'Configure WhatsApp Now'}</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. COMPLETE APPOINTMENT & DOCTOR DISCOUNT MODAL ─── */}
      {isCompleteModalOpen && appointmentToComplete && (() => {
        const basePrice = appointmentToComplete.servicePrice ?? 0;
        const computedDiscount =
          discountType === 'PERCENT'
            ? Math.min(basePrice, (basePrice * (discountValue || 0)) / 100)
            : Math.min(basePrice, Math.max(0, discountValue || 0));
        const finalPayable = Math.max(0, basePrice - computedDiscount);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[8px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[8px] bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Complete Consultation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Apply doctor discount and generate the final patient invoice
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleConfirmCompleteAppointment} className="p-6 space-y-5 overflow-y-auto">
                {completeError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-[8px] text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{completeError}</span>
                  </div>
                )}

                {/* Patient & Service Summary Card */}
                <div className="p-4 rounded-[8px] bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Patient:</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {appointmentToComplete.patientName}{' '}
                      {appointmentToComplete.fileNumber && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (File #{appointmentToComplete.fileNumber})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Doctor:</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {appointmentToComplete.doctor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400 font-medium">Service / Treatment:</span>
                    <span className="text-xs font-bold text-[#0d6157] dark:text-teal-300">
                      {appointmentToComplete.department}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Standard Price:</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      SAR {basePrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Discount Mode Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Doctor Discount:
                    </label>
                    <div className="inline-flex rounded-[8px] border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('AMOUNT');
                          setDiscountValue(0);
                        }}
                        className={`px-2.5 py-1 rounded-[8px] transition-all cursor-pointer ${
                          discountType === 'AMOUNT'
                            ? 'bg-white dark:bg-slate-700 text-[#0d6157] dark:text-teal-300 shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Fixed SAR (﷼)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('PERCENT');
                          setDiscountValue(0);
                        }}
                        className={`px-2.5 py-1 rounded-[8px] transition-all cursor-pointer ${
                          discountType === 'PERCENT'
                            ? 'bg-white dark:bg-slate-700 text-[#0d6157] dark:text-teal-300 shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Percentage (%)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={discountType === 'PERCENT' ? 100 : basePrice}
                      step={discountType === 'PERCENT' ? 1 : 0.5}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder={discountType === 'PERCENT' ? 'e.g. 20 (for 20%)' : 'e.g. 50 (for 50 SAR)'}
                      className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                      {discountType === 'PERCENT' ? '%' : 'SAR'}
                    </div>
                  </div>

                  {/* Preset Discount Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Select:</span>
                    {[
                      { label: 'No Discount', type: 'AMOUNT' as const, val: 0 },
                      { label: '5%', type: 'PERCENT' as const, val: 5 },
                      { label: '10%', type: 'PERCENT' as const, val: 10 },
                      { label: '15%', type: 'PERCENT' as const, val: 15 },
                      { label: '20%', type: 'PERCENT' as const, val: 20 },
                      { label: '50 SAR', type: 'AMOUNT' as const, val: 50 },
                      { label: '100 SAR', type: 'AMOUNT' as const, val: 100 },
                      { label: '100% Free', type: 'PERCENT' as const, val: 100 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setDiscountType(chip.type);
                          setDiscountValue(chip.val);
                        }}
                        className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold transition-all cursor-pointer border ${
                          discountType === chip.type && discountValue === chip.val
                            ? 'bg-[#0d6157] text-white border-[#0d6157]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Preview Box */}
                <div className="p-4 rounded-[8px] bg-gradient-to-br from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-semibold">SAR {basePrice.toFixed(2)}</span>
                  </div>
                  {computedDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                      <span>Doctor Discount Applied:</span>
                      <span className="font-bold">
                        - SAR {computedDiscount.toFixed(2)}{' '}
                        {discountType === 'PERCENT' ? `(${discountValue}%)` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Final Payable Amount:
                    </span>
                    <span className="text-base font-extrabold text-[#0d6157] dark:text-teal-300">
                      SAR {finalPayable.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Clinical Notes / Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Concession Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="e.g. VIP Family Courtesy / Follow-up Concession"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157]"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCompleteModalOpen(false)}
                    disabled={isCompleting}
                    className="px-4 py-2 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCompleting}
                    className="px-5 py-2.5 rounded-[8px] bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs shadow-md shadow-teal-900/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCompleting ? (
                      <>
                        <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating Invoice...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>
                          Complete &amp; Issue Invoice (SAR {finalPayable.toFixed(2)})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
