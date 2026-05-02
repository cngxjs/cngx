import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CNGX_CHART_CONTEXT, type CngxChartContext } from '../chart/chart-context';

export type BarYAccessor<T> = string | ((d: T, i: number) => number);

interface BarRect {
  readonly key: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const FALLBACK_BASELINE = 0;

/**
 * Bar layer atom. Renders one `<rect>` per datapoint. Bar width comes
 * from `dimensions.width / dataLength` (one slot per datapoint) shrunk
 * by the optional `[gap]` ratio. Bar height runs from `yScale(value)`
 * down to `yScale(baseline)` (default 0) — SVG bottom-anchored.
 *
 * Bar does NOT require a band X scale; the slot width is purely
 * geometric. This keeps the atom usable with linear or band X axes
 * interchangeably.
 */
@Component({
  selector: 'cngx-bar',
  exportAs: 'cngxBar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (rect of rects(); track rect.key) {
      <svg:rect
        class="cngx-bar"
        [attr.x]="rect.x"
        [attr.y]="rect.y"
        [attr.width]="rect.width"
        [attr.height]="rect.height"
      />
    }
  `,
  styles: [
    `
      .cngx-bar {
        fill: var(--cngx-bar-color, var(--cngx-chart-primary, currentColor));
      }
    `,
  ],
})
export class CngxBar<T = unknown> {
  readonly accessor = input<BarYAccessor<T>>(((d: T) => Number(d)) as BarYAccessor<T>);
  readonly gap = input<number>(0.1);
  readonly baseline = input<number>(FALLBACK_BASELINE);
  readonly data = input<readonly T[] | undefined>(undefined);

  private readonly ctx = injectChartContext();

  private readonly resolvedData = computed<readonly T[]>(() => {
    const local = this.data();
    if (local !== undefined) {
      return local;
    }
    return this.ctx.data() as readonly T[];
  });

  protected readonly rects = computed<readonly BarRect[]>(
    () => {
      const data = this.resolvedData();
      const n = data.length;
      if (n === 0) {
        return [];
      }
      const { width } = this.ctx.dimensions();
      const yScale = this.ctx.yScale();
      const slot = width / n;
      const gap = clamp01(this.gap());
      const inner = slot * (1 - gap);
      const offset = (slot - inner) / 2;
      const baselineY = yScale(this.baseline());
      const yAcc = resolveYAccessor(this.accessor());
      const out = new Array<BarRect>(n);
      for (let i = 0; i < n; i++) {
        const value = yAcc(data[i], i);
        const valueY = yScale(value);
        const top = Math.min(valueY, baselineY);
        const bottom = Math.max(valueY, baselineY);
        out[i] = {
          key: i,
          x: i * slot + offset,
          y: top,
          width: inner,
          height: bottom - top,
        };
      }
      return out;
    },
    { equal: rectsEqual },
  );
}

function clamp01(v: number): number {
  if (v < 0) {
    return 0;
  }
  if (v > 1) {
    return 1;
  }
  return v;
}

function resolveYAccessor<T>(acc: BarYAccessor<T>): (d: T, i: number) => number {
  if (typeof acc === 'function') {
    return acc;
  }
  return (d) => Number((d as Record<string, unknown>)[acc]);
}

function rectsEqual(a: readonly BarRect[], b: readonly BarRect[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.x !== y.x || x.y !== y.y || x.width !== y.width || x.height !== y.height) {
      return false;
    }
  }
  return true;
}

function injectChartContext(): CngxChartContext {
  const ctx = inject(CNGX_CHART_CONTEXT, { optional: true });
  if (!ctx) {
    throw new Error(
      'CngxBar: missing CNGX_CHART_CONTEXT — must be a content child of <cngx-chart>',
    );
  }
  return ctx;
}
