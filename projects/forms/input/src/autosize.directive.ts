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
 * @example
 * ```html
 * <textarea cngxAutosize [minRows]="2" [maxRows]="10" #auto="cngxAutosize"></textarea>
 * <span>Height: {{ auto.height() }}px</span>
 * ```
 *
 * @category directives
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

  // ── Inputs ──────────────────────────────────────────────────────────

  /** Minimum number of rows. */
  readonly minRows = input<number>(1);

  /** Maximum number of rows. `undefined` = unlimited. */
  readonly maxRows = input<number | undefined>(undefined);

  // ── Internal state ──────────────────────────────────────────────────

  private readonly heightState = signal(0);
  private lineHeight = 0;
  private paddingTop = 0;
  private paddingBottom = 0;
  private borderTop = 0;
  private borderBottom = 0;

  // ── Public signals ──────────────────────────────────────────────────

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

  // ── Public methods ──────────────────────────────────────────────────

  /** Force recalculation of the textarea height. */
  resize(): void {
    const el = this.el.nativeElement;
    const minH = this.computeMinHeight(this.minRows());
    const maxH = this.maxRows() != null ? this.computeMaxHeight(this.maxRows()!) : Infinity;

    // Measure scrollHeight by temporarily collapsing
    const prevHeight = el.style.height;
    el.style.height = '0px';
    const scrollH = el.scrollHeight;
    el.style.height = prevHeight;

    const targetH = Math.min(Math.max(scrollH, minH), maxH);
    el.style.height = `${targetH}px`;
    this.heightState.set(targetH);
  }

  // ── Private ─────────────────────────────────────────────────────────

  private measureMetrics(): void {
    const style = getComputedStyle(this.el.nativeElement);
    this.lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    this.paddingTop = parseFloat(style.paddingTop) || 0;
    this.paddingBottom = parseFloat(style.paddingBottom) || 0;
    this.borderTop = parseFloat(style.borderTopWidth) || 0;
    this.borderBottom = parseFloat(style.borderBottomWidth) || 0;
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
