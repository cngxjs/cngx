import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxBucketPaginate, type CngxBucket } from './bucket-paginate.directive';

interface Person {
  readonly name: string;
}

const firstLetterIn =
  (lo: string, hi: string) =>
  (p: Person): boolean => {
    const c = p.name[0]?.toUpperCase() ?? '';
    return c >= lo && c <= hi;
  };

const BUCKETS: readonly CngxBucket<Person>[] = [
  { label: 'A-C', match: firstLetterIn('A', 'C') },
  { label: 'D-F', match: firstLetterIn('D', 'F') },
  { label: 'G-I', match: firstLetterIn('G', 'I') },
];

@Component({
  standalone: true,
  imports: [CngxBucketPaginate],
  template: `
    <div
      cngxBucketPaginate
      #bp="cngxBucketPaginate"
      [buckets]="buckets()"
      [items]="people()"
      [(active)]="active"
    ></div>
  `,
})
class HostCmp {
  readonly buckets = signal(BUCKETS);
  // Anna, Bob (A-C); Hugo (G-I). D-F is empty.
  readonly people = signal<readonly Person[]>([{ name: 'Anna' }, { name: 'Bob' }, { name: 'Hugo' }]);
  readonly active = signal<string | null>(null);
}

function setup() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  const model = fixture.debugElement
    .query(By.directive(CngxBucketPaginate))
    .injector.get(CngxBucketPaginate);
  return { fixture, host: fixture.componentInstance, model };
}

describe('CngxBucketPaginate', () => {
  test('isEmpty() is true for a bucket whose predicate matches nothing', () => {
    const { model } = setup();
    expect(model.isEmpty('D-F')).toBe(true);
    expect(model.isEmpty('A-C')).toBe(false);
    expect(model.isEmpty('G-I')).toBe(false);
  });

  test('isEmpty() re-derives when items change (no synced flag)', () => {
    const { fixture, host, model } = setup();
    host.people.set([{ name: 'Dora' }]); // now only D-F is populated
    fixture.detectChanges();
    expect(model.isEmpty('D-F')).toBe(false);
    expect(model.isEmpty('A-C')).toBe(true);
  });

  test('select() sets the active bucket', () => {
    const { model } = setup();
    model.select('A-C');
    expect(model.active()).toBe('A-C');
  });

  test('re-selecting the active bucket clears it (toggle)', () => {
    const { model } = setup();
    model.select('A-C');
    model.select('A-C');
    expect(model.active()).toBeNull();
  });

  test('select() is a no-op for an empty bucket', () => {
    const { model } = setup();
    model.select('D-F');
    expect(model.active()).toBeNull();
  });

  test('clear() resets the active bucket', () => {
    const { model } = setup();
    model.select('G-I');
    model.clear();
    expect(model.active()).toBeNull();
  });

  test('the two-way [(active)] binding writes back to the host', () => {
    const { fixture, host, model } = setup();
    model.select('A-C');
    fixture.detectChanges();
    expect(host.active()).toBe('A-C');
  });
});
