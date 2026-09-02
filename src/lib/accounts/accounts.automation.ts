import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import {
  sendPostTreatmentBillingWhatsAppNotification,
  sendPaymentReceiptWhatsAppNotification,
} from '@/lib/whatsapp/notifications.service';

/**
 * Triggered whenever an appointment is marked as COMPLETED by the attending doctor.
 * 1. Automatically generates the patient Invoice if not already created.
 * 2. Automatically dispatches the post-treatment WhatsApp message with fee summary
 *    and prompts the patient to settle at the front desk reception via Cash or Card.
 */
export async function handleAppointmentCompleted(appointmentId: string): Promise<any> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, phone: true, fileNumber: true } },
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, priceMinor: true } },
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true } },
      },
    });

    if (!appointment) return null;

    let invoice = appointment.invoice;

    // 1. If no invoice exists, auto-create the invoice for this appointment
    if (!invoice) {
      const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
      const count = await prisma.invoice.count({
        where: {
          clinicId: appointment.clinicId,
          invoiceNumber: { startsWith: `INV-${yearMonth}` },
        },
      });
      const invoiceNumber = `INV-${yearMonth}-${String(count + 1).padStart(4, '0')}`;

      const price = appointment.service?.priceMinor ? appointment.service.priceMinor / 100 : 0;
      const description = appointment.service?.name || 'Doctor Clinical Consultation';

      invoice = await prisma.invoice.create({
        data: {
          clinicId: appointment.clinicId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentId: appointment.id,
          invoiceNumber,
          issueDate: new Date(),
          subtotal: price,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: price,
          paidAmount: 0,
          currency: 'SAR',
          status: 'ISSUED',
          notes: `Auto-generated on completion of appointment with ${appointment.doctor?.name || 'Doctor'}`,
          items: {
            create: [
              {
                serviceId: appointment.serviceId,
                description,
                quantity: 1,
                unitPrice: price,
                totalPrice: price,
              },
            ],
          },
        },
        select: { id: true, invoiceNumber: true, totalAmount: true, status: true },
      });
    }

    // 2. Dispatch automated WhatsApp message to patient
    if (appointment.patient?.phone && invoice) {
      await sendPostTreatmentBillingWhatsAppNotification({
        clinicId: appointment.clinicId,
        patientPhone: appointment.patient.phone,
        patientName: appointment.patient.name || 'Valued Patient',
        doctorName: appointment.doctor?.name || 'Clinic Doctor',
        serviceName: appointment.service?.name || 'Medical Consultation',
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      });
    }

    return invoice;
  } catch (error) {
    logger.warn('AUTOMATION_APPOINTMENT_COMPLETED_FAILED', 'Failed in post-completion automation', {
      appointmentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Triggered whenever a payment is recorded against an invoice.
 * 1. Dispatches automated digital tax receipt via WhatsApp to patient.
 */
export async function handleInvoicePaymentRecorded({
  invoiceId,
  amountPaid,
  paymentMethod,
}: {
  invoiceId: string;
  amountPaid: number;
  paymentMethod: string;
}): Promise<boolean> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: { select: { name: true, phone: true } },
      },
    });

    if (!invoice || !invoice.patient?.phone) return false;

    const remainingBalance = Math.max(0, invoice.totalAmount - invoice.paidAmount);

    return await sendPaymentReceiptWhatsAppNotification({
      clinicId: invoice.clinicId,
      patientPhone: invoice.patient.phone,
      patientName: invoice.patient.name || 'Valued Patient',
      invoiceNumber: invoice.invoiceNumber,
      amountPaid,
      paymentMethod,
      remainingBalance,
    });
  } catch (error) {
    logger.warn('AUTOMATION_PAYMENT_RECEIPT_FAILED', 'Failed in payment receipt automation', {
      invoiceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Triggered whenever inventory goods are received from a Purchase Order.
 * Automatically generates the Supplier Bill in Accounts Payable.
 */
export async function handlePurchaseOrderGoodsReceived(purchaseOrderId: string): Promise<any> {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    if (!po) return null;

    const existingBill = await prisma.supplierBill.findFirst({
      where: { purchaseOrderId: po.id },
    });

    if (existingBill) return existingBill;

    const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
    const count = await prisma.supplierBill.count({
      where: {
        clinicId: po.clinicId,
        billNumber: { startsWith: `BILL-${yearMonth}` },
      },
    });
    const billNumber = `BILL-${yearMonth}-${String(count + 1).padStart(4, '0')}`;

    // Due in 30 days by default (Net 30)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const bill = await prisma.supplierBill.create({
      data: {
        clinicId: po.clinicId,
        supplierId: po.supplierId,
        purchaseOrderId: po.id,
        billNumber,
        billDate: new Date(),
        dueDate,
        totalAmount: po.totalAmount,
        paidAmount: 0,
        status: 'UNPAID',
        notes: `Auto-generated from received Purchase Order ${po.poNumber}`,
      },
    });

    return bill;
  } catch (error) {
    logger.warn('AUTOMATION_PO_BILL_FAILED', 'Failed in auto supplier bill generation', {
      purchaseOrderId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
