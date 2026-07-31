import { ChangeDetectionStrategy, Component, input, output, type OnInit } from '@angular/core';

/**
 * Reports its own construction once, then projects its content unchanged.
 *
 * The point is measurement, not simulation: wrapping a lazily-rendered
 * region in this fixture is the only way a demo can show that the region
 * was never built, as opposed to built and hidden. A template-called
 * counter method cannot do it - the interpolation re-runs on every change
 * detection pass, so it counts checks rather than constructions.
 *
 * The demo owns the tally, not this component. Module-level state would
 * survive a route change and keep counting up across visits to the same
 * page, so the numbers a reader sees would depend on where they had been
 * before. `mounted` emits from a `queueMicrotask` so the demo's write
 * lands after the current change-detection pass, never during it.
 *
 * **Internal demo fixture only.** Not part of any `@cngx/*` public API.
 *
 * ```html
 * <ng-template cngxTabContent>
 *   <demo-mount-counter key="overview" (mounted)="count($event)">
 *     Overview body
 *   </demo-mount-counter>
 * </ng-template>
 * ```
 */
@Component({
  selector: 'demo-mount-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class DemoMountCounter implements OnInit {
  /** Identifies this region in the demo's tally. */
  readonly key = input.required<string>();

  /** Fires once, with `key`, after the component is constructed. */
  readonly mounted = output<string>();

  ngOnInit(): void {
    const key = this.key();
    queueMicrotask(() => this.mounted.emit(key));
  }
}
