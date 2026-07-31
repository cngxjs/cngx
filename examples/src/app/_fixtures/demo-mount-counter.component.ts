import { ChangeDetectionStrategy, Component, input, signal, type OnInit } from '@angular/core';

const counts = signal<Record<string, number>>({});

/**
 * How many times each keyed `<demo-mount-counter>` has been constructed,
 * across the lifetime of the page. Demos read this to prove that a piece
 * of content was (or was not) instantiated.
 */
export const demoMountCounts = counts.asReadonly();

/** Clears the tally. Useful when a demo re-creates its subject. */
export function resetDemoMountCounts(): void {
  counts.set({});
}

/**
 * Counts its own construction and projects its content unchanged.
 *
 * The point is measurement, not simulation: wrapping a lazily-rendered
 * region in this fixture is the only way a demo can show that the region
 * was never built, as opposed to built and hidden. A template-called
 * counter method cannot do it - the interpolation re-runs on every change
 * detection pass, so it counts checks rather than constructions.
 *
 * The tally is written from a `queueMicrotask` so the update lands after
 * the current change-detection pass, never during it.
 *
 * **Internal demo fixture only.** Not part of any `@cngx/*` public API.
 *
 * ```html
 * <ng-template cngxTabContent>
 *   <demo-mount-counter key="overview">Overview body</demo-mount-counter>
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
  readonly key = input.required<string>();

  ngOnInit(): void {
    const key = this.key();
    queueMicrotask(() => {
      counts.update((c) => ({ ...c, [key]: (c[key] ?? 0) + 1 }));
    });
  }
}
