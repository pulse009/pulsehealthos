import 'server-only';
import { formatInstant, formatMinutes, formatTime, toDateKey } from '@/lib/time/timezone';

export type SupportedLocale = 'en' | 'ar';

export const i18n = {
  en: {
    // Steps & Headings
    step1_title: '📅 *Step 1: Select Service*',
    step1_subtitle: 'Please choose the service you want to book:',
    step2_title: '👨‍⚕️ *Step 2: Select Doctor*',
    step2_subtitle: 'Please choose your preferred doctor:',
    step3_title: '📅 *Step 3: Select Preferred Date*',
    step3_subtitle: 'Please choose your preferred day:',
    step4_title: (heading: string, dateKey: string) =>
      `⏰ *Available times for ${heading} — ${dateKey}:*`,
    step4_subtitle: 'Please select your preferred time below:',
    step5_title: '📋 *Appointment Summary*',
    step5_subtitle: 'Please tap *Confirm Booking* to complete your booking:',

    // Field labels
    service_label: 'Service',
    doctor_label: 'Doctor',
    date_label: 'When',
    patient_label: 'Patient',
    minutes_label: 'min',
    selected_service: 'Selected Service',
    any_doctor: '👨‍⚕️ Any Doctor',
    any_available_doctor: 'Any Available Doctor',
    doctor_prefix: 'Dr.',
    guest_patient: 'Guest',
    on_duty_doctor: 'On Duty',
    general_consultation: 'General Consultation',
    checkup_followup: 'Checkup & Follow-up',

    // Buttons
    btn_book_appointment: '📅 Book Appointment',
    btn_book_new_appointment: '📅 Book Appointment',
    btn_services: '📋 Services',
    btn_doctors: '👨‍⚕️ Doctors',
    btn_hours: '⏰ Opening Hours',
    btn_more_times: '➕ More Times',
    btn_change_date: '📅 Change Date',
    btn_other_services: '🔄 Other Services',
    btn_confirm_booking: '✅ Confirm Booking',
    btn_cancel: '❌ Cancel',
    btn_reschedule: '🔄 Reschedule',
    btn_cancel_appointment: '❌ Cancel Appointment',
    btn_confirm_cancel: 'Yes, Cancel',
    btn_keep_appointment: 'No, Keep Appointment',
    btn_visited_yes: 'Yes',
    btn_visited_no: 'No, First Visit',
    btn_book_as_new: '📅 Book as New Patient',
    btn_speak_to_staff: '👨‍💼 Speak to Staff',

    // Relative dates
    today: 'Today',
    tomorrow: 'Tomorrow',
    weekdays: ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    weekdays_short: ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    appointment_number_label: 'Appointment Number',
    file_number_label: 'File Number',

    // Messages
    visited_before_title: (clinicName: string) =>
      `Welcome to ${clinicName}! 👋\n\nHave you visited our clinic before?`,
    ask_file_number:
      '📋 *Please provide your Medical File Number:*\n\nKindly reply with your file number (e.g. *1* or *#1*) so we can locate your medical records and attach your booking to your existing file.',
    file_found_welcome: (name: string, fileNumber: number) =>
      `Welcome back, *${name}*! ✅\nWe found your medical file (*#${fileNumber}*).\n\nHow can we help you today?`,
    file_not_found: (fileNum: string | number) =>
      `We couldn't find a medical file with number *#${fileNum}* in our clinic.\n\nPlease double-check the number or choose an option below:`,
    welcome_new_patient: (clinicName: string) =>
      `Welcome to ${clinicName}! 🎉 We are delighted to assist you with booking your first appointment.\n\nPlease choose an option below to get started:`,
    welcome_returning_patient: (clinicName: string) =>
      `Welcome back to ${clinicName}! 👋\n\nHow can we help you today?`,
    ask_name_and_email:
      '📝 *Please provide your details:*\n\nTo confirm your booking, please reply with your *Full Name* and *Email Address*.\n\n_Example: Sara Ahmed, sara@example.com_',
    details_saved: (name: string, email: string) =>
      `Thank you, *${name}*! ✅\nYour details have been saved (Email: ${email}).`,
    booking_confirmed: (
      service: string,
      doctor: string,
      date: string,
      appointmentNumber?: number | null,
      fileNumber?: number | null,
      _credentials?: { email: string; temporaryPassword?: string; portalUrl?: string } | null,
    ) => {
      let msg = `Your appointment is confirmed ✅\n\n`;
      if (fileNumber) msg += `• *File Number:* #${fileNumber}\n`;
      if (appointmentNumber) msg += `• *Appointment Number:* #${appointmentNumber}\n`;
      msg += `• *Service:* ${service}\n• *Doctor:* ${doctor}\n• *When:* ${date}\n\n`;
      msg += `We look forward to welcoming you!`;
      return msg;
    },
    booking_cancelled: "Booking cancelled. Let us know whenever you'd like to book an appointment.",
    booking_cancelled_success:
      'Your appointment has been cancelled successfully ✅\nFeel free to book a new appointment whenever you are ready.',
    appointment_kept: 'Great, your appointment is kept as scheduled! We look forward to seeing you.',
    cancel_prompt: (service: string, date: string) =>
      `Are you sure you want to cancel this appointment?\n\n• *Service:* ${service}\n• *When:* ${date}`,
    no_upcoming_to_cancel: "You don't have any active upcoming appointments to cancel.",
    no_upcoming_to_reschedule:
      "You don't have an active upcoming appointment to reschedule. Would you like to book a new one?",
    cancel_failed:
      'Could not cancel the appointment. It may already be cancelled or outside the cancellation window.',
    slot_conflict: 'Sorry, that time was just booked. Please choose another available slot.',
    no_slots_date: (serviceName: string) =>
      `Sorry, there are no available slots on this date for *${serviceName}*. Please choose another date or contact us:`,
    no_slots_alternatives: (dateKey: string) =>
      `Sorry, there are no available slots on *${dateKey}*.\nHere are the next available alternatives:`,
    slot_error: 'Sorry, that slot could not be found. Please select an available time from the list.',
    booking_error:
      'Sorry, an error occurred while confirming your booking. Please try again or select another time.',
    human_handoff:
      'I have connected you with our clinic staff. A team member will reply to you shortly 👨‍💼',
    my_appointments_title: '📅 *Your Upcoming Appointments:*',
    no_my_appointments: "You don't have any upcoming appointments scheduled.",
    greeting: (clinicName: string) =>
      `Hello! Welcome to ${clinicName}. I am here to help you book appointments or answer your questions.`,
    location: (clinicName: string, loc: string, phone?: string) =>
      `📍 *${clinicName} Location:*\n${loc}${phone ? `\n📞 Phone: ${phone}` : ''}`,
    hours: (clinicName: string, hoursText: string) =>
      `⏰ *${clinicName} Opening Hours:*\n${hoursText}`,
    services_title: '📋 *Available Services:*',
    services_empty:
      'Our services list is available upon request. Please tell us what you need and we will assist you.',
    doctors_title: '👨‍⚕️ *Our Doctors:*',
    doctors_empty:
      'Our medical team is ready to assist you. Please let us know the service you need.',
  },

  ar: {
    // Steps & Headings
    step1_title: '📅 *الخطوة 1: اختيار الخدمة*',
    step1_subtitle: 'يرجى اختيار الخدمة التي ترغب في حجزها:',
    step2_title: '👨‍⚕️ *الخطوة 2: اختيار الطبيب*',
    step2_subtitle: 'يرجى اختيار الطبيب المفضل لديك:',
    step3_title: '📅 *الخطوة 3: اختيار التاريخ*',
    step3_subtitle: 'يرجى اختيار اليوم المفضل لك:',
    step4_title: (heading: string, dateKey: string) =>
      `⏰ *الأوقات المتاحة لـ (${heading}) في تاريخ ${dateKey}:*`,
    step4_subtitle: 'يرجى الضغط على الوقت المناسب لك أدناه:',
    step5_title: '📋 *ملخص الموعد*',
    step5_subtitle: 'يرجى الضغط على زر *تأكيد الحجز* لإتمام الحجز فوراً:',

    // Field labels
    service_label: 'الخدمة',
    doctor_label: 'الطبيب',
    date_label: 'الموعد',
    patient_label: 'المراجع',
    minutes_label: 'دقيقة',
    selected_service: 'الخدمة المختارة',
    any_doctor: '👨‍⚕️ أي طبيب',
    any_available_doctor: 'أي طبيب متاح',
    doctor_prefix: 'د.',
    guest_patient: 'ضيف العيادة',
    on_duty_doctor: 'المناوب',
    general_consultation: 'استشارة عامة',
    checkup_followup: 'فحص ومتابعة',

    // Buttons
    btn_book_appointment: '📅 حجز موعد',
    btn_book_new_appointment: '📅 حجز موعد جديد',
    btn_services: '📋 الخدمات',
    btn_doctors: '👨‍⚕️ الأطباء',
    btn_hours: '⏰ أوقات العمل',
    btn_more_times: '➕ أوقات أخرى',
    btn_change_date: '📅 اختيار يوم آخر',
    btn_other_services: '🔄 اختيار خدمة أخرى',
    btn_confirm_booking: '✅ تأكيد الحجز',
    btn_cancel: '❌ إلغاء',
    btn_reschedule: '🔄 تعديل الموعد',
    btn_cancel_appointment: '❌ إلغاء الموعد',
    btn_confirm_cancel: 'نعم، إلغاء الموعد',
    btn_keep_appointment: 'لا، إبقاء الموعد',
    btn_visited_yes: 'نعم',
    btn_visited_no: 'لا، أول زيارة',
    btn_book_as_new: '📅 الحجز كمريض جديد',
    btn_speak_to_staff: '👨‍💼 التحدث مع موظف',

    // Relative dates
    today: 'اليوم',
    tomorrow: 'غداً',
    weekdays: ['', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
    weekdays_short: ['', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'],
    months: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],

    appointment_number_label: 'رقم الموعد',
    file_number_label: 'رقم الملف',

    // Messages
    visited_before_title: (clinicName: string) =>
      `مرحباً بك في ${clinicName}! 👋\n\nهل قمت بزيارة عيادتنا من قبل؟`,
    ask_file_number:
      '📋 *يرجى تزويدنا برقم ملفك الطبي:*\n\nيرجى كتابة رقم ملفك في العيادة (مثال: *1* أو *#1*) لنتمكن من مطابقة سجلك الطبي وربط الموعد بملفك.',
    file_found_welcome: (name: string, fileNumber: number) =>
      `أهلاً بك مجدداً، *${name}*! ✅\nتم العثور على ملفك الطبي بنجاح (*#${fileNumber}*).\n\nكيف يمكننا مساعدتك اليوم؟`,
    file_not_found: (fileNum: string | number) =>
      `لم نتمكن من العثور على ملف طبي برقم *#${fileNum}* في العيادة.\n\nيرجى التأكد من الرقم أو اختيار ما يناسبك أدناه:`,
    welcome_new_patient: (clinicName: string) =>
      `أهلاً وسهلاً بك في ${clinicName}! 🎉 يسعدنا ويشرفنا استقبالك وحجز زيارتك الأولى.\n\nيرجى اختيار ما يناسبك أدناه:`,
    welcome_returning_patient: (clinicName: string) =>
      `أهلاً بك مجدداً في ${clinicName}! 👋\n\nكيف يمكننا مساعدتك اليوم؟`,
    ask_name_and_email:
      '📝 *يرجى تزويدنا ببياناتك:*\n\nلتأكيد حجزك، يرجى كتابة *الاسم الكامل* و *البريد الإلكتروني*.\n\n_مثال: سارة أحمد، sara@example.com_',
    details_saved: (name: string, email: string) =>
      `شكراً لك، *${name}*! ✅\nتم حفظ بياناتك بنجاح (البريد: ${email}).`,
    booking_confirmed: (
      service: string,
      doctor: string,
      date: string,
      appointmentNumber?: number | null,
      fileNumber?: number | null,
      _credentials?: { email: string; temporaryPassword?: string; portalUrl?: string } | null,
    ) => {
      let msg = `تم تأكيد موعدك بنجاح ✅\n\n`;
      if (fileNumber) msg += `• *رقم الملف:* #${fileNumber}\n`;
      if (appointmentNumber) msg += `• *رقم الموعد:* #${appointmentNumber}\n`;
      msg += `• *الخدمة:* ${service}\n• *الطبيب:* ${doctor}\n• *الموعد:* ${date}\n\n`;
      msg += `يسعدنا حضوركم ونتمنى لكم دوام الصحة والعافية.`;
      return msg;
    },
    booking_cancelled: 'تم إلغاء الحجز. يسعدنا خدمتك في أي وقت لحجز موعد جديد.',
    booking_cancelled_success:
      'تم إلغاء موعدك بنجاح ✅\nيسعدنا خدمتك في أي وقت لحجز موعد جديد.',
    appointment_kept: 'رائع، تم الإبقاء على موعدك كما هو! نتطلع لرؤيتك في العيادة.',
    cancel_prompt: (service: string, date: string) =>
      `هل أنت متأكد من رغبتك في إلغاء موعدك؟\n\n• *الخدمة:* ${service}\n• *الموعد:* ${date}`,
    no_upcoming_to_cancel: 'ليس لديك أي مواعيد قادمة نشطة حالياً لإلغائها.',
    no_upcoming_to_reschedule: 'ليس لديك أي موعد قادم لتعديله. هل ترغب في حجز موعد جديد؟',
    cancel_failed: 'تعذر إلغاء الموعد، إما لانتهاء مهلة الإلغاء أو لكونه ملغياً مسبقاً.',
    slot_conflict: 'عذرًا، تم حجز هذا الموعد للتو. يرجى اختيار موعد آخر متاح.',
    no_slots_date: (serviceName: string) =>
      `عذراً، لا توجد مواعيد متاحة في هذا اليوم لخدمة *${serviceName}*. يرجى اختيار تاريخ آخر أو التواصل معنا:`,
    no_slots_alternatives: (dateKey: string) =>
      `عذراً، لا توجد أوقات متاحة في تاريخ *${dateKey}*.\nإليك أقرب الأوقات البديلة المتاحة:`,
    slot_error: 'عذراً، لم نتمكن من العثور على هذا الموعد. يرجى اختيار موعد متاح من القائمة.',
    booking_error:
      'نعتذر، حدث خطأ أثناء تأكيد الحجز. يرجى المحاولة مرة أخرى أو اختيار موعد آخر.',
    human_handoff:
      'تم تحويل المحادثة إلى فريق خدمة العملاء في العيادة. سيتواصل معك أحد موظفينا قريباً جداً 👨‍💼',
    my_appointments_title: '📅 *مواعيدك القادمة:*',
    no_my_appointments: 'ليس لديك أي مواعيد قادمة مسجلة حالياً.',
    greeting: (clinicName: string) =>
      `مرحباً بك في ${clinicName}! يسعدني مساعدتك في حجز المواعيد أو الإجابة على استفساراتك.`,
    location: (clinicName: string, loc: string, phone?: string) =>
      `📍 *موقع ${clinicName}:*\n${loc}${phone ? `\n📞 الهاتف: ${phone}` : ''}`,
    hours: (clinicName: string, hoursText: string) =>
      `⏰ *أوقات عمل ${clinicName}:*\n${hoursText}`,
    services_title: '📋 *الخدمات المتوفرة:*',
    services_empty:
      'الخدمات متاحة حالياً عند الطلب. يرجى إخبارنا بما تحتاجه لنساعدك.',
    doctors_title: '👨‍⚕️ *الأطباء والمختصون:*',
    doctors_empty:
      'فريقنا الطبي المتميز جاهز لخدمتكم. تفضل بإخبارنا بالخدمة المطلوبة لنحجز لك مع الطبيب المناسب.',
  },
};

/** Formats a compact date button label that strictly stays <= 20 chars */
export function formatDateButtonLabel(
  date: Date,
  timezone: string,
  locale: SupportedLocale,
  dayOffset: number,
): string {
  const dict = i18n[locale];
  const day = date.getDate();
  const monthIdx = date.getMonth();
  const monthName = dict.months[monthIdx] ?? '';

  if (dayOffset === 0) {
    return `${dict.today} (${day} ${monthName})`.slice(0, 20);
  }
  if (dayOffset === 1) {
    return `${dict.tomorrow} (${day} ${monthName})`.slice(0, 20);
  }

  const weekdayIdx = date.getDay() === 0 ? 7 : date.getDay();
  const weekdayName =
    locale === 'ar' ? dict.weekdays[weekdayIdx] : dict.weekdays_short[weekdayIdx];
  return `${weekdayName} (${day} ${monthName})`.slice(0, 20);
}

const SERVICE_NAME_ARABIC_MAP: Record<string, string> = {
  'anti-aging & collagen therapy': 'علاج الكولاجين والنضارة',
  'deep cleansing & relaxation facial': 'تنظيف عميق واسترخاء للبشرة',
  'laser genesis & skin tightening': 'ليزر جينيسيس وشد البشرة',
  'medical chemical peel': 'تقشير كيميائي طبي',
  'picoway laser rejuvenation': 'تجديد البشرة بليزر بيكوواي',
  'general consultation': 'استشارة عامة',
  'checkup & follow-up': 'فحص ومتابعة',
  'dental checkup': 'فحص الأسنان',
  'root canal': 'علاج العصب',
  'teeth whitening': 'تبييض الأسنان',
  'teeth cleaning': 'تنظيف الأسنان',
  'orthodontic consultation': 'استشارة تقويم الأسنان',
  'botox & fillers': 'بوتوكس وفيلر',
  'hydrafacial': 'هيدرافاشيال',
  'skin care': 'العناية بالبشرة',
  'hair treatment': 'علاج الشعر',
  'dermatology consultation': 'استشارة جلدية',
};

const SERVICE_BUTTON_ARABIC_MAP: Record<string, string> = {
  'anti-aging & collagen therapy': 'علاج الكولاجين',
  'deep cleansing & relaxation facial': 'تنظيف البشرة',
  'laser genesis & skin tightening': 'ليزر شد البشرة',
  'medical chemical peel': 'تقشير كيميائي',
  'picoway laser rejuvenation': 'ليزر بيكو واي',
  'general consultation': 'استشارة عامة',
  'checkup & follow-up': 'فحص ومتابعة',
  'dental checkup': 'فحص الأسنان',
  'root canal': 'علاج العصب',
  'teeth whitening': 'تبييض الأسنان',
  'teeth cleaning': 'تنظيف الأسنان',
  'orthodontic consultation': 'تقويم الأسنان',
  'botox & fillers': 'بوتوكس وفيلر',
  'hydrafacial': 'هيدرافاشيال',
  'skin care': 'العناية بالبشرة',
  'hair treatment': 'علاج الشعر',
  'dermatology consultation': 'استشارة جلدية',
};

const DOCTOR_NAME_ARABIC_MAP: Record<string, string> = {
  'haitham al-gzlan': 'هيثم الغزلان',
  'saud al-obaida': 'سعود العبيدة',
  'marwan al-haddad': 'مروان الحداد',
  'abdulrahman alhuzimi': 'عبدالرحمن الحزيمي',
  'hisham alshaikh': 'هشام الشيخ',
  'ola samman': 'علا سمّان',
  'ahmed': 'أحمد',
  'sara': 'سارة',
  'smith': 'سميث',
};

const SPECIALTY_ARABIC_MAP: Record<string, string> = {
  'consultant dermatologist & laser specialist': 'استشاري جلدية وليزر',
  'consultant dermatologist & aesthetic medicine': 'استشاري جلدية وتجميل',
  'dermatology specialist': 'أخصائي جلدية',
  'cosmetic & laser specialist': 'أخصائي تجميل وليزر',
  'dermatology & aesthetic specialist': 'أخصائي جلدية وتجميل',
  'dentist': 'طبيب أسنان',
  'orthodontist': 'أخصائي تقويم الأسنان',
  'general practitioner': 'طبيب عام',
};

/** Translate service name into the user\'s language */
export function translateServiceName(name: string | null | undefined, locale: SupportedLocale): string {
  if (!name) return locale === 'ar' ? 'الخدمة المختارة' : 'Selected Service';
  if (locale === 'en') return name;

  const key = name.trim().toLowerCase();
  if (SERVICE_NAME_ARABIC_MAP[key]) return SERVICE_NAME_ARABIC_MAP[key];

  if (/anti-?aging/i.test(key)) return 'مكافحة الشيخوخة والنضارة';
  if (/cleansing|facial/i.test(key)) return 'تنظيف واسترخاء البشرة';
  if (/tightening|genesis/i.test(key)) return 'ليزر شد البشرة';
  if (/chemical\s*peel|peeling/i.test(key)) return 'تقشير كيميائي طبي';
  if (/picoway|pigmentation/i.test(key)) return 'ليزر بيكو واي للتجديد';
  if (/laser/i.test(key)) return 'علاج بالليزر';
  if (/consultation|checkup/i.test(key)) return 'استشارة طبية';

  return name;
}

/** Formats a compact button title for a service (strictly <= 20 chars) */
export function formatServiceButtonTitle(name: string, locale: SupportedLocale): string {
  const key = name.trim().toLowerCase();
  if (locale === 'ar') {
    if (SERVICE_BUTTON_ARABIC_MAP[key]) return SERVICE_BUTTON_ARABIC_MAP[key].slice(0, 20);
    const translated = translateServiceName(name, 'ar');
    return translated.slice(0, 20);
  }

  // In English: ensure it's <= 20 chars
  if (name.length <= 20) return name;
  const shortMap: Record<string, string> = {
    'anti-aging & collagen therapy': 'Anti-Aging Therapy',
    'deep cleansing & relaxation facial': 'Deep Cleansing Facial',
    'laser genesis & skin tightening': 'Laser Genesis & Skin',
    'picoway laser rejuvenation': 'PicoWay Laser Rejuv',
  };
  return (shortMap[key] || name).slice(0, 20);
}

/** Clean any double prefix ("Dr.", "Dr. Dr.", "د.") and format cleanly in the requested locale */
export function translateDoctorName(rawName: string | null | undefined, locale: SupportedLocale): string {
  if (!rawName) return locale === 'ar' ? 'المناوب' : 'On Duty';

  // Strip leading prefixes: "Dr. ", "Dr ", "Doctor ", "د. ", "د "
  const clean = rawName
    .replace(/^(dr\.?|doctor|د\.?)\s+/i, '')
    .replace(/^(dr\.?|doctor|د\.?)\s+/i, '') // handle double prefix
    .trim();

  if (locale === 'en') {
    return `Dr. ${clean}`;
  }

  const key = clean.toLowerCase();
  const arName = DOCTOR_NAME_ARABIC_MAP[key] || clean;
  return `د. ${arName}`;
}

/** Translate doctor specialty if applicable */
export function translateSpecialty(rawSpecialty: string | null | undefined, locale: SupportedLocale): string | null {
  if (!rawSpecialty) return null;
  if (locale === 'en') return rawSpecialty;

  const key = rawSpecialty.trim().toLowerCase();
  return SPECIALTY_ARABIC_MAP[key] || rawSpecialty;
}

