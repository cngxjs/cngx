import { computed, Directive, input, output, signal } from '@angular/core';

/**
 * Passive expand/collapse contract for elements whose open state is driven
 * from the outside — typically a `CngxTreeController` or any component that
 * manages a shared expansion set. Mirrors `aria-expanded` and (optionally)
 * `aria-controls` into the host; carries no interaction of its own.
 *
 * Use `CngxDisclosure` instead for self-triggering expanders (FAQ, accordion
 * headings). The distinction is deliberate: a tree-item row is a selection
 * target, not a toggle — clicks, Enter, and Space belong to the selection
 * flow, while expand/collapse is wired to ArrowLeft/Right via a sibling nav
 * directive or to a dedicated twisty button.
 *
 * @example
 * ```html
 * <div
 *   role="treeitem"
 *   cngxExpandable
 *   [cngxExpandableOpen]="ctrl.isExpanded(id)()"
 *   [controls]="childrenId"
 * >
 *   <button
 *     type="button"
 *     tabindex="-1"
 *     (click)="ctrl.toggle(id)"
 *   >▸</button>
 *   <span>{{ label }}</span>
 * </div>
 * <div [id]="childrenId" [hidden]="!ctrl.isExpanded(id)()">…</div>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxExpandable]',
  exportAs: 'cngxExpandable',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-controls]': 'controls() ?? null',
  },
})
export class CngxExpandable {
  /** Controlled expanded state. When bound, wins over internal state. */
  readonly expandedInput = input<boolean | undefined>(undefined, {
    alias: 'cngxExpandableOpen',
  });

  /** `id` of the controlled content element, bound to `aria-controls`. */
  readonly controls = input<string | undefined>(undefined);

  private readonly expandedState = signal(false);

  /** Resolved expanded state (controlled input wins over internal state). */
  readonly expanded = computed(() => this.expandedInput() ?? this.expandedState());

  /** Emitted when the expanded state changes. */
  readonly expandedChange = output<boolean>();

  expand(): void {
    if (this.expanded()) {
      return;
    }
    this.expandedState.set(true);
    this.expandedChange.emit(true);
  }

  collapse(): void {
    if (!this.expanded()) {
      return;
    }
    this.expandedState.set(false);
    this.expandedChange.emit(false);
  }

  toggle(): void {
    if (this.expanded()) {
      this.collapse();
    } else {
      this.expand();
    }
  }
}
