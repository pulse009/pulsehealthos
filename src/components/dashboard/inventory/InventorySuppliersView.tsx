'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';

export interface SupplierRow {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  taxNumber: string | null;
  paymentTerms: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | Date;
  _count?: { items: number; purchaseOrders: number };
}

interface InventorySuppliersViewProps {
  initialSuppliers: SupplierRow[];
  clinicName: string;
}

export function InventorySuppliersView({
  initialSuppliers,
  clinicName,
}: InventorySuppliersViewProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)),
    );
  }, [suppliers, searchQuery]);

  const totalSuppliedItems = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s._count?.items ?? 0), 0),
    [suppliers],
  );
  const totalPOs = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s._count?.purchaseOrders ?? 0), 0),
    [suppliers],
  );

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setCountry('');
    setTaxNumber('');
    setPaymentTerms('Net 30');
    setNotes('');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Supplier name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contactPerson: contactPerson.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          taxNumber: taxNumber.trim() || undefined,
          paymentTerms: paymentTerms.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create supplier.');

      setSuppliers((prev) => [
        { ...data.supplier, _count: { items: 0, purchaseOrders: 0 } },
        ...prev,
      ]);
      setIsAddModalOpen(false);
      setSuccessMsg(`Supplier "${name}" registered successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/suppliers?id=${selectedSupplier.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete supplier.');

      setSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplier.id));
      setIsDeleteModalOpen(false);
      setSuccessMsg(`Supplier "${selectedSupplier.name}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Truck className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Suppliers &amp; Vendors Directory</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Vendor contacts, payment terms, and procurement channels for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="size-3.5" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Suppliers
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {suppliers.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3]/80 dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                Registered vendors
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Truck className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
              Assigned Products
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalSuppliedItems}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/25 inline-block">
                Catalog linkages
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/25 shadow-2xs">
            <Package className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
              Total Purchase Orders
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalPOs}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/25 inline-block">
                Order history
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/25 shadow-2xs">
            <FileText className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers, contacts, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* 4. TABLE */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-6">Supplier Name</th>
                <th className="py-2.5 px-4">Contact Person</th>
                <th className="py-2.5 px-4">Phone &amp; Email</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Payment Terms</th>
                <th className="py-2.5 px-4">Items</th>
                <th className="py-2.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Truck className="size-8 mx-auto mb-2 opacity-40 text-[#0d6157]" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No suppliers registered.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Add vendor profiles using "Add Supplier" to link with purchase orders.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-[#f0f9f7]/60 dark:hover:bg-[#0d6157]/10 transition-colors"
                  >
                    <td className="py-3 px-6 font-bold text-slate-900 dark:text-white">
                      {s.name}
                      {s.taxNumber && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Tax ID: {s.taxNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {s.contactPerson || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                          <Phone className="size-3 text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Mail className="size-3 text-slate-400" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {!s.phone && !s.email && <span>—</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      {s.city ? `${s.city}${s.country ? ', ' + s.country : ''}` : '—'}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <span className="bg-[#e6f6f3]/80 dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/20 px-2 py-0.5 rounded-[8px] text-[10px] font-semibold">
                        {s.paymentTerms || 'Standard'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0d6157] dark:text-teal-400">
                        {s._count?.items ?? 0} items
                      </span>
                    </td>

                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href="/portal/inventory/purchase-orders"
                          className="px-2.5 py-1 text-[10px] font-semibold bg-[#e6f6f3] hover:bg-[#d0f0eb] dark:bg-[#0d6157]/20 dark:hover:bg-[#0d6157]/30 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/20 rounded-[8px] transition-colors"
                        >
                          New PO
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplier(s);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[8px] transition-colors cursor-pointer"
                          title="Delete Supplier"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD SUPPLIER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-400 border border-[#0d8276]/20">
                  <Truck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Register Supplier</h3>
                  <p className="text-[11px] text-slate-500">Add medical supply vendor details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-[8px] flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MediPharm Global Ltd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="orders@medipharm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Net 30, COD, Advance"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    City / Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. London, UK"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Tax / VAT Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GB123456789"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  placeholder="Street address, unit, building..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSubmitting ? 'Saving...' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {isDeleteModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[8px] bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200/60">
                  <Trash2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Supplier</h3>
                  <p className="text-[11px] text-slate-500">Confirm supplier profile removal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1.5 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{selectedSupplier.name}</strong>? Items associated with this supplier will remain in your catalog.
            </p>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteSupplier}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-[8px] shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
