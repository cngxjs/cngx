import { InjectionToken, type Provider } from '@angular/core';

import { type CngxChartRendererFactory } from './chart-renderer';
import { createCanvasRenderer } from './canvas-renderer';
import { createSvgRenderer } from './svg-renderer';
import { CNGX_CHART_RENDERER_THRESHOLD } from './renderer-threshold';

/**
 * The default renderer factory: dispatches `'svg'` to
 * {@link createSvgRenderer} and `'canvas'` to {@link createCanvasRenderer}.
 * Inlines the two-backend switch; a consumer wanting a third backend
 * (WebGL, ...) supplies a whole replacement via
 * {@link withChartRendererFactory}.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/renderer-factory.ts
 * @since 0.1.0
 */
export const createDefaultChartRenderer: CngxChartRendererFactory = (mode, deps) =>
  mode === 'svg' ? createSvgRenderer(deps) : createCanvasRenderer(deps);

/**
 * The renderer-factory the chart shell resolves to build its backend.
 * Default {@link createDefaultChartRenderer}; override enterprise-wide via
 * {@link withChartRendererFactory} to add a backend without touching layer
 * atoms.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/renderer-factory.ts
 * @since 0.1.0
 * @relatedTo provideChartRenderer, withChartRendererFactory
 */
export const CNGX_CHART_RENDERER_FACTORY = new InjectionToken<CngxChartRendererFactory>(
  'CngxChartRendererFactory',
  { providedIn: 'root', factory: () => createDefaultChartRenderer },
);

/**
 * A single renderer-config override produced by a `with*` feature and
 * folded by {@link provideChartRenderer}.
 *
 * @category common/chart/renderer
 */
export interface CngxChartRendererFeature {
  readonly providers: Provider[];
}

/**
 * Override the SVG->Canvas auto-switch cutoff (default `500`).
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/renderer-factory.ts
 * @since 0.1.0
 */
export function withChartRendererThreshold(n: number): CngxChartRendererFeature {
  return { providers: [{ provide: CNGX_CHART_RENDERER_THRESHOLD, useValue: n }] };
}

/**
 * Replace the renderer factory - e.g. to force one backend or add a
 * third. Consumers wanting a heuristic swap supply a custom factory here
 * (the heuristic-swap axis ships no dedicated token at v2).
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/renderer-factory.ts
 * @since 0.1.0
 */
export function withChartRendererFactory(fn: CngxChartRendererFactory): CngxChartRendererFeature {
  return { providers: [{ provide: CNGX_CHART_RENDERER_FACTORY, useValue: fn }] };
}

/**
 * Aggregate renderer-config features into a provider set. Place in a
 * bootstrap `providers` array (app-wide) or a component's `viewProviders`
 * (subtree scope).
 *
 * ```typescript
 * provideChartRenderer(withChartRendererThreshold(2000))
 * ```
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/renderer-factory.ts
 * @since 0.1.0
 * @relatedTo withChartRendererThreshold, withChartRendererFactory
 */
export function provideChartRenderer(...features: CngxChartRendererFeature[]): Provider[] {
  return features.flatMap((f) => f.providers);
}
