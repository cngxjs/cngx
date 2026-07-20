/** DOM events `[cngxAudio]` may bind an earcon to. */
export const CNGX_AUDIO_DOM_EVENTS = [
  'click',
  'focus',
  'blur',
  'pointerenter',
  'pointerleave',
  'submit',
  'change',
  'input',
] as const;

/** Lifecycle keys that belong to `[cngxAudioStatus]`, rejected here. */
const LIFECYCLE_KEYS = [
  'pending',
  'succeeded',
  'failed',
  'loading',
  'refreshing',
  'success',
  'error',
  'idle',
] as const;

/** A `[cngxAudio]` DOM event name. */
export type CngxAudioDomEvent = (typeof CNGX_AUDIO_DOM_EVENTS)[number];

/** Result of parsing an `event:earcon` binding string. */
export interface ParsedEventBindings {
  /** Valid `domEvent -> earcon` pairs. */
  readonly bindings: ReadonlyMap<CngxAudioDomEvent, string>;
  /** Keys that are neither DOM events nor lifecycle keys. */
  readonly unknownKeys: readonly string[];
  /** Lifecycle keys — the grammar of `[cngxAudioStatus]`, not `[cngxAudio]`. */
  readonly lifecycleKeys: readonly string[];
}

const DOM_EVENT_SET = new Set<string>(CNGX_AUDIO_DOM_EVENTS);
const LIFECYCLE_SET = new Set<string>(LIFECYCLE_KEYS);

/**
 * Parse the `event:earcon` grammar (`'click:tap, focus:notification'`) into a
 * DOM-event map. Pure — no DOM, no `inject()`. Keys are categorised so the
 * directive can dev-warn on unknown earcon keys and, separately, on lifecycle
 * keys that should have used `[cngxAudioStatus]`.
 */
export function parseEventBindings(spec: string): ParsedEventBindings {
  const bindings = new Map<CngxAudioDomEvent, string>();
  const unknownKeys: string[] = [];
  const lifecycleKeys: string[] = [];

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
    if (DOM_EVENT_SET.has(key)) {
      if (earcon) {
        bindings.set(key as CngxAudioDomEvent, earcon);
      }
    } else if (LIFECYCLE_SET.has(key)) {
      lifecycleKeys.push(key);
    } else {
      unknownKeys.push(key);
    }
  }

  return { bindings, unknownKeys, lifecycleKeys };
}
