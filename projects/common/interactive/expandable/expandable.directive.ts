import { booleanAttribute, computed, Directive, input, model } from '@angular/core';
import {
  CNGX_ARIA_EXPANDED_DRIVER,
  CngxAriaExpanded,
  type CngxAriaExpandedDriver,
} from '@cngx/common/a11y';

/**
 * Passive expand/collapse contract for elements whose open state is driven
 * from the outside - typically a `CngxTreeController` or any component that
 * manages a shared expansion set. Composes `CngxAriaExpanded` for
 * `aria-expanded` and (optionally) `aria-controls`; carries no interaction of
 * its own. `[(expanded)]` binds the state two-way; `[leaf]` drops
 * `aria-expanded` for a row with nothing to expand.
 *
 * Use `CngxDisclosure` instead for self-triggering expanders (FAQ, accordion
 * headings). The distinction is deliberate: a tree-item row is a selection
 * target, not a toggle - clicks, Enter, and Space belong to the selection
 * flow, while expand/collapse is wired to ArrowLeft/Right via a sibling nav
 * directive or to a dedicated twisty button.
 *
 * ```html
 * <div role="tree" aria-label="Files">
 *   <div
 *     role="treeitem"
 *     aria-level="1"
 *     cngxExpandable
 *     [expanded]="ctrl.isExpanded(id)()"
 *     [controls]="childrenId"
 *   >
 *     <button
 *       type="button"
 *       tabindex="-1"
 *       (click)="ctrl.toggle(id)"
 *     >▸</button>
 *     <span>{{ label }}</span>
 *   </div>
 *   <div [id]="childrenId" [hidden]="!ctrl.isExpanded(id)()">…</div>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/expandable/expandable.directive.ts
 * @since 0.1.0
 * @relatedTo CngxHierarchicalNav, CngxTreeController, CngxRovingTabindex
 * <example-url>/#/common/interactive/expandable/uncontrolled-toggle</example-url>
 * <example-url>/#/common/interactive/expandable/controlled-by-external-state</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxExpandable]',
  exportAs: 'cngxExpandable',
  standalone: true,
  hostDirectives: [{ directive: CngxAriaExpanded, inputs: ['controls'] }],
  providers: [{ provide: CNGX_ARIA_EXPANDED_DRIVER, useExisting: CngxExpandable }],
})
export class CngxExpandable implements CngxAriaExpandedDriver {
  /**
   * Expanded state, two-way bindable as `[(expanded)]`; `expandedChange` emits
   * on every change made through `expand()`, `collapse()` or `toggle()`.
   */
  readonly expanded = model<boolean>(false);

  /** Marks a row with nothing to expand: `aria-expanded` is omitted. */
  readonly leaf = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** The `aria-expanded` value the composed `CngxAriaExpanded` writes: `null` on a leaf. */
  readonly ariaExpanded = computed(() => (this.leaf() ? null : this.expanded()));

  /** Expands and emits `expandedChange` with `true`. No-op when already expanded. */
  expand(): void {
    this.expanded.set(true);
  }

  /** Collapses and emits `expandedChange` with `false`. No-op when already collapsed. */
  collapse(): void {
    this.expanded.set(false);
  }

  /**
   * Collapses when `expanded()` is true, otherwise expands, with the emission rules of
   * `expand()` and `collapse()`.
   */
  toggle(): void {
    if (this.expanded()) {
      this.collapse();
    } else {
      this.expand();
    }
  }
}
