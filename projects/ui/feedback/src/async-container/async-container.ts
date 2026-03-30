import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  inject,
  input,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { type AsyncView, resolveAsyncView } from '@cngx/common/data';
import { createTransitionTracker, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

import { CngxLoadingIndicator } from '../loading/loading-indicator';
import { CngxToaster } from '../toast/toast.service';

// ── Template marker directives ──────────────────────────────────────

/** Marks the skeleton template inside `cngx-async-container`. */
@Directive({ selector: 'ng-template[cngxAsyncSkeleton]', standalone: true })
export class CngxAsyncSkeletonTpl {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Marks the content template inside `cngx-async-container`.
 * Context: `{ $implicit: T }` — use `let-data` to access.
 */
@Directive({ selector: 'ng-template[cngxAsyncContent]', standalone: true })
export class CngxAsyncContentTpl<T> {
  readonly templateRef = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: CngxAsyncContentTpl<T>,
    _ctx: unknown,
  ): _ctx is { $implicit: T } {
    return true;
  }
}

/** Marks the empty-state template inside `cngx-async-container`. */
@Directive({ selector: 'ng-template[cngxAsyncEmpty]', standalone: true })
export class CngxAsyncEmptyTpl {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Marks the error template inside `cngx-async-container`.
 * Context: `{ $implicit: unknown }` — use `let-err` to access.
 */
@Directive({ selector: 'ng-template[cngxAsyncError]', standalone: true })
export class CngxAsyncErrorTpl {
  readonly templateRef = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}

// ── Component ───────────────────────────────────────────────────────

/**
 * Async container molecule — coordinates all feedback states for data loading.
 *
 * Projects four named templates and switches between them based on the
 * `CngxAsyncState` lifecycle. Includes a built-in refresh indicator (bar)
 * and ARIA state announcements.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-async-container [state]="residents">
 *   <ng-template cngxAsyncSkeleton>
 *     @for (i of [1,2,3]; track i) { <div class="skeleton-card"></div> }
 *   </ng-template>
 *
 *   <ng-template cngxAsyncContent let-data>
 *     @for (r of data; track r.id) { <app-card [resident]="r" /> }
 *   </ng-template>
 *
 *   <ng-template cngxAsyncEmpty>
 *     <cngx-empty-state title="No residents" />
 *   </ng-template>
 *
 *   <ng-template cngxAsyncError let-err>
 *     <cngx-alert severity="error">{{ err }}</cngx-alert>
 *   </ng-template>
 * </cngx-async-container>
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-async-container',
  standalone: true,
  imports: [NgTemplateOutlet, CngxLoadingIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    style: 'display: contents',
    class: 'cngx-async-container',
    role: 'region',
    '[attr.aria-busy]': 'state().isBusy() || null',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
  template: `
    @if (showRefreshIndicator()) {
      <cngx-loading-indicator
        [loading]="true"
        variant="bar"
        label="Refreshing content"
        class="cngx-async-container__refresh"
      />
    }

    @switch (activeView()) {
      @case ('skeleton') {
        @if (skeletonTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        }
      }
      @case ('content') {
        @if (contentTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: contentContext()" />
        }
      }
      @case ('empty') {
        @if (emptyTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        }
      }
      @case ('error') {
        @if (errorTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: errorContext()" />
        }
      }
      @case ('content+error') {
        @if (contentTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: contentContext()" />
        }
        @if (errorTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: errorContext()" />
        }
      }
    }

    <span aria-live="polite" aria-atomic="true" class="cngx-async-container__sr-only">
      {{ announcement() }}
    </span>
  `,
  styles: `
    .cngx-async-container__refresh {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: var(--cngx-async-container-refresh-z, 5);
    }

    .cngx-async-container__sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class CngxAsyncContainer<T> {
  private readonly toaster = inject(CngxToaster, { optional: true });

  /** The async state to render. */
  readonly state = input.required<CngxAsyncState<T>>();

  /** Show refresh indicator bar during refresh/re-query. */
  readonly refreshIndicator = input<boolean>(true);

  /** ARIA label for the region. */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Toast message on success. If set, fires a toast via CngxToaster. */
  readonly toastSuccess = input<string | undefined>(undefined);

  /** Toast message on error. If set, fires a toast via CngxToaster. */
  readonly toastError = input<string | undefined>(undefined);

  // ── Template queries ──────────────────────────────────────────────

  /** @internal */
  protected readonly skeletonTpl = contentChild(CngxAsyncSkeletonTpl);
  /** @internal */
  protected readonly contentTpl = contentChild(CngxAsyncContentTpl);
  /** @internal */
  protected readonly emptyTpl = contentChild(CngxAsyncEmptyTpl);
  /** @internal */
  protected readonly errorTpl = contentChild(CngxAsyncErrorTpl);

  // ── Derived view ──────────────────────────────────────────────────

  /** @internal */
  protected readonly activeView = computed<AsyncView>(() => {
    const s = this.state();
    return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
  });

  /** @internal */
  protected readonly showRefreshIndicator = computed(() => {
    if (!this.refreshIndicator()) {
      return false;
    }
    const s = this.state();
    const status = s.status();
    return status === 'refreshing' || (status === 'loading' && !s.isFirstLoad());
  });

  /** @internal */
  protected readonly contentContext = computed(() => ({
    $implicit: this.state().data() as T,
  }));

  /** @internal */
  protected readonly errorContext = computed(() => ({
    $implicit: this.state().error(),
  }));

  // ── SR announcements ──────────────────────────────────────────────

  /** @internal */
  protected readonly announcement = signal<string>('');

  constructor() {
    const tracker = createTransitionTracker(() => this.state().status());

    effect(() => {
      const status = tracker.current();
      const prev = tracker.previous();

      if (status === prev) {
        return;
      }
      if (status === 'pending' || prev === 'pending') {
        return;
      }

      if (prev === 'idle' && status === 'loading') {
        this.announcement.set('Loading content');
      } else if (prev === 'loading' && status === 'success') {
        this.announcement.set('Content loaded');
      } else if (prev === 'loading' && status === 'error') {
        this.announcement.set('Error loading content');
      } else if (status === 'refreshing') {
        this.announcement.set('Refreshing content');
      } else if (prev === 'refreshing' && status === 'success') {
        this.announcement.set('Content refreshed');
      } else if (prev === 'refreshing' && status === 'error') {
        this.announcement.set('Refresh failed');
      }

      // Fire toasts if configured
      this.fireToast(status);
    });
  }

  private fireToast(status: AsyncStatus): void {
    if (!this.toaster) {
      return;
    }
    if (status === 'success') {
      const msg = this.toastSuccess();
      if (msg) {
        this.toaster.show({ message: msg, severity: 'success', duration: 3000 });
      }
    }
    if (status === 'error') {
      const msg = this.toastError();
      if (msg) {
        this.toaster.show({ message: msg, severity: 'error' });
      }
    }
  }
}
