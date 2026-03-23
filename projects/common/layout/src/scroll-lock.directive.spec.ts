import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxScrollLock } from './scroll-lock.directive';

@Component({
  template: `<div [cngxScrollLock]="locked()"></div>`,
  imports: [CngxScrollLock],
})
class TestHost {
  locked = signal(false);
}

describe('CngxScrollLock', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    return { fixture, host: fixture.componentInstance };
  }

  it('does not lock scroll initially', () => {
    setup();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });

  it('sets overflow hidden when enabled', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('sets scrollbar-gutter stable when enabled', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(document.documentElement.style.scrollbarGutter).toBe('stable');
  });

  it('restores overflow when disabled', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.locked.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });

  it('restores on destroy', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.destroy();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });
});
