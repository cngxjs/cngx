import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import {
  CngxButtonToggle,
  CngxButtonToggleGroup,
} from '@cngx/common/interactive';
import { CngxCard, CngxCardBody, CngxCardFooter, CngxCardHeader } from '@cngx/common/card';
import { injectA11yPreferences } from '@cngx/core';
import { nextUid } from '@cngx/core/utils';

import {
  type CngxA11yPanelAxis,
  type CngxA11yPanelAxisOption,
  injectA11yPanelConfig,
} from './a11y-panel.config';

/**
 * One rendered axis group, resolved once from the config against the
 * matching preference signal. `value` reads the current axis value as a
 * string; `commit` writes a picked option back through the same signal.
 * @internal
 */
interface CngxA11yPanelAxisView {
  readonly axis: CngxA11yPanelAxis;
  readonly label: string;
  readonly labelId: string;
  readonly options: readonly CngxA11yPanelAxisOption[];
  readonly value: Signal<string>;
  readonly commit: (next: string | undefined) => void;
}

/**
 * Batteries-included accessibility preferences card. Renders one labelled
 * `cngx-button-toggle-group` per configured axis (spacing/density, text size,
 * motion, contrast), each split-bound to the app-wide preference signal from
 * `injectA11yPreferences()`, plus a Reset that restores every axis to its
 * library default and announces the change.
 *
 * It ships no trigger, no overlay, and no placement of its own - it is a plain
 * in-flow `CngxCard`. The consumer decides where it appears: inline, inside a
 * `CngxDrawer`, inside a `CngxDialog`, or behind their own popover trigger.
 * This mirrors `CngxListbox` under `CngxSelect` - the panel owns the axis
 * controls, the consumer owns the overlay.
 *
 * Composition over reinvention (Pillar 3): the shell is `CngxCard`, each
 * control is `CngxButtonToggleGroup` (roving tabindex + `model` value), and the
 * Reset announcement rides the shared root `CngxLiveAnnouncer` - no hand-rolled
 * card, control, or live region. The axis ARIA is the toggle group's own
 * reactive `computed()` output (Pillar 2).
 *
 * ```html
 * <cngx-a11y-panel />
 * ```
 *
 * @category ui/a11y
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.component.ts
 * @selector cngx-a11y-panel
 * @since 0.1.0
 * @relatedTo CngxCard, CngxButtonToggleGroup, provideA11yPreferences, provideA11yPanelConfig
 * <example-url>http://localhost:4200/#/ui/a11y/panel/inline</example-url>
 * <example-url>http://localhost:4200/#/ui/a11y/panel/in-drawer</example-url>
 */
@Component({
  selector: 'cngx-a11y-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CngxCard,
    CngxCardHeader,
    CngxCardBody,
    CngxCardFooter,
    CngxButtonToggleGroup,
    CngxButtonToggle,
  ],
  templateUrl: './a11y-panel.component.html',
  styleUrls: ['./a11y-panel.component.css'],
  host: { class: 'cngx-a11y-panel-host' },
})
export class CngxA11yPanel {
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly prefs = injectA11yPreferences();
  protected readonly config = injectA11yPanelConfig();
  private readonly uid = nextUid('cngx-a11y-panel');

  /**
   * The axis groups to render. Resolved once from the config: the axis list is
   * static, so this is a plain field (no equality concern). Each view's `value`
   * is its own one-axis `computed`, so a change to one axis re-renders only its
   * group's bound value, not the whole list.
   */
  protected readonly axisViews: readonly CngxA11yPanelAxisView[] = this.config.axes.map((spec) => {
    // The config guarantees every option value is a valid member of this axis'
    // union, so erasing the invariant signal type to `string` at this single
    // boundary is honest: reads widen safely, writes only ever receive a
    // configured (valid) option value or the axis' own `reset` default.
    const sig = this.prefs[spec.axis] as unknown as WritableSignal<string>;
    return {
      axis: spec.axis,
      label: this.config.labels.axes[spec.axis],
      labelId: `${this.uid}-${spec.axis}`,
      options: spec.options,
      value: computed(() => sig()),
      commit: (next: string | undefined) => {
        // `CngxButtonToggleGroup.value` is `model<T | undefined>`; this group
        // never deselects, so `undefined` is never emitted, but the guard keeps
        // the non-undefined axis setter type-safe under strictTemplates.
        if (next !== undefined) {
          sig.set(next);
        }
      },
    };
  });

  protected reset(): void {
    for (const spec of this.config.axes) {
      (this.prefs[spec.axis] as unknown as WritableSignal<string>).set(spec.reset);
    }
    // Bulk multi-axis change with focus staying on Reset: announce it (Pillar 2)
    // through the shared root live region rather than a private one.
    this.announcer.announce(this.config.labels.resetMessage);
  }
}
