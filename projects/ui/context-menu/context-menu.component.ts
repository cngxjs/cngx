import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { CngxMenu } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';

import { CngxContextMenuContent } from './context-menu-content.directive';
import { CNGX_CONTEXT_MENU_PANEL, type CngxContextMenuPanel } from './context-menu-panel';

/**
 * Declarative context-menu panel. Stacks `CngxPopover` (the top-layer popup
 * surface) and `CngxMenu` (the `role="menu"` keyboard + ARIA brain) as host
 * directives on its own element, so projected items and the lazy content
 * template resolve `CngxActiveDescendant` / `CNGX_MENU_HOST` against the panel
 * host's injector chain. Pair it with `[cngxContextMenuFor]` on a target.
 *
 * The brains live on the host - not inside an inner `[cngxMenu]` element -
 * because Angular resolves DI for projected and template content at the
 * declaration site, not the projection site; an inner menu directive would
 * be invisible to items rendered through `<ng-content>` or the content slot.
 * Construction mirrors `CngxPopoverPanel`.
 *
 * `context()` is derived, never synced: it reads the trigger's per-open datum
 * while the popover is visible and `null` once it closes - no manual reset on
 * dismiss (Pillar 1).
 *
 * ### Static menu
 * ```html
 * <div [cngxContextMenuFor]="menu">Right-click me</div>
 * <cngx-context-menu #menu ariaLabel="Actions">
 *   <cngx-context-menu-item (select)="copy()">Copy</cngx-context-menu-item>
 *   <cngx-context-menu-item (select)="paste()">Paste</cngx-context-menu-item>
 * </cngx-context-menu>
 * ```
 *
 * ### Per-row content
 * ```html
 * <cngx-context-menu #menu ariaLabel="Row actions">
 *   <ng-template cngxContextMenuContent let-row>
 *     <cngx-context-menu-item (select)="edit(row)">Edit {{ row.name }}</cngx-context-menu-item>
 *   </ng-template>
 * </cngx-context-menu>
 * ```
 *
 * <example-url>http://localhost:4200/#/ui/context-menu/basic/static-items</example-url>
 * <example-url>http://localhost:4200/#/ui/context-menu/grid/delegated-resolver</example-url>
 * <example-url>http://localhost:4200/#/ui/context-menu/submenu/nested-export-menu</example-url>
 * <example-url>http://localhost:4200/#/ui/context-menu/selection/checkbox-radio-items</example-url>
 * @category ui/context-menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenuFor, CngxContextMenuItem, CngxContextMenuContent, CngxMenu, CngxPopover
 */
@Component({
  selector: 'cngx-context-menu',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenu',
  providers: [{ provide: CNGX_CONTEXT_MENU_PANEL, useExisting: CngxContextMenu }],
  host: {
    '(keydown)': 'handleKeydown($event)',
  },
  hostDirectives: [
    { directive: CngxPopover, inputs: ['offset', 'closeOnEscape'] },
    { directive: CngxMenu, inputs: ['label: ariaLabel'] },
  ],
  template: `
    @if (contentTemplate(); as content) {
      @if (popover.isVisible()) {
        <ng-container *ngTemplateOutlet="content.templateRef; context: { $implicit: context() }" />
      }
    } @else {
      <ng-content />
    }
  `,
  styleUrl: './context-menu.component.css',
})
export class CngxContextMenu<T = unknown> implements CngxContextMenuPanel<T> {
  /** The popover surface this panel drives. Consumed by the trigger core. */
  readonly popover = inject(CngxPopover, { self: true });
  /** The menu brain (`role="menu"`, active-descendant registry). */
  readonly menuHost = inject(CngxMenu, { self: true });

  /** Per-open datum set by the trigger before `show()`. */
  private readonly datum = signal<T | null>(null);

  /**
   * The datum the menu opened over while visible, `null` once closed. Gated on
   * `popover.isVisible()` so the reset on dismiss is derived, not synced.
   */
  readonly context = computed<T | null>(() => (this.popover.isVisible() ? this.datum() : null));

  protected readonly contentTemplate = contentChild(CngxContextMenuContent);

  /**
   * @internal Store the per-open datum. Called by `CngxContextMenuFor` in the
   * `contextmenu` event path, before the popover opens.
   */
  setContext(value: T | null): void {
    this.datum.set(value);
  }

  /** Keydown forwarder registered by the trigger; `null` while none is bound. */
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  /**
   * @internal Register the trigger core's keydown handler. The core owns
   * submenu ArrowRight/ArrowLeft/Escape routing, but open moves focus into
   * this panel, so keydown lands here rather than on the trigger host.
   */
  setKeydownHandler(handler: ((event: KeyboardEvent) => void) | null): void {
    this.keydownHandler = handler;
  }

  protected handleKeydown(event: KeyboardEvent): void {
    this.keydownHandler?.(event);
  }
}
