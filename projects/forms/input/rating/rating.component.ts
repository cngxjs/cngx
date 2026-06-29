import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { CngxLiveAnnouncer, CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';
import {
  CngxFormFieldPresenter,
  CNGX_FORM_FIELD_CONTROL,
  type CngxFormFieldControl,
} from '@cngx/forms/field';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from '../input-config';
import { CngxRatingItem, type CngxRatingItemContext } from './rating-item.directive';

/**
 * Minimal internal fallback glyphs. Not exported - the consumer's override
 * surface is the `*cngxRatingItem` slot, never a shipped icon component.
 *
 * @internal
 */
const CNGX_RATING_GLYPHS = {
  full: '★', // ★
  empty: '☆', // ☆
} as const;

/**
 * Star/heart rating value control for `cngx-form-field`.
 *
 * Renders its own strip of `role="radio"` buttons inside a roving-tabindex
 * container, so arrow keys move and auto-select across stars and the value is a
 * positional number (`value >= step` drives cumulative fill). It composes the
 * roving keyboard engine ({@link CngxRovingTabindex} + {@link CngxRovingItem})
 * rather than reinventing navigation, and provides {@link CNGX_FORM_FIELD_CONTROL}
 * so it drops straight into `<cngx-form-field>`.
 *
 * The per-star glyph is a consumer slot (`*cngxRatingItem`); the control ships a
 * minimal internal default and no icon component. The chosen value is announced
 * through a polite live region on every committed change.
 *
 * ```html
 * <cngx-form-field [field]="f.score">
 *   <cngx-rating [(value)]="score" [max]="5" />
 * </cngx-form-field>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/rating/rating.component.ts
 * @since 0.1.0
 * @relatedTo CngxRatingItem, CngxRovingTabindex, withInputAriaLabels, CngxFormField
 * <example-url>http://localhost:4200/#/forms/input/rating/basic</example-url>
 */
@Component({
  selector: 'cngx-rating',
  standalone: true,
  exportAs: 'cngxRating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxRovingTabindex, CngxRovingItem],
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxRating }],
  host: {
    role: 'radiogroup',
    '[id]': 'id()',
    '[attr.aria-label]': 'ariaLabelAttr()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.cngx-rating--disabled]': 'disabled()',
    '[class.cngx-rating--focused]': 'focused()',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut($event)',
  },
  template: `
    <div class="cngx-rating__items" cngxRovingTabindex>
      @for (step of steps(); track step; let i = $index) {
        <button
          type="button"
          class="cngx-rating__item"
          role="radio"
          cngxRovingItem
          [cngxRovingItemDisabled]="disabled()"
          [attr.aria-checked]="value() === step"
          [attr.aria-posinset]="i + 1"
          [attr.aria-setsize]="steps().length"
          [attr.aria-label]="itemLabel(step)"
          [attr.aria-disabled]="disabled() ? 'true' : null"
          (click)="select(step)"
          (focus)="onItemFocus(step)"
        >
          @if (itemTemplate(); as tpl) {
            <ng-container
              [ngTemplateOutlet]="tpl"
              [ngTemplateOutletContext]="itemContext(step, i)"
            />
          } @else {
            <span aria-hidden="true">{{ value() >= step ? glyphs.full : glyphs.empty }}</span>
          }
        </button>
      }
    </div>
    <span
      class="cngx-rating__disabled-reason"
      [id]="reasonId"
      [attr.aria-hidden]="disabled() ? null : 'true'"
      >{{ disabledReason() }}</span
    >
  `,
  styleUrl: './rating.component.css',
})
export class CngxRating implements CngxFormFieldControl {
  /** Current rating. Two-way bindable; `0` means unrated. */
  readonly value = model<number>(0);

  /** Highest selectable rating - the number of whole stars. Default `5`. */
  readonly max = input<number>(5);

  /** When `true`, the strip offers half-star steps (`0.5`, `1`, `1.5`, ...). */
  readonly allowHalf = input<boolean>(false);

  /** Disables every star - selection no-ops and arrow navigation skips them. */
  readonly disabled = model<boolean>(false);

  /**
   * Accessible label used when the control is standalone (no `cngx-form-field`).
   * Inside a field the external label wins via `aria-labelledby`.
   */
  readonly ariaLabel = input<string>('');

  /** Reason announced via `aria-describedby` while the control is disabled. */
  readonly disabledReason = input<string>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly roving = viewChild(CngxRovingTabindex);

  /** @internal Fallback glyphs reached when no `*cngxRatingItem` slot is set. */
  protected readonly glyphs = CNGX_RATING_GLYPHS;

  /** @internal Stable id for the always-present disabled-reason span. */
  protected readonly reasonId = nextUid('cngx-rating-reason-');
  private readonly fallbackId = nextUid('cngx-rating-');

  /** @internal Consumer glyph override, resolved once via content projection. */
  protected readonly itemTemplate = contentChild(CngxRatingItem, { read: TemplateRef });

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  readonly id = computed(() => this.presenter?.inputId() ?? this.fallbackId);
  readonly empty = computed(() => this.value() === 0);
  readonly errorState = computed(() => this.presenter?.showError() ?? false);

  /**
   * The selectable steps. A pure function of `max`/`allowHalf` carrying an
   * explicit `equal` so it only re-emits when those inputs change.
   */
  readonly steps = computed<number[]>(
    () => {
      const max = this.max();
      const increment = this.allowHalf() ? 0.5 : 1;
      const out: number[] = [];
      for (let step = increment; step <= max; step += increment) {
        out.push(step);
      }
      return out;
    },
    { equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]) },
  );

  /** @internal */
  protected readonly labelledBy = computed(() => this.presenter?.labelId() ?? null);
  /** @internal */
  protected readonly ariaLabelAttr = computed(() =>
    this.presenter ? null : this.ariaLabel() || null,
  );
  /** @internal */
  protected readonly ariaRequired = computed(() => (this.presenter?.required() ? true : null));
  /** @internal */
  protected readonly ariaInvalid = computed(() => (this.presenter?.showError() ? true : null));
  /** @internal */
  protected readonly ariaDisabled = computed(() => (this.disabled() ? true : null));
  /** @internal IDs always present; the span itself toggles `aria-hidden`. */
  protected readonly describedBy = computed(() => {
    const fieldIds = this.presenter?.describedBy();
    return fieldIds ? `${fieldIds} ${this.reasonId}` : this.reasonId;
  });

  constructor() {
    // Bidirectional Field <-> value() sync, mirroring the select family's
    // createFieldSync: two effects with untracked reads on the opposite branch
    // and a numeric equality guard as the cycle break. Both the field and the
    // value model are writable sources of truth, so this is coordination, not a
    // single computed. No-op when there is no surrounding form field.
    if (this.presenter) {
      const presenter = this.presenter;
      effect(() => {
        const fieldRef = presenter.fieldState();
        const next = this.coerceFromField(fieldRef.value());
        untracked(() => {
          if (this.value() !== next) {
            this.value.set(next);
          }
        });
      });

      effect(() => {
        const next = this.value();
        untracked(() => {
          const fieldRef = presenter.fieldState();
          if (this.coerceFromField(fieldRef.value()) === next) {
            return;
          }
          const signalLike = fieldRef.value as unknown;
          if (
            typeof signalLike === 'function' &&
            'set' in signalLike &&
            typeof (signalLike as { set: unknown }).set === 'function'
          ) {
            (signalLike as { set: (v: unknown) => void }).set(next);
          }
        });
      });
    }
  }

  /** @internal Coerces an unknown field value into the numeric rating shape. */
  private coerceFromField(fieldValue: unknown): number {
    return typeof fieldValue === 'number' ? fieldValue : 0;
  }

  /** @internal */
  protected itemLabel(step: number): string {
    return `${step}`;
  }

  /** @internal */
  protected itemContext(step: number, index: number): CngxRatingItemContext {
    return {
      index,
      filled: this.value() >= step,
      half: this.allowHalf() && this.value() === step - 0.5,
    };
  }

  /** @internal Click selection. */
  protected select(step: number): void {
    if (this.disabled()) {
      return;
    }
    this.commit(step);
  }

  /**
   * @internal Auto-selects when focus arrived via an arrow key. Reads the
   * roving engine's one-shot navigation handshake from the leaf's own `(focus)`
   * - a DOM-event signal write, never an effect.
   */
  protected onItemFocus(step: number): void {
    if (this.disabled()) {
      return;
    }
    if (this.roving()?.consumeNavigationKey()) {
      this.commit(step);
    }
  }

  /** @internal */
  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  /** @internal */
  protected handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!this.host.nativeElement.contains(next)) {
      this.focusedState.set(false);
    }
  }

  focus(options?: FocusOptions): void {
    const buttons =
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.cngx-rating__item');
    const value = this.value();
    const steps = this.steps();
    const activeIndex = value > 0 ? steps.indexOf(value) : 0;
    buttons[activeIndex >= 0 ? activeIndex : 0]?.focus(options);
  }

  /** Writes the value and announces it - only when the value actually changes. */
  private commit(step: number): void {
    if (this.value() === step) {
      return;
    }
    this.value.set(step);
    const factory = this.config.ariaLabels?.ratingValue ?? DEFAULT_INPUT_ARIA_LABELS.ratingValue;
    this.announcer.announce(factory(step, this.max()));
  }
}
