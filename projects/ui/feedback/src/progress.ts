import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

/** Visual variant for the progress indicator. */
export type ProgressVariant = 'linear' | 'circular';

const CIRCUMFERENCE = 2 * Math.PI * 20; // r=20
const CIRCLE_DASH_ARRAY = `${CIRCUMFERENCE}, ${CIRCUMFERENCE}`;

/**
 * Progress indicator atom — determinate or indeterminate.
 *
 * Automatically switches between modes based on whether `progress` is defined:
 * - **Indeterminate** (`progress === undefined`) — animated line, no value
 * - **Determinate** (`progress` 0–100) — bar with percentage
 *
 * CSS `transition` on bar width (300ms ease-out) smooths jumpy updates.
 * `aria-valuenow` is only present in determinate mode — AT uses its
 * absence to distinguish the two modes.
 *
 * @usageNotes
 *
 * ### With async state
 * ```html
 * <cngx-progress [state]="uploadState" label="File upload" [showLabel]="true" />
 * ```
 *
 * ### Manual progress
 * ```html
 * <cngx-progress [progress]="percent()" label="Processing" />
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-progress',
    '[class.cngx-progress--linear]': 'variant() === "linear"',
    '[class.cngx-progress--circular]': 'variant() === "circular"',
    '[class.cngx-progress--determinate]': 'isDeterminate()',
    '[class.cngx-progress--indeterminate]': '!isDeterminate()',
    role: 'progressbar',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'ariaValueNow()',
    '[attr.aria-valuetext]': 'ariaValueText()',
    '[attr.aria-label]': 'label()',
  },
  template: `
    @if (variant() === 'linear') {
      <div class="cngx-progress__track">
        <div
          class="cngx-progress__fill"
          [style.width]="isDeterminate() ? effectiveProgress() + '%' : null"
        ></div>
      </div>
      @if (showLabel() && isDeterminate()) {
        <span class="cngx-progress__label" aria-hidden="true"> {{ effectiveProgress() }}% </span>
      }
    } @else {
      <svg class="cngx-progress__circle" viewBox="0 0 50 50" aria-hidden="true">
        <circle
          class="cngx-progress__circle-track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke-width="4"
        />
        <circle
          class="cngx-progress__circle-fill"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke-width="4"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circleDashArray"
          [attr.stroke-dashoffset]="circleDashOffset()"
        />
      </svg>
      @if (showLabel() && isDeterminate()) {
        <span class="cngx-progress__label" aria-hidden="true"> {{ effectiveProgress() }}% </span>
      }
    }
  `,
  styles: `
    .cngx-progress {
      display: block;
    }

    .cngx-progress--linear {
      display: flex;
      align-items: center;
      gap: var(--cngx-progress-label-gap, 8px);
    }

    .cngx-progress__track {
      flex: 1;
      height: var(--cngx-progress-height, 4px);
      background: var(--cngx-progress-track-color, rgba(0, 0, 0, 0.1));
      border-radius: var(--cngx-progress-border-radius, 2px);
      overflow: hidden;
    }

    .cngx-progress__fill {
      height: 100%;
      background: var(--cngx-progress-color, currentColor);
      border-radius: inherit;
      transition: width var(--cngx-progress-transition-duration, 300ms)
        var(--cngx-progress-transition-easing, ease-out);
    }

    .cngx-progress--indeterminate .cngx-progress__fill {
      width: 40%;
      animation: cngx-progress-indeterminate var(--cngx-progress-indeterminate-duration, 1.5s)
        var(--cngx-progress-indeterminate-easing, ease-in-out) infinite;
    }

    .cngx-progress__label {
      font-size: var(--cngx-progress-label-size, 0.75rem);
      color: var(--cngx-progress-label-color, currentColor);
      min-width: 3ch;
      text-align: right;
    }

    .cngx-progress--circular {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .cngx-progress__circle {
      width: var(--cngx-progress-circle-size, 48px);
      height: var(--cngx-progress-circle-size, 48px);
      transform: rotate(-90deg);
    }

    .cngx-progress__circle-track {
      stroke: var(--cngx-progress-track-color, rgba(0, 0, 0, 0.1));
    }

    .cngx-progress__circle-fill {
      stroke: var(--cngx-progress-color, currentColor);
      transition: stroke-dashoffset var(--cngx-progress-transition-duration, 300ms)
        var(--cngx-progress-transition-easing, ease-out);
    }

    .cngx-progress--indeterminate .cngx-progress__circle {
      animation: cngx-spin var(--cngx-spin-duration, 0.8s) var(--cngx-spin-easing, linear) infinite;
    }

    .cngx-progress--indeterminate .cngx-progress__circle-fill {
      stroke-dasharray: 80, 200;
      stroke-dashoffset: 0;
      transition: none;
    }

    .cngx-progress--circular .cngx-progress__label {
      position: absolute;
      font-size: var(--cngx-progress-circle-label-size, 0.625rem);
    }

    @keyframes cngx-progress-indeterminate {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(150%);
      }
      100% {
        transform: translateX(400%);
      }
    }

    @keyframes cngx-spin {
      to {
        transform: rotate(270deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cngx-progress--indeterminate .cngx-progress__fill,
      .cngx-progress--indeterminate .cngx-progress__circle {
        animation: cngx-pulse var(--cngx-pulse-duration, 2s) var(--cngx-pulse-easing, ease-in-out)
          infinite;
      }

      .cngx-progress--indeterminate .cngx-progress__fill {
        width: 100%;
        transform: none;
      }

      @keyframes cngx-pulse {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 1;
        }
      }
    }
  `,
})
export class CngxProgress {
  /** Bind an async state — reads `progress()` for determinate mode. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Direct progress value (0–100). `undefined` = indeterminate. */
  readonly progress = input<number | undefined>(undefined);

  /** Visual variant. */
  readonly variant = input<ProgressVariant>('linear');

  /** Show percentage label next to the bar. */
  readonly showLabel = input<boolean>(false);

  /** Screen reader label describing *what* is progressing. */
  readonly label = input<string>('Progress');

  /** @internal */
  protected readonly effectiveProgress = computed(() => {
    const p = this.state()?.progress() ?? this.progress();
    if (p === undefined) {
      return undefined;
    }
    return Math.max(0, Math.min(100, Math.round(p)));
  });

  /** @internal */
  protected readonly isDeterminate = computed(() => this.effectiveProgress() !== undefined);

  /** @internal — `null` removes the attribute from the DOM for indeterminate mode. */
  protected readonly ariaValueNow = computed(() => this.effectiveProgress() ?? null);

  /** @internal */
  protected readonly ariaValueText = computed(() => {
    const p = this.effectiveProgress();
    return p !== undefined ? `${p} percent` : null;
  });

  /** @internal */
  protected readonly circleDashArray = CIRCLE_DASH_ARRAY;

  /** @internal — SVG circle dash offset for determinate circular mode. */
  protected readonly circleDashOffset = computed(() => {
    const p = this.effectiveProgress();
    if (p === undefined) {
      return 0;
    }
    return CIRCUMFERENCE - (p / 100) * CIRCUMFERENCE;
  });
}
