import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxBeforeUnload } from './before-unload.directive';

@Component({
  template: `<form [cngxBeforeUnload]="dirty()"></form>`,
  imports: [CngxBeforeUnload],
})
class TestHost {
  readonly dirty = signal(false);
}

describe('CngxBeforeUnload', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  it('calls preventDefault on beforeunload when enabled', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.dirty.set(true);
    fixture.detectChanges();

    const event = new Event('beforeunload', { cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
  });

  it('sets returnValue so browsers before Chromium 119 also show the prompt', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.dirty.set(true);
    fixture.detectChanges();

    // jsdom has no BeforeUnloadEvent; an own writable property stands in for
    // its legacy returnValue, which a plain Event maps to defaultPrevented.
    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(event, 'returnValue', { value: '', writable: true });
    window.dispatchEvent(event);

    expect(event.returnValue).toBe(true);
  });

  it('removes its window listener on destroy', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.dirty.set(true);
    fixture.detectChanges();
    fixture.destroy();

    const event = new Event('beforeunload', { cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(spy).not.toHaveBeenCalled();
  });

  it('does not prevent unload when disabled', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.dirty.set(false);
    fixture.detectChanges();

    const event = new Event('beforeunload', { cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(spy).not.toHaveBeenCalled();
  });
});
