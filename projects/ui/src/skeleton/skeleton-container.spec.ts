import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxSkeletonContainer } from './skeleton-container';
import { CngxSkeletonPlaceholder } from './skeleton-placeholder';

@Component({
  template: `
    <cngx-skeleton [loading]="loading()" [count]="count()">
      <ng-template cngxSkeletonPlaceholder let-i let-last="last">
        <div class="placeholder" [attr.data-index]="i" [attr.data-last]="last"></div>
      </ng-template>
      <div class="content">Real content</div>
    </cngx-skeleton>
  `,
  imports: [CngxSkeletonContainer, CngxSkeletonPlaceholder],
})
class Host {
  readonly loading = signal(true);
  readonly count = signal(3);
}

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
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el };
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

describe('CngxSkeletonContainer', () => {
  it('should render placeholders when loading', () => {
    const { el } = setup({ loading: true, count: 3 });
    const placeholders = el.querySelectorAll('.placeholder');
    expect(placeholders.length).toBe(3);
    expect(el.querySelector('.content')).toBeNull();
  });

  it('should render content when not loading', () => {
    const { el } = setup({ loading: false });
    expect(el.querySelector('.content')).toBeTruthy();
    expect(el.querySelectorAll('.placeholder').length).toBe(0);
  });

  it('should provide template context with index', () => {
    const { el } = setup({ loading: true, count: 3 });
    const placeholders = el.querySelectorAll('.placeholder');
    expect(placeholders[0].getAttribute('data-index')).toBe('0');
    expect(placeholders[1].getAttribute('data-index')).toBe('1');
    expect(placeholders[2].getAttribute('data-index')).toBe('2');
  });

  it('should provide last flag in context', () => {
    const { el } = setup({ loading: true, count: 3 });
    const placeholders = el.querySelectorAll('.placeholder');
    expect(placeholders[0].getAttribute('data-last')).toBe('false');
    expect(placeholders[2].getAttribute('data-last')).toBe('true');
  });

  it('should toggle between loading and content', () => {
    const { el, fixture } = setup({ loading: true, count: 2 });
    expect(el.querySelectorAll('.placeholder').length).toBe(2);

    fixture.componentInstance.loading.set(false);
    flush(fixture);
    expect(el.querySelectorAll('.placeholder').length).toBe(0);
    expect(el.querySelector('.content')).toBeTruthy();
  });

  it('should apply cngx-skeleton class from hostDirective', () => {
    const { el } = setup({ loading: true });
    const host = el.querySelector('cngx-skeleton');
    expect(host?.classList.contains('cngx-skeleton')).toBe(true);
    expect(host?.classList.contains('cngx-skeleton--loading')).toBe(true);
  });

  it('should set aria-busy from hostDirective', () => {
    const { el } = setup({ loading: true });
    const host = el.querySelector('cngx-skeleton');
    expect(host?.getAttribute('aria-busy')).toBe('true');
  });

  it('should use display: contents', () => {
    const { el } = setup();
    const host = el.querySelector('cngx-skeleton') as HTMLElement;
    expect(host?.style.display).toBe('contents');
  });
});
