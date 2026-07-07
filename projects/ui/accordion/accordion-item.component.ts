import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  ViewEncapsulation,
} from '@angular/core';

import { nextUid, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { CNGX_ACCORDION, CngxAccordionPanel } from '@cngx/common/interactive';

import { CNGX_ACCORDION_GROUP } from './accordion-group.token';
import { CngxAccordionItemBusy } from './accordion-item-busy.directive';
import { CngxAccordionItemContent } from './accordion-item-content.directive';
import { CngxAccordionItemError } from './accordion-item-error.directive';
import { CngxAccordionItemIcon } from './accordion-item-icon.directive';
import { CngxAccordionItemSubtitle } from './accordion-item-subtitle.directive';
import { injectAccordionConfig } from './config/inject-accordion-config';

/**
 * Accordion item organism. Renders the APG-correct trio a headless consumer
 * otherwise hand-wires: a `role="heading"` wrapper carrying the group's
 * `aria-level`, a `cngxAccordionPanel` header `<button>`, and a
 * `role="region"` named back at the header via `aria-labelledby`. Expansion is
 * derived from the coordinator (Pillar 1); the header self-wires keyboard nav
 * through the registration brain, so arrow keys rove across items even though
 * each header lives in its own component view.
 *
 * A disabled item renders a visually-hidden reason element with a stable id
 * that `aria-describedby` always points at (IDREF never dangles); only the
 * element's `aria-hidden` and text toggle with `disabled()`.
 *
 * @category ui/accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item.component.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionGroup, CngxAccordionPanel
 */
@Component({
  selector: 'cngx-accordion-item',
  exportAs: 'cngxAccordionItem',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxAccordionPanel, NgTemplateOutlet],
  templateUrl: './accordion-item.component.html',
  styleUrl: './accordion-item.component.css',
  host: {
    class: 'cngx-accordion-item',
    '[attr.data-expanded]': "expanded() ? '' : null",
  },
})
export class CngxAccordionItem {
  // Config cascade source. Declared first so the disabledReason input default
  // below can read the resolved value (field initialisers run top-to-bottom).
  private readonly config = injectAccordionConfig();

  /**
   * Disabled item: the header reports `tabindex="-1"` + `aria-disabled="true"`,
   * is skipped by roving, and its click never expands. The reason text is
   * announced through {@link disabledReason} via `aria-describedby`.
   */
  readonly disabled = input<boolean>(false);
  /**
   * Reason announced to assistive tech when the item is disabled, bound through
   * the always-present `aria-describedby` reason element. Resolves
   * `input ?? CNGX_ACCORDION_CONFIG.disabledReason ?? EN default`: an unbound
   * input falls back to the app-wide config (English out of the box, overridden
   * via `withAccordionLabels`).
   */
  readonly disabledReason = input<string>(this.config.disabledReason);
  /**
   * Stable id this item registers under in the coordinator's open-set. Defaults
   * to a generated id; bind `[panelId]` to a stable consumer value to address
   * the panel through the group's `[(openIds)]` model - seed it open on load or
   * drive expansion from router/SSR state. Mirrors `CngxTab.id` / `CngxStep.id`.
   */
  readonly panelId = input<string>(nextUid('cngx-accordion-panel-'));
  /**
   * The panel's async lifecycle, communicated to assistive tech. Accepts a raw
   * {@link AsyncStatus} or a {@link CngxAsyncState} the consumer already owns -
   * the item reads only the status discriminator, never the payload, so it stays
   * non-generic. A pure data input (the item injects no `CNGX_STATEFUL`), so no
   * empty-string transform: a bare string status must survive untouched. The
   * consumer wires the fetch; the item only communicates the state it is handed.
   */
  readonly state = input<AsyncStatus | CngxAsyncState<unknown> | undefined>(undefined);

  private readonly accordion = inject(CNGX_ACCORDION);
  protected readonly group = inject(CNGX_ACCORDION_GROUP);

  protected readonly regionId = nextUid('cngx-accordion-region-');
  protected readonly headerId = nextUid('cngx-accordion-header-');
  protected readonly titleId = nextUid('cngx-accordion-title-');
  protected readonly subtitleId = nextUid('cngx-accordion-subtitle-');
  protected readonly reasonId = nextUid('cngx-accordion-reason-');
  /**
   * The button's `aria-describedby`: subtitle first (an informative secondary
   * line the title-only name-pin would otherwise hide from AT), then the
   * disabled-reason element. Both IDREFs are always present in the DOM - the
   * subtitle span toggles `aria-hidden` by presence, the reason span toggles by
   * `disabled()`. Constant string: the ids never change, so no `computed()`.
   */
  protected readonly describedBy = `${this.subtitleId} ${this.reasonId}`;

  /** Lazy region-body slot; absent means the body projects eagerly through the default slot. */
  protected readonly contentSlot = contentChild(CngxAccordionItemContent);
  /**
   * Subtitle presence, so the always-present subtitle IDREF wrapper toggles its
   * `aria-hidden` by projection: hidden (empty) when unbound, announced through
   * `aria-describedby` when a subtitle is projected.
   */
  protected readonly subtitleSlot = contentChild(CngxAccordionItemSubtitle);
  /** Chevron override slot; absent means the CSS chevron default renders. */
  protected readonly iconSlot = contentChild(CngxAccordionItemIcon);
  /** Busy-state slot; absent means the CSS skeleton default renders. */
  protected readonly busySlot = contentChild(CngxAccordionItemBusy);
  /** Error-state slot; absent means the CSS error affordance default renders. */
  protected readonly errorSlot = contentChild(CngxAccordionItemError);
  /**
   * Resolved chevron template through the three-stage slot cascade: per-instance
   * `*cngxAccordionItemIcon` -> app-wide `CNGX_ACCORDION_CONFIG.templates.icon`
   * -> `null` (the CSS chevron default renders).
   */
  protected readonly iconTemplate = computed(
    () => this.iconSlot()?.templateRef ?? this.config.templates?.icon ?? null,
  );
  /**
   * Resolved busy template through the three-stage slot cascade: per-instance
   * `*cngxAccordionItemBusy` -> `CNGX_ACCORDION_CONFIG.templates.busySpinner` ->
   * `null` (the CSS skeleton default renders).
   */
  protected readonly busyTemplate = computed(
    () => this.busySlot()?.templateRef ?? this.config.templates?.busySpinner ?? null,
  );
  /**
   * Resolved error template through the three-stage slot cascade: per-instance
   * `*cngxAccordionItemError` -> `CNGX_ACCORDION_CONFIG.templates.error` ->
   * `null` (the CSS error affordance default renders).
   */
  protected readonly errorTemplate = computed(
    () => this.errorSlot()?.templateRef ?? this.config.templates?.error ?? null,
  );

  /**
   * Panel async status, normalised to an {@link AsyncStatus} from either the raw
   * enum or a {@link CngxAsyncState} object form (reads its `status()` signal).
   * A primitive, so `Object.is` dedupes - no `equal` needed. The object form's
   * status signal IS tracked, so a consumer state machine drives this directly.
   */
  protected readonly status = computed<AsyncStatus | undefined>(() => {
    const state = this.state();
    if (state == null) {
      return undefined;
    }
    return typeof state === 'string' ? state : state.status();
  });
  /**
   * `aria-busy` driver. Mirrors `CngxAsyncState.isBusy` (loading|refreshing|
   * pending) so the string and object input forms agree. Boolean, no `equal`.
   */
  protected readonly busy = computed(() => {
    const status = this.status();
    return status === 'loading' || status === 'refreshing' || status === 'pending';
  });

  /** Whether this item's region is open, derived from the coordinator's open-set. */
  protected readonly expanded = computed(() => this.accordion.isOpen(this.panelId()));

  /**
   * Keep-alive latch for lazy content: `false` until the region first opens,
   * then `true` forever. Derived history (Pillar 1) - a `linkedSignal`
   * accumulating onto its own previous value, never an effect that writes a
   * signal. Boolean, so `Object.is` keeps a stable reference once latched.
   */
  protected readonly hasOpened = linkedSignal<boolean, boolean>({
    source: this.expanded,
    computation: (open, prev) => open || (prev?.value ?? false),
  });
}
