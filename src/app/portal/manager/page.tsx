import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { toDateKey, startOfLocalDay, endOfLocalDay } from '@/lib/time/timezone';
import {
  ManagerPortalView,
  type ManagerStaffMember,
  type ManagerCashAudit,
  type ManagerApprovalRequest,
} from '@/components/dashboard/manager/ManagerPortalView';

export const metadata: Metadata = { title: 'Clinic Operations & Management Hub' };
export const dynamic = 'force-dynamic';

export default async function ClinicManagerPage() {
  const { user, clinicId } = await requireClientUser();

  const timezone = 'Asia/Riyadh';
  const now = new Date();
  const todayKey = toDateKey(now, timezone);
  const todayStart = startOfLocalDay(todayKey, timezone);
  const todayEnd = endOfLocalDay(todayKey, timezone);

  const [clinic, staffUsers, todayAppointments, rawDayClosings, rawItemRequests, paymentsToday, activeDoctors] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true },
    }),
    prisma.user.findMany({
      where: {
        clinicId: clinicId!,
        role: { in: ['DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'COORDINATOR', 'LAB_TECHNICIAN', 'MANAGER'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId: clinicId!,
        startsAt: { gte: todayStart, lte: todayEnd },
      },
      select: { id: true, status: true },
    }),
    prisma.dayEndClosing.findMany({
      where: { clinicId: clinicId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.itemRequest.findMany({
      where: { clinicId: clinicId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: true,
      },
    }),
    prisma.paymentTransaction.findMany({
      where: {
        clinicId: clinicId!,
        paymentDate: { gte: todayStart, lte: todayEnd },
      },
      select: { amount: true, method: true },
    }),
    prisma.doctor.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const todayRevenue = paymentsToday.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Map real staff roster from database
  const staffList: ManagerStaffMember[] = staffUsers.map((s) => ({
    id: s.id,
    name: s.name || s.email,
    email: s.email,
    role: s.role as ManagerStaffMember['role'],
    status: 'ON_DUTY',
    shiftTime: '08:00 AM - 05:00 PM',
    location:
      s.role === 'DOCTOR'
        ? 'Clinic Room 102'
        : s.role === 'NURSE'
        ? 'Triage Station A'
        : s.role === 'PHARMACIST'
        ? 'Main Dispensary'
        : s.role === 'RECEPTIONIST'
        ? 'Front Desk Terminal 1'
        : s.role === 'LAB_TECHNICIAN'
        ? 'Diagnostics Laboratory'
        : s.role === 'MANAGER'
        ? 'Operations Office'
        : 'Care Management Desk',
  }));

  // Map real cash audits from database
  const cashAudits: ManagerCashAudit[] = rawDayClosings.map((c) => ({
    id: c.id,
    receptionistName: 'Reception Team',
    terminalName: c.closingNumber || 'Main Desk Terminal',
    openingCash: Number(c.openingCash || 0),
    cashCollected: Number(c.countedCash || 0),
    cardCollected: Number(c.totalCardAmount || 0),
    totalCollected: Number(c.totalRevenue || 0),
    expectedInDrawer: Number(c.expectedCash || 0),
    actualInDrawer: Number(c.countedCash || 0),
    discrepancy: Number(c.cashDifference || 0),
    status: c.status === 'VERIFIED' ? 'APPROVED' : 'PENDING_AUDIT',
    submittedAt: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  // Map real approvals from database
  const approvals: ManagerApprovalRequest[] = rawItemRequests.map((req) => ({
    id: req.id,
    requestType: 'STOCK_REQUEST',
    requestedBy: 'Clinical Department',
    requesterRole: 'Department Staff',
    title: req.requestNumber || 'Consumables & Medication Restock',
    itemsCount: req.items.length,
    status: req.status === 'APPROVED' ? 'APPROVED' : req.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
    createdAt: new Date(req.createdAt).toLocaleDateString(),
  }));

  return (
    <ManagerPortalView
      clinicName={clinic?.name || 'Clinic'}
      managerName={user.name || user.email || 'Operations Manager'}
      staffList={staffList}
      cashAudits={cashAudits}
      approvals={approvals}
      todayRevenue={todayRevenue}
      appointmentsCount={todayAppointments.length}
      doctors={activeDoctors}
    />
  );
}
