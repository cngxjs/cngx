import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxResizeObserver } from '@cngx/common/layout';
import { nextUid } from '@cngx/core/utils';
import { CngxAxis, type CngxAxisPosition, type CngxAxisType } from '../axis/axis.component';
import { CngxThreshold } from '../layers/threshold.component';
import { CNGX_CHART_I18N } from '../i18n/chart-i18n';
import { CngxChartDataTable } from './data-table.component';
import {
  createBandScale,
  createLinearScale,
  createTimeScale,
} from '../scales';
import {
  CNGX_CHART_CONTEXT,
  type CngxChartContext,
  type ScaleFn,
  type XScaleInput,
} from './chart-context';
import { computeChartSummary } from './summary';

const NOOP_SCALE: ScaleFn<XScaleInput> = () => 0;
const NOOP_Y_SCALE: ScaleFn<number> = () => 0;

/**
 * Top-level chart container. Hosts an `<svg>` viewBox, applies
 * {@link CngxResizeObserver} via `hostDirectives` to track its rendered
 * size, and provides {@link CNGX_CHART_CONTEXT} so child atoms
 * (`<cngx-axis>`, layer atoms) read the live scales without injecting
 * the concrete `CngxChart` class.
 *
 * Scales are derived from content-child `<cngx-axis>` directives:
 * the X axis (top/bottom position) drives `xScale`, the Y axis
 * (left/right) drives `yScale`. With no axis present, the
 * corresponding scale falls back to a no-op `() => 0` and content
 * children may render off-canvas — consumers must mount at least
 * one axis per direction they actually use.
 *
 * The `[width]` / `[height]` inputs override the resize observer for
 * fixed-dimension presets (inline sparkline at 80×24, etc.).
 */
@Component({
  selector: 'cngx-chart',
  exportAs: 'cngxChart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'img',
    '[attr.aria-label]': 'ariaLabelText()',
    '[attr.aria-describedby]': 'dataTableId()',
  },
  hostDirectives: [CngxResizeObserver],
  providers: [{ provide: CNGX_CHART_CONTEXT, useExisting: CngxChart }],
  imports: [CngxChartDataTable],
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      [attr.width]="dimensions().width || null"
      [attr.height]="dimensions().height || null"
      [attr.preserveAspectRatio]="preserveAspectRatio()"
    >
      <svg:title>{{ ariaLabelText() }}</svg:title>
      <ng-content />
    </svg>
    <cngx-chart-data-table
      [id]="dataTableId()"
      [values]="summaryValues()"
      [hidden]="!tableActive()"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      svg {
        display: block;
      }
    `,
  ],
})
export class CngxChart<T = unknown> implements CngxChartContext<XScaleInput, number> {
  /**
   * Raw data input. Aliased as `data` at the template-binding level so
   * consumer markup stays `<cngx-chart [data]="rows">`. The public,
   * typed read surface is the `data<U>()` method below — layer atoms
   * call `this.ctx.data<T>()` to narrow without per-site casts.
   *
   * @internal — alias for the public `data<U>()` method
   */
  readonly dataInput = input.required<readonly T[]>({ alias: 'data' });
  readonly width = input<number | undefined>(undefined);
  readonly height = input<number | undefined>(undefined);
  readonly preserveAspectRatio = input<string>('xMidYMid meet');
  /**
   * Optional explicit `aria-label` override. When set, supersedes the
   * auto-Summary derived from data + threshold layers. Use when the
   * default summary phrasing does not fit the chart's domain.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /**
   * Numeric accessor used to project generic data to the values fed
   * into the auto-Summary. Default `Number(d)` works for `readonly
   * number[]` data; structured data must override.
   */
  readonly summaryAccessor = input<(d: T, i: number) => number>(
    (d) => Number(d as unknown as number),
  );
  /**
   * Controls when the SR-only data-table view is exposed to assistive
   * technology. `'auto'` (default) shows the table whenever the data
   * has more than one point — a single value is announced via the
   * `aria-label`, no table needed. `'off'` keeps the table hidden
   * regardless. The table element is always present in the DOM —
   * visibility flips through `aria-hidden`, the linked id on
   * `aria-describedby` never disappears.
   */
  readonly accessibleTable = input<'auto' | 'off'>('auto');

  private readonly resize = inject(CngxResizeObserver, { host: true });
  private readonly axes = contentChildren(CngxAxis, { descendants: true });
  private readonly thresholds = contentChildren(CngxThreshold, { descendants: true });
  private readonly i18n = inject(CNGX_CHART_I18N);
  protected readonly dataTableId = computed(
    () => this.dataTableUid,
  );
  private readonly dataTableUid = nextUid('cngx-chart-data-table');

  readonly dataLength = computed(() => this.dataInput().length);

  /**
   * Generic-aware data accessor satisfying {@link CngxChartContext.data}.
   * The single boundary cast lives here; layer atoms call
   * `this.ctx.data<T>()` and receive `readonly T[]` directly with no
   * per-site `as` cast.
   */
  data<U = T>(): readonly U[] {
    return this.dataInput() as unknown as readonly U[];
  }

  readonly dimensions = computed(() => ({
    width: this.width() ?? this.resize.width(),
    height: this.height() ?? this.resize.height(),
  }));

  protected readonly viewBox = computed(() => {
    const { width, height } = this.dimensions();
    return `0 0 ${width || 0} ${height || 0}`;
  });

  readonly xScale = computed<ScaleFn<XScaleInput>>(() => {
    const axes = this.axes();
    const { width } = this.dimensions();
    if (width <= 0) {
      return NOOP_SCALE;
    }
    const xAxis = axes.find((a) => isHorizontalPosition(a.position()));
    if (!xAxis) {
      return NOOP_SCALE;
    }
    return buildScale(xAxis.type(), xAxis.domain() ?? [], [0, width]);
  });

  readonly yScale = computed<ScaleFn<number>>(() => {
    const axes = this.axes();
    const { height } = this.dimensions();
    if (height <= 0) {
      return NOOP_Y_SCALE;
    }
    const yAxis = axes.find((a) => isVerticalPosition(a.position()));
    if (!yAxis) {
      return NOOP_Y_SCALE;
    }
    // SVG Y-axis is flipped — domain[max] maps to range[0] (top), domain[min] to range[height] (bottom).
    return buildScale(yAxis.type(), yAxis.domain() ?? [], [height, 0]) as ScaleFn<number>;
  });

  /**
   * Auto-Summary derived from `data` and `<cngx-threshold>` content
   * children. Drives the host's reactive `aria-label`. Layer atoms do
   * not contribute to the summary on Phase 3 — Phase 5/6 may extend
   * with per-layer hints.
   */
  readonly summary = computed(() => {
    const acc = this.summaryAccessor();
    const data = this.dataInput();
    const values = new Array<number>(data.length);
    for (let i = 0; i < data.length; i++) {
      values[i] = acc(data[i], i);
    }
    const thresholds = this.thresholds().map((t) => t.value());
    return computeChartSummary(values, thresholds);
  });

  /** Reactive `aria-label` text the host announces. */
  protected readonly ariaLabelText = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit !== null && explicit !== undefined && explicit !== '') {
      return explicit;
    }
    return this.i18n.summary(this.summary());
  });

  /** Numeric projection of `data` reused by the data-table view. */
  protected readonly summaryValues = computed<readonly number[]>(() => {
    const acc = this.summaryAccessor();
    const data = this.dataInput();
    const out = new Array<number>(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = acc(data[i], i);
    }
    return out;
  });

  /**
   * Auto-mode predicate. Drives the data-table's `aria-hidden`
   * binding. The id on `aria-describedby` is invariant — it stays on
   * the host whether the table is active or not. Single-value charts
   * speak via the `aria-label` summary; multi-value charts add the
   * table for row-by-row exploration.
   */
  protected readonly tableActive = computed(() => {
    const mode = this.accessibleTable();
    if (mode === 'off') {
      return false;
    }
    return this.dataInput().length > 1;
  });
}

function isHorizontalPosition(p: CngxAxisPosition): boolean {
  return p === 'top' || p === 'bottom';
}

function isVerticalPosition(p: CngxAxisPosition): boolean {
  return p === 'left' || p === 'right';
}

function buildScale(
  type: CngxAxisType,
  domain: readonly unknown[],
  range: readonly [number, number],
): ScaleFn<XScaleInput> {
  if (domain.length < 2) {
    return NOOP_SCALE;
  }
  switch (type) {
    case 'linear': {
      const linear = createLinearScale(
        [Number(domain[0]), Number(domain[domain.length - 1])],
        range,
      );
      return (v: XScaleInput) => linear(typeof v === 'number' ? v : Number(v));
    }
    case 'time': {
      const time = createTimeScale(
        [toMs(domain[0]), toMs(domain[domain.length - 1])],
        range,
      );
      return (v: XScaleInput) => time(v instanceof Date ? v : Number(v));
    }
    case 'band': {
      const band = createBandScale<unknown>(domain, range);
      return (v: XScaleInput) => band(v);
    }
  }
}

function toMs(v: unknown): number {
  if (typeof v === 'number') {
    return v;
  }
  if (v instanceof Date) {
    return v.getTime();
  }
  return Number(v);
}
