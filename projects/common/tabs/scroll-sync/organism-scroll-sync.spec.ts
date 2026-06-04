import {
  Injector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, test, vi } from 'vitest';

import {
  CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
  createOrganismScrollSync,
  type CngxOrganismScrollSyncFactory,
} from './organism-scroll-sync';

interface Harness {
  injector: Injector;
  hostElement: HTMLElement;
  activeId: ReturnType<typeof signal<string | null>>;
  scrollSpy: ReturnType<typeof vi.fn>;
  install: (scrollOptions?: ScrollIntoViewOptions) => void;
}

function makeHarness(): Harness {
  const hostElement = document.createElement('div');
  // Three buttons matching the `${id}-header` convention.
  for (const id of ['one', 'two', 'three']) {
    const btn = document.createElement('button');
    btn.id = `${id}-header`;
    hostElement.appendChild(btn);
  }
  document.body.appendChild(hostElement);

  const scrollSpy = vi.fn();
  // jsdom doesn't implement scrollIntoView — install the spy on the
  // prototype so every <button> gets it.
  for (const btn of Array.from(hostElement.querySelectorAll('button'))) {
    (btn as HTMLElement).scrollIntoView = scrollSpy;
  }

  const activeId = signal<string | null>(null);
  const injector = TestBed.inject(Injector);

  return {
    injector,
    hostElement,
    activeId,
    scrollSpy,
    install: (scrollOptions) => {
      createOrganismScrollSync({
        activeId,
        hostElement,
        scrollOptions,
        injector,
      });
    },
  };
}

describe('createOrganismScrollSync', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  test('axis 1: scrolls the matching child on activeId change', () => {
    const h = makeHarness();
    h.install();
    TestBed.flushEffects();
    expect(h.scrollSpy).not.toHaveBeenCalled();

    h.activeId.set('two');
    TestBed.flushEffects();
    expect(h.scrollSpy).toHaveBeenCalledTimes(1);
  });

  test('axis 2: null activeId is a no-op', () => {
    const h = makeHarness();
    h.install();
    h.activeId.set('one');
    TestBed.flushEffects();
    h.activeId.set(null);
    TestBed.flushEffects();
    // First set fires; second null-set does not.
    expect(h.scrollSpy).toHaveBeenCalledTimes(1);
  });

  test('axis 3: missing matching button is a silent no-op (jsdom guard)', () => {
    const h = makeHarness();
    h.install();
    h.activeId.set('does-not-exist');
    TestBed.flushEffects();
    expect(h.scrollSpy).not.toHaveBeenCalled();
  });

  test('axis 4: scroll options override default (vertical layout case)', () => {
    const h = makeHarness();
    h.install({ behavior: 'auto', block: 'center', inline: 'nearest' });
    h.activeId.set('three');
    TestBed.flushEffects();
    expect(h.scrollSpy).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
      inline: 'nearest',
    });
  });

  test('axis 5: untracked() discipline — DOM read+call do not retrigger the effect', () => {
    const h = makeHarness();
    let runs = 0;
    const customSpy = vi.fn(() => {
      runs++;
    });
    for (const btn of Array.from(h.hostElement.querySelectorAll('button'))) {
      (btn as HTMLElement).scrollIntoView = customSpy;
    }
    h.install();
    TestBed.flushEffects();
    h.activeId.set('one');
    TestBed.flushEffects();
    h.activeId.set('two');
    TestBed.flushEffects();
    expect(runs).toBe(2);
  });
});

describe('CNGX_ORGANISM_SCROLL_SYNC_FACTORY', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('default factory resolves to createOrganismScrollSync', () => {
    expect(TestBed.inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)).toBe(
      createOrganismScrollSync,
    );
  });

  it('consumer-provided factory replaces createOrganismScrollSync', () => {
    // Swap axis — guards the override surface that organism shells
    // route through. A custom policy (instant scroll, custom selector,
    // reduced-motion opt-out, telemetry) installs via this token
    // without forking the organism.
    const customFactory: CngxOrganismScrollSyncFactory = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_ORGANISM_SCROLL_SYNC_FACTORY, useValue: customFactory },
      ],
    });
    expect(TestBed.inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)).toBe(
      customFactory,
    );
  });
});
