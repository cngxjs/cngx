import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { injectPresetState } from './preset-state';

const TWO_PI = Math.PI * 2;

/**
 * Circular donut gauge — a single-value bounded indicator. Renders a
 * background ring + a foreground arc whose length is proportional to
 * `value / max`. Host carries `role="meter"`; the optional `[label]`
 * input renders an SR-only label inside the ring's centre.
 */
@Component({
  selector: 'cngx-donut',
  exportAs: 'cngxDonut',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'meter',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'cngx-donut',
  },
  template: `
    @switch (activeView()) {
      @case ('skeleton') {
        <span
          class="cngx-preset-skeleton cngx-donut__skeleton"
          [style.width.px]="size()"
          [style.height.px]="size()"
          [attr.aria-busy]="true"
          [attr.aria-label]="i18n.loading()"
        ></span>
      }
      @case ('empty') {
        <span class="cngx-preset-fallback">{{ i18n.empty() }}</span>
      }
      @case ('error') {
        <span class="cngx-preset-fallback cngx-preset-fallback--error">{{ i18n.error() }}</span>
      }
      @case ('none') {}
      @default {
        <svg
          [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
          [attr.width]="size()"
          [attr.height]="size()"
          aria-hidden="true"
        >
          <svg:circle
            class="cngx-donut__track"
            [attr.cx]="center()"
            [attr.cy]="center()"
            [attr.r]="radius()"
            [attr.stroke-width]="thickness()"
            fill="none"
          />
          <svg:circle
            class="cngx-donut__fill"
            [attr.cx]="center()"
            [attr.cy]="center()"
            [attr.r]="radius()"
            [attr.stroke-width]="thickness()"
            [attr.stroke-dasharray]="dasharray()"
            [attr.stroke-dashoffset]="dashoffset()"
            [attr.transform]="'rotate(-90 ' + center() + ' ' + center() + ')'"
            fill="none"
            stroke-linecap="round"
          />
        </svg>
        @if (label(); as l) {
          <span class="cngx-donut__label">{{ l }}</span>
        }
      }
    }
  `,
  styles: [
    `
      cngx-donut {
        display: inline-block;
        position: relative;
        line-height: 0;
        --cngx-donut-color: var(--cngx-chart-primary, currentColor);
      }
      cngx-donut .cngx-donut__track {
        stroke: var(--cngx-donut-track, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
      }
      cngx-donut .cngx-donut__fill {
        stroke: var(--cngx-donut-color);
        transition: stroke-dashoffset var(--cngx-donut-transition, 320ms) ease-out;
      }
      cngx-donut .cngx-donut__label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: var(--cngx-donut-label-font-size, 0.875rem);
        line-height: 1;
        color: var(--cngx-chart-text-color, currentColor);
      }
      cngx-donut .cngx-preset-skeleton {
        display: inline-block;
        background: var(--cngx-skeleton-bg, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: 50%;
      }
      cngx-donut .cngx-preset-fallback {
        display: inline-block;
        font-size: var(--cngx-preset-fallback-font-size, 0.75rem);
        opacity: var(--cngx-preset-fallback-opacity, 0.7);
      }
      cngx-donut .cngx-preset-fallback--error {
        color: var(--cngx-chart-danger, currentColor);
      }
    `,
  ],
})
export class CngxDonut {
  readonly value = input.required<number>();
  readonly max = input<number>(100);
  readonly size = input<number>(48);
  readonly thickness = input<number>(6);
  readonly label = input<string | null>(null);
  readonly state = input<CngxAsyncState<number> | undefined>(undefined);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  private readonly preset = injectPresetState(() => this.state());
  protected readonly i18n = this.preset.i18n;
  protected readonly activeView = this.preset.activeView;

  protected readonly center = computed(() => this.size() / 2);
  protected readonly radius = computed(() => (this.size() - this.thickness()) / 2);
  protected readonly circumference = computed(() => TWO_PI * this.radius());

  protected readonly dasharray = computed(() => {
    const c = this.circumference();
    return `${c} ${c}`;
  });

  protected readonly dashoffset = computed(() => {
    const c = this.circumference();
    const m = this.max();
    if (m <= 0) {
      return c;
    }
    const ratio = Math.min(Math.max(this.value() / m, 0), 1);
    return c * (1 - ratio);
  });
}
