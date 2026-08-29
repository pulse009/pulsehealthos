'use client';

import React, { useState } from 'react';
import { Badge, Card, CardBody, CardHeader, Field, Input, Table, Td, Th } from '@/components/ui/primitives';
import { ActionForm } from '@/components/forms/action-form';
import { createClinicUserAction, resetClinicUserPasswordAction, type FormState } from '../actions';
import { Key, UserPlus, Users, CheckCircle2 } from 'lucide-react';

const err = (state: FormState, field: string) => state.fieldErrors?.[field];

export function ClinicUsersTab({
  clinicId,
  users,
}: {
  clinicId: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date | string;
    lastLoginAt?: Date | string | null;
  }>;
}) {
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const createAction = createClinicUserAction.bind(null, clinicId);
  const resetAction = resetClinicUserPasswordAction.bind(null, clinicId);

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Portal Accounts ({users.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer login credentials for clinic owner and staff portal access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showCreateForm ? 'Close Form' : 'Add Portal User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardHeader
            className="border-b border-emerald-100 dark:border-emerald-900/30 px-4 py-3"
            title="Create New Portal User Account"
            description="Provision credentials for a clinic owner or manager to access the portal."
          />
          <CardBody className="p-4">
            <ActionForm action={createAction} submitLabel="Create User Account">
              {(state) => (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" htmlFor="name" error={err(state, 'name')}>
                    <Input id="name" name="name" required placeholder="Dr. Sarah Ahmed" />
                  </Field>

                  <Field label="Login Email" htmlFor="email" error={err(state, 'email')}>
                    <Input id="email" name="email" type="email" required placeholder="owner@clinic.com" />
                  </Field>

                  <Field
                    label="Password"
                    htmlFor="password"
                    error={err(state, 'password')}
                    hint="Min 12 chars · uppercase · lowercase · digit"
                  >
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 select-none"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </Field>

                  <Field
                    label="Confirm Password"
                    htmlFor="passwordConfirm"
                    error={err(state, 'passwordConfirm')}
                  >
                    <div className="relative">
                      <Input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 select-none"
                      >
                        {showConfirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </Field>
                </div>
              )}
            </ActionForm>
          </CardBody>
        </Card>
      )}

      {/* Users Table */}
      <Card className="border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Th className="py-3 px-4">User</Th>
              <Th className="py-3 px-4">Email</Th>
              <Th className="py-3 px-4">Role</Th>
              <Th className="py-3 px-4">Status</Th>
              <Th className="py-3 px-4">Last Login</Th>
              <Th className="py-3 px-4 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No portal users found for this clinic. Click &quot;Add Portal User&quot; above to create one.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <Td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {user.name}
                    </Td>
                    <Td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {user.email}
                    </Td>
                    <Td className="py-3 px-4">
                      <Badge tone="info" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        {user.role}
                      </Badge>
                    </Td>
                    <Td className="py-3 px-4">
                      <Badge tone={user.isActive ? 'success' : 'neutral'} className="text-[10px] font-bold px-2 py-0.5">
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </Td>
                    <Td className="py-3 px-4 text-slate-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </Td>
                    <Td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setResetUserId((id) => (id === user.id ? null : user.id))}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        <Key className="w-3 h-3 text-slate-500" />
                        {resetUserId === user.id ? 'Cancel' : 'Reset Password'}
                      </button>
                    </Td>
                  </tr>

                  {/* Inline Reset Password Form */}
                  {resetUserId === user.id && (
                    <tr className="bg-slate-50 dark:bg-slate-800/40">
                      <td colSpan={6} className="p-4">
                        <div className="max-w-md space-y-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-emerald-600" />
                            Reset Password for {user.name} ({user.email})
                          </h5>
                          <ActionForm action={resetAction} submitLabel="Update Password">
                            {(state) => (
                              <div className="space-y-3">
                                <input type="hidden" name="userId" value={user.id} />
                                <Field
                                  label="New Password"
                                  htmlFor={`reset-pass-${user.id}`}
                                  error={err(state, 'password')}
                                >
                                  <Input
                                    id={`reset-pass-${user.id}`}
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••••••"
                                  />
                                </Field>
                                <Field
                                  label="Confirm New Password"
                                  htmlFor={`reset-confirm-${user.id}`}
                                  error={err(state, 'passwordConfirm')}
                                >
                                  <Input
                                    id={`reset-confirm-${user.id}`}
                                    name="passwordConfirm"
                                    type="password"
                                    required
                                    placeholder="••••••••••••"
                                  />
                                </Field>
                              </div>
                            )}
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
