import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  type OnInit,
  Renderer2,
} from '@angular/core';

/**
 * Visual variant for the nav badge.
 */
export type NavBadgeVariant = 'count' | 'dot' | 'status';

/**
 * Inline badge for navigation items - shows counts, dots, or status indicators.
 *
 * For generic in-place counter/dot indicators on arbitrary hosts (buttons,
 * avatars, icons), prefer `CngxBadge` from `@cngx/common/display`. `CngxNavBadge`
 * stays specialised for sidebar/link usage where the badge *is* the host span
 * and style is applied directly to it rather than to an injected child.
 *
 * The host is always `aria-hidden="true"`: the visible count or dot never
 * reaches the accessible name. When the badge conveys information the link
 * text does not (an unread count, a "new" dot), set `[ariaLabel]`. The label
 * is rendered as visually hidden text right after the badge, inside the link,
 * so it is announced as part of the link name ("Inbox 12 unread"). An empty
 * badge contributes no label.
 *
 * ### Decorative badge (no label)
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-badge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxNavLink, CngxNavGroup, CngxNavLabel, CngxBadge
 * <example-url>/#/common/interactive/nav/nav-badge-counts-and-dots</example-url>
 * <example-url>/#/common/interactive/nav/nav-group-accordion-sections</example-url>
 * <example-url>/#/common/interactive/nav/nav-links-active-state-depth</example-url>
 * @axis level molecule
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
    'aria-hidden': 'true',
  },
})
export class CngxNavBadge implements OnInit {
  private readonly renderer = inject(Renderer2);
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private labelEl: HTMLElement | null = null;

  /** The badge value. Hidden when empty string, null, undefined, or 0. */
  readonly value = input<string | number | null | undefined>(undefined);

  /** Visual variant: `'count'` (number), `'dot'` (presence indicator), `'status'` (text). */
  readonly variant = input<NavBadgeVariant>('count');

  /**
   * Accessible label for the badge. Rendered as visually hidden text after the
   * badge, so it is announced as part of the link name. Ignored while the badge
   * is empty.
   */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Whether the badge should be visually hidden (empty/zero value). */
  readonly isEmpty = computed(() => {
    const v = this.value();
    return v === null || v === undefined || v === '' || v === 0;
  });

  private readonly labelText = computed(() => {
    const label = this.ariaLabel();
    return !this.isEmpty() && label ? label : '';
  });

  constructor() {
    // DOM side effect only. The text is read before the element check so the
    // effect tracks the label even when it first runs before ngOnInit.
    effect(() => {
      const text = this.labelText();
      if (this.labelEl) {
        this.labelEl.textContent = text;
      }
    });
  }

  ngOnInit(): void {
    // A sibling, not a child: the host is aria-hidden, so a child would never
    // reach the link name. Inside the link, the sibling joins it from content.
    const label = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(label, 'cngx-sr-only');
    const parent = this.renderer.parentNode(this.hostEl) as HTMLElement | null;
    if (parent) {
      this.renderer.insertBefore(parent, label, this.renderer.nextSibling(this.hostEl));
    }
    this.labelEl = label;
    label.textContent = this.labelText();

    this.destroyRef.onDestroy(() => {
      if (parent) {
        this.renderer.removeChild(parent, label);
      }
      this.labelEl = null;
    });
  }
}
