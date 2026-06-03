import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxSegmentedProgress, type SegmentState } from './segmented-progress.component';

@Component({
  standalone: true,
  imports: [CngxSegmentedProgress],
  template: `<cngx-segmented-progress [value]="value()" [total]="total()" [segments]="segments()" />`,
})
class Host {
  readonly value = signal(0);
  readonly total = signal(0);
  readonly segments = signal<readonly SegmentState[] | undefined>(undefined);
}

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  host: Host;
  bar: HTMLElement;
} {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const bar = fixture.nativeElement.querySelector('cngx-segmented-progress') as HTMLElement;
  return { fixture, host: fixture.componentInstance, bar };
}

function states(bar: HTMLElement): string[] {
  return Array.from(bar.querySelectorAll('.cngx-segmented-progress__segment')).map(
    (s) => s.getAttribute('data-state') ?? '',
  );
}

describe('CngxSegmentedProgress', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('exposes the progressbar role and reactive aria-value set', () => {
    const { fixture, host, bar } = setup();
    host.total.set(8);
    host.value.set(3);
    fixture.detectChanges();
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('8');
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuetext')).toBe('3 of 8');
  });

  it('aria-valuenow tracks value changes', () => {
    const { fixture, host, bar } = setup();
    host.total.set(5);
    host.value.set(1);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    host.value.set(4);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('4');
  });

  it('derives segment states from value/total', () => {
    const { fixture, host, bar } = setup();
    host.total.set(4);
    host.value.set(2);
    fixture.detectChanges();
    expect(states(bar)).toEqual(['done', 'done', 'active', 'todo']);
  });

  it('renders all done when value reaches total', () => {
    const { fixture, host, bar } = setup();
    host.total.set(3);
    host.value.set(3);
    fixture.detectChanges();
    expect(states(bar)).toEqual(['done', 'done', 'done']);
  });

  it('honours an explicit [segments] override, including error', () => {
    const { fixture, host, bar } = setup();
    host.segments.set(['done', 'error', 'active', 'todo']);
    fixture.detectChanges();
    expect(states(bar)).toEqual(['done', 'error', 'active', 'todo']);
    // aria-valuenow counts only done segments; max is the segment count.
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
  });

  it('clamps an out-of-range value', () => {
    const { fixture, host, bar } = setup();
    host.total.set(3);
    host.value.set(99);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(states(bar)).toEqual(['done', 'done', 'done']);
  });
});
