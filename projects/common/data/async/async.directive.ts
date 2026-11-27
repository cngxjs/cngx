import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  Directive,
  effect,
  type EmbeddedViewRef,
  inject,
  Injector,
  input,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import { CNGX_FOCUSABLE_SELECTOR } from '@cngx/common/a11y';
import type { CngxAsyncState } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';

import { resolveAsyncView, type AsyncView } from '../async-state/resolve-view';

/**
 * Template context for the `*cngxAsync` content template.
 * `$implicit` provides the data value, typed via `ngTemplateContextGuard`.
 *
 * Typed as `T` for template ergonomics, but the content view receives the
 * state's `data()` as is: a producer whose data goes `undefined` while it stays
 * in the content view (e.g. `refreshing` after a cleared value) passes
 * `undefined` through. Guard with `@if` / `?.` when the producer can do that.
 */
export interface CngxAsyncContext<T> {
  /** The data value - bound via `let data` in microsyntax. */
  $implicit: T;
  /** Alias for `$implicit`. */
  cngxAsync: T;
}

/**
 * Structural directive for async state-driven content rendering.
 *
 * Renders different views based on the current `CngxAsyncState` status:
 * - **loading (first load)** → skeleton template (or nothing)
 * - **success + has data** → content template with typed data
 * - **success + empty** → empty template (or nothing)
 * - **error (first load)** → error template (or nothing; dev mode warns once, [`CNGX1085`](/error-codes/cngx1085.md))
 * - **refreshing / loading (with data)** → content template (old data stays visible)
 * - **error (with data)** → content template (old data stays visible) -
 *   `resolveAsyncView` reports this as `content+error`, but a structural
 *   directive renders exactly one template, so the error half is flattened
 *   away here; surface it separately (toast, alert) when it must be visible
 *
 * ### Focus across a view switch
 * When a switch destroys the view that holds focus, focus moves to the first
 * focusable element (outside any `inert` subtree) of the next rendered view, so
 * a focused Retry button does not drop keyboard users onto `<body>`. One view
 * without a focusable element (a skeleton) is bridged; after that the hand-off
 * lapses. Focus that sits outside the directive, or that the user moved
 * elsewhere in the meantime, is never touched.
 *
 * ### Minimal - just content
 * Without an error template a failed first load renders nothing, and dev mode
 * warns with [`CNGX1085`](/error-codes/cngx1085.md). Bind `error:` once the
 * state can fail.
 * ```html
 * <ul *cngxAsync="residents; let data">
 *   @for (r of data; track r.id) { <li>{{ r.name }}</li> }
 * </ul>
 * ```
 *
 * ### With custom templates
 * ```html
 * <ul *cngxAsync="residents; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl">
 *   @for (r of data; track r.id) { <li>{{ r.name }}</li> }
 * </ul>
 *
 * <ng-template #skelTpl>
 *   @for (i of [1,2,3]; track i) { <li class="skeleton-line"></li> }
 * </ng-template>
 *
 * <ng-template #emptyTpl>
 *   <li>No residents found.</li>
 * </ng-template>
 *
 * <ng-template #errTpl let-err>
 *   <li>Error: {{ err }}</li>
 * </ng-template>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/async/async.directive.ts
 * @since 0.3.0
 * @relatedTo injectAsyncState, createAsyncState, createManualState
 *
 * <example-url>/#/ui/feedback/async-container/cngx-async-container-full-control-toast</example-url>
 * <example-url>/#/ui/feedback/async-container/cngxasync-one-line</example-url>
 * <example-url>/#/ui/feedback/async-container/cngxasync-with-custom-templates</example-url>
 * <example-url>/#/ui/feedback/async-container/composition-overlay-container-toast</example-url>
 * <example-url>/#/ui/feedback/async-container/createasyncstate-mutation</example-url>
 * <example-url>/#/ui/feedback/async-container/injectasyncstate-reactive-query</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxAsync]',
  standalone: true,
})
export class CngxAsync<T> {
  private readonly vcr = inject(ViewContainerRef);
  private readonly contentTpl = inject<TemplateRef<CngxAsyncContext<T>>>(TemplateRef);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  /** The async state to render. */
  readonly cngxAsync = input.required<CngxAsyncState<T>>();

  /** Optional skeleton template shown during first load. */
  readonly cngxAsyncSkeleton = input<TemplateRef<unknown> | undefined>(undefined);

  /** Optional empty template shown when data is empty after success. */
  readonly cngxAsyncEmpty = input<TemplateRef<unknown> | undefined>(undefined);

  /** Optional error template shown on error during first load. Context: `{ $implicit: error }`. */
  readonly cngxAsyncError = input<TemplateRef<{ $implicit: unknown }> | undefined>(undefined);

  // content+error → content (structural directive has no dual-render)
  private readonly view = computed((): AsyncView => {
    const s = this.cngxAsync();
    const resolved = resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
    return resolved === 'content+error' ? 'content' : resolved;
  });

  // The slot template of the current view; the content template is fixed.
  private readonly slotTemplate = computed((): TemplateRef<unknown> | undefined => {
    switch (this.view()) {
      case 'skeleton':
        return this.cngxAsyncSkeleton();
      case 'empty':
        return this.cngxAsyncEmpty();
      case 'error':
        return this.cngxAsyncError();
      default:
        return undefined;
    }
  });

  // Plain fields, not signals: they are only ever read and written inside the
  // render effect - as signals they fed the effect's own dependency graph and
  // caused one spurious re-run per view switch.
  private currentView: AsyncView = 'none';
  private currentTemplate: TemplateRef<unknown> | undefined = undefined;
  private contentViewRef: EmbeddedViewRef<CngxAsyncContext<T>> | null = null;
  // View switches left in which focus lost by a destroyed view may be handed
  // on: the switch that lost it plus one more, so a short skeleton in between
  // is bridged but a much later refresh never pulls focus back.
  private focusSwitchesLeft = 0;
  // CNGX1085 fires once: a retry that fails again must not repeat it.
  private missingErrorTemplateWarned = false;

  constructor() {
    effect(() => {
      const view = this.view();
      const tpl = this.slotTemplate();
      const s = this.cngxAsync();

      if (view === this.currentView && tpl === this.currentTemplate) {
        this.updateContentContext(s);
        return;
      }

      if (this.renderedViewHoldsFocus()) {
        this.focusSwitchesLeft = 2;
      }
      this.vcr.clear();
      this.contentViewRef = null;
      this.currentView = view;
      this.currentTemplate = tpl;

      this.renderView(view, tpl, s);
      if (this.focusSwitchesLeft > 0) {
        this.focusSwitchesLeft--;
        untracked(() => afterNextRender(() => this.restoreFocus(), { injector: this.injector }));
      }
    });
  }

  private renderedRoots(): Node[] {
    const roots: Node[] = [];
    for (let i = 0; i < this.vcr.length; i++) {
      const ref = this.vcr.get(i) as EmbeddedViewRef<unknown> | null;
      roots.push(...((ref?.rootNodes ?? []) as Node[]));
    }
    return roots;
  }

  private renderedViewHoldsFocus(): boolean {
    const active = this.doc.activeElement;
    if (!active || active === this.doc.body) {
      return false;
    }
    return this.renderedRoots().some((node) => node.contains(active));
  }

  // Restores focus only when it was lost to the body; a view without a
  // focusable element leaves the remaining switch budget to the next one.
  private restoreFocus(): void {
    const active = this.doc.activeElement;
    if (active && active !== this.doc.body) {
      this.focusSwitchesLeft = 0;
      return;
    }
    const target = this.firstFocusable();
    if (target) {
      this.focusSwitchesLeft = 0;
      target.focus();
    }
  }

  private firstFocusable(): HTMLElement | null {
    for (const node of this.renderedRoots()) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      if (node.matches(CNGX_FOCUSABLE_SELECTOR) && !node.closest('[inert]')) {
        return node;
      }
      const inner = Array.from(node.querySelectorAll<HTMLElement>(CNGX_FOCUSABLE_SELECTOR)).find(
        (el) => !el.closest('[inert]'),
      );
      if (inner) {
        return inner;
      }
    }
    return null;
  }

  private updateContentContext(s: CngxAsyncState<T>): void {
    if (!this.contentViewRef) {
      return;
    }
    const data = s.data() as T;
    this.contentViewRef.context.$implicit = data;
    this.contentViewRef.context.cngxAsync = data;
    this.contentViewRef.markForCheck();
  }

  private renderView(
    view: AsyncView,
    tpl: TemplateRef<unknown> | undefined,
    s: CngxAsyncState<T>,
  ): void {
    switch (view) {
      case 'skeleton':
      case 'empty':
        this.renderTemplate(tpl);
        break;
      case 'content':
      case 'content+error': {
        const data = s.data();
        this.contentViewRef = this.vcr.createEmbeddedView(this.contentTpl, {
          $implicit: data as T,
          cngxAsync: data as T,
        });
        break;
      }
      case 'error':
        if (
          typeof ngDevMode !== 'undefined' &&
          ngDevMode &&
          !tpl &&
          !this.missingErrorTemplateWarned
        ) {
          this.missingErrorTemplateWarned = true;
          const anchor = this.vcr.element.nativeElement as Node;
          cngxDevWarn(
            'CNGX1085',
            '[cngxAsync] reached the error state on a first load without an error template, ' +
              'so it renders nothing. Bind one via "error: errTpl" in the microsyntax.',
            anchor.parentElement ?? anchor,
          );
        }
        this.renderTemplate(tpl, { $implicit: s.error() });
        break;
    }
  }

  private renderTemplate(
    tpl: TemplateRef<unknown> | undefined,
    context?: Record<string, unknown>,
  ): void {
    if (tpl) {
      this.vcr.createEmbeddedView(tpl, context);
    }
  }

  /** Type guard for template type inference. */
  static ngTemplateContextGuard<T>(_dir: CngxAsync<T>, _ctx: unknown): _ctx is CngxAsyncContext<T> {
    return true;
  }
}
