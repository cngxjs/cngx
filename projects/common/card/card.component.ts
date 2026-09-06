import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { nextUid } from '@cngx/core/utils';
import { CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';

/**
 * Semantic card component that adapts its host element role based on the `as` input.
 *
 * Three archetypes:
 * - `'article'` (default) - display card, no primary action
 * - `'button'` - the entire card is a clickable button
 * - `'link'` - the entire card is a navigation link
 *
 * The host element **is** the semantic element - no inner wrapper.
 * This eliminates double focus rings and wrapper problems for screen readers.
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
 * @category common/card
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/card.component.ts
 * @since 0.1.0
 * @relatedTo CngxCardGrid, CngxCardHeader, CngxCardBody, CngxCardFooter, CngxCardSkeleton
 * <example-url>http://localhost:4200/#/common/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/#/common/card/card-with-expandable-text</example-url>

 * <example-url>http://localhost:4200/#/common/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/#/common/card/disabled-with-reason</example-url>

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
    <ng-content select="header[cngxCardHeader]" />
    <ng-content select="[cngxCardBody]" />
    <ng-content select="footer[cngxCardFooter]" />
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
  styleUrls: ['./card.component.css'],
})
export class CngxCard {
  private readonly uid = nextUid('cngx-card');
  private readonly rovingParent = inject(CngxRovingTabindex, {
    optional: true,
    skipSelf: true,
  });
  private readonly router = inject(Router, { optional: true });

  /** Semantic archetype: `'article'` (display), `'button'` (action), or `'link'` (navigation). */
  readonly cardType = input<'article' | 'link' | 'button'>('article', {
    alias: 'as',
  });

  /**
   * Navigation target when `as="link"`. Activation (click / Enter)
   * navigates: internal URLs go through the app `Router` when one is
   * provided, everything else (schemes, protocol-relative, router-less
   * apps) through `window.location.assign`. The value is also mirrored
   * as an `href` attribute on the host as a styling/testing hook - the
   * host is not a native anchor, so browser-native link affordances
   * (modifier-click new tab, context-menu link actions) do not apply.
   */
  readonly href = input<string | undefined>(undefined);

  /**
   * Explicit ARIA role override for the host. Wins over the
   * archetype-derived role. The primary use is `role="listitem"` on
   * cards inside `<cngx-card-grid [semanticList]="true">` - the grid's
   * `role="list"` requires listitem children, which the archetype
   * binding would otherwise overwrite. Overriding the role on an
   * interactive card replaces its button/link semantics; pair with an
   * inner interactive element when both are needed.
   */
  readonly role = input<string | undefined>(undefined);

  /** Accessible label for the card. Overrides the default screen reader announcement. */
  readonly ariaLabel = input<string | undefined>(undefined);

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

  /** Whether this card is interactive (button or link). */
  readonly interactive = computed(() => this.cardType() !== 'article');

  /** @internal Host href for link cards. */
  protected readonly hostHref = computed(() =>
    this.cardType() === 'link' ? (this.href() ?? null) : null,
  );

  /** @internal Host element ARIA role. Explicit `role` input wins over the archetype. */
  protected readonly hostRole = computed(() => {
    const override = this.role();
    if (override) {
      return override;
    }
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
   * controller manages tabindex via CngxRovingItem - card does not set its own.
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

  /**
   * @internal `aria-describedby` reference, gated on the disabled state it
   * describes. The reason span stays in the DOM, but its id is emitted only
   * while the card is disabled *with* a reason - accname 1.2 §2A traverses a
   * directly-referenced hidden node, so referencing it unconditionally would
   * announce the reason for a state the card is not in (a `disabledReason`
   * set while `disabled` is false would read as "locked").
   */
  protected readonly describedByIds = computed(() =>
    this.disabled() && this.disabledReason() ? this.disabledReasonId : null,
  );

  private readonly liveAnnouncementState = signal('');

  /**
   * @internal SR live announcement, driven by transitions rather than
   * persistent state (Pillar 2: voice the change, not the standing
   * state). Announcing state would re-emit "Deselected" for a
   * never-touched card whenever the loading phrase clears - the region
   * is `aria-atomic`, so every content change re-announces.
   */
  protected readonly liveAnnouncement = this.liveAnnouncementState.asReadonly();

  /** Emits when an interactive card is clicked or activated via keyboard. */
  readonly clicked = output<void>();

  constructor() {
    // Transition detection over loading + selected. First run only seeds
    // the previous values - initial state is visible, not announced.
    let prevLoading: boolean | undefined;
    let prevSelected: boolean | undefined;
    effect(() => {
      const loading = this.loading();
      const selected = this.selected();
      const selectable = this.selectable();
      untracked(() => {
        if (prevLoading !== undefined && loading !== prevLoading) {
          this.liveAnnouncementState.set(loading ? 'Loading' : '');
        }
        if (!loading && selectable && prevSelected !== undefined && selected !== prevSelected) {
          this.liveAnnouncementState.set(selected ? 'Selected' : 'Deselected');
        }
        prevLoading = loading;
        prevSelected = selected;
      });
    });
  }

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
    this.navigateToHref();
  }

  /** @internal */
  protected handleHostKeydown(e: Event): void {
    if (!this.interactive()) {
      return;
    }
    const isSpace = (e as KeyboardEvent).key === ' ';
    if (isSpace && this.cardType() !== 'button') {
      // APG: links activate on Enter only - Space keeps its scroll default.
      return;
    }
    if (this.disabled()) {
      e.preventDefault();
      return;
    }
    if (isSpace) {
      e.preventDefault();
    }
    if (this.selectable()) {
      this.selected.update((v) => !v);
    }
    this.clicked.emit();
    this.navigateToHref();
  }

  /**
   * Navigation for the link archetype. Internal URLs prefer the app
   * `Router` (SPA navigation, no full reload); external URLs and
   * router-less apps fall back to `window.location.assign`.
   */
  private navigateToHref(): void {
    if (this.cardType() !== 'link') {
      return;
    }
    const href = this.href();
    if (!href) {
      return;
    }
    const external = /^[a-z][a-z0-9+.-]*:|^\/\//i.test(href);
    if (this.router && !external) {
      void this.router.navigateByUrl(href);
      return;
    }
    window.location.assign(href);
  }
}
