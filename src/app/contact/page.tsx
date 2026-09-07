'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    clinicName: '',
    clinicType: 'Hospital / Multi-Specialty',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-teal-600 selection:text-white relative overflow-x-hidden">
      
      {/* ─── CONTACT HERO CARD (Meditech Theme) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-8 sm:pb-12">
        <div className="relative w-full overflow-hidden rounded-[28px] sm:rounded-[40px] border-[3px] sm:border-[5px] border-white shadow-[0_12px_40px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d8f2ee] via-[#edf9f6] to-[#cdeee8] pb-14 sm:pb-20">
          
          {/* Vertical Fluted / Slat Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-80"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.25) 0px,
                rgba(255, 255, 255, 0) 36px,
                rgba(13, 92, 86, 0.025) 72px,
                rgba(255, 255, 255, 0.6) 72px,
                rgba(255, 255, 255, 0.6) 73px,
                rgba(13, 92, 86, 0.05) 73px,
                rgba(13, 92, 86, 0.05) 74px
              )`,
            }}
          />

          {/* Soft Center Lighting */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/40 blur-[100px] rounded-full pointer-events-none" />

          {/* ─── Top Floating Pill Navbar ─── */}
          <div className="relative z-20 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
            <div className="w-full max-w-7xl mx-auto rounded-full bg-white shadow-[0_2px_12px_rgba(13,92,86,0.05)] px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between">
              
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="relative size-6 sm:size-7 flex items-center justify-center text-[#0d8276]">
                  <svg viewBox="0 0 24 24" className="size-6 sm:size-7 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="3.5" />
                    <circle cx="12" cy="3" r="1.5" />
                    <circle cx="12" cy="21" r="1.5" />
                    <circle cx="3" cy="12" r="1.5" />
                    <circle cx="21" cy="12" r="1.5" />
                    <circle cx="5.636" cy="5.636" r="1.5" />
                    <circle cx="18.364" cy="18.364" r="1.5" />
                    <circle cx="5.636" cy="18.364" r="1.5" />
                    <circle cx="18.364" cy="5.636" r="1.5" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                  Pulseware
                </span>
              </Link>

              {/* Center Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[13.5px] font-medium text-slate-600">
                <Link href="/" className="hover:text-slate-900 transition-colors">
                  Home
                </Link>
                <Link href="/about" className="hover:text-slate-900 transition-colors">
                  About
                </Link>
                <Link href="/features" className="hover:text-slate-900 transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/contact" className="flex items-center gap-1.5 text-[#0d8276] hover:text-[#0a5c53] font-semibold transition-colors">
                  <span className="size-1.5 rounded-full bg-[#0d8276]" />
                  <span>Contact Us</span>
                </Link>
              </nav>

              {/* Right CTA Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95"
                >
                  Request Demo
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Header Copy ─── */}
          <div className="relative z-10 px-5 sm:px-10 pt-12 sm:pt-16 pb-6 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-teal-800/10 text-[#0d6157] text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
              Get in Touch
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span>Let&apos;s Talk About </span>
              <span className="text-[#0d5c56]">Modernizing Your Clinic</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
              Whether you want a personalized demo, custom multi-branch pricing, or technical migration assistance, our team is here to assist.
            </p>
          </div>
        </div>
      </div>

      {/* ─── CONTACT SECTION: FORM & CHANNELS GRID ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          {/* Left Column: Interactive Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-[32px] sm:rounded-[36px] p-8 sm:p-10 shadow-lg border border-slate-200/80">
            {submitted ? (
              <div className="py-16 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">Thank you, {form.name || 'Doctor'}!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  We have received your message. Our clinical specialist will contact you via WhatsApp and email within 2 business hours.
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                    Fill out the form below and our healthcare advisory team will get back to you promptly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="sarah@hospital.com"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+966 50 123 4567"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157] transition-all"
                    />
                  </div>

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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    How can we help you? *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your clinic setup, current software, and what features you are looking for..."
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

          {/* Right Column: Direct Channels & Offices */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct WhatsApp Channel */}
            <div className="p-7 rounded-[28px] bg-[#eef9f6] border border-[#d2eee5] space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Direct WhatsApp Inquiries</h3>
                  <div className="text-xs text-emerald-700 font-medium">Instant automated &amp; human support</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Want to test the AI Fast Router live? Message our official WhatsApp hotline to experience the booking flow firsthand.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/966500000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <span>Chat on WhatsApp</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            </div>

            {/* Sales & Technical Support */}
            <div className="p-7 rounded-[28px] bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-xl bg-white border border-slate-200 text-[#0d6157] flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Us</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">sales@pulseware.health</div>
                  <div className="text-xs text-slate-500">support@pulseware.health</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-slate-200/60">
                <div className="size-9 rounded-xl bg-white border border-slate-200 text-[#0d6157] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Working Hours</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">Sunday – Thursday: 8:00 AM – 8:00 PM</div>
                  <div className="text-xs text-slate-500">Riyadh (GMT+3) &amp; London (GMT)</div>
                </div>
              </div>
            </div>

            {/* Regional Offices */}
            <div className="p-7 rounded-[28px] bg-slate-50 border border-slate-200/80 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Regional Headquarters</h3>
              
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-[#0d6157] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed font-normal">
                  <strong className="text-slate-900">Riyadh, Saudi Arabia:</strong> King Fahd Road, Reveal Medical Tower, Level 14
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                <MapPin className="size-4 text-[#0d6157] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed font-normal">
                  <strong className="text-slate-900">London, United Kingdom:</strong> Harley Street Medical Center, W1G 8PN
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>© 2026 PULSEware. The intelligent operating system for modern healthcare.</p>
      </footer>

    </div>
  );
}
