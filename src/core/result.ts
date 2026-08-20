/** Explicit result type for provisioning operations. */
import type { InfraError } from './errors.ts';
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = InfraError> = Ok<T> | Err<E>;
export function ok(): Ok<void>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T | undefined> { return { ok: true, value }; }
export function err<E>(error: E): Err<E> { return { ok: false, error }; }
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> { return result.ok; }
export function isErr<T, E>(result: Result<T, E>): result is Err<E> { return !result.ok; }
export function unwrap<T, E>(result: Result<T, E>): T { if (result.ok) return result.value; throw new Error(`unwrap() called on an error result: ${String(result.error)}`); }
