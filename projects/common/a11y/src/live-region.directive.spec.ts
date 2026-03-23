import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxLiveRegion } from './live-region.directive';

@Component({
  template: `
    <div cngxLiveRegion [politeness]="politeness()" [atomic]="atomic()" [relevant]="relevant()">
      Status
    </div>
  `,
  imports: [CngxLiveRegion],
})
class TestHost {
  politeness = signal<'polite' | 'assertive' | 'off'>('polite');
  atomic = signal(true);
  relevant = signal('additions text');
}

describe('CngxLiveRegion', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLDivElement = fixture.debugElement.query(By.css('div')).nativeElement;
    return { fixture, el, host: fixture.componentInstance };
  }

  it('sets aria-live=polite by default', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('sets role=status for polite', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('status');
  });

  it('sets aria-live=assertive and role=alert', () => {
    const { fixture, el, host } = setup();
    host.politeness.set('assertive');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(el.getAttribute('aria-live')).toBe('assertive');
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('sets aria-atomic', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-atomic')).toBe('true');
  });

  it('sets aria-relevant', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-relevant')).toBe('additions text');
  });

  it('removes role when politeness is off', () => {
    const { fixture, el, host } = setup();
    host.politeness.set('off');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(el.getAttribute('role')).toBeNull();
  });
});
