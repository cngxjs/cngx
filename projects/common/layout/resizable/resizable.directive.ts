import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, Directive, inject, input, model, signal } from '@angular/core';
import { injectDirection } from '@cngx/core';
import { clamp } from '@cngx/utils';

import { injectLayoutI18n } from '../i18n/layout-i18n';

/**
 * Which inline edge of the resized panel the handle sits on. Logical, so the
 * drag and arrow-key direction follow the writing direction.
 *
 * @since 0.1.0
 */
export type CngxResizableEdge = 'inline-start' | 'inline-end';

/**
 * A resize handle for a side panel: the WAI-ARIA window-splitter pattern on
 * the handle element.
 *
 * The handle owns no layout. It reads and writes `size` (px) through a
 * two-way binding; the consumer applies the size to the panel (an inline
 * size or a custom property). Pointer drag runs with pointer capture and
 * writes at most once per animation frame. The keyboard path makes the handle
 * operable without a pointer (WCAG 2.1.1): Arrow Left / Right move the handle
 * by `step`, Home / End jump to `min` / `max`. Modified keys pass through.
 *
 * `edge` names the panel edge the handle sits on: `inline-end` for a panel at
 * the start of the row (the handle grows the panel toward the end),
 * `inline-start` for a panel at the end. Under `dir="rtl"` the physical
 * directions flip with the writing direction.
 *
 * ARIA lives in the `computed()` graph: `role="separator"`,
 * `aria-orientation="vertical"`, `aria-valuenow` / `-min` / `-max`,
 * `aria-valuetext` and `aria-label` (copy from `CNGX_LAYOUT_I18N` unless the
 * `label` / `valueText` inputs are bound).
 *
 * ```html
 * <aside [style.inline-size.px]="width()">…</aside>
 * <div cngxResizable [(size)]="width" [min]="200" [max]="480"></div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/resizable/resizable.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSidebar, CngxDrawerPanel, CNGX_LAYOUT_I18N
 * <example-url>/#/common/layout/resizable/side-panel</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxResizable]',
  exportAs: 'cngxResizable',
  standalone: true,
  host: {
    role: 'separator',
    tabindex: '0',
    'aria-orientation': 'vertical',
    '[attr.aria-valuenow]': 'valueNow()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuetext]': 'resolvedValueText()',
    '[attr.aria-label]': 'resolvedLabel()',
    '[class.cngx-resizable--resizing]': 'resizing()',
    '(keydown)': 'handleKeydown($event)',
    '(pointerdown)': 'handlePointerDown($event)',
  },
})
export class CngxResizable {
  /** Size of the resized panel in px. Two-way: `[(size)]="width"`. */
  readonly size = model.required<number>();
  /** Smallest size in px a drag or key can reach. */
  readonly min = input<number>(120);
  /** Largest size in px a drag or key can reach. */
  readonly max = input<number>(600);
  /** The panel edge the handle sits on; sets the drag and arrow-key direction. */
  readonly edge = input<CngxResizableEdge>('inline-end');
  /** Size change in px per arrow-key press. */
  readonly step = input<number>(16);
  /** Accessible name of the handle. Falls back to `CNGX_LAYOUT_I18N.resizeHandle`. */
  readonly label = input<string | undefined>(undefined);
  /**
   * `aria-valuetext` for a px size. Falls back to
   * `CNGX_LAYOUT_I18N.resizeValueText`.
   */
  readonly valueText = input<((size: number) => string) | undefined>(undefined);

  private readonly doc = inject(DOCUMENT);
  private readonly direction = injectDirection();
  private readonly i18n = injectLayoutI18n();
  private readonly resizingState = signal(false);
  private dragAbort: AbortController | null = null;

  /** Whether a pointer drag is in progress. */
  readonly resizing = this.resizingState.asReadonly();

  protected readonly valueNow = computed(() => Math.round(this.clamped(this.size())));
  protected readonly resolvedLabel = computed(() => this.label() ?? this.i18n().resizeHandle);
  protected readonly resolvedValueText = computed(() => {
    const format = this.valueText() ?? this.i18n().resizeValueText;
    return format(this.valueNow());
  });

  /** +1 when moving the handle physically right grows the panel, else -1. */
  private readonly growSign = computed(() => {
    const endIsRight = this.direction() !== 'rtl';
    const onRight = this.edge() === 'inline-end' ? endIsRight : !endIsRight;
    return onRight ? 1 : -1;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dragAbort?.abort());
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      return;
    }
    const target = this.keyTarget(event.key);
    if (target === null) {
      return;
    }
    event.preventDefault();
    this.size.set(Math.round(this.clamped(target)));
  }

  protected handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture?.(event.pointerId);

    this.dragAbort?.abort();
    const controller = new AbortController();
    this.dragAbort = controller;
    this.resizingState.set(true);

    const startX = event.clientX;
    const startSize = this.size();
    const sign = this.growSign();
    const view = this.doc.defaultView;
    let pending = startSize;
    let frame = 0;

    const flush = (): void => {
      frame = 0;
      this.size.set(pending);
    };
    const onMove = (ev: PointerEvent): void => {
      pending = Math.round(this.clamped(startSize + (ev.clientX - startX) * sign));
      if (!frame) {
        frame = view?.requestAnimationFrame(flush) ?? 0;
      }
    };
    const onEnd = (): void => {
      if (frame) {
        view?.cancelAnimationFrame(frame);
      }
      flush();
      this.resizingState.set(false);
      controller.abort();
      if (this.dragAbort === controller) {
        this.dragAbort = null;
      }
    };

    const options = { signal: controller.signal };
    this.doc.addEventListener('pointermove', onMove, options);
    this.doc.addEventListener('pointerup', onEnd, options);
    this.doc.addEventListener('pointercancel', onEnd, options);
  }

  private keyTarget(key: string): number | null {
    const current = this.size();
    const step = this.step() * this.growSign();
    switch (key) {
      case 'ArrowRight':
        return current + step;
      case 'ArrowLeft':
        return current - step;
      case 'Home':
        return this.min();
      case 'End':
        return this.max();
      default:
        return null;
    }
  }

  private clamped(value: number): number {
    return clamp(value, this.min(), this.max());
  }
}
