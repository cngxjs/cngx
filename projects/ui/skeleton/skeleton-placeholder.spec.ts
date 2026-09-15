import { Component, signal, viewChild, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CngxSkeletonContainer } from './skeleton-container';
import {
  CngxSkeletonPlaceholder,
  type CngxSkeletonPlaceholderContext,
} from './skeleton-placeholder';

@Component({
  template: `
    <cngx-skeleton [loading]="loading()" [count]="count()" [showDelay]="0" [minDwell]="0">
      <ng-template
        cngxSkeletonPlaceholder
        let-i
        let-idx="index"
        let-total="count"
        let-first="first"
        let-last="last"
      >
        <div
          class="ph"
          [attr.data-implicit]="i"
          [attr.data-index]="idx"
          [attr.data-count]="total"
          [attr.data-first]="first"
          [attr.data-last]="last"
        ></div>
      </ng-template>
      <div class="content">Real content</div>
    </cngx-skeleton>
  `,
  imports: [CngxSkeletonContainer, CngxSkeletonPlaceholder],
})
class Host {
  readonly loading = signal(true);
  readonly count = signal(3);
  readonly placeholder = viewChild.required(CngxSkeletonPlaceholder);
}

@Component({
  template: `
    <cngx-skeleton [loading]="true" [count]="2" [showDelay]="0" [minDwell]="0">
      <ng-template cngxSkeletonPlaceholder>
        <div class="ph-first"></div>
      </ng-template>
      <ng-template cngxSkeletonPlaceholder>
        <div class="ph-second"></div>
      </ng-template>
    </cngx-skeleton>
  `,
  imports: [CngxSkeletonContainer, CngxSkeletonPlaceholder],
})
class TwoTemplatesHost {}

function setup(overrides: { loading?: boolean; count?: number } = {}) {
  const fixture = TestBed.createComponent(Host);
  if (overrides.loading != null) {
    fixture.componentInstance.loading.set(overrides.loading);
  }
  if (overrides.count != null) {
    fixture.componentInstance.count.set(overrides.count);
  }
  fixture.detectChanges();
  TestBed.flushEffects();
  // Fire the 0ms visibility-gate timers so the placeholder reflects the loading input.
  vi.advanceTimersByTime(1);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el };
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
  vi.advanceTimersByTime(1);
  fixture.detectChanges();
}

describe('CngxSkeletonPlaceholder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should expose the projected template as a typed TemplateRef', () => {
    const { fixture } = setup();
    const templateRef: TemplateRef<CngxSkeletonPlaceholderContext> =
      fixture.componentInstance.placeholder().templateRef;
    expect(templateRef).toBeInstanceOf(TemplateRef);
  });

  it('should stamp the full context on each repetition', () => {
    const { el } = setup({ loading: true, count: 3 });
    const nodes = el.querySelectorAll('.ph');
    expect(nodes.length).toBe(3);

    // Compile-time check that the context type declares exactly these fields.
    const contextShape: CngxSkeletonPlaceholderContext = {
      $implicit: 1,
      index: 1,
      count: 3,
      first: false,
      last: false,
    };
    expect(contextShape.index).toBe(1);

    nodes.forEach((node, i) => {
      expect(node.getAttribute('data-implicit')).toBe(String(i));
      expect(node.getAttribute('data-index')).toBe(String(i));
      expect(node.getAttribute('data-count')).toBe('3');
      expect(node.getAttribute('data-first')).toBe(String(i === 0));
      expect(node.getAttribute('data-last')).toBe(String(i === 2));
    });
  });

  it('should mark a single placeholder as both first and last', () => {
    const { el } = setup({ loading: true, count: 1 });
    const nodes = el.querySelectorAll('.ph');
    expect(nodes.length).toBe(1);
    expect(nodes[0].getAttribute('data-first')).toBe('true');
    expect(nodes[0].getAttribute('data-last')).toBe('true');
  });

  it('should add stamped instances when count increases', () => {
    const { el, fixture } = setup({ loading: true, count: 2 });
    expect(el.querySelectorAll('.ph').length).toBe(2);

    fixture.componentInstance.count.set(5);
    flush(fixture);
    expect(el.querySelectorAll('.ph').length).toBe(5);
  });

  it('should remove stamped instances when count decreases', () => {
    const { el, fixture } = setup({ loading: true, count: 4 });
    expect(el.querySelectorAll('.ph').length).toBe(4);

    fixture.componentInstance.count.set(2);
    flush(fixture);
    expect(el.querySelectorAll('.ph').length).toBe(2);
  });

  it('should recompute count and last context fields after a count change', () => {
    const { el, fixture } = setup({ loading: true, count: 3 });
    let nodes = el.querySelectorAll('.ph');
    expect(nodes[2].getAttribute('data-last')).toBe('true');

    fixture.componentInstance.count.set(4);
    flush(fixture);
    nodes = el.querySelectorAll('.ph');
    expect(nodes.length).toBe(4);
    // The previously-last row loses its marker; every row sees the new total.
    expect(nodes[2].getAttribute('data-last')).toBe('false');
    expect(nodes[3].getAttribute('data-last')).toBe('true');
    nodes.forEach((node) => {
      expect(node.getAttribute('data-count')).toBe('4');
    });
  });

  it('should resolve to the first template when multiple placeholders are projected', () => {
    const fixture = TestBed.createComponent(TwoTemplatesHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.ph-first').length).toBe(2);
    expect(el.querySelectorAll('.ph-second').length).toBe(0);
  });

  it('should render stamped nodes without wrapper elements or per-node ARIA', () => {
    const { el } = setup({ loading: true, count: 2 });
    const host = el.querySelector('cngx-skeleton') as HTMLElement;
    const nodes = el.querySelectorAll('.ph');

    nodes.forEach((node) => {
      // display:contents host + no directive DOM: template roots parent straight to the host.
      expect(node.parentElement).toBe(host);
      expect(node.hasAttribute('aria-busy')).toBe(false);
      expect(node.hasAttribute('aria-hidden')).toBe(false);
    });
    // Busy semantics stay on the container host, once, not per repetition.
    expect(host.getAttribute('aria-busy')).toBe('true');
  });
});
