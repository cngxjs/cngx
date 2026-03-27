import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';
import { CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';

/**
 * Semantic card component that adapts its host element role based on the `as` input.
 *
 * Three archetypes:
 * - `'article'` (default) — display card, no primary action
 * - `'button'` — the entire card is a clickable button
 * - `'link'` — the entire card is a navigation link
 *
 * The host element **is** the semantic element — no inner wrapper.
 * This eliminates double focus rings and wrapper problems for screen readers.
 *
 * @usageNotes
 *
 * ### Action card with selection
 * ```html
 * <cngx-card as="button" [selectable]="true" [(selected)]="isSelected">
 *   <header cngxCardHeader><h3>Patient</h3></header>
 *   <div cngxCardBody>Details here</div>
 * </cngx-card>
 * ```
 *
 * ### Link card
 * ```html
 * <cngx-card as="link" href="/patients/42" ariaLabel="View patient">
 *   <img cngxCardMedia alt="Photo" />
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Component({
  selector: 'cngx-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [{ directive: CngxRovingItem, inputs: [], outputs: [] }],
  host: {
    class: 'cngx-card',
    '[attr.role]': 'hostRole()',
    '[attr.tabindex]': 'hostTabindex()',
    '[attr.href]': 'hostHref()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-selected]': 'interactive() && selectable() ? selected() : null',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-describedby]': 'describedByIds()',
    '[class.cngx-card--interactive]': 'interactive()',
    '[class.cngx-card--selected]': 'selected()',
    '[class.cngx-card--loading]': 'loading()',
    '[class.cngx-card--disabled]': 'disabled()',
    '(click)': 'handleHostClick($event)',
    '(keydown.enter)': 'handleHostKeydown($event)',
    '(keydown.space)': 'handleHostKeydown($event)',
  },
  template: `
    <ng-content select="[cngxCardMedia]" />
    <ng-content select="[cngxCardHeader]" />
    <ng-content select="[cngxCardBody]" />
    <ng-content select="[cngxCardFooter]" />
    <ng-content select="[cngxCardActions]" />
    <ng-content />

    <span
      [id]="disabledReasonId"
      [attr.aria-hidden]="disabled() && disabledReason() ? null : true"
      class="cngx-sr-only"
    >
      {{ disabledReason() }}
    </span>

    <span [id]="liveRegionId" aria-live="polite" aria-atomic="true" class="cngx-sr-only">
      {{ liveAnnouncement() }}
    </span>
  `,
})
export class CngxCard {
  private readonly uid = nextUid('cngx-card');
  private readonly rovingParent = inject(CngxRovingTabindex, {
    optional: true,
    skipSelf: true,
  });

  // --- Archetype ---
  /** Semantic archetype: `'article'` (display), `'button'` (action), or `'link'` (navigation). */
  readonly cardType = input<'article' | 'link' | 'button'>('article', {
    alias: 'as',
  });

  /** Navigation URL when `as="link"`. Applied as `href` on the host. */
  readonly href = input<string | undefined>(undefined);

  /** Accessible label for the card. Overrides the default screen reader announcement. */
  readonly ariaLabel = input<string | undefined>(undefined);

  // --- State ---
  /** Two-way selection state. Only relevant when `selectable` is `true`. */
  readonly selected = model<boolean>(false);

  /** Whether the card supports selection toggling. */
  readonly selectable = input<boolean>(false);

  /** Whether the card is in a loading state. Sets `aria-busy` and shows SR announcement. */
  readonly loading = input<boolean>(false);

  /** Whether the card is disabled. Prevents interaction and sets `aria-disabled`. */
  readonly disabled = input<boolean>(false);

  /** Explanation for why the card is disabled. Communicated to SR via `aria-describedby`. */
  readonly disabledReason = input<string | undefined>(undefined);

  // --- Derived ---
  /** Whether this card is interactive (button or link). */
  readonly interactive = computed(() => this.cardType() !== 'article');

  /** @internal Host href for link cards. */
  protected readonly hostHref = computed(() =>
    this.cardType() === 'link' ? (this.href() ?? null) : null,
  );

  /** @internal Host element ARIA role. */
  protected readonly hostRole = computed(() => {
    switch (this.cardType()) {
      case 'button':
        return 'button';
      case 'link':
        return 'link';
      default:
        return 'article';
    }
  });

  /**
   * @internal Tabindex management.
   * When inside a CngxRovingTabindex parent (e.g. CngxCardGrid), the roving
   * controller manages tabindex via CngxRovingItem — card does not set its own.
   * When standalone, interactive cards get tabindex="0".
   */
  protected readonly hostTabindex = computed(() => {
    if (this.rovingParent) {
      return null;
    }
    return this.interactive() ? 0 : null;
  });

  /** @internal */
  protected readonly disabledReasonId = `${this.uid}-disabled-reason`;
  /** @internal */
  protected readonly liveRegionId = `${this.uid}-live`;

  /** @internal IDs for `aria-describedby` — always present, aria-hidden controls what SR reads. */
  protected readonly describedByIds = computed(() => {
    const ids = [this.disabledReasonId];
    return ids.join(' ');
  });

  /** @internal SR live announcement for state changes. */
  protected readonly liveAnnouncement = computed(() => {
    if (this.loading()) {
      return 'Loading';
    }
    if (this.selectable() && this.selected()) {
      return 'Selected';
    }
    if (this.selectable() && !this.selected()) {
      return 'Deselected';
    }
    return '';
  });

  // --- Events ---
  /** Emits when an interactive card is clicked or activated via keyboard. */
  readonly clicked = output<void>();

  /** @internal */
  protected handleHostClick(e: MouseEvent): void {
    if (!this.interactive()) {
      return;
    }
    if (this.disabled()) {
      e.preventDefault();
      return;
    }
    if (this.selectable()) {
      this.selected.update((v) => !v);
    }
    this.clicked.emit();
  }

  /** @internal */
  protected handleHostKeydown(e: Event): void {
    if (!this.interactive()) {
      return;
    }
    if (this.disabled()) {
      e.preventDefault();
      return;
    }
    if ((e as KeyboardEvent).key === ' ') {
      e.preventDefault();
    }
    if (this.selectable()) {
      this.selected.update((v) => !v);
    }
    this.clicked.emit();
  }
}
