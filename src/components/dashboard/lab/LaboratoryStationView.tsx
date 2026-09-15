'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  LuFlaskConical as FlaskConical,
  LuSearch as Search,
  LuPlus as Plus,
  LuCircleCheck as CheckCircle2,
  LuClock as Clock,
  LuTriangleAlert as AlertTriangle,
  LuUser as User,
  LuPhone as Phone,
  LuClipboardCheck as ClipboardCheck,
  LuFileText as FileText,
  LuX as X,
  LuRefreshCw as RefreshCw,
  LuBadgeAlert as BadgeAlert,
  LuPrinter as Printer,
  LuCheck as Check,
  LuLoader as Loader2,
  LuShieldAlert as ShieldAlert,
  LuTestTube as TestTube,
  LuArrowRight as ArrowRight,
  LuDownload as Download,
  LuStethoscope as Stethoscope,
  LuDna as Dna,
  LuBuilding2 as Building2,
  LuPencil as Edit3,
  LuTrash2 as Trash2,
} from 'react-icons/lu';
import { cn } from '@/components/ui/primitives';

export interface LabOrderParameter {
  name: string;
  value: string | number;
  unit: string;
  referenceRange?: string;
  normalMin?: number;
  normalMax?: number;
  flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  remarks?: string;
}

export interface SelectedLabTestItem {
  id: string;
  testCode?: string;
  testName: string;
  category: string;
  sampleType: string;
  tubeType?: string;
  price: number;
}

export interface LabOrderItem {
  id: string;
  orderNumber: string;
  patientId: string;
  doctorId?: string | null;
  encounterId?: string | null;
  testName: string;
  category: string;
  sampleType: string;
  tubeType?: string | null;
  specimenId?: string | null;
  priority: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY' | 'STAT';
  status:
    | 'ORDERED'
    | 'SAMPLE_COLLECTED'
    | 'IN_PROGRESS'
    | 'RESULT_READY'
    | 'EXTERNAL_RESULT_UPLOADED'
    | 'REVIEWED'
    | 'COMPLETED'
    | 'CANCELLED';
  fulfillmentLocation?: 'IN_HOUSE' | 'EXTERNAL' | 'UNDECIDED' | string | null;
  instructions?: string | null;
  clinicalNotes?: string | null;
  price: number;
  collectedAt?: string | null;
  collectedBy?: { id: string; name: string } | null;
  verifiedAt?: string | null;
  verifiedBy?: { id: string; name: string } | null;
  resultsJson?: LabOrderParameter[] | null;
  resultsSummary?: string | null;
  hasAbnormalResults?: boolean;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    phone: string;
    fileNumber?: number | null;
    gender?: string | null;
    tags?: string[];
  };
  doctor?: {
    id: string;
    name: string;
    specialty?: string | null;
  } | null;
  encounter?: {
    id: string;
    chiefComplaint?: string | null;
    primaryDiagnosis?: string | null;
  } | null;
}

export interface LabCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  sampleType: string;
  containerType?: string | null;
  price: number;
  turnaroundHours: number;
  normalRange?: string | null;
  parametersJson?: any;
}

interface LaboratoryStationViewProps {
  clinicName: string;
  labTechName: string;
  initialOrders: LabOrderItem[];
  catalogTests: LabCatalogItem[];
  allPatients: Array<{ id: string; name: string; phone: string; fileNumber?: number | null; gender?: string | null }>;
  allDoctors: Array<{ id: string; name: string; specialty?: string | null }>;
}

const CONTAINER_TYPES = [
  'Lavender (EDTA) - Hematology/CBC',
  'Yellow (SST Gel) - Chemistry/LFT/RFT/Lipid',
  'Red (Plain Serum) - Serology/Immunology',
  'Grey (Fluoride) - Glucose/FBS',
  'Light Blue (Citrate) - Coagulation/PT-INR',
  'Sterile Urine Cup - Urinalysis/Culture',
  'Sterile Swab / Container - Microbiology',
];

export function LaboratoryStationView({
  clinicName,
  labTechName,
  initialOrders,
  catalogTests,
  allPatients,
  allDoctors,
}: LaboratoryStationViewProps) {
  const [orders, setOrders] = useState<LabOrderItem[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COLLECTION' | 'TESTING' | 'COMPLETED' | 'CATALOG'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [catalogList, setCatalogList] = useState<LabCatalogItem[]>(catalogTests);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogTest, setEditingCatalogTest] = useState<LabCatalogItem | null>(null);
  const [catalogFormData, setCatalogFormData] = useState({
    code: '',
    name: '',
    category: 'Biochemistry',
    sampleType: 'Whole Blood',
    containerType: 'Lavender (EDTA)',
    price: 0,
    turnaroundHours: 24,
    normalRange: '',
    parametersJson: [
      { name: '', unit: '', normalMin: '' as any, normalMax: '' as any, referenceRange: '' },
    ],
  });

  // Catalog Table Selection & Confirmation State
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'SINGLE' | 'BULK';
    testId?: string;
    testName?: string;
    testCode?: string;
    count?: number;
  }>({ isOpen: false, type: 'SINGLE' });

  // Drawers & Modals
  const [selectedOrder, setSelectedOrder] = useState<LabOrderItem | null>(null);
  const [isCollectDrawerOpen, setIsCollectDrawerOpen] = useState(false);
  const [isResultDrawerOpen, setIsResultDrawerOpen] = useState(false);
  const [isNewOrderDrawerOpen, setIsNewOrderDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sample Collection Form State
  const [collectFormData, setCollectFormData] = useState({
    specimenId: '',
    tubeType: 'Lavender (EDTA) - Hematology/CBC',
    clinicalNotes: '',
  });

  // Result Entry Form State
  const [resultParameters, setResultParameters] = useState<LabOrderParameter[]>([]);
  const [resultSummaryNotes, setResultSummaryNotes] = useState('');

  // New Order Form State & Customer Type (Walk-in vs Clinic Patient)
  const [labCustomerType, setLabCustomerType] = useState<'WALK_IN' | 'CLINIC_PATIENT'>('WALK_IN');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInGender, setWalkInGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [walkInAge, setWalkInAge] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [selectedClinicPatient, setSelectedClinicPatient] = useState<{ id: string; name: string; phone: string; fileNumber?: number | null; gender?: string | null } | null>(null);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  // Multi-Test Attachment State for Requisitions
  const [selectedTestsList, setSelectedTestsList] = useState<SelectedLabTestItem[]>([]);
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const testDropdownRef = useRef<HTMLDivElement>(null);

  const [newOrderData, setNewOrderData] = useState({
    patientId: '',
    doctorId: '',
    testCode: '',
    testName: '',
    category: 'Biochemistry',
    sampleType: 'Blood',
    priority: 'ROUTINE' as 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY',
    price: 0,
    instructions: '',
    clinicalNotes: '',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Keyboard Shortcuts (Esc to close drawers) and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCollectDrawerOpen(false);
        setIsResultDrawerOpen(false);
        setIsNewOrderDrawerOpen(false);
        setIsReportModalOpen(false);
        setIsCatalogModalOpen(false);
      }
    };
    const handleOutsideClick = (e: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
      if (testDropdownRef.current && !testDropdownRef.current.contains(e.target as Node)) {
        setIsTestDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Filtered Clinic Patients for Searchable Lookup
  const filteredClinicPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return allPatients.slice(0, 15);
    const q = patientSearchTerm.toLowerCase().trim();
    return allPatients.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchPhone = p.phone.toLowerCase().includes(q);
      const matchMRN = p.fileNumber ? String(p.fileNumber).includes(q) : false;
      return matchName || matchPhone || matchMRN;
    }).slice(0, 20);
  }, [allPatients, patientSearchTerm]);

  // Filtered Test Catalog for Multi-Test Picker
  const filteredCatalogTests = useMemo(() => {
    if (!testSearchTerm.trim()) return catalogList.slice(0, 15);
    const q = testSearchTerm.toLowerCase().trim();
    return catalogList.filter((t) => {
      const matchName = t.name.toLowerCase().includes(q);
      const matchCode = t.code ? t.code.toLowerCase().includes(q) : false;
      const matchCat = t.category ? t.category.toLowerCase().includes(q) : false;
      return matchName || matchCode || matchCat;
    }).slice(0, 20);
  }, [catalogList, testSearchTerm]);

  // Total Requisition Pricing & Required Containers
  const totalRequisitionPrice = useMemo(() => {
    return selectedTestsList.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  }, [selectedTestsList]);

  const requiredSpecimenTypes = useMemo(() => {
    const set = new Set<string>();
    selectedTestsList.forEach((t) => {
      const label = t.tubeType || t.sampleType || 'Specimen';
      if (label) set.add(label);
    });
    return Array.from(set);
  }, [selectedTestsList]);

  // Helper to add test from catalog with duplicate prevention
  const handleAddTestToRequisition = (test: LabCatalogItem) => {
    const isDuplicate = selectedTestsList.some(
      (t) =>
        (t.testCode && test.code && t.testCode.toLowerCase() === test.code.toLowerCase()) ||
        t.testName.toLowerCase().trim() === test.name.toLowerCase().trim()
    );
    if (isDuplicate) {
      showToast(`Test "${test.name}" is already attached.`);
      return;
    }
    setSelectedTestsList((prev) => [
      ...prev,
      {
        id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        testCode: test.code,
        testName: test.name,
        category: test.category || 'Biochemistry',
        sampleType: test.sampleType || 'Blood',
        tubeType: test.containerType || undefined,
        price: Number(test.price) || 0,
      },
    ]);
    setTestSearchTerm('');
    setIsTestDropdownOpen(false);
  };

  // Helper to add custom / free-text test with duplicate prevention
  const handleAddCustomTestToRequisition = (customName?: string) => {
    const nameToAdd = (customName || testSearchTerm).trim();
    if (!nameToAdd) return;
    const isDuplicate = selectedTestsList.some(
      (t) => t.testName.toLowerCase().trim() === nameToAdd.toLowerCase().trim()
    );
    if (isDuplicate) {
      showToast(`Test "${nameToAdd}" is already attached.`);
      return;
    }
    setSelectedTestsList((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        testCode: '',
        testName: nameToAdd,
        category: 'Biochemistry',
        sampleType: 'Blood',
        tubeType: 'Lavender (EDTA) - Hematology/CBC',
        price: 0,
      },
    ]);
    setTestSearchTerm('');
    setIsTestDropdownOpen(false);
  };

  const handleRemoveTestFromRequisition = (id: string) => {
    setSelectedTestsList((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTestItem = (id: string, updates: Partial<SelectedLabTestItem>) => {
    setSelectedTestsList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleOpenNewOrderDrawer = () => {
    setLabCustomerType('WALK_IN');
    setWalkInName('');
    setWalkInPhone('');
    setWalkInGender('');
    setWalkInAge('');
    setPatientSearchTerm('');
    setSelectedClinicPatient(null);
    setTestSearchTerm('');
    setIsPatientDropdownOpen(false);
    setIsTestDropdownOpen(false);
    setSelectedTestsList([]);
    setNewOrderData({
      patientId: '',
      doctorId: '',
      testCode: '',
      testName: '',
      category: 'Biochemistry',
      sampleType: 'Blood',
      priority: 'ROUTINE',
      price: 0,
      instructions: '',
      clinicalNotes: '',
    });
    setIsNewOrderDrawerOpen(true);
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === 'COLLECTION' && order.status !== 'ORDERED') return false;
      if (activeTab === 'TESTING' && order.status !== 'SAMPLE_COLLECTED' && order.status !== 'IN_PROGRESS' && order.status !== 'RESULT_READY') return false;
      if (activeTab === 'COMPLETED' && order.status !== 'COMPLETED' && order.status !== 'REVIEWED' && order.status !== 'EXTERNAL_RESULT_UPLOADED') return false;
      if (activeTab === 'ACTIVE' && (order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'REVIEWED')) return false;

      if (priorityFilter !== 'ALL' && order.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && order.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = order.patient?.name || '';
        const matchesPatient = patientName.toLowerCase().includes(q);
        const matchesOrder = order.orderNumber ? order.orderNumber.toLowerCase().includes(q) : false;
        const matchesSpecimen = order.specimenId ? order.specimenId.toLowerCase().includes(q) : false;
        const matchesTest = order.testName ? order.testName.toLowerCase().includes(q) : false;
        const matchesMRN = order.patient?.fileNumber ? String(order.patient.fileNumber).includes(q) : false;
        if (!matchesPatient && !matchesOrder && !matchesSpecimen && !matchesTest && !matchesMRN) return false;
      }
      return true;
    });
  }, [orders, activeTab, priorityFilter, categoryFilter, searchQuery]);

  // Filtered Catalog List
  const filteredCatalog = useMemo(() => {
    return catalogList.filter((test) => {
      if (categoryFilter !== 'ALL' && test.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = test.name.toLowerCase().includes(q);
        const matchesCode = test.code.toLowerCase().includes(q);
        const matchesCategory = test.category.toLowerCase().includes(q);
        const matchesSample = test.sampleType.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCategory && !matchesSample) return false;
      }
      return true;
    });
  }, [catalogList, categoryFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const pendingCollection = orders.filter((o) => o.status === 'ORDERED').length;
    const inTesting = orders.filter((o) => o.status === 'SAMPLE_COLLECTED' || o.status === 'IN_PROGRESS' || o.status === 'RESULT_READY').length;
    const abnormalCount = orders.filter((o) => o.hasAbnormalResults || o.priority === 'STAT_EMERGENCY').length;
    const completedCount = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'REVIEWED' || o.status === 'EXTERNAL_RESULT_UPLOADED').length;

    return { pendingCollection, inTesting, abnormalCount, completedCount };
  }, [orders]);

  // Handlers for Opening Drawers
  const handleOpenCollectDrawer = (order: LabOrderItem) => {
    setSelectedOrder(order);
    const autoSpecimen = order.specimenId || `SPEC-${Math.floor(100000 + Math.random() * 900000)}`;
    setCollectFormData({
      specimenId: autoSpecimen,
      tubeType: order.tubeType || 'Lavender (EDTA) - Hematology/CBC',
      clinicalNotes: order.clinicalNotes || '',
    });
    setIsCollectDrawerOpen(true);
  };

  const handleOpenResultDrawer = (order: LabOrderItem) => {
    setSelectedOrder(order);
    setResultSummaryNotes(order.resultsSummary || '');

    if (order.resultsJson && order.resultsJson.length > 0) {
      setResultParameters(order.resultsJson);
    } else {
      // Find matching template parameters from catalog
      const catalogMatch = catalogList.find(
        (c) => c.name.toLowerCase() === order.testName.toLowerCase() || c.code.toLowerCase() === order.testName.toLowerCase()
      );
      if (catalogMatch?.parametersJson && Array.isArray(catalogMatch.parametersJson)) {
        const initialParams: LabOrderParameter[] = catalogMatch.parametersJson.map((p: any) => ({
          name: p.name,
          value: '',
          unit: p.unit || '',
          normalMin: p.normalMin,
          normalMax: p.normalMax,
          referenceRange: p.normalMin !== undefined && p.normalMax !== undefined ? `${p.normalMin} - ${p.normalMax} ${p.unit || ''}` : p.normalRange || 'Standard',
          flag: 'NORMAL',
        }));
        setResultParameters(initialParams);
      } else {
        // Fallback default single row
        setResultParameters([
          {
            name: order.testName,
            value: '',
            unit: '',
            referenceRange: 'Standard Normal',
            flag: 'NORMAL',
          },
        ]);
      }
    }
    setIsResultDrawerOpen(true);
  };

  const handleOpenReportModal = (order: LabOrderItem) => {
    setSelectedOrder(order);
    setIsReportModalOpen(true);
  };

  // 1. Submit Sample Collection
  const handleSaveSampleCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/lab/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SAMPLE_COLLECTED',
          specimenId: collectFormData.specimenId,
          tubeType: collectFormData.tubeType,
          clinicalNotes: collectFormData.clinicalNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to record sample collection');
      const data = await res.json();

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...data.order } : o))
      );
      setIsCollectDrawerOpen(false);
      showToast(`Sample specimen #${collectFormData.specimenId} collected for ${selectedOrder.patient.name}!`);
    } catch (err: any) {
      alert(err.message || 'Error recording sample');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Dynamic Value Change & Auto-Flagging
  const handleParameterValueChange = (index: number, val: string) => {
    const updated = [...resultParameters];
    const existing = updated[index];
    if (!existing) return;
    const item: LabOrderParameter = { ...existing };
    item.value = val;

    const numVal = parseFloat(val);
    if (!isNaN(numVal) && item.normalMin !== undefined && item.normalMax !== undefined) {
      if (numVal < item.normalMin) {
        item.flag = 'LOW';
      } else if (numVal > item.normalMax) {
        item.flag = 'HIGH';
      } else {
        item.flag = 'NORMAL';
      }
    } else {
      item.flag = 'NORMAL';
    }

    updated[index] = item;
    setResultParameters(updated);
  };

  const handleAddCustomParameter = () => {
    setResultParameters((prev) => [
      ...prev,
      {
        name: '',
        value: '',
        unit: '',
        referenceRange: 'Normal',
        flag: 'NORMAL',
      },
    ]);
  };

  const handleRemoveParameter = (idx: number) => {
    setResultParameters((prev) => prev.filter((_, i) => i !== idx));
  };

  // 3. Submit Results
  const handleSaveResults = async (status: 'IN_PROGRESS' | 'COMPLETED') => {
    if (!selectedOrder) return;
    setIsActionLoading(true);

    const isAbnormal = resultParameters.some((p) => p.flag === 'HIGH' || p.flag === 'LOW' || p.flag === 'CRITICAL');

    try {
      const res = await fetch(`/api/lab/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resultsJson: resultParameters,
          resultsSummary: resultSummaryNotes,
          hasAbnormalResults: isAbnormal,
        }),
      });

      if (!res.ok) throw new Error('Failed to save test results');
      const data = await res.json();

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...data.order } : o))
      );
      setIsResultDrawerOpen(false);
      showToast(
        status === 'COMPLETED'
          ? `Lab Results verified and released for ${selectedOrder.patient.name}!`
          : `Draft results saved successfully for ${selectedOrder.patient.name}!`
      );
    } catch (err: any) {
      alert(err.message || 'Error saving results');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Create New Direct Order (Walk-in Customer or Clinic Patient)
  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (labCustomerType === 'WALK_IN') {
      if (!walkInName.trim()) {
        alert('Please enter the walk-in customer name.');
        return;
      }
    } else {
      if (!newOrderData.patientId) {
        alert('Please select a registered clinic patient.');
        return;
      }
    }

    if (selectedTestsList.length === 0) {
      alert('Please add at least one diagnostic test to the requisition.');
      return;
    }

    setIsActionLoading(true);

    try {
      const payload: any = {
        customerType: labCustomerType,
        doctorId: newOrderData.doctorId || undefined,
        priority: newOrderData.priority,
        instructions: newOrderData.instructions.trim() || undefined,
        clinicalNotes: newOrderData.clinicalNotes.trim() || undefined,
        tests: selectedTestsList.map((t) => ({
          testCode: t.testCode,
          testName: t.testName,
          category: t.category,
          sampleType: t.sampleType,
          tubeType: t.tubeType,
          price: Number(t.price) || 0,
        })),
      };

      if (labCustomerType === 'WALK_IN') {
        payload.patientName = walkInName.trim();
        payload.patientPhone = walkInPhone.trim() || undefined;
        payload.patientGender = walkInGender || undefined;
      } else {
        payload.patientId = newOrderData.patientId;
      }

      const res = await fetch('/api/lab/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || (typeof data.error === 'string' ? data.error : 'Failed to create lab order'));
      }

      const createdList: LabOrderItem[] = Array.isArray(data.orders) ? data.orders : [data.order];
      setOrders((prev) => [...createdList, ...prev]);
      setIsNewOrderDrawerOpen(false);
      const patientName = createdList[0]?.patient?.name || (labCustomerType === 'WALK_IN' ? walkInName : 'Patient');
      showToast(
        `${createdList.length} diagnostic ${createdList.length === 1 ? 'requisition' : 'requisitions'} created for ${patientName}!`
      );
    } catch (err: any) {
      alert(err.message || 'Error creating order');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenCreateCatalog = () => {
    setEditingCatalogTest(null);
    setCatalogFormData({
      code: '',
      name: '',
      category: 'Biochemistry',
      sampleType: 'Whole Blood',
      containerType: 'Lavender (EDTA)',
      price: 0,
      turnaroundHours: 24,
      normalRange: '',
      parametersJson: [
        { name: '', unit: '', normalMin: '' as any, normalMax: '' as any, referenceRange: '' },
      ],
    });
    setIsCatalogModalOpen(true);
  };

  const handleOpenEditCatalog = (test: LabCatalogItem) => {
    setEditingCatalogTest(test);
    const params = Array.isArray(test.parametersJson) && test.parametersJson.length > 0
      ? test.parametersJson.map((p: any) => ({
          name: p.name || '',
          unit: p.unit || '',
          normalMin: p.normalMin !== undefined ? p.normalMin : '',
          normalMax: p.normalMax !== undefined ? p.normalMax : '',
          referenceRange: p.referenceRange || '',
        }))
      : [{ name: test.name, unit: '', normalMin: '' as any, normalMax: '' as any, referenceRange: test.normalRange || '' }];

    setCatalogFormData({
      code: test.code,
      name: test.name,
      category: test.category || 'Biochemistry',
      sampleType: test.sampleType || 'Whole Blood',
      containerType: test.containerType || 'Lavender (EDTA)',
      price: test.price || 0,
      turnaroundHours: test.turnaroundHours || 24,
      normalRange: test.normalRange || '',
      parametersJson: params,
    });
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogFormData.code.trim() || !catalogFormData.name.trim()) {
      alert('Test code and test name are required');
      return;
    }
    setIsActionLoading(true);

    try {
      const cleanParams = catalogFormData.parametersJson
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          unit: p.unit.trim(),
          normalMin: p.normalMin !== '' && !isNaN(Number(p.normalMin)) ? Number(p.normalMin) : undefined,
          normalMax: p.normalMax !== '' && !isNaN(Number(p.normalMax)) ? Number(p.normalMax) : undefined,
          referenceRange: p.referenceRange?.trim() || (p.normalMin !== '' && p.normalMax !== '' ? `${p.normalMin} - ${p.normalMax} ${p.unit}` : undefined),
        }));

      const payload = {
        code: catalogFormData.code.trim().toUpperCase(),
        name: catalogFormData.name.trim(),
        category: catalogFormData.category,
        sampleType: catalogFormData.sampleType,
        containerType: catalogFormData.containerType,
        price: Number(catalogFormData.price) || 0,
        turnaroundHours: Number(catalogFormData.turnaroundHours) || 24,
        normalRange: catalogFormData.normalRange || null,
        parametersJson: cleanParams.length > 0 ? cleanParams : null,
      };

      if (editingCatalogTest) {
        const res = await fetch(`/api/lab/tests/${editingCatalogTest.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update lab test in database');
        const data = await res.json();
        setCatalogList((prev) => prev.map((t) => (t.id === editingCatalogTest.id ? data.test : t)));
        showToast(`Lab test "${data.test.name}" updated successfully in database!`);
      } else {
        const res = await fetch('/api/lab/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create lab test in database');
        const data = await res.json();
        setCatalogList((prev) => [...prev, data.test].sort((a, b) => a.name.localeCompare(b.name)));
        showToast(`New lab test "${data.test.name}" created and saved to database!`);
      }

      setIsCatalogModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving lab test to database');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleSelectAllCatalog = () => {
    if (selectedCatalogIds.length === filteredCatalog.length && filteredCatalog.length > 0) {
      setSelectedCatalogIds([]);
    } else {
      setSelectedCatalogIds(filteredCatalog.map((t) => t.id));
    }
  };

  const handleToggleSelectCatalog = (id: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePromptDeleteSingle = (test: LabCatalogItem) => {
    setDeleteModalState({
      isOpen: true,
      type: 'SINGLE',
      testId: test.id,
      testName: test.name,
      testCode: test.code,
    });
  };

  const handlePromptDeleteBulk = () => {
    if (selectedCatalogIds.length === 0) return;
    setDeleteModalState({
      isOpen: true,
      type: 'BULK',
      count: selectedCatalogIds.length,
    });
  };

  const handleConfirmDelete = async () => {
    setIsActionLoading(true);
    try {
      if (deleteModalState.type === 'SINGLE' && deleteModalState.testId) {
        const res = await fetch(`/api/lab/tests/${deleteModalState.testId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete lab test');
        setCatalogList((prev) => prev.filter((t) => t.id !== deleteModalState.testId));
        setSelectedCatalogIds((prev) => prev.filter((id) => id !== deleteModalState.testId));
        showToast(`Lab test "${deleteModalState.testName}" deleted successfully.`);
      } else if (deleteModalState.type === 'BULK' && selectedCatalogIds.length > 0) {
        const res = await fetch('/api/lab/tests', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedCatalogIds }),
        });
        if (!res.ok) throw new Error('Failed to delete selected lab tests');
        const data = await res.json();
        const deletedSet = new Set(selectedCatalogIds);
        setCatalogList((prev) => prev.filter((t) => !deletedSet.has(t.id)));
        setSelectedCatalogIds([]);
        showToast(`${data.count || selectedCatalogIds.length} lab tests deleted from database.`);
      }
      setDeleteModalState({ isOpen: false, type: 'SINGLE' });
    } catch (err: any) {
      alert(err.message || 'Error deleting lab test(s)');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTestCatalogSelect = (code: string) => {
    const test = catalogList.find((t) => t.code === code);
    if (test) {
      setNewOrderData((prev) => ({
        ...prev,
        testCode: test.code,
        testName: test.name,
        category: test.category,
        sampleType: test.sampleType,
        price: test.price,
      }));
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* SUCCESS TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-2 bg-[#0d6157] text-white px-4 py-2.5 rounded-[8px] shadow-lg border border-[#0d6157]/40 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Diagnostic Laboratory &amp; Pathology (LIS)</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <FlaskConical className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Laboratory Management Station</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            On Duty: <span className="font-semibold text-slate-700 dark:text-slate-200">{labTechName}</span> • Specimen intake, diagnostics analysis, and electronic lab releases.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenNewOrderDrawer}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="size-3.5" />
            <span>New Lab Order</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Sample Collection */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider whitespace-nowrap">
              Pending Collection
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.pendingCollection}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block whitespace-nowrap">
                Requires Specimen
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
            <TestTube className="size-4" />
          </div>
        </div>

        {/* Card 2: In Analysis */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider whitespace-nowrap">
              In Testing / Processing
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.inTesting}
            </div>
            <div className="pt-0.5">
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-200/80 dark:border-blue-900/50 inline-block whitespace-nowrap">
                Under Analysis
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900/50 shadow-2xs">
            <FlaskConical className="size-4" />
          </div>
        </div>

        {/* Card 3: Abnormal & STAT */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider whitespace-nowrap">
              Abnormal / STAT Flags
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.abnormalCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-200/80 dark:border-rose-900/50 inline-block whitespace-nowrap">
                Critical Review
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Completed &amp; Released
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.completedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block whitespace-nowrap">
                Synced to Doctor
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <ClipboardCheck className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR ROW */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {[
            { id: 'ACTIVE', label: `Active Queue (${stats.pendingCollection + stats.inTesting})` },
            { id: 'COLLECTION', label: `Sample Collection (${stats.pendingCollection})` },
            { id: 'TESTING', label: `In Testing (${stats.inTesting})` },
            { id: 'COMPLETED', label: `Completed Archive (${stats.completedCount})` },
            { id: 'CATALOG', label: `Test Catalog (${catalogList.length})` },
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

        <div className="flex items-center gap-2.5">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#0d6157] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="ROUTINE">Routine</option>
            <option value="URGENT">Urgent</option>
            <option value="STAT_EMERGENCY">STAT Emergency</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#0d6157] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Hematology">Hematology</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Immunology">Immunology</option>
            <option value="Microbiology">Microbiology</option>
          </select>

          <div className="relative w-56 sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, MRN, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN DATA VIEW */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {activeTab === 'CATALOG' ? (
          /* Test Catalog Table View */
          <div className="overflow-auto flex-1 flex flex-col min-h-0">
            <div className="p-6 pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Laboratory Diagnostic Catalog</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                    {catalogList.length} {catalogList.length === 1 ? 'test' : 'tests'} configured
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Database catalog of all configured panels, specimen requirements, reference ranges, and clinic pricing</p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {selectedCatalogIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-[8px] border border-slate-200 dark:border-slate-700">
                      {selectedCatalogIds.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={handlePromptDeleteBulk}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-[8px] shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCatalogIds([])}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleOpenCreateCatalog}
                  className="inline-flex items-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="size-3.5" />
                  <span>Add Catalog Test</span>
                </button>
              </div>
            </div>

            {catalogList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <FlaskConical className="size-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No laboratory tests in database</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Your clinic database has no catalog tests yet. Add custom test panels tailored to your diagnostic capabilities.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateCatalog}
                  className="inline-flex items-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs px-4 py-2 rounded-[8px] shadow-xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Create First Lab Test</span>
                </button>
              </div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredCatalog.length > 0 && selectedCatalogIds.length === filteredCatalog.length}
                          onChange={handleToggleSelectAllCatalog}
                          className="size-4 rounded border-slate-300 text-[#0d6157] focus:ring-[#0d6157] cursor-pointer accent-[#0d6157]"
                        />
                      </th>
                      <th className="py-3 px-4 whitespace-nowrap">CODE &amp; CATEGORY</th>
                      <th className="py-3 px-4 whitespace-nowrap">TEST PANEL NAME</th>
                      <th className="py-3 px-4 whitespace-nowrap">SPECIMEN &amp; CONTAINER</th>
                      <th className="py-3 px-4 whitespace-nowrap">TAT</th>
                      <th className="py-3 px-4 whitespace-nowrap">PARAMETERS</th>
                      <th className="py-3 px-4 whitespace-nowrap">REFERENCE RANGE</th>
                      <th className="py-3 px-4 whitespace-nowrap">PRICE</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <p className="font-semibold text-xs">No catalog tests match your search filter</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((test) => {
                        const isSelected = selectedCatalogIds.includes(test.id);
                        return (
                          <tr
                            key={test.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              isSelected ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectCatalog(test.id)}
                                className="size-4 rounded border-slate-300 text-[#0d6157] focus:ring-[#0d6157] cursor-pointer accent-[#0d6157]"
                              />
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <p className="font-bold text-[#0d6157] dark:text-teal-400 font-mono text-xs">
                                {test.code}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {test.category}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {test.name}
                              </p>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {test.sampleType}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {test.containerType || 'Standard Tube'}
                              </p>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                              {test.turnaroundHours}h
                            </td>
                            <td className="py-3 px-4">
                              {test.parametersJson && Array.isArray(test.parametersJson) && test.parametersJson.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {test.parametersJson.slice(0, 3).map((p: any, i: number) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                      {p.name} {p.unit ? `(${p.unit})` : ''}
                                    </span>
                                  ))}
                                  {test.parametersJson.length > 3 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                                      +{test.parametersJson.length - 3} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Single parameter</span>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-400" title={test.normalRange || 'Standard'}>
                              {test.normalRange || 'Standard'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                              SAR {test.price}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCatalog(test)}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePromptDeleteSingle(test)}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-[6px] transition-colors cursor-pointer"
                                >
                                  Delete
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
            )}
          </div>
        ) : (
          /* Lab Orders Table */
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5 whitespace-nowrap">ORDER / SPECIMEN</th>
                  <th className="py-3 px-5 whitespace-nowrap">PATIENT / MRN</th>
                  <th className="py-3 px-5 whitespace-nowrap">TEST PANEL</th>
                  <th className="py-3 px-5 whitespace-nowrap">ORDERING DOCTOR</th>
                  <th className="py-3 px-5 whitespace-nowrap">PRIORITY</th>
                  <th className="py-3 px-5 whitespace-nowrap">STATUS</th>
                  <th className="py-3 px-5 whitespace-nowrap">RESULTS / FLAGS</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <FlaskConical className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No lab orders found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Lab orders from doctors or direct walk-ins will appear here</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isAbnormal = order.hasAbnormalResults;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        
                        {/* 1. Order / Specimen */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                            <span>{order.orderNumber}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {order.specimenId ? `Specimen: ${order.specimenId}` : 'Awaiting Specimen ID'}
                          </p>
                        </td>

                        {/* 2. Patient / MRN */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-[6px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shrink-0 text-xs">
                              {(order.patient?.name || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  {order.patient?.name || 'Unnamed Patient'}
                                </p>
                                {order.patient?.gender && (
                                  <span className="font-normal text-slate-400 text-[10px]">
                                    ({order.patient.gender})
                                  </span>
                                )}
                                {order.patient?.tags?.includes('WALK_IN_CUSTOMER') || !order.patient?.fileNumber ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Walk-in
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0d6157] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                    Clinic
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                                {order.patient?.fileNumber ? `MRN #${order.patient.fileNumber}` : 'Walk-in (No MRN)'} • {order.patient?.phone && !order.patient.phone.startsWith('walkin-') ? order.patient.phone : 'Direct Retail'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 3. Test Panel */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <p className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {order.testName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {order.category} • {order.sampleType}
                          </p>
                        </td>

                        {/* 4. Doctor */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {order.doctor ? `Dr. ${order.doctor.name}` : 'Direct / Walk-in'}
                          </p>
                          <p className="text-[11px] text-slate-400 whitespace-nowrap">
                            {order.doctor?.specialty || 'General Practice'}
                          </p>
                        </td>

                        {/* 5. Priority */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {order.priority === 'STAT_EMERGENCY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10.5px] font-bold bg-rose-600 text-white animate-pulse">
                              <AlertTriangle className="size-3" /> STAT EMERGENCY
                            </span>
                          ) : order.priority === 'URGENT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10.5px] font-bold bg-amber-500 text-white">
                              <Clock className="size-3" /> Urgent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Routine
                            </span>
                          )}
                        </td>

                        {/* 6. Status */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {order.status === 'ORDERED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40">
                              Pending Collection
                            </span>
                          ) : order.status === 'SAMPLE_COLLECTED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40">
                              Sample Received
                            </span>
                          ) : order.status === 'IN_PROGRESS' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800/40">
                              In Testing
                            </span>
                          ) : order.status === 'RESULT_READY' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40">
                              Result Ready
                            </span>
                          ) : order.status === 'EXTERNAL_RESULT_UPLOADED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800/40">
                              Ext. Uploaded
                            </span>
                          ) : order.status === 'REVIEWED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:border-teal-800/40">
                              Reviewed
                            </span>
                          ) : order.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-[#e6f6f3] text-[#0d6157] border border-[#0d8276]/30 dark:bg-teal-950/40 dark:border-teal-700/50">
                              Results Released
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* 7. Results / Flags */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {order.status === 'COMPLETED' ? (
                            isAbnormal ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/40">
                                <AlertTriangle className="size-3" /> Abnormal Value(s)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40">
                                <CheckCircle2 className="size-3" /> Normal Results
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Pending analysis</span>
                          )}
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            {order.status === 'ORDERED' ? (
                              <button
                                onClick={() => handleOpenCollectDrawer(order)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-[8px] shadow-2xs transition-colors cursor-pointer"
                              >
                                <TestTube className="size-3.5" />
                                <span>Collect Sample</span>
                              </button>
                            ) : order.status === 'SAMPLE_COLLECTED' || order.status === 'IN_PROGRESS' ? (
                              <button
                                onClick={() => handleOpenResultDrawer(order)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-2xs transition-colors cursor-pointer"
                              >
                                <FlaskConical className="size-3.5" />
                                <span>Enter Results</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenResultDrawer(order)}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-[8px] transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleOpenReportModal(order)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0d6157] dark:text-teal-400 bg-[#e6f6f3] dark:bg-teal-950/40 border border-[#0d8276]/30 hover:bg-teal-100 rounded-[8px] transition-colors cursor-pointer"
                                >
                                  <FileText className="size-3.5" />
                                  <span>View Report</span>
                                </button>
                              </div>
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. SAMPLE COLLECTION SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      {isCollectDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isActionLoading && setIsCollectDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-[8px] bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <TestTube className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Sample Specimen Intake</h2>
                    <p className="text-xs text-slate-500">Order #{selectedOrder.orderNumber} • {selectedOrder.testName}</p>
                  </div>
                </div>
                <button onClick={() => setIsCollectDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSampleCollection} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[8px] space-y-1 text-xs">
                    <p className="text-slate-500">Patient: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.patient.name}</span> (MRN #{selectedOrder.patient.fileNumber || '---'})</p>
                    <p className="text-slate-500">Test: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.testName}</span> ({selectedOrder.category})</p>
                    <p className="text-slate-500">Required Sample: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.sampleType}</span></p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Specimen Barcode / Sample ID
                    </label>
                    <input
                      type="text"
                      required
                      value={collectFormData.specimenId}
                      onChange={(e) => setCollectFormData({ ...collectFormData, specimenId: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Sample Container / Collection Tube
                    </label>
                    <select
                      value={collectFormData.tubeType}
                      onChange={(e) => setCollectFormData({ ...collectFormData, tubeType: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white"
                    >
                      {CONTAINER_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Phlebotomy / Collection Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Venipuncture performed on left antecubital vein. Fasting confirmed..."
                      value={collectFormData.clinicalNotes}
                      onChange={(e) => setCollectFormData({ ...collectFormData, clinicalNotes: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCollectDrawerOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-[8px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-[8px] shadow-xs flex items-center gap-1.5"
                  >
                    {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    <span>Confirm Sample Collected</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. RESULT ENTRY SLIDE-OVER DRAWER (WITH REAL-TIME ABNORMAL FLAGGING) */}
      {/* ========================================================================= */}
      {isResultDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isActionLoading && setIsResultDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
              
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-[8px] bg-[#0d6157]/10 text-[#0d6157] flex items-center justify-center font-bold">
                    <FlaskConical className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Diagnostic Results Entry</h2>
                    <p className="text-xs text-slate-500">
                      Patient: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.patient.name}</span> • Test: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.testName}</span> (Specimen: {selectedOrder.specimenId || 'N/A'})
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsResultDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Parameters Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Measured Test Parameters
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddCustomParameter}
                      className="text-xs font-bold text-[#0d6157] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="size-3" />
                      <span>Add Parameter</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {resultParameters.map((param, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-[8px] border transition-all grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center',
                          param.flag === 'HIGH'
                            ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
                            : param.flag === 'LOW'
                            ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        )}
                      >
                        {/* Parameter Name */}
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Parameter</label>
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) => {
                              const copy = [...resultParameters];
                              if (copy[index]) {
                                copy[index] = { ...copy[index], name: e.target.value };
                                setResultParameters(copy);
                              }
                            }}
                            className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1.5 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Observed Value */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Observed Value</label>
                          <input
                            type="text"
                            placeholder="e.g. 14.2"
                            value={param.value}
                            onChange={(e) => handleParameterValueChange(index, e.target.value)}
                            className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1.5 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Unit */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Unit</label>
                          <input
                            type="text"
                            placeholder="g/dL"
                            value={param.unit}
                            onChange={(e) => {
                              const copy = [...resultParameters];
                              if (copy[index]) {
                                copy[index] = { ...copy[index], unit: e.target.value };
                                setResultParameters(copy);
                              }
                            }}
                            className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1.5 text-slate-900 dark:text-white font-mono"
                          />
                        </div>

                        {/* Normal Range & Flag */}
                        <div className="sm:col-span-3 flex items-center justify-between gap-1.5">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Ref Range / Flag</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[70px]" title={param.referenceRange}>
                                {param.referenceRange || 'Standard'}
                              </span>
                              {param.flag === 'HIGH' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">HIGH</span>
                              ) : param.flag === 'LOW' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">LOW</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">OK</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParameter(index)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pathologist Remark */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pathologist Clinical Impression / Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Findings correlate with mild microcytic hypochromic anemia. Recommend iron profile..."
                    value={resultSummaryNotes}
                    onChange={(e) => setResultSummaryNotes(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Drawer Sticky Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsResultDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-[8px]"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleSaveResults('IN_PROGRESS')}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-[8px]"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleSaveResults('COMPLETED')}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-xs flex items-center gap-1.5"
                  >
                    {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    <span>Verify &amp; Release Final Results</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. NEW DIRECT LAB ORDER DRAWER */}
      {/* ========================================================================= */}
      {isNewOrderDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isActionLoading && setIsNewOrderDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
              
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-[8px] bg-[#0d6157]/10 text-[#0d6157] flex items-center justify-center font-bold">
                    <Plus className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Lab Requisition</h2>
                    <p className="text-xs text-slate-500">Direct walk-in or physician diagnostic test order</p>
                  </div>
                </div>
                <button onClick={() => setIsNewOrderDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewOrder} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* 1. Customer / Patient Type Selector (Walk-in vs Clinic Patient) */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-[10px] border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Customer / Patient Type *
                    </span>
                    <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setLabCustomerType('WALK_IN');
                          setNewOrderData((prev) => ({ ...prev, patientId: '' }));
                        }}
                        className={cn(
                          "px-3 py-1 rounded-[6px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                          labCustomerType === 'WALK_IN'
                            ? "bg-[#0d6157] text-white shadow-2xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        <User className="size-3.5" />
                        <span>Walk-in Customer (Retail)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLabCustomerType('CLINIC_PATIENT');
                          setIsPatientDropdownOpen(false);
                        }}
                        className={cn(
                          "px-3 py-1 rounded-[6px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                          labCustomerType === 'CLINIC_PATIENT'
                            ? "bg-[#0d6157] text-white shadow-2xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        <Stethoscope className="size-3.5" />
                        <span>Clinic Registered Patient</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Walk-in Customer Fields */}
                  {labCustomerType === 'WALK_IN' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Customer / Patient Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Zeeshan Tariq"
                            value={walkInName}
                            onChange={(e) => setWalkInName(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157]"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Contact Phone Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 0501234567 or +966..."
                            value={walkInPhone}
                            onChange={(e) => setWalkInPhone(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Gender
                          </label>
                          <select
                            value={walkInGender}
                            onChange={(e) => setWalkInGender(e.target.value as any)}
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                          >
                            <option value="">Unspecified</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Age / Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 32 yrs"
                            value={walkInAge}
                            onChange={(e) => setWalkInAge(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                        ⚡ Direct walk-in diagnostic order. Customer profile is saved automatically without requiring prior clinic registration.
                      </p>
                    </div>
                  ) : (
                    /* Mode 2: Clinic Registered Patient */
                    <div className="space-y-3" ref={patientDropdownRef}>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                            Search Clinic Patient (Name, Phone, MRN / File #) *
                          </label>
                          {selectedClinicPatient && (
                            <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> Patient Selected
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Click or type to search clinic patient name, phone, or MRN..."
                            value={patientSearchTerm}
                            onClick={() => setIsPatientDropdownOpen(true)}
                            onFocus={() => setIsPatientDropdownOpen(true)}
                            onChange={(e) => {
                              setPatientSearchTerm(e.target.value);
                              setIsPatientDropdownOpen(true);
                            }}
                            className="w-full pl-8.5 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d8276]"
                          />
                          {patientSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setPatientSearchTerm('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Floating Dropdown list of matching patients */}
                        {isPatientDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] shadow-xl divide-y divide-slate-100 dark:divide-slate-800 z-50">
                            {filteredClinicPatients.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No registered clinic patients matching "{patientSearchTerm}"
                              </div>
                            ) : (
                              filteredClinicPatients.map((p) => {
                                const isSelected = selectedClinicPatient?.id === p.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedClinicPatient(p);
                                      setNewOrderData((prev) => ({ ...prev, patientId: p.id }));
                                      setIsPatientDropdownOpen(false);
                                      setPatientSearchTerm('');
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer",
                                      isSelected
                                        ? "bg-teal-50 dark:bg-teal-950/40 text-[#0d6157] dark:text-teal-300 font-bold"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                                    )}
                                  >
                                    <div>
                                      <p className="font-semibold">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        MRN #{p.fileNumber || '---'} • {p.phone} {p.gender ? `(${p.gender})` : ''}
                                      </p>
                                    </div>
                                    {isSelected && <Check className="size-4 text-[#0d6157]" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Patient Details Banner */}
                      {selectedClinicPatient && (
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-[8px] border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-[6px] bg-[#0d6157]/10 text-[#0d6157] dark:text-teal-300 font-bold flex items-center justify-center text-xs">
                              {selectedClinicPatient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {selectedClinicPatient.name}
                              </p>
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                                MRN #{selectedClinicPatient.fileNumber || '---'} • {selectedClinicPatient.phone}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-[#0d6157] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            Verified Patient
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Diagnostic Tests Attachment Section */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-[10px] border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <TestTube className="size-4 text-[#0d6157]" />
                        <span>Attach Diagnostic Tests</span>
                        <span className="ml-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#0d6157]/10 text-[#0d6157] dark:text-teal-400">
                          {selectedTestsList.length} {selectedTestsList.length === 1 ? 'Test' : 'Tests'} Attached
                        </span>
                      </h3>
                      <p className="text-[10.5px] text-slate-500">
                        Search catalog or add tests. You can attach multiple tests for this patient.
                      </p>
                    </div>

                    {/* Create Catalog Test Button in Header */}
                    <button
                      type="button"
                      onClick={handleOpenCreateCatalog}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#0d6157] dark:text-teal-300 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-[6px] hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="size-3" />
                      <span>+ Create Catalog Test</span>
                    </button>
                  </div>

                  {/* Search / Add Test Bar */}
                  <div className="relative" ref={testDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search test catalog by name or code (e.g. CBC, Lipid, Liver, Glucose)..."
                        value={testSearchTerm}
                        onClick={() => setIsTestDropdownOpen(true)}
                        onFocus={() => setIsTestDropdownOpen(true)}
                        onChange={(e) => {
                          setTestSearchTerm(e.target.value);
                          setIsTestDropdownOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredCatalogTests[0]) {
                              handleAddTestToRequisition(filteredCatalogTests[0]);
                            } else if (testSearchTerm.trim()) {
                              handleAddCustomTestToRequisition(testSearchTerm);
                            }
                          }
                        }}
                        className="w-full pl-8.5 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d8276]"
                      />
                      {testSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setTestSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Floating Test Search Dropdown - max 5 items visible height with scrollbar */}
                    {isTestDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] shadow-xl divide-y divide-slate-100 dark:divide-slate-800 z-50">
                        {filteredCatalogTests.length > 0 ? (
                          filteredCatalogTests.map((t) => {
                            const isAlreadyAdded = selectedTestsList.some(
                              (s) =>
                                (s.testCode && t.code && s.testCode.toLowerCase() === t.code.toLowerCase()) ||
                                s.testName.toLowerCase().trim() === t.name.toLowerCase().trim()
                            );
                            return isAlreadyAdded ? (
                              <div
                                key={t.id || t.code}
                                className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400 line-through">{t.name}</span>
                                    {t.code && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                                        {t.code}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10.5px] text-slate-400 font-mono">
                                    {t.category} • {t.sampleType || 'Blood'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-slate-400">
                                    SAR {(Number(t.price) || 0).toFixed(2)}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    <Check className="size-3" /> Added
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <button
                                key={t.id || t.code}
                                type="button"
                                onClick={() => handleAddTestToRequisition(t)}
                                className="w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between hover:bg-teal-50/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900 dark:text-white">{t.name}</span>
                                    {t.code && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        {t.code}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10.5px] text-slate-400 font-mono">
                                    {t.category} • Specimen: {t.sampleType || 'Blood'} {t.containerType ? `(${t.containerType})` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#0d6157] dark:text-teal-400 font-mono">
                                    SAR {(Number(t.price) || 0).toFixed(2)}
                                  </span>
                                  <span className="p-1 px-2 rounded bg-[#0d6157]/10 text-[#0d6157] dark:text-teal-300 text-[10px] font-bold flex items-center gap-1">
                                    <Plus className="size-3" /> Add
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No catalog tests matching "{testSearchTerm}"
                          </div>
                        )}

                        {/* Option to add custom test from typed query */}
                        {testSearchTerm.trim() && (
                          <button
                            type="button"
                            onClick={() => handleAddCustomTestToRequisition(testSearchTerm)}
                            className="w-full text-left px-3.5 py-2.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between cursor-pointer border-t border-slate-100 dark:border-slate-800"
                          >
                            <span className="flex items-center gap-1.5">
                              <Plus className="size-3.5" />
                              <span>Add "<strong>{testSearchTerm}</strong>" as custom test</span>
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                              Add Custom
                            </span>
                          </button>
                        )}

                        {/* Option to create new test in catalog permanently */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setIsTestDropdownOpen(false);
                              handleOpenCreateCatalog();
                            }}
                            className="w-full py-1.5 px-3 text-xs font-bold text-[#0d6157] dark:text-teal-300 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/80 rounded-[6px] hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Plus className="size-3.5" />
                            <span>+ Create New Test in Catalog</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Empty state when no tests attached */}
                  {selectedTestsList.length === 0 && (
                    <div className="py-4 px-3 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-[8px] text-slate-400 dark:text-slate-500 text-xs">
                      No tests attached yet. Search test catalog above to attach diagnostic tests.
                    </div>
                  )}

                  {/* Attached Tests Table / Itemized List */}
                  {selectedTestsList.length > 0 && (
                    <div className="space-y-2">
                      <div className="border border-slate-200 dark:border-slate-700 rounded-[8px] overflow-hidden bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedTestsList.map((test, index) => (
                          <div
                            key={test.id}
                            className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className="size-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {test.testName}
                                  </span>
                                  {test.testCode && (
                                    <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      {test.testCode}
                                    </span>
                                  )}
                                  <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950 text-[#0d6157] dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                                    {test.category}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Sample: {test.sampleType || 'Blood'} {test.tubeType ? `• ${test.tubeType}` : ''}
                                </p>
                              </div>
                            </div>

                            {/* Price edit and remove action */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <div className="flex items-center gap-1">
                                <span className="text-[10.5px] font-mono font-bold text-slate-500">SAR</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={test.price}
                                  onChange={(e) =>
                                    handleUpdateTestItem(test.id, { price: parseFloat(e.target.value) || 0 })
                                  }
                                  className="w-20 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1 text-slate-900 dark:text-white text-right"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTestFromRequisition(test.id)}
                                title="Remove test"
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary Banner */}
                      <div className="p-3 bg-[#0d6157]/5 dark:bg-teal-950/30 rounded-[8px] border border-[#0d6157]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                            <span>Requisition Summary ({selectedTestsList.length} Tests)</span>
                          </div>
                          {requiredSpecimenTypes.length > 0 && (
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-500 dark:text-slate-400 flex-wrap">
                              <span>Containers needed:</span>
                              {requiredSpecimenTypes.map((spec) => (
                                <span key={spec} className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Amount</span>
                          <span className="text-base font-extrabold text-[#0d6157] dark:text-teal-400 font-mono">
                            SAR {totalRequisitionPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Ordering Doctor & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Ordering Physician (Optional)
                    </label>
                    <select
                      value={newOrderData.doctorId}
                      onChange={(e) => setNewOrderData({ ...newOrderData, doctorId: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                    >
                      <option value="">Direct / Self Walk-in</option>
                      {allDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.name} ({d.specialty || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={newOrderData.priority}
                      onChange={(e) => setNewOrderData({ ...newOrderData, priority: e.target.value as any })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="URGENT">Urgent</option>
                      <option value="STAT_EMERGENCY">🚨 STAT Emergency</option>
                    </select>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Special Clinical Instructions / Indication
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Patient reports weakness and fatigue..."
                    value={newOrderData.clinicalNotes}
                    onChange={(e) => setNewOrderData({ ...newOrderData, clinicalNotes: e.target.value })}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0 flex items-center justify-between z-10">
                <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {selectedTestsList.length > 0 ? (
                    <span>{selectedTestsList.length} {selectedTestsList.length === 1 ? 'Test' : 'Tests'} • Total: <strong className="text-[#0d6157] dark:text-teal-400">SAR {totalRequisitionPrice.toFixed(2)}</strong></span>
                  ) : (
                    <span className="text-slate-400">No tests attached</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsNewOrderDrawerOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-[8px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading || selectedTestsList.length === 0}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    <span>
                      {selectedTestsList.length <= 1
                        ? 'Create Lab Requisition'
                        : `Create Lab Requisition (${selectedTestsList.length} Tests)`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PRINTABLE DIAGNOSTIC LABORATORY REPORT MODAL */}
      {/* ========================================================================= */}
      {isReportModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-[8px] max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Laboratory Diagnostic Report Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[6px] shadow-xs cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  <span>Print Diagnostic Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div id="printable-lab-report" className="space-y-6 font-sans">
              
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {clinicName}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">Department of Pathology &amp; Clinical Diagnostics</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">ISO 15189 Accredited Clinical Laboratory</p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded font-mono">
                    {selectedOrder.orderNumber}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Specimen Barcode: {selectedOrder.specimenId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Demographics */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-[6px] border border-slate-200 text-xs">
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-500 font-medium">Patient Name:</span> <span className="font-bold text-slate-900">{selectedOrder.patient.name}</span>
                    {selectedOrder.patient.tags?.includes('WALK_IN_CUSTOMER') || !selectedOrder.patient.fileNumber ? (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Walk-in</span>
                    ) : (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-[#0d6157]">Clinic Patient</span>
                    )}
                  </p>
                  <p><span className="text-slate-500 font-medium">MRN / File #:</span> <span className="font-mono font-bold">{selectedOrder.patient.fileNumber ? `MRN #${selectedOrder.patient.fileNumber}` : 'Walk-in (No MRN)'}</span></p>
                  <p><span className="text-slate-500 font-medium">Gender / Phone:</span> {selectedOrder.patient.gender || 'N/A'} • {selectedOrder.patient.phone && !selectedOrder.patient.phone.startsWith('walkin-') ? selectedOrder.patient.phone : 'Direct Retail'}</p>
                </div>
                <div className="space-y-1 text-right sm:text-left">
                  <p><span className="text-slate-500 font-medium">Referring Doctor:</span> <span className="font-bold text-slate-900">{selectedOrder.doctor ? `Dr. ${selectedOrder.doctor.name}` : 'Direct / Self Walk-in'}</span></p>
                  <p><span className="text-slate-500 font-medium">Sample Collected:</span> {selectedOrder.collectedAt ? new Date(selectedOrder.collectedAt).toLocaleString() : 'N/A'}</p>
                  <p><span className="text-slate-500 font-medium">Report Released:</span> {selectedOrder.verifiedAt ? new Date(selectedOrder.verifiedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              {/* Test Name & Results Table */}
              <div>
                <div className="bg-slate-800 text-white px-4 py-2 rounded-t-[6px] flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider">
                    {selectedOrder.testName} ({selectedOrder.category})
                  </h2>
                  <span className="text-[11px] font-mono text-slate-300">Specimen: {selectedOrder.sampleType}</span>
                </div>

                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Test Parameter</th>
                      <th className="py-2.5 px-4 font-bold text-center">Observed Result</th>
                      <th className="py-2.5 px-4">Unit</th>
                      <th className="py-2.5 px-4">Reference Interval</th>
                      <th className="py-2.5 px-4 text-center">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOrder.resultsJson && selectedOrder.resultsJson.length > 0 ? (
                      selectedOrder.resultsJson.map((param, i) => (
                        <tr key={i} className={param.flag === 'HIGH' || param.flag === 'LOW' ? 'bg-rose-50/40 font-semibold' : ''}>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{param.name}</td>
                          <td className="py-2.5 px-4 font-bold text-center text-slate-900">{param.value}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{param.unit}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{param.referenceRange || 'Standard'}</td>
                          <td className="py-2.5 px-4 text-center">
                            {param.flag === 'HIGH' ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">HIGH</span>
                            ) : param.flag === 'LOW' ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">LOW</span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 text-center text-slate-500 italic">
                          Results pending or summary only
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Remarks Section */}
              {selectedOrder.resultsSummary && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs">
                  <p className="font-bold text-slate-800 mb-1">Pathologist Interpretation &amp; Remarks:</p>
                  <p className="text-slate-700 italic">{selectedOrder.resultsSummary}</p>
                </div>
              )}

              {/* Signatures Footer */}
              <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">Sample Processed By:</p>
                  <p className="font-bold text-slate-800">{selectedOrder.collectedBy?.name || labTechName}</p>
                  <p className="text-[10px] text-slate-400">Medical Laboratory Technologist</p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 text-[11px] font-bold mb-1">
                    <CheckCircle2 className="size-3.5" />
                    <span>Electronically Verified &amp; Signed</span>
                  </div>
                  <p className="font-bold text-slate-800">{selectedOrder.verifiedBy?.name || 'Consultant Pathologist'}</p>
                  <p className="text-[10px] text-slate-400">Consultant Clinical Pathologist, MD</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CREATE / EDIT LAB TEST CATALOG MODAL */}
      {/* ========================================================================= */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isActionLoading && setIsCatalogModalOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
              
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-[8px] bg-[#0d6157]/10 text-[#0d6157] flex items-center justify-center font-bold">
                    <FlaskConical className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingCatalogTest ? 'Edit Catalog Test Panel' : 'Add Test to Laboratory Catalog'}
                    </h2>
                    <p className="text-xs text-slate-500">Configure diagnostic test code, specimen requirements, and parameters</p>
                  </div>
                </div>
                <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCatalogTest} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Test Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CBC, LFT, FBS"
                      value={catalogFormData.code}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white uppercase"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Full Test Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Complete Blood Count (CBC)"
                      value={catalogFormData.name}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Department / Category
                    </label>
                    <select
                      value={catalogFormData.category}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, category: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Hematology">Hematology</option>
                      <option value="Immunology">Immunology</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Pathology">Pathology</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Urinalysis">Urinalysis</option>
                      <option value="Molecular Diagnostics">Molecular Diagnostics</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Sample Specimen Type
                    </label>
                    <input
                      type="text"
                      placeholder="Whole Blood, Serum, Plasma, Urine..."
                      value={catalogFormData.sampleType}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, sampleType: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Container / Tube Type
                    </label>
                    <input
                      type="text"
                      placeholder="Lavender (EDTA), SST..."
                      value={catalogFormData.containerType}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, containerType: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Turnaround Time (Hours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={catalogFormData.turnaroundHours}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, turnaroundHours: parseInt(e.target.value) || 24 })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Price (SAR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={catalogFormData.price}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    General Reference Range / Normal Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 70 - 99 mg/dL or Negative / Non-Reactive"
                    value={catalogFormData.normalRange}
                    onChange={(e) => setCatalogFormData({ ...catalogFormData, normalRange: e.target.value })}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] p-2 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Sub-Parameters List */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Sub-Parameters &amp; Reference Ranges ({catalogFormData.parametersJson.length})
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCatalogFormData((prev) => ({
                          ...prev,
                          parametersJson: [
                            ...prev.parametersJson,
                            { name: '', unit: '', normalMin: '' as any, normalMax: '' as any, referenceRange: '' },
                          ],
                        }))
                      }
                      className="text-xs font-bold text-[#0d6157] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="size-3" />
                      <span>Add Sub-Parameter</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {catalogFormData.parametersJson.map((param, pIdx) => (
                      <div key={pIdx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-[8px] border border-slate-200 dark:border-slate-700">
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Parameter name"
                            value={param.name}
                            onChange={(e) => {
                              const copy = [...catalogFormData.parametersJson];
                              if (copy[pIdx]) copy[pIdx] = { ...copy[pIdx], name: e.target.value };
                              setCatalogFormData({ ...catalogFormData, parametersJson: copy });
                            }}
                            className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1.5 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Unit (g/dL)"
                            value={param.unit}
                            onChange={(e) => {
                              const copy = [...catalogFormData.parametersJson];
                              if (copy[pIdx]) copy[pIdx] = { ...copy[pIdx], unit: e.target.value };
                              setCatalogFormData({ ...catalogFormData, parametersJson: copy });
                            }}
                            className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1.5 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            step="any"
                            placeholder="Min"
                            value={param.normalMin}
                            onChange={(e) => {
                              const copy = [...catalogFormData.parametersJson];
                              if (copy[pIdx]) copy[pIdx] = { ...copy[pIdx], normalMin: e.target.value as any };
                              setCatalogFormData({ ...catalogFormData, parametersJson: copy });
                            }}
                            className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1.5 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            step="any"
                            placeholder="Max"
                            value={param.normalMax}
                            onChange={(e) => {
                              const copy = [...catalogFormData.parametersJson];
                              if (copy[pIdx]) copy[pIdx] = { ...copy[pIdx], normalMax: e.target.value as any };
                              setCatalogFormData({ ...catalogFormData, parametersJson: copy });
                            }}
                            className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] p-1.5 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setCatalogFormData((prev) => ({
                                ...prev,
                                parametersJson: prev.parametersJson.filter((_, i) => i !== pIdx),
                              }))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove parameter"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

                {/* Fixed Drawer Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0 flex items-center justify-end gap-2.5 z-10">
                  <button
                    type="button"
                    onClick={() => setIsCatalogModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-[8px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-xs flex items-center gap-1.5"
                  >
                    {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    <span>{editingCatalogTest ? 'Update Test Panel' : 'Save to Database Catalog'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-[12px] border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                <Trash2 className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {deleteModalState.type === 'SINGLE'
                    ? 'Delete Laboratory Test?'
                    : `Delete ${deleteModalState.count} Laboratory Tests?`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {deleteModalState.type === 'SINGLE' ? (
                    <>
                      Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{deleteModalState.testName}</span> (<span className="font-mono">{deleteModalState.testCode}</span>) from the clinic catalog? This will permanently remove it from the database.
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{deleteModalState.count} selected test panels</span> from the clinic database? This action cannot be undone.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalState({ isOpen: false, type: 'SINGLE' })}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-[8px] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isActionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
