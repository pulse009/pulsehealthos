'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LuStethoscope as Stethoscope,
  LuActivity as Activity,
  LuHeartPulse as HeartPulse,
  LuFileText as FileText,
  LuPill as Pill,
  LuFlaskConical as FlaskConical,
  LuSave as Save,
  LuPrinter as Printer,
  LuCircleCheck as CheckCircle2,
  LuTriangleAlert as AlertTriangle,
  LuArrowLeft as ArrowLeft,
  LuClock as Clock,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuPhone as Phone,
  LuRefreshCw as RefreshCw,
  LuShieldAlert as ShieldAlert,
  LuSearch as Search,
  LuUpload as Upload,
  LuPencil as Edit3,
  LuExternalLink as ExternalLink,
  LuCheck as Check,
  LuX as X,
  LuBuilding2 as Building2,
  LuLayers as Layers,
} from 'react-icons/lu';

export interface PrescriptionEntry {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface LabOrderEntry {
  id: string;
  catalogId?: string | null;
  testName: string;
  code?: string | null;
  category: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  fulfillmentLocation: 'IN_HOUSE' | 'EXTERNAL' | 'UNDECIDED';
  notes: string;
  price: number;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'RESULT_READY' | 'EXTERNAL_RESULT_UPLOADED' | 'REVIEWED' | 'COMPLETED' | 'CANCELLED';
  orderNumber?: string;
  externalReportUrl?: string | null;
  externalResultNotes?: string | null;
  externalResultDate?: string | null;
}

export interface LabCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  sampleType?: string;
  containerType?: string | null;
  price: number;
  isFavorite?: boolean;
  defaultPriority?: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  defaultFulfillment?: 'IN_HOUSE' | 'EXTERNAL' | 'UNDECIDED';
}

export interface ClinicalEncounterData {
  id: string;
  clinicId: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string | null;
  chiefComplaint?: string | null;
  hpi?: string | null;
  pastMedicalHistory?: string | null;
  allergies: string[];
  vitalsJson?: {
    bpSystolic?: number | string;
    bpDiastolic?: number | string;
    heartRate?: number | string;
    temperature?: number | string;
    spo2?: number | string;
    bloodSugar?: number | string;
    height?: number | string;
    weight?: number | string;
    bmi?: number | string;
    notes?: string;
  } | null;
  physicalExam?: {
    general?: string;
    cvs?: string;
    respiratory?: string;
    abdominal?: string;
    cns?: string;
    ent?: string;
    skin?: string;
    other?: string;
  } | null;
  primaryDiagnosis?: string | null;
  secondaryDiagnosis?: string | null;
  icd10Code?: string | null;
  clinicalNotes?: string | null;
  treatmentPlan?: string | null;
  patientAdvice?: string | null;
  followUpDays?: number | null;
  followUpDate?: string | null;
  prescriptionsJson?: PrescriptionEntry[] | null;
  labOrdersJson?: LabOrderEntry[] | null;
  patient: {
    id: string;
    name: string;
    phone: string;
    fileNumber?: number | null;
    gender?: string | null;
    tags?: string[];
  };
  doctor: {
    id: string;
    name: string;
    specialty?: string | null;
  };
  appointment?: {
    id: string;
    startsAt: string;
    service?: { name: string } | null;
  } | null;
}

interface ClinicalEncounterRoomViewProps {
  initialEncounter: ClinicalEncounterData;
  clinicName: string;
  previousEncounters: any[];
  pharmacyItems: { id: string; name: string; sku?: string | null; currentStock: number }[];
  userRole?: string;
}

const COMMON_DIAGNOSES = [
  { name: 'Upper Respiratory Tract Infection (URTI)', icd: 'J06.9' },
  { name: 'Essential Primary Hypertension', icd: 'I10' },
  { name: 'Type 2 Diabetes Mellitus', icd: 'E11.9' },
  { name: 'Acute Bronchitis', icd: 'J20.9' },
  { name: 'Gastroenteritis & Colitis', icd: 'A09' },
  { name: 'Acute Pharyngitis / Tonsillitis', icd: 'J02.9' },
  { name: 'Migraine / Tension Headache', icd: 'G43.9' },
  { name: 'Bronchial Asthma', icd: 'J45.9' },
  { name: 'Dermatitis / Eczema', icd: 'L30.9' },
  { name: 'Urinary Tract Infection (UTI)', icd: 'N39.0' },
  { name: 'Hyperlipidemia', icd: 'E78.5' },
];

const COMMON_LAB_TESTS = [
  { name: 'Complete Blood Count (CBC)', category: 'Hematology' },
  { name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry' },
  { name: 'HbA1c (Glycated Hemoglobin)', category: 'Biochemistry' },
  { name: 'Lipid Profile Panel', category: 'Biochemistry' },
  { name: 'Liver Function Test (LFT)', category: 'Biochemistry' },
  { name: 'Renal Function Test (BUN/Creatinine)', category: 'Biochemistry' },
  { name: 'Urine Routine & Microscopy', category: 'Pathology' },
  { name: 'Serum Electrolytes (Na, K, Cl)', category: 'Biochemistry' },
  { name: 'Chest X-Ray PA View', category: 'Radiology' },
  { name: '12-Lead ECG Resting', category: 'Cardiology' },
  { name: 'Abdominal Ultrasound', category: 'Radiology' },
];

export function ClinicalEncounterRoomView({
  initialEncounter,
  clinicName,
  previousEncounters,
  pharmacyItems,
  userRole = 'DOCTOR',
}: ClinicalEncounterRoomViewProps) {
  const router = useRouter();
  const [encounter, setEncounter] = useState<ClinicalEncounterData>(initialEncounter);
  const [activeTab, setActiveTab] = useState<'SOAP' | 'VITALS' | 'PRESCRIPTION' | 'LABS' | 'HISTORY'>('SOAP');
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showRequisitionPrintModal, setShowRequisitionPrintModal] = useState(false);

  // SOAP State
  const [chiefComplaint, setChiefComplaint] = useState(encounter.chiefComplaint || '');
  const [hpi, setHpi] = useState(encounter.hpi || '');
  const [pastMedicalHistory, setPastMedicalHistory] = useState(encounter.pastMedicalHistory || '');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(encounter.primaryDiagnosis || '');
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState(encounter.secondaryDiagnosis || '');
  const [icd10Code, setIcd10Code] = useState(encounter.icd10Code || '');
  const [clinicalNotes, setClinicalNotes] = useState(encounter.clinicalNotes || '');
  const [treatmentPlan, setTreatmentPlan] = useState(encounter.treatmentPlan || '');
  const [patientAdvice, setPatientAdvice] = useState(encounter.patientAdvice || '');
  const [followUpDays, setFollowUpDays] = useState<string>(encounter.followUpDays ? String(encounter.followUpDays) : '');

  // Physical Exam
  const [physicalExam, setPhysicalExam] = useState({
    general: encounter.physicalExam?.general || 'Conscious, oriented, no acute distress.',
    cvs: encounter.physicalExam?.cvs || 'S1 S2 heard, no murmurs.',
    respiratory: encounter.physicalExam?.respiratory || 'Bilateral air entry clear, no wheeze/creps.',
    abdominal: encounter.physicalExam?.abdominal || 'Soft, non-tender, no organomegaly.',
    cns: encounter.physicalExam?.cns || 'Grossly intact.',
    ent: encounter.physicalExam?.ent || 'Throat clear, ears normal.',
    skin: encounter.physicalExam?.skin || 'No rash or lesion.',
  });

  // Vitals State
  const [vitals, setVitals] = useState({
    bpSystolic: encounter.vitalsJson?.bpSystolic ? String(encounter.vitalsJson.bpSystolic) : '',
    bpDiastolic: encounter.vitalsJson?.bpDiastolic ? String(encounter.vitalsJson.bpDiastolic) : '',
    heartRate: encounter.vitalsJson?.heartRate ? String(encounter.vitalsJson.heartRate) : '',
    temperature: encounter.vitalsJson?.temperature ? String(encounter.vitalsJson.temperature) : '',
    spo2: encounter.vitalsJson?.spo2 ? String(encounter.vitalsJson.spo2) : '',
    bloodSugar: encounter.vitalsJson?.bloodSugar ? String(encounter.vitalsJson.bloodSugar) : '',
    height: encounter.vitalsJson?.height ? String(encounter.vitalsJson.height) : '',
    weight: encounter.vitalsJson?.weight ? String(encounter.vitalsJson.weight) : '',
    notes: encounter.vitalsJson?.notes || '',
  });

  // Calculated BMI
  const calculatedBMI = useMemo(() => {
    const h = parseFloat(vitals.height) / 100;
    const w = parseFloat(vitals.weight);
    if (h > 0 && w > 0) return (w / (h * h)).toFixed(1);
    return null;
  }, [vitals.height, vitals.weight]);

  // Prescriptions List
  const [prescriptions, setPrescriptions] = useState<PrescriptionEntry[]>(
    encounter.prescriptionsJson || []
  );
  const [newRx, setNewRx] = useState({
    medicineName: '',
    dosage: '500 mg',
    frequency: '1-0-1 (Twice Daily)',
    duration: '5 Days',
    route: 'Oral',
    instructions: 'After meals with water',
  });

  // ─── Lab Orders & Investigation Catalog State ───
  const [labOrders, setLabOrders] = useState<LabOrderEntry[]>(
    (encounter.labOrdersJson || []).map((l: any) => ({
      id: l.id || String(Date.now() + Math.random()),
      catalogId: l.catalogId || null,
      testName: l.testName,
      code: l.code || null,
      category: l.category || 'Biochemistry',
      priority: l.priority || 'ROUTINE',
      fulfillmentLocation: l.fulfillmentLocation || 'IN_HOUSE',
      notes: l.notes || l.clinicalNotes || 'Routine investigation',
      price: typeof l.price === 'number' ? l.price : 0,
      status: l.status || 'ORDERED',
      orderNumber: l.orderNumber,
      externalReportUrl: l.externalReportUrl || null,
      externalResultNotes: l.externalResultNotes || null,
      externalResultDate: l.externalResultDate || null,
    }))
  );

  const [catalogTests, setCatalogTests] = useState<LabCatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Duplicate Warning
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [pendingDuplicateItem, setPendingDuplicateItem] = useState<LabCatalogItem | null>(null);

  // Custom Investigation Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTestForm, setCustomTestForm] = useState({
    name: '',
    category: 'Biochemistry',
    notes: 'Routine clinical check',
    priority: 'ROUTINE' as 'ROUTINE' | 'URGENT' | 'STAT',
    fulfillmentLocation: 'IN_HOUSE' as 'IN_HOUSE' | 'EXTERNAL' | 'UNDECIDED',
    price: '50',
    saveToCatalog: true,
  });

  // Edit Existing Order Modal
  const [editingLabOrder, setEditingLabOrder] = useState<LabOrderEntry | null>(null);

  // External Result Upload Modal
  const [selectedExternalOrder, setSelectedExternalOrder] = useState<LabOrderEntry | null>(null);
  const [externalUploadForm, setExternalUploadForm] = useState({
    externalReportUrl: '',
    externalResultNotes: '',
    externalResultDate: new Date().toISOString().split('T')[0],
    markReviewed: true,
    isSubmitting: false,
  });

  // Fetch Clinic Investigation Catalog on Mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCatalog(true);
    fetch('/api/lab/tests')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load investigation catalog');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setCatalogTests(data.tests || []);
      })
      .catch((err) => {
        console.error('Error fetching lab catalog:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCatalog(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered Catalog Items for Search
  const filteredCatalogItems = useMemo(() => {
    return catalogTests.filter((item) => {
      const matchCat = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter;
      const q = catalogSearchQuery.trim().toLowerCase();
      if (!q) return matchCat;
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [catalogTests, catalogSearchQuery, selectedCategoryFilter]);

  // Favorite Quick Select Chips
  const favoriteCatalogItems = useMemo(() => {
    const favorites = catalogTests.filter((t) => t.isFavorite);
    return favorites.length > 0 ? favorites : catalogTests.slice(0, 11);
  }, [catalogTests]);

  // Save changes
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/encounters/${encounter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint,
          hpi,
          pastMedicalHistory,
          primaryDiagnosis,
          secondaryDiagnosis,
          icd10Code,
          clinicalNotes,
          treatmentPlan,
          patientAdvice,
          followUpDays: followUpDays ? parseInt(followUpDays) : null,
          physicalExam,
          vitalsJson: {
            ...vitals,
            bmi: calculatedBMI,
          },
          prescriptionsJson: prescriptions,
          labOrdersJson: labOrders,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error(err);
      alert('Error saving encounter.');
    } finally {
      setIsSaving(false);
    }
  };

  // Complete and finalize
  const handleCompleteEncounter = async () => {
    if (!primaryDiagnosis.trim()) {
      alert('Please enter or select a Primary Diagnosis before finalizing the encounter.');
      setActiveTab('SOAP');
      return;
    }

    if (!confirm('Finalize this clinical encounter and mark appointment completed?')) return;

    setIsCompleting(true);
    try {
      await fetch(`/api/encounters/${encounter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint,
          hpi,
          pastMedicalHistory,
          primaryDiagnosis,
          secondaryDiagnosis,
          icd10Code,
          clinicalNotes,
          treatmentPlan,
          patientAdvice,
          followUpDays: followUpDays ? parseInt(followUpDays) : null,
          physicalExam,
          vitalsJson: { ...vitals, bmi: calculatedBMI },
          prescriptionsJson: prescriptions,
          labOrdersJson: labOrders,
        }),
      });

      const res = await fetch(`/api/encounters/${encounter.id}/complete`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to complete');
      const data = await res.json();
      setEncounter(data.encounter);
      alert('Encounter completed successfully!');
      router.push('/portal/consultations');
    } catch (err) {
      console.error(err);
      alert('Error completing encounter.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAddPrescription = () => {
    if (!newRx.medicineName.trim()) return;
    const item: PrescriptionEntry = {
      id: String(Date.now()),
      medicineName: newRx.medicineName.trim(),
      dosage: newRx.dosage,
      frequency: newRx.frequency,
      duration: newRx.duration,
      route: newRx.route,
      instructions: newRx.instructions,
    };
    setPrescriptions([...prescriptions, item]);
    setNewRx({
      medicineName: '',
      dosage: '500 mg',
      frequency: '1-0-1 (Twice Daily)',
      duration: '5 Days',
      route: 'Oral',
      instructions: 'After meals with water',
    });
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  // ─── Adding Lab Orders (with Duplicate Prevention) ───
  const handleAddCatalogItemToOrder = (catalogItem: LabCatalogItem, forceAdd = false) => {
    const isDuplicate = labOrders.some(
      (o) => o.testName.toLowerCase() === catalogItem.name.toLowerCase()
    );

    if (isDuplicate && !forceAdd) {
      setDuplicateWarning(`"${catalogItem.name}" is already in the order list.`);
      setPendingDuplicateItem(catalogItem);
      return;
    }

    setDuplicateWarning(null);
    setPendingDuplicateItem(null);

    const priorityVal: 'ROUTINE' | 'URGENT' | 'STAT' =
      catalogItem.defaultPriority === 'STAT_EMERGENCY'
        ? 'STAT'
        : catalogItem.defaultPriority || 'ROUTINE';

    const newOrder: LabOrderEntry = {
      id: String(Date.now() + Math.random()),
      catalogId: catalogItem.id,
      testName: catalogItem.name,
      code: catalogItem.code,
      category: catalogItem.category,
      priority: priorityVal,
      fulfillmentLocation: catalogItem.defaultFulfillment || 'IN_HOUSE',
      notes: catalogItem.description || 'Routine investigation',
      price: catalogItem.price || 0,
      status: 'ORDERED',
    };

    setLabOrders([...labOrders, newOrder]);
    setCatalogSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  const handleAddCustomInvestigation = async () => {
    if (!customTestForm.name.trim()) return;
    const trimmedName = customTestForm.name.trim();

    // Check duplicate
    const isDuplicate = labOrders.some(
      (o) => o.testName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      if (!confirm(`An investigation named "${trimmedName}" is already in this order. Add another copy anyway?`)) {
        return;
      }
    }

    const priceNum = parseFloat(customTestForm.price) || 0;

    // Optional: Save to Clinic Catalog if user chose to and has permission
    let newCatalogId: string | null = null;
    const canManageCatalog = ['SUPER_ADMIN', 'CLIENT', 'DOCTOR', 'MANAGER', 'PATHOLOGIST'].includes(userRole);

    if (customTestForm.saveToCatalog && canManageCatalog) {
      try {
        const catRes = await fetch('/api/lab/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            category: customTestForm.category,
            description: customTestForm.notes,
            price: priceNum,
            defaultPriority: customTestForm.priority === 'STAT' ? 'STAT_EMERGENCY' : customTestForm.priority,
            defaultFulfillment: customTestForm.fulfillmentLocation,
            isFavorite: false,
          }),
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.test) {
            newCatalogId = catData.test.id;
            setCatalogTests((prev) => [...prev, catData.test]);
          }
        }
      } catch (e) {
        console.error('Failed to save custom investigation to catalog:', e);
      }
    }

    const newOrder: LabOrderEntry = {
      id: String(Date.now() + Math.random()),
      catalogId: newCatalogId,
      testName: trimmedName,
      category: customTestForm.category,
      priority: customTestForm.priority,
      fulfillmentLocation: customTestForm.fulfillmentLocation,
      notes: customTestForm.notes || 'Clinical investigation',
      price: priceNum,
      status: 'ORDERED',
    };

    setLabOrders([...labOrders, newOrder]);
    setIsCustomModalOpen(false);
    setCustomTestForm({
      name: '',
      category: 'Biochemistry',
      notes: 'Routine clinical check',
      priority: 'ROUTINE',
      fulfillmentLocation: 'IN_HOUSE',
      price: '50',
      saveToCatalog: true,
    });
  };

  const handleUpdateLabOrder = (updated: LabOrderEntry) => {
    setLabOrders(labOrders.map((o) => (o.id === updated.id ? updated : o)));
    setEditingLabOrder(null);
  };

  const handleRemoveLabOrder = (id: string) => {
    setLabOrders(labOrders.filter((l) => l.id !== id));
  };

  const handleUploadExternalResult = async () => {
    if (!selectedExternalOrder) return;
    setExternalUploadForm((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // If the order exists in database, call API
      if (selectedExternalOrder.id && !selectedExternalOrder.id.includes('.')) {
        await fetch(`/api/lab/orders/${selectedExternalOrder.id}/external-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalReportUrl: externalUploadForm.externalReportUrl.trim(),
            externalResultNotes: externalUploadForm.externalResultNotes.trim(),
            externalResultDate: externalUploadForm.externalResultDate,
            markReviewed: externalUploadForm.markReviewed,
          }),
        });
      }

      // Update local state
      setLabOrders((prev) =>
        prev.map((o) => {
          if (o.id === selectedExternalOrder.id) {
            return {
              ...o,
              externalReportUrl: externalUploadForm.externalReportUrl.trim(),
              externalResultNotes: externalUploadForm.externalResultNotes.trim(),
              externalResultDate: externalUploadForm.externalResultDate,
              status: externalUploadForm.markReviewed ? 'REVIEWED' : 'EXTERNAL_RESULT_UPLOADED',
            };
          }
          return o;
        })
      );

      setSelectedExternalOrder(null);
      alert('External result recorded successfully!');
    } catch (err) {
      console.error(err);
      alert('Error recording external result.');
    } finally {
      setExternalUploadForm((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/consultations"
            className="p-1.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Back to queue"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              <span>{clinicName}</span>
              <span>•</span>
              <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Clinical Encounter Room</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
              <span>{encounter.patient.name}</span>
              {encounter.patient.fileNumber && (
                <span className="font-mono text-xs font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/20 px-2 py-0.5 rounded-[6px] border border-[#0d8276]/20">
                  File #{encounter.patient.fileNumber}
                </span>
              )}
              {encounter.status === 'COMPLETED' ? (
                <span className="text-[10px] px-2 py-0.5 rounded-[6px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-[6px] font-bold bg-[#e6f6f3] text-[#0d5c56] border border-[#0d8276]/20 animate-pulse">
                  In Consultation
                </span>
              )}
            </h1>
            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Doctor: <span className="font-semibold text-slate-700 dark:text-slate-200">Dr. {encounter.doctor.name}</span> • Phone: {encounter.patient.phone}
              {lastSavedTime && <span className="text-slate-400"> • Saved {lastSavedTime}</span>}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowRequisitionPrintModal(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer"
            title="Print laboratory and diagnostic requisition"
          >
            <FlaskConical className="size-3.5 text-[#0d6157]" />
            <span>Print Lab Requisition</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>Print Rx Slip</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer"
          >
            {isSaving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>Save Draft</span>
          </button>

          {encounter.status !== 'COMPLETED' && (
            <button
              onClick={handleCompleteEncounter}
              disabled={isCompleting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-2xs transition-colors cursor-pointer"
            >
              {isCompleting ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              <span>Finalize &amp; Sign</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Allergy Strip (if present) */}
      {encounter.allergies && encounter.allergies.length > 0 && (
        <div className="px-6 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 shrink-0">
          <ShieldAlert className="size-4 text-rose-600 shrink-0" />
          <strong className="text-[11px] uppercase tracking-wider">Allergy Alert:</strong>
          <div className="flex flex-wrap gap-1.5">
            {encounter.allergies.map((a) => (
              <span key={a} className="px-2 py-0.5 rounded-[6px] bg-white dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 border border-rose-200 text-[10px] font-bold">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. SEGMENTED TABS ROW */}
      <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {[
          { id: 'SOAP', label: 'SOAP Notes & Diagnosis', icon: FileText },
          { id: 'VITALS', label: 'Triage & Vitals', icon: HeartPulse },
          { id: 'PRESCRIPTION', label: `e-Prescriptions (${prescriptions.length})`, icon: Pill },
          { id: 'LABS', label: `Lab Orders (${labOrders.length})`, icon: FlaskConical },
          { id: 'HISTORY', label: `Past Visits (${previousEncounters.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0d6157] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950">
        
        {/* ─── TAB 1: SOAP CLINICAL NOTES ─── */}
        {activeTab === 'SOAP' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left 2 Cols: Subjective, Objective, Plan */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Subjective */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="size-5 rounded bg-[#e6f6f3] text-[#0d5c56] font-bold text-[11px] flex items-center justify-center">S</span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Subjective (Patient Symptoms &amp; History)</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chief Complaint *
                    </label>
                    <input
                      type="text"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Fever for 3 days, dry cough, sore throat..."
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      History of Presenting Illness (HPI)
                    </label>
                    <textarea
                      rows={2}
                      value={hpi}
                      onChange={(e) => setHpi(e.target.value)}
                      placeholder="Onset, character, duration, aggravating factors..."
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Past Medical &amp; Surgical History
                    </label>
                    <input
                      type="text"
                      value={pastMedicalHistory}
                      onChange={(e) => setPastMedicalHistory(e.target.value)}
                      placeholder="e.g. Hypertension (5 yrs), Diabetes (2 yrs)..."
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                    />
                  </div>
                </div>
              </div>

              {/* Objective (Physical Exam) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="size-5 rounded bg-[#e6f6f3] text-[#0d5c56] font-bold text-[11px] flex items-center justify-center">O</span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Objective (Physical Examination)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">General Appearance</label>
                    <input
                      type="text"
                      value={physicalExam.general}
                      onChange={(e) => setPhysicalExam({ ...physicalExam, general: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Cardiovascular (CVS)</label>
                    <input
                      type="text"
                      value={physicalExam.cvs}
                      onChange={(e) => setPhysicalExam({ ...physicalExam, cvs: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Respiratory System</label>
                    <input
                      type="text"
                      value={physicalExam.respiratory}
                      onChange={(e) => setPhysicalExam({ ...physicalExam, respiratory: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Abdomen / GI</label>
                    <input
                      type="text"
                      value={physicalExam.abdominal}
                      onChange={(e) => setPhysicalExam({ ...physicalExam, abdominal: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Plan */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="size-5 rounded bg-[#e6f6f3] text-[#0d5c56] font-bold text-[11px] flex items-center justify-center">P</span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Plan (Treatment &amp; Patient Advice)</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Treatment Plan &amp; Clinical Notes</label>
                    <textarea
                      rows={2}
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      placeholder="Doctor treatment instructions..."
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Dietary &amp; Lifestyle Advice</label>
                      <input
                        type="text"
                        value={patientAdvice}
                        onChange={(e) => setPatientAdvice(e.target.value)}
                        placeholder="e.g. Low sodium diet, 2L water daily..."
                        className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Follow-up Recommendation</label>
                      <select
                        value={followUpDays}
                        onChange={(e) => setFollowUpDays(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="">No scheduled follow-up (PRN)</option>
                        <option value="3">Follow-up in 3 Days</option>
                        <option value="5">Follow-up in 5 Days</option>
                        <option value="7">Follow-up in 1 Week (7 Days)</option>
                        <option value="14">Follow-up in 2 Weeks (14 Days)</option>
                        <option value="30">Follow-up in 1 Month (30 Days)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Col: Assessment & Diagnosis Picker */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="size-5 rounded bg-[#e6f6f3] text-[#0d5c56] font-bold text-[11px] flex items-center justify-center">A</span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Assessment &amp; Diagnosis</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={primaryDiagnosis}
                      onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                      placeholder="Enter or select diagnosis..."
                      className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">ICD-10 Code</label>
                      <input
                        type="text"
                        value={icd10Code}
                        onChange={(e) => setIcd10Code(e.target.value)}
                        placeholder="e.g. J06.9"
                        className="w-full px-2.5 py-1 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Secondary Diag.</label>
                      <input
                        type="text"
                        value={secondaryDiagnosis}
                        onChange={(e) => setSecondaryDiagnosis(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-2.5 py-1 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {/* Common Diagnosis Quick Chips */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Quick Clinical Templates:
                    </span>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {COMMON_DIAGNOSES.map((d) => (
                        <button
                          key={d.name}
                          onClick={() => {
                            setPrimaryDiagnosis(d.name);
                            setIcd10Code(d.icd);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[6px] bg-slate-50 hover:bg-[#e6f6f3] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-2 font-medium group-hover:text-[#0d6157]">{d.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">{d.icd}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB 2: TRIAGE & VITALS ─── */}
        {activeTab === 'VITALS' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Patient Vitals &amp; Clinical Measurements</h3>
              {calculatedBMI && (
                <span className="px-2 py-0.5 rounded bg-[#e6f6f3] text-[#0d5c56] text-xs font-bold">
                  BMI: {calculatedBMI}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Blood Pressure (Systolic / Diastolic)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="120"
                    value={vitals.bpSystolic}
                    onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={vitals.bpDiastolic}
                    onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  placeholder="75"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Oxygen Saturation (SpO2 %)</label>
                <input
                  type="number"
                  placeholder="98"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={vitals.bloodSugar}
                  onChange={(e) => setVitals({ ...vitals, bloodSugar: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Height (cm) / Weight (kg)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="175 cm"
                    value={vitals.height}
                    onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="70 kg"
                    value={vitals.weight}
                    onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: E-PRESCRIPTION ─── */}
        {activeTab === 'PRESCRIPTION' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Electronic Prescriptions (e-Rx)</h3>
            </div>

            {/* Form */}
            <div className="p-4 rounded-[8px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Medication Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin / Clavulanate, Paracetamol..."
                    value={newRx.medicineName}
                    onChange={(e) => setNewRx({ ...newRx, medicineName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="500 mg"
                    value={newRx.dosage}
                    onChange={(e) => setNewRx({ ...newRx, dosage: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frequency</label>
                  <select
                    value={newRx.frequency}
                    onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 text-xs"
                  >
                    <option>1-0-1 (Twice Daily)</option>
                    <option>1-1-1 (Thrice Daily)</option>
                    <option>1-0-0 (Once Daily - Morning)</option>
                    <option>0-0-1 (Once Daily - Night)</option>
                    <option>Every 6 Hours (Q6H)</option>
                    <option>PRN (As Needed / Sos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                  <select
                    value={newRx.duration}
                    onChange={(e) => setNewRx({ ...newRx, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 text-xs"
                  >
                    <option>3 Days</option>
                    <option>5 Days</option>
                    <option>7 Days (1 Week)</option>
                    <option>14 Days (2 Weeks)</option>
                    <option>30 Days (1 Month)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instructions</label>
                  <input
                    type="text"
                    placeholder="After meals with water"
                    value={newRx.instructions}
                    onChange={(e) => setNewRx({ ...newRx, instructions: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleAddPrescription}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-2xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add to Prescription</span>
                </button>
              </div>
            </div>

            {/* Prescriptions Table */}
            <div className="overflow-x-auto rounded-[8px] border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Dosage</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Instructions</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {prescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">No medications prescribed yet.</td>
                    </tr>
                  ) : (
                    prescriptions.map((rx, idx) => (
                      <tr key={rx.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{rx.medicineName}</td>
                        <td className="p-3">{rx.dosage}</td>
                        <td className="p-3 font-medium">{rx.frequency}</td>
                        <td className="p-3">{rx.duration}</td>
                        <td className="p-3 text-slate-500">{rx.instructions}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemovePrescription(rx.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ─── TAB 4: LABS & DIAGNOSTIC REQUISITIONS ─── */}
        {activeTab === 'LABS' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-5">
            
            {/* Header & Quick Requisition Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FlaskConical className="size-4 text-[#0d6157]" />
                  <span>Laboratory &amp; Diagnostic Requisitions</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Order in-house pathology, external lab investigations, and diagnostic imaging.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0d6157] bg-[#e6f6f3] hover:bg-[#d5efe9] dark:bg-[#0d6157]/20 dark:text-teal-300 dark:hover:bg-[#0d6157]/30 rounded-[8px] transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>+ Add Custom Investigation</span>
                </button>
              </div>
            </div>

            {/* Duplicate Warning Alert Banner */}
            {duplicateWarning && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-[8px] flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Duplicate Notice:</strong> {duplicateWarning}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pendingDuplicateItem && (
                    <button
                      onClick={() => handleAddCatalogItemToOrder(pendingDuplicateItem, true)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-[6px] text-[11px] cursor-pointer"
                    >
                      + Add Duplicate Anyway
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDuplicateWarning(null);
                      setPendingDuplicateItem(null);
                    }}
                    className="p-1 text-amber-700 hover:text-amber-900 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Search & Category Filter Section */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[10px] border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={(e) => {
                      setCatalogSearchQuery(e.target.value);
                      setIsSearchDropdownOpen(true);
                    }}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    placeholder="Search investigations by name, code, or category..."
                    className="w-full pl-9 pr-8 py-2 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157]"
                  />
                  {catalogSearchQuery && (
                    <button
                      onClick={() => {
                        setCatalogSearchQuery('');
                        setIsSearchDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}

                  {/* Search Results Dropdown */}
                  {isSearchDropdownOpen && catalogSearchQuery.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCatalogItems.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          <p>No catalog investigation matching &ldquo;{catalogSearchQuery}&rdquo;</p>
                          <button
                            onClick={() => {
                              setCustomTestForm((prev) => ({ ...prev, name: catalogSearchQuery.trim() }));
                              setIsCustomModalOpen(true);
                              setIsSearchDropdownOpen(false);
                            }}
                            className="mt-2 text-xs font-bold text-[#0d6157] hover:underline inline-flex items-center gap-1"
                          >
                            <Plus className="size-3" />
                            <span>+ Create &ldquo;{catalogSearchQuery}&rdquo; as Custom Investigation</span>
                          </button>
                        </div>
                      ) : (
                        filteredCatalogItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                            onClick={() => handleAddCatalogItemToOrder(item)}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#0d6157]">
                                  {item.name}
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                                  {item.code}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span className="text-[#0d5c56] font-medium">{item.category}</span>
                                {item.description && <span>• {item.description}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                SAR {item.price.toFixed(2)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddCatalogItemToOrder(item);
                                }}
                                className="px-2.5 py-1 bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[6px] text-xs font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <Plus className="size-3" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Category Pill Filters */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs shrink-0">
                  {['ALL', 'Hematology', 'Biochemistry', 'Microbiology', 'Imaging', 'Cardiology', 'Pathology'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        selectedCategoryFilter === cat
                          ? 'bg-[#0d6157] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Favorite / Common Quick Select Buttons */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Common Investigations (Quick Add):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {favoriteCatalogItems.map((t) => {
                    const isAlreadyAdded = labOrders.some(
                      (l) => l.testName.toLowerCase() === t.name.toLowerCase()
                    );
                    return (
                      <button
                        key={t.id || t.name}
                        onClick={() => handleAddCatalogItemToOrder(t)}
                        className={`px-2.5 py-1 rounded-[6px] border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAlreadyAdded
                            ? 'bg-[#e6f6f3] dark:bg-[#0d6157]/20 border-[#0d8276]/30 text-[#0d5c56] dark:text-teal-300'
                            : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                        title={`Category: ${t.category} • Price: SAR ${t.price}`}
                      >
                        <Plus className="size-3 text-[#0d6157]" />
                        <span>{t.name}</span>
                        {isAlreadyAdded && (
                          <span className="size-1.5 rounded-full bg-[#0d6157]" title="Already in order list" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── Ordered Investigations Table ─── */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ordered Investigations ({labOrders.length})
                </span>
                {labOrders.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    Est. In-House Total: <strong className="text-slate-900 dark:text-white font-mono">
                      SAR {labOrders.filter(l => l.fulfillmentLocation === 'IN_HOUSE').reduce((acc, curr) => acc + (curr.price || 0), 0).toFixed(2)}
                    </strong>
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-[8px] border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Investigation Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Fulfillment</th>
                      <th className="p-3">Clinical Notes / Instructions</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {labOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                          No lab tests or diagnostic investigations ordered yet. Search the catalog above or click a quick-add chip.
                        </td>
                      </tr>
                    ) : (
                      labOrders.map((lab, idx) => {
                        const isExternal = lab.fulfillmentLocation === 'EXTERNAL';
                        const isUndecided = lab.fulfillmentLocation === 'UNDECIDED';
                        const isInHouse = lab.fulfillmentLocation === 'IN_HOUSE';

                        return (
                          <tr key={lab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>
                            
                            {/* Name & Code */}
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">{lab.testName}</div>
                              {lab.code && (
                                <span className="font-mono text-[10px] text-slate-400">{lab.code}</span>
                              )}
                            </td>

                            {/* Category */}
                            <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                              {lab.category}
                            </td>

                            {/* Priority Badge */}
                            <td className="p-3">
                              {lab.priority === 'STAT' || lab.priority === ('STAT_EMERGENCY' as any) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                                  <span>STAT</span>
                                </span>
                              ) : lab.priority === 'URGENT' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                  <span>URGENT</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                                  <span>ROUTINE</span>
                                </span>
                              )}
                            </td>

                            {/* Fulfillment Badge */}
                            <td className="p-3">
                              {isInHouse ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                                  <Building2 className="size-3" />
                                  <span>In-House Lab</span>
                                </span>
                              ) : isExternal ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
                                  <ExternalLink className="size-3" />
                                  <span>External Lab</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">
                                  <span>Decide Later</span>
                                </span>
                              )}
                            </td>

                            {/* Clinical Notes */}
                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={lab.notes}>
                              {lab.notes || <span className="text-slate-400 italic">No instructions</span>}
                            </td>

                            {/* Price */}
                            <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">
                              {isInHouse ? `SAR ${lab.price.toFixed(2)}` : <span className="text-slate-400">—</span>}
                            </td>

                            {/* Status */}
                            <td className="p-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  lab.status === 'COMPLETED' || lab.status === 'REVIEWED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : lab.status === 'EXTERNAL_RESULT_UPLOADED'
                                      ? 'bg-purple-100 text-purple-800'
                                      : lab.status === 'SAMPLE_COLLECTED' || lab.status === 'IN_PROGRESS'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {lab.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* External Result Upload Button */}
                                {isExternal && (
                                  <button
                                    onClick={() => {
                                      setSelectedExternalOrder(lab);
                                      setExternalUploadForm({
                                        externalReportUrl: lab.externalReportUrl || '',
                                        externalResultNotes: lab.externalResultNotes || '',
                                        externalResultDate: lab.externalResultDate
                                          ? new Date(lab.externalResultDate).toISOString().split('T')[0]
                                          : new Date().toISOString().split('T')[0],
                                        markReviewed: lab.status === 'REVIEWED',
                                        isSubmitting: false,
                                      });
                                    }}
                                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-[6px] text-[11px] font-bold flex items-center gap-1 border border-purple-200 cursor-pointer"
                                    title="Upload or view external diagnostic findings"
                                  >
                                    <Upload className="size-3" />
                                    <span>{lab.externalReportUrl || lab.externalResultNotes ? 'Result' : 'Upload'}</span>
                                  </button>
                                )}

                                {/* Edit Order Button */}
                                {encounter.status !== 'COMPLETED' && (
                                  <button
                                    onClick={() => setEditingLabOrder(lab)}
                                    className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    title="Edit test instructions / priority"
                                  >
                                    <Edit3 className="size-3.5" />
                                  </button>
                                )}

                                {/* Remove Button */}
                                {encounter.status !== 'COMPLETED' && (
                                  <button
                                    onClick={() => handleRemoveLabOrder(lab.id)}
                                    className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                                    title="Remove from encounter"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
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

          </div>
        )}

        {/* ─── TAB 5: HISTORY ─── */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Past Clinical Encounters &amp; Diagnostic History
            </h3>
            {previousEncounters.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No previous completed encounters recorded for this patient.</p>
            ) : (
              <div className="space-y-3">
                {previousEncounters.map((prev) => (
                  <div key={prev.id} className="p-4 rounded-[10px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>
                        {new Date(prev.completedAt || prev.startedAt).toLocaleDateString()} • Dr. {prev.doctor?.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">Completed</span>
                    </div>

                    <div>
                      <strong>Primary Diagnosis:</strong> {prev.primaryDiagnosis || 'N/A'}
                    </div>

                    {/* Past Prescriptions */}
                    {prev.prescriptionsJson && prev.prescriptionsJson.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold block text-slate-700 dark:text-slate-200">Prescribed Medications:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {prev.prescriptionsJson.map((rx: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 text-slate-700">
                              {rx.medicineName} ({rx.dosage})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Lab Orders */}
                    {prev.labOrdersJson && prev.labOrdersJson.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-bold block text-slate-700 dark:text-slate-200">Ordered Investigations:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {prev.labOrdersJson.map((lo: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 text-slate-700 flex items-center gap-1">
                              <FlaskConical className="size-3 text-[#0d6157]" />
                              <span>{lo.testName}</span>
                              <span className="text-[10px] text-slate-400">({lo.fulfillmentLocation || 'IN_HOUSE'})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── MODAL 1: ADD CUSTOM INVESTIGATION ─── */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-5 text-[#0d6157]" />
                <h3 className="text-sm font-bold">Add Custom Investigation</h3>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Investigation Name *
                </label>
                <input
                  type="text"
                  value={customTestForm.name}
                  onChange={(e) => setCustomTestForm({ ...customTestForm, name: e.target.value })}
                  placeholder="e.g. Serum Ferritin, Thyroid Antibodies, 24h Holter..."
                  className="w-full px-3 py-2 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={customTestForm.category}
                    onChange={(e) => setCustomTestForm({ ...customTestForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Imaging">Imaging / Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Immunology">Immunology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority *
                  </label>
                  <select
                    value={customTestForm.priority}
                    onChange={(e) => setCustomTestForm({ ...customTestForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">STAT / Emergency</option>
                  </select>
                </div>
              </div>

              {/* Fulfillment Location */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fulfillment Location *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomTestForm({ ...customTestForm, fulfillmentLocation: 'IN_HOUSE' })}
                    className={`p-2 rounded-[8px] border text-center transition-all cursor-pointer ${
                      customTestForm.fulfillmentLocation === 'IN_HOUSE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px]">In-House Lab</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Route to clinic lab</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomTestForm({ ...customTestForm, fulfillmentLocation: 'EXTERNAL' })}
                    className={`p-2 rounded-[8px] border text-center transition-all cursor-pointer ${
                      customTestForm.fulfillmentLocation === 'EXTERNAL'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px]">External Lab</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Patient goes outside</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomTestForm({ ...customTestForm, fulfillmentLocation: 'UNDECIDED' })}
                    className={`p-2 rounded-[8px] border text-center transition-all cursor-pointer ${
                      customTestForm.fulfillmentLocation === 'UNDECIDED'
                        ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold dark:bg-slate-700 dark:text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px]">Decide Later</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Clinical order only</div>
                  </button>
                </div>
              </div>

              {/* Price (if in house) */}
              {customTestForm.fulfillmentLocation === 'IN_HOUSE' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Price (SAR)
                  </label>
                  <input
                    type="number"
                    value={customTestForm.price}
                    onChange={(e) => setCustomTestForm({ ...customTestForm, price: e.target.value })}
                    placeholder="50.00"
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Clinical Notes / Instructions */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Instructions / Notes for Laboratory
                </label>
                <textarea
                  value={customTestForm.notes}
                  onChange={(e) => setCustomTestForm({ ...customTestForm, notes: e.target.value })}
                  placeholder="e.g. Fasting 10 hrs required, Morning sample, Rule out autoimmune..."
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Save to Catalog Checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-[8px] border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveToCatalog"
                  checked={customTestForm.saveToCatalog}
                  onChange={(e) => setCustomTestForm({ ...customTestForm, saveToCatalog: e.target.checked })}
                  className="rounded text-[#0d6157] focus:ring-[#0d6157] size-4"
                />
                <label htmlFor="saveToCatalog" className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                  Save to Clinic Catalog for future use by all doctors
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomInvestigation}
                disabled={!customTestForm.name.trim()}
                className="px-4 py-1.5 rounded-[8px] bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: EDIT INVESTIGATION ORDER ─── */}
      {editingLabOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold">Edit Investigation</h3>
                <p className="text-[11px] text-slate-500">{editingLabOrder.testName}</p>
              </div>
              <button
                onClick={() => setEditingLabOrder(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={editingLabOrder.priority}
                    onChange={(e) => setEditingLabOrder({ ...editingLabOrder, priority: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">STAT / Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Fulfillment</label>
                  <select
                    value={editingLabOrder.fulfillmentLocation}
                    onChange={(e) => setEditingLabOrder({ ...editingLabOrder, fulfillmentLocation: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="IN_HOUSE">In-House Lab</option>
                    <option value="EXTERNAL">External Lab</option>
                    <option value="UNDECIDED">Decide Later</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Notes / Instructions
                </label>
                <textarea
                  value={editingLabOrder.notes}
                  onChange={(e) => setEditingLabOrder({ ...editingLabOrder, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              {editingLabOrder.fulfillmentLocation === 'IN_HOUSE' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price (SAR)
                  </label>
                  <input
                    type="number"
                    value={editingLabOrder.price}
                    onChange={(e) => setEditingLabOrder({ ...editingLabOrder, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingLabOrder(null)}
                className="px-3.5 py-1.5 rounded-[8px] bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateLabOrder(editingLabOrder)}
                className="px-4 py-1.5 rounded-[8px] bg-[#0d6157] text-white text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EXTERNAL RESULT UPLOAD ─── */}
      {selectedExternalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="size-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold">External Diagnostic Result</h3>
                  <p className="text-[11px] text-slate-500">{selectedExternalOrder.testName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExternalOrder(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Report Document / File URL or Cloud Link
                </label>
                <input
                  type="text"
                  value={externalUploadForm.externalReportUrl}
                  onChange={(e) => setExternalUploadForm({ ...externalUploadForm, externalReportUrl: e.target.value })}
                  placeholder="https://... or attachment reference"
                  className="w-full px-3 py-2 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Result Date
                </label>
                <input
                  type="date"
                  value={externalUploadForm.externalResultDate}
                  onChange={(e) => setExternalUploadForm({ ...externalUploadForm, externalResultDate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Findings / Interpretation Notes
                </label>
                <textarea
                  value={externalUploadForm.externalResultNotes}
                  onChange={(e) => setExternalUploadForm({ ...externalUploadForm, externalResultNotes: e.target.value })}
                  placeholder="Enter external lab findings, values, radiologist impression..."
                  rows={3}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-[8px] border border-purple-200 dark:border-purple-800/60 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="markReviewed"
                  checked={externalUploadForm.markReviewed}
                  onChange={(e) => setExternalUploadForm({ ...externalUploadForm, markReviewed: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 size-4"
                />
                <label htmlFor="markReviewed" className="text-xs text-purple-900 dark:text-purple-200 cursor-pointer font-medium">
                  Mark as Reviewed by Doctor (Dr. {encounter.doctor.name})
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedExternalOrder(null)}
                className="px-3.5 py-1.5 rounded-[8px] bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadExternalResult}
                disabled={externalUploadForm.isSubmitting}
                className="px-4 py-1.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
              >
                {externalUploadForm.isSubmitting ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SEPARATE PRINTABLE LAB REQUISITION ─── */}
      {showRequisitionPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-[#0d6157]">{clinicName}</h2>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-0.5">
                  Diagnostic &amp; Laboratory Requisition Form
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-sm">Dr. {encounter.doctor.name}</div>
                <div className="text-slate-500">{encounter.doctor.specialty || 'Consultant Physician'}</div>
              </div>
            </div>

            {/* Patient Demographic Information */}
            <div className="grid grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
                <strong className="text-slate-900 text-sm">{encounter.patient.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">File # / PID</span>
                <strong>{encounter.patient.fileNumber ? `#${encounter.patient.fileNumber}` : encounter.patient.phone}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender / Mobile</span>
                <span>{encounter.patient.gender || 'N/A'} • {encounter.patient.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Requisition Date</span>
                <strong>{new Date().toLocaleDateString()}</strong>
              </div>
            </div>

            {/* Clinical Indication / Diagnosis */}
            {primaryDiagnosis && (
              <div className="text-xs p-3 bg-teal-50/50 rounded-lg border border-teal-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Clinical Indication / Diagnosis:</span>
                <div className="font-bold text-slate-900 text-xs mt-0.5">
                  {primaryDiagnosis} {icd10Code && `(${icd10Code})`}
                  {secondaryDiagnosis && ` • ${secondaryDiagnosis}`}
                </div>
              </div>
            )}

            {/* Ordered Investigations Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-1">
                Requested Investigations ({labOrders.length})
              </span>
              
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Investigation</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Priority</th>
                    <th className="p-2.5">Routing</th>
                    <th className="p-2.5">Clinical Instructions / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 italic">No investigations ordered.</td>
                    </tr>
                  ) : (
                    labOrders.map((lo, idx) => (
                      <tr key={lo.id}>
                        <td className="p-2.5 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{lo.testName}</td>
                        <td className="p-2.5 text-slate-600">{lo.category}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            lo.priority === 'STAT' ? 'bg-rose-100 text-rose-800' : lo.priority === 'URGENT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {lo.priority}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-[11px]">
                          {lo.fulfillmentLocation === 'IN_HOUSE' ? 'In-House Lab' : lo.fulfillmentLocation === 'EXTERNAL' ? 'External Lab' : 'Patient Choice'}
                        </td>
                        <td className="p-2.5 text-slate-600">{lo.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Instructions / Footer */}
            <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-700">Patient Instructions:</div>
              <div>• For fasting blood tests, please fast for 8-10 hours prior to sample collection. Water is permitted.</div>
              <div>• External lab results can be brought back or uploaded to your Patient Portal.</div>
            </div>

            {/* Signature Block */}
            <div className="pt-6 flex justify-between items-end border-t border-slate-200 text-xs">
              <span className="text-slate-400 text-[10px]">Pulseware HealthOS • Requisition #{encounter.id.slice(0, 8).toUpperCase()}</span>
              <div className="text-center">
                <div className="w-44 border-b border-slate-400 mb-1" />
                <div className="font-bold text-slate-700">Dr. {encounter.doctor.name}</div>
                <div className="text-[10px] text-slate-400">Doctor Signature &amp; Stamp</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRequisitionPrintModal(false)}
                className="px-3.5 py-1.5 rounded-[8px] bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-[8px] bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="size-3.5" />
                <span>Print Requisition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: PRESCRIPTION PRINT SLIP (EXISTING) ─── */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-[#0d6157]">{clinicName}</h2>
                <p className="text-xs text-slate-500">Outpatient Consultation &amp; Prescription Slip</p>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold">Dr. {encounter.doctor.name}</div>
                <div className="text-slate-500">{encounter.doctor.specialty || 'Physician'}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT</span>
                <strong>{encounter.patient.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">FILE NO</span>
                <strong>{encounter.patient.fileNumber ? `#${encounter.patient.fileNumber}` : encounter.patient.phone}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DATE</span>
                <strong>{new Date().toLocaleDateString()}</strong>
              </div>
            </div>

            {primaryDiagnosis && (
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Diagnosis:</span>
                <div className="font-bold text-sm text-slate-900">{primaryDiagnosis} {icd10Code && `(${icd10Code})`}</div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-1">℞ Prescriptions</span>
              {prescriptions.map((rx, idx) => (
                <div key={rx.id} className="text-xs border-b border-slate-100 pb-1.5 flex justify-between">
                  <span className="font-bold">{idx + 1}. {rx.medicineName} ({rx.dosage})</span>
                  <span className="text-slate-600">{rx.frequency} • {rx.duration}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 flex justify-between items-end border-t border-slate-200 text-xs">
              <span className="text-slate-400 text-[10px]">Powered by Pulseware HealthOS</span>
              <div className="text-center">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <span className="font-bold text-slate-700">Dr. {encounter.doctor.name}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-1.5 rounded-[8px] bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-[8px] bg-[#0d6157] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="size-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
