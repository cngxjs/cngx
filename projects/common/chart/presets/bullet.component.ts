import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { injectPresetState } from './preset-state';

/**
 * Bullet chart range entry — a colour band stretching from one value
 * to another along the bullet's axis. Typical use: traffic-light
 * bands ("good" / "fair" / "poor") behind the actual+target bar.
 */
export interface CngxBulletRange {
  readonly from: number;
  readonly to: number;
  readonly color?: string;
  readonly label?: string;
}

interface RangeRendering {
  readonly key: string;
  readonly left: number;
  readonly width: number;
  readonly color: string | null;
}

/**
 * Bullet chart — Stephen Few's compact KPI visualisation. Three
 * stacked layers: background `[ranges]` (qualitative bands), an
 * `[actual]` filled bar, and a `[target]` vertical marker. Pure DOM,
 * no SVG. Host carries `role="meter"`.
 */
@Component({
  selector: 'cngx-bullet',
  exportAs: 'cngxBullet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'meter',
    '[attr.aria-valuenow]': 'actual()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'maxValue()',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'cngx-bullet',
  },
  template: `
    @switch (activeView()) {
      @case ('skeleton') {
        <span class="cngx-preset-skeleton" [attr.aria-busy]="true" [attr.aria-label]="i18n.loading()"></span>
      }
      @case ('empty') {
        <span class="cngx-preset-fallback">{{ i18n.empty() }}</span>
      }
      @case ('error') {
        <span class="cngx-preset-fallback cngx-preset-fallback--error">{{ i18n.error() }}</span>
      }
      @case ('none') {}
      @default {
        <div class="cngx-bullet__track">
          @for (r of rangeRenderings(); track r.key) {
            <div
              class="cngx-bullet__range"
              [style.left.%]="r.left"
              [style.width.%]="r.width"
              [style.background]="r.color"
              [attr.aria-hidden]="true"
            ></div>
          }
          <div
            class="cngx-bullet__actual"
            [style.width.%]="actualPercent()"
            [attr.aria-hidden]="true"
          ></div>
          <div
            class="cngx-bullet__target"
            [style.left.%]="targetPercent()"
            [attr.aria-hidden]="true"
          ></div>
        </div>
      }
    }
  `,
  styles: [
    `
      cngx-bullet {
        display: block;
        width: var(--cngx-bullet-width, 200px);
        --cngx-bullet-actual-color: var(--cngx-chart-primary, currentColor);
        --cngx-bullet-target-color: var(--cngx-chart-text-color, currentColor);
      }
      cngx-bullet .cngx-bullet__track {
        position: relative;
        height: var(--cngx-bullet-height, 16px);
        background: var(--cngx-bullet-track, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.06)));
        border-radius: var(--cngx-bullet-radius, 2px);
        overflow: hidden;
      }
      cngx-bullet .cngx-bullet__range {
        position: absolute;
        top: 0;
        bottom: 0;
        opacity: var(--cngx-bullet-range-opacity, 0.35);
      }
      cngx-bullet .cngx-bullet__actual {
        position: absolute;
        top: 25%;
        bottom: 25%;
        left: 0;
        background: var(--cngx-bullet-actual-color);
        border-radius: var(--cngx-bullet-actual-radius, 1px);
        transition: width var(--cngx-bullet-transition, 240ms) ease-out;
      }
      cngx-bullet .cngx-bullet__target {
        position: absolute;
        top: 10%;
        bottom: 10%;
        width: 2px;
        margin-left: -1px;
        background: var(--cngx-bullet-target-color);
        transition: left var(--cngx-bullet-transition, 240ms) ease-out;
      }
      cngx-bullet .cngx-preset-skeleton {
        display: block;
        height: var(--cngx-bullet-height, 16px);
        background: var(--cngx-skeleton-bg, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: var(--cngx-bullet-radius, 2px);
      }
      cngx-bullet .cngx-preset-fallback {
        display: inline-block;
        font-size: var(--cngx-preset-fallback-font-size, 0.75rem);
        opacity: var(--cngx-preset-fallback-opacity, 0.7);
      }
      cngx-bullet .cngx-preset-fallback--error {
        color: var(--cngx-chart-danger, currentColor);
      }
    `,
  ],
})
export class CngxBullet {
  readonly actual = input.required<number>();
  readonly target = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly ranges = input<readonly CngxBulletRange[]>([]);
  readonly state = input<CngxAsyncState<number> | undefined>(undefined);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  private readonly preset = injectPresetState(() => this.state());
  protected readonly i18n = this.preset.i18n;
  protected readonly activeView = this.preset.activeView;

  protected readonly maxValue = computed(() => {
    const explicit = this.max();
    if (explicit !== null && explicit > 0) {
      return explicit;
    }
    const ranges = this.ranges();
    let m = Math.max(this.actual(), this.target() ?? 0);
    for (const r of ranges) {
      if (r.to > m) {
        m = r.to;
      }
    }
    return m > 0 ? m : 1;
  });

  protected readonly actualPercent = computed(() =>
    pct(this.actual(), this.maxValue()),
  );

  protected readonly targetPercent = computed(() => {
    const t = this.target();
    if (t === null) {
      return 0;
    }
    return pct(t, this.maxValue());
  });

  protected readonly rangeRenderings = computed<readonly RangeRendering[]>(() => {
    const m = this.maxValue();
    return this.ranges().map((r, i) => {
      const lo = Math.min(r.from, r.to);
      const hi = Math.max(r.from, r.to);
      return {
        key: `${i}-${r.label ?? ''}`,
        left: pct(lo, m),
        width: pct(hi - lo, m),
        color: r.color ?? null,
      };
    });
  });
}

function pct(v: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  const ratio = (v / max) * 100;
  if (ratio < 0) {
    return 0;
  }
  if (ratio > 100) {
    return 100;
  }
  return ratio;
}
