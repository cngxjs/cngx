import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  isDevMode,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CngxResizeObserver } from '@cngx/common/layout';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import { nextUid, type CngxAsyncState } from '@cngx/core/utils';
import { CngxAxis, type CngxAxisPosition, type CngxAxisType } from '../axis/axis.component';
import { CngxThreshold } from '../layers/threshold.component';
import { CNGX_CHART_I18N } from '../i18n/chart-i18n';
import { CngxChartDataTable } from './data-table.component';
import {
  CngxChartEmpty,
  CngxChartError,
  CngxChartLoading,
} from './template-slots';
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
import { dimensionsEqual, sameNumberArr } from './equal-helpers';

const NOOP_SCALE: ScaleFn<XScaleInput> = () => 0;
const NOOP_Y_SCALE: ScaleFn<number> = () => 0;

/**
 * Stable reference for the default `summaryAccessor`. Exposed so the
 * dev-mode warning can detect "consumer omitted [summaryAccessor] on
 * non-numeric data" without false positives when the consumer happens
 * to pass an identical-looking arrow.
 */
const DEFAULT_SUMMARY_ACCESSOR = <T>(d: T): number => Number(d as unknown);

/**
 * Top-level chart container. Hosts an `<svg>` viewBox, applies
 * {@link CngxResizeObserver} via `hostDirectives` to track its rendered
 * size, and provides {@link CNGX_CHART_CONTEXT} so child atoms
 * (`[cngxAxis]`, layer atoms) read the live scales without injecting
 * the concrete `CngxChart` class.
 *
 * Layer atoms and `[cngxAxis]` are attribute directives: consumers
 * mount them on `<svg:g>` hosts inside the chart so the SVG namespace
 * boundary stays clean. An element selector (`<cngx-axis>` etc.)
 * inside `<svg>` would create an XHTML-namespaced custom element
 * whose SVG-namespaced children would not lay out, leaving the chart
 * blank in real browsers (jsdom is permissive and would mask this).
 *
 * Scales are derived from content-child `[cngxAxis]` directives:
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
    '[attr.aria-describedby]': 'dataTableId',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
  hostDirectives: [CngxResizeObserver],
  providers: [{ provide: CNGX_CHART_CONTEXT, useExisting: CngxChart }],
  imports: [CngxChartDataTable, NgTemplateOutlet],
  template: `
    @switch (activeView()) {
      @case ('skeleton') {
        @if (loadingTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl" />
        } @else {
          <div
            class="cngx-chart__loading"
            [style.width.px]="dimensions().width || null"
            [style.height.px]="dimensions().height || null"
            [attr.aria-hidden]="true"
          >
            <div class="cngx-chart__spinner"></div>
          </div>
        }
      }
      @case ('empty') {
        @if (emptyTpl(); as tpl) {
          <div
            class="cngx-chart__fallback-frame"
            [style.width.px]="dimensions().width || null"
            [style.height.px]="dimensions().height || null"
          >
            <ng-container *ngTemplateOutlet="tpl" />
          </div>
        } @else {
          <div
            class="cngx-chart__fallback"
            [style.width.px]="dimensions().width || null"
            [style.height.px]="dimensions().height || null"
            [attr.aria-hidden]="true"
          >{{ i18n.empty() }}</div>
        }
      }
      @case ('error') {
        @if (errorTpl(); as tpl) {
          <div
            class="cngx-chart__fallback-frame"
            [style.width.px]="dimensions().width || null"
            [style.height.px]="dimensions().height || null"
          >
            <ng-container *ngTemplateOutlet="tpl; context: errorContext()" />
          </div>
        } @else {
          <div
            class="cngx-chart__fallback cngx-chart__fallback--error"
            [style.width.px]="dimensions().width || null"
            [style.height.px]="dimensions().height || null"
            [attr.aria-hidden]="true"
          >{{ i18n.error() }}</div>
        }
      }
      @case ('none') {}
      @default {
        <svg
          [attr.viewBox]="viewBox()"
          [attr.width]="dimensions().width || null"
          [attr.height]="dimensions().height || null"
          [attr.preserveAspectRatio]="preserveAspectRatio()"
        >
          <svg:title>{{ ariaLabelText() }}</svg:title>
          <ng-content />
        </svg>
      }
    }
    <cngx-chart-data-table
      [id]="dataTableId"
      [values]="summaryValues()"
      [hidden]="!tableActive() || activeView() !== 'content'"
    />
  `,
  styleUrls: ['../chart-tokens.css'],
  styles: [
    `
      cngx-chart {
        display: inline-block;
      }
      cngx-chart > svg {
        display: block;
      }
      cngx-chart > .cngx-chart__fallback-frame {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      cngx-chart > .cngx-chart__loading {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      cngx-chart .cngx-chart__spinner {
        width: var(--cngx-chart-spinner-size, 32px);
        height: var(--cngx-chart-spinner-size, 32px);
        border: var(--cngx-chart-spinner-thickness, 3px) solid
          var(--cngx-chart-spinner-track, rgb(0 0 0 / 0.08));
        border-top-color: var(--cngx-chart-spinner-color, var(--cngx-chart-primary, currentColor));
        border-radius: 50%;
        animation: cngx-chart-spin 800ms linear infinite;
      }
      cngx-chart > .cngx-chart__fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: var(--cngx-chart-fallback-min-height, 48px);
        font-size: var(--cngx-chart-fallback-font-size, 0.875rem);
        color: var(--cngx-chart-text-color, currentColor);
        opacity: var(--cngx-chart-fallback-opacity, 0.7);
        padding: var(--cngx-chart-fallback-padding, 1rem);
        text-align: center;
      }
      cngx-chart > .cngx-chart__fallback--error {
        color: var(--cngx-chart-danger, currentColor);
        opacity: 1;
      }
      @keyframes cngx-chart-spin {
        to { transform: rotate(360deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        cngx-chart .cngx-chart__spinner {
          animation: none;
        }
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
    DEFAULT_SUMMARY_ACCESSOR,
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
  /**
   * Optional async-state envelope. When bound, the chart routes through
   * the same skeleton / empty / error / content state machine that the
   * preset molecules use. Without this input, the chart always renders
   * its content (Pillar-2 always-in-DOM data-table id stays stable, but
   * the SR data-table only flips out of `aria-hidden` when the active
   * view is `'content'`).
   *
   * Accepts the standard `CngxAsyncState<T>` shape (any producer:
   * `createManualState`, `createAsyncState`, `injectAsyncState`,
   * `fromHttpResource`, `tap*` pipeline output). The chart provides
   * `CNGX_STATEFUL` for downstream bridge directives — composing
   * `<cngx-toast-on />` etc. inside the chart works automatically.
   */
  readonly state = input<CngxAsyncState<readonly T[]> | undefined>(undefined);

  private readonly resize = inject(CngxResizeObserver, { host: true });
  private readonly axes = contentChildren(CngxAxis, { descendants: true });
  private readonly thresholds = contentChildren(CngxThreshold, { descendants: true });
  protected readonly i18n = inject(CNGX_CHART_I18N);
  protected readonly dataTableId = nextUid('cngx-chart-data-table');

  private readonly loadingSlot = contentChild(CngxChartLoading);
  private readonly emptySlot = contentChild(CngxChartEmpty);
  private readonly errorSlot = contentChild(CngxChartError);

  /** Resolved consumer-projected loading template (null when no slot bound). */
  protected readonly loadingTpl = computed(() => this.loadingSlot()?.templateRef ?? null);
  /** Resolved consumer-projected empty template (null when no slot bound). */
  protected readonly emptyTpl = computed(() => this.emptySlot()?.templateRef ?? null);
  /** Resolved consumer-projected error template (null when no slot bound). */
  protected readonly errorTpl = computed(() => this.errorSlot()?.templateRef ?? null);

  /**
   * Context object for the `*cngxChartError` template. Shape:
   * `{ $implicit: error, error }` — gives consumers the live error
   * value via either positional `let-err` or named `let-err="error"`.
   */
  protected readonly errorContext = computed(() => {
    const err = this.state()?.error?.() ?? null;
    return { $implicit: err, error: err };
  });

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        if (this.summaryAccessor() !== DEFAULT_SUMMARY_ACCESSOR) {
          return;
        }
        const data = this.dataInput();
        if (data.length === 0) {
          return;
        }
        const projected = Number(data[0] as unknown);
        if (Number.isFinite(projected)) {
          return;
        }
        console.warn(
          'CngxChart: data is non-numeric and no [summaryAccessor] is bound. ' +
          'Auto-Summary and the SR data-table will silently fall back to NaN. ' +
          'Bind [summaryAccessor]="(d) => d.yourField" or pass a numeric data array.',
        );
      });
    }
  }

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

  readonly dimensions = computed(
    () => ({
      width: this.width() ?? this.resize.width(),
      height: this.height() ?? this.resize.height(),
    }),
    { equal: dimensionsEqual },
  );

  protected readonly viewBox = computed(() => {
    const { width, height } = this.dimensions();
    return `0 0 ${width || 0} ${height || 0}`;
  });

  private readonly xScaleCache = createScaleLru();
  private readonly yScaleCache = createScaleLru();

  readonly xScale = computed<ScaleFn<XScaleInput>>(
    () => {
      const axes = this.axes();
      const { width } = this.dimensions();
      if (width <= 0) {
        return NOOP_SCALE;
      }
      const xAxis = axes.find((a) => isHorizontalPosition(a.position()));
      if (!xAxis) {
        return NOOP_SCALE;
      }
      return this.xScaleCache.get(xAxis.type(), xAxis.domain() ?? [], [0, width]);
    },
    { equal: (a, b) => a === b },
  );

  readonly yScale = computed<ScaleFn<number>>(
    () => {
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
      return this.yScaleCache.get(yAxis.type(), yAxis.domain() ?? [], [height, 0]) as ScaleFn<number>;
    },
    { equal: (a, b) => a === b },
  );

  /**
   * Auto-Summary derived from `data` and `<cngx-threshold>` content
   * children. Drives the host's reactive `aria-label`. Layer atoms do
   * not contribute to the summary on Phase 3 — Phase 5/6 may extend
   * with per-layer hints.
   */
  readonly summary = computed(
    () => {
      const acc = this.summaryAccessor();
      const data = this.dataInput();
      const values = new Array<number>(data.length);
      for (let i = 0; i < data.length; i++) {
        values[i] = acc(data[i], i);
      }
      const thresholds = this.thresholds().map((t) => t.value());
      return computeChartSummary(values, thresholds);
    },
    {
      equal: (a, b) =>
        a.trend === b.trend &&
        a.min === b.min &&
        a.max === b.max &&
        a.current === b.current &&
        sameNumberArr(a.thresholds, b.thresholds),
    },
  );

  /**
   * Active view for the optional state-machine envelope. Returns
   * `'content'` when no `[state]` is bound, falling through to the
   * default branch that renders the SVG content. Otherwise routes
   * through {@link resolveAsyncView} using the same status / firstLoad
   * / empty triple every preset and async-aware atom in the library
   * uses.
   */
  protected readonly activeView = computed<AsyncView>(() => {
    const s = this.state();
    if (!s) {
      return 'content';
    }
    return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
  });

  /** True when the chart is currently rendering its skeleton view. */
  protected readonly busy = computed(() => this.activeView() === 'skeleton');

  /**
   * Reactive `aria-label` text the host announces. Skeleton / empty /
   * error states announce localised i18n strings; the auto-Summary
   * runs only in the content branch so AT does not read stale data
   * during a refetch.
   */
  protected readonly ariaLabelText = computed(() => {
    const view = this.activeView();
    if (view === 'skeleton') {
      return this.i18n.loading();
    }
    if (view === 'empty') {
      return this.i18n.empty();
    }
    if (view === 'error') {
      return this.i18n.error();
    }
    const explicit = this.ariaLabel();
    if (explicit !== null && explicit !== undefined && explicit !== '') {
      return explicit;
    }
    return this.i18n.summary(this.summary());
  });

  /** Numeric projection of `data` reused by the data-table view. */
  protected readonly summaryValues = computed<readonly number[]>(
    () => {
      const acc = this.summaryAccessor();
      const data = this.dataInput();
      const out = new Array<number>(data.length);
      for (let i = 0; i < data.length; i++) {
        out[i] = acc(data[i], i);
      }
      return out;
    },
    { equal: sameNumberArr },
  );

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

/**
 * Per-chart single-slot LRU on `buildScale`. Caches the
 * `(type, domain-shape, range)` tuple so `xScale`/`yScale` re-emissions
 * with the same axis configuration return the same `ScaleFn` closure
 * instance. Combined with the `equal: (a, b) => a === b` on the
 * `xScale`/`yScale` computeds, an unchanged dimension/axis re-evaluation
 * short-circuits at the cascade guard.
 *
 * Time-typed `Date` endpoints are keyed via `+date` (ms) to handle the
 * common case where a parent re-creates the domain array each tick with
 * `new Date(...)` — raw `Date` references would never `Object.is`-match
 * across ticks.
 */
interface ScaleLru {
  get(
    type: CngxAxisType,
    domain: readonly unknown[],
    range: readonly [number, number],
  ): ScaleFn<XScaleInput>;
}

function createScaleLru(): ScaleLru {
  let lastType: CngxAxisType | null = null;
  let lastDomainLen = -1;
  let lastDomainStart: number | string | null = null;
  let lastDomainEnd: number | string | null = null;
  let lastDomainAllKeys: string | null = null;
  let lastRange0 = NaN;
  let lastRange1 = NaN;
  let lastFn: ScaleFn<XScaleInput> = NOOP_SCALE;

  return {
    get(type, domain, range) {
      const keyStart = endpointKey(domain[0]);
      const keyEnd = endpointKey(domain[domain.length - 1]);
      // For band scales, the cache must invalidate on any reorder/swap of
      // values; cheap stringification of all keys is sufficient because
      // band domains are typically short.
      const allKeys = type === 'band' ? domain.map(endpointKey).join('|') : null;
      if (
        type === lastType &&
        domain.length === lastDomainLen &&
        keyStart === lastDomainStart &&
        keyEnd === lastDomainEnd &&
        allKeys === lastDomainAllKeys &&
        range[0] === lastRange0 &&
        range[1] === lastRange1
      ) {
        return lastFn;
      }
      lastType = type;
      lastDomainLen = domain.length;
      lastDomainStart = keyStart;
      lastDomainEnd = keyEnd;
      lastDomainAllKeys = allKeys;
      lastRange0 = range[0];
      lastRange1 = range[1];
      lastFn = buildScale(type, domain, range);
      return lastFn;
    },
  };
}

function endpointKey(v: unknown): number | string {
  if (v instanceof Date) {
    return v.getTime();
  }
  if (typeof v === 'number' || typeof v === 'string') {
    return v;
  }
  return String(v);
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
