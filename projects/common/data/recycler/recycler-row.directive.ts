import {
  DestroyRef,
  Directive,
  effect,
  type EmbeddedViewRef,
  inject,
  InjectionToken,
  input,
  type Provider,
  Renderer2,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';

import type { CngxRecycler } from './recycler';

/**
 * Context for the placeholder branch of `*cngxRecyclerRow` - the window slot
 * whose item has not loaded yet (`undefined`). A custom `placeholder:` template
 * reads this to keep the list count honest for assistive technology:
 * `aria-posinset = index + 1`, `aria-setsize = setSize`.
 *
 * The real-row branch (item defined) binds `$implicit` to the item value
 * instead; that context is internal and narrowed by `ngTemplateContextGuard`.
 *
 * @category common/data/recycler
 */
export interface CngxRecyclerRowContext {
  /** The absolute dataset index of this slot. Alias of `index`. */
  $implicit: number;
  /** The absolute dataset index of this slot. */
  index: number;
  /** Pixel offset of the slot from the top of the scroll content. */
  top: number;
  /** Total set size (`recycler.ariaSetSize()`) for `aria-setsize`. */
  setSize: number;
}

/** Internal real-row context: the loaded item at this window position. */
interface CngxRecyclerRowRealContext<T> {
  $implicit: T;
  cngxRecyclerRow: T;
}

/**
 * App-wide default placeholder template for `*cngxRecyclerRow`. Middle rung of
 * the cascade: microsyntax `placeholder:` template wins over this, and this wins
 * over the built-in imperative `<li>` default. Defaults to `null` (imperative
 * default applies).
 *
 * @category common/data/recycler
 */
export const CNGX_RECYCLER_PLACEHOLDER_ROW = new InjectionToken<
  TemplateRef<CngxRecyclerRowContext> | null
>('CNGX_RECYCLER_PLACEHOLDER_ROW', { providedIn: 'root', factory: () => null });

/**
 * Provides an app-wide default placeholder template for every `*cngxRecyclerRow`
 * that supplies no `placeholder:` template of its own.
 *
 * @category common/data/recycler
 */
export function provideRecyclerPlaceholderRow(
  template: TemplateRef<CngxRecyclerRowContext>,
): Provider {
  return { provide: CNGX_RECYCLER_PLACEHOLDER_ROW, useValue: template };
}

/**
 * Per-window-position render switch for a sparse/windowed recycler: renders the
 * consumer's real-row template when the sliced item is defined, and a
 * placeholder branch when the item is still `undefined` (loaded window, data
 * not yet resolved).
 *
 * Mirrors the `*cngxAsync` structural-directive shape (own `TemplateRef` +
 * microsyntax alternate template + `ngTemplateContextGuard`). The switch axis is
 * data availability, not async status, so the two are siblings, not the same
 * class. Unlike `*cngxAsync` (which clears on every switch) the real-row view is
 * cached and re-attached across a placeholder detour, so a
 * defined -> undefined -> defined flip never remounts the expensive real row.
 *
 * The placeholder branch resolves through a 3-stage cascade: the microsyntax
 * `placeholder:` template, then {@link CNGX_RECYCLER_PLACEHOLDER_ROW}, then a
 * built-in imperative `<li>` default. The default assumes a `<ul>`/`<li>` list;
 * a non-`<li>` container (`<div role="list">`) supplies a `placeholder:`
 * template or the config token instead.
 *
 * @category common/data/recycler
 */
@Directive({
  selector: '[cngxRecyclerRow]',
  standalone: true,
})
export class CngxRecyclerRow<T> {
  private readonly vcr = inject(ViewContainerRef);
  private readonly rowTpl = inject<TemplateRef<CngxRecyclerRowRealContext<T>>>(TemplateRef);
  private readonly renderer = inject(Renderer2);
  private readonly configTpl = inject(CNGX_RECYCLER_PLACEHOLDER_ROW);

  /** The sliced item at this window position. `undefined` selects the placeholder branch. */
  readonly cngxRecyclerRow = input<T | undefined>(undefined);

  /** Absolute dataset index of this slot (`recycler.start() + $index`). */
  readonly cngxRecyclerRowIndex = input.required<number>();

  /** The recycler driving the window, read for `rowSizeHint` (-> `top`) and `ariaSetSize`. */
  readonly cngxRecyclerRowRecycler = input.required<CngxRecycler>();

  /** Optional placeholder template for the `undefined` branch. Context: {@link CngxRecyclerRowContext}. */
  readonly cngxRecyclerRowPlaceholder = input<TemplateRef<CngxRecyclerRowContext> | undefined>(
    undefined,
  );

  // Plain fields, not signals: read and written only inside the render effect.
  // As signals they would feed the effect's own dependency graph and double-fire
  // per branch switch (the trap documented in async.directive.ts).
  private currentBranch: 'row' | 'placeholder' | 'none' = 'none';
  private rowViewRef: EmbeddedViewRef<CngxRecyclerRowRealContext<T>> | null = null;
  private placeholderViewRef: EmbeddedViewRef<CngxRecyclerRowContext> | null = null;
  private defaultEl: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const item = this.cngxRecyclerRow();
      if (item === undefined) {
        // Placeholder branch tracks index + ariaSetSize (via buildPlaceholderContext)
        // so the announced position/size stay live while the slot remains unloaded
        // across a window shift or an infinite-scroll setSize growth - Pillar 2
        // keeps a11y in the reactive graph, never a one-time write. The row branch
        // tracks only the item value; the placeholder template ref is read untracked.
        this.showPlaceholder(this.buildPlaceholderContext());
      } else {
        this.showRow(item);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      // The cached row view may be detached (not owned by the VCR), so the VCR
      // will not tear it down; destroy both views explicitly, guarding the
      // already-destroyed case when the VCR got there first.
      if (this.rowViewRef && !this.rowViewRef.destroyed) {
        this.rowViewRef.destroy();
      }
      this.teardownPlaceholder();
    });
  }

  private showRow(item: T): void {
    if (this.currentBranch === 'row') {
      this.setRowContext(item);
      this.rowViewRef?.markForCheck();
      return;
    }
    this.teardownPlaceholder();
    if (this.rowViewRef) {
      this.setRowContext(item);
      this.vcr.insert(this.rowViewRef);
      this.rowViewRef.markForCheck();
    } else {
      this.rowViewRef = this.vcr.createEmbeddedView(this.rowTpl, {
        $implicit: item,
        cngxRecyclerRow: item,
      });
    }
    this.currentBranch = 'row';
  }

  private showPlaceholder(ctx: CngxRecyclerRowContext): void {
    if (this.currentBranch === 'placeholder') {
      this.refreshPlaceholder(ctx);
      return;
    }
    this.detachRow();
    this.renderPlaceholder(ctx);
    this.currentBranch = 'placeholder';
  }

  private setRowContext(item: T): void {
    if (this.rowViewRef) {
      this.rowViewRef.context.$implicit = item;
      this.rowViewRef.context.cngxRecyclerRow = item;
    }
  }

  // Remove the cached row view from the container WITHOUT destroying it, so the
  // next 'row' branch re-attaches the same EmbeddedViewRef (no remount).
  private detachRow(): void {
    if (!this.rowViewRef) {
      return;
    }
    const at = this.vcr.indexOf(this.rowViewRef);
    if (at !== -1) {
      this.vcr.detach(at);
    }
  }

  private teardownPlaceholder(): void {
    if (this.placeholderViewRef) {
      this.placeholderViewRef.destroy();
      this.placeholderViewRef = null;
    }
    this.removeDefault();
  }

  private renderPlaceholder(ctx: CngxRecyclerRowContext): void {
    const tpl = untracked(() => this.cngxRecyclerRowPlaceholder()) ?? this.configTpl ?? null;
    if (tpl) {
      this.placeholderViewRef = this.vcr.createEmbeddedView(tpl, ctx);
    } else {
      this.stampDefault(ctx);
    }
  }

  // Slot stayed unloaded but its index/setSize moved: refresh the live a11y
  // position/size in place - custom template context or default element attrs -
  // without remounting the placeholder.
  private refreshPlaceholder(ctx: CngxRecyclerRowContext): void {
    if (this.placeholderViewRef) {
      const context = this.placeholderViewRef.context;
      context.$implicit = ctx.$implicit;
      context.index = ctx.index;
      context.top = ctx.top;
      context.setSize = ctx.setSize;
      this.placeholderViewRef.markForCheck();
    } else if (this.defaultEl) {
      this.applyDefaultAttrs(this.defaultEl, ctx);
    }
  }

  // Terminal fallback: a module-level TemplateRef cannot exist, so the built-in
  // default is one imperative <li> reusing the shipped `cngx-recycler-placeholder`
  // ghost-row CSS. It holds a real dataset position, so it stays in the a11y tree
  // (aria-busy / role=listitem / posinset / setsize) - never aria-hidden.
  private stampDefault(ctx: CngxRecyclerRowContext): void {
    const anchor = this.vcr.element.nativeElement as Node;
    const parent = this.renderer.parentNode(anchor) as Node | null;
    if (!parent) {
      return;
    }
    const li = this.renderer.createElement('li') as HTMLElement;
    this.renderer.addClass(li, 'cngx-recycler-placeholder');
    this.renderer.setAttribute(li, 'role', 'listitem');
    this.renderer.setAttribute(li, 'aria-busy', 'true');
    this.applyDefaultAttrs(li, ctx);
    this.renderer.insertBefore(parent, li, anchor);
    this.defaultEl = li;
  }

  private applyDefaultAttrs(li: HTMLElement, ctx: CngxRecyclerRowContext): void {
    const height = untracked(() => this.cngxRecyclerRowRecycler().rowSizeHint());
    this.renderer.setAttribute(li, 'aria-posinset', String(ctx.index + 1));
    this.renderer.setAttribute(li, 'aria-setsize', String(ctx.setSize));
    this.renderer.setStyle(li, 'height', `${height}px`);
    this.renderer.setStyle(li, '--cngx-recycler-placeholder-row-height', `${height}px`);
  }

  private removeDefault(): void {
    if (!this.defaultEl) {
      return;
    }
    const parent = this.renderer.parentNode(this.defaultEl) as Node | null;
    if (parent) {
      this.renderer.removeChild(parent, this.defaultEl);
    }
    this.defaultEl = null;
  }

  // Called only from the placeholder branch of the render effect: reading index
  // + ariaSetSize here (tracked) is what keeps the announced position/size
  // reactive. rowSizeHint is a stable layout hint, read untracked for `top`.
  private buildPlaceholderContext(): CngxRecyclerRowContext {
    const index = this.cngxRecyclerRowIndex();
    const recycler = this.cngxRecyclerRowRecycler();
    const setSize = recycler.ariaSetSize();
    const top = untracked(() => recycler.rowSizeHint()) * index;
    return { $implicit: index, index, top, setSize };
  }

  /** Narrows the directive's own template context to the loaded item type. */
  static ngTemplateContextGuard<T>(
    _dir: CngxRecyclerRow<T>,
    _ctx: unknown,
  ): _ctx is CngxRecyclerRowRealContext<T> {
    return true;
  }
}
