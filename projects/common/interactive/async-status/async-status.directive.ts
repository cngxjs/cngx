import {
  computed,
  Directive,
  contentChild,
  inject,
  input,
  isDevMode,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxAsyncClick } from '../async-click/async-click.directive';
import { CngxFailed, CngxPending, CngxSucceeded } from '../async-click/async-status-templates';

/**
 * Display bucket a reflector collapses an {@link CngxAsyncState} into.
 * The `loading` / `refreshing` busy variants fold into `pending` for the
 * visible status, while `isBusy` carries the full busy set for ARIA.
 *
 * @category common/interactive
 */
export type CngxAsyncDisplayStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Single source for collapsing a {@link CngxAsyncState} into its display
 * bucket. Owned by the {@link CngxAsyncStatus} reflector so every consumer
 * (the reflector directive, `CngxActionButton`'s `[externalState]` branch)
 * maps an externally-owned state the same way - one reflection code path.
 *
 * @category common/interactive
 */
export function reflectAsyncDisplayStatus(
  state: CngxAsyncState<unknown> | null | undefined,
): CngxAsyncDisplayStatus {
  switch (state?.status()) {
    case 'pending':
    case 'loading':
    case 'refreshing':
      return 'pending';
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}

/**
 * Reflects an externally-owned {@link CngxAsyncState} onto its host -
 * the read-only sibling of `CngxAsyncClick`. Where `CngxAsyncClick`
 * *runs* an action and owns its own lifecycle, `CngxAsyncStatus` *reads*
 * a state someone else produces (a presenter's `commitState`, a resource)
 * and surfaces it as `aria-busy`, an optional disabled gate, and the
 * pending / succeeded / failed slot markers.
 *
 * One responsibility - reflection - kept distinct from running an action
 * (Pillar 3). `aria-busy` lives in the `computed()` graph (Pillar 2) and
 * is owned here exclusively: never co-place this with `CngxAsyncClick` on
 * the same element, since both bind `aria-busy` (dev mode warns).
 *
 * ```html
 * <button [cngxAsyncStatus]="presenter.commitState" disableWhilePending>
 *   Continue
 *   <ng-template cngxPending>Saving…</ng-template>
 * </button>
 * ```
 *
 * @category common/interactive
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-status/async-status.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAsyncClick, CngxPending, CngxSucceeded, CngxFailed
 */
@Directive({
  selector: '[cngxAsyncStatus]',
  standalone: true,
  exportAs: 'cngxAsyncStatus',
  host: {
    '[attr.aria-busy]': 'isBusy() || null',
    '[attr.aria-disabled]': 'disabledAttr() !== null || null',
    '[attr.disabled]': 'disabledAttr()',
  },
})
export class CngxAsyncStatus {
  private readonly coPlacedAsyncClick = inject(CngxAsyncClick, { self: true, optional: true });

  constructor() {
    if (isDevMode() && this.coPlacedAsyncClick) {
      console.warn(
        'CngxAsyncStatus: [cngxAsyncStatus] and [cngxAsyncClick] on the same element ' +
          'both bind aria-busy. Use one or the other.',
      );
    }
  }

  /** The externally-owned state to reflect. `null` reflects as idle. */
  readonly state = input<CngxAsyncState<unknown> | null>(null, { alias: 'cngxAsyncStatus' });

  /** When `true`, the host reflects `aria-disabled` / `disabled` while busy. */
  readonly disableWhilePending = input<boolean>(false);

  /** Display bucket of the reflected state (`loading`/`refreshing` → `pending`). */
  readonly status: Signal<CngxAsyncDisplayStatus> = computed(() =>
    reflectAsyncDisplayStatus(this.state()),
  );

  /** `true` while the reflected state is busy (`loading` | `pending` | `refreshing`). */
  readonly isBusy: Signal<boolean> = computed(() => this.state()?.isBusy() ?? false);

  /** The reflected error value, or `undefined`. */
  readonly error: Signal<unknown> = computed(() => this.state()?.error());

  /** @internal */
  protected readonly pendingTpl = contentChild(CngxPending);
  /** @internal */
  protected readonly succeededTpl = contentChild(CngxSucceeded);
  /** @internal */
  protected readonly failedTpl = contentChild(CngxFailed);

  /**
   * The projected slot marker matching the current display bucket, or
   * `null` when none is projected. Bind via
   * `*ngTemplateOutlet="status.activeTemplate()"`.
   */
  readonly activeTemplate: Signal<TemplateRef<unknown> | null> = computed(() => {
    switch (this.status()) {
      case 'pending':
        return this.pendingTpl()?.templateRef ?? null;
      case 'success':
        return this.succeededTpl()?.templateRef ?? null;
      case 'error':
        return this.failedTpl()?.templateRef ?? null;
      default:
        return null;
    }
  });

  /** @internal - `''` (set) while gated-and-busy, else `null` (absent). */
  protected readonly disabledAttr = computed<'' | null>(() =>
    this.disableWhilePending() && this.isBusy() ? '' : null,
  );
}
