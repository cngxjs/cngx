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
import { CNGX_SPLIT_CARET } from './split-caret.token';

/**
 * The caret role of a `cngxSplitButton`, as a host directive. A button host
 * on `CngxButtonBrain` declares it in `hostDirectives` and becomes the
 * split's caret when it is a direct child of the split; anywhere else it
 * stays an ordinary button. `cngxIconMenuButton` renders on it.
 *
 * While the host is the caret it refuses activation with the main action
 * (provided to the brain as `CNGX_BUTTON_HOST_STATE`, so `aria-disabled`,
 * the activation guard and a co-hosted trigger follow) and adds the cause
 * to the host's `aria-describedby`: the main button's reason while the
 * main is disabled with one, and the busy note while the main action runs.
 * The host template renders the name and the note from the directive:
 * `label()` as visually hidden text (so a consumer `aria-label` still
 * wins) and `busyNote()` in a `hidden` span with `[id]="busyNoteId"`; both
 * come from the active language pack (`menuButton.splitToggle`,
 * `menuButton.splitMainBusy`).
 *
 * A host that provides `CNGX_BUTTON_HOST_STATE` itself replaces this
 * directive's entry; fold `refusing()` into its own state then.
 *
 * ```ts
 * @Component({
 *   selector: 'button[appCaret]',
 *   hostDirectives: [
 *     { directive: CngxButtonBrain, inputs: ['variant: appCaret', 'disabled', 'disabledReason'] },
 *     { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
 *     { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
 *     CngxSplitCaret,
 *   ],
 *   providers: [provideButtonHost('appCaret', { defaultVariant: 'solid', iconOnly: true })],
 *   host: { '(click)': 'toggle()' },
 *   template: `
 *     <span aria-hidden="true">v</span>
 *     @if (caret.isCaret()) {
 *       <span class="cngx-sr-only">{{ caret.label() }}</span>
 *       <span [id]="caret.busyNoteId" hidden>{{ caret.busyNote() }}</span>
 *     }
 *   `,
 * })
 * class AppCaret {
 *   protected readonly caret = inject(CngxSplitCaret);
 *   private readonly brain = inject(CngxButtonBrain);
 *   private readonly menu = inject(CngxMenuTrigger);
 *   private readonly popover = inject(CngxPopoverTrigger);
 *
 *   // A blocked caret never opens its menu; an open one still closes.
 *   protected toggle(): void {
 *     if (this.brain.blocked() && !this.menu.isOpen()) {
 *       return;
 *     }
 *     this.popover.popoverRef().toggle();
 *   }
 * }
 * ```
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
    // Same instance as CNGX_BUTTON_STATE, so the split compares main and caret as states.
    { provide: CNGX_SPLIT_CARET, useExisting: CNGX_BUTTON_STATE },
    { provide: CNGX_BUTTON_HOST_STATE, useExisting: CngxSplitCaret },
  ],
})
export class CngxSplitCaret implements CngxButtonHostState {
  private readonly state = inject(CNGX_BUTTON_STATE, { self: true });
  private readonly split = inject(CNGX_SPLIT_BUTTON, { optional: true });
  private readonly i18n = injectMenuButtonI18n();
  private readonly trigger = inject(CngxPopoverTrigger, { self: true, optional: true });

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

  /**
   * The popover of the `CngxPopoverTrigger` co-hosted on this element, or
   * `null` for a caret host without one. The split reads it to anchor the
   * menu to the whole group.
   */
  readonly popover = computed(() => this.trigger?.popoverRef() ?? null);

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
