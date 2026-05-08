import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type { CngxStepNode } from './stepper-host.token';

/**
 * Context delivered to consumer-authored `*cngxStepLabel` templates.
 * The organism passes this context object every time it renders a
 * step's label template, so consumer markup like
 * `<ng-template cngxStepLabel let-node="node" let-active="active">`
 * gets typed access to live step state without injecting the
 * presenter or reaching into the host token.
 *
 * `index` is the 1-based position in the flat step-only projection
 * (groups excluded). `active` reflects `presenter.activeStepId`,
 * `busy` mirrors `presenter.intendedStepIndex` matching this step,
 * `disabled` reads `node.disabled()`.
 *
 * @category interactive
 */
export interface CngxStepLabelContext {
  readonly node: CngxStepNode;
  readonly index: number;
  readonly active: boolean;
  readonly busy: boolean;
  readonly disabled: boolean;
}

/**
 * Context delivered to consumer-authored `*cngxStepContent`
 * templates. Mirrors {@link CngxStepLabelContext} — content
 * templates frequently need the same step-state derivation as
 * label templates (e.g. to gate inner controls on `disabled` /
 * `busy` without re-reading the host).
 *
 * @category interactive
 */
export interface CngxStepContentContext {
  readonly node: CngxStepNode;
  readonly index: number;
  readonly active: boolean;
  readonly busy: boolean;
  readonly disabled: boolean;
}

/**
 * Public contract Level-4 organisms (and consumer-authored stepper
 * skins) consume to render the panel body. Decouples the rendering
 * surface from the presenter's full interface — organisms get just
 * what they need to project step labels / content templates and
 * react to active-step changes.
 *
 * @category interactive/stepper
 */
export interface CngxStepPanelHost {
  readonly flatSteps: Signal<readonly CngxStepNode[]>;
  readonly activeStepIndex: Signal<number>;
  readonly activeStepId: Signal<string | null>;
  /** Resolves a step id to its `*cngxStepLabel` template (consumer-supplied). */
  labelTemplateFor(id: string): TemplateRef<CngxStepLabelContext> | null;
  /** Resolves a step id to its `*cngxStepContent` template (consumer-supplied). */
  contentTemplateFor(id: string): TemplateRef<CngxStepContentContext> | null;
}

/**
 * DI token providing the rendering-surface contract to Level-4
 * organism shells (`<cngx-stepper>`, `<cngx-mat-stepper>`) and any
 * consumer-authored skin that drives the presenter directly. The
 * organism provides this via `useExisting`.
 *
 * @category interactive
 */
export const CNGX_STEP_PANEL_HOST = new InjectionToken<CngxStepPanelHost>(
  'CngxStepPanelHost',
);
