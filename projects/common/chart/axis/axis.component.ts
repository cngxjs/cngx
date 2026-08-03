import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CNGX_CHART_CONTEXT, type CngxChartPlotArea } from '../chart/chart-context';

/**
 * Axis position. Top/bottom are X-axes; left/right are Y-axes. The
 * parent `<cngx-chart>` collects content-child axes and routes their
 * inputs to its `xScale` / `yScale` signals based on this discriminator.
 *
 * @category common/chart/axis
 */
export type CngxAxisPosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Axis scale type. The chart's scale-builder picks the matching
 * `create*Scale` factory at the boundary; the axis itself stays
 * scale-implementation-agnostic.
 *
 * @category common/chart/axis
 */
export type CngxAxisType = 'linear' | 'time' | 'band';

/** @internal */
const DEFAULT_TICK_COUNT = 5;
/** @internal */
const TICK_LENGTH = 5;
/** @internal */
const LABEL_OFFSET = 4;
/** @internal */
const AXIS_LABEL_OFFSET_INLINE = 32;
/** @internal */
const AXIS_LABEL_OFFSET_BLOCK = 36;

/**
 * The declared default of `--cngx-axis-font-size` (see the tick-label
 * rule in `styles` below), in viewBox user units.
 *
 * Duplicated here because {@link CngxAxis.reservation} is arithmetic
 * over label strings and reads nothing from the DOM - resolving the
 * custom property would mean a `getComputedStyle` call in the reactive
 * graph. A consumer restyling the property therefore gets tick labels
 * at their size inside a gutter sized for the default; that is the
 * single limitation the chart-area debt register covers.
 *
 * @internal
 */
const AXIS_FONT_SIZE = 11;

/**
 * The declared default of `--cngx-axis-axis-label-font-size`. Same
 * no-DOM-read reasoning as {@link AXIS_FONT_SIZE}.
 *
 * @internal
 */
const AXIS_LABEL_FONT_SIZE = 12;

/**
 * Width of one character as a fraction of the font size. An estimate,
 * not the font's real advance width - the axis knows its label strings
 * but not the glyphs they resolve to.
 *
 * `0.62` sits above the average advance of the common UI sans faces at
 * their digit widths, so the gutter covers rather than clips. Measured
 * against the demo stories it over-reserves by roughly a character on a
 * long thousands-separated label, which is the correct direction to be
 * wrong in.
 *
 * @internal
 */
const CHAR_ADVANCE_RATIO = 0.62;

/**
 * Height of a rendered line box as a fraction of the font size, sized
 * so that *half* of it still covers the taller half. A label reaches
 * above its ascender and below its descender, so it needs more than the
 * font size: at 11px the browser lays out 13. It is also not centred on
 * its anchor - a `dominant-baseline: middle` label measures 7.6 above
 * the anchor and 5.4 below, so a symmetric half of the true 13 would
 * under-reserve on the taller side by exactly the amount that clips the
 * topmost tick label of a left axis.
 *
 * `1.4` is that asymmetry folded into one number: `11 x 1.4 / 2 = 7.7`
 * covers the 7.6, and the full value over-reserves a horizontal axis by
 * about two units, which is the direction to be wrong in.
 *
 * @internal
 */
const LINE_BOX_RATIO = 1.4;

/** @internal */
interface AxisLabelGeometry {
  readonly transform: string;
  readonly anchor: 'start' | 'middle' | 'end';
  readonly baseline: 'auto' | 'middle' | 'hanging';
}

/** @internal */
interface AxisGeometry {
  readonly transform: string;
  readonly line: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };
}

/** @internal */
interface TickRendering {
  readonly key: string;
  readonly transform: string;
  readonly tickLine: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };
  /**
   * Endpoint of the gridline that extends from this tick across the
   * chart's perpendicular dimension. `(x1, y1)` is always `(0, 0)`
   * (the tick's local origin); `(x2, y2)` reaches the opposite side
   * of the chart area. Always present in the tick rendering - the
   * `[showGrid]` input controls whether the line is rendered, not
   * whether the geometry is computed.
   */
  readonly gridLine: { readonly x2: number; readonly y2: number };
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
 * Attribute-selector on `<svg:g>` - the host element IS the SVG group.
 * This keeps the namespace boundary clean: a `<cngx-axis>` element
 * inside `<svg>` would be in the XHTML namespace and SVG layout would
 * not flow through it. By making the directive attribute-only, the
 * host stays in the SVG namespace and the browser lays out tick lines
 * and labels exactly where the geometry says.
 *
 * Host carries `aria-hidden="true"` - axis text is decoration; the
 * semantic data view lives on the parent chart's auto-Summary and
 * Data Table.
 *
 * @category common/chart/axis
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/axis/axis.component.ts
 * @since 0.1.0
 * @relatedTo CngxChart, CngxLine, CngxBar, CngxArea
 *
 * <example-url>http://localhost:4200/#/common/chart/primitives/async-state-machine-on-the-primitive</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/combo-bars-moving-average-line</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/line-area-threshold-band</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/multi-series-line-axis-labels-legend</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/responsive-fills-parent-width</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/scatter-with-performance-zones</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/time-series-with-threshold-zones</example-url>
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
    @if (decorated() && axisGeometry(); as g) {
      @if (showGrid()) {
        @for (tick of tickRenderings(); track tick.key) {
          <svg:line
            [attr.transform]="tick.transform"
            [attr.x1]="0"
            [attr.y1]="0"
            [attr.x2]="tick.gridLine.x2"
            [attr.y2]="tick.gridLine.y2"
            class="cngx-axis__grid-line"
          />
        }
      }
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
      @if (axisLabel(); as title) {
        @if (axisLabelGeometry(); as g) {
          <svg:text
            class="cngx-axis__axis-label"
            [attr.transform]="g.transform"
            [attr.text-anchor]="g.anchor"
            [attr.dominant-baseline]="g.baseline"
          >
            {{ title }}
          </svg:text>
        }
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
      .cngx-axis__grid-line {
        stroke: var(--cngx-axis-grid-color, var(--cngx-chart-grid-color, currentColor));
        stroke-opacity: var(--cngx-axis-grid-opacity, 0.6);
        stroke-width: var(--cngx-axis-grid-stroke-width, 1px);
        stroke-dasharray: var(--cngx-axis-grid-dasharray, 0);
        fill: none;
        pointer-events: none;
      }
      .cngx-axis__axis-label {
        fill: var(--cngx-axis-axis-label-color, var(--cngx-chart-text-color, currentColor));
        font-size: var(--cngx-axis-axis-label-font-size, 12px);
        font-weight: var(--cngx-axis-axis-label-font-weight, 500);
      }
    `,
  ],
})
export class CngxAxis {
  readonly position = input.required<CngxAxisPosition>();
  readonly type = input<CngxAxisType>('linear');
  readonly domain = input<readonly unknown[] | undefined>(undefined);
  readonly tickCount = input<number | undefined>(undefined, { alias: 'ticks' });
  readonly format = input<(v: unknown) => string>(defaultTickFormat);
  /**
   * Render decorative gridlines extending from each tick across the
   * chart's perpendicular dimension. Theming via the
   * `--cngx-axis-grid-color` / `--cngx-axis-grid-opacity` /
   * `--cngx-axis-grid-stroke-width` / `--cngx-axis-grid-dasharray`
   * CSS custom properties (defaults: chart-level grid colour, 0.6
   * opacity, 1px solid). Aliased as `[grid]` for terseness.
   */
  readonly showGrid = input<boolean>(false, { alias: 'grid' });
  /**
   * Optional axis title rendered alongside the tick labels -
   * "Months", "Revenue (k€)", etc. The title is positioned outside
   * the tick labels (further from the chart area) and rotated -90°
   * for left/right axes so it reads bottom-to-top. Theming via the
   * `--cngx-axis-axis-label-color` and `--cngx-axis-axis-label-font-size`
   * CSS custom properties (default: chart text colour + 12px). Aliased
   * `[label]` for terseness.
   */
  readonly axisLabel = input<string | null>(null, { alias: 'label' });

  /**
   * Whether this axis draws anything. `false` turns it into a pure
   * domain publisher: the parent still reads its `position` / `type` /
   * `domain` to build the matching scale, but no line, tick or label
   * is rendered and the axis reserves no room in the plot area.
   *
   * This is what the presets need. A sparkline mounts two axes to
   * declare its scale domains and draws none of them, so charging it
   * a gutter for decoration it never paints would shrink the whole
   * mark down to nothing. Not a styling knob - an axis that draws
   * nothing genuinely needs no room, so the reservation stays derived.
   */
  readonly decorated = input<boolean>(true);

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
        const end = toMs(dom.at(-1));
        return spread(start, end, count).map((ms) => new Date(ms));
      }

      const start = Number(dom[0]);
      const end = Number(dom.at(-1));
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

  /**
   * How far this axis's decoration extends perpendicular to its own
   * line, in viewBox user units. The parent chart reads it to size the
   * plot inset on the side {@link position} names; nothing else
   * consumes it.
   *
   * The magnitude is derived, not configured. A vertical axis reserves
   * for the tick gap plus the *longest formatted tick label*, because a
   * left label grows leftward with its character count. A horizontal
   * axis reserves the tick gap plus one line box, because a bottom
   * label grows downward by its height no matter how long it is. An
   * axis carrying a {@link axisLabel} title reserves at least the
   * title's own fixed offset plus its line box, since
   * `buildAxisLabelGeometry` places the title at a constant distance
   * from the line rather than beyond the ticks - so the two extents
   * are alternatives, not addends.
   *
   * Character width is an estimate ({@link CHAR_ADVANCE_RATIO}), which
   * is the one value here that is not derived from state the axis
   * owns. Everything else comes from {@link tickValues} and
   * {@link format}, which the component already computes to render the
   * labels themselves - so this reads no DOM, measures no text, and
   * returns the same number under SSR as in the browser.
   *
   * Acyclic by construction: {@link tickValues} reads `domain` /
   * `ticks` / `type` and never the scale, so
   * `reservation -> inset -> plot -> scale -> tickRenderings` has no
   * back edge.
   */
  readonly reservation = computed<number>(() => {
    if (!this.decorated()) {
      return 0;
    }
    const horizontal = this.position() === 'top' || this.position() === 'bottom';

    const labelExtent = horizontal ? AXIS_FONT_SIZE * LINE_BOX_RATIO : this.widestTickLabel();
    const tickRoom = TICK_LENGTH + LABEL_OFFSET + labelExtent;

    const titleRoom = this.axisLabel()
      ? (horizontal ? AXIS_LABEL_OFFSET_INLINE : AXIS_LABEL_OFFSET_BLOCK) +
        AXIS_LABEL_FONT_SIZE * LINE_BOX_RATIO
      : 0;

    // Whole user units, rounded up: the estimate is already an
    // approximation, so rounding down would trade a clean number for a
    // clipped glyph. It also keeps the axis `transform` a short
    // integer string instead of the float noise the ratio produces.
    return Math.ceil(Math.max(tickRoom, titleRoom));
  });

  /**
   * How far this axis's decoration extends *along* its own line, past
   * the plot corner at either end. The parent chart reserves it on the
   * two sides perpendicular to {@link position}.
   *
   * A tick label is centred on its tick, and the extreme ticks sit
   * exactly on the plot corners - so half of the first and last label
   * hangs outside the plot no matter how much room the axis's own side
   * reserves. A left axis's topmost label overhangs upward by half a
   * line box; a bottom axis's last label overhangs rightward by half
   * its width. Reserving only on the side the axis occupies leaves
   * both of those painting outside the viewBox, which is the defect
   * this pairs with {@link reservation} to close.
   *
   * The widest label stands in for the two extreme ones. Being wrong
   * here means over-reserving by a few units on an axis whose ends
   * happen to carry its shortest labels, which is cheaper than the
   * per-end bookkeeping the exact answer would need.
   */
  readonly crossReservation = computed<number>(() => {
    if (!this.decorated()) {
      return 0;
    }
    const horizontal = this.position() === 'top' || this.position() === 'bottom';
    const extent = horizontal ? this.widestTickLabel() : AXIS_FONT_SIZE * LINE_BOX_RATIO;
    return Math.ceil(extent / 2);
  });

  /**
   * Estimated width of the widest formatted tick label, in viewBox user
   * units. Split out so a horizontal axis reads it only where label
   * width actually matters - its own reservation is a line box, and
   * only its cross-axis overhang depends on the strings.
   */
  private readonly widestTickLabel = computed<number>(
    () => this.longestTickLabel() * AXIS_FONT_SIZE * CHAR_ADVANCE_RATIO,
  );

  /**
   * Character count of the widest formatted tick label. Split out of
   * {@link reservation} so a horizontal axis never reads it: a bottom
   * label's extent is its height, so tracking the label strings there
   * would put a dependency in the graph that cannot change the result.
   */
  private readonly longestTickLabel = computed<number>(() => {
    const fmt = this.format();
    let longest = 0;
    for (const v of this.tickValues()) {
      const len = fmt(v).length;
      if (len > longest) {
        longest = len;
      }
    }
    return longest;
  });

  protected readonly hostClass = computed(() => `cngx-axis cngx-axis--${this.position()}`);

  /**
   * The chart's plot area, or `null` once it has collapsed on either
   * dimension - the same condition under which the chart hands out its
   * NOOP scale, so a collapsed chart renders no axis rather than an
   * axis against a backwards range.
   *
   * The rectangle itself is the chart's derivation, read straight off
   * the context. The axis narrows it to a render/do-not-render
   * decision; it never reconstructs it from the box.
   */
  private readonly plot = computed<CngxChartPlotArea | null>(() => {
    const plot = this.ctx.plot();
    return plot.width <= 0 || plot.height <= 0 ? null : plot;
  });

  protected readonly axisLabelGeometry = computed<AxisLabelGeometry | null>(
    () => {
      const plot = this.plot();
      if (!plot) {
        return null;
      }
      return buildAxisLabelGeometry(this.position(), plot);
    },
    {
      equal: (a, b) =>
        a === b ||
        (a !== null &&
          b !== null &&
          a.transform === b.transform &&
          a.anchor === b.anchor &&
          a.baseline === b.baseline),
    },
  );

  protected readonly axisGeometry = computed<AxisGeometry | null>(
    () => {
      const plot = this.plot();
      if (!plot) {
        return null;
      }
      return buildAxisGeometry(this.position(), plot);
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
      const plot = this.plot();
      if (!plot) {
        return [];
      }
      const isHorizontal = pos === 'top' || pos === 'bottom';
      const scale = isHorizontal ? this.ctx.xScale() : this.ctx.yScale();
      return values.map((v, i) => {
        const offset = (scale as (input: unknown) => number)(v);
        return buildTickRendering(pos, offset, fmt(v), `${i}-${String(v)}`, plot);
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
            ta.tickLine.y2 !== tb.tickLine.y2 ||
            ta.gridLine.x2 !== tb.gridLine.x2 ||
            ta.gridLine.y2 !== tb.gridLine.y2
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );
}

/** @internal */
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

/** @internal */
function toMs(v: unknown): number {
  if (typeof v === 'number') {
    return v;
  }
  if (v instanceof Date) {
    return v.getTime();
  }
  return Number(v);
}

/**
 * Places the axis group on the plot edge and spans its line across the
 * plot extent.
 *
 * The group only translates along the axis's *perpendicular* direction:
 * a bottom axis moves in y and stays at `x = 0`, because the tick
 * offsets the scale hands back are already absolute viewBox
 * coordinates and would double-count an inset baked into the group's
 * own translate.
 *
 * @internal
 */
function buildAxisGeometry(pos: CngxAxisPosition, plot: CngxChartPlotArea): AxisGeometry {
  switch (pos) {
    case 'top':
      return {
        transform: `translate(0,${plot.y0})`,
        line: { x1: plot.x0, y1: 0, x2: plot.x1, y2: 0 },
      };
    case 'bottom':
      return {
        transform: `translate(0,${plot.y1})`,
        line: { x1: plot.x0, y1: 0, x2: plot.x1, y2: 0 },
      };
    case 'left':
      return {
        transform: `translate(${plot.x0},0)`,
        line: { x1: 0, y1: plot.y0, x2: 0, y2: plot.y1 },
      };
    case 'right':
      return {
        transform: `translate(${plot.x1},0)`,
        line: { x1: 0, y1: plot.y0, x2: 0, y2: plot.y1 },
      };
  }
}

/** @internal */
function buildTickRendering(
  pos: CngxAxisPosition,
  offset: number,
  text: string,
  key: string,
  plot: CngxChartPlotArea,
): TickRendering {
  switch (pos) {
    case 'bottom':
      return {
        key,
        transform: `translate(${offset},0)`,
        tickLine: { x1: 0, y1: 0, x2: 0, y2: TICK_LENGTH },
        gridLine: { x2: 0, y2: -plot.height },
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
        gridLine: { x2: 0, y2: plot.height },
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
        gridLine: { x2: plot.width, y2: 0 },
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
        gridLine: { x2: -plot.width, y2: 0 },
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

/**
 * Default tick label formatter. Strips floating-point arithmetic
 * noise from non-integer numbers - `6.6000000000000005` becomes
 * `'6.6'`, `2.2` stays `'2.2'`, `25` stays `'25'` - without rounding
 * away meaningful precision. Dates and other types fall through to
 * `String(v)`; consumers needing a richer format bind `[format]`.
 *
 * @internal
 */
function defaultTickFormat(v: unknown): string {
  if (typeof v === 'number') {
    if (Number.isInteger(v)) {
      return String(v);
    }
    if (!Number.isFinite(v)) {
      return String(v);
    }
    // 12 significant digits is more than enough for any sensible
    // chart domain while collapsing the trailing 1e-15 noise
    // produced by accumulated float math.
    return Number(v.toPrecision(12)).toString();
  }
  return String(v);
}

/** @internal */
function buildAxisLabelGeometry(pos: CngxAxisPosition, plot: CngxChartPlotArea): AxisLabelGeometry {
  // Local to the axis group, so the offsets stay as they were and only
  // the centring runs along the plot extent instead of the box.
  const midX = plot.x0 + plot.width / 2;
  const midY = plot.y0 + plot.height / 2;
  switch (pos) {
    case 'bottom':
      return {
        transform: `translate(${midX},${AXIS_LABEL_OFFSET_INLINE})`,
        anchor: 'middle',
        baseline: 'hanging',
      };
    case 'top':
      return {
        transform: `translate(${midX},${-AXIS_LABEL_OFFSET_INLINE})`,
        anchor: 'middle',
        baseline: 'auto',
      };
    case 'left':
      return {
        transform: `translate(${-AXIS_LABEL_OFFSET_BLOCK},${midY}) rotate(-90)`,
        anchor: 'middle',
        baseline: 'auto',
      };
    case 'right':
      return {
        transform: `translate(${AXIS_LABEL_OFFSET_BLOCK},${midY}) rotate(90)`,
        anchor: 'middle',
        baseline: 'auto',
      };
  }
}
