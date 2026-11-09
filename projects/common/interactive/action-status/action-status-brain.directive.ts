import {
  afterNextRender,
  computed,
  contentChild,
  Directive,
  effect,
  inject,
  Injector,
  input,
  output,
  untracked,
  type Signal,
} from '@angular/core';
import {
  buildAsyncStateView,
  createKeyedRegistry,
  createTransitionTracker,
  injectLazySelf,
  resolveSpokenText,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';

import type { CngxAsyncSettle } from '../async-click/async-click.directive';
import { CNGX_ASYNC_RUN_STATE } from '../async-click/async-run-state.token';
import { CngxFailed, CngxPending, CngxSucceeded } from '../async-click/async-status-templates';
import { reflectAsyncDisplayStatus } from '../async-status/async-status.directive';
import { injectInteractiveI18n } from '../i18n/interactive-i18n';
import {
  CNGX_ACTION_STATUS,
  CNGX_ANNOUNCEMENT_COVER,
  type CngxActionOutcome,
  type CngxActionStatus,
  type CngxActionStatusCellKind,
  type CngxActionStatusCells,
} from './action-status.token';

/**
 * Status layer of an action host: the effective status, the stacked label
 * cells, the settle announcement and the `[externalState]` mode, on top of
 * a co-hosted `cngxAsyncClick`. A selector-less host directive; the host
 * component is skin (template, CSS, providers) and reads the brain through
 * `CNGX_ACTION_STATUS`.
 *
 * The brain renders nothing. The host template puts `[cngxActionStatusCell]`
 * on each label span, so the active cell is visible and named and the
 * result cells register their rendered text. The host's
 * `CNGX_HOST_INTERACTION_STATE` provider adds `announcement` from the
 * contract, so the runner's live region speaks what the host shows, once
 * per settle: the explicit announcement, then the rendered result cell,
 * then the label, then `CNGX_INTERACTIVE_I18N.asyncClickSucceeded` /
 * `asyncClickFailed`. Every co-hosted `CNGX_ANNOUNCEMENT_COVER` (a toast, a
 * close-on-success) keeps the region empty for an outcome it voices itself.
 *
 * With `[externalState]` bound the status, `state`, `outcome` and the
 * announcement follow that state, once per observed `success` / `error`
 * edge; the own runs then speak nothing. Back to idle empties the region.
 *
 * Needs a co-hosted `CNGX_ASYNC_RUN_STATE` (a `cngxAsyncClick`), read lazily
 * because the runner reads the host interaction state that reads this brain.
 *
 * ```ts
 * hostDirectives: [
 *   CngxButtonBrain,
 *   { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
 *   { directive: CngxActionStatusBrain, inputs: ['succeededLabel', 'failedLabel'] },
 * ],
 * // A button host gets both host providers from @cngx/common/button.
 * providers: [provideButtonHost('appSave', { defaultVariant: 'solid' }), provideActionStatusHost()],
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-brain.directive.ts
 * @since 0.1.0
 * @relatedTo CNGX_ACTION_STATUS, CngxActionStatusCell, CNGX_ANNOUNCEMENT_COVER, CngxAsyncClick, CngxPending, CngxSucceeded, CngxFailed
 * @slot cngxPending Replaces the label while the action runs, once the run outlasts the show delay.
 * @slot cngxSucceeded Replaces the label after the action succeeds, once the busy visual releases.
 * @slot cngxFailed Replaces the label when the action fails, once the busy visual releases; gets the error.
 * <example-url>/#/ui/action-button/async-button/template-slots</example-url>
 * @axis level molecule
 */
@Directive({
  standalone: true,
  exportAs: 'cngxActionStatusBrain',
  providers: [{ provide: CNGX_ACTION_STATUS, useExisting: CngxActionStatusBrain }],
  host: {
    '[attr.data-status]': 'status()',
    '[attr.data-status-label]': 'activeCell() === "idle" ? null : ""',
  },
})
export class CngxActionStatusBrain implements CngxActionStatus {
  private readonly i18n = injectInteractiveI18n();
  private readonly injector = inject(Injector);
  private readonly runState = injectLazySelf(CNGX_ASYNC_RUN_STATE);
  private readonly covers = injectLazySelf(CNGX_ANNOUNCEMENT_COVER, { optional: true });
  private readonly cells = createKeyedRegistry<Element>({ name: 'CngxActionStatusBrain' });

  /** SR announcement on success. Falls back to the rendered result cell, the label, the i18n copy. */
  readonly succeededAnnouncement = input<string | undefined>(undefined);

  /** SR announcement on failure. Falls back to the rendered result cell, the label, the i18n copy. */
  readonly failedAnnouncement = input<string | undefined>(undefined);

  /**
   * What the runner's live region speaks. Unbound, every outcome except one
   * a co-hosted `CNGX_ANNOUNCEMENT_COVER` voices itself. `true` lets a cover
   * decide that it stands down (the toast does). `false` keeps the region
   * empty: it stays in the DOM but receives no text.
   */
  readonly autoAnnounce = input<boolean | undefined>(undefined);

  /** Fallback text while pending (no `cngxPending` template). Shows once the busy visual does. */
  readonly pendingLabel = input<string | undefined>(undefined);

  /** Fallback text after success (no `cngxSucceeded` template). */
  readonly succeededLabel = input<string | undefined>(undefined);

  /** Fallback text after failure (no `cngxFailed` template). */
  readonly failedLabel = input<string | undefined>(undefined);

  /**
   * An external async state to reflect. Bound, the status, `state`,
   * `outcome` and the announcement follow it (once per observed `success` /
   * `error` edge; binding or swapping a state, also mid-life, is not an
   * edge), and the own runs speak nothing. Unbinding empties the region.
   * Exclusive with the host's own runs.
   */
  readonly externalState = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Emits once per own settle and once per external `success` / `error` edge. */
  readonly outcome = output<CngxActionOutcome>();

  /** Projected `cngxPending` template, if any. */
  readonly pendingTemplate = contentChild(CngxPending);
  /** Projected `cngxSucceeded` template, if any. */
  readonly succeededTemplate = contentChild(CngxSucceeded);
  /** Projected `cngxFailed` template, if any. */
  readonly failedTemplate = contentChild(CngxFailed);

  /** Effective status: the bound external state (display bucket), else the co-hosted run. */
  readonly status: Signal<AsyncStatus> = computed(() => {
    const ext = this.externalState();
    if (ext) {
      return reflectAsyncDisplayStatus(ext);
    }
    return this.runState().state.status();
  });

  /** Effective error: the bound external state's, else the co-hosted run's. */
  readonly error: Signal<unknown> = computed(() => {
    const ext = this.externalState();
    return ext ? ext.error() : this.runState().state.error();
  });

  /** `true` while a bound external state is pending. */
  readonly externalBusy: Signal<boolean> = computed(
    () => this.externalState() !== undefined && this.status() === 'pending',
  );

  private readonly lastUpdated = computed(() => {
    const ext = this.externalState();
    return ext ? ext.lastUpdated() : this.runState().state.lastUpdated();
  });

  /** Full `CngxAsyncState` view of the effective lifecycle, one source per mode. */
  readonly state: CngxAsyncState<unknown> = buildAsyncStateView<unknown>({
    status: this.status,
    data: computed(() => undefined),
    error: this.error,
    lastUpdated: this.lastUpdated,
  });

  /** Which status cells render: a label or a template for the state. */
  readonly hasCell: Signal<CngxActionStatusCells> = computed(
    () => ({
      pending: !!this.pendingTemplate() || !!this.pendingLabel(),
      success: !!this.succeededTemplate() || !!this.succeededLabel(),
      error: !!this.failedTemplate() || !!this.failedLabel(),
    }),
    {
      equal: (a, b) => a.pending === b.pending && a.success === b.success && a.error === b.error,
    },
  );

  /**
   * The visible, named cell, gated on the runner's busy visual: while it is
   * held (the run and its dwell) the pending cell if there is one, else idle
   * under the spinner; the result cells only once it releases. A run faster
   * than the show delay goes idle -> result with no pending flash.
   */
  readonly activeCell: Signal<CngxActionStatusCellKind> = computed(() => {
    const cells = this.hasCell();
    if (this.runState().busyVisible()) {
      return cells.pending ? 'pending' : 'idle';
    }
    const status = this.status();
    if (status === 'success' && cells.success) {
      return 'success';
    }
    if (status === 'error' && cells.error) {
      return 'error';
    }
    return 'idle';
  });

  constructor() {
    // The runner cannot be read during construction (it injects the host
    // interaction state that reads this brain), and a settle needs a click
    // on the rendered host.
    afterNextRender(() => {
      this.runState().settled.subscribe((settle) => this.handleOwnSettle(settle));
    });

    const tracker = createTransitionTracker(() => this.status());
    let boundState = untracked(this.externalState);
    effect(() => {
      const current = tracker.current();
      const ext = this.externalState();
      // Binding or unbinding swaps the status source: no edge. An unbind
      // also ends the external feedback window, so its text leaves the region.
      if (ext !== boundState) {
        const unbound = boundState !== undefined;
        boundState = ext;
        if (unbound) {
          untracked(() => this.runState().announce(''));
        }
        return;
      }
      if (current === tracker.previous()) {
        return;
      }
      // Only the edge re-runs this body; everything else is read untracked.
      untracked(() => this.handleExternalEdge(current));
    });
  }

  /**
   * What the runner's region speaks for one own settle: `''` without a settle,
   * while an external state is bound, under `autoAnnounce` `false` and for a
   * covered outcome. The host's `CNGX_HOST_INTERACTION_STATE` provider passes it on.
   */
  readonly announcement = (settle?: CngxAsyncSettle): string =>
    settle && !untracked(this.externalState) ? this.resolveAnnouncement(settle.status) : '';

  /** The text an outcome speaks before any cover; `''` under `autoAnnounce` `false`. */
  outcomeText(status: 'success' | 'error'): string {
    return untracked(() => {
      if (this.autoAnnounce() === false) {
        return '';
      }
      const success = status === 'success';
      const explicit = success ? this.succeededAnnouncement() : this.failedAnnouncement();
      if (explicit !== undefined) {
        return explicit;
      }
      const cell = this.cells.get(status);
      const rendered = cell ? resolveSpokenText(cell) : '';
      if (rendered !== '') {
        return rendered;
      }
      if (success) {
        return this.succeededLabel() ?? this.i18n().asyncClickSucceeded;
      }
      return this.failedLabel() ?? this.i18n().asyncClickFailed;
    });
  }

  /** Registers the rendered element of a result cell (called by `CngxActionStatusCell`). */
  registerCell(kind: 'success' | 'error', element: Element): void {
    this.cells.register(kind, element);
  }

  /** Removes a result cell registration while `element` still holds it. */
  unregisterCell(kind: 'success' | 'error', element: Element): void {
    this.cells.unregister(kind, element);
  }

  private resolveAnnouncement(status: 'success' | 'error'): string {
    const text = this.outcomeText(status);
    if (text === '' || untracked(() => this.covers()?.some((c) => c.covers(status)))) {
      return '';
    }
    return text;
  }

  private handleOwnSettle(settle: CngxAsyncSettle): void {
    if (untracked(this.externalState)) {
      return;
    }
    this.outcome.emit({ status: settle.status, error: settle.error });
  }

  private handleExternalEdge(status: AsyncStatus): void {
    if (!this.externalState()) {
      return;
    }
    // Back to idle closes the feedback window: empty the region so no stale
    // outcome stays readable, as the runner does for its own runs.
    if (status === 'idle') {
      this.runState().announce('');
      return;
    }
    if (status !== 'success' && status !== 'error') {
      return;
    }
    this.outcome.emit({ status, error: this.error() });
    // After render, so a projected failed template shows the new error
    // before its text is read. The edge status, not the status at render.
    afterNextRender(
      { write: () => this.runState().announce(this.resolveAnnouncement(status)) },
      { injector: this.injector },
    );
  }
}
