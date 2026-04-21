import { InjectionToken } from '@angular/core';
import { type CngxActiveDescendant } from '@cngx/common/a11y';
import { type CngxTreeController } from '../tree-controller/tree-controller';

/**
 * Outcome dispatched by a {@link CngxHierarchicalNavStrategy} step.
 * `CngxHierarchicalNav` interprets the action: fires the matching
 * output, calls `event.preventDefault()` for anything non-`noop`, and
 * (for move actions) relies on the strategy having already called
 * `ad.highlightByValue` on the context.
 *
 * @category interactive
 */
export type CngxHierarchicalNavAction =
  | { readonly kind: 'expand'; readonly id: string }
  | { readonly kind: 'collapse'; readonly id: string }
  | { readonly kind: 'movedToChild'; readonly id: string }
  | { readonly kind: 'movedToParent'; readonly id: string }
  | { readonly kind: 'noop' };

/**
 * Context passed to every strategy step. `ad` is guaranteed non-null
 * (the directive checks before invoking the strategy); `activeId` is
 * the current `ad.activeId()` snapshot captured at key-press time.
 *
 * @category interactive
 */
export interface CngxHierarchicalNavContext<T> {
  readonly controller: CngxTreeController<T>;
  readonly ad: CngxActiveDescendant;
  readonly activeId: string;
}

/**
 * Pluggable keyboard policy for {@link CngxHierarchicalNav}. The
 * default implementation ({@link createW3CTreeStrategy}) matches the
 * W3C APG treeview pattern; consumers who need different semantics
 * (e.g. "ArrowRight always expands but never moves to first child",
 * "ArrowLeft collapses but never jumps to parent") can register their
 * own strategy via `CNGX_HIERARCHICAL_NAV_STRATEGY`.
 *
 * Strategy steps are synchronous, side-effect-allowed functions —
 * they may call `ctrl.expand()` / `ctrl.collapse()` / `ad.highlightByValue()`
 * before returning the corresponding action. The directive then emits
 * the informational output + prevents default key handling.
 *
 * @category interactive
 */
export interface CngxHierarchicalNavStrategy {
  onArrowRight<T>(ctx: CngxHierarchicalNavContext<T>): CngxHierarchicalNavAction;
  onArrowLeft<T>(ctx: CngxHierarchicalNavContext<T>): CngxHierarchicalNavAction;
}

const NOOP: CngxHierarchicalNavAction = { kind: 'noop' };

/**
 * Default W3C APG treeview keyboard policy:
 *
 * - **ArrowRight** on a collapsed parent expands it. On an already-open
 *   parent it moves the active-descendant to the first child. On a leaf
 *   it is a no-op.
 * - **ArrowLeft** on an open node collapses it. On a closed node (or
 *   leaf) with a parent it moves the active-descendant to the parent.
 *   On a root leaf it is a no-op.
 *
 * Move actions internally verify that `ad.highlightByValue` actually
 * changed `activeId` (e.g. disabled skip rejection), and downgrade to
 * `'noop'` when it didn't — so consumers bound to `(movedToChild)` /
 * `(movedToParent)` only see state-change-truthful emissions.
 *
 * @category interactive
 */
export function createW3CTreeStrategy(): CngxHierarchicalNavStrategy {
  const attemptMove = <T>(
    ctx: CngxHierarchicalNavContext<T>,
    targetValue: unknown,
    targetId: string,
    kind: 'movedToChild' | 'movedToParent',
  ): CngxHierarchicalNavAction => {
    const before = ctx.ad.activeId();
    ctx.ad.highlightByValue(targetValue);
    if (ctx.ad.activeId() === before) {
      return NOOP;
    }
    return { kind, id: targetId };
  };

  return {
    onArrowRight<T>(ctx: CngxHierarchicalNavContext<T>): CngxHierarchicalNavAction {
      const node = ctx.controller.findById(ctx.activeId);
      if (!node?.hasChildren) {
        return NOOP;
      }
      if (!ctx.controller.isExpanded(ctx.activeId)()) {
        ctx.controller.expand(ctx.activeId);
        return { kind: 'expand', id: ctx.activeId };
      }
      const firstChild = ctx.controller.firstChildOf(ctx.activeId);
      if (!firstChild) {
        return NOOP;
      }
      return attemptMove(ctx, firstChild.value, firstChild.id, 'movedToChild');
    },

    onArrowLeft<T>(ctx: CngxHierarchicalNavContext<T>): CngxHierarchicalNavAction {
      if (ctx.controller.isExpanded(ctx.activeId)()) {
        ctx.controller.collapse(ctx.activeId);
        return { kind: 'collapse', id: ctx.activeId };
      }
      const parent = ctx.controller.parentOf(ctx.activeId);
      if (!parent) {
        return NOOP;
      }
      return attemptMove(ctx, parent.value, parent.id, 'movedToParent');
    },
  };
}

/**
 * DI token carrying the {@link CngxHierarchicalNavStrategy} that
 * `CngxHierarchicalNav` consults on every ArrowLeft/Right press.
 * Defaults to {@link createW3CTreeStrategy}; override via
 * `providers`/`viewProviders` for alternative keyboard semantics.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     {
 *       provide: CNGX_HIERARCHICAL_NAV_STRATEGY,
 *       useFactory: () => ({
 *         onArrowRight: (ctx) => {
 *           // Expand only; never traverse to first child.
 *           const node = ctx.controller.findById(ctx.activeId);
 *           if (!node?.hasChildren) return { kind: 'noop' };
 *           ctx.controller.expand(ctx.activeId);
 *           return { kind: 'expand', id: ctx.activeId };
 *         },
 *         onArrowLeft: (ctx) => ({ kind: 'noop' }),
 *       }),
 *     },
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export const CNGX_HIERARCHICAL_NAV_STRATEGY =
  new InjectionToken<CngxHierarchicalNavStrategy>('CngxHierarchicalNavStrategy', {
    providedIn: 'root',
    factory: createW3CTreeStrategy,
  });
