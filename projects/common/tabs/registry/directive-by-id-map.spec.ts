import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, test, vi } from 'vitest';

import {
  CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  createDirectiveByIdMap,
  type CngxDirectiveByIdMapFactory,
} from './directive-by-id-map';

interface FakeDir {
  id: () => string;
}

function makeDir(id: string): FakeDir {
  return { id: () => id };
}

describe('createDirectiveByIdMap', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  test('axis 1: builds a Map keyed by id() from the source array', () => {
    const a = makeDir('a');
    const b = makeDir('b');
    const source = signal<readonly FakeDir[]>([a, b]);
    const map = createDirectiveByIdMap({ source });

    const result = map();
    expect(result.size).toBe(2);
    expect(result.get('a')).toBe(a);
    expect(result.get('b')).toBe(b);
  });

  test('axis 2: structural-equal — same input set returns same Signal value', () => {
    const a = makeDir('a');
    const b = makeDir('b');
    const source = signal<readonly FakeDir[]>([a, b]);
    const map = createDirectiveByIdMap({ source });

    const first = map();
    // Source re-emits with a fresh array of the SAME instances —
    // structural-equal must keep the value reference stable.
    source.set([a, b]);
    const second = map();
    expect(Object.is(first, second)).toBe(true);
  });

  test('axis 3: change detection — adding/removing a directive yields a new Map', () => {
    const a = makeDir('a');
    const b = makeDir('b');
    const c = makeDir('c');
    const source = signal<readonly FakeDir[]>([a, b]);
    const map = createDirectiveByIdMap({ source });

    const first = map();
    expect(first.size).toBe(2);

    source.set([a, b, c]);
    const second = map();
    expect(Object.is(first, second)).toBe(false);
    expect(second.size).toBe(3);
    expect(second.get('c')).toBe(c);
  });

  test('axis 4: directive instance swap with same id triggers cascade', () => {
    const aOld = makeDir('a');
    const aNew = makeDir('a');
    const source = signal<readonly FakeDir[]>([aOld]);
    const map = createDirectiveByIdMap({ source });

    const first = map();
    source.set([aNew]);
    const second = map();
    expect(Object.is(first, second)).toBe(false);
    expect(second.get('a')).toBe(aNew);
  });

  test('axis 5: empty source produces an empty Map', () => {
    const source = signal<readonly FakeDir[]>([]);
    const map = createDirectiveByIdMap({ source });
    expect(map().size).toBe(0);
  });
});

describe('CNGX_DIRECTIVE_BY_ID_MAP_FACTORY', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('default factory resolves to createDirectiveByIdMap', () => {
    expect(TestBed.inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)).toBe(
      createDirectiveByIdMap,
    );
  });

  it('consumer-provided factory replaces createDirectiveByIdMap', () => {
    // Swap axis — guards the override surface that 3 organism shells
    // route through (`<cngx-tab-group>` plus `<cngx-stepper>` /
    // `<cngx-mat-stepper>` post-Phase-1.8). A custom policy
    // (WeakMap-based, telemetry, custom equality) installs via this
    // token without forking the consumer organism.
    const customFactory: CngxDirectiveByIdMapFactory = createDirectiveByIdMap;
    const spy = vi.fn(customFactory);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_DIRECTIVE_BY_ID_MAP_FACTORY, useValue: spy },
      ],
    });
    expect(TestBed.inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)).toBe(spy);
  });
});
