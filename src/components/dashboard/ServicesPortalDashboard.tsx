'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  LayoutGrid,
  List,
  Plus,
  X,
  Edit2,
  Trash2,
  Stethoscope,
  Calendar,
  Save,
  Check,
  ChevronDown,
} from 'lucide-react';

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number | null;
  priceMinor: number | null;
  currency: string | null;
  isActive: boolean;
  doctors: Array<{ doctor: { id: string; name: string } }>;
  appointmentsCount: number;
}

export interface ServicesPortalDashboardProps {
  clinicName?: string;
  timezone?: string;
  initialServices?: ServiceItem[];
  availableDoctors?: Array<{ id: string; name: string }>;
}

export function ServicesPortalDashboard({
  clinicName = 'Clinic',
  timezone = 'Asia/Riyadh',
  initialServices = [],
  availableDoctors = [],
}: ServicesPortalDashboardProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);

  useEffect(() => {
    if (initialServices && initialServices.length > 0) {
      setServices(initialServices);
    }
  }, [initialServices]);

  // Toolbar & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [isDoctorsDropdownOpen, setIsDoctorsDropdownOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const doctorsDropdownRef = useRef<HTMLDivElement>(null);

  // Outside Click Listener for Doctors Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (doctorsDropdownRef.current && !doctorsDropdownRef.current.contains(event.target as Node)) {
        setIsDoctorsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Doctors for Multi-Select Dropdown
  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) return availableDoctors;
    const q = doctorSearch.toLowerCase();
    return availableDoctors.filter((d) => d.name.toLowerCase().includes(q));
  }, [availableDoctors, doctorSearch]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      if (selectedStatus === 'ACTIVE' && !srv.isActive) return false;
      if (selectedStatus === 'INACTIVE' && srv.isActive) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = srv.name.toLowerCase().includes(q);
        const matchesDesc = srv.description ? srv.description.toLowerCase().includes(q) : false;
        const matchesDoctor = srv.doctors.some((d) => d.doctor.name.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesDoctor) return false;
      }
      return true;
    });
  }, [services, selectedStatus, searchQuery]);

  // Live Counts
  const totalServicesCount = services.length;
  const activeServicesCount = services.filter((s) => s.isActive).length;
  const totalDoctorAssignments = new Set(services.flatMap((s) => s.doctors.map((d) => d.doctor.id))).size;
  const totalAppointments = services.reduce((acc, s) => acc + s.appointmentsCount, 0);

  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setName('');
    setDescription('');
    setDurationMinutes(30);
    setBufferMinutes(0);
    setIsActive(true);
    setSelectedDoctorIds([]);
    setIsDoctorsDropdownOpen(false);
    setDoctorSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (srv: ServiceItem) => {
    setEditingServiceId(srv.id);
    setName(srv.name);
    setDescription(srv.description || '');
    setDurationMinutes(srv.durationMinutes);
    setBufferMinutes(srv.bufferMinutes || 0);
    setIsActive(srv.isActive);
    setSelectedDoctorIds(srv.doctors.map((d) => d.doctor.id));
    setIsDoctorsDropdownOpen(false);
    setDoctorSearch('');
    setIsModalOpen(true);
  };

  // Toggle Active Status
  const handleToggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = !currentStatus;

    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: newStatus } : s))
    );

    const srv = services.find((s) => s.id === id);
    if (!srv) return;

    try {
      await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: srv.name,
          description: srv.description,
          durationMinutes: srv.durationMinutes,
          bufferMinutes: srv.bufferMinutes,
          isActive: newStatus,
          doctorIds: srv.doctors.map((d) => d.doctor.id),
        }),
      });
    } catch (err) {
      console.error('Failed to update service status:', err);
    }
  };

  // Save Service (Create or Update)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      durationMinutes: Number(durationMinutes),
      bufferMinutes: Number(bufferMinutes),
      isActive,
      doctorIds: selectedDoctorIds,
    };

    try {
      if (editingServiceId) {
        // Update
        const res = await fetch(`/api/services/${editingServiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok && data.service) {
          setServices((prev) =>
            prev.map((s) =>
              s.id === editingServiceId
                ? {
                    ...s,
                    name: data.service.name,
                    description: data.service.description,
                    durationMinutes: data.service.durationMinutes,
                    bufferMinutes: data.service.bufferMinutes,
                    isActive: data.service.isActive,
                    doctors: availableDoctors
                      .filter((d) => selectedDoctorIds.includes(d.id))
                      .map((d) => ({ doctor: d })),
                  }
                : s
            )
          );
          setIsModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok && data.service) {
          const newSrv: ServiceItem = {
            id: data.service.id,
            name: data.service.name,
            description: data.service.description,
            durationMinutes: data.service.durationMinutes,
            bufferMinutes: data.service.bufferMinutes,
            priceMinor: data.service.priceMinor,
            currency: data.service.currency,
            isActive: data.service.isActive,
            doctors: availableDoctors
              .filter((d) => selectedDoctorIds.includes(d.id))
              .map((d) => ({ doctor: d })),
            appointmentsCount: 0,
          };
          setServices([newSrv, ...services]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Service Handlers (with modal confirmation)
  const promptDeleteService = (srv: ServiceItem) => {
    setServiceToDelete(srv);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    const idToDelete = serviceToDelete.id;

    try {
      await fetch(`/api/services/${idToDelete}`, { method: 'DELETE' });
      setServices((prev) => prev.filter((s) => s.id !== idToDelete));
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (err) {
      console.error('Failed to delete service:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Clinic Services &amp; Treatments
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Manage medical and cosmetic treatments offered at{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span> ({timezone}).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Services */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Total Services
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalServicesCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-purple-100 dark:border-purple-900/50 inline-block">
                Catalog offerings
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-purple-50/80 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center shrink-0 border border-purple-100/70 dark:border-purple-900/50 shadow-2xs">
            <Tag className="size-4" />
          </div>
        </div>

        {/* Card 2: Active on WhatsApp */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Active on WhatsApp
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {activeServicesCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Offered to patients
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        {/* Card 3: Assigned Doctors */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Assigned Doctors
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalDoctorAssignments}
            </div>
            <div className="pt-0.5">
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-100 dark:border-blue-900/50 inline-block">
                Specialists linked
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100/70 dark:border-blue-900/50 shadow-2xs">
            <Stethoscope className="size-4" />
          </div>
        </div>

        {/* Card 4: Total Appointments */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Total Bookings
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalAppointments}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Historical &amp; upcoming
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Calendar className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: TOOLBAR & TABLE / CARDS */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top Toolbar */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-72 sm:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search services, doctors, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[8px] flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-[8px] flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <List className="size-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: GRID CARDS VIEW */}
        {viewMode === 'grid' ? (
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/40 dark:bg-slate-950/40 min-h-0">
            {filteredServices.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium">
                No services matching selected filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 rounded-[8px] p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {srv.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {srv.description || 'No description provided.'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(srv.id, srv.isActive, e)}
                          className={`px-2 py-0.5 rounded-[8px] text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                            srv.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {srv.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Duration:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                            {srv.durationMinutes} mins
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Assigned Doctors:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {srv.doctors.length} Doctors
                          </span>
                        </div>

                        {/* Doctors badges */}
                        {srv.doctors.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {srv.doctors.map((d) => (
                              <span
                                key={d.doctor.id}
                                className="px-1.5 py-0.2 rounded-[6px] text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-100"
                              >
                                {d.doctor.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(srv)}
                        className="px-2.5 py-1 rounded-[8px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="size-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeleteService(srv)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: TABLE LIST VIEW */
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                <tr className="divide-x divide-slate-200 dark:divide-slate-700/60">
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    SERVICE NAME
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    STATUS
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                    DURATION
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    ASSIGNED DOCTORS
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium text-xs">
                      No services found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((srv) => (
                    <tr
                      key={srv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group divide-x divide-slate-100 dark:divide-slate-800/60"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {srv.name}
                        </div>
                        {srv.description && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-sm">
                            {srv.description}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(srv.id, srv.isActive, e)}
                          className={`px-2 py-0.5 rounded-[8px] text-[11px] font-bold border transition-all cursor-pointer ${
                            srv.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {srv.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                        {srv.durationMinutes} mins
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {srv.doctors.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No doctors assigned</span>
                          ) : (
                            srv.doctors.map((d) => (
                              <span
                                key={d.doctor.id}
                                className="px-1.5 py-0.2 rounded-[6px] text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-100"
                              >
                                {d.doctor.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(srv)}
                            className="px-2.5 py-1 rounded-[8px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="size-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDeleteService(srv)}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Delete Service"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL: ADD / EDIT SERVICE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] shadow-xl max-w-lg w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="size-4 text-purple-600" />
                <span>{editingServiceId ? 'Edit Service' : 'Add New Service'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable fields section */}
              <div className="space-y-3.5 pt-3 overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Service / Treatment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laser Genesis &amp; Skin Tightening"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Standard Duration *
                    </label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Buffer Gap (Minutes)
                    </label>
                    <select
                      value={bufferMinutes}
                      onChange={(e) => setBufferMinutes(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value={0}>0 minutes (No gap)</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Service Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Clinical purpose, patient preparations, or instructions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              </div>

              {/* Practitioners dropdown — OUTSIDE overflow-y-auto so panel is never clipped */}
              {availableDoctors.length > 0 && (
                <div ref={doctorsDropdownRef} className="relative mt-3.5 shrink-0">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Assigned Practitioners (Doctors who perform this) ({selectedDoctorIds.length})
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsDoctorsDropdownOpen(!isDoctorsDropdownOpen)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <span className="flex items-center gap-2 truncate text-slate-500 dark:text-slate-400">
                      <Search className="size-3.5 text-slate-400 shrink-0" />
                      <span className={selectedDoctorIds.length > 0 ? 'text-slate-900 dark:text-white font-medium' : ''}>
                        {selectedDoctorIds.length === 0
                          ? 'Select or search doctors...'
                          : `${selectedDoctorIds.length} doctor${selectedDoctorIds.length > 1 ? 's' : ''} selected`}
                      </span>
                    </span>
                    <ChevronDown className="size-3.5 text-slate-400 shrink-0 ml-1" />
                  </button>

                  {isDoctorsDropdownOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-2xl z-[200] p-2.5 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search doctors..."
                          value={doctorSearch}
                          onChange={(e) => setDoctorSearch(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8 pr-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1 pt-1">
                        {filteredDoctors.length === 0 ? (
                          <p className="text-xs text-slate-400 italic p-2 text-center">No doctors found.</p>
                        ) : (
                          filteredDoctors.map((doc) => {
                            const checked = selectedDoctorIds.includes(doc.id);
                            return (
                              <div
                                key={doc.id}
                                onClick={() => {
                                  if (checked) {
                                    setSelectedDoctorIds(selectedDoctorIds.filter((id) => id !== doc.id));
                                  } else {
                                    setSelectedDoctorIds([...selectedDoctorIds, doc.id]);
                                  }
                                }}
                                className={`flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-colors ${
                                  checked
                                    ? 'bg-blue-50/80 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`size-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                      checked
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-500/20'
                                        : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                    }`}
                                  >
                                    {checked && <Check className="size-2.5 stroke-[3]" />}
                                  </div>
                                  <span className="text-xs truncate">{doc.name}</span>
                                </div>
                                {checked && <Check className="size-3.5 text-blue-600 shrink-0" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingServiceId ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: CONFIRM DELETE SERVICE */}
      {isDeleteModalOpen && serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-xl max-w-sm w-full p-5 relative text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Service &amp; Treatment
                </h3>
                <p className="text-[11px] text-slate-400">Permanently remove from catalog</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">&ldquo;{serviceToDelete.name}&rdquo;</span>? This will remove this treatment offering from the clinic catalog, automated WhatsApp booking, and unassign it from all specialists.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setServiceToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteService}
                className="px-4 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Delete Service</span>
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
