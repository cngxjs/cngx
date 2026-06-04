import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { createChipStripRoving } from './chip-strip-roving';

function makeContainer(chipCount: number): HTMLElement {
  const root = document.createElement('div');
  for (let i = 0; i < chipCount; i++) {
    const chip = document.createElement('span');
    chip.setAttribute('data-reorder-index', String(i));
    chip.setAttribute('tabindex', '-1');
    root.appendChild(chip);
  }
  document.body.appendChild(root);
  return root;
}

describe('createChipStripRoving', () => {
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    injector = TestBed.inject(Injector);
  });

  it('starts with activeIndex=0', () => {
    const container = signal<HTMLElement | null>(null);
    const count = signal(3);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({ container, count }),
    );
    expect(ctrl.activeIndex()).toBe(0);
  });

  it('plain ArrowRight / ArrowLeft move activeIndex within bounds and focus the chip', () => {
    const root = makeContainer(4);
    const container = signal<HTMLElement | null>(root);
    const count = signal(4);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({ container, count }),
    );
    ctrl.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(ctrl.activeIndex()).toBe(1);
    expect(document.activeElement).toBe(
      root.querySelector('[data-reorder-index="1"]'),
    );
    ctrl.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(ctrl.activeIndex()).toBe(2);
    ctrl.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(ctrl.activeIndex()).toBe(1);
    root.remove();
  });

  it('Home / End jump to extremes', () => {
    const root = makeContainer(5);
    const container = signal<HTMLElement | null>(root);
    const count = signal(5);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({ container, count }),
    );
    ctrl.handleKeydown(new KeyboardEvent('keydown', { key: 'End' }));
    expect(ctrl.activeIndex()).toBe(4);
    ctrl.handleKeydown(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(ctrl.activeIndex()).toBe(0);
    root.remove();
  });

  it('ignores modifier-pressed keys (belong to paired reorder directive)', () => {
    const root = makeContainer(3);
    const container = signal<HTMLElement | null>(root);
    const count = signal(3);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({ container, count }),
    );
    ctrl.handleKeydown(
      new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }),
    );
    ctrl.handleKeydown(
      new KeyboardEvent('keydown', { key: 'End', altKey: true }),
    );
    ctrl.handleKeydown(
      new KeyboardEvent('keydown', { key: 'Home', metaKey: true }),
    );
    expect(ctrl.activeIndex()).toBe(0);
    root.remove();
  });

  it('clamps activeIndex when count shrinks (removed chip case)', () => {
    const container = signal<HTMLElement | null>(null);
    const count = signal(5);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({ container, count }),
    );
    ctrl.setActive(4);
    expect(ctrl.activeIndex()).toBe(4);
    count.set(2);
    TestBed.flushEffects();
    expect(ctrl.activeIndex()).toBe(1);
    count.set(0);
    TestBed.flushEffects();
    expect(ctrl.activeIndex()).toBe(0);
  });

  it('markFocused syncs the index to the currently focused chip', () => {
    const container = signal<HTMLElement | null>(null);
    const count = signal(5);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({ container, count }),
    );
    ctrl.markFocused(3);
    expect(ctrl.activeIndex()).toBe(3);
  });

  it('focusAt sets the index and focuses the matching chip element', () => {
    const root = makeContainer(4);
    const container = signal<HTMLElement | null>(root);
    const count = signal(4);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({ container, count }),
    );
    ctrl.focusAt(2);
    expect(ctrl.activeIndex()).toBe(2);
    expect(document.activeElement).toBe(
      root.querySelector('[data-reorder-index="2"]'),
    );
    root.remove();
  });

  it('honors a custom indexAttr for non-reorder hosts', () => {
    const root = document.createElement('div');
    for (let i = 0; i < 3; i++) {
      const chip = document.createElement('span');
      chip.setAttribute('data-chip-index', String(i));
      chip.setAttribute('tabindex', '-1');
      root.appendChild(chip);
    }
    document.body.appendChild(root);
    const container = signal<HTMLElement | null>(root);
    const count = signal(3);
    const ctrl = runInInjectionContext(injector, () =>
      createChipStripRoving({
        container,
        count,
        indexAttr: 'data-chip-index',
      }),
    );
    ctrl.focusAt(1);
    expect(document.activeElement).toBe(
      root.querySelector('[data-chip-index="1"]'),
    );
    root.remove();
  });
});
