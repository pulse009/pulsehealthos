import { AllSiteContent } from './types';

export const DEFAULT_SITE_CONTENT: AllSiteContent = {
  announcement: {
    isEnabled: true,
    badge: 'New Release',
    textDesktop: 'Pulse Speak Autonomous Voice AI & Multi-Branch Clinic Telephony is now live!',
    textMobile: 'Pulse Speak Voice AI is live!',
    linkText: 'Request Voice Demo',
    linkHref: '/contact',
  },

  hero: {
    badgeText: 'Production-Grade Healthcare Operating System',
    headlineFirst: 'Intelligent Clinic Management,',
    headlineSecond: 'Automated From Patient To Payout',
    subtitle:
      'Pulseware synchronizes your entire clinical operation into one seamless ecosystem: autonomous WhatsApp & Voice AI booking, smart Electronic Health Records (EHR), pharmacy batch inventory, and automated doctor commission payouts — with zero double-booking guaranteed.',
    primaryCtaText: 'Explore Platform Products',
    primaryCtaHref: '#products',
    secondaryCtaText: 'Request Custom Demo',
    secondaryCtaHref: '/contact',
    stats: [
      { value: '0%', label: 'Double-Booking Collision Rate' },
      { value: '< 50ms', label: 'Live Availability Engine' },
      { value: '24/7', label: 'WhatsApp & Voice Booking' },
      { value: '11 Roles', label: 'Role-Based Hospital Security' },
    ],
  },

  architecture: {
    badge: 'Enterprise Standards & Architecture',
    title: 'Engineered for hospitals, polyclinics, specialized centers & medical networks',
    subtitle:
      'Built on mathematical PostgreSQL concurrency guarantees and strict tenant boundary isolation.',
    items: [
      {
        title: 'PostgreSQL GiST Concurrency Engine',
        desc: 'Atomic time-range exclusion locks at the database layer make double-booking mathematically impossible under any concurrency.',
        tag: '0% Collisions',
      },
      {
        title: 'Strict Multi-Tenant Isolation',
        desc: 'Every clinic data store, EHR ledger, and billing record is partitioned with strict query-level scope boundaries.',
        tag: 'Tenant Guard',
      },
      {
        title: '20+ Supported Locales & Timezones',
        desc: 'Bilingual Arabic (RTL) & English engine with full IANA timezone mapping across the Middle East, UK, and worldwide.',
        tag: 'Bilingual RTL',
      },
      {
        title: 'UTC Timestamptz Audit Trail',
        desc: 'Every prescription dispense, appointment shift, invoice amendment, and payout is immutably logged with actor tracking.',
        tag: 'HIPAA & GDPR',
      },
    ],
  },

  products: {
    badge: 'Product Architecture',
    headlineFirst: 'Three Dedicated Products,',
    headlineSecond: 'One Connected Healthcare OS',
    subtitle:
      'Explore Pulseware’s modular software ecosystem. Choose the standalone autonomous booking agents or deploy the full clinical hospital management suite.',
    products: [
      {
        id: 'healthos',
        badge: 'Core Hospital Operating System',
        name: 'Pulse HealthOS',
        subtitle: 'Comprehensive Clinic & Hospital Management System',
        description:
          'A modern, fully integrated Practice Management & EHR system engineered for polyclinics, specialized medical centers, and hospitals. Replaces legacy fragmented software with a unified clinical, pharmacy, and billing command center.',
        monthlyPrice: '1,099 SAR/mo',
        ctaText: 'Get Started with HealthOS',
        ctaHref: '/contact',
        features: [
          {
            title: 'Full Patient Lifecycle & EHR',
            desc: 'Digital patient charts, vitals, medical history, ICD-10 diagnostic coding, and e-prescriptions.',
          },
          {
            title: 'Pharmacy & Smart Batch Inventory',
            desc: 'Real-time stock tracking with lot numbers, expiry dates, purchase orders, and automatic dispensing deductions.',
          },
          {
            title: 'Doctor Commission & Payout Engine',
            desc: 'Automated revenue share calculation per consultation and procedure with audited monthly statements.',
          },
          {
            title: 'Multi-Role Staff Access & RBAC',
            desc: 'Granular permissions for Super Admin, Doctors, Nurses, Receptionists, Pharmacists, and Lab Techs.',
          },
        ],
      },
      {
        id: 'now',
        badge: 'Autonomous WhatsApp Concierge',
        name: 'Pulse Now',
        subtitle: '24/7 Autonomous WhatsApp AI Patient Booking Bot',
        description:
          'Direct integration with the Meta WhatsApp Business Cloud API. Pulse Now handles incoming patient inquiries, verifies live doctor availability in milliseconds, books appointments directly into HealthOS, and sends automated reminder sequences.',
        monthlyPrice: '499 SAR/mo',
        ctaText: 'Get Pulse Now',
        ctaHref: '/contact',
        features: [
          {
            title: 'Instant WhatsApp Booking & Rescheduling',
            desc: 'Patients reserve, confirm, cancel, or reschedule slots conversationally in Arabic and English.',
          },
          {
            title: 'Sub-50ms Fast Slot Query Engine',
            desc: 'Direct database lookups against doctor schedules with zero API lag or hallucinated slots.',
          },
          {
            title: 'Automated 24h & 2h WhatsApp Reminders',
            desc: 'Reduces clinic no-shows by up to 80% with interactive WhatsApp confirmation buttons.',
          },
          {
            title: 'Human Receptionist Escalation Router',
            desc: 'Complex clinical questions or VIP patients are instantly routed to clinic staff with full chat context.',
          },
        ],
      },
      {
        id: 'speak',
        badge: 'Voice Telephony AI',
        name: 'Pulse Speak',
        subtitle: 'Autonomous Spoken Voice AI Receptionist for Clinics',
        description:
          'Connects directly to your hospital PBX or phone lines via SIP trunking. Pulse Speak answers incoming calls within 1 ring, speaks natural Arabic and English with sub-400ms neural latency, answers clinical inquiries, and books appointments verbally.',
        monthlyPrice: 'Custom Setup',
        ctaText: 'Request Voice Demo',
        ctaHref: '/contact',
        features: [
          {
            title: 'Autonomous Inbound Phone Receptionist',
            desc: 'Answers 100+ concurrent phone calls with natural conversational tone, zero hold times.',
          },
          {
            title: 'Direct PBX, 3CX & SIP Trunk Integration',
            desc: 'Seamlessly hooks into existing hospital telephone infrastructure without replacing hardware.',
          },
          {
            title: 'Verbal Appointment Booking & Calendar Sync',
            desc: 'Understands spoken doctor names, dates, and times, committing reservations straight to HealthOS.',
          },
          {
            title: 'Speech-to-Text Clinical Call Summaries',
            desc: 'Generates structured transcripts and summaries for clinic reception and medical records.',
          },
        ],
      },
    ],
  },

  features: {
    badge: 'Feature Matrix',
    headlineFirst: 'Enterprise Clinical & Operational',
    headlineSecond: 'Capabilities Matrix',
    subtitle:
      'A deep dive into the architectural modules that make Pulseware the most dependable healthcare operating system for medical practitioners.',
    categories: [
      {
        id: 'scheduling',
        categoryName: 'Scheduling & Concurrency',
        tag: 'Database-Tier Guarantees',
        description:
          'High-throughput scheduling engine backed by mathematical PostgreSQL exclusion constraints.',
        items: [
          {
            title: 'Zero Double-Booking Guarantee',
            desc: 'PostgreSQL GiST exclusion locks ensure no two patients or agents can claim the same slot simultaneously.',
          },
          {
            title: 'Multi-Doctor Roster & Custom Hours',
            desc: 'Configure working intervals, recurring break times, annual leaves, and emergency closure blocks.',
          },
          {
            title: 'Emergency Slot Hold & Lock',
            desc: 'Temporary 5-minute reservation hold while patients complete WhatsApp/Voice confirmation.',
          },
          {
            title: 'Automated WhatsApp Reminders',
            desc: 'Automated 24h & 2h appointment reminder dispatches with one-tap confirmation.',
          },
        ],
      },
      {
        id: 'clinical',
        categoryName: 'Clinical EHR & Consultations',
        tag: 'Doctor-First Workflow',
        description:
          'Streamlined clinical workspace for doctors to examine patients, record vitals, and issue prescriptions in seconds.',
        items: [
          {
            title: 'Comprehensive Patient UHID Profile',
            desc: 'Unified lifetime medical record tracking diagnoses, past surgeries, allergy alerts, and billing history.',
          },
          {
            title: 'Digital E-Prescriptions & Dispensing',
            desc: 'Instant prescription generator linked directly to the hospital pharmacy inventory with automated dosage templates.',
          },
          {
            title: 'Diagnostic Lab Test Orders & PDFs',
            desc: 'Order laboratory panels, track specimen collection status, and attach verified PDF results.',
          },
          {
            title: 'ICD-10 Diagnostic Search',
            desc: 'Instant auto-complete medical diagnostic coding for accurate clinical records and insurance claims.',
          },
        ],
      },
      {
        id: 'pharmacy',
        categoryName: 'Pharmacy & Stock Inventory',
        tag: 'Lot & Expiry Tracking',
        description:
          'Full-scale pharmaceutical supply chain management with real-time stock movement ledgers.',
        items: [
          {
            title: 'Batch & Expiry Date Management',
            desc: 'Track medication lots, manufacture dates, and shelf-life expiration alerts with FIFO automated dispensing.',
          },
          {
            title: 'Purchase Orders & Supplier Invoices',
            desc: 'Draft, approve, and receive purchase orders with automatic stock movement ledger reconciliation.',
          },
          {
            title: 'Automated Stock Depletion',
            desc: 'Dispensed medications are atomically deducted from current inventory upon bill settlement.',
          },
          {
            title: 'Low Stock & Minimum Alert Thresholds',
            desc: 'Configurable automated alerts when critical medicine stock falls below clinic threshold.',
          },
        ],
      },
      {
        id: 'financial',
        categoryName: 'Financial Ledger & Payouts',
        tag: 'Audited Revenue Splitting',
        description:
          'Automated doctor remuneration calculations, multi-payment invoices, and day-end balancing.',
        items: [
          {
            title: 'Doctor Commission Calculation Engine',
            desc: 'Custom percentage-based and fixed-fee commission rules per service with monthly payout generation.',
          },
          {
            title: 'Multi-Method Invoice Splitting',
            desc: 'Accept cash, Mada/Visa credit cards, insurance co-pays, and bank transfers on a single invoice.',
          },
          {
            title: 'Day-End Cash & Pos Balancing',
            desc: 'Reception shift reconciliation with closing summaries and variance auditing.',
          },
          {
            title: 'Clinic Expense Ledger',
            desc: 'Categorized clinic expense recording for rent, utilities, equipment maintenance, and clinical supplies.',
          },
        ],
      },
      {
        id: 'conversational',
        categoryName: 'Conversational Voice & WhatsApp AI',
        tag: 'Omnichannel Autonomous Patient Care',
        description:
          'Next-generation voice synthesis and WhatsApp Cloud API agents operating 24 hours a day.',
        items: [
          {
            title: 'Official WhatsApp Business Cloud API',
            desc: 'Zero-risk, high-throughput official Meta API integration supporting millions of messages monthly.',
          },
          {
            title: 'Sub-400ms Spoken Voice Telephony',
            desc: 'Human-parity audio response times over hospital landlines with fluent Saudi Arabic & English accents.',
          },
          {
            title: 'Human Receptionist Escalation',
            desc: 'Seamless transfer of complex clinical inquiries to clinic staff with full chat context preservation.',
          },
          {
            title: 'Pre-Consultation Triage Surveys',
            desc: 'Collect patient symptoms, medical history, and insurance IDs conversationally before consultation.',
          },
        ],
      },
      {
        id: 'security',
        categoryName: 'Security & Compliance',
        tag: 'Enterprise Tenancy Guard',
        description:
          'Hospital-grade data isolation, encrypted token storage, and strict role-based access control.',
        items: [
          {
            title: '11 Granular Role Permissions',
            desc: 'Strict role-based access control for Super Admin, Doctors, Nurses, Receptionists, and Pharmacists.',
          },
          {
            title: '256-Bit Encrypted Data at Rest & Transit',
            desc: 'Full TLS 1.3 encryption for all medical data, patient charts, and API webhook transmissions.',
          },
          {
            title: 'Immutable Timestamptz Audit Trails',
            desc: 'Every user login, record creation, prescription dispense, and payment edit is permanently audited.',
          },
          {
            title: 'HIPAA & GDPR Ready Architecture',
            desc: 'Engineered in full compliance with international healthcare data governance standards.',
          },
        ],
      },
    ],
  },

  pricing: {
    headlineFirst: 'Simple & Flexible',
    headlineSecond: 'Pricing',
    subtitle: "Choose the plan that fits your hospital's size and needs. No hidden fees.",
    discountBadge: 'Save 20%',
    plans: [
      {
        id: 'now',
        name: 'Pulse Now',
        subtitle: 'AI Chatbot & WhatsApp Patient Booking',
        monthlyPrice: '499',
        annualPrice: '399',
        features: [
          'Up to 5 users',
          'Patient Management',
          'Basic Billing & Invoicing',
          'Appointment Scheduling',
          'WhatsApp Fast Router Engine',
          'Email & Chat Support',
        ],
        ctaText: 'Choose Plan',
        ctaHref: '/contact',
      },
      {
        id: 'healthos',
        name: 'Pulse HealthOS',
        subtitle: 'Complete PMS & Hospital Operations',
        monthlyPrice: '1,099',
        annualPrice: '999',
        isPopular: true,
        features: [
          'Up to 30 users & clinicians',
          'Comprehensive Patient Management & EHR',
          'Pharmacy & Smart Inventory System',
          'Doctor Payouts & Commission Rules',
          'Enterprise Appointment Scheduling',
          'Priority 24/7 Dedicated Support',
          'Advanced Financial & Clinical Analytics',
          'Multi-Doctor Roster & Staff Management',
        ],
        ctaText: 'Get started',
        ctaHref: '/contact',
      },
      {
        id: 'speak',
        name: 'Pulse Speak',
        subtitle: 'Autonomous Voice Caller Agent for Clinics',
        monthlyPrice: "Let's chat!",
        annualPrice: "Let's chat!",
        features: [
          'Unlimited Voice Inbound & Outbound Calls',
          'Autonomous Phone Appointment Booking',
          'Multi-Branch & PBX Call Routing',
          'Direct EHR & WhatsApp Calendar Sync',
          'Natural Arabic & English Voice Accents',
          'Dedicated Technical Account Manager',
        ],
        ctaText: 'Request Demo',
        ctaHref: '/contact',
      },
    ],
  },

  about: {
    badge: 'About Pulseware',
    headlineFirst: 'Building the Operating System for',
    headlineSecond: 'Modern Healthcare Excellence',
    subtitle:
      'Pulseware was founded with a singular mission: to eliminate fragmented clinic software and automate healthcare operations from patient booking to doctor payouts with uncompromised clinical precision.',
    stats: [
      { value: '500,000+', label: 'Patient Consultations Managed' },
      { value: '0%', label: 'Double-Booking Collision Rate' },
      { value: '99.99%', label: 'System Uptime SLA' },
      { value: '< 50ms', label: 'Availability Query Engine' },
    ],
    missionTitle: 'Our Clinical Mission',
    missionText:
      'We believe healthcare providers deserve software that works with the same rigor and precision they bring to patient care. Legacy clinic management systems are slow, disconnected, and prone to scheduling collisions. Pulseware unifies autonomous AI receptionists, clinical EHR, pharmacy supply chain, and financial ledgers into one singular, reliable operating system.',
    leadership: [
      {
        name: 'Dr. Zeshan Qureshi',
        role: 'Founder & Chief Medical Information Officer',
        desc: 'Consultant physician and healthcare technology architect pioneering autonomous clinic systems and PostgreSQL concurrency standards.',
      },
      {
        name: 'Tariq Al-Mansoor',
        role: 'VP of Telephony & Voice AI',
        desc: 'Former telecom infrastructure lead specializing in sub-400ms neural telephony integration and PBX SIP trunking systems.',
      },
      {
        name: 'Sarah Lin',
        role: 'Head of Clinical Product & EHR',
        desc: 'Clinical UX specialist with 12 years of experience modernizing polyclinic workflows and medical charting standards.',
      },
      {
        name: 'Marcus Vance',
        role: 'Lead Cloud Security Architect',
        desc: 'Enterprise security specialist ensuring HIPAA/GDPR isolation boundaries and multi-tenant database protection.',
      },
    ],
  },

  contact: {
    badge: 'Get in Touch',
    headlineFirst: "Let's Talk About",
    headlineSecond: 'Modernizing Your Clinic',
    subtitle:
      'Whether you want a personalized demo, custom multi-branch pricing, or technical migration assistance, our team is ready to connect with you.',
    phone: '+966 556322688',
    whatsappUrl: 'https://wa.me/966556322688',
    supportAvailability: 'Available for clinics 24/7',
    workingHoursDays: 'Sunday – Thursday',
    workingHoursTime: '8:00 AM – 8:00 PM',
    workingHoursTz: 'Riyadh (GMT+3) & London (GMT)',
    offices: [
      {
        city: 'Riyadh',
        country: 'Saudi Arabia',
        address: 'King Fahd Road, Reveal Medical Tower, Level 14',
      },
      {
        city: 'London',
        country: 'United Kingdom',
        address: 'Harley Street Medical Center, W1G 8PN',
      },
    ],
  },

  footer: {
    tagline:
      'The complete Healthcare Operating System for modern clinics — autonomous AI booking, clinical EHR, pharmacy inventory, and doctor payouts.',
    copyright: '© 2026 Pulseware Healthcare OS. All rights reserved.',
    statusText: 'All Services Operational • 99.99% Uptime',
    productLinks: [
      { label: 'Pulse HealthOS (PMS)', href: '/products' },
      { label: 'Pulse Now (WhatsApp AI)', href: '/products' },
      { label: 'Pulse Speak (Voice AI)', href: '/products' },
      { label: 'Clinical Features Matrix', href: '/features' },
    ],
    companyLinks: [
      { label: 'About Pulseware', href: '/about' },
      { label: 'Pricing & Plans', href: '/pricing' },
      { label: 'Request Demo', href: '/contact' },
      { label: 'Hospital Staff Login', href: '/login' },
    ],
    trustBadges: [
      'GiST Concurrency Engine',
      'Strict Multi-Tenant Isolation',
      'WhatsApp Cloud Official API',
      '256-Bit Encrypted Data',
    ],
  },
};
