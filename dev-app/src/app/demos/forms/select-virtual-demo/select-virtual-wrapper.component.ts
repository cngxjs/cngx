import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';

import {
  CNGX_PANEL_RENDERER_FACTORY,
  CngxSelect,
  createRecyclerPanelRendererFactory,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';
import { injectRecycler } from '@cngx/common/data';

// Monotonic counter so every wrapper instance on the page gets a
// unique host class — necessary because the recycler's
// `scrollElement: string` resolves via `document.querySelector`. A
// naïve `.cngx-select__panel` selector would return the first match
// in the whole document; scoping to `.<uniqueHostClass>
// .cngx-select__panel` isolates each wrapper's recycler to its own
// panel.
let wrapperInstanceCounter = 0;

/**
 * Demo wrapper that wires a {@link CngxRecycler} into `<cngx-select>`
 * via `CNGX_PANEL_RENDERER_FACTORY`. The recycler watches this
 * wrapper's own `.cngx-select__panel` — the shared
 * `select-base.css` already provides the scroll container
 * (`max-height: 16rem; overflow-y: auto`).
 *
 * Production consumers copy the shape below. The only "demo-ism" is
 * the multi-instance scoping trick (`unique-host-class`) — a single-
 * instance consumer can simplify to `scrollElement:
 * '.cngx-select__panel'`.
 */
@Component({
  selector: 'cngx-demo-virtual-select',
  standalone: true,
  imports: [CngxSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Unique host class per wrapper instance — rebuilt once per
  // construction; the binding below references `this.hostClass`.
  host: { '[class]': 'hostClass' },
  viewProviders: [
    {
      provide: CNGX_PANEL_RENDERER_FACTORY,
      useFactory: (): ReturnType<typeof createRecyclerPanelRendererFactory> =>
        createRecyclerPanelRendererFactory(
          inject(forwardRef(() => SelectVirtualDemoWrapper)).recycler,
        ),
    },
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

  /** Unique per-instance host class; scopes the recycler's selector. */
  protected readonly hostClass = `cngx-virt-wrapper-${++wrapperInstanceCounter}`;

  /**
   * The recycler watches the `.cngx-select__panel` scoped to this
   * wrapper's unique host class. Scroll-observer resolves string
   * selectors lazily via `afterNextRender` retry, so the popover
   * element (always in the DOM because native `popover="manual"`)
   * is found on the first render after the cngx-select template
   * paints.
   *
   * `totalCount` reads the input signal so filtering or resetting
   * `options` propagates without any manual resize call.
   */
  readonly recycler = injectRecycler({
    scrollElement: `.${this.hostClass} .cngx-select__panel`,
    totalCount: (): number => this.options().length,
    estimateSize: 32,
    overscan: 6,
  });
}
