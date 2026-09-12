'use client';

import React, { useState, useMemo } from 'react';
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
  testName: string;
  category: string;
  notes: string;
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
}: ClinicalEncounterRoomViewProps) {
  const router = useRouter();
  const [encounter, setEncounter] = useState<ClinicalEncounterData>(initialEncounter);
  const [activeTab, setActiveTab] = useState<'SOAP' | 'VITALS' | 'PRESCRIPTION' | 'LABS' | 'HISTORY'>('SOAP');
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

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

  // Lab Orders List
  const [labOrders, setLabOrders] = useState<LabOrderEntry[]>(
    encounter.labOrdersJson || []
  );
  const [newLab, setNewLab] = useState({
    testName: '',
    category: 'Biochemistry',
    notes: 'Routine investigation',
  });

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
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const handleAddLabOrder = () => {
    if (!newLab.testName.trim()) return;
    const item: LabOrderEntry = {
      id: String(Date.now()),
      testName: newLab.testName.trim(),
      category: newLab.category,
      notes: newLab.notes,
    };
    setLabOrders([...labOrders, item]);
    setNewLab({
      testName: '',
      category: 'Biochemistry',
      notes: 'Routine investigation',
    });
  };

  const handleRemoveLabOrder = (id: string) => {
    setLabOrders(labOrders.filter(l => l.id !== id));
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

        {/* ─── TAB 4: LABS ─── */}
        {activeTab === 'LABS' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Laboratory &amp; Diagnostic Requisitions</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_LAB_TESTS.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    if (!labOrders.some(l => l.testName === t.name)) {
                      setLabOrders([...labOrders, { id: String(Date.now()), testName: t.name, category: t.category, notes: 'Routine check' }]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-[6px] bg-slate-50 hover:bg-[#e6f6f3] border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3 text-[#0d6157]" />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-[8px] border border-slate-200 dark:border-slate-800 pt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Investigation Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {labOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">No lab tests ordered yet.</td>
                    </tr>
                  ) : (
                    labOrders.map((lab, idx) => (
                      <tr key={lab.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{lab.testName}</td>
                        <td className="p-3 text-slate-600">{lab.category}</td>
                        <td className="p-3 text-slate-500">{lab.notes}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveLabOrder(lab.id)}
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

        {/* ─── TAB 5: HISTORY ─── */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[12px] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Past Clinical Encounters</h3>
            {previousEncounters.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No previous completed encounters recorded for this patient.</p>
            ) : (
              <div className="space-y-2.5">
                {previousEncounters.map((prev) => (
                  <div key={prev.id} className="p-3.5 rounded-[8px] bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                      <span>{new Date(prev.completedAt || prev.startedAt).toLocaleDateString()} • Dr. {prev.doctor?.name}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">Completed</span>
                    </div>
                    <div><strong>Diagnosis:</strong> {prev.primaryDiagnosis || 'N/A'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Print Modal */}
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
