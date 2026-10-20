import { afterNextRender, type Signal, type TemplateRef } from '@angular/core';
import type { CngxTabIconContext, CngxTabIconLayout } from '@cngx/common/tabs';
import { cngxDevWarn } from '@cngx/utils';

/** @internal */
export interface CngxTabGroupDevCheckOptions {
  readonly iconLayout: Signal<CngxTabIconLayout>;
  readonly iconTemplate: Signal<TemplateRef<CngxTabIconContext> | null>;
}

/**
 * One-shot post-mount checks of `<cngx-tab-group>`. Runs once in an
 * `afterNextRender`, off the reactive graph; must be called in an injection
 * context. The caller guards the call with `ngDevMode` as well, so the
 * production build drops the call and this module with it.
 *
 * @internal
 */
export function installTabGroupDevChecks(opts: CngxTabGroupDevCheckOptions): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  afterNextRender(() => {
    // Icon-only hides the label, so a missing *cngxTabIcon template leaves
    // the tab visually empty.
    if (opts.iconLayout() === 'only' && !opts.iconTemplate()) {
      cngxDevWarn(
        'CNGX3011',
        "[cngx-tab-group] iconLayout='only' but no *cngxTabIcon template " +
          'is provided - tabs render no icon and the label is visually ' +
          "hidden. Provide an <ng-template cngxTabIcon> or use 'start' / 'end' / 'top'.",
      );
    }
  });
}
