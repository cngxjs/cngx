import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';

/**
 * Auto-resize textarea based on content.
 *
 * Signal-first alternative to `cdkTextareaAutosize`. Measures via the `scrollHeight` trick
 * and reacts to `input` events + `ResizeObserver` for programmatic value changes.
 *
 * ```html
 * <textarea cngxAutosize [minRows]="2" [maxRows]="10" #auto="cngxAutosize"></textarea>
 * <span>Height: {{ auto.height() }}px</span>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/autosize.directive.ts
 * @since 0.1.0
 * @relatedTo CngxInput, CngxCharCount
 * <example-url>http://localhost:4200/#/forms/input/autosize/basic-autosize</example-url>
 * <example-url>http://localhost:4200/#/forms/input/autosize/min-max-rows</example-url>
 */
@Directive({
  selector: 'textarea[cngxAutosize]',
  standalone: true,
  exportAs: 'cngxAutosize',
  host: {
    '(input)': 'resize()',
    '[style.overflow-y]': 'overflowY()',
    '[style.resize]': '"none"',
    '[style.box-sizing]': '"border-box"',
  },
})
export class CngxAutosize {
  private readonly el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Minimum number of rows. */
  readonly minRows = input<number>(1);

  /** Maximum number of rows. `undefined` = unlimited. */
  readonly maxRows = input<number | undefined>(undefined);

  private readonly heightState = signal(0);
  private lineHeight = 0;
  private paddingTop = 0;
  private paddingBottom = 0;
  private borderTop = 0;
  private borderBottom = 0;

  /** Current computed height in px. */
  readonly height: Signal<number> = this.heightState.asReadonly();

  /** @internal */
  protected readonly overflowY = computed(() => {
    const maxR = this.maxRows();
    if (maxR == null) {
      return 'hidden';
    }
    const maxH = this.computeMaxHeight(maxR);
    return this.heightState() >= maxH ? 'auto' : 'hidden';
  });

  constructor() {
    afterNextRender(() => {
      this.measureMetrics();
      this.resize();
      this.observeResize();
    });
  }

  /** Force recalculation of the textarea height. */
  resize(): void {
    const el = this.el.nativeElement;
    const minH = this.computeMinHeight(this.minRows());
    const maxH = this.maxRows() != null ? this.computeMaxHeight(this.maxRows()!) : Infinity;

    // Collapse to read scrollHeight, then restore.
    const prevHeight = el.style.height;
    el.style.height = '0px';
    const scrollH = el.scrollHeight;
    el.style.height = prevHeight;

    const targetH = Math.min(Math.max(scrollH, minH), maxH);
    el.style.height = `${targetH}px`;
    this.heightState.set(targetH);
  }

  private measureMetrics(): void {
    const style = getComputedStyle(this.el.nativeElement);
    this.lineHeight =
      Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
    this.paddingTop = Number.parseFloat(style.paddingTop) || 0;
    this.paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
    this.borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    this.borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
  }

  private computeMinHeight(rows: number): number {
    return (
      rows * this.lineHeight +
      this.paddingTop +
      this.paddingBottom +
      this.borderTop +
      this.borderBottom
    );
  }

  private computeMaxHeight(rows: number): number {
    return (
      rows * this.lineHeight +
      this.paddingTop +
      this.paddingBottom +
      this.borderTop +
      this.borderBottom
    );
  }

  private observeResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      this.measureMetrics();
      this.resize();
    });
    observer.observe(this.el.nativeElement);

    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
