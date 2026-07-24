/**
 * @module @cngx/common/chart
 *
 * Declarative, Signal-first chart system. Two-level architecture:
 * composable atoms (`<cngx-chart>` element + `[cngxAxis]` and layer
 * atoms applied to `<svg:g>` hosts) and preset molecules
 * (`<cngx-sparkline>`, `<cngx-donut>`, etc.).
 */
export {
  createLinearScale,
  createTimeScale,
  createBandScale,
  createOrdinalScale,
  type BandScale,
} from './scales';

export { downsampleLTTB } from './buffer';

export { CngxChart } from './chart/chart.component';
export {
  CNGX_CHART_CONTEXT,
  type CngxChartContext,
  type ScaleFn,
  type XScaleInput,
} from './chart/chart-context';

export {
  CngxChartLoading,
  CngxChartEmpty,
  CngxChartError,
  CHART_SMALL_BREAKPOINT_PX,
  type CngxChartErrorContext,
  type CngxChartSlotContext,
} from './chart/template-slots';

export {
  CngxAxis,
  type CngxAxisPosition,
  type CngxAxisType,
} from './axis/axis.component';

export {
  CngxChartLegend,
  type CngxChartLegendItem,
} from './legend/legend.component';

export { CngxLine } from './layers/line.component';
export { CngxArea } from './layers/area.component';
export { CngxBar } from './layers/bar.component';
export type { BarYAccessor } from './layers/bar.component';
export {
  CngxScatter,
  type ScatterXAccessor,
  type ScatterYAccessor,
} from './layers/scatter.component';
export { CngxThreshold } from './layers/threshold.component';
export { CngxBand } from './layers/band.component';

export {
  CNGX_CHART_I18N,
  provideChartI18n,
  type CngxChartI18n,
  type CngxChartSummary,
} from './i18n/chart-i18n';

export { CngxSparkline } from './presets/sparkline.component';
export { CngxMiniBar } from './presets/mini-bar.component';
export { CngxDeviationBar } from './presets/deviation-bar.component';
export { CngxMiniArea } from './presets/mini-area.component';
export { CngxDonut } from './presets/donut.component';
export {
  CngxBullet,
  type CngxBulletRange,
} from './presets/bullet.component';
export {
  CngxStackedBar,
  type CngxStackedSegment,
} from './presets/stacked-bar.component';
export {
  createPathBuilder,
  type PathBuilder,
  type PathBuilderOptions,
  type LineYAccessor,
  type LineXAccessor,
  buildCurvePath,
  type CngxCurve,
  type PathPoint,
} from './path';
