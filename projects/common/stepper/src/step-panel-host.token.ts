import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type { CngxStepNode } from './stepper-host.token';

/**
 * Context delivered to `*cngxStepLabel` templates. Gives typed access
 * to live step state without reaching into the host token.
 *
 * `index` is 1-based in the step-only flat projection (groups excluded).
 * `active` reflects `presenter.activeStepId`; `busy` mirrors
 * `presenter.intendedStepIndex` matching this step; `disabled` reads
 * `node.disabled()`.
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
 * Context delivered to `*cngxStepContent` templates. Mirrors
 * {@link CngxStepLabelContext} — content templates need the same
 * derivations to gate inner controls on `disabled` / `busy`.
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
 * Contract Level-4 organisms (and consumer-authored stepper skins)
 * consume to render the panel body. Narrower than the presenter's
 * full interface — just enough to project label / content templates
 * and react to active-step changes.
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
 * DI token providing the rendering-surface contract to organism shells
 * (`<cngx-stepper>`, `<cngx-mat-stepper>`) and consumer-authored skins.
 *
 * @category interactive
 */
export const CNGX_STEP_PANEL_HOST = new InjectionToken<CngxStepPanelHost>(
  'CngxStepPanelHost',
);
