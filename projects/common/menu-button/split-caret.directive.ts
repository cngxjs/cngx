import { computed, Directive, inject } from '@angular/core';
import {
  CNGX_BUTTON_HOST_STATE,
  CNGX_BUTTON_STATE,
  type CngxButtonHostState,
} from '@cngx/common/button';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { injectDescribedByContribution, nextUid } from '@cngx/core/utils';

import { injectMenuButtonI18n } from './i18n/menu-button-i18n';
import { CNGX_SPLIT_BUTTON } from './split-button.token';
import { CNGX_SPLIT_CARET, type CngxSplitCaretRole } from './split-caret.token';

/**
 * The caret role of a `cngxSplitButton`, as a host directive. Declare it in `hostDirectives` of a
 * button host on `CngxButtonBrain`: as a direct child of a split the host becomes the caret,
 * anywhere else it stays an ordinary button. `cngxIconMenuButton` renders on it.
 *
 * While the host is the caret and the main action is blocked, the directive refuses activation
 * through `CNGX_BUTTON_HOST_STATE`, so `aria-disabled` and the activation guard follow the main.
 * It adds the cause to `aria-describedby`: the main button's reason, or the busy note while the
 * main action runs.
 *
 * The host template renders what the directive supplies:
 *
 * - `label()` as visually hidden text, so an `aria-label` on the host still wins.
 * - `busyNote()` in a `hidden` span with `[id]="busyNoteId"`.
 *
 * The host's own click toggle has to refuse to open while the brain is `blocked()`, and still
 * close an open menu.
 *
 * Co-host `CngxPopoverTrigger`: the split reads the caret's popover through it to hang the menu
 * under the whole group. A host that provides `CNGX_BUTTON_HOST_STATE` itself replaces this
 * directive's entry and folds `refusing()` into its own state. The `custom-caret-host` example
 * shows a complete host.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-caret.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxIconMenuButton, CngxButtonBrain, CNGX_SPLIT_BUTTON
 * <example-url>/#/common/menu-button/split-button/custom-caret-host</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxSplitCaret]',
  standalone: true,
  exportAs: 'cngxSplitCaret',
  providers: [
    // The same CNGX_BUTTON_STATE instance, so the split compares main and caret as states.
    { provide: CNGX_SPLIT_CARET, useFactory: splitCaretRole },
    { provide: CNGX_BUTTON_HOST_STATE, useExisting: CngxSplitCaret },
  ],
})
export class CngxSplitCaret implements CngxButtonHostState {
  private readonly state = inject(CNGX_BUTTON_STATE, { self: true });
  private readonly split = inject(CNGX_SPLIT_BUTTON, { optional: true });
  private readonly i18n = injectMenuButtonI18n();

  /** `true` while the host is the caret of a split (its direct child). */
  readonly isCaret = computed(() => this.split?.caret() === this.state);

  /** `true` while the host is the caret and the main action is blocked. */
  readonly refusing = computed(() => this.isCaret() && (this.split?.mainBlocked() ?? false));

  /** Id the host template puts on its hidden busy note. */
  readonly busyNoteId = nextUid('cngx-split-caret-busy-');

  /** The caret's name from the language pack (`menuButton.splitToggle`). */
  readonly label = computed(() => this.i18n().splitToggle);

  /** The busy note from the language pack (`menuButton.splitMainBusy`). */
  readonly busyNote = computed(() => this.i18n().splitMainBusy);

  // The cause of a refusal that comes from the main: its reason, or the busy
  // note while it runs.
  private readonly mainDescriptionIds = computed(() => {
    if (!this.isCaret() || !this.split) {
      return null;
    }
    const ids = [this.split.mainReasonId(), this.split.mainBusy() ? this.busyNoteId : null];
    return ids.filter(Boolean).join(' ') || null;
  });

  constructor() {
    injectDescribedByContribution(this.busyNoteId, this.mainDescriptionIds);
  }
}

function splitCaretRole(): CngxSplitCaretRole {
  const trigger = inject(CngxPopoverTrigger, { self: true, optional: true });
  return {
    state: inject(CNGX_BUTTON_STATE, { self: true }),
    popover: computed(() => trigger?.popoverRef() ?? null),
  };
}
