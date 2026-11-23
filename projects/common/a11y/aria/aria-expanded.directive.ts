import {
  booleanAttribute,
  computed,
  Directive,
  inject,
  InjectionToken,
  Injector,
  input,
  type Signal,
} from '@angular/core';

/**
 * Lets a directive that composes `CngxAriaExpanded` as a host directive drive
 * `aria-expanded` from its own state instead of `[cngxAriaExpanded]`.
 * Provided by the composer on the same element (`useExisting`); the ARIA
 * directive resolves it lazily with `self: true`, because the composer
 * constructs after its host directives. `CngxExpandable` is the in-library
 * composer.
 *
 * @relatedTo CngxAriaExpanded, CNGX_ARIA_EXPANDED_DRIVER
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/aria/aria-expanded.directive.ts
 * @since 0.1.0
 */
export interface CngxAriaExpandedDriver {
  /**
   * The `aria-expanded` value; wins over `[cngxAriaExpanded]`. `null` omits
   * the attribute, for a host that has nothing to expand (a leaf tree item).
   */
  readonly ariaExpanded: Signal<boolean | null>;
}

/**
 * Injection token for a {@link CngxAriaExpandedDriver}. A composer provides it
 * on its own element (`useExisting`) to override `[cngxAriaExpanded]` of its
 * `CngxAriaExpanded` host directive; `aria-controls` still follows
 * `[controls]`. Used by `CngxExpandable`.
 *
 * @relatedTo CngxAriaExpanded
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/aria/aria-expanded.directive.ts
 * @since 0.1.0
 */
export const CNGX_ARIA_EXPANDED_DRIVER = new InjectionToken<CngxAriaExpandedDriver>(
  'CngxAriaExpandedDriver',
);

/**
 * Manages `aria-expanded` and optionally `aria-controls` on the host element.
 *
 * Pairs a disclosure trigger (button) with its controlled region via standard
 * WAI-ARIA attributes. Supports accordions, dropdowns, tree items, and any
 * disclosure pattern where a control toggles visibility of another element.
 *
 * Unlike manual `[attr.aria-expanded]` binding, this directive couples both
 * attributes (`aria-expanded` + `aria-controls`) in a single declaration,
 * preventing mismatches where one is set without the other.
 *
 * ### Simple disclosure
 * ```html
 * <button [cngxAriaExpanded]="open()" [controls]="'panel-id'" (click)="open.set(!open())">
 *   Toggle
 * </button>
 * <div id="panel-id" role="region" [hidden]="!open()">Panel content</div>
 * ```
 *
 * ### Accordion with multiple panels
 * ```html
 * @for (panel of panels(); track panel.id) {
 *   <button [cngxAriaExpanded]="panel.open" [controls]="panel.id" (click)="toggle(panel)">
 *     {{ panel.label }}
 *   </button>
 *   @if (panel.open) {
 *     <div [id]="panel.id" role="region">{{ panel.content }}</div>
 *   }
 * }
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/aria/aria-expanded.directive.ts
 * @since 0.1.0
 * @relatedTo CngxLiveRegion, CngxExpandable, CngxDisclosure
 * <example-url>/#/common/a11y/aria-expanded/accordion-multiple-panels</example-url>
 * <example-url>/#/common/a11y/aria-expanded/disclosure-pattern</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxAriaExpanded]',
  exportAs: 'cngxAriaExpanded',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'ariaExpanded()',
    '[attr.aria-controls]': 'controls() ?? null',
  },
})
export class CngxAriaExpanded {
  /** Whether the controlled element is currently expanded. Sets `aria-expanded`. */
  readonly expanded = input<boolean, unknown>(false, {
    alias: 'cngxAriaExpanded',
    transform: booleanAttribute,
  });
  /** The `id` of the controlled element. Sets `aria-controls`. */
  readonly controls = input<string | undefined>(undefined);

  private readonly injector = inject(Injector);
  private resolvedDriver: CngxAriaExpandedDriver | null | undefined = undefined;
  private driver(): CngxAriaExpandedDriver | null {
    if (this.resolvedDriver === undefined) {
      this.resolvedDriver = this.injector.get(CNGX_ARIA_EXPANDED_DRIVER, null, { self: true });
    }
    return this.resolvedDriver;
  }

  /** @internal The written attribute value: the driver's when composed, else the input. */
  protected readonly ariaExpanded = computed(() => {
    const driver = this.driver();
    return driver ? driver.ariaExpanded() : this.expanded();
  });
}
