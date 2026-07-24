import { InjectionToken } from '@angular/core';

/**
 * Datapoint count above which `<cngx-chart>` auto-switches from SVG to
 * Canvas rendering. Default `500` - matches the v1 SVG perf-budget cap
 * documented in `chart-area-accepted-debt.md` §1, so the cutoff and the
 * historical cap stay cross-referenced.
 *
 * Override enterprise-wide via {@link withChartRendererThreshold} (or a
 * bare provider) to tune the SVG/Canvas crossover for a given app's
 * hardware profile.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/renderer-threshold.ts
 * @since 0.1.0
 * @relatedTo provideChartRenderer, withChartRendererThreshold
 */
export const CNGX_CHART_RENDERER_THRESHOLD = new InjectionToken<number>(
  'CngxChartRendererThreshold',
  { providedIn: 'root', factory: () => 500 },
);
