import { InjectionToken } from '@angular/core';

/**
 * Outcome dispatched by a {@link CngxMenuNavStrategy} step. Consumers (the
 * menu trigger or a future menubar directive) interpret the action: fire
 * the matching side effect (open/close a popover, hand focus to a parent
 * menu) and `event.preventDefault()` for anything non-`noop`.
 *
 * @category interactive
 */
export type CngxMenuNavAction =
  | { readonly kind: 'open-submenu'; readonly id: string }
  | { readonly kind: 'close-submenu' }
  | { readonly kind: 'move-to-parent' }
  | { readonly kind: 'noop' };

/**
 * Context passed to every strategy step. `activeId` is the current
 * `CngxActiveDescendant.activeId()` snapshot at key-press time;
 * `hasSubmenu`/`submenuOpen` describe whatever submenu state the consumer
 * tracks for the active item.
 *
 * @category interactive
 */
export interface CngxMenuNavContext {
  readonly activeId: string | null;
  readonly hasSubmenu: boolean;
  readonly submenuOpen: boolean;
}

/**
 * Pluggable keyboard policy for ArrowRight/ArrowLeft inside a menu or
 * menubar. The default ({@link createW3CMenuStrategy}) matches the W3C APG
 * menu pattern; consumers needing alternative semantics (e.g. "ArrowRight
 * always opens, never traverses into the submenu") register their own
 * via `CNGX_MENU_NAV_STRATEGY`.
 *
 * Strategy steps are pure decisions — they do not call popover.show() or
 * touch any signal directly. The directive that consults the strategy
 * acts on the returned action.
 *
 * @category interactive
 */
export interface CngxMenuNavStrategy {
  onArrowRight(ctx: CngxMenuNavContext): CngxMenuNavAction;
  onArrowLeft(ctx: CngxMenuNavContext): CngxMenuNavAction;
}

const NOOP: CngxMenuNavAction = { kind: 'noop' };

/**
 * Default W3C APG menu keyboard policy:
 *
 * - **ArrowRight** on a submenu parent that is currently closed →
 *   `open-submenu`. On an already-open submenu or a leaf item → `noop`
 *   (item-level navigation inside the open submenu is owned by the
 *   submenu's own active-descendant).
 * - **ArrowLeft** when a submenu is open at the current level →
 *   `close-submenu`. Otherwise → `move-to-parent` (an enclosing menubar
 *   interprets that; a standalone menu trigger treats it as noop).
 *
 * @category interactive
 */
export function createW3CMenuStrategy(): CngxMenuNavStrategy {
  return {
    onArrowRight(ctx) {
      if (!ctx.activeId || !ctx.hasSubmenu || ctx.submenuOpen) {
        return NOOP;
      }
      return { kind: 'open-submenu', id: ctx.activeId };
    },
    onArrowLeft(ctx) {
      if (ctx.submenuOpen) {
        return { kind: 'close-submenu' };
      }
      return { kind: 'move-to-parent' };
    },
  };
}

/**
 * DI token carrying the {@link CngxMenuNavStrategy} that menu/menubar
 * directives consult on every ArrowLeft/ArrowRight press. Defaults to
 * {@link createW3CMenuStrategy}; override via `providers` /
 * `viewProviders` for alternative keyboard semantics.
 *
 * @category interactive
 */
export const CNGX_MENU_NAV_STRATEGY = new InjectionToken<CngxMenuNavStrategy>(
  'CngxMenuNavStrategy',
  { providedIn: 'root', factory: createW3CMenuStrategy },
);
