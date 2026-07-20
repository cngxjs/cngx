import type { AsyncStatus } from '@cngx/core/utils';

/**
 * Lifecycle keys `[cngxAudioStatus]` accepts, mapped to the canonical
 * `AsyncStatus` the transition tracker emits. Two friendly aliases are folded
 * in: `succeeded -> success` and `failed -> error`, so both the raw status and
 * the past-tense reading parse to the same earcon.
 */
const STATUS_ALIASES: Readonly<Record<string, AsyncStatus>> = {
  idle: 'idle',
  loading: 'loading',
  pending: 'pending',
  refreshing: 'refreshing',
  success: 'success',
  succeeded: 'success',
  error: 'error',
  failed: 'error',
};

/** DOM-event keys that belong to `[cngxAudio]`, rejected here. */
export const CNGX_AUDIO_STATUS_DOM_EVENTS = [
  'click',
  'focus',
  'blur',
  'pointerenter',
  'pointerleave',
  'submit',
  'change',
  'input',
] as const;

/** Result of parsing a `status:earcon` binding string. */
export interface ParsedStatusBindings {
  /** Valid `status -> earcon` pairs, keyed by canonical `AsyncStatus`. */
  readonly bindings: ReadonlyMap<AsyncStatus, string>;
  /** DOM-event keys — the grammar of `[cngxAudio]`, not `[cngxAudioStatus]`. */
  readonly domEventKeys: readonly string[];
  /** Keys that are neither lifecycle statuses nor DOM events. */
  readonly unknownKeys: readonly string[];
}

const DOM_EVENT_SET = new Set<string>(CNGX_AUDIO_STATUS_DOM_EVENTS);

/**
 * Parse the `status:earcon` grammar (`'pending:tap, succeeded:success'`) into a
 * status map. Pure — no DOM, no `inject()`. Keys are categorised so the
 * directive can dev-error on DOM-event keys that should have used `[cngxAudio]`
 * and dev-warn on unknown keys. `succeeded`/`failed` normalise to
 * `success`/`error` so a lookup by the tracker's raw `AsyncStatus` hits.
 */
export function parseStatusBindings(spec: string): ParsedStatusBindings {
  const bindings = new Map<AsyncStatus, string>();
  const domEventKeys: string[] = [];
  const unknownKeys: string[] = [];

  for (const pair of spec.split(',')) {
    const trimmed = pair.trim();
    if (!trimmed) {
      continue;
    }
    const colon = trimmed.indexOf(':');
    if (colon === -1) {
      unknownKeys.push(trimmed);
      continue;
    }
    const key = trimmed.slice(0, colon).trim();
    const earcon = trimmed.slice(colon + 1).trim();
    const status = STATUS_ALIASES[key];
    if (status) {
      if (earcon) {
        bindings.set(status, earcon);
      }
    } else if (DOM_EVENT_SET.has(key)) {
      domEventKeys.push(key);
    } else {
      unknownKeys.push(key);
    }
  }

  return { bindings, domEventKeys, unknownKeys };
}
