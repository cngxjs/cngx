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
import { CngxAxis, type CngxAxisPosition, type CngxAxisType } from '../axis/axis.component';
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
  host: { role: 'img' },
  hostDirectives: [CngxResizeObserver],
  providers: [{ provide: CNGX_CHART_CONTEXT, useExisting: CngxChart }],
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      [attr.width]="dimensions().width || null"
      [attr.height]="dimensions().height || null"
      [attr.preserveAspectRatio]="preserveAspectRatio()"
    >
      <ng-content />
    </svg>
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
  readonly data = input.required<readonly T[]>();
  readonly width = input<number | undefined>(undefined);
  readonly height = input<number | undefined>(undefined);
  readonly preserveAspectRatio = input<string>('xMidYMid meet');

  private readonly resize = inject(CngxResizeObserver, { host: true });
  private readonly axes = contentChildren(CngxAxis, { descendants: true });

  readonly dataLength = computed(() => this.data().length);

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
