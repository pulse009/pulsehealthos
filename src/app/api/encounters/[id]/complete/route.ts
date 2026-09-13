import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;
    const { id } = await context.params;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const whereClause: any = { id };
    if (clinicId) whereClause.clinicId = clinicId;

    const existing = await prisma.clinicalEncounter.findFirst({
      where: whereClause,
      include: { appointment: true },
    });

    if (!existing) {
      throw notFound('Encounter not found');
    }

    const now = new Date();

    // Run transaction to finalize encounter, appointment, and process IN_HOUSE lab billing
    const result = await prisma.$transaction(async (tx) => {
      const updatedEncounter = await tx.clinicalEncounter.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
        },
        include: {
          patient: true,
          doctor: true,
          appointment: {
            include: {
              service: true,
            },
          },
        },
      });

      // 2. Note: We DO NOT mark the Appointment as COMPLETED here.
      // The doctor has concluded consultation, but the patient must proceed to Reception
      // to pay their consultation/service fee and collect their prescription.
      // If the appointment is in CONFIRMED or PENDING, update to CHECKED_IN so it stays active at reception.
      if (existing.appointmentId) {
        const currentApp = await tx.appointment.findUnique({
          where: { id: existing.appointmentId },
          select: { status: true },
        });

        if (currentApp && currentApp.status !== 'CHECKED_IN' && currentApp.status !== 'COMPLETED') {
          await tx.appointment.update({
            where: { id: existing.appointmentId },
            data: {
              status: 'CHECKED_IN',
            },
          });
        }
      }

      // 3. ─── Prepare / Update Reception Billing (Consultation Service Fee) ───
      const targetAppointmentId = existing.appointmentId;
      const activeClinicId = existing.clinicId;

      if (targetAppointmentId) {
        const servicePrice = updatedEncounter.appointment?.service?.priceMinor
          ? updatedEncounter.appointment.service.priceMinor / 100
          : 0;
        const serviceName = updatedEncounter.appointment?.service?.name || 'Doctor Consultation';

        // Check if an invoice already exists for this appointment
        let invoice = await tx.invoice.findUnique({
          where: { appointmentId: targetAppointmentId },
          include: { items: true },
        });

        if (invoice) {
          // Check if consultation item is already in invoice
          const consultationDesc = `Consultation: ${serviceName}`;
          const hasConsultation = invoice.items.some(
            (it) => it.description.includes('Consultation') || it.serviceId === updatedEncounter.appointment?.serviceId
          );

          if (!hasConsultation && (servicePrice > 0 || updatedEncounter.appointment?.serviceId)) {
            await tx.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                serviceId: updatedEncounter.appointment?.serviceId || undefined,
                description: consultationDesc,
                quantity: 1,
                unitPrice: servicePrice,
                totalPrice: servicePrice,
              },
            });

            const newSubtotal = invoice.subtotal + servicePrice;
            const newTotal = Math.max(0, newSubtotal - invoice.discountAmount + invoice.taxAmount);
            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                subtotal: newSubtotal,
                totalAmount: newTotal,
              },
            });
          }
        } else {
          // Create a new invoice for this appointment with consultation service item
          const datePrefix = `INV-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
          const invCount = await tx.invoice.count({
            where: { clinicId: activeClinicId },
          });
          const invoiceNumber = `${datePrefix}-${(invCount + 1).toString().padStart(4, '0')}`;

          const itemsData: Array<{
            serviceId?: string;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
          }> = [];

          let subtotal = 0;

          if (servicePrice > 0 || updatedEncounter.appointment?.serviceId) {
            itemsData.push({
              serviceId: updatedEncounter.appointment?.serviceId || undefined,
              description: `Consultation: ${serviceName}`,
              quantity: 1,
              unitPrice: servicePrice,
              totalPrice: servicePrice,
            });
            subtotal += servicePrice;
          }

          if (itemsData.length > 0) {
            await tx.invoice.create({
              data: {
                clinicId: activeClinicId,
                invoiceNumber,
                appointmentId: targetAppointmentId,
                patientId: existing.patientId,
                doctorId: existing.doctorId,
                issueDate: now,
                status: 'ISSUED',
                subtotal,
                discountAmount: 0,
                taxAmount: 0,
                totalAmount: subtotal,
                paidAmount: 0,
                currency: updatedEncounter.appointment?.service?.currency || 'SAR',
                createdById: user.id,
                items: {
                  create: itemsData,
                },
              },
            });
          }
        }
      }

      return updatedEncounter;
    }, { maxWait: 15000, timeout: 30000 });

    return NextResponse.json({ encounter: result, success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
