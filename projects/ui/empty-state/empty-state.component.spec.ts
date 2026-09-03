import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createAsyncStateMock, type AsyncStateMock } from '@cngx/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxEmptyState } from './empty-state.component';

@Component({
  template: `
    <cngx-empty-state [title]="title()" [description]="description()">
      <span cngxEmptyStateIcon class="test-icon">icon</span>
      <button cngxEmptyStateAction class="test-action">Action</button>
    </cngx-empty-state>
  `,
  imports: [CngxEmptyState],
})
class TestHost {
  title = signal('No results');
  description = signal<string | undefined>('Try a different search');
}

describe('CngxEmptyState', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('cngx-empty-state');
    return { fixture, el, host: fixture.componentInstance };
  }

  it('has role="status" and aria-live="polite"', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('displays title', () => {
    const { el } = setup();
    const title = el.querySelector('.cngx-empty-state__title')!;
    expect(title.textContent!.trim()).toBe('No results');
  });

  it('sets aria-labelledby to title element', () => {
    const { el } = setup();
    const labelledBy = el.getAttribute('aria-labelledby');
    const title = el.querySelector('.cngx-empty-state__title')!;
    expect(labelledBy).toBe(title.id);
  });

  it('displays description', () => {
    const { el } = setup();
    const desc = el.querySelector('.cngx-empty-state__description')!;
    expect(desc.textContent!.trim()).toBe('Try a different search');
  });

  it('sets aria-describedby to description element', () => {
    const { el } = setup();
    const describedBy = el.getAttribute('aria-describedby');
    const desc = el.querySelector('.cngx-empty-state__description')!;
    expect(describedBy).toBe(desc.id);
  });

  it('does not set aria-describedby when no description', () => {
    const { fixture, el, host } = setup();
    host.description.set(undefined);
    fixture.detectChanges();
    expect(el.hasAttribute('aria-describedby')).toBe(false);
  });

  it('projects icon slot', () => {
    const { el } = setup();
    expect(el.querySelector('.test-icon')).toBeTruthy();
  });

  it('projects action slot', () => {
    const { el } = setup();
    expect(el.querySelector('.test-action')).toBeTruthy();
  });

  describe('[state] auto-hide', () => {
    @Component({
      template: `<cngx-empty-state [title]="'No results'" [state]="state" />`,
      imports: [CngxEmptyState],
    })
    class StateHost {
      state: AsyncStateMock = createAsyncStateMock();
    }

    function setupWithState() {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [StateHost] });
      const fixture = TestBed.createComponent(StateHost);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('cngx-empty-state');
      return { fixture, el, state: fixture.componentInstance.state };
    }

    it('shows on a settled empty result', () => {
      const { fixture, el, state } = setupWithState();
      state.set({ status: 'success', empty: true });
      fixture.detectChanges();
      expect(el.hasAttribute('hidden')).toBe(false);
    });

    it('hides when data is present', () => {
      const { fixture, el, state } = setupWithState();
      state.set({ status: 'success', empty: false, data: [1] });
      fixture.detectChanges();
      expect(el.hasAttribute('hidden')).toBe(true);
    });

    it('hides while any operation is running (skeleton owns the loading phase)', () => {
      const { fixture, el, state } = setupWithState();
      for (const status of ['loading', 'pending', 'refreshing'] as const) {
        state.set({ status, empty: true });
        fixture.detectChanges();
        expect(el.hasAttribute('hidden'), status).toBe(true);
      }
    });

    it('hides on error status even with empty data (error is not empty)', () => {
      const { fixture, el, state } = setupWithState();
      state.set({ status: 'error', empty: true });
      fixture.detectChanges();
      expect(el.hasAttribute('hidden')).toBe(true);
    });

    it('shows on idle with empty data (first-use onboarding)', () => {
      const { fixture, el, state } = setupWithState();
      state.set({ status: 'idle', empty: true });
      fixture.detectChanges();
      expect(el.hasAttribute('hidden')).toBe(false);
    });
  });

  it('generates unique IDs across instances', () => {
    const f1 = TestBed.createComponent(TestHost);
    const f2 = TestBed.createComponent(TestHost);
    f1.detectChanges();
    f2.detectChanges();

    const el1: HTMLElement = f1.nativeElement.querySelector('cngx-empty-state');
    const el2: HTMLElement = f2.nativeElement.querySelector('cngx-empty-state');
    expect(el1.getAttribute('aria-labelledby')).not.toBe(el2.getAttribute('aria-labelledby'));
  });
});
