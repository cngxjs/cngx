import { inject, Injectable, InjectionToken, Injector, type Signal } from '@angular/core';
import type { CngxPopover, CngxPopoverSheet } from '@cngx/common/popover';

import { CngxSelectAnnouncer } from '../announcer';

/**
 * @internal What the scoped announcer reads from its variant: the panel's
 * sheet and popover. Provided per variant through a factory, so the variant
 * is fully constructed before the scope is read.
 */
export interface CngxSelectSheetScope {
  readonly sheet: Signal<CngxPopoverSheet | undefined>;
  readonly popover: Signal<CngxPopover | undefined>;
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
    const sheet = this.speakingSheet();
    if (sheet) {
      sheet.announce(message, politeness);
      return;
    }
    this.parent.announce(message, politeness);
  }

  private speakingSheet(): CngxPopoverSheet | undefined {
    if (this.scope === undefined) {
      this.scope = this.injector.get(CNGX_SELECT_SHEET_SCOPE, null);
    }
    const sheet = this.scope?.sheet();
    if (!sheet?.modal()) {
      return undefined;
    }
    const state = this.scope?.popover()?.state();
    return state === 'open' || state === 'opening' ? sheet : undefined;
  }
}
