import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxTruncate } from './truncate.directive';

// Mock ResizeObserver (must be constructible with `new`)
class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target?: Element): void {}
  unobserve(_target?: Element): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

@Component({
  template: `
    <p [cngxTruncate]="lines()" [(expanded)]="expanded" #trunc="cngxTruncate">
      Some text content that might be long enough to get truncated.
    </p>
  `,
  imports: [CngxTruncate],
})
class TestHost {
  readonly lines = signal(3);
  readonly expanded = signal(false);
}

describe('CngxTruncate', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const p = fixture.debugElement.query(By.directive(CngxTruncate));
    const dir = p.injector.get(CngxTruncate);
    return { fixture, p, dir };
  }

  it('applies -webkit-line-clamp when collapsed', () => {
    const { p } = setup();
    const el = p.nativeElement as HTMLElement;
    expect(el.style.webkitLineClamp).toBe('3');
  });

  it('removes line-clamp when expanded', () => {
    const { fixture, p } = setup();
    fixture.componentInstance.expanded.set(true);
    fixture.detectChanges();
    const el = p.nativeElement as HTMLElement;
    expect(el.style.webkitLineClamp).toBe('');
  });

  it('starts with expanded=false', () => {
    const { dir } = setup();
    expect(dir.expanded()).toBe(false);
  });

  it('supports two-way expanded binding', () => {
    const { fixture, dir } = setup();
    dir.expanded.set(true);
    expect(fixture.componentInstance.expanded()).toBe(true);
  });

  it('applies display:-webkit-box when collapsed', () => {
    const { p } = setup();
    const el = p.nativeElement as HTMLElement;
    expect(el.style.display).toBe('-webkit-box');
  });

  it('removes display override when expanded', () => {
    const { fixture, p } = setup();
    fixture.componentInstance.expanded.set(true);
    fixture.detectChanges();
    const el = p.nativeElement as HTMLElement;
    expect(el.style.display).toBe('');
  });

  it('updates line-clamp when lines input changes', () => {
    const { fixture, p } = setup();
    fixture.componentInstance.lines.set(5);
    fixture.detectChanges();
    const el = p.nativeElement as HTMLElement;
    expect(el.style.webkitLineClamp).toBe('5');
  });
});
