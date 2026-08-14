import { inject, Injectable } from '@angular/core';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';

/**
 * Select-family live-region announcer. One container per politeness per
 * document.
 *
 * @category forms/select
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/announcer.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxCombobox, CngxTypeahead, CngxTreeSelect
 */
@Injectable({ providedIn: 'root' })
export class CngxSelectAnnouncer {
  private readonly announcer = inject(CngxLiveAnnouncer);

  /** Clears the region one frame before writing so AT re-announces identical messages. */
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    this.announcer.announce(message, politeness);
  }
}
