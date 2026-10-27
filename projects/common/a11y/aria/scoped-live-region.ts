import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, PLATFORM_ID } from '@angular/core';

import type { AriaLivePoliteness } from './live-announcer';
import {
  type CngxLiveRegionPair,
  type CngxPendingAnnouncement,
  createLiveRegionPair,
} from './live-region-pair';

/**
 * Polite + assertive live regions inside one host element.
 */
export interface CngxScopedLiveRegion {
  /** Speak `message` from the region of `politeness` (default `'polite'`). */
  announce(message: string, politeness?: AriaLivePoliteness): void;
  /** Create both regions now, so they are in the DOM before the first message. */
  ensure(): void;
  /** Cancel every write that has not landed yet and return what it would have said. */
  takePending(): readonly CngxPendingAnnouncement[];
  /** Cancel pending writes and remove the regions. Runs on destroy as well. */
  destroy(): void;
}

/**
 * Create a polite + assertive live-region pair inside `host`.
 *
 * The scoped counterpart to {@link CngxLiveAnnouncer}: same regions, same
 * clear-then-set timing, but appended to an overlay host instead of
 * `document.body`. Use it for modal overlays: under `aria-modal` VoiceOver
 * drops body-level live regions and speaks them late after the overlay
 * closes, while a region inside the modal is spoken on every platform.
 * Polite and assertive keep separate regions, so an assertive error never
 * clobbers a polite status.
 *
 * Must run in an injection context; the regions are removed when that context
 * is destroyed. No-op on the server.
 *
 * ```typescript
 * private readonly region = injectScopedLiveRegion(inject(ElementRef).nativeElement);
 *
 * protected handleSaveFailed(): void {
 *   this.region.announce('Save failed', 'assertive');
 * }
 * ```
 *
 * @param host - Element that receives the two visually hidden regions.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/aria/scoped-live-region.ts
 * @since 0.1.0
 * @relatedTo CngxLiveAnnouncer, CngxLiveRegion
 */
export function injectScopedLiveRegion(host: HTMLElement): CngxScopedLiveRegion {
  const doc = inject(DOCUMENT);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  let pair: CngxLiveRegionPair | null = null;
  const ensurePair = (): CngxLiveRegionPair => {
    pair ??= createLiveRegionPair(host, doc);
    return pair;
  };

  const region: CngxScopedLiveRegion = {
    announce(message, politeness = 'polite') {
      if (!isBrowser) {
        return;
      }
      ensurePair().announce(message, politeness);
    },
    ensure() {
      if (!isBrowser) {
        return;
      }
      ensurePair().ensure();
    },
    takePending() {
      return pair?.takePending() ?? [];
    },
    destroy() {
      pair?.destroy();
      pair = null;
    },
  };
  inject(DestroyRef).onDestroy(() => region.destroy());
  return region;
}
