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
 * ### With async state
 * ```html
 * <cngx-progress [state]="uploadState" label="File upload" [showLabel]="true" />
 * ```
 *
 * ### Manual progress
 * ```html
 * <cngx-progress [progress]="percent()" label="Processing" />
 * ```
 * <example-url>http://localhost:4200/#/ui/feedback/progress/circular-variant</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/progress/linear-determinate</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/progress/linear-indeterminate</example-url>
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
    '[attr.aria-valuemin]': 'isDeterminate() ? 0 : null',
    '[attr.aria-valuemax]': 'isDeterminate() ? 100 : null',
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
  styleUrl: './progress.css',
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
