import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxBucketPaginate, type CngxBucket } from '@cngx/common/data';

import { CngxPaginatorAlpha } from './paginator-alpha.component';

interface Person {
  readonly name: string;
}

const firstLetterIn =
  (lo: string, hi: string) =>
  (p: Person): boolean => {
    const c = p.name[0]?.toUpperCase() ?? '';
    return c >= lo && c <= hi;
  };

// A-C populated (Anna, Bob), D-F empty, G-I populated (Hugo).
const BUCKETS: readonly CngxBucket<Person>[] = [
  { label: 'A-C', match: firstLetterIn('A', 'C') },
  { label: 'D-F', match: firstLetterIn('D', 'F') },
  { label: 'G-I', match: firstLetterIn('G', 'I') },
];

@Component({
  standalone: true,
  imports: [CngxBucketPaginate, CngxPaginatorAlpha],
  template: `
    <div cngxBucketPaginate [buckets]="buckets()" [items]="people()" [(active)]="active">
      <cngx-pgn-alpha />
    </div>
  `,
})
class HostCmp {
  readonly buckets = signal(BUCKETS);
  readonly people = signal<readonly Person[]>([{ name: 'Anna' }, { name: 'Bob' }, { name: 'Hugo' }]);
  readonly active = signal<string | null>(null);
}

type Fixture = ReturnType<typeof TestBed.createComponent<HostCmp>>;

async function settle(fixture: Fixture): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

async function setup(): Promise<{ fixture: Fixture; host: HostCmp }> {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(HostCmp);
  await settle(fixture);
  return { fixture, host: fixture.componentInstance };
}

function chips(fixture: Fixture): HTMLButtonElement[] {
  return fixture.debugElement
    .queryAll(By.css('cngx-pgn-alpha button'))
    .map((d) => d.nativeElement as HTMLButtonElement);
}

describe('CngxPaginatorAlpha', () => {
  test('renders one chip per bucket inside a labelled group', async () => {
    const { fixture } = await setup();
    expect(chips(fixture).map((c) => c.textContent?.trim())).toEqual(['A-C', 'D-F', 'G-I']);
    const group = fixture.debugElement.query(By.css('cngx-pgn-alpha [role="group"]'));
    expect(group.nativeElement.getAttribute('aria-label')).toBe('Categories');
  });

  test('empty buckets render disabled with a stated reason', async () => {
    const { fixture } = await setup();
    const [ac, df, gi] = chips(fixture);
    expect(df.disabled).toBe(true);
    expect(df.getAttribute('aria-label')).toBe('D-F, no items');
    expect(ac.disabled).toBe(false);
    expect(gi.disabled).toBe(false);
    expect(ac.getAttribute('aria-label')).toBe('A-C');
  });

  test('clicking a chip sets aria-pressed and selects the bucket', async () => {
    const { fixture, host } = await setup();
    const [ac] = chips(fixture);
    expect(ac.getAttribute('aria-pressed')).toBe('false');

    ac.click();
    await settle(fixture);

    expect(ac.getAttribute('aria-pressed')).toBe('true');
    expect(host.active()).toBe('A-C');
  });

  test('re-clicking the active chip clears the selection (toggle)', async () => {
    const { fixture, host } = await setup();
    const [ac] = chips(fixture);
    ac.click();
    await settle(fixture);
    ac.click();
    await settle(fixture);

    expect(ac.getAttribute('aria-pressed')).toBe('false');
    expect(host.active()).toBeNull();
  });

  test('arrow keys move the roving cursor, skipping disabled chips', async () => {
    const { fixture } = await setup();
    const [ac, df, gi] = chips(fixture);
    // Single tab stop starts on the first non-empty chip.
    expect(ac.getAttribute('tabindex')).toBe('0');

    fixture.debugElement
      .query(By.css('cngx-pgn-alpha [role="group"]'))
      .nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle(fixture);

    // Lands on G-I, skipping the disabled D-F bucket.
    expect(ac.getAttribute('tabindex')).toBe('-1');
    expect(df.getAttribute('tabindex')).toBe('-1');
    expect(gi.getAttribute('tabindex')).toBe('0');
  });
});
