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
  untracked,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { CNGX_DIALOG_ARIA_REGISTRY } from '../dialog/dialog-aria-registry';
import { applySrOnly } from '../dialog/sr-only';

/**
 * Opt-in drag behavior for `CngxDialog`.
 *
 * Uses Pointer Events for unified mouse/touch handling. Position is exposed
 * as CSS custom properties `--cngx-dialog-x` and `--cngx-dialog-y` - the
 * consumer applies the transform via CSS.
 *
 * Keyboard-based moving is mandatory for accessibility:
 * - Arrow keys move 10px
 * - Shift + Arrow moves 50px
 * - Home resets to origin
 *
 * Keys move the dialog only while the handle element itself has focus -
 * arrows inside form fields keep moving the caret. Without an explicit
 * `[handle]` the dialog element becomes focusable (`tabindex="0"`) and is
 * the keyboard drag surface.
 *
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
 * @category common/dialog
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/draggable/dialog-draggable.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDialog, CngxBottomSheet
 * <example-url>http://localhost:4200/#/common/dialog/alert-dialog</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/bottom-sheet</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/cngxdialogopener-programmatic</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/draggable-dialog</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/fully-declarative</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/grid-snap-live-vs-release</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/nested-dialogs-cngxdialogstack</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/non-modal-panel</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/programmatic-control</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/template-directives</example-url>
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
  private readonly ariaRegistry = inject(CNGX_DIALOG_ARIA_REGISTRY, { optional: true });

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
   * - `'live'` - position snaps continuously during drag (default)
   * - `'release'` - position is free during drag, snaps on pointer up
   *
   * @defaultValue `'live'`
   */
  readonly snapMode = input<'live' | 'release'>('live');

  // equal keeps live grid-snap quiet: every pointermove produces a fresh
  // {x, y} literal, and under snapping most of them carry identical values.
  private readonly positionState = signal(
    { x: 0, y: 0 },
    { equal: (a, b) => a.x === b.x && a.y === b.y },
  );
  private readonly draggingState = signal(false);

  /** Current offset position. */
  readonly position = this.positionState.asReadonly();

  /** Whether a drag operation is in progress. */
  readonly isDragging = this.draggingState.asReadonly();

  protected readonly cssX = computed(() => `${this.positionState().x}px`);
  protected readonly cssY = computed(() => `${this.positionState().y}px`);

  // Drag state - not reactive, perf critical (pointermove runs at framerate).
  private dragStartX = 0;
  private dragStartY = 0;
  private posStartX = 0;
  private posStartY = 0;
  private boundMove: ((e: PointerEvent) => void) | null = null;
  private boundUp: ((e: PointerEvent) => void) | null = null;

  constructor() {
    effect(() => {
      const handleEl = this.handle() ?? this.elRef.nativeElement;
      // untracked: setupHandle registers with the dialog's aria registry -
      // a signal write that must not become a tracked dependency.
      untracked(() => this.setupHandle(handleEl));
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  private currentHandle: HTMLElement | null = null;
  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private handleAddedTabindex = false;
  private handleAddedAria = false;

  /** Attach pointer and keyboard listeners to `el`, cleaning up the previous handle first. */
  private setupHandle(el: HTMLElement): void {
    this.teardownHandle();

    this.currentHandle = el;

    // A11y: the handle must be keyboard-reachable - the target-scoped keydown
    // guard makes it the only element arrow keys can move the dialog from,
    // so an unfocusable handle would strip the keyboard path entirely.
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
      this.handleAddedTabindex = true;
    }
    // Labelling stays off the host-as-handle: aria-label/aria-roledescription
    // on the dialog element itself would clobber its accessible name (the
    // title) and its role text.
    if (!el.hasAttribute('aria-roledescription') && el !== this.elRef.nativeElement) {
      el.setAttribute('aria-roledescription', 'draggable');
      el.setAttribute('aria-label', 'Move dialog');
      this.handleAddedAria = true;
    }
    // The keyboard path is live on every handle, so the instruction is too.
    // Host-as-handle routes through the dialog's registry (a second
    // aria-describedby host binding would clobber CngxDialog's); an explicit
    // handle is not the dialog host, so the attribute is set directly -
    // guarded like tabindex, a consumer-authored describedby wins.
    const instruction = this.createInstructionNode();
    if (el === this.elRef.nativeElement) {
      this.releaseInstruction =
        this.ariaRegistry?.registerDescribedBy(signal(instruction.id)) ?? null;
    } else if (!el.hasAttribute('aria-describedby')) {
      el.setAttribute('aria-describedby', instruction.id);
      this.handleAddedDescribedBy = true;
    }
    el.style.cursor = 'var(--cngx-dialog-drag-cursor, grab)';
    el.style.touchAction = 'none';

    this.boundPointerDown = (e: PointerEvent) => this.handlePointerDown(e);
    this.boundKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    el.addEventListener('pointerdown', this.boundPointerDown);
    el.addEventListener('keydown', this.boundKeyDown);
  }

  private handlePointerDown(event: PointerEvent): void {
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
    // A cancelled pointer (touch interrupted, capture stolen) never fires
    // pointerup - without this the drag state sticks and userSelect stays off.
    this.doc.addEventListener('pointercancel', this.boundUp);
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

    if (this.gridSize() > 0 && this.snapMode() === 'release') {
      const { x, y } = this.positionState();
      this.positionState.set(this.snap(x, y));
    }

    if (this.boundMove) {
      this.doc.removeEventListener('pointermove', this.boundMove);
    }
    if (this.boundUp) {
      this.doc.removeEventListener('pointerup', this.boundUp);
      this.doc.removeEventListener('pointercancel', this.boundUp);
    }
    this.boundMove = null;
    this.boundUp = null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // When the whole dialog is the handle, every keydown inside it bubbles
    // here - arrows typed into form fields must move the caret, not the
    // dialog. Only keys originating on the handle element itself may drag.
    if (event.target !== this.currentHandle) {
      return;
    }
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

  private instructionNode: HTMLElement | null = null;
  private releaseInstruction: (() => void) | null = null;
  private handleAddedDescribedBy = false;

  /**
   * Visually hidden keyboard-drag instruction, appended to the host so it
   * lives inside the dialog for both handle modes. Same hidden technique as
   * the dialog's live region - a referenced node must stay perceivable to
   * AT, not `display: none`.
   */
  private createInstructionNode(): HTMLElement {
    const node = this.doc.createElement('span');
    node.id = nextUid('cngx-dialog-drag-hint');
    node.textContent = 'Use arrow keys to move the dialog; Shift for larger steps';
    applySrOnly(node);
    this.elRef.nativeElement.appendChild(node);
    this.instructionNode = node;
    return node;
  }

  /**
   * Detach listeners from the current handle and restore every attribute and
   * style this directive added. A demoted handle must not stay focusable or
   * keep announcing "Move dialog" with a dead keyboard path behind it.
   *
   * The instruction node and its describedby registration leave atomically
   * with the capability they describe: a handle swap away from host-as-handle
   * removes the arrow-keys-on-the-dialog path itself, so keeping an orphan
   * description would misinform AT, not inform it.
   */
  private teardownHandle(): void {
    this.releaseInstruction?.();
    this.releaseInstruction = null;
    this.instructionNode?.remove();
    this.instructionNode = null;

    const handle = this.currentHandle;
    if (!handle) {
      return;
    }
    if (this.handleAddedDescribedBy) {
      handle.removeAttribute('aria-describedby');
      this.handleAddedDescribedBy = false;
    }
    if (this.boundPointerDown) {
      handle.removeEventListener('pointerdown', this.boundPointerDown);
    }
    if (this.boundKeyDown) {
      handle.removeEventListener('keydown', this.boundKeyDown);
    }
    if (this.handleAddedTabindex) {
      handle.removeAttribute('tabindex');
      this.handleAddedTabindex = false;
    }
    if (this.handleAddedAria) {
      handle.removeAttribute('aria-roledescription');
      handle.removeAttribute('aria-label');
      this.handleAddedAria = false;
    }
    handle.style.cursor = '';
    handle.style.touchAction = '';
    this.currentHandle = null;
  }

  private cleanup(): void {
    if (this.boundMove) {
      this.doc.removeEventListener('pointermove', this.boundMove);
    }
    if (this.boundUp) {
      this.doc.removeEventListener('pointerup', this.boundUp);
      this.doc.removeEventListener('pointercancel', this.boundUp);
    }
    // A destroy mid-drag skips handlePointerUp - the global style must not
    // outlive the directive.
    this.doc.documentElement.style.userSelect = '';
    this.teardownHandle();
  }
}
