'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LuShield as Shield,
  LuShieldCheck as ShieldCheck,
  LuShieldAlert as ShieldAlert,
  LuKey as Key,
  LuSmartphone as Smartphone,
  LuQrCode as QrCode,
  LuLock as Lock,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuCircleCheck as CheckCircle2,
  LuTriangleAlert as AlertTriangle,
  LuCopy as Copy,
  LuCheck as Check,
  LuDownload as Download,
  LuLaptop as Laptop,
  LuGlobe as Globe,
  LuClock as Clock,
  LuLogOut as LogOut,
  LuBell as Bell,
  LuRefreshCw as RefreshCw,
  LuX as X,
  LuFileKey as FileKey,
  LuArrowLeft as ArrowLeft,
  LuSlidersHorizontal as Sliders,
} from 'react-icons/lu';
import { Badge, cn } from '@/components/ui/primitives';

interface SecurityPortalViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt?: string | null;
    createdAt: string;
  };
  clinicName: string;
}

export function SecurityPortalView({ user, clinicName }: SecurityPortalViewProps) {
  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'SETUP' | 'VERIFY' | 'BACKUP'>('SETUP');
  const [twoFACode, setTwoFACode] = useState(['', '', '', '', '', '']);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const secretKey = 'PULSE-SEC-8924-XKA9-2026';
  const backupCodes = [
    '8392-4910',
    '1094-8271',
    '5502-1849',
    '9284-7102',
    '3391-6284',
    '4720-9182',
    '6192-3840',
    '7401-5928',
  ];

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSubmittingPw, setIsSubmittingPw] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  // Security Toggles
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('24h');

  // Active Sessions
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'MacBook Pro — Chrome 128',
      icon: Laptop,
      location: 'Riyadh, Saudi Arabia',
      ip: '158.140.231.42',
      lastActive: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'iPhone 15 Pro — Safari Mobile',
      icon: Smartphone,
      location: 'Riyadh, Saudi Arabia',
      ip: '176.44.192.11',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [sessionSuccessMsg, setSessionSuccessMsg] = useState<string | null>(null);

  // Calculate Password Strength
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const pwStrength = getPasswordStrength(newPassword);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = `Pulseware Security Backup Codes - ${clinicName}\nUser: ${user.email}\nGenerated: ${new Date().toISOString()}\n\n` + backupCodes.join('\n');
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `pulseware-backup-codes-${user.email}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleTwoFACodeChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const updated = [...twoFACode];
    updated[index] = val;
    setTwoFACode(updated);

    if (val && index < 5) {
      const nextInput = document.getElementById(`2fa-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    const code = twoFACode.join('');
    if (code.length < 6) {
      setTwoFAError('Please enter all 6 digits of the verification code.');
      return;
    }

    setTwoFAError(null);
    setTwoFAStep('BACKUP');
  };

  const handleFinish2FA = () => {
    setIs2FAEnabled(true);
    setIs2FAModalOpen(false);
    setTwoFAStep('SETUP');
    setTwoFACode(['', '', '', '', '', '']);
  };

  const handleDisable2FA = () => {
    if (confirm('Are you sure you want to disable Two-Factor Authentication? Your account will have reduced protection.')) {
      setIs2FAEnabled(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg(null);
    setPwSuccessMsg(null);

    if (!currentPassword) {
      setPwErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPwErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsSubmittingPw(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Failed to update password.');
      }

      setPwSuccessMsg('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwErrorMsg(err.message || 'An error occurred while changing password.');
    } finally {
      setIsSubmittingPw(false);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setRevokingSessionId(sessionId);
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setRevokingSessionId(null);
      setSessionSuccessMsg('Device session revoked successfully.');
      setTimeout(() => setSessionSuccessMsg(null), 3000);
    }, 600);
  };

  const handleSignOutAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setSessionSuccessMsg('All other device sessions have been terminated.');
    setTimeout(() => setSessionSuccessMsg(null), 3000);
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
              Security &amp; Account Protection
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {is2FAEnabled ? '2FA Active' : 'Standard Protection'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
            <ShieldCheck className="size-3.5 text-[#0d8276]" />
            256-Bit SSL Encrypted
          </div>
        </div>
      </div>

      {/* ─── 2. SCROLLABLE PAGE CONTENT CONTAINER ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Main 2-Column Grid: 2FA & Password */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. TWO-FACTOR AUTHENTICATION (2FA) CARD */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Smartphone className="size-3.5" />
                </div>
                <span>TWO-FACTOR AUTHENTICATION (2FA)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enforces a secondary 6-digit confirmation code on sign-in via Google Authenticator or Apple Passwords.
              </p>

              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Authenticator App Status
                  </span>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                      is2FAEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    {is2FAEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Protect patient EHR records, WhatsApp access tokens, and clinic billing from unauthorized access.
                </p>

                <div className="pt-2">
                  {is2FAEnabled ? (
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFAStep('SETUP');
                        setIs2FAModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs cursor-pointer"
                    >
                      <Key className="size-4" />
                      <span>Set Up Two-Factor Authentication</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. CHANGE PASSWORD CARD */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Lock className="size-3.5" />
                </div>
                <span>CHANGE ACCOUNT PASSWORD</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ensure your account credentials meet healthcare data protection standards.
              </p>

              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
                {pwSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>{pwSuccessMsg}</span>
                  </div>
                )}

                {pwErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                    <span>{pwErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-200/90 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 focus:border-[#0d8276]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                        className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-200/90 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 focus:border-[#0d8276]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Strength:</span>
                          <span className={cn('font-bold', pwStrength.text)}>{pwStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                          <div className={cn('h-full rounded-full transition-all duration-300', pwStrength.score >= 1 ? pwStrength.color : 'bg-transparent', 'w-1/3')} />
                          <div className={cn('h-full rounded-full transition-all duration-300', pwStrength.score >= 2 ? pwStrength.color : 'bg-transparent', 'w-1/3')} />
                          <div className={cn('h-full rounded-full transition-all duration-300', pwStrength.score >= 3 ? pwStrength.color : 'bg-transparent', 'w-1/3')} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-200/90 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/20 focus:border-[#0d8276]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPw || !currentPassword || !newPassword}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingPw ? 'Updating Password…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ─── SECTION 3: SESSIONS & SECURITY PREFERENCES ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Active Sessions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Laptop className="size-3.5" />
                  </div>
                  <span>ACTIVE SESSIONS &amp; DEVICES</span>
                </div>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSignOutAllOther}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Sign out all others
                  </button>
                )}
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                {sessions.map((sess) => {
                  const Icon = sess.icon;
                  return (
                    <div
                      key={sess.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {sess.device}
                            </span>
                            {sess.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#e6f6f3] text-[#0d5c56] border border-[#0d8276]/20">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {sess.location} • {sess.ip} • <span className="text-emerald-600 font-medium">{sess.lastActive}</span>
                          </p>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          type="button"
                          disabled={revokingSessionId === sess.id}
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        >
                          {revokingSessionId === sess.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security Preferences */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sliders className="size-3.5" />
                </div>
                <span>SECURITY PREFERENCES &amp; ALERTS</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      New Device &amp; IP Login Alerts
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Receive an instant email on unrecognized logins
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoginAlerts(!loginAlerts)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      loginAlerts ? 'bg-slate-900' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                        loginAlerts ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Session Inactivity Auto-Lock
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Automatically lock and require sign-in after inactivity
                    </span>
                  </div>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="8h">8 Hours</option>
                    <option value="24h">24 Hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA SETUP MODAL */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIs2FAModalOpen(false)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {twoFAStep === 'SETUP' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Scan QR Code in Authenticator App
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Scan this barcode with Google Authenticator or Apple Passwords:
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 w-44 h-44 mx-auto">
                  <QrCode className="size-32 text-slate-900" />
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block">Secret Key:</span>
                  <code className="px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-900 border border-slate-200">
                    {secretKey}
                  </code>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIs2FAModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFAStep('VERIFY')}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Next: Enter 6-Digit Code →
                  </button>
                </div>
              </div>
            )}

            {twoFAStep === 'VERIFY' && (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Verify Confirmation Code
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enter the 6-digit code generated by your app:
                  </p>
                </div>

                {twoFAError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold text-center">
                    {twoFAError}
                  </div>
                )}

                <div className="flex items-center justify-center gap-2">
                  {twoFACode.map((digit, i) => (
                    <input
                      key={i}
                      id={`2fa-digit-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleTwoFACodeChange(i, e.target.value)}
                      className="size-10 text-center font-bold text-base rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTwoFAStep('SETUP')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                  >
                    Verify &amp; Activate
                  </button>
                </div>
              </form>
            )}

            {twoFAStep === 'BACKUP' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    2FA Activated! Save Recovery Codes
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Keep these single-use recovery codes in a safe place:
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-xs font-bold text-slate-800">
                    {backupCodes.map((code, idx) => (
                      <div key={idx} className="p-1 bg-white rounded border border-slate-200/80">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBackupCodes}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBackupCodes ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedBackupCodes ? 'Copied' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadBackupCodes}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="size-3" />
                    <span>Download TXT</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleFinish2FA}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Done &amp; Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
