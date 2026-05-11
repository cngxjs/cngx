import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxCardGrid } from './card-grid.component';
import { CngxCardGridEmpty } from './card-grid-empty.directive';
import type { EmptyReason } from './card.types';

@Component({
  template: `
    <cngx-card-grid
      [items]="items()"
      [emptyReason]="emptyReason()"
      [density]="density()"
      [semanticList]="semanticList()"
      [minWidth]="minWidth()"
    >
      @for (item of items(); track $index) {
        <div class="card-item">{{ item }}</div>
      }
      <ng-template cngxCardGridEmpty="no-results">
        <div class="empty-no-results">No results</div>
      </ng-template>
      <ng-template cngxCardGridEmpty="first-use">
        <div class="empty-first-use">Get started</div>
      </ng-template>
      <ng-template cngxCardGridEmpty>
        <div class="empty-default">Nothing here</div>
      </ng-template>
    </cngx-card-grid>
  `,
  imports: [CngxCardGrid, CngxCardGridEmpty],
})
class TestHost {
  items = signal<readonly string[] | undefined>(undefined);
  emptyReason = signal<EmptyReason | undefined>(undefined);
  density = signal<'compact' | 'default' | 'comfortable'>('default');
  semanticList = signal(false);
  minWidth = signal('280px');
}

describe('CngxCardGrid', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const grid: HTMLElement = fixture.nativeElement.querySelector('cngx-card-grid');
    return { fixture, grid, host: fixture.componentInstance };
  }

  // --- Layout ---
  it('has cngx-card-grid class', () => {
    const { grid } = setup();
    expect(grid.classList.contains('cngx-card-grid')).toBe(true);
  });

  it('sets CSS custom property for minWidth', () => {
    const { grid } = setup();
    expect(grid.style.getPropertyValue('--cngx-card-grid-min')).toBe('280px');
  });

  // --- Density ---
  it('adds compact class', () => {
    const { fixture, grid, host } = setup();
    host.density.set('compact');
    fixture.detectChanges();
    expect(grid.classList.contains('cngx-card-grid--compact')).toBe(true);
  });

  it('adds comfortable class', () => {
    const { fixture, grid, host } = setup();
    host.density.set('comfortable');
    fixture.detectChanges();
    expect(grid.classList.contains('cngx-card-grid--comfortable')).toBe(true);
  });

  // --- Semantic list ---
  it('does not set role by default', () => {
    const { grid } = setup();
    expect(grid.hasAttribute('role')).toBe(false);
  });

  it('sets role="list" when semanticList is true', () => {
    const { fixture, grid, host } = setup();
    host.semanticList.set(true);
    fixture.detectChanges();
    expect(grid.getAttribute('role')).toBe('list');
  });

  // --- Empty state ---
  it('shows content when items is undefined (pure layout mode)', () => {
    const { grid } = setup();
    expect(grid.querySelector('.empty-default')).toBeFalsy();
  });

  it('shows content when items has values', () => {
    const { fixture, grid, host } = setup();
    host.items.set(['a', 'b']);
    fixture.detectChanges();
    expect(grid.querySelectorAll('.card-item').length).toBe(2);
    expect(grid.querySelector('.empty-default')).toBeFalsy();
  });

  it('shows default empty template when items is empty and no reason', () => {
    const { fixture, grid, host } = setup();
    host.items.set([]);
    fixture.detectChanges();
    expect(grid.querySelector('.empty-default')).toBeTruthy();
  });

  it('shows no-results template when reason matches', () => {
    const { fixture, grid, host } = setup();
    host.items.set([]);
    host.emptyReason.set('no-results');
    fixture.detectChanges();
    expect(grid.querySelector('.empty-no-results')).toBeTruthy();
    expect(grid.querySelector('.empty-default')).toBeFalsy();
  });

  it('shows first-use template when reason matches', () => {
    const { fixture, grid, host } = setup();
    host.items.set([]);
    host.emptyReason.set('first-use');
    fixture.detectChanges();
    expect(grid.querySelector('.empty-first-use')).toBeTruthy();
  });

  it('falls back to default template for unknown reason', () => {
    const { fixture, grid, host } = setup();
    host.items.set([]);
    host.emptyReason.set('cleared');
    fixture.detectChanges();
    // No 'cleared' template defined — falls back to default
    expect(grid.querySelector('.empty-default')).toBeTruthy();
  });
});
