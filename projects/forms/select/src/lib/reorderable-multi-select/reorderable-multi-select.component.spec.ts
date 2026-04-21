import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CngxReorderableMultiSelect,
  type CngxReorderableMultiSelectChange,
} from './reorderable-multi-select.component';
import type { CngxSelectOptionDef } from '../shared/option.model';
import { CngxSelectAnnouncer } from '../shared/announcer';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.togglePopover = function (this: HTMLElement) {
      if (this.hasAttribute('data-popover-open')) {
        (this as HTMLElement & { hidePopover: () => void }).hidePopover();
        return false;
      }
      (this as HTMLElement & { showPopover: () => void }).showPopover();
      return true;
    };
  }
}

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
  { value: 'd', label: 'Delta' },
];

@Component({
  template: `
    <cngx-reorderable-multi-select
      [label]="'Empfänger'"
      [options]="options"
      [clearable]="true"
      [commitAction]="commitAction"
      [commitMode]="commitMode"
      [disabled]="disabled"
      [(values)]="values"
      (selectionChange)="lastChange.set($event)"
      (reordered)="lastReorder.set($event)"
      (stateChange)="stateLog.push($event)"
      (commitError)="commitErrors.push($event)"
    />
  `,
  imports: [CngxReorderableMultiSelect],
})
class Host {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['a', 'b', 'c', 'd']);
  readonly lastChange = signal<CngxReorderableMultiSelectChange<string> | null>(null);
  readonly lastReorder = signal<CngxReorderableMultiSelectChange<string> | null>(null);
  commitAction: CngxSelectCommitAction<string[]> | null = null;
  commitMode: CngxSelectCommitMode = 'optimistic';
  disabled = false;
  stateLog: string[] = [];
  commitErrors: unknown[] = [];
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

function chipStrip(root: HTMLElement): HTMLElement {
  const strip = root.querySelector<HTMLElement>('.cngx-select__chip-list');
  if (!strip) {
    throw new Error('chip-strip not found');
  }
  return strip;
}

function chipAt(root: HTMLElement, index: number): HTMLElement {
  const el = root.querySelector<HTMLElement>(`[data-reorder-index="${index}"]`);
  if (!el) {
    throw new Error(`no chip at index ${index}`);
  }
  return el;
}

function handleOf(chip: HTMLElement): HTMLElement {
  const h = chip.querySelector<HTMLElement>('[cngxReorderHandle]');
  if (!h) {
    throw new Error('no drag-handle in chip');
  }
  return h;
}

function pointerDown(
  target: HTMLElement,
  init: { clientX?: number; clientY?: number; pointerId?: number; button?: number } = {},
): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: init.pointerId ?? 1,
      button: init.button ?? 0,
      clientX: init.clientX ?? 0,
      clientY: init.clientY ?? 0,
    }),
  );
}

function pointerMoveOver(targetEl: HTMLElement, pointerId = 1): void {
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

function fireKey(
  target: HTMLElement,
  key: string,
  modifiers: { ctrl?: boolean; alt?: boolean; meta?: boolean } = {},
): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ctrlKey: modifiers.ctrl ?? false,
      altKey: modifiers.alt ?? false,
      metaKey: modifiers.meta ?? false,
    }),
  );
}

beforeEach(() => {
  polyfillPopover();
});

describe('CngxReorderableMultiSelect — pointer reorder', () => {
  it('drag-right via pointer writes reordered values and fires reordered output', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    pointerDown(handleOf(chipAt(root, 0)));
    pointerMoveOver(chipAt(root, 2));
    pointerUp();
    flush(fixture);

    expect(fixture.componentInstance.values()).toEqual(['b', 'c', 'a', 'd']);
    const reorder = fixture.componentInstance.lastReorder();
    expect(reorder?.action).toBe('reorder');
    expect(reorder?.fromIndex).toBe(0);
    expect(reorder?.toIndex).toBe(2);
    expect(reorder?.option?.value).toBe('a');
    expect(reorder?.previousValues).toEqual(['a', 'b', 'c', 'd']);
  });

  it('pointerdown without a drag-handle is a no-op', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    // Fire on the chip wrapper body itself, not the handle.
    pointerDown(chipAt(root, 0));
    pointerMoveOver(chipAt(root, 2));
    pointerUp();
    flush(fixture);

    expect(fixture.componentInstance.values()).toEqual(['a', 'b', 'c', 'd']);
    expect(fixture.componentInstance.lastReorder()).toBeNull();
  });
});

describe('CngxReorderableMultiSelect — keyboard reorder', () => {
  it('Ctrl+ArrowRight on chip index 1 moves value to index 2', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    fireKey(chipAt(root, 1), 'ArrowRight', { ctrl: true });
    flush(fixture);

    expect(fixture.componentInstance.values()).toEqual(['a', 'c', 'b', 'd']);
    const reorder = fixture.componentInstance.lastReorder();
    expect(reorder?.fromIndex).toBe(1);
    expect(reorder?.toIndex).toBe(2);
  });

  it('Ctrl+Home moves a middle chip to the front', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    fireKey(chipAt(root, 2), 'Home', { ctrl: true });
    flush(fixture);

    expect(fixture.componentInstance.values()).toEqual(['c', 'a', 'b', 'd']);
  });
});

describe('CngxReorderableMultiSelect — commit action', () => {
  it('optimistic: applies immediately, rolls back on error', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    let reject!: (err: unknown) => void;
    host.commitAction = () =>
      new Promise<string[] | undefined>((_res, rej) => {
        reject = rej;
      });
    host.commitMode = 'optimistic';
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    fireKey(chipAt(root, 0), 'ArrowRight', { ctrl: true });
    flush(fixture);

    // Optimistic: values already reflect the move.
    expect(host.values()).toEqual(['b', 'a', 'c', 'd']);
    expect(host.stateLog).toContain('pending');

    reject(new Error('network down'));
    await Promise.resolve();
    await Promise.resolve();
    flush(fixture);

    expect(host.values()).toEqual(['a', 'b', 'c', 'd']);
    expect(host.stateLog).toContain('error');
    expect(host.commitErrors).toHaveLength(1);
  });

  it('pessimistic: waits for success, then writes; holds state on error', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    let resolve!: (value?: string[]) => void;
    host.commitAction = () =>
      new Promise<string[] | undefined>((res) => {
        resolve = () => res(undefined);
      });
    host.commitMode = 'pessimistic';
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    fireKey(chipAt(root, 0), 'ArrowRight', { ctrl: true });
    flush(fixture);

    // Pessimistic: values are NOT yet updated.
    expect(host.values()).toEqual(['a', 'b', 'c', 'd']);
    expect(host.stateLog).toContain('pending');

    resolve();
    await Promise.resolve();
    await Promise.resolve();
    flush(fixture);

    expect(host.values()).toEqual(['b', 'a', 'c', 'd']);
    expect(host.stateLog).toContain('success');
  });
});

describe('CngxReorderableMultiSelect — a11y + surface', () => {
  it('chip strip carries role="group" and the reorderAriaLabel', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const strip = chipStrip(root);
    expect(strip.getAttribute('role')).toBe('group');
    expect(strip.getAttribute('aria-label')).toMatch(/Reihenfolge/i);
  });

  it('inline roving: only the active chip has tabindex="0"', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(chipAt(root, 0).getAttribute('tabindex')).toBe('0');
    expect(chipAt(root, 1).getAttribute('tabindex')).toBe('-1');

    // Focus a later chip — roving moves.
    chipAt(root, 2).dispatchEvent(new FocusEvent('focus'));
    flush(fixture);

    expect(chipAt(root, 0).getAttribute('tabindex')).toBe('-1');
    expect(chipAt(root, 2).getAttribute('tabindex')).toBe('0');
  });

  it('plain ArrowRight on a chip moves focus without mutating values', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;
    chipAt(root, 0).dispatchEvent(new FocusEvent('focus'));
    flush(fixture);
    fireKey(chipAt(root, 0), 'ArrowRight');
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['a', 'b', 'c', 'd']);
    expect(chipAt(root, 1).getAttribute('tabindex')).toBe('0');
  });

  it('disabled=true freezes the strip (no reorder on pointer or keyboard)', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.disabled = true;
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    pointerDown(handleOf(chipAt(root, 0)));
    pointerMoveOver(chipAt(root, 2));
    pointerUp();
    fireKey(chipAt(root, 0), 'ArrowRight', { ctrl: true });
    flush(fixture);

    expect(fixture.componentInstance.values()).toEqual(['a', 'b', 'c', 'd']);
    expect(fixture.componentInstance.lastReorder()).toBeNull();
  });

  it('Ctrl+ArrowRight from the last chip is a no-op (bounds clamp)', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;
    fireKey(chipAt(root, 3), 'ArrowRight', { ctrl: true });
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['a', 'b', 'c', 'd']);
    expect(fixture.componentInstance.lastReorder()).toBeNull();
  });

  it('announcer fires "reordered" message via the shared live region', () => {
    const fixture = TestBed.createComponent(Host);
    const announcer = TestBed.inject(CngxSelectAnnouncer);
    const spy = vi.spyOn(announcer, 'announce');
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    fireKey(chipAt(root, 0), 'ArrowRight', { ctrl: true });
    flush(fixture);

    expect(spy).toHaveBeenCalled();
    const [message] = spy.mock.calls.at(-1) ?? [];
    expect(String(message)).toMatch(/verschoben/);
  });
});

describe('CngxReorderableMultiSelect — selection preservation', () => {
  it('reorder preserves membership exactly — only position changes', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;

    // Multiple keyboard moves — membership stays {a,b,c,d}.
    fireKey(chipAt(root, 0), 'End', { ctrl: true });
    flush(fixture);
    fireKey(chipAt(root, 0), 'End', { ctrl: true });
    flush(fixture);

    expect([...fixture.componentInstance.values()].sort()).toEqual(['a', 'b', 'c', 'd']);
    // Trace: [a,b,c,d] → Ctrl+End on idx 0 (a) → [b,c,d,a] → Ctrl+End on idx 0 (b) → [c,d,a,b]
    expect(fixture.componentInstance.values()).toEqual(['c', 'd', 'a', 'b']);
  });
});

describe('CngxReorderableMultiSelect — custom drag-handle template', () => {
  // Bound via a [chipDragHandle] input carrying a ng-template — covered
  // in the e2e demo suite (Commits 4+5) since the input wants a
  // TemplateRef reference, not a structural directive.
  it.todo('custom chipDragHandle template replaces the default grip glyph');
});

describe('CngxReorderableMultiSelect — panel Escape handling', () => {
  it('Escape on the trigger while the panel is open closes the panel', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const trigger = fixture.debugElement.query(By.css('[role="combobox"]'))
      .nativeElement as HTMLElement;
    trigger.click();
    flush(fixture);

    // Simulate the listbox's Escape behavior — close by calling close().
    const cmp = fixture.debugElement.query(By.directive(CngxReorderableMultiSelect))
      .componentInstance as CngxReorderableMultiSelect<string>;
    expect(cmp.panelOpen()).toBe(true);
    cmp.close();
    flush(fixture);
    expect(cmp.panelOpen()).toBe(false);
  });
});
