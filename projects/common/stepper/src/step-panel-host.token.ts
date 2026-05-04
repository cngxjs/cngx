import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type { CngxStepNode } from './stepper-host.token';

/**
 * Public contract Level-4 organisms (and consumer-authored stepper
 * skins) consume to render the panel body. Decouples the rendering
 * surface from the presenter's full interface — organisms get just
 * what they need to project step labels / content templates and
 * react to active-step changes.
 *
 * @category interactive
 */
export interface CngxStepPanelHost {
  readonly flatSteps: Signal<readonly CngxStepNode[]>;
  readonly activeStepIndex: Signal<number>;
  readonly activeStepId: Signal<string | null>;
  /** Resolves a step id to its `*cngxStepLabel` template (consumer-supplied). */
  labelTemplateFor(id: string): TemplateRef<unknown> | null;
  /** Resolves a step id to its `*cngxStepContent` template (consumer-supplied). */
  contentTemplateFor(id: string): TemplateRef<unknown> | null;
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
