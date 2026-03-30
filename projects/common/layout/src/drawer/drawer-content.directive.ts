import { computed, Directive, input } from '@angular/core';
import type { CngxDrawer } from './drawer.directive';

/**
 * Marks the main content area adjacent to a drawer panel.
 *
 * Adds a CSS class when the drawer is open so the consumer can offset
 * the content via CSS transitions or transforms.
 *
 * @category layout
 *
 * @usageNotes
 *
 * ```html
 * <main [cngxDrawerContent]="drawer">
 *   Page content
 * </main>
 * ```
 */
@Directive({
  selector: '[cngxDrawerContent]',
  exportAs: 'cngxDrawerContent',
  standalone: true,
  host: {
    '[class.cngx-drawer-content]': 'true',
    '[class.cngx-drawer-content--shifted]': 'isOpen()',
  },
})
export class CngxDrawerContent {
  /** Reference to the parent `CngxDrawer` state owner. */
  readonly drawerRef = input.required<CngxDrawer>({ alias: 'cngxDrawerContent' });

  /** Whether the drawer is currently open (derived from the drawer ref). */
  readonly isOpen = computed(() => this.drawerRef().opened());
}
