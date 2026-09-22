'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';
import { AllSiteContent } from '@/lib/cms/types';
import { DEFAULT_SITE_CONTENT } from '@/lib/cms/defaults';

interface ContactPageClientProps {
  cmsContent?: AllSiteContent;
  user?: {
    id?: string;
    name?: string;
    role?: string;
  } | null;
  portalHref?: string;
}

export function ContactPageClient({
  cmsContent = DEFAULT_SITE_CONTENT,
  user = null,
  portalHref = '/portal',
}: ContactPageClientProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    clinicName: '',
    clinicType: 'Hospital / Multi-Specialty Network',
    message: '',
  });

  const { announcement, contact, footer } = cmsContent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#0d8276] selection:text-white relative overflow-x-hidden">
      
      {/* ─── TOP ANNOUNCEMENT BAR ─── */}
      <TopAnnouncementBar content={announcement} />

      {/* ─── HERO CARD (Meditech Theme) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-6 sm:pb-12">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_45px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d5f1ec] via-[#edf9f6] to-[#c6ece4] pb-12 sm:pb-20">
          
          {/* Vertical Fluted / Slat Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-75"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.3) 0px,
                rgba(255, 255, 255, 0) 36px,
                rgba(13, 92, 86, 0.025) 72px,
                rgba(255, 255, 255, 0.6) 72px,
                rgba(255, 255, 255, 0.6) 73px,
                rgba(13, 92, 86, 0.05) 73px,
                rgba(13, 92, 86, 0.05) 74px
              )`,
            }}
          />

          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/40 blur-[100px] rounded-full pointer-events-none" />

          {/* Unified Floating Pill Navbar */}
          <PublicNavbar activePage="contact" user={user} portalHref={portalHref} />

          {/* ─── Header Copy ─── */}
          <div className="relative z-10 px-4 sm:px-10 pt-10 sm:pt-16 pb-6 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-white/80 border border-teal-800/10 text-[#0d6157] text-[11px] sm:text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs whitespace-nowrap shrink-0 max-w-full">
              <span className="truncate">{contact.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span>{contact.headlineFirst} </span>
              <span className="text-[#0d5c56]">{contact.headlineSecond}</span>
            </h1>

            <p className="mt-3.5 sm:mt-5 text-xs sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
              {contact.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ─── CONTACT SECTION: FORM & CHANNELS GRID ─── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          {/* Left Column: Interactive Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 shadow-lg border border-slate-200/80">
            {submitted ? (
              <div className="py-12 sm:py-16 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">Thank you, {form.name || 'Doctor'}!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  We have received your message. Our clinical specialist will contact you via WhatsApp and phone ({contact.phone}) within 2 business hours.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-full bg-[#0d6157] text-white text-xs font-semibold hover:bg-[#0a4e46] transition-all"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                    Fill out the form below and our healthcare advisory team will get back to you promptly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Dr. Sarah Johnson"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+966 55 632 2688"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Clinic / Hospital Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.clinicName}
                      onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                      placeholder="Reveal Medical Center"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Facility Type
                    </label>
                    <select
                      value={form.clinicType}
                      onChange={(e) => setForm({ ...form, clinicType: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all"
                    >
                      <option>Hospital / Multi-Specialty Network</option>
                      <option>Dermatology &amp; Aesthetic Clinic</option>
                      <option>Dental Practice</option>
                      <option>General Practice &amp; Family Medicine</option>
                      <option>Specialty Surgery Center</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    How can we help you? *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your clinic setup, current operations, and what modules you want to explore..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-full bg-[#0d6157] hover:bg-[#0a4e46] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Send Message</span>
                    <Send className="size-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Direct Phone, WhatsApp & Regional Offices */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Phone & WhatsApp Support */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-[#eef9f6] border border-[#d2eee5] space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <PhoneCall className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Direct Phone &amp; WhatsApp</h3>
                  <div className="text-xs text-emerald-700 font-medium">{contact.supportAvailability}</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Direct Hotline</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tracking-wide">
                  {contact.phone}
                </div>
                <div className="text-xs text-slate-500">Call directly or start a chat on WhatsApp</div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={contact.whatsappUrl || `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200/80 shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  <Phone className="size-3.5 text-[#0d6157]" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>

            {/* Working Hours */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-xl bg-white border border-slate-200 text-[#0d6157] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Working Hours</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {contact.workingHoursDays}: {contact.workingHoursTime}
                  </div>
                  <div className="text-xs text-slate-500">{contact.workingHoursTz}</div>
                </div>
              </div>
            </div>

            {/* Regional Offices */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-slate-50 border border-slate-200/80 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Regional Headquarters</h3>
              
              {contact.offices.map((office, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${idx > 0 ? 'pt-3 border-t border-slate-200/60' : ''}`}
                >
                  <MapPin className="size-4 text-[#0d6157] shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    <strong className="text-slate-900">
                      {office.city}, {office.country}:
                    </strong>{' '}
                    {office.address}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ─── UNIFIED PUBLIC FOOTER ─── */}
      <PublicFooter content={footer} />

    </div>
  );
}
