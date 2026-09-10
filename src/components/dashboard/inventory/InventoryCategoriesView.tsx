'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  createdAt: string | Date;
  _count?: { items: number };
}

interface InventoryCategoriesViewProps {
  initialCategories: CategoryRow[];
  clinicName: string;
}

export function InventoryCategoriesView({
  initialCategories,
  clinicName,
}: InventoryCategoriesViewProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [categories, searchQuery]);

  const totalItemsCount = useMemo(
    () => categories.reduce((sum, c) => sum + (c._count?.items ?? 0), 0),
    [categories],
  );

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create category.');

      setCategories((prev) => [...prev, { ...data.category, _count: { items: 0 } }]);
      setIsAddModalOpen(false);
      setName('');
      setDescription('');
      setSuccessMsg(`Category "${name}" created successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/categories?id=${selectedCategory.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete category.');

      setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id));
      setIsDeleteModalOpen(false);
      setSuccessMsg(`Category "${selectedCategory.name}" removed.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting category.');
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
            <Layers className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Item Categories</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Organize medical supplies, skincare, and equipment categories for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setName('');
            setDescription('');
            setErrorMsg(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="size-3.5" />
          <span>Add Category</span>
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
      <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Categories
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {categories.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3]/80 dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                Configured groups
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Layers className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
              Categorized Items
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalItemsCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/25 inline-block">
                Catalog association
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/25 shadow-2xs">
            <Package className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
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
                <th className="py-2.5 px-6">Category Name</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Associated Items</th>
                <th className="py-2.5 px-4">Created Date</th>
                <th className="py-2.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Layers className="size-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No categories found.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Add Category" above to group your inventory items.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#f0f9f7]/60 dark:hover:bg-[#0d6157]/10 transition-colors"
                  >
                    <td className="py-3 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#0d8276]"></span>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {c.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/portal/inventory/items?category=${c.id}`}
                        className="inline-flex items-center gap-1 font-bold text-[#0d6157] dark:text-teal-400 hover:underline"
                      >
                        {c._count?.items ?? 0} items
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(c);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-[8px] transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD CATEGORY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Add Item Category</h3>
                  <p className="text-[10px] text-slate-400">Categorize supplies and consumables</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skincare Products, Medical Consumables"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or department usage..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-red-50 dark:bg-red-950 text-red-600">
                  <Trash2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Delete Category</h3>
                  <p className="text-[10px] text-slate-400">Confirm category removal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{selectedCategory.name}</strong>? Items assigned to this category will become uncategorized.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCategory}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
