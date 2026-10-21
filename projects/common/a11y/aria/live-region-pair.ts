import type { AriaLivePoliteness } from './live-announcer';

// One frame. Clear the region this long before writing so an intentionally
// repeated identical string still registers as a content change for the SR.
export const CLEAR_DELAY_MS = 16;

/**
 * A message whose write into its live region has not landed yet.
 *
 * @category common/a11y
 */
export interface CngxPendingAnnouncement {
  readonly message: string;
  readonly politeness: AriaLivePoliteness;
}

/**
 * @internal Polite + assertive live-region pair inside one container. The
 * engine behind `CngxLiveAnnouncer` (container `document.body`) and
 * `injectScopedLiveRegion` (container: an overlay host).
 */
export interface CngxLiveRegionPair {
  /**
   * Clear the region of `politeness` now, write `message` one frame later, or
   * later still while a freshly inserted region is inside its settle window.
   */
  announce(message: string, politeness: AriaLivePoliteness): void;
  /** Create both regions up front so they are in the DOM before any message. */
  ensure(): void;
  /** Cancel every write that has not landed and return what it would have said. */
  takePending(): readonly CngxPendingAnnouncement[];
  /** Cancel pending writes and remove both regions. */
  destroy(): void;
}

/**
 * @internal Per-pair options for {@link createLiveRegionPair}.
 */
export interface CngxLiveRegionPairOptions {
  /**
   * Minimum time a freshly inserted region stays empty before its first
   * message lands. Defaults to the clear-then-write delay, so a pair without
   * the option behaves exactly as before.
   */
  readonly settleMs?: number;
  /**
   * Called instead of the write when the container left the document while
   * the write was pending, so the owner can speak the message elsewhere.
   */
  readonly onDetached?: (announcement: CngxPendingAnnouncement) => void;
}

const POLITENESS: readonly AriaLivePoliteness[] = ['polite', 'assertive'];

interface PendingWrite {
  readonly message: string;
  readonly timer: ReturnType<typeof setTimeout>;
}

/**
 * @internal Browser only: callers guard the server path. Each region is a
 * visually hidden `aria-live` + `aria-atomic="true"` span (the attribute
 * contract of `CngxLiveRegion`), created lazily on the first announce of its
 * politeness or by `ensure()`.
 */
export function createLiveRegionPair(
  container: HTMLElement,
  doc: Document,
  options: CngxLiveRegionPairOptions = {},
): CngxLiveRegionPair {
  const settleMs = options.settleMs ?? CLEAR_DELAY_MS;
  const regions: Record<AriaLivePoliteness, HTMLElement | null> = {
    polite: null,
    assertive: null,
  };
  const pending: Record<AriaLivePoliteness, PendingWrite | null> = {
    polite: null,
    assertive: null,
  };
  // Earliest Date.now() at which each region may receive content: its
  // insertion time plus settleMs.
  const readyAt: Record<AriaLivePoliteness, number> = { polite: 0, assertive: 0 };

  const ensureRegion = (politeness: AriaLivePoliteness): HTMLElement => {
    const existing = regions[politeness];
    if (existing) {
      return existing;
    }
    const span = doc.createElement('span');
    span.setAttribute('aria-live', politeness);
    span.setAttribute('aria-atomic', 'true');
    span.className = 'cngx-sr-only';
    span.style.position = 'absolute';
    span.style.width = '1px';
    span.style.height = '1px';
    span.style.padding = '0';
    span.style.margin = '-1px';
    span.style.overflow = 'hidden';
    span.style.clip = 'rect(0, 0, 0, 0)';
    span.style.whiteSpace = 'nowrap';
    span.style.border = '0';
    container.appendChild(span);
    regions[politeness] = span;
    readyAt[politeness] = Date.now() + settleMs;
    return span;
  };

  const cancel = (politeness: AriaLivePoliteness): PendingWrite | null => {
    const write = pending[politeness];
    if (write) {
      clearTimeout(write.timer);
      pending[politeness] = null;
    }
    return write;
  };

  return {
    announce(message, politeness) {
      const region = ensureRegion(politeness);
      // Clear first, then write one frame later so repeating the same string
      // still registers as a content change for the SR. Polite and assertive
      // keep independent timers so one politeness never cancels the other.
      region.textContent = '';
      cancel(politeness);
      const delay = Math.max(CLEAR_DELAY_MS, readyAt[politeness] - Date.now());
      pending[politeness] = {
        message,
        timer: setTimeout(() => {
          pending[politeness] = null;
          if (options.onDetached && !container.isConnected) {
            options.onDetached({ message, politeness });
            return;
          }
          region.textContent = message;
        }, delay),
      };
    },
    ensure() {
      for (const politeness of POLITENESS) {
        ensureRegion(politeness);
      }
    },
    takePending() {
      const taken: CngxPendingAnnouncement[] = [];
      for (const politeness of POLITENESS) {
        const write = cancel(politeness);
        if (write) {
          taken.push({ message: write.message, politeness });
        }
      }
      return taken;
    },
    destroy() {
      for (const politeness of POLITENESS) {
        cancel(politeness);
        regions[politeness]?.remove();
        regions[politeness] = null;
      }
    },
  };
}
