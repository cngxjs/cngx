import { computed, Directive, input } from '@angular/core';

/** Visual variant for the nav badge. */
export type NavBadgeVariant = 'count' | 'dot' | 'status';

/**
 * Inline badge for navigation items — shows counts, dots, or status indicators.
 *
 * Applies `aria-hidden="true"` by default because badges typically duplicate
 * information already conveyed by the link text. When the badge conveys
 * unique information (e.g., unread count), provide `[ariaLabel]` to make
 * it accessible — this removes `aria-hidden` and adds a visually-hidden label.
 *
 * @usageNotes
 *
 * ### Decorative badge (aria-hidden, default)
 * ```html
 * <a cngxNavLink>Inbox <span cngxNavBadge [value]="5">5</span></a>
 * ```
 *
 * ### Accessible badge (unique information)
 * ```html
 * <a cngxNavLink>
 *   Notifications
 *   <span cngxNavBadge [value]="3" ariaLabel="3 unread">3</span>
 * </a>
 * ```
 *
 * ### Dot indicator
 * ```html
 * <a cngxNavLink>Updates <span cngxNavBadge variant="dot" [value]="1"></span></a>
 * ```
 *
 * @category nav
 */
@Directive({
  selector: '[cngxNavBadge]',
  exportAs: 'cngxNavBadge',
  standalone: true,
  host: {
    '[class.cngx-nav-badge]': 'true',
    '[class.cngx-nav-badge--count]': "variant() === 'count'",
    '[class.cngx-nav-badge--dot]': "variant() === 'dot'",
    '[class.cngx-nav-badge--status]': "variant() === 'status'",
    '[class.cngx-nav-badge--hidden]': 'isEmpty()',
    '[attr.aria-hidden]': 'ariaLabel() ? null : true',
    '[attr.aria-label]': 'ariaLabel() ?? null',
  },
})
export class CngxNavBadge {
  /** The badge value. Hidden when empty string, null, undefined, or 0. */
  readonly value = input<string | number | null | undefined>(undefined);

  /** Visual variant: `'count'` (number), `'dot'` (presence indicator), `'status'` (text). */
  readonly variant = input<NavBadgeVariant>('count');

  /**
   * Accessible label for the badge. When provided, `aria-hidden` is removed
   * and this label is announced by screen readers.
   */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Whether the badge should be visually hidden (empty/zero value). */
  readonly isEmpty = computed(() => {
    const v = this.value();
    return v === null || v === undefined || v === '' || v === 0;
  });
}
