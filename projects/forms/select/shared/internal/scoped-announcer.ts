import { computed, inject, Injectable, InjectionToken, Injector, type Signal } from '@angular/core';
import type { CngxPopover, CngxPopoverSheet } from '@cngx/common/popover';

import { CngxSelectAnnouncer } from '../announcer';

/**
 * @internal What the scoped announcer reads from its variant: the sheet that
 * speaks right now, `undefined` while announcements belong to the page.
 * Provided per variant through a factory, so the variant is fully
 * constructed before the scope is read.
 */
export interface CngxSelectSheetScope {
  readonly speakingSheet: Signal<CngxPopoverSheet | undefined>;
}

/**
 * @internal The sheet speaks while it is modal and its popover is opening
 * or open; once closing, messages go back to the page.
 */
export function createSelectSheetScope(
  sheet: Signal<CngxPopoverSheet | undefined>,
  popover: Signal<CngxPopover | undefined>,
): CngxSelectSheetScope {
  return {
    speakingSheet: computed(() => {
      const current = sheet();
      if (!current?.modal()) {
        return undefined;
      }
      const state = popover()?.state();
      return state === 'open' || state === 'opening' ? current : undefined;
    }),
  };
}

/** @internal */
export const CNGX_SELECT_SHEET_SCOPE = new InjectionToken<CngxSelectSheetScope>(
  'CngxSelectSheetScope',
);

/**
 * @internal
 *
 * Per-variant `CngxSelectAnnouncer`. While the variant's sheet is modal and
 * opening or open, every message goes only to the live region inside the
 * panel (VoiceOver drops body regions under `aria-modal`, TalkBack would
 * speak both); otherwise it delegates to the next `CngxSelectAnnouncer` up
 * the tree, so an app-level override keeps working.
 *
 * The scope is resolved on the first announce, not at construction: the
 * variants inject the announcer from field initializers, before the variant
 * itself exists.
 */
@Injectable()
export class CngxScopedSelectAnnouncer {
  private readonly injector = inject(Injector);
  private readonly parent = inject(CngxSelectAnnouncer, { skipSelf: true });
  private scope: CngxSelectSheetScope | null | undefined;

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    if (this.scope === undefined) {
      this.scope = this.injector.get(CNGX_SELECT_SHEET_SCOPE, null);
    }
    const sheet = this.scope?.speakingSheet();
    if (sheet) {
      sheet.announce(message, politeness);
      return;
    }
    this.parent.announce(message, politeness);
  }
}
