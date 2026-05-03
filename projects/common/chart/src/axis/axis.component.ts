import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CNGX_CHART_CONTEXT } from '../chart/chart-context';

/**
 * Axis position. Top/bottom are X-axes; left/right are Y-axes. The
 * parent `<cngx-chart>` collects content-child axes and routes their
 * inputs to its `xScale` / `yScale` signals based on this discriminator.
 */
export type CngxAxisPosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Axis scale type. The chart's scale-builder picks the matching
 * `create*Scale` factory at the boundary; the axis itself stays
 * scale-implementation-agnostic.
 */
export type CngxAxisType = 'linear' | 'time' | 'band';

const DEFAULT_TICK_COUNT = 5;
const TICK_LENGTH = 5;
const LABEL_OFFSET = 4;

interface AxisGeometry {
  readonly transform: string;
  readonly line: { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number };
}

interface TickRendering {
  readonly key: string;
  readonly transform: string;
  readonly tickLine: { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number };
  readonly label: {
    readonly x: number;
    readonly y: number;
    readonly anchor: 'start' | 'middle' | 'end';
    readonly baseline: 'auto' | 'middle' | 'hanging';
    readonly text: string;
  };
}

/**
 * Declarative axis directive. Lives as a content child of
 * `<cngx-chart>`; its `position` + `type` + `domain` inputs feed the
 * parent's scale derivation. Renders SVG ticks and labels in the
 * coordinate system the parent publishes via {@link CNGX_CHART_CONTEXT}.
 *
 * Attribute-selector on `<svg:g>` — the host element IS the SVG group.
 * This keeps the namespace boundary clean: a `<cngx-axis>` element
 * inside `<svg>` would be in the XHTML namespace and SVG layout would
 * not flow through it. By making the directive attribute-only, the
 * host stays in the SVG namespace and the browser lays out tick lines
 * and labels exactly where the geometry says.
 *
 * Host carries `aria-hidden="true"` — axis text is decoration; the
 * semantic data view lives on the parent chart's auto-Summary and
 * Data Table.
 */
@Component({
  selector: '[cngxAxis]',
  exportAs: 'cngxAxis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'aria-hidden': 'true',
    '[attr.transform]': 'axisGeometry()?.transform ?? null',
    '[attr.class]': 'hostClass()',
  },
  template: `
    @if (axisGeometry(); as g) {
      <svg:line
        [attr.x1]="g.line.x1"
        [attr.y1]="g.line.y1"
        [attr.x2]="g.line.x2"
        [attr.y2]="g.line.y2"
        class="cngx-axis__line"
      />
      @for (tick of tickRenderings(); track tick.key) {
        <svg:g [attr.transform]="tick.transform" class="cngx-axis__tick">
          <svg:line
            [attr.x1]="tick.tickLine.x1"
            [attr.y1]="tick.tickLine.y1"
            [attr.x2]="tick.tickLine.x2"
            [attr.y2]="tick.tickLine.y2"
            class="cngx-axis__tick-line"
          />
          <svg:text
            [attr.x]="tick.label.x"
            [attr.y]="tick.label.y"
            [attr.text-anchor]="tick.label.anchor"
            [attr.dominant-baseline]="tick.label.baseline"
            class="cngx-axis__tick-label"
          >
            {{ tick.label.text }}
          </svg:text>
        </svg:g>
      }
    }
  `,
  styles: [
    `
      .cngx-axis__line,
      .cngx-axis__tick-line {
        stroke: var(--cngx-axis-color, var(--cngx-chart-axis-color, currentColor));
        stroke-width: var(--cngx-axis-stroke-width, 1px);
        fill: none;
      }
      .cngx-axis__tick-label {
        fill: var(--cngx-axis-text-color, var(--cngx-chart-text-color, currentColor));
        font-size: var(--cngx-axis-font-size, 11px);
      }
    `,
  ],
})
export class CngxAxis {
  readonly position = input.required<CngxAxisPosition>();
  readonly type = input<CngxAxisType>('linear');
  readonly domain = input<readonly unknown[] | undefined>(undefined);
  readonly tickCount = input<number | undefined>(undefined, { alias: 'ticks' });
  readonly format = input<(v: unknown) => string>((v) => String(v));

  private readonly ctx = inject(CNGX_CHART_CONTEXT);

  /**
   * Tick values to render. Resolution order:
   *   1. `type='band'` and `[domain]` provided → one tick per domain
   *      value.
   *   2. linear/time + `[domain]` provided → `[ticks]`-many evenly
   *      spaced positions across the domain (default 5).
   *   3. Otherwise → empty array. Axis still renders the line.
   */
  readonly tickValues = computed<readonly unknown[]>(
    () => {
      const dom = this.domain();
      const count = this.tickCount() ?? DEFAULT_TICK_COUNT;
      const t = this.type();

      if (t === 'band') {
        return dom ?? [];
      }

      if (!dom || dom.length < 2) {
        return [];
      }

      if (t === 'time') {
        const start = toMs(dom[0]);
        const end = toMs(dom[dom.length - 1]);
        return spread(start, end, count).map((ms) => new Date(ms));
      }

      const start = Number(dom[0]);
      const end = Number(dom[dom.length - 1]);
      return spread(start, end, count);
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          const av = a[i];
          const bv = b[i];
          if (Object.is(av, bv)) {
            continue;
          }
          if (av instanceof Date && bv instanceof Date && av.getTime() === bv.getTime()) {
            continue;
          }
          return false;
        }
        return true;
      },
    },
  );

  protected readonly hostClass = computed(
    () => `cngx-axis cngx-axis--${this.position()}`,
  );

  protected readonly axisGeometry = computed<AxisGeometry | null>(
    () => {
      const { width, height } = this.ctx.dimensions();
      if (width <= 0 || height <= 0) {
        return null;
      }
      const pos = this.position();
      return buildAxisGeometry(pos, width, height);
    },
    {
      equal: (a, b) =>
        a === b ||
        (a !== null &&
          b !== null &&
          a.transform === b.transform &&
          a.line.x1 === b.line.x1 &&
          a.line.y1 === b.line.y1 &&
          a.line.x2 === b.line.x2 &&
          a.line.y2 === b.line.y2),
    },
  );

  protected readonly tickRenderings = computed<readonly TickRendering[]>(
    () => {
      const pos = this.position();
      const values = this.tickValues();
      const fmt = this.format();
      const isHorizontal = pos === 'top' || pos === 'bottom';
      const scale = isHorizontal ? this.ctx.xScale() : this.ctx.yScale();
      return values.map((v, i) => {
        const offset = (scale as (input: unknown) => number)(v);
        return buildTickRendering(pos, offset, fmt(v), `${i}-${String(v)}`);
      });
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          const ta = a[i];
          const tb = b[i];
          if (
            ta.key !== tb.key ||
            ta.transform !== tb.transform ||
            ta.label.text !== tb.label.text ||
            ta.tickLine.x1 !== tb.tickLine.x1 ||
            ta.tickLine.y1 !== tb.tickLine.y1 ||
            ta.tickLine.x2 !== tb.tickLine.x2 ||
            ta.tickLine.y2 !== tb.tickLine.y2
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );
}

function spread(start: number, end: number, count: number): number[] {
  if (count <= 1) {
    return [start];
  }
  const span = end - start;
  const step = span / (count - 1);
  const out = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    out[i] = start + step * i;
  }
  return out;
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

function buildAxisGeometry(
  pos: CngxAxisPosition,
  width: number,
  height: number,
): AxisGeometry {
  switch (pos) {
    case 'top':
      return {
        transform: 'translate(0,0)',
        line: { x1: 0, y1: 0, x2: width, y2: 0 },
      };
    case 'bottom':
      return {
        transform: `translate(0,${height})`,
        line: { x1: 0, y1: 0, x2: width, y2: 0 },
      };
    case 'left':
      return {
        transform: 'translate(0,0)',
        line: { x1: 0, y1: 0, x2: 0, y2: height },
      };
    case 'right':
      return {
        transform: `translate(${width},0)`,
        line: { x1: 0, y1: 0, x2: 0, y2: height },
      };
  }
}

function buildTickRendering(
  pos: CngxAxisPosition,
  offset: number,
  text: string,
  key: string,
): TickRendering {
  switch (pos) {
    case 'bottom':
      return {
        key,
        transform: `translate(${offset},0)`,
        tickLine: { x1: 0, y1: 0, x2: 0, y2: TICK_LENGTH },
        label: {
          x: 0,
          y: TICK_LENGTH + LABEL_OFFSET,
          anchor: 'middle',
          baseline: 'hanging',
          text,
        },
      };
    case 'top':
      return {
        key,
        transform: `translate(${offset},0)`,
        tickLine: { x1: 0, y1: 0, x2: 0, y2: -TICK_LENGTH },
        label: {
          x: 0,
          y: -TICK_LENGTH - LABEL_OFFSET,
          anchor: 'middle',
          baseline: 'auto',
          text,
        },
      };
    case 'left':
      return {
        key,
        transform: `translate(0,${offset})`,
        tickLine: { x1: 0, y1: 0, x2: -TICK_LENGTH, y2: 0 },
        label: {
          x: -TICK_LENGTH - LABEL_OFFSET,
          y: 0,
          anchor: 'end',
          baseline: 'middle',
          text,
        },
      };
    case 'right':
      return {
        key,
        transform: `translate(0,${offset})`,
        tickLine: { x1: 0, y1: 0, x2: TICK_LENGTH, y2: 0 },
        label: {
          x: TICK_LENGTH + LABEL_OFFSET,
          y: 0,
          anchor: 'start',
          baseline: 'middle',
          text,
        },
      };
  }
}
