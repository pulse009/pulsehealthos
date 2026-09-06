import Link from 'next/link';
import { ArrowRight, ChevronRight, HeartPulse } from 'lucide-react';

export default function FAQPage() {
  const sections = [
    {
      category: 'Getting Started',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      items: [
        {
          q: 'How long does it take to set up PULSEware?',
          a: 'Most clinics are fully live within 24 hours. Our onboarding team handles everything — WhatsApp Business API connection, doctor roster setup, services configuration, and staff training — so you can focus on patient care from day one.',
        },
        {
          q: 'Do I need any technical knowledge to get started?',
          a: 'No technical knowledge is required. PULSEware is designed for clinic administrators and medical staff, not developers. Our team handles the technical setup. You just need to provide your clinic details, doctors, and services.',
        },
        {
          q: 'What do I need to get started with WhatsApp bookings?',
          a: 'You need a WhatsApp Business number (or we can help you get one), and a Meta Business account to connect the WhatsApp Cloud API. Our onboarding team walks you through the entire setup process step by step.',
        },
        {
          q: 'Can I migrate from another clinic management system?',
          a: 'Yes. We offer data migration assistance for patient records, doctor profiles, and appointment history from most common clinic management systems. Contact our team before signing up and we\'ll assess the migration scope.',
        },
      ],
    },
    {
      category: 'WhatsApp AI Bot',
      color: 'bg-green-50 border-green-200 text-green-700',
      items: [
        {
          q: 'Does the AI bot support Arabic?',
          a: 'Yes. The WhatsApp AI bot supports both English and Arabic natively. Patients are prompted to choose their language at the start of every conversation, and the entire booking flow — service selection, doctor choice, slot confirmation, and reminders — continues in their selected language.',
        },
        {
          q: 'How fast does the bot respond to patients?',
          a: 'Our Fast Router engine responds to WhatsApp webhook events in under 50 milliseconds. This means patients experience near-instant replies when interacting with the booking bot — no waiting, no delays.',
        },
        {
          q: 'Can patients reschedule or cancel via WhatsApp?',
          a: 'Yes. After a booking is confirmed, patients receive options to reschedule or cancel directly from the WhatsApp conversation. The system handles slot re-availability automatically and sends updated confirmation messages.',
        },
        {
          q: 'What happens if a patient wants to speak to a real person?',
          a: 'The bot includes a human handoff option. When a patient requests to speak with staff, the conversation is flagged and routed to your clinic\'s reception team. Your staff can take over the WhatsApp conversation seamlessly.',
        },
      ],
    },
    {
      category: 'Security & Data',
      color: 'bg-rose-50 border-rose-200 text-rose-700',
      items: [
        {
          q: 'Is my clinic data secure and isolated from other clinics?',
          a: 'Absolutely. PULSEware uses strict multi-tenant architecture with full database-level isolation between clinics. Your patient data, medical records, and financial information is never shared with or accessible by any other clinic on the platform.',
        },
        {
          q: 'Is patient data encrypted?',
          a: 'Yes. All patient data, medical records, and WhatsApp tokens are encrypted both at rest (using AES-256) and in transit (using TLS 1.3). We follow healthcare data security best practices and maintain complete audit trails.',
        },
        {
          q: 'Where is my data stored?',
          a: 'Data is stored on cloud infrastructure in the region closest to your clinic. We use Neon PostgreSQL with automated backups, point-in-time recovery, and 99.9% uptime guarantees. Enterprise clients can request dedicated infrastructure in a specific region.',
        },
        {
          q: 'Do you comply with healthcare data regulations (HIPAA, GDPR)?',
          a: 'PULSEware is built with healthcare data privacy regulations in mind. We support GDPR-compliant data handling and can assist Enterprise clients with HIPAA compliance requirements. Contact our team for a detailed compliance assessment.',
        },
      ],
    },
    {
      category: 'Billing & Plans',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      items: [
        {
          q: 'Is there a free trial?',
          a: 'Yes. All plans include a 14-day free trial with full access to all features. No credit card is required to start the trial. We will contact you before the trial ends to discuss your options.',
        },
        {
          q: 'Can I switch between plans?',
          a: 'Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle. Contact our support team to assist with plan changes.',
        },
        {
          q: 'Do you offer annual billing discounts?',
          a: 'Yes. Choosing annual billing saves 20% compared to monthly billing. Annual plans are invoiced upfront for the full year. Contact our team if you require a custom invoice arrangement.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex). Enterprise clients can also pay via bank transfer with a purchase order. All payments are processed securely via Stripe.',
        },
      ],
    },
    {
      category: 'Support',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      items: [
        {
          q: 'What support is included in each plan?',
          a: 'Starter plans include email support with a 24-hour response time. Growth plans include 24/7 priority support via WhatsApp and email. Enterprise plans include a dedicated account manager, on-site training, and a guaranteed SLA response time.',
        },
        {
          q: 'Do you offer training for clinic staff?',
          a: 'Yes. All plans include access to our online knowledge base and video tutorials. Growth and Enterprise plans include live onboarding training sessions. Enterprise plans also include on-site training at your clinic.',
        },
        {
          q: 'Can I get help customising PULSEware for my clinic\'s workflow?',
          a: 'Yes. Our team works closely with each clinic during onboarding to configure the system to match your specific workflow, service types, doctor schedules, and operational requirements. Enterprise clients also get ongoing customisation support.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[56px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-6 rounded-md bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-0.5 shadow-xs group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-white rounded-[4px] flex items-center justify-center">
                <HeartPulse className="size-3.5 text-purple-600 stroke-[2]" />
              </div>
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              PULSE<span className="text-purple-600">ware</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[13px] font-normal text-slate-600">
            <Link href="/platform" className="hover:text-purple-600 transition-colors">Platform</Link>
            <Link href="/solutions" className="hover:text-purple-600 transition-colors">Solutions</Link>
            <Link href="/customers" className="hover:text-purple-600 transition-colors">Customers</Link>
            <Link href="/faq" className="text-purple-600 font-medium transition-colors">FAQ</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="px-2.5 py-1 text-xs font-normal text-slate-700 hover:text-purple-600 transition-colors rounded-[8px] bg-slate-100/80 hover:bg-slate-200/80">
              Log In
            </Link>
            <Link href="/login" className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-all hover:scale-105 active:scale-95">
              <span>Request Demo</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-[56px]">

        {/* ─── HERO ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white/80">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium tracking-wider uppercase">
              Frequently Asked Questions
            </div>
            <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-slate-900 leading-tight">
              Everything you need to know
            </h1>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              Can't find what you're looking for? Our support team is available 24/7 on WhatsApp and email.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-[8px] border border-slate-300 hover:border-purple-500 hover:text-purple-600 text-slate-700 text-sm font-normal transition-all">
              Contact Support <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* ─── FAQ SECTIONS ─── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/40">
          <div className="max-w-3xl mx-auto space-y-12">
            {sections.map((sec) => (
              <div key={sec.category}>
                <div className="flex items-center gap-3 mb-5">
                  <span className={`px-3 py-1 rounded-[8px] border text-xs font-semibold ${sec.color}`}>{sec.category}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="space-y-3">
                  {sec.items.map((item, i) => (
                    <details key={i} className="group rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none text-sm font-medium text-slate-900 hover:text-purple-600 transition-colors">
                        <span>{item.q}</span>
                        <ChevronRight className="size-4 text-slate-400 group-open:rotate-90 transition-transform duration-200 shrink-0 ml-4" />
                      </summary>
                      <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── STILL HAVE QUESTIONS ─── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-3">
              <div className="size-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">💬</div>
              <h3 className="text-base font-semibold text-slate-900">Chat with our team</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Our support team is available on WhatsApp for Growth and Enterprise clients. Typically responds within minutes.</p>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-medium hover:underline">
                Open a conversation <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-3">
              <div className="size-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">📧</div>
              <h3 className="text-base font-semibold text-slate-900">Send us an email</h3>
              <p className="text-xs text-slate-500 leading-relaxed">For billing, account, or technical questions, our team responds to all emails within 24 hours on Starter plans.</p>
              <a href="mailto:support@pulseware.io" className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-medium hover:underline">
                support@pulseware.io <ArrowRight className="size-3" />
              </a>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/40">
          <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 border border-purple-500/30 p-10 sm:p-16 text-center space-y-6 text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight max-w-2xl mx-auto">
              Ready to get started?
            </h2>
            <p className="text-sm text-slate-300 font-normal max-w-lg mx-auto">
              14-day free trial. No credit card required. Your clinic can go live in under 24 hours.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-xl shadow-purple-500/30 transition-all hover:scale-105">
              Request Demo <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

      </main>

      <footer className="w-full py-8 border-t border-slate-200 bg-white text-slate-500 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-purple-600 flex items-center justify-center">
              <HeartPulse className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">PULSEware Healthcare OS</span>
            <span>• © 2026 All Rights Reserved</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <Link href="/platform" className="hover:text-purple-600 transition-colors">Platform</Link>
            <Link href="/solutions" className="hover:text-purple-600 transition-colors">Solutions</Link>
            <Link href="/customers" className="hover:text-purple-600 transition-colors">Customers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
