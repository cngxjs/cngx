import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxReorder, type CngxReorderEvent } from './reorder.directive';

interface Item {
  readonly id: string;
  readonly label: string;
}

const ITEMS: readonly Item[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
  { id: 'd', label: 'Delta' },
];

@Component({
  template: `
    <ul
      class="list"
      [cngxReorder]="valuesSignal"
      [disabled]="disabled()"
      (reordered)="handleReorder($event)"
      (dragStart)="dragStarts.push($event)"
      (dragEnd)="onDragEnd()"
    >
      @for (item of values(); track item.id; let i = $index) {
        <li
          class="item"
          [attr.data-reorder-index]="i"
          [attr.data-id]="item.id"
          tabindex="0"
        >
          <button type="button" cngxReorderHandle>⋮⋮</button>
          {{ item.label }}
        </li>
      }
    </ul>
  `,
  imports: [CngxReorder],
})
class TestHost {
  readonly values = signal<readonly Item[]>(ITEMS);
  readonly valuesSignal: Signal<readonly Item[]> = this.values.asReadonly();
  readonly disabled = signal(false);
  readonly reorders: CngxReorderEvent<Item>[] = [];
  readonly dragStarts: number[] = [];
  dragEnds = 0;

  handleReorder(event: CngxReorderEvent<Item>): void {
    this.reorders.push(event);
    this.values.set(event.next.slice());
  }

  onDragEnd(): void {
    this.dragEnds += 1;
  }
}

describe('CngxReorder', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const debugEl = fixture.debugElement.query(By.directive(CngxReorder));
    const dir = debugEl.injector.get(CngxReorder<Item>);
    const listEl = debugEl.nativeElement as HTMLElement;
    return { fixture, host, dir, listEl };
  }

  function itemAt(listEl: HTMLElement, index: number): HTMLElement {
    const el = listEl.querySelector<HTMLElement>(
      `[data-reorder-index="${index}"]`,
    );
    if (!el) {
      throw new Error(`no item at index ${index}`);
    }
    return el;
  }

  function handleOf(itemEl: HTMLElement): HTMLElement {
    const handle = itemEl.querySelector<HTMLElement>('[cngxReorderHandle]');
    if (!handle) {
      throw new Error('no handle inside item');
    }
    return handle;
  }

  function pointerDown(
    target: HTMLElement,
    init: { clientX?: number; clientY?: number; pointerId?: number; button?: number } = {},
  ): PointerEvent {
    const event = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: init.pointerId ?? 1,
      button: init.button ?? 0,
      clientX: init.clientX ?? 0,
      clientY: init.clientY ?? 0,
    });
    target.dispatchEvent(event);
    return event;
  }

  function pointerMoveOver(
    targetEl: HTMLElement,
    pointerId = 1,
  ): void {
    // jsdom does not implement elementFromPoint — define + stub it so
    // the directive's drop-target resolver can pick the right index.
    const proto = Document.prototype as unknown as {
      elementFromPoint?: (x: number, y: number) => Element | null;
    };
    const original = proto.elementFromPoint;
    proto.elementFromPoint = () => targetEl;
    try {
      document.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          pointerId,
          clientX: 123,
          clientY: 456,
        }),
      );
    } finally {
      if (original) {
        proto.elementFromPoint = original;
      } else {
        delete proto.elementFromPoint;
      }
    }
  }

  function pointerUp(pointerId = 1): void {
    document.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerId }),
    );
  }

  function pressEscape(): void {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
  }

  function fireKey(
    target: HTMLElement,
    key: string,
    modifiers: { ctrl?: boolean; alt?: boolean; meta?: boolean } = { ctrl: true },
  ): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ctrlKey: modifiers.ctrl ?? false,
      altKey: modifiers.alt ?? false,
      metaKey: modifiers.meta ?? false,
    });
    target.dispatchEvent(event);
    return event;
  }

  it('pointer drag-right: moves an item forward in the list', () => {
    const { host, listEl } = setup();
    const itemA = itemAt(listEl, 0);
    pointerDown(handleOf(itemA));
    pointerMoveOver(itemAt(listEl, 2));
    pointerUp();
    expect(host.reorders).toHaveLength(1);
    expect(host.reorders[0].fromIndex).toBe(0);
    expect(host.reorders[0].toIndex).toBe(2);
    expect(host.reorders[0].next.map((i) => i.id)).toEqual(['b', 'c', 'a', 'd']);
    expect(host.dragStarts).toEqual([0]);
    expect(host.dragEnds).toBe(1);
  });

  it('pointer drag-left: moves an item back in the list', () => {
    const { host, listEl } = setup();
    const itemD = itemAt(listEl, 3);
    pointerDown(handleOf(itemD));
    pointerMoveOver(itemAt(listEl, 1));
    pointerUp();
    expect(host.reorders).toHaveLength(1);
    expect(host.reorders[0].fromIndex).toBe(3);
    expect(host.reorders[0].toIndex).toBe(1);
    expect(host.reorders[0].next.map((i) => i.id)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('Escape during drag cancels the move — no (reordered), dragEnd still fires', () => {
    const { host, listEl, dir } = setup();
    pointerDown(handleOf(itemAt(listEl, 0)));
    pointerMoveOver(itemAt(listEl, 2));
    expect(dir.dragging()).toBe(true);
    pressEscape();
    expect(host.reorders).toHaveLength(0);
    expect(host.dragEnds).toBe(1);
    expect(dir.dragging()).toBe(false);
  });

  it('Ctrl+ArrowRight / ArrowLeft / Home / End drive keyboard moves', () => {
    const { host, listEl } = setup();
    fireKey(itemAt(listEl, 0), 'ArrowRight', { ctrl: true });
    expect(host.reorders.at(-1)?.toIndex).toBe(1);
    // After the host updates the signal, 'b' ist the new index-0 chip.
    fireKey(itemAt(listEl, 2), 'ArrowLeft', { ctrl: true });
    expect(host.reorders.at(-1)?.toIndex).toBe(1);
    fireKey(itemAt(listEl, 2), 'End', { ctrl: true });
    expect(host.reorders.at(-1)?.toIndex).toBe(3);
    fireKey(itemAt(listEl, 3), 'Home', { ctrl: true });
    expect(host.reorders.at(-1)?.toIndex).toBe(0);
    // Four successful moves total.
    expect(host.reorders).toHaveLength(4);
  });

  it('ignores keyboard moves without the configured modifier', () => {
    const { host, listEl } = setup();
    fireKey(itemAt(listEl, 0), 'ArrowRight', {});
    expect(host.reorders).toHaveLength(0);
  });

  it('disabled=true blocks both pointer and keyboard flows', () => {
    const { host, listEl, fixture } = setup();
    host.disabled.set(true);
    fixture.detectChanges();
    pointerDown(handleOf(itemAt(listEl, 0)));
    pointerMoveOver(itemAt(listEl, 2));
    pointerUp();
    fireKey(itemAt(listEl, 0), 'ArrowRight', { ctrl: true });
    expect(host.reorders).toHaveLength(0);
    expect(host.dragStarts).toEqual([]);
  });

  it('pointerdown outside a drag-handle is a no-op', () => {
    const { host, listEl } = setup();
    // Fire on the item body, not the handle — no drag should start.
    pointerDown(itemAt(listEl, 0));
    pointerMoveOver(itemAt(listEl, 2));
    pointerUp();
    expect(host.reorders).toHaveLength(0);
    expect(host.dragStarts).toEqual([]);
  });

  it('second pointerdown while a drag is active is ignored', () => {
    const { host, listEl, dir } = setup();
    pointerDown(handleOf(itemAt(listEl, 0)), { pointerId: 1 });
    expect(dir.dragging()).toBe(true);
    // Second pointer from a different pointerId while the first drag is
    // still active must not start a fresh gesture.
    pointerDown(handleOf(itemAt(listEl, 1)), { pointerId: 2 });
    pointerUp(1);
    expect(host.dragStarts).toEqual([0]);
    expect(host.reorders).toHaveLength(0);
  });

  it('clamps the emitted toIndex to array bounds on End from the last item', () => {
    const { host, listEl } = setup();
    fireKey(itemAt(listEl, 3), 'End', { ctrl: true });
    expect(host.reorders).toHaveLength(0);
  });
});
