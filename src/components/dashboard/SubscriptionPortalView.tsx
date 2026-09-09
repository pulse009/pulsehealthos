'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LuCheck as Check,
  LuCircleCheck as CheckCircle2,
  LuSparkles as Sparkles,
  LuZap as Zap,
  LuShieldCheck as ShieldCheck,
  LuArrowRight as ArrowRight,
  LuCreditCard as CreditCard,
  LuBuilding2 as Building2,
  LuPhoneCall as PhoneCall,
  LuGlobe as Globe2,
  LuLock as Lock,
  LuHeadphones as Headphones,
  LuUsers as Users,
  LuX as X,
  LuMessageSquare as MessageSquare,
  LuArrowLeft as ArrowLeft,
  LuLayers as Layers,
  LuCrown as Crown,
  LuCircleHelp as HelpCircle,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
import { Badge, cn } from '@/components/ui/primitives';

interface SubscriptionPortalViewProps {
  clinic: {
    id: string;
    name: string;
    slug: string;
    pulseHealthOS: boolean;
    pulseNow: boolean;
    doctorsCount: number;
    servicesCount: number;
    createdAt: string;
  };
}

export function SubscriptionPortalView({ clinic }: SubscriptionPortalViewProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [upgradeSuccessMsg, setUpgradeSuccessMsg] = useState<string | null>(null);

  // Determine current active tier
  const currentPlan = clinic.pulseNow ? 'Pulse Now' : 'Pulse HealthOS';

  const handleSelectPlan = (planName: string) => {
    if (planName === currentPlan) return;
    setSelectedPlanModal(planName);
  };

  const handleConfirmUpgrade = () => {
    setIsProcessingUpgrade(true);
    setTimeout(() => {
      setIsProcessingUpgrade(false);
      setUpgradeSuccessMsg(`Your upgrade request for ${selectedPlanModal} has been submitted! Our dedicated clinic onboarding manager will activate your tier.`);
      setSelectedPlanModal(null);
    }, 800);
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* ─── 1. TOP SUB-HEADER BAR (MATCHING EXACT REFERENCE STRUCTURE) ─── */}
      <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Subscription &amp; Plans
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Tier: {currentPlan}
            </span>
          </div>
        </div>

        {/* Right Actions: Billing Cycle Switcher */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                billingCycle === 'monthly'
                  ? 'bg-slate-900 text-white shadow-2xs dark:bg-teal-600'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                billingCycle === 'annual'
                  ? 'bg-slate-900 text-white shadow-2xs dark:bg-teal-600'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <span>Annual</span>
              <span className="text-[9.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                Save 20%
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlanModal('Pulse HealthOS')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Crown className="size-3.5 text-amber-400" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* ─── 2. SCROLLABLE PAGE CONTENT CONTAINER ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-6">
          {upgradeSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                <span>{upgradeSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* ─── SECTION 1: ACTIVE TIER & CAPACITY USAGE ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="size-3.5" />
              </div>
              <span>CURRENT SUBSCRIPTION &amp; QUOTA CAPACITY</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time resource utilization for <span className="font-semibold text-slate-800 dark:text-slate-200">{clinic.name}</span> under single-tenant isolation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Active Package
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  {currentPlan}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                  ● Enterprise Active
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Clinician Seats
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  {clinic.doctorsCount} / 30
                </span>
                <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                  Active doctor profiles
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Configured Services
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  {clinic.servicesCount} Active
                </span>
                <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                  Unlimited slot capacity
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  AI Booking Engine
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  Unlimited
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                  Sub-50ms WhatsApp router
                </span>
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: AVAILABLE PRICING TIERS ─── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Layers className="size-3.5" />
              </div>
              <span>AVAILABLE CLINIC PLANS &amp; PRICING PACKAGES</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose the package that fits your clinical scale. All plans include 256-bit encryption and WhatsApp business connectivity.
            </p>

            {/* 3 Packages Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pt-2">
              {/* ─── Plan 1: Pulse Now (AI Chatbot) ─── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Pulse Now
                    </h3>
                    {currentPlan === 'Pulse Now' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active Tier
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    AI Chatbot &amp; WhatsApp Patient Booking
                  </p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                      {billingCycle === 'monthly' ? '499' : '399'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">SAR / month</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Up to 5 users</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Patient Management</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Basic Billing &amp; Invoicing</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Appointment Scheduling</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>WhatsApp Fast Router Engine</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Email &amp; Chat Support</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={currentPlan === 'Pulse Now'}
                    onClick={() => handleSelectPlan('Pulse Now')}
                    className={cn(
                      'w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center block transition-all shadow-2xs cursor-pointer',
                      currentPlan === 'Pulse Now'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                        : 'border border-slate-200 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50'
                    )}
                  >
                    {currentPlan === 'Pulse Now' ? 'Current Active Plan' : 'Select Pulse Now'}
                  </button>
                </div>
              </div>

              {/* ─── Plan 2: Pulse HealthOS (Center Highlighted PMS) ─── */}
              <div className="bg-[#0b544b] text-white rounded-2xl p-6 shadow-xl border border-teal-800 flex flex-col justify-between relative lg:-translate-y-1 z-10">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold tracking-tight text-white">
                      Pulse HealthOS
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wide">
                      {currentPlan === 'Pulse HealthOS' ? 'Current Active Plan' : 'Most Popular'}
                    </span>
                  </div>
                  <p className="text-xs text-teal-100/80 mt-0.5">
                    Complete PMS &amp; Hospital Operations
                  </p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      {billingCycle === 'monthly' ? '1,099' : '999'}
                    </span>
                    <span className="text-xs text-teal-200/80 font-medium">SAR / month</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-2.5 text-xs text-teal-50">
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span className="font-semibold">Up to 30 users &amp; clinicians</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Comprehensive Patient Management &amp; EHR</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Pharmacy &amp; Smart Inventory System</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Doctor Payouts &amp; Commission Rules</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Enterprise Appointment Scheduling</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Priority 24/7 Dedicated Support</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Advanced Financial &amp; Clinical Analytics</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Multi-Doctor Roster &amp; Staff Management</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  {currentPlan === 'Pulse HealthOS' ? (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-white/20 text-white text-xs font-bold text-center block border border-white/20">
                      Active Plan (Fully Unlocked)
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectPlan('Pulse HealthOS')}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#0b544b] text-xs font-bold text-center block transition-all shadow-md cursor-pointer"
                    >
                      Upgrade to HealthOS
                    </button>
                  )}
                </div>
              </div>

              {/* ─── Plan 3: Pulse Speak (Voice Caller Agent) ─── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Pulse Speak
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0d5c56] dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200">
                      Voice AI
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Autonomous Voice Caller Agent for Clinics
                  </p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Custom Plan
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Unlimited Voice Inbound &amp; Outbound Calls</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Autonomous Phone Appointment Booking</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Multi-Branch &amp; PBX Call Routing</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Direct EHR &amp; WhatsApp Calendar Sync</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Natural Arabic &amp; English Voice Accents</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Dedicated Technical Account Manager</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('Pulse Speak')}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold text-center block transition-all cursor-pointer shadow-2xs"
                  >
                    Request Voice Demo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION 3: ENTERPRISE TRUST & DATA ISOLATION ─── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="size-3.5" />
              </div>
              <span>ENTERPRISE GUARANTEE &amp; SECURITY INFRASTRUCTURE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                <ShieldCheck className="size-5 text-[#0d6157] dark:text-teal-300" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Enterprise Tenancy Isolation</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dedicated database tenancy schema ensuring zero cross-clinic data leakage.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                <Zap className="size-5 text-[#0d6157] dark:text-teal-300" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">24-Hour WhatsApp Onboarding</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Direct official Meta Cloud API migration and automated booking live in under 24 hours.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                <Globe2 className="size-5 text-[#0d6157] dark:text-teal-300" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Native Bilingual Engine</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Arabic and English clinical vocabulary with sub-50ms conversational response times.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── UPGRADE CONFIRMATION MODAL ─── */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Switch to {selectedPlanModal}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                You are about to switch <span className="font-bold text-slate-900 dark:text-white">{clinic.name}</span> to the{' '}
                <span className="font-bold text-slate-900 dark:text-white">{selectedPlanModal}</span> package ({billingCycle} billing).
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Tier:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedPlanModal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Term:</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 dark:border-slate-700 pt-1.5">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedPlanModal === 'Pulse Now'
                      ? billingCycle === 'monthly' ? '499 SAR/mo' : '399 SAR/mo (4,788 SAR/yr)'
                      : selectedPlanModal === 'Pulse HealthOS'
                      ? billingCycle === 'monthly' ? '1,099 SAR/mo' : '999 SAR/mo (11,988 SAR/yr)'
                      : 'Custom Enterprise Quote'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingUpgrade}
                onClick={handleConfirmUpgrade}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessingUpgrade ? 'Submitting Request…' : 'Confirm & Request Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
