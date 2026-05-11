/**
 * Stub `ResizeObserver` for chart specs running in jsdom.
 *
 * The chart system applies `CngxResizeObserver` from
 * `@cngx/common/layout` as a `hostDirective`, which instantiates a
 * real `ResizeObserver` at construction time. jsdom does not ship
 * the global; without the stub, `TestBed.createComponent(...)` of a
 * `<cngx-chart>`-mounting host throws at directive-init.
 *
 * Specs install via `vi.stubGlobal('ResizeObserver',
 * ResizeObserverMock)` in `beforeEach` and clean up via
 * `vi.unstubAllGlobals()` in `afterEach`. The mock is intentionally
 * minimal — chart specs drive `dimensions()` through the
 * `[width]`/`[height]` inputs, never via simulated resize ticks.
 *
 * @internal
 */
/* eslint-disable @typescript-eslint/no-empty-function */
export class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}
/* eslint-enable @typescript-eslint/no-empty-function */
