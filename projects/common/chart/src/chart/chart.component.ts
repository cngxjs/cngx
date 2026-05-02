import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CngxResizeObserver } from '@cngx/common/layout';
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
 * Phase 1 ships placeholder scales — Phase 2's `<cngx-axis>` replaces
 * them with axis-derived computeds via content-child collection. The
 * `[width]` / `[height]` inputs override the resize observer for
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

  readonly dataLength = computed(() => this.data().length);

  readonly dimensions = computed(() => ({
    width: this.width() ?? this.resize.width(),
    height: this.height() ?? this.resize.height(),
  }));

  protected readonly viewBox = computed(() => {
    const { width, height } = this.dimensions();
    return `0 0 ${width || 0} ${height || 0}`;
  });

  /**
   * Phase 1 placeholder. Phase 2's `<cngx-axis>` replaces this signal's
   * source with a content-child-derived computed.
   */
  private readonly xScaleSource = signal<ScaleFn<XScaleInput>>(NOOP_SCALE);
  readonly xScale = this.xScaleSource.asReadonly();

  /**
   * Phase 1 placeholder. Phase 2's `<cngx-axis>` replaces this signal's
   * source with a content-child-derived computed.
   */
  private readonly yScaleSource = signal<ScaleFn<number>>(NOOP_Y_SCALE);
  readonly yScale = this.yScaleSource.asReadonly();
}
