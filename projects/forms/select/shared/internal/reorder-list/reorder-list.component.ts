import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

import {
  CngxReorder,
  type CngxReorderEvent,
  type CngxReorderModifier,
} from '@cngx/common/interactive';
import { nextUid } from '@cngx/core/utils';

import { injectSelectWord } from '../../../i18n/select-i18n';
import type { CngxSelectOptionDef } from '../../option.model';

/** Direction of a move button. */
type MoveDirection = 'up' | 'down';

/**
 * @internal
 *
 * Sortable list of the selected values, shown in a reorderable select panel
 * (sheet or anchored) while the trigger is a summary under the touch floor.
 * Three paths move a row, and every one of them emits the same
 * `CngxReorderEvent` through `reordered`: dragging the row handle, the
 * `CngxReorder` modifier keys on a focused row button, and the move-up /
 * move-down buttons (the single-pointer alternative to dragging, WCAG 2.5.7).
 *
 * Presentational: rows, the keyboard hint and the modifier come in as
 * inputs; the host owns the commit. The list name, the move-button names and
 * the end-of-list reasons are read from the `select` language section, so a
 * runtime language switch reaches them. A button that cannot move (first row up, last row down)
 * stays focusable with `aria-disabled` and names the reason through
 * `aria-describedby`; the reference is emitted only while it applies. After
 * a move, focus follows the moved row onto the same button.
 */
@Component({
  selector: 'cngx-select-reorder-list',
  standalone: true,
  imports: [CngxReorder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'cngx-select-reorder-list' },
  templateUrl: './reorder-list.component.html',
  styleUrls: ['./reorder-list.component.css'],
})
export class CngxSelectReorderList<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  /** Selected options, in order. */
  readonly items = input<readonly CngxSelectOptionDef<T>[]>([]);
  /** Keyboard hint, the list's description while it has two or more rows. */
  readonly hint = input<string>('');
  /** Modifier that arms the keyboard reorder of `CngxReorder`. */
  readonly keyboardModifier = input<CngxReorderModifier>('alt');
  /** Freezes every reorder path (a commit in flight, a disabled control). */
  readonly disabled = input<boolean>(false);

  /** A drag, a modifier-key move or a move button settled on a new order. */
  readonly reordered = output<CngxReorderEvent<T>>();

  /** @internal Accessible name of the list. */
  protected readonly label = injectSelectWord('reorderListLabel');
  /** @internal Accessible name of a row's move-up button, built from the row label. */
  protected readonly moveUpLabel = injectSelectWord('reorderMoveUp');
  /** @internal Accessible name of a row's move-down button, built from the row label. */
  protected readonly moveDownLabel = injectSelectWord('reorderMoveDown');
  /** @internal Why the first row cannot move up. */
  protected readonly atStartText = injectSelectWord('reorderAtStart');
  /** @internal Why the last row cannot move down. */
  protected readonly atEndText = injectSelectWord('reorderAtEnd');

  /** @internal Values in row order, the source `CngxReorder` reads. */
  protected readonly values = computed<readonly T[]>(() => this.items().map((o) => o.value));

  /** @internal */ protected readonly hintId = nextUid('cngx-select-reorder-hint');
  /** @internal */ protected readonly atStartId = nextUid('cngx-select-reorder-start');
  /** @internal */ protected readonly atEndId = nextUid('cngx-select-reorder-end');

  /** @internal The hint applies only while there is something to reorder. */
  protected readonly hintRef = computed<string | null>(() =>
    this.items().length > 1 && !this.disabled() ? this.hintId : null,
  );

  /** @internal */
  protected handleMove(index: number, direction: MoveDirection): void {
    if (this.disabled()) {
      return;
    }
    const current = this.values();
    const toIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || index >= current.length || toIndex < 0 || toIndex >= current.length) {
      return;
    }
    const next = current.slice();
    const [moved] = next.splice(index, 1);
    next.splice(toIndex, 0, moved);
    this.emit({ fromIndex: index, toIndex, next });
  }

  /** @internal `CngxReorder` output: a drag or a modifier-key move. */
  protected handleReorder(event: CngxReorderEvent<T>): void {
    this.emit(event);
  }

  private emit(event: CngxReorderEvent<T>): void {
    const moved = this.items()[event.fromIndex];
    const direction = this.focusedDirection();
    this.reordered.emit(event);
    if (moved && direction) {
      this.refocusAfterRender(moved, direction);
    }
  }

  /** Direction of the move button holding focus inside this list, if any. */
  private focusedDirection(): MoveDirection | null {
    const active = this.doc.activeElement as HTMLElement | null;
    if (!active || !this.host.contains(active)) {
      return null;
    }
    const direction = active.dataset['move'];
    return direction === 'up' || direction === 'down' ? direction : null;
  }

  /**
   * Puts focus back on the same button of the moved row once the rows
   * re-rendered. A pessimistic commit keeps the row where it is until it
   * settles, so the lookup goes by option, not by target index.
   */
  private refocusAfterRender(moved: CngxSelectOptionDef<T>, direction: MoveDirection): void {
    afterNextRender(
      () => {
        const index = this.items().indexOf(moved);
        if (index < 0) {
          return;
        }
        const button = this.host.querySelector<HTMLElement>(
          `[data-reorder-index="${index}"] [data-move="${direction}"]`,
        );
        if (button && this.doc.activeElement !== button) {
          button.focus();
        }
      },
      { injector: this.injector },
    );
  }
}
