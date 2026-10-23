import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { CngxReorderEvent } from '@cngx/common/interactive';

import type { CngxSelectOptionDef } from '../../option.model';
import { CngxSelectReorderList } from './reorder-list.component';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'r', label: 'Red' },
  { value: 'g', label: 'Green' },
  { value: 'b', label: 'Blue' },
];

@Component({
  selector: 'cngx-reorder-list-host',
  standalone: true,
  imports: [CngxSelectReorderList],
  template: `
    <cngx-select-reorder-list
      [items]="items()"
      [label]="'Selected, in order'"
      [hint]="'Reorder with Alt + arrow keys'"
      [moveUpLabel]="up"
      [moveDownLabel]="down"
      [atStartText]="'Already first'"
      [atEndText]="'Already last'"
      [pendingText]="pendingText()"
      [disabled]="disabled()"
      [busy]="busy()"
      (reordered)="handle($event)"
    />
  `,
})
class Host {
  readonly items = signal<readonly CngxSelectOptionDef<string>[]>(OPTIONS);
  readonly disabled = signal(false);
  readonly busy = signal(false);
  readonly pendingText = signal('Unavailable while saving');
  readonly events: CngxReorderEvent<string>[] = [];
  readonly up = (label: string): string => `${label}: move up`;
  readonly down = (label: string): string => `${label}: move down`;
  /** Applies the move, as the host select's optimistic commit does. */
  apply = true;

  handle(event: CngxReorderEvent<string>): void {
    this.events.push(event);
    if (this.apply) {
      this.items.set(event.next.map((v) => OPTIONS.find((o) => o.value === v)!));
    }
  }
}

let fixture: ComponentFixture<Host>;

function setup(): { host: Host; root: HTMLElement } {
  fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return { host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

function rows(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('li[data-reorder-index]'));
}

function button(root: HTMLElement, index: number, dir: 'up' | 'down'): HTMLButtonElement {
  return rows(root)[index].querySelector<HTMLButtonElement>(`[data-move="${dir}"]`)!;
}

function labels(root: HTMLElement): string[] {
  return rows(root).map((r) =>
    r.querySelector('.cngx-select-reorder-list__label')!.textContent!.trim(),
  );
}

function key(target: HTMLElement, k: string, alt = true): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, altKey: alt, bubbles: true, cancelable: true }),
  );
}

function settle(): void {
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

afterEach(() => {
  (fixture?.nativeElement as HTMLElement | undefined)?.remove();
});

describe('CngxSelectReorderList', () => {
  it('renders one named list with a row per value', () => {
    const { root } = setup();
    const list = root.querySelector('ul')!;
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Selected, in order');
    expect(labels(root)).toEqual(['Red', 'Green', 'Blue']);
    expect(button(root, 1, 'up').getAttribute('aria-label')).toBe('Green: move up');
    expect(button(root, 1, 'down').getAttribute('aria-label')).toBe('Green: move down');
    expect(rows(root)[0].querySelector('[data-reorder-handle]')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('describes the list with the keyboard hint only while two or more rows can move', () => {
    const { host, root } = setup();
    const list = root.querySelector('ul')!;
    const hintId = list.getAttribute('aria-describedby')!;
    expect(root.querySelector(`#${hintId}`)!.textContent).toBe('Reorder with Alt + arrow keys');

    host.items.set([OPTIONS[0]]);
    settle();
    expect(list.getAttribute('aria-describedby')).toBeNull();
    expect(root.querySelector(`#${hintId}`)).not.toBeNull();

    host.items.set(OPTIONS);
    host.disabled.set(true);
    settle();
    expect(list.getAttribute('aria-describedby')).toBeNull();
  });

  it('moves a row with the move buttons', () => {
    const { host, root } = setup();
    button(root, 1, 'up').click();
    expect(host.events).toEqual([{ fromIndex: 1, toIndex: 0, next: ['g', 'r', 'b'] }]);
    settle();
    expect(labels(root)).toEqual(['Green', 'Red', 'Blue']);

    button(root, 1, 'down').click();
    expect(host.events[1]).toEqual({ fromIndex: 1, toIndex: 2, next: ['g', 'b', 'r'] });
  });

  it('keeps the end buttons focusable, aria-disabled with the reason, and inert', () => {
    const { host, root } = setup();
    const firstUp = button(root, 0, 'up');
    const lastDown = button(root, 2, 'down');
    expect(firstUp.getAttribute('aria-disabled')).toBe('true');
    expect(firstUp.hasAttribute('disabled')).toBe(false);
    expect(root.querySelector(`#${firstUp.getAttribute('aria-describedby')}`)!.textContent).toBe(
      'Already first',
    );
    expect(lastDown.getAttribute('aria-disabled')).toBe('true');
    expect(root.querySelector(`#${lastDown.getAttribute('aria-describedby')}`)!.textContent).toBe(
      'Already last',
    );
    expect(button(root, 1, 'up').getAttribute('aria-disabled')).toBeNull();
    expect(button(root, 1, 'up').getAttribute('aria-describedby')).toBeNull();

    firstUp.click();
    lastDown.click();
    expect(host.events).toEqual([]);
  });

  it('emits nothing while disabled', () => {
    const { host, root } = setup();
    host.disabled.set(true);
    settle();
    expect(button(root, 1, 'up').getAttribute('aria-disabled')).toBe('true');
    button(root, 1, 'up').click();
    key(button(root, 1, 'up'), 'ArrowUp');
    expect(host.events).toEqual([]);
  });

  it('reports aria-busy on the list only while busy', () => {
    const { host, root } = setup();
    const list = root.querySelector('ul')!;
    expect(list.hasAttribute('aria-busy')).toBe(false);

    host.disabled.set(true);
    settle();
    expect(list.hasAttribute('aria-busy')).toBe(false);

    host.busy.set(true);
    settle();
    expect(list.getAttribute('aria-busy')).toBe('true');

    host.busy.set(false);
    host.disabled.set(false);
    settle();
    expect(list.hasAttribute('aria-busy')).toBe(false);
  });

  it('names the pending commit on every move button only while busy', () => {
    const { host, root } = setup();
    const describedBy = (el: Element): string[] =>
      (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    const textOf = (id: string): string => root.querySelector(`#${id}`)!.textContent!.trim();
    const middleUp = button(root, 1, 'up');
    const firstUp = button(root, 0, 'up');
    expect(middleUp.hasAttribute('aria-describedby')).toBe(false);

    host.disabled.set(true);
    settle();
    expect(middleUp.hasAttribute('aria-describedby')).toBe(false);

    host.busy.set(true);
    settle();
    expect(describedBy(middleUp).map(textOf)).toEqual(['Unavailable while saving']);
    expect(describedBy(firstUp).map(textOf)).toEqual(['Already first', 'Unavailable while saving']);

    host.pendingText.set('Wird gespeichert');
    settle();
    expect(describedBy(middleUp).map(textOf)).toEqual(['Wird gespeichert']);

    host.busy.set(false);
    host.disabled.set(false);
    settle();
    expect(middleUp.hasAttribute('aria-describedby')).toBe(false);
    expect(describedBy(firstUp).map(textOf)).toEqual(['Already first']);
  });

  it('moves a row with the modifier keys on a focused row button', () => {
    const { host, root } = setup();
    key(button(root, 0, 'down'), 'ArrowDown');
    expect(host.events[0]).toEqual({ fromIndex: 0, toIndex: 1, next: ['g', 'r', 'b'] });
    settle();
    key(button(root, 0, 'down'), 'End');
    expect(host.events[1]).toEqual({ fromIndex: 0, toIndex: 2, next: ['r', 'b', 'g'] });
    settle();
    key(button(root, 2, 'up'), 'Home');
    expect(host.events[2]).toEqual({ fromIndex: 2, toIndex: 0, next: ['g', 'r', 'b'] });
    settle();
    key(button(root, 1, 'up'), 'ArrowUp');
    expect(host.events[3]).toEqual({ fromIndex: 1, toIndex: 0, next: ['r', 'g', 'b'] });
    key(button(root, 1, 'up'), 'ArrowUp', false);
    expect(host.events).toHaveLength(4);
  });

  it('moves a row by dragging its handle', () => {
    const { host, root } = setup();
    const handle = rows(root)[0].querySelector<HTMLElement>('[data-reorder-handle]')!;
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, button: 0 }),
    );
    const proto = Document.prototype as unknown as {
      elementFromPoint?: (x: number, y: number) => Element | null;
    };
    const original = proto.elementFromPoint;
    proto.elementFromPoint = () => rows(root)[2];
    try {
      document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1 }));
    } finally {
      if (original) {
        proto.elementFromPoint = original;
      } else {
        delete proto.elementFromPoint;
      }
    }
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
    expect(host.events).toEqual([{ fromIndex: 0, toIndex: 2, next: ['g', 'b', 'r'] }]);
  });

  it('does not start a drag from a move button', () => {
    const { host, root } = setup();
    button(root, 0, 'down').dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 2, button: 0 }),
    );
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2 }));
    expect(host.events).toEqual([]);
  });

  it('keeps focus on the same button of the moved row', async () => {
    const { root } = setup();
    button(root, 1, 'up').focus();
    button(root, 1, 'up').click();
    settle();
    await fixture.whenStable();
    expect(document.activeElement).toBe(button(root, 0, 'up'));
    expect(labels(root)[0]).toBe('Green');

    button(root, 0, 'down').focus();
    key(button(root, 0, 'down'), 'ArrowDown');
    settle();
    await fixture.whenStable();
    expect(document.activeElement).toBe(button(root, 1, 'down'));
  });

  it('leaves focus on the row while a pessimistic commit has not moved it yet', async () => {
    const { host, root } = setup();
    host.apply = false;
    button(root, 1, 'down').focus();
    button(root, 1, 'down').click();
    settle();
    await fixture.whenStable();
    expect(labels(root)).toEqual(['Red', 'Green', 'Blue']);
    expect(document.activeElement).toBe(button(root, 1, 'down'));
  });
});
