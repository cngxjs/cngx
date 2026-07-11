import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Injector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { createMatExpansionSetSync } from './set-sync';

/**
 * Reproduces the one `CdkAccordionItem` behaviour the sync depends on:
 * assigning `expanded` emits `expandedChange` synchronously. That echo
 * is what the re-entrancy guard must drop.
 */
class FakePanel {
  readonly expandedChange = new EventEmitter<boolean>();
  private _expanded = false;
  constructor(readonly id: string) {}
  get expanded(): boolean {
    return this._expanded;
  }
  set expanded(value: boolean) {
    if (value === this._expanded) {
      return;
    }
    this._expanded = value;
    this.expandedChange.emit(value);
  }
}

@Component({ standalone: true, template: '' })
class HostCmp {
  readonly panels = signal<FakePanel[]>([]);
  readonly openIds = signal<ReadonlySet<string>>(new Set());
  constructor() {
    createMatExpansionSetSync<FakePanel>({
      panels: this.panels,
      panelId: (panel) => panel.id,
      accordion: {
        isOpen: (id) => this.openIds().has(id),
        openIds: this.openIds,
      },
      injector: inject(Injector),
      destroyRef: inject(DestroyRef),
    });
  }
}

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  host: HostCmp;
  a: FakePanel;
  b: FakePanel;
} {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(HostCmp);
  const host = fixture.componentInstance;
  const a = new FakePanel('a');
  const b = new FakePanel('b');
  host.panels.set([a, b]);
  TestBed.flushEffects();
  return { fixture, host, a, b };
}

describe('createMatExpansionSetSync', () => {
  test('brain→Material: openIds membership drives panel.expanded', () => {
    const { host, a, b } = setup();

    host.openIds.set(new Set(['a']));
    TestBed.flushEffects();
    expect(a.expanded).toBe(true);
    expect(b.expanded).toBe(false);

    host.openIds.set(new Set(['b']));
    TestBed.flushEffects();
    expect(a.expanded).toBe(false);
    expect(b.expanded).toBe(true);
  });

  test('Material→brain: expandedChange writes back into openIds', () => {
    const { host, a, b } = setup();

    a.expanded = true;
    expect(host.openIds().has('a')).toBe(true);

    b.expanded = true;
    expect(host.openIds().has('b')).toBe(true);

    a.expanded = false;
    expect(host.openIds().has('a')).toBe(false);
    expect(host.openIds().has('b')).toBe(true);
  });

  test('re-entrancy: the synchronous echo of a brain→Material write does not rewrite openIds', () => {
    const { host, a } = setup();

    const before = new Set(['a']);
    host.openIds.set(before);
    TestBed.flushEffects();
    expect(a.expanded).toBe(true);

    // The write set panel.expanded=true, which emitted expandedChange
    // synchronously; the guard must have dropped it, leaving the exact
    // same Set reference (no write-back, no loop).
    expect(host.openIds()).toBe(before);
    TestBed.flushEffects();
    expect(host.openIds()).toBe(before);
  });

  test('destroyRef cleanup: after destroy, a panel emit no longer writes openIds', () => {
    const { fixture, host, a } = setup();

    fixture.destroy();
    a.expanded = true;
    expect(host.openIds().has('a')).toBe(false);
  });
});
