/**
 * @module @cngx/common/chart
 *
 * Declarative, Signal-first chart system. Two-level architecture:
 * composable atoms (`<cngx-chart>`, `<cngx-axis>`, layer atoms) and
 * preset molecules (`<cngx-sparkline>`, `<cngx-donut>`, etc.).
 */
export {
  createLinearScale,
  createTimeScale,
  createBandScale,
  createOrdinalScale,
  type BandScale,
} from './src/scales';

export { CngxChart } from './src/chart/chart.component';
export {
  CNGX_CHART_CONTEXT,
  type CngxChartContext,
  type ScaleFn,
  type XScaleInput,
} from './src/chart/chart-context';

export {
  CngxAxis,
  type CngxAxisPosition,
  type CngxAxisType,
} from './src/axis/axis.component';

export { CngxLine } from './src/layers/line.component';
export { CngxArea } from './src/layers/area.component';
export { CngxBar } from './src/layers/bar.component';
export type { BarYAccessor } from './src/layers/bar.component';
export {
  CngxScatter,
  type ScatterXAccessor,
  type ScatterYAccessor,
} from './src/layers/scatter.component';
export { CngxThreshold } from './src/layers/threshold.component';
export { CngxBand } from './src/layers/band.component';

export {
  CNGX_CHART_I18N,
  provideChartI18n,
  type CngxChartI18n,
  type CngxChartSummary,
} from './src/i18n/chart-i18n';

export { CngxSparkline } from './src/presets/sparkline.component';
export { CngxMiniBar } from './src/presets/mini-bar.component';
export { CngxDeviationBar } from './src/presets/deviation-bar.component';
export { CngxMiniArea } from './src/presets/mini-area.component';
export {
  createPathBuilder,
  type PathBuilder,
  type PathBuilderOptions,
  type LineYAccessor,
  type LineXAccessor,
  buildCurvePath,
  type CngxCurve,
  type PathPoint,
} from './src/path';
