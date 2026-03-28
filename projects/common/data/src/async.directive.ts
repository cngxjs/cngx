import {
  computed,
  Directive,
  effect,
  type EmbeddedViewRef,
  inject,
  input,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { resolveAsyncView, type AsyncView } from './async-state/resolve-view';

/**
 * Template context for the `*cngxAsync` content template.
 * `$implicit` provides the data value, typed via `ngTemplateContextGuard`.
 */
export interface CngxAsyncContext<T> {
  /** The data value — bound via `let data` in microsyntax. */
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
 * - **error (first load)** → error template (or nothing)
 * - **refreshing / loading (with data)** → content template (old data stays visible)
 * - **error (with data)** → content template (old data stays visible)
 *
 * @usageNotes
 *
 * ### Minimal — just content
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
 * @category data
 */
@Directive({
  selector: '[cngxAsync]',
  standalone: true,
})
export class CngxAsync<T> {
  private readonly vcr = inject(ViewContainerRef);
  private readonly contentTpl = inject<TemplateRef<CngxAsyncContext<T>>>(TemplateRef);

  /** The async state to render. */
  readonly cngxAsync = input.required<CngxAsyncState<T>>();

  /** Optional skeleton template shown during first load. */
  readonly cngxAsyncSkeleton = input<TemplateRef<unknown> | undefined>(undefined);

  /** Optional empty template shown when data is empty after success. */
  readonly cngxAsyncEmpty = input<TemplateRef<unknown> | undefined>(undefined);

  /** Optional error template shown on error during first load. Context: `{ $implicit: error }`. */
  readonly cngxAsyncError = input<TemplateRef<{ $implicit: unknown }> | undefined>(undefined);

  // ── Derived state ───────────────────────────────────────────────────

  private readonly view = computed(() => {
    const s = this.cngxAsync();
    return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
  });

  // ── View management ─────────────────────────────────────────────────

  private readonly currentView = signal<AsyncView>('none');
  private contentViewRef: EmbeddedViewRef<CngxAsyncContext<T>> | null = null;

  constructor() {
    effect(() => {
      const view = this.view();
      const s = this.cngxAsync();
      // content+error → show content (structural directive has no dual-render)
      const effective = view === 'content+error' ? 'content' : view;

      if (effective === this.currentView()) {
        this.updateContentContext(s);
        return;
      }

      this.vcr.clear();
      this.contentViewRef = null;
      this.currentView.set(effective);

      this.renderView(effective, s);
    });
  }

  private updateContentContext(s: CngxAsyncState<T>): void {
    if (!this.contentViewRef) {
      return;
    }
    const data = s.data();
    if (data === undefined) {
      return;
    }
    this.contentViewRef.context.$implicit = data;
    this.contentViewRef.context.cngxAsync = data;
    this.contentViewRef.markForCheck();
  }

  private renderView(view: AsyncView, s: CngxAsyncState<T>): void {
    switch (view) {
      case 'skeleton':
        this.renderTemplate(this.cngxAsyncSkeleton());
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
      case 'empty':
        this.renderTemplate(this.cngxAsyncEmpty());
        break;
      case 'error':
        this.renderTemplate(this.cngxAsyncError(), { $implicit: s.error() });
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
