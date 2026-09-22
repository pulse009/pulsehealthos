'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AllSiteContent,
  SiteContentKey,
  StatItem,
  ArchitectureItem,
  ProductCard,
  FeatureCategory,
  PricingPlan,
  LeadershipMember,
  RegionalOffice,
} from '@/lib/cms/types';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Layers,
  Megaphone,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';

interface CmsAdminClientProps {
  initialContent: AllSiteContent;
  adminName: string;
}

export function CmsAdminClient({ initialContent, adminName }: CmsAdminClientProps) {
  const [content, setContent] = useState<AllSiteContent>(initialContent);
  const [activeTab, setActiveTab] = useState<SiteContentKey>('announcement');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tabs: { key: SiteContentKey; label: string; icon: React.ComponentType<{ className?: string }>; previewHref: string }[] = [
    { key: 'announcement', label: 'Announcement Bar', icon: Megaphone, previewHref: '/' },
    { key: 'hero', label: 'Hero & Landing', icon: Zap, previewHref: '/' },
    { key: 'architecture', label: 'Architecture Strip', icon: ShieldCheck, previewHref: '/' },
    { key: 'products', label: 'Products Suite', icon: Layers, previewHref: '/products' },
    { key: 'features', label: 'Features Matrix', icon: FileText, previewHref: '/features' },
    { key: 'pricing', label: 'Pricing & Plans', icon: CreditCard, previewHref: '/pricing' },
    { key: 'about', label: 'About & Team', icon: Users, previewHref: '/about' },
    { key: 'contact', label: 'Contact & Hotline', icon: Phone, previewHref: '/contact' },
    { key: 'footer', label: 'Footer & Trust', icon: Globe, previewHref: '/' },
  ];

  const handleSave = async (keyToSave: SiteContentKey) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyToSave,
          content: content[keyToSave],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setStatusMessage({
        type: 'success',
        text: `Saved "${tabs.find((t) => t.key === keyToSave)?.label}" successfully!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async (keyToReset: SiteContentKey) => {
    if (!confirm(`Reset "${tabs.find((t) => t.key === keyToReset)?.label}" to system default copy?`)) return;

    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyToReset,
          resetToDefault: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset');

      setContent((prev) => ({ ...prev, [keyToReset]: data.content }));
      setStatusMessage({
        type: 'success',
        text: `Reset "${tabs.find((t) => t.key === keyToReset)?.label}" to original defaults!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error resetting section' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Globe className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Website Dynamic Content CMS</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Edit live marketing copy, prices, features, contact numbers (+966 556322688), and announcements. Logged in as <strong className="text-slate-700">{adminName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={tabs.find((t) => t.key === activeTab)?.previewHref || '/'}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            <Eye className="size-3.5" />
            <span>View Public Page</span>
            <ExternalLink className="size-3" />
          </Link>
          <button
            type="button"
            onClick={() => handleSave(activeTab)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>Save Section</span>
          </button>
        </div>
      </div>

      {/* ─── Status Alert ─── */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="font-bold text-xs opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Tabs Navigation Strip ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0d6157] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Active Tab Form Content ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* TAB 1: ANNOUNCEMENT BAR */}
        {activeTab === 'announcement' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Announcement Banner</h3>
                <p className="text-xs text-slate-500">Displayed at the top of all public pages.</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.announcement.isEnabled}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, isEnabled: e.target.checked },
                    })
                  }
                  className="rounded text-teal-600 focus:ring-teal-500 size-4"
                />
                <span>Banner Enabled</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={content.announcement.badge}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, badge: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action Link URL</label>
                <input
                  type="text"
                  value={content.announcement.linkHref}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, linkHref: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Desktop Message</label>
                <input
                  type="text"
                  value={content.announcement.textDesktop}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, textDesktop: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Short Message</label>
                <input
                  type="text"
                  value={content.announcement.textMobile}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, textMobile: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Link Label</label>
              <input
                type="text"
                value={content.announcement.linkText}
                onChange={(e) =>
                  setContent({
                    ...content,
                    announcement: { ...content.announcement, linkText: e.target.value },
                  })
                }
                className="w-full max-w-sm px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 2: HERO & LANDING */}
        {activeTab === 'hero' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Hero Section &amp; Metrics</h3>
              <p className="text-xs text-slate-500">Main headline, subtitle, CTAs, and fast metrics.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Tagline</label>
              <input
                type="text"
                value={content.hero.badgeText}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, badgeText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 1 (Teal)</label>
                <input
                  type="text"
                  value={content.hero.headlineFirst}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, headlineFirst: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 2 (Dark)</label>
                <input
                  type="text"
                  value={content.hero.headlineSecond}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, headlineSecond: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Subtitle</label>
              <textarea
                rows={3}
                value={content.hero.subtitle}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, subtitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary CTA Label</label>
                <input
                  type="text"
                  value={content.hero.primaryCtaText}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, primaryCtaText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary CTA Link</label>
                <input
                  type="text"
                  value={content.hero.primaryCtaHref}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, primaryCtaHref: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary CTA Label</label>
                <input
                  type="text"
                  value={content.hero.secondaryCtaText}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, secondaryCtaText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary CTA Link</label>
                <input
                  type="text"
                  value={content.hero.secondaryCtaHref}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, secondaryCtaHref: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Metrics cards */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">Fast Stats Row</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {content.hero.stats.map((stat, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Value</span>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => {
                          const updated = [...content.hero.stats];
                          const item = updated[idx];
                          if (item) {
                            updated[idx] = { ...item, value: e.target.value };
                            setContent({ ...content, hero: { ...content.hero, stats: updated } });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Label</span>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const updated = [...content.hero.stats];
                          const item = updated[idx];
                          if (item) {
                            updated[idx] = { ...item, label: e.target.value };
                            setContent({ ...content, hero: { ...content.hero, stats: updated } });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Architecture &amp; Enterprise Standards Strip</h3>
              <p className="text-xs text-slate-500">4-column technical standards banner below the hero.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={content.architecture.badge}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      architecture: { ...content.architecture, badge: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={content.architecture.title}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      architecture: { ...content.architecture, title: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={content.architecture.subtitle}
                onChange={(e) =>
                  setContent({
                    ...content,
                    architecture: { ...content.architecture, subtitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="pt-2 space-y-3">
              <label className="text-xs font-bold text-slate-800">4 Architecture Pillars</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.architecture.items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-teal-700">Pillar #{idx + 1}</span>
                      <input
                        type="text"
                        value={item.tag}
                        placeholder="Tag (e.g. 0% Collisions)"
                        onChange={(e) => {
                          const updated = [...content.architecture.items];
                          const target = updated[idx];
                          if (target) {
                            updated[idx] = { ...target, tag: e.target.value };
                            setContent({ ...content, architecture: { ...content.architecture, items: updated } });
                          }
                        }}
                        className="px-2 py-1 rounded bg-white border border-slate-200 text-[11px] font-semibold text-right"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.title}
                        placeholder="Pillar Title"
                        onChange={(e) => {
                          const updated = [...content.architecture.items];
                          const target = updated[idx];
                          if (target) {
                            updated[idx] = { ...target, title: e.target.value };
                            setContent({ ...content, architecture: { ...content.architecture, items: updated } });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        value={item.desc}
                        placeholder="Description"
                        onChange={(e) => {
                          const updated = [...content.architecture.items];
                          const target = updated[idx];
                          if (target) {
                            updated[idx] = { ...target, desc: e.target.value };
                            setContent({ ...content, architecture: { ...content.architecture, items: updated } });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRODUCTS SUITE */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Platform Products Suite</h3>
              <p className="text-xs text-slate-500">
                Pulse HealthOS, Pulse Now (WhatsApp), and Pulse Speak (Voice AI).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 1</label>
                <input
                  type="text"
                  value={content.products.headlineFirst}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      products: { ...content.products, headlineFirst: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 2</label>
                <input
                  type="text"
                  value={content.products.headlineSecond}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      products: { ...content.products, headlineSecond: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              {content.products.products.map((prod, pIdx) => (
                <div key={prod.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="size-4 text-teal-600" />
                      <span>{prod.name}</span>
                    </span>
                    <input
                      type="text"
                      value={prod.monthlyPrice}
                      onChange={(e) => {
                        const updated = [...content.products.products];
                        const target = updated[pIdx];
                        if (target) {
                          updated[pIdx] = { ...target, monthlyPrice: e.target.value };
                          setContent({ ...content, products: { ...content.products, products: updated } });
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-teal-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product Subtitle</label>
                      <input
                        type="text"
                        value={prod.subtitle}
                        onChange={(e) => {
                          const updated = [...content.products.products];
                          const target = updated[pIdx];
                          if (target) {
                            updated[pIdx] = { ...target, subtitle: e.target.value };
                            setContent({ ...content, products: { ...content.products, products: updated } });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge</label>
                      <input
                        type="text"
                        value={prod.badge}
                        onChange={(e) => {
                          const updated = [...content.products.products];
                          const target = updated[pIdx];
                          if (target) {
                            updated[pIdx] = { ...target, badge: e.target.value };
                            setContent({ ...content, products: { ...content.products, products: updated } });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Description</label>
                    <textarea
                      rows={2}
                      value={prod.description}
                      onChange={(e) => {
                        const updated = [...content.products.products];
                        const target = updated[pIdx];
                        if (target) {
                          updated[pIdx] = { ...target, description: e.target.value };
                          setContent({ ...content, products: { ...content.products, products: updated } });
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">Product Features</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {prod.features.map((feat, fIdx) => (
                        <div key={fIdx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <input
                            type="text"
                            value={feat.title}
                            placeholder="Feature Title"
                            onChange={(e) => {
                              const updatedProds = [...content.products.products];
                              const targetProd = updatedProds[pIdx];
                              if (targetProd && targetProd.features[fIdx]) {
                                const curFeat = targetProd.features[fIdx]!;
                                const updatedFeats = [...targetProd.features];
                                updatedFeats[fIdx] = { ...curFeat, title: e.target.value };
                                updatedProds[pIdx] = { ...targetProd, features: updatedFeats };
                                setContent({ ...content, products: { ...content.products, products: updatedProds } });
                              }
                            }}
                            className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-semibold"
                          />
                          <textarea
                            rows={2}
                            value={feat.desc}
                            placeholder="Description"
                            onChange={(e) => {
                              const updatedProds = [...content.products.products];
                              const targetProd = updatedProds[pIdx];
                              if (targetProd && targetProd.features[fIdx]) {
                                const curFeat = targetProd.features[fIdx]!;
                                const updatedFeats = [...targetProd.features];
                                updatedFeats[fIdx] = { ...curFeat, desc: e.target.value };
                                updatedProds[pIdx] = { ...targetProd, features: updatedFeats };
                                setContent({ ...content, products: { ...content.products, products: updatedProds } });
                              }
                            }}
                            className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FEATURES MATRIX */}
        {activeTab === 'features' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Clinical &amp; Operational Features Matrix</h3>
              <p className="text-xs text-slate-500">6 feature pillars on `/features`.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 1</label>
                <input
                  type="text"
                  value={content.features.headlineFirst}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      features: { ...content.features, headlineFirst: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 2</label>
                <input
                  type="text"
                  value={content.features.headlineSecond}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      features: { ...content.features, headlineSecond: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {content.features.categories.map((cat, cIdx) => (
                <div key={cat.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={cat.categoryName}
                      onChange={(e) => {
                        const updated = [...content.features.categories];
                        const target = updated[cIdx];
                        if (target) {
                          updated[cIdx] = { ...target, categoryName: e.target.value };
                          setContent({ ...content, features: { ...content.features, categories: updated } });
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900"
                    />
                    <input
                      type="text"
                      value={cat.tag}
                      onChange={(e) => {
                        const updated = [...content.features.categories];
                        const target = updated[cIdx];
                        if (target) {
                          updated[cIdx] = { ...target, tag: e.target.value };
                          setContent({ ...content, features: { ...content.features, categories: updated } });
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-teal-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cat.items.map((item, iIdx) => (
                      <div key={iIdx} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updatedCats = [...content.features.categories];
                            const targetCat = updatedCats[cIdx];
                            if (targetCat && targetCat.items[iIdx]) {
                              const curItem = targetCat.items[iIdx]!;
                              const updatedItems = [...targetCat.items];
                              updatedItems[iIdx] = { ...curItem, title: e.target.value };
                              updatedCats[cIdx] = { ...targetCat, items: updatedItems };
                              setContent({ ...content, features: { ...content.features, categories: updatedCats } });
                            }
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-semibold"
                        />
                        <textarea
                          rows={2}
                          value={item.desc}
                          onChange={(e) => {
                            const updatedCats = [...content.features.categories];
                            const targetCat = updatedCats[cIdx];
                            if (targetCat && targetCat.items[iIdx]) {
                              const curItem = targetCat.items[iIdx]!;
                              const updatedItems = [...targetCat.items];
                              updatedItems[iIdx] = { ...curItem, desc: e.target.value };
                              updatedCats[cIdx] = { ...targetCat, items: updatedItems };
                              setContent({ ...content, features: { ...content.features, categories: updatedCats } });
                            }
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PRICING & PLANS */}
        {activeTab === 'pricing' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pricing Packages</h3>
              <p className="text-xs text-slate-500">Configure monthly &amp; annual rates for all plans.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 1</label>
                <input
                  type="text"
                  value={content.pricing.headlineFirst}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pricing: { ...content.pricing, headlineFirst: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 2 (Teal)</label>
                <input
                  type="text"
                  value={content.pricing.headlineSecond}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pricing: { ...content.pricing, headlineSecond: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Tag (e.g. Save up to 20%)</label>
              <input
                type="text"
                value={content.pricing.discountBadge}
                onChange={(e) =>
                  setContent({
                    ...content,
                    pricing: { ...content.pricing, discountBadge: e.target.value },
                  })
                }
                className="w-full max-w-sm px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
              {content.pricing.plans.map((plan, pIdx) => (
                <div key={plan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => {
                        const updated = [...content.pricing.plans];
                        const target = updated[pIdx];
                        if (target) {
                          updated[pIdx] = { ...target, name: e.target.value };
                          setContent({ ...content, pricing: { ...content.pricing, plans: updated } });
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                    />
                    {plan.isPopular && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold">Monthly Price</span>
                      <input
                        type="text"
                        value={plan.monthlyPrice}
                        onChange={(e) => {
                          const updated = [...content.pricing.plans];
                          const target = updated[pIdx];
                          if (target) {
                            updated[pIdx] = { ...target, monthlyPrice: e.target.value };
                            setContent({ ...content, pricing: { ...content.pricing, plans: updated } });
                          }
                        }}
                        className="w-full px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold">Annual Price</span>
                      <input
                        type="text"
                        value={plan.annualPrice}
                        onChange={(e) => {
                          const updated = [...content.pricing.plans];
                          const target = updated[pIdx];
                          if (target) {
                            updated[pIdx] = { ...target, annualPrice: e.target.value };
                            setContent({ ...content, pricing: { ...content.pricing, plans: updated } });
                          }
                        }}
                        className="w-full px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold">Features (one per line)</span>
                    <textarea
                      rows={6}
                      value={plan.features.join('\n')}
                      onChange={(e) => {
                        const updated = [...content.pricing.plans];
                        const target = updated[pIdx];
                        if (target) {
                          updated[pIdx] = {
                            ...target,
                            features: e.target.value.split('\n').filter((f) => f.trim().length > 0),
                          };
                          setContent({ ...content, pricing: { ...content.pricing, plans: updated } });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ABOUT & LEADERSHIP */}
        {activeTab === 'about' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">About Story, Mission &amp; Leadership</h3>
              <p className="text-xs text-slate-500">Edit company background, metrics, and team bios.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 1</label>
                <input
                  type="text"
                  value={content.about.headlineFirst}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      about: { ...content.about, headlineFirst: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Part 2 (Teal)</label>
                <input
                  type="text"
                  value={content.about.headlineSecond}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      about: { ...content.about, headlineSecond: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mission Statement</label>
              <textarea
                rows={3}
                value={content.about.missionText}
                onChange={(e) =>
                  setContent({
                    ...content,
                    about: { ...content.about, missionText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="pt-2 space-y-3">
              <label className="text-xs font-bold text-slate-800">Leadership Team Bios</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.about.leadership.map((member, mIdx) => (
                  <div key={mIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => {
                        const updated = [...content.about.leadership];
                        const target = updated[mIdx];
                        if (target) {
                          updated[mIdx] = { ...target, name: e.target.value };
                          setContent({ ...content, about: { ...content.about, leadership: updated } });
                        }
                      }}
                      className="w-full px-3 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => {
                        const updated = [...content.about.leadership];
                        const target = updated[mIdx];
                        if (target) {
                          updated[mIdx] = { ...target, role: e.target.value };
                          setContent({ ...content, about: { ...content.about, leadership: updated } });
                        }
                      }}
                      className="w-full px-3 py-1 rounded bg-white border border-slate-200 text-xs text-teal-700 font-semibold"
                    />
                    <textarea
                      rows={2}
                      value={member.desc}
                      onChange={(e) => {
                        const updated = [...content.about.leadership];
                        const target = updated[mIdx];
                        if (target) {
                          updated[mIdx] = { ...target, desc: e.target.value };
                          setContent({ ...content, about: { ...content.about, leadership: updated } });
                        }
                      }}
                      className="w-full px-3 py-1 rounded bg-white border border-slate-200 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: CONTACT & HOTLINE */}
        {activeTab === 'contact' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Direct Contact Hotline &amp; WhatsApp</h3>
              <p className="text-xs text-slate-500">Phone number, WhatsApp direct URL, offices and hours.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone Hotline</label>
                <input
                  type="text"
                  value={content.contact.phone}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, phone: e.target.value },
                    })
                  }
                  placeholder="+966 556322688"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Direct Link</label>
                <input
                  type="text"
                  value={content.contact.whatsappUrl}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, whatsappUrl: e.target.value },
                    })
                  }
                  placeholder="https://wa.me/966556322688"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Working Days</label>
                <input
                  type="text"
                  value={content.contact.workingHoursDays}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, workingHoursDays: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Working Hours</label>
                <input
                  type="text"
                  value={content.contact.workingHoursTime}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, workingHoursTime: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timezones</label>
                <input
                  type="text"
                  value={content.contact.workingHoursTz}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, workingHoursTz: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="text-xs font-bold text-slate-800">Regional Headquarters</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.contact.offices.map((office, oIdx) => (
                  <div key={oIdx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={office.city}
                        placeholder="City"
                        onChange={(e) => {
                          const updated = [...content.contact.offices];
                          const target = updated[oIdx];
                          if (target) {
                            updated[oIdx] = { ...target, city: e.target.value };
                            setContent({ ...content, contact: { ...content.contact, offices: updated } });
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={office.country}
                        placeholder="Country"
                        onChange={(e) => {
                          const updated = [...content.contact.offices];
                          const target = updated[oIdx];
                          if (target) {
                            updated[oIdx] = { ...target, country: e.target.value };
                            setContent({ ...content, contact: { ...content.contact, offices: updated } });
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={office.address}
                      placeholder="Address"
                      onChange={(e) => {
                        const updated = [...content.contact.offices];
                        const target = updated[oIdx];
                        if (target) {
                          updated[oIdx] = { ...target, address: e.target.value };
                          setContent({ ...content, contact: { ...content.contact, offices: updated } });
                        }
                      }}
                      className="w-full px-2.5 py-1 rounded bg-white border border-slate-200 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: FOOTER & TRUST */}
        {activeTab === 'footer' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Footer Tagline &amp; Trust Badges</h3>
              <p className="text-xs text-slate-500">Universal footer displayed across all pages.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Description Tagline</label>
              <textarea
                rows={2}
                value={content.footer.tagline}
                onChange={(e) =>
                  setContent({
                    ...content,
                    footer: { ...content.footer, tagline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Copyright Notice</label>
                <input
                  type="text"
                  value={content.footer.copyright}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      footer: { ...content.footer, copyright: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Uptime Status Bar Text</label>
                <input
                  type="text"
                  value={content.footer.statusText}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      footer: { ...content.footer, statusText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Trust &amp; Security Badges</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {content.footer.trustBadges.map((badge, bIdx) => (
                  <input
                    key={bIdx}
                    type="text"
                    value={badge}
                    onChange={(e) => {
                      const updated = [...content.footer.trustBadges];
                      updated[bIdx] = e.target.value;
                      setContent({ ...content, footer: { ...content.footer, trustBadges: updated } });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Bottom Actions Strip ─── */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleResetToDefault(activeTab)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            <span>Restore Default Copy</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(activeTab)}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>Save &amp; Publish Changes</span>
          </button>
        </div>

      </div>
    </div>
  );
}
