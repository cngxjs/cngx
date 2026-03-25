import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxSkeleton } from './skeleton.directive';

@Component({
  template: `<div [cngxSkeleton]="loading()" [shimmer]="shimmer()" [count]="count()"></div>`,
  imports: [CngxSkeleton],
})
class Host {
  readonly loading = signal(false);
  readonly shimmer = signal(true);
  readonly count = signal(1);
  readonly directive = viewChild.required(CngxSkeleton);
}

function setup(overrides: { loading?: boolean; shimmer?: boolean; count?: number } = {}) {
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  if (overrides.loading != null) {
    host.loading.set(overrides.loading);
  }
  if (overrides.shimmer != null) {
    host.shimmer.set(overrides.shimmer);
  }
  if (overrides.count != null) {
    host.count.set(overrides.count);
  }
  fixture.detectChanges();
  TestBed.flushEffects();

  const el = fixture.nativeElement.querySelector('div') as HTMLDivElement;
  const directive = host.directive();
  return { fixture, el, directive };
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

describe('CngxSkeleton', () => {
  it('should always have .cngx-skeleton class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-skeleton')).toBe(true);
  });

  it('should apply .cngx-skeleton--loading when loading', () => {
    const { el } = setup({ loading: true });
    expect(el.classList.contains('cngx-skeleton--loading')).toBe(true);
  });

  it('should remove .cngx-skeleton--loading when not loading', () => {
    const { el } = setup({ loading: false });
    expect(el.classList.contains('cngx-skeleton--loading')).toBe(false);
  });

  it('should set aria-busy when loading', () => {
    const { el } = setup({ loading: true });
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('should remove aria-busy when not loading', () => {
    const { el } = setup({ loading: false });
    expect(el.getAttribute('aria-busy')).toBeNull();
  });


  it('should apply .cngx-skeleton--shimmer when loading + shimmer', () => {
    const { el } = setup({ loading: true, shimmer: true });
    expect(el.classList.contains('cngx-skeleton--shimmer')).toBe(true);
  });

  it('should not apply shimmer when shimmer is false', () => {
    const { el } = setup({ loading: true, shimmer: false });
    expect(el.classList.contains('cngx-skeleton--shimmer')).toBe(false);
  });

  it('should expose loading signal', () => {
    const { directive } = setup({ loading: true });
    expect(directive.loading()).toBe(true);
  });

  it('should compute indices from count', () => {
    const { directive } = setup({ count: 4 });
    expect(directive.indices()).toEqual([0, 1, 2, 3]);
  });

  it('should update indices when count changes', () => {
    const { directive, fixture } = setup({ count: 2 });
    expect(directive.indices()).toEqual([0, 1]);
    fixture.componentInstance.count.set(5);
    flush(fixture);
    expect(directive.indices()).toEqual([0, 1, 2, 3, 4]);
  });

  it('should toggle loading state dynamically', () => {
    const { directive, el, fixture } = setup({ loading: false });
    expect(directive.loading()).toBe(false);
    expect(el.classList.contains('cngx-skeleton--loading')).toBe(false);

    fixture.componentInstance.loading.set(true);
    flush(fixture);
    expect(directive.loading()).toBe(true);
    expect(el.classList.contains('cngx-skeleton--loading')).toBe(true);
  });
});
