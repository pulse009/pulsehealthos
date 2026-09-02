import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { sendText, normalizePhone } from '@/lib/whatsapp/client';
import { logger, Events } from '@/lib/logger';
import { env } from '@/env';

export interface SendAppointmentBookingNotificationParams {
  clinicId: string;
  patientPhone: string;
  patientName: string;
  serviceName: string;
  doctorName: string;
  appointmentTime: string; // e.g. "Tuesday, Sep 15, 2026 at 02:15 PM"
  status: string;
  fileNumber?: number | null;
  appointmentNumber?: number | null;
  username?: string;
  temporaryPassword?: string;
}

/**
 * Dispatch a WhatsApp notification to the patient with appointment confirmation
 * and their Portal Login credentials (Username & Password).
 */
export async function sendAppointmentWhatsAppNotification({
  clinicId,
  patientPhone,
  patientName,
  serviceName,
  doctorName,
  appointmentTime,
  status,
  fileNumber,
  appointmentNumber,
  username,
  temporaryPassword,
}: SendAppointmentBookingNotificationParams): Promise<boolean> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, phone: true },
    });

    const clinicTitle = clinic?.name || 'Reveal Skin & Glow Care';
    const appUrl = env.APP_URL || 'https://pulsehealthos.vercel.app';
    const loginUrl = `${appUrl}/login`;

    const formattedFile = fileNumber ? `FR-${String(fileNumber).padStart(3, '0')}` : null;
    const formattedAppt = appointmentNumber ? `AP-${String(appointmentNumber).padStart(3, '0')}` : null;

    let messageBody = `Hello *${patientName}*,\n\n`;
    messageBody += `Your appointment at *${clinicTitle}* has been scheduled successfully! ✅\n\n`;
    messageBody += `📋 *Appointment Details:*\n`;
    if (formattedFile) messageBody += `• *File Number:* ${formattedFile}\n`;
    if (formattedAppt) messageBody += `• *Appointment Number:* ${formattedAppt}\n`;
    messageBody += `• *Service:* ${serviceName}\n`;
    messageBody += `• *Doctor:* ${doctorName}\n`;
    messageBody += `• *Date & Time:* ${appointmentTime}\n`;
    messageBody += `• *Status:* ${status}\n\n`;

    if (username) {
      messageBody += `🔐 *Your Patient Portal Login:*\n`;
      messageBody += `• *Username / File No:* ${username}\n`;
      if (temporaryPassword) {
        messageBody += `• *Temporary Password:* ${temporaryPassword}\n`;
      }
      messageBody += `• *Login Portal:* ${loginUrl}\n\n`;
      messageBody += `_You can log in to view your file, medical history, and upcoming appointments._\n\n`;
    }

    messageBody += `Thank you for choosing ${clinicTitle}. If you have questions, feel free to reply to this message.`;

    const cleanedPhone = normalizePhone(patientPhone);
    if (!cleanedPhone) return false;

    // Send via WhatsApp client
    await sendText(clinicId, cleanedPhone, messageBody);

    logger.info(Events.WHATSAPP_SEND_SUCCESS, 'Sent appointment WhatsApp notification with logins', {
      clinicId,
      phone: cleanedPhone,
      username,
    });

    return true;
  } catch (err) {
    logger.warn(Events.WHATSAPP_SEND_FAILED, 'Failed to send WhatsApp notification', {
      clinicId,
      phone: patientPhone,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Dispatch WhatsApp notification to Doctor or Coordinator with their portal login credentials.
 */
export async function sendStaffWhatsAppCredentialsNotification({
  clinicId,
  phone,
  name,
  roleName,
  username,
  temporaryPassword,
}: {
  clinicId: string;
  phone: string;
  name: string;
  roleName: 'Doctor' | 'Coordinator';
  username: string;
  temporaryPassword?: string;
}): Promise<boolean> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    });

    const clinicTitle = clinic?.name || 'Reveal Skin & Glow Care';
    const appUrl = env.APP_URL || 'https://pulsehealthos.vercel.app';
    const loginUrl = `${appUrl}/login`;

    let messageBody = `Hello *${name}*,\n\n`;
    messageBody += `Welcome to *${clinicTitle}* staff portal!\n\n`;
    messageBody += `🔐 *Your ${roleName} Login Credentials:*\n`;
    messageBody += `• *Username:* ${username}\n`;
    if (temporaryPassword) {
      messageBody += `• *Temporary Password:* ${temporaryPassword}\n`;
    }
    messageBody += `• *Login Link:* ${loginUrl}\n\n`;
    messageBody += `Please log in to manage your appointments, patient files, and schedules.`;

    const cleanedPhone = normalizePhone(phone);
    if (!cleanedPhone) return false;

    await sendText(clinicId, cleanedPhone, messageBody);
    return true;
  } catch (err) {
    logger.warn(Events.WHATSAPP_SEND_FAILED, 'Failed to send staff WhatsApp notification', {
      clinicId,
      phone,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export interface SendPostTreatmentBillingNotificationParams {
  clinicId: string;
  patientPhone: string;
  patientName: string;
  doctorName: string;
  serviceName: string;
  invoiceNumber: string;
  totalAmount: number;
}

/**
 * Dispatch automated WhatsApp message to patient when their appointment is completed by doctor,
 * detailing the consultation/procedure fee and directing them to reception desk for Cash/Card settlement.
 */
export async function sendPostTreatmentBillingWhatsAppNotification({
  clinicId,
  patientPhone,
  patientName,
  doctorName,
  serviceName,
  invoiceNumber,
  totalAmount,
}: SendPostTreatmentBillingNotificationParams): Promise<boolean> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    });

    const clinicTitle = clinic?.name || 'Pulse Health Clinic';
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(totalAmount);

    let message = `Hello *${patientName}*,\n\n`;
    message += `Thank you for your visit to *${clinicTitle}*! 🌟\n\n`;
    message += `Your consultation & treatment with *${doctorName}* is now complete. Here is your invoice summary:\n\n`;
    message += `📋 *Invoice Details:*\n`;
    message += `• *Invoice Number:* \`${invoiceNumber}\`\n`;
    message += `• *Service / Procedure:* ${serviceName}\n`;
    message += `• *Total Amount Due:* *${formattedTotal}*\n\n`;
    message += `💳 *Payment:* Please proceed to the front desk reception counter to settle your bill via *Cash* or *Card (POS)*.\n\n`;
    message += `We hope you had a pleasant experience with us today! 😊`;

    const cleanedPhone = normalizePhone(patientPhone);
    if (!cleanedPhone) return false;

    await sendText(clinicId, cleanedPhone, message);

    logger.info(Events.WHATSAPP_SEND_SUCCESS, 'Sent post-treatment billing WhatsApp notification', {
      clinicId,
      phone: cleanedPhone,
      invoiceNumber,
    });

    return true;
  } catch (err) {
    logger.warn(Events.WHATSAPP_SEND_FAILED, 'Failed to send post-treatment billing notification', {
      clinicId,
      phone: patientPhone,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export interface SendPaymentReceiptNotificationParams {
  clinicId: string;
  patientPhone: string;
  patientName: string;
  invoiceNumber: string;
  amountPaid: number;
  paymentMethod: string;
  remainingBalance: number;
}

/**
 * Dispatch automated WhatsApp Digital Tax Receipt to patient when payment is recorded at front desk.
 */
export async function sendPaymentReceiptWhatsAppNotification({
  clinicId,
  patientPhone,
  patientName,
  invoiceNumber,
  amountPaid,
  paymentMethod,
  remainingBalance,
}: SendPaymentReceiptNotificationParams): Promise<boolean> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    });

    const clinicTitle = clinic?.name || 'Pulse Health Clinic';
    const appUrl = env.APP_URL || 'https://pulsehealthos.vercel.app';
    const receiptUrl = `${appUrl}/portal/accounts/invoices`;

    const formattedPaid = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amountPaid);

    const formattedBalance = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(remainingBalance);

    let message = `🧾 *Official Payment Receipt — ${invoiceNumber}* ✅\n\n`;
    message += `Dear *${patientName}*,\n`;
    message += `We have successfully received your payment at *${clinicTitle}*:\n\n`;
    message += `• *Amount Paid:* *${formattedPaid}*\n`;
    message += `• *Payment Method:* ${paymentMethod}\n`;
    message += `• *Remaining Balance:* ${formattedBalance}\n\n`;
    message += `📄 You can view and download your full invoice receipt here:\n${receiptUrl}\n\n`;
    message += `Thank you for trusting ${clinicTitle}! Wishing you great health and wellness. 🌿`;

    const cleanedPhone = normalizePhone(patientPhone);
    if (!cleanedPhone) return false;

    await sendText(clinicId, cleanedPhone, message);

    logger.info(Events.WHATSAPP_SEND_SUCCESS, 'Sent payment receipt WhatsApp notification', {
      clinicId,
      phone: cleanedPhone,
      invoiceNumber,
      amountPaid,
    });

    return true;
  } catch (err) {
    logger.warn(Events.WHATSAPP_SEND_FAILED, 'Failed to send payment receipt notification', {
      clinicId,
      phone: patientPhone,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
