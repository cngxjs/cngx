/**
 * Centralised type façade and selector constants for every Angular
 * Material internal surface cngx Material-bridge code couples to.
 * Replaces the per-call-site `as unknown as { _foo? }` casts and
 * the scattered `'.mat-mdc-tab*'` string literals with a single
 * grep target.
 *
 * Every leading-underscore field cngx reaches into and every
 * Material-internal CSS selector cngx queries against has its
 * declaration here. A Material-version upgrade audit only needs to
 * grep this file. The grep value is the consumer-facing benefit, so
 * this namespace is part of the published surface of
 * `@cngx/ui/mat-tabs` (re-exported from the package barrel) rather
 * than a private implementation detail.
 *
 * The grouping uses a TypeScript `namespace` so a single
 * `MaterialPrivateSurfaces.<member>` access path covers both the
 * type façades and the selector constants. The TS namespace also
 * lets cross-package consumers (`@cngx/ui/mat-stepper`) read the
 * grouped name through ESLint's `@typescript-eslint` type resolver
 * — a flat `export * as` re-export from `public-api.ts` does not
 * resolve nested members through the path-alias.
 *
 * @category ui/mat-tabs
 */

import type { TemplateRef, WritableSignal } from '@angular/core';
import type { MatStepperIconContext } from '@angular/material/stepper';
import type { Subject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MaterialPrivateSurfaces {
  /**
   * Subset of Material's `MatTab` carrying the `_stateChanges`
   * Subject. The leading underscore signals
   * Material-internal-by-convention, even though the field is
   * `readonly` on the public class surface. The Subject emits
   * `void` whenever a `MatTab` input (`textLabel`, `disabled`, …)
   * changes; cngx bridges it into the Signal graph via
   * `toSignal(matTab._stateChanges)` because Material exposes no
   * public reactive surface for input changes.
   */
  export interface StateChangeSource {
    readonly _stateChanges: Subject<void>;
  }

  /**
   * Subset of Material's `MatStepper` carrying the `_iconOverrides`
   * map. `<cngx-mat-stepper>` patches this map inside
   * `afterNextRender` to forward consumer-projected
   * `<ng-template matStepperIcon>` declarations through the wrapper
   * into Material's per-header indicator bindings (the only
   * deterministic forwarding path — `<ng-content>` projection
   * inside `<mat-stepper>` does not reach
   * `@ContentChildren(MatStepperIcon)` due to content-init
   * lifecycle ordering).
   */
  export interface IconOverrideHost {
    _iconOverrides?: Record<string, TemplateRef<MatStepperIconContext>>;
  }

  /**
   * Subset of CDK's `CdkStep` carrying the `_completedOverride`
   * `WritableSignal`. `MatStep.completed`'s getter reads this
   * signal, so cngx's per-step `state` computed transitively tracks
   * it through the getter and re-fires whenever Material flips
   * completion. Documented limitation: `hasError` writes that are
   * not paired with a `completed` change do not retrigger the
   * computed — sharper note lives on `createMatStepHandle`'s JSDoc.
   */
  export interface CompletedOverrideSource {
    readonly _completedOverride: WritableSignal<boolean | null>;
  }

  /**
   * `.mat-mdc-tab` — the class Material applies to the rendered
   * tab `<button>` elements inside `MatTabHeader`. cngx
   * index-correlates `presenter.tabs()` registration order against
   * `host.querySelectorAll('.mat-mdc-tab')` because `MatTab` is a
   * portal — the rendered buttons live inside `MatTabHeader`'s
   * template, not on the `<mat-tab>` declaration site, and Material
   * exposes no public per-tab element accessor.
   */
  export const MAT_MDC_TAB_SELECTOR = '.mat-mdc-tab';

  /**
   * `.mat-mdc-tab-header` — the strip element rendered by
   * `MatTabHeader`. `[cngxMatTabs]` walks
   * `host.querySelector('.mat-mdc-tab-header')` to locate the mount
   * anchor for the cngx overflow molecule (so the More button pins
   * inside Material's strip rather than as a sibling of
   * `<mat-tab-group>`).
   */
  export const MAT_MDC_TAB_HEADER_SELECTOR = '.mat-mdc-tab-header';

  /**
   * `.mat-mdc-tab-label-container` — Material's IO-friendly scroll
   * viewport ancestor of the rendered tab buttons. The Material-
   * twin overflow adapter walks `host → header → any tab → closest
   * label-container` to attach the molecule's
   * `IntersectionObserver` against the same element Material
   * itself scrolls.
   */
  export const MAT_MDC_TAB_LABEL_CONTAINER_SELECTOR =
    '.mat-mdc-tab-label-container';
}
