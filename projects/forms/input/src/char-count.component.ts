import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CngxFormFieldPresenter } from '@cngx/forms/field';

/**
 * Live character counter for text inputs inside a `cngx-form-field`.
 *
 * Listens to DOM `input` events on the sibling input element for reliable,
 * framework-agnostic value tracking. Falls back to reading from the
 * FieldState value signal if no DOM input is found.
 *
 * Pass `[max]` / `[min]` explicitly or let the component read them from
 * the presenter's constraint metadata.
 *
 * @example Basic (auto-wired)
 * ```html
 * <cngx-form-field [field]="bioField">
 *   <textarea cngxInput [formField]="bioField"></textarea>
 *   <cngx-char-count [max]="140" />
 * </cngx-form-field>
 * ```
 *
 * @example Custom template
 * ```html
 * <cngx-char-count [max]="140">
 *   <ng-template let-current="current" let-remaining="remaining" let-over="over">
 *     {{ remaining }} characters remaining
 *   </ng-template>
 * </cngx-char-count>
 * ```
 *
 * @category components
 */
@Component({
  selector: 'cngx-char-count',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `@if (customTpl()) {
    <ng-container *ngTemplateOutlet="customTpl()!; context: tplContext()" />
  } @else if (resolvedMax() != null) {
    <span>{{ currentLength() }}/{{ resolvedMax() }}</span>
  } @else if (resolvedMin() != null) {
    <span>{{ currentLength() }} (min {{ resolvedMin() }})</span>
  }`,
  styles: `
    :host {
      display: contents;
      font-size: var(--cngx-field-char-count-font-size, 0.75rem);
      color: var(--cngx-field-char-count-color, var(--cngx-field-hint-color, #666));
    }
    :host(.cngx-char-count--over) {
      color: var(--cngx-field-char-count-over-color, var(--cngx-field-error-color, #d32f2f));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cngxCharCount',
  host: {
    '[class.cngx-char-count--over]': 'isOver()',
    'aria-hidden': 'true',
  },
})
export class CngxCharCount {
  private readonly presenter = inject(CngxFormFieldPresenter);
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Optional custom template. */
  protected readonly customTpl = contentChild<TemplateRef<CngxCharCountContext>>(TemplateRef);

  /** Explicit max length. Falls back to presenter's maxLength. */
  readonly max = input<number | undefined>(undefined);
  /** Explicit min length. Falls back to presenter's minLength. */
  readonly min = input<number | undefined>(undefined);

  /** @internal */
  protected readonly resolvedMax = computed(() => this.max() ?? this.presenter.maxLength());
  /** @internal */
  protected readonly resolvedMin = computed(() => this.min() ?? this.presenter.minLength());

  /** @internal — current character count, updated via DOM input events. */
  private readonly lengthState = signal(0);
  protected readonly currentLength = this.lengthState.asReadonly();

  /** Whether current length exceeds maxLength. */
  readonly isOver = computed(() => {
    const max = this.resolvedMax();
    return max != null && this.currentLength() > max;
  });

  /** @internal */
  protected readonly tplContext = computed<CngxCharCountContext>(() => ({
    $implicit: this.currentLength(),
    current: this.currentLength(),
    max: this.resolvedMax(),
    min: this.resolvedMin(),
    over: this.isOver(),
    remaining: this.resolvedMax() != null ? this.resolvedMax()! - this.currentLength() : undefined,
  }));

  constructor() {
    afterNextRender(() => {
      // Find the input/textarea sibling in the same cngx-form-field
      const host = this.el.nativeElement as HTMLElement;
      const formField = host.closest('cngx-form-field') ?? host.parentElement;
      const inputEl = formField?.querySelector('input, textarea, select') as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;

      if (!inputEl) {
        return;
      }

      // Sync initial value
      this.lengthState.set(inputEl.value.length);

      // Listen for input events
      const handler = () => this.lengthState.set(inputEl.value.length);
      inputEl.addEventListener('input', handler);
      this.destroyRef.onDestroy(() => inputEl.removeEventListener('input', handler));
    });
  }
}

/** Template context type for CngxCharCount custom templates. */
export interface CngxCharCountContext {
  /** Current character count (also available as implicit `let-count`). */
  $implicit: number;
  /** Current character count. */
  current: number;
  /** Max length constraint, or undefined. */
  max: number | undefined;
  /** Min length constraint, or undefined. */
  min: number | undefined;
  /** Whether the value exceeds maxLength. */
  over: boolean;
  /** Characters remaining until maxLength, or undefined. */
  remaining: number | undefined;
}
