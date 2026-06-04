import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type Signal,
  ViewEncapsulation,
} from '@angular/core';

/**
 * State of a single segment in a {@link CngxSegmentedProgress}.
 *
 * @category common/display
 */
export type SegmentState = 'done' | 'active' | 'todo' | 'error';

const segmentsEqual = (a: readonly SegmentState[], b: readonly SegmentState[]): boolean =>
  a.length === b.length && a.every((s, i) => s === b[i]);

/**
 * Generic segmented position indicator - a discrete progress bar split
 * into N segments. Reusable outside the stepper (lightboxes, carousels,
 * onboarding), so it carries zero stepper dependency and no async
 * semantics - distinct from the continuous `<cngx-progress>` loading bar.
 *
 * Drive it positionally with `[value]` / `[total]` (the segment states
 * derive automatically), or hand it an explicit `[segments]` array when
 * you need per-segment control (e.g. an `error` segment). ARIA
 * (`role="progressbar"` + the `aria-value*` set + `aria-valuetext`) lives
 * in the `computed()` graph (Pillar 2).
 *
 * ```html
 * <cngx-segmented-progress [value]="3" [total]="8" />
 * <cngx-segmented-progress [segments]="['done', 'error', 'active', 'todo']" />
 * ```
 *
 * @category common/display
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/segmented-progress/segmented-progress.component.ts
 * @since 0.1.0
 * @relatedTo CngxStepper, CngxBadge
 * <example-url>http://localhost:4200/#/common/display/segmented-progress/value-total</example-url>
 * <example-url>http://localhost:4200/#/common/display/segmented-progress/lightbox-position</example-url>
 * <example-url>http://localhost:4200/#/common/display/segmented-progress/error-segment</example-url>
 */
@Component({
  selector: 'cngx-segmented-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-segmented-progress',
    role: 'progressbar',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'now()',
    '[attr.aria-valuetext]': 'valueText()',
  },
  template: `
    @for (segment of resolvedSegments(); track $index) {
      <span
        class="cngx-segmented-progress__segment"
        [attr.data-state]="segment"
        aria-hidden="true"
      ></span>
    }
  `,
  styleUrl: './segmented-progress.css',
})
export class CngxSegmentedProgress {
  /** Number of completed positions (0-based count). Drives derivation. */
  readonly value = input<number>(0);

  /** Total number of segments when deriving from `[value]`. */
  readonly total = input<number>(0);

  /**
   * Explicit per-segment states. When set, wins over `[value]`/`[total]`
   * derivation - use it for an `error` segment or any non-linear layout.
   */
  readonly segments = input<readonly SegmentState[] | undefined>(undefined);

  /**
   * Override the `aria-valuetext` string. Receives `(now, max)` - the
   * completed-segment count and the total segment count. Mirrors
   * `CngxStepperCount.format`; the default is `(now, max) => \`${now} of
   * ${max}\``. Supply a localised closure for non-English position text
   * (e.g. `(n, m) => \`Schritt ${n} von ${m}\``).
   */
  readonly valueTextFormat = input<((now: number, max: number) => string) | undefined>(undefined);

  /** Segments actually rendered: explicit when supplied, else derived. */
  readonly resolvedSegments: Signal<readonly SegmentState[]> = computed(
    () => {
      const explicit = this.segments();
      if (explicit) {
        return explicit;
      }
      const total = Math.max(0, Math.trunc(this.total()));
      const value = Math.max(0, Math.min(Math.trunc(this.value()), total));
      return Array.from({ length: total }, (_, i): SegmentState =>
        i < value ? 'done' : i === value ? 'active' : 'todo',
      );
    },
    { equal: segmentsEqual },
  );

  /** `aria-valuemax` - segment count. */
  protected readonly max: Signal<number> = computed(() => this.resolvedSegments().length);

  /** `aria-valuenow` - count of completed (`done`) segments; the active in-progress segment is not counted. */
  protected readonly now: Signal<number> = computed(() => {
    const explicit = this.segments();
    if (explicit) {
      return explicit.filter((s) => s === 'done').length;
    }
    return Math.max(0, Math.min(Math.trunc(this.value()), this.max()));
  });

  /** `aria-valuetext` - human-readable position via the resolved format closure. */
  protected readonly valueText: Signal<string> = computed(() => {
    const fmt = this.valueTextFormat() ?? ((now: number, max: number) => `${now} of ${max}`);
    return fmt(this.now(), this.max());
  });
}
