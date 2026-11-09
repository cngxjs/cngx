import { InjectionToken, type OutputRef, type Signal } from '@angular/core';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

import type { CngxAsyncSettle } from '../async-click/async-click.directive';
import type { CngxFailed, CngxPending, CngxSucceeded } from '../async-click/async-status-templates';

/**
 * One label cell of an action host: the idle content, or the pending,
 * succeeded or failed label.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status.token.ts
 * @since 0.1.0
 * @relatedTo CngxActionStatusCell, CngxActionStatus
 */
export type CngxActionStatusCellKind = 'idle' | 'pending' | 'success' | 'error';

/**
 * One outcome of an action host: an own settle of the co-hosted run, or a
 * `success` / `error` edge of a bound external state.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status.token.ts
 * @since 0.1.0
 * @relatedTo CngxActionStatus, CngxActionStatusBrain
 */
export interface CngxActionOutcome {
  /** The outcome. */
  readonly status: 'success' | 'error';
  /** The rejection value of an `'error'` outcome; `undefined` on success. */
  readonly error: unknown;
}

/**
 * Which status cells an action host renders: a label or a template for the state.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status.token.ts
 * @since 0.1.0
 * @relatedTo CngxActionStatus
 */
export interface CngxActionStatusCells {
  /** A pending label or `cngxPending` template exists. */
  readonly pending: boolean;
  /** A succeeded label or `cngxSucceeded` template exists. */
  readonly success: boolean;
  /** A failed label or `cngxFailed` template exists. */
  readonly error: boolean;
}

/**
 * The status layer of an action host: effective status, label cells, the
 * settle announcement and the external-state mode. `CngxActionStatusBrain`
 * provides it; a host template, a toast or a close directive reads it
 * through {@link CNGX_ACTION_STATUS}, never through the brain class.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_ACTION_STATUS, CngxActionStatusBrain, CngxActionStatusCell
 */
export interface CngxActionStatus {
  /** Effective status: the bound external state, else the co-hosted run. Immediate, not gated. */
  readonly status: Signal<AsyncStatus>;
  /** Effective error: the bound external state's, else the co-hosted run's. */
  readonly error: Signal<unknown>;
  /** Full `CngxAsyncState` view of the effective lifecycle. */
  readonly state: CngxAsyncState<unknown>;
  /** `true` while a bound external state is pending; the runner does not know about it. */
  readonly externalBusy: Signal<boolean>;
  /** The bound `autoAnnounce` value, `undefined` while unbound. */
  readonly autoAnnounce: Signal<boolean | undefined>;
  /** Which status cells render. */
  readonly hasCell: Signal<CngxActionStatusCells>;
  /** The visible, named cell, gated on the busy visual. */
  readonly activeCell: Signal<CngxActionStatusCellKind>;
  /** Projected `cngxPending` template, if any. */
  readonly pendingTemplate: Signal<CngxPending | undefined>;
  /** Projected `cngxSucceeded` template, if any. */
  readonly succeededTemplate: Signal<CngxSucceeded | undefined>;
  /** Projected `cngxFailed` template, if any. */
  readonly failedTemplate: Signal<CngxFailed | undefined>;
  /** Fallback text of the pending cell. */
  readonly pendingLabel: Signal<string | undefined>;
  /** Fallback text of the succeeded cell. */
  readonly succeededLabel: Signal<string | undefined>;
  /** Fallback text of the failed cell. */
  readonly failedLabel: Signal<string | undefined>;
  /** Emits once per own settle and once per external `success` / `error` edge. */
  readonly outcome: OutputRef<CngxActionOutcome>;
  /**
   * What the co-hosted runner's live region speaks for one own settle (the
   * `CngxHostInteractionState.announcement` signature). `''` without a
   * settle, while an external state is bound, under `autoAnnounce` `false`
   * and for an outcome a {@link CNGX_ANNOUNCEMENT_COVER} covers.
   */
  announcement(settle?: CngxAsyncSettle): string;
  /**
   * The text an outcome speaks before any cover: the explicit announcement,
   * the rendered result cell, the label, the i18n copy. `''` under
   * `autoAnnounce` `false`. Read it once after render, for a region the
   * caller owns.
   */
  outcomeText(status: 'success' | 'error'): string;
  /** Registers the rendered element of a result cell. */
  registerCell(kind: 'success' | 'error', element: Element): void;
  /** Removes a result cell registration while `element` still holds it. */
  unregisterCell(kind: 'success' | 'error', element: Element): void;
}

/**
 * DI token `CngxActionStatusBrain` provides (`useExisting`) on its host
 * element. Read by the host component's providers and template, by
 * `CngxActionStatusCell` in the host view, and by co-hosted directives
 * that react to outcomes (a toast, a close-on-success).
 *
 * No `providedIn`, no default: an element without the brain has no status layer.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status.token.ts
 * @since 0.1.0
 * @relatedTo CngxActionStatusBrain, CngxActionStatusCell
 */
export const CNGX_ACTION_STATUS = new InjectionToken<CngxActionStatus>('CngxActionStatus');

/**
 * A co-hosted unit that voices an outcome itself (a toast, an announcement
 * outside a closing panel), so the runner's region next to the host stays
 * empty for it and the outcome is heard once.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_ANNOUNCEMENT_COVER, CngxActionStatusBrain
 */
export interface CngxAnnouncementCover {
  /** `true` when this unit voices an outcome of `status` itself. Read once per outcome, after render. */
  covers(status: 'success' | 'error'): boolean;
}

/**
 * DI token a co-hosted unit provides on the action host element with its
 * {@link CngxAnnouncementCover}. `CngxActionStatusBrain` reads it lazily
 * with `{ self: true, optional: true }`.
 *
 * No `providedIn`, no default: without a cover every outcome is spoken in the region.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status.token.ts
 * @since 0.1.0
 * @relatedTo CngxActionStatusBrain
 */
export const CNGX_ANNOUNCEMENT_COVER = new InjectionToken<CngxAnnouncementCover>(
  'CngxAnnouncementCover',
);
