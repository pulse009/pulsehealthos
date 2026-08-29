'use client';

import { useActionState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/primitives';
import type { FormState } from '@/app/admin/clinics/actions';

/**
 * Thin wrapper over `useActionState` so every settings form gets the same
 * pending state, success banner and error banner without repeating the wiring.
 *
 * The children render prop receives the current state, which is how individual
 * fields surface their own `fieldErrors` entry.
 */

const initialState: FormState = { status: 'idle' };

function SubmitButton({ label }: { label: string }) {
  // `useFormStatus` must be read from a child of the <form>, not the form itself.
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

export function ActionForm({
  action,
  submitLabel = 'Save changes',
  children,
  footer,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  submitLabel?: string;
  children: ReactNode | ((state: FormState) => ReactNode);
  footer?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {typeof children === 'function' ? children(state) : children}

      {state.status === 'error' && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      {state.status === 'success' && state.message ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        {footer}
      </div>
    </form>
  );
}

/** Confirm-then-run wrapper for destructive inline actions. */
export function ConfirmButton({
  onConfirm,
  confirmMessage,
  children,
}: {
  onConfirm: () => Promise<void>;
  confirmMessage: string;
  children: ReactNode;
}) {
  return (
    <form
      action={onConfirm}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <Button type="submit" variant="ghost" size="sm" className="text-red-600 dark:text-red-400">
        {children}
      </Button>
    </form>
  );
}
