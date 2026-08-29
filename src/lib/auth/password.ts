import 'server-only';
import bcrypt from 'bcryptjs';

/**
 * Password hashing. bcrypt with a work factor of 12 — deliberately slow enough
 * that offline cracking of a leaked hash is expensive.
 */
const SALT_ROUNDS = 12;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/**
 * Burn roughly the same CPU as a real verification for a non-existent user, so
 * response timing does not reveal whether an email is registered.
 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7bH0hUcOQFxDvKuG7yZ9jPnCzUEGKq6';
export const fakeVerify = (): Promise<boolean> => bcrypt.compare('placeholder', DUMMY_HASH);

export interface PasswordPolicyResult {
  ok: boolean;
  problems: string[];
}

/** Minimum viable policy; length is what actually matters most. */
export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const problems: string[] = [];
  if (password.length < 12) problems.push('Must be at least 12 characters long.');
  if (password.length > 200) problems.push('Must be at most 200 characters long.');
  if (!/[a-z]/.test(password)) problems.push('Must contain a lowercase letter.');
  if (!/[A-Z]/.test(password)) problems.push('Must contain an uppercase letter.');
  if (!/[0-9]/.test(password)) problems.push('Must contain a digit.');
  return { ok: problems.length === 0, problems };
}
