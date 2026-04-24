import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import {
  CngxSelect,
  provideSelectConfigAt,
  withVirtualization,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';

/**
 * Thin demo wrapper that opts the wrapped `<cngx-select>` into the
 * built-in recycler virtualisation via
 * `provideSelectConfigAt(withVirtualization(...))`. Each instance of
 * this wrapper becomes its own provider scope, so multiple instances
 * on the same page don't collide — the internal recycler resolves
 * its scroll container via the select's own `popoverRef` (no CSS-
 * selector scoping needed).
 *
 * Production consumers who want virtualisation app-wide provide the
 * same feature once at bootstrap:
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideSelectConfig(withVirtualization({ estimateSize: 36 }))],
 * });
 * ```
 *
 * Per-feature opt-in stays identical — just `provideSelectConfigAt`
 * in the feature component's `viewProviders`.
 */
@Component({
  selector: 'cngx-demo-virtual-select',
  standalone: true,
  imports: [CngxSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    ...provideSelectConfigAt(
      withVirtualization({ estimateSize: 32, overscan: 6 }),
    ),
  ],
  template: `
    <cngx-select
      [label]="label()"
      [options]="options()"
      [(value)]="value"
      [placeholder]="placeholder()"
    />
  `,
})
export class SelectVirtualDemoWrapper {
  readonly label = input<string>('Large dataset');
  readonly placeholder = input<string>('Wähle einen Eintrag…');
  readonly options = input<CngxSelectOptionDef<string>[]>([]);
  readonly value = model<string | undefined>(undefined);
}
