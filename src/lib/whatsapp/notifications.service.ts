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
