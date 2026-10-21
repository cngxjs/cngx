import { afterNextRender, type Signal, type TemplateRef } from '@angular/core';
import type { CngxTabHandle, CngxTabIconContext, CngxTabIconLayout } from '@cngx/common/tabs';
import { cngxDevWarn } from '@cngx/utils';

/** @internal */
export interface CngxTabGroupDevCheckOptions {
  readonly iconLayout: Signal<CngxTabIconLayout>;
  readonly iconTemplate: Signal<TemplateRef<CngxTabIconContext> | null>;
  readonly tabs: Signal<readonly CngxTabHandle[]>;
  readonly hasLabelTemplate: (id: string) => boolean;
  readonly host: HTMLElement;
}

/**
 * One-shot post-mount checks of `<cngx-tab-group>`: CNGX3011 (icon-only
 * layout without an icon template) and CNGX3025 (a tab without a `[label]`
 * string). Runs once in an `afterNextRender`, off the reactive graph; must be
 * called in an injection context. The caller guards the call with `ngDevMode`
 * as well, so the production build drops the call and this module with it.
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
        opts.host,
      );
    }
    const unlabelled = unlabelledTabPositions(opts);
    if (unlabelled.length > 0) {
      cngxDevWarn(
        'CNGX3025',
        `[cngx-tab-group] tab(s) without a [label] string at position ${unlabelled.join(', ')}. ` +
          'Announcements, the close button and the overflow list call such a tab "Tab N". ' +
          'Bind [label] on every cngxTab, also when a *cngxTabLabel template renders it.',
        opts.host,
      );
    }
  });
}

// The announcements, the close button and the overflow row need a label
// string; a *cngxTabLabel template only names the tab button.
function unlabelledTabPositions(opts: CngxTabGroupDevCheckOptions): string[] {
  return opts.tabs().flatMap((tab, i) => {
    if (tab.label()) {
      return [];
    }
    const source = opts.hasLabelTemplate(tab.id)
      ? 'named by its *cngxTabLabel template'
      : 'no name source';
    return [`${i + 1} (${source})`];
  });
}
