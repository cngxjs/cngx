import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Opt-in drag behavior for `CngxDialog`.
 *
 * Uses Pointer Events for unified mouse/touch handling. Position is exposed
 * as CSS custom properties `--cngx-dialog-x` and `--cngx-dialog-y` — the
 * consumer applies the transform via CSS.
 *
 * Keyboard-based moving is mandatory for accessibility:
 * - Arrow keys move 10px
 * - Shift + Arrow moves 50px
 * - Home resets to origin
 *
 * @usageNotes
 * ```html
 * <dialog cngxDialog cngxDialogDraggable>
 *   <div class="dialog-header" #handle>Title</div>
 *   …
 * </dialog>
 * ```
 *
 * ```css
 * dialog[cngxDialogDraggable] {
 *   transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px));
 * }
 * ```
 *
 * @category dialog
 */
@Directive({
  selector: '[cngxDialogDraggable]',
  exportAs: 'cngxDialogDraggable',
  standalone: true,
  host: {
    '[style.--cngx-dialog-x]': 'cssX()',
    '[style.--cngx-dialog-y]': 'cssY()',
    '[class.cngx-dialog--dragging]': 'isDragging()',
  },
})
export class CngxDialogDraggable {
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Handle element for initiating drag. If not set, entire dialog is the handle. */
  readonly handle = input<HTMLElement | undefined>(undefined);

  /** Clamp position to viewport bounds. */
  readonly constrainToViewport = input(false);

  /**
   * Snap position to a grid in pixels.
   *
   * When set to a positive number, the dialog position snaps to the nearest
   * grid increment. When `snapMode` is `'live'`, snapping happens during drag.
   * When `'release'`, position is free during drag and snaps on pointer up.
   *
   * @defaultValue `0` (no grid)
   */
  readonly gridSize = input(0);

  /**
   * When to apply grid snapping.
   *
   * - `'live'` — position snaps continuously during drag (default)
   * - `'release'` — position is free during drag, snaps on pointer up
   *
   * @defaultValue `'live'`
   */
  readonly snapMode = input<'live' | 'release'>('live');

  // ── State ─────────────────────────────────────────────────────────
  private readonly positionState = signal({ x: 0, y: 0 });
  private readonly draggingState = signal(false);

  /** Current offset position. */
  readonly position = this.positionState.asReadonly();

  /** Whether a drag operation is in progress. */
  readonly isDragging = this.draggingState.asReadonly();

  protected readonly cssX = computed(() => `${this.positionState().x}px`);
  protected readonly cssY = computed(() => `${this.positionState().y}px`);

  // ── Drag state (not reactive — perf critical) ─────────────────────
  private dragStartX = 0;
  private dragStartY = 0;
  private posStartX = 0;
  private posStartY = 0;
  private boundMove: ((e: PointerEvent) => void) | null = null;
  private boundUp: ((e: PointerEvent) => void) | null = null;

  constructor() {
    // Wire handle events after render
    effect(() => {
      const handleEl = this.handle() ?? this.elRef.nativeElement;
      this.setupHandle(handleEl);
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  // ── Private ───────────────────────────────────────────────────────

  private currentHandle: HTMLElement | null = null;
  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;

  /** Attach pointer and keyboard listeners to `el`, cleaning up the previous handle first. */
  private setupHandle(el: HTMLElement): void {
    // Clean up previous handle
    if (this.currentHandle && this.boundPointerDown) {
      this.currentHandle.removeEventListener('pointerdown', this.boundPointerDown);
    }
    if (this.currentHandle && this.boundKeyDown) {
      this.currentHandle.removeEventListener('keydown', this.boundKeyDown);
    }

    this.currentHandle = el;

    // A11y: make handle focusable and describe as draggable
    if (!el.hasAttribute('tabindex') && el !== this.elRef.nativeElement) {
      el.setAttribute('tabindex', '0');
    }
    if (!el.hasAttribute('aria-roledescription') && el !== this.elRef.nativeElement) {
      el.setAttribute('aria-roledescription', 'draggable');
      el.setAttribute('aria-label', 'Move dialog');
    }
    el.style.cursor = 'var(--cngx-dialog-drag-cursor, grab)';
    el.style.touchAction = 'none';

    this.boundPointerDown = (e: PointerEvent) => this.handlePointerDown(e);
    this.boundKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    el.addEventListener('pointerdown', this.boundPointerDown);
    el.addEventListener('keydown', this.boundKeyDown);
  }

  private handlePointerDown(event: PointerEvent): void {
    // Only primary button
    if (event.button !== 0) {
      return;
    }

    // Don't drag if the target is an interactive element inside the handle
    const target = event.target as HTMLElement;
    if (
      target.closest('button, a, input, select, textarea, [tabindex]') &&
      target !== this.currentHandle
    ) {
      return;
    }

    event.preventDefault();
    (this.currentHandle ?? this.elRef.nativeElement).setPointerCapture(event.pointerId);

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.posStartX = this.positionState().x;
    this.posStartY = this.positionState().y;
    this.draggingState.set(true);

    // Prevent text selection during drag
    this.doc.documentElement.style.userSelect = 'none';
    if (this.currentHandle) {
      this.currentHandle.style.cursor = 'var(--cngx-dialog-dragging-cursor, grabbing)';
    }

    this.boundMove = (e: PointerEvent) => this.handlePointerMove(e);
    this.boundUp = (e: PointerEvent) => this.handlePointerUp(e);
    this.doc.addEventListener('pointermove', this.boundMove);
    this.doc.addEventListener('pointerup', this.boundUp);
  }

  private handlePointerMove(event: PointerEvent): void {
    let x = this.posStartX + (event.clientX - this.dragStartX);
    let y = this.posStartY + (event.clientY - this.dragStartY);

    if (this.constrainToViewport()) {
      const win = this.doc.defaultView;
      if (win) {
        const rect = this.elRef.nativeElement.getBoundingClientRect();
        const baseX = rect.left - this.positionState().x;
        const baseY = rect.top - this.positionState().y;

        x = Math.max(-baseX, Math.min(x, win.innerWidth - baseX - rect.width));
        y = Math.max(-baseY, Math.min(y, win.innerHeight - baseY - rect.height));
      }
    }

    if (this.gridSize() > 0 && this.snapMode() === 'live') {
      ({ x, y } = this.snap(x, y));
    }

    this.positionState.set({ x, y });
  }

  private handlePointerUp(event: PointerEvent): void {
    (this.currentHandle ?? this.elRef.nativeElement).releasePointerCapture(event.pointerId);
    this.draggingState.set(false);
    this.doc.documentElement.style.userSelect = '';
    if (this.currentHandle) {
      this.currentHandle.style.cursor = 'var(--cngx-dialog-drag-cursor, grab)';
    }

    // Snap to grid on release
    if (this.gridSize() > 0 && this.snapMode() === 'release') {
      const { x, y } = this.positionState();
      this.positionState.set(this.snap(x, y));
    }

    if (this.boundMove) {
      this.doc.removeEventListener('pointermove', this.boundMove);
    }
    if (this.boundUp) {
      this.doc.removeEventListener('pointerup', this.boundUp);
    }
    this.boundMove = null;
    this.boundUp = null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const grid = this.gridSize();
    // When grid is active, Arrow keys step by grid size (Shift = 5x grid)
    const step = grid > 0 ? (event.shiftKey ? grid * 5 : grid) : event.shiftKey ? 50 : 10;
    const { x, y } = this.positionState();

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.positionState.set(this.snap(x - step, y));
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.positionState.set(this.snap(x + step, y));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.positionState.set(this.snap(x, y - step));
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.positionState.set(this.snap(x, y + step));
        break;
      case 'Home':
        event.preventDefault();
        this.positionState.set({ x: 0, y: 0 });
        break;
    }
  }

  /** Snap `x`/`y` to the nearest `gridSize` increment. Pass-through when grid is disabled. */
  private snap(x: number, y: number): { x: number; y: number } {
    const grid = this.gridSize();
    if (grid <= 0) {
      return { x, y };
    }
    return {
      x: Math.round(x / grid) * grid,
      y: Math.round(y / grid) * grid,
    };
  }

  private cleanup(): void {
    if (this.boundMove) {
      this.doc.removeEventListener('pointermove', this.boundMove);
    }
    if (this.boundUp) {
      this.doc.removeEventListener('pointerup', this.boundUp);
    }
    if (this.currentHandle && this.boundPointerDown) {
      this.currentHandle.removeEventListener('pointerdown', this.boundPointerDown);
    }
    if (this.currentHandle && this.boundKeyDown) {
      this.currentHandle.removeEventListener('keydown', this.boundKeyDown);
    }
  }
}
