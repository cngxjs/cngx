import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxDisclosure } from './disclosure.directive';

@Component({
  template: `
    <button
      cngxDisclosure
      #d="cngxDisclosure"
      [cngxDisclosureOpened]="controlled()"
      [controls]="'content-1'"
      (openedChange)="changed($event)"
    >
      Toggle
    </button>
    @if (d.opened()) {
      <div id="content-1">Content</div>
    }
  `,
  imports: [CngxDisclosure],
})
class TestHost {
  controlled = signal<boolean | undefined>(undefined);
  changed = vi.fn();
}

@Component({
  template: `<div cngxDisclosure role="button" tabindex="0">Toggle</div>`,
  imports: [CngxDisclosure],
})
class DivHost {}

describe('CngxDisclosure', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.directive(CngxDisclosure));
    const dir = btn.injector.get(CngxDisclosure);
    const el = btn.nativeElement as HTMLElement;
    return { fixture, dir, el, host: fixture.componentInstance };
  }

  it('starts closed by default', () => {
    const { dir } = setup();
    expect(dir.opened()).toBe(false);
  });

  it('sets aria-expanded to false initially', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-expanded')).toBe('false');
  });

  it('sets aria-controls', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-controls')).toBe('content-1');
  });

  it('toggles on click', () => {
    const { fixture, dir, el } = setup();
    el.click();
    fixture.detectChanges();
    expect(dir.opened()).toBe(true);
    expect(el.getAttribute('aria-expanded')).toBe('true');
  });

  it('leaves Enter and Space to the native click on a button host', () => {
    const { fixture, dir, el } = setup();
    // The browser turns both keys into a click on a <button>; handling the key
    // as well would toggle twice and cancelling it would starve a consumer
    // (click) on the host.
    for (const key of ['Enter', ' ']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      fixture.detectChanges();
      expect(dir.opened()).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('toggles on Enter and Space on a non-button host and prevents default', () => {
    const fixture = TestBed.createComponent(DivHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDisclosure));
    const dir = de.injector.get(CngxDisclosure);
    const el = de.nativeElement as HTMLElement;

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    el.dispatchEvent(enter);
    fixture.detectChanges();
    expect(dir.opened()).toBe(true);
    expect(enter.defaultPrevented).toBe(true);

    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    el.dispatchEvent(space);
    fixture.detectChanges();
    expect(dir.opened()).toBe(false);
    expect(space.defaultPrevented).toBe(true);
  });

  it('emits openedChange', () => {
    const { el, host, fixture } = setup();
    el.click();
    fixture.detectChanges();
    expect(host.changed).toHaveBeenCalledWith(true);
    el.click();
    fixture.detectChanges();
    expect(host.changed).toHaveBeenCalledWith(false);
  });

  it('controlled input takes precedence', () => {
    const { fixture, dir, host } = setup();
    host.controlled.set(true);
    fixture.detectChanges();
    expect(dir.opened()).toBe(true);
  });

  it('close() is a no-op when already closed', () => {
    const { dir, host } = setup();
    dir.close();
    expect(host.changed).not.toHaveBeenCalled();
  });

  it('renders content when opened', () => {
    const { fixture, el } = setup();
    expect(fixture.debugElement.query(By.css('#content-1'))).toBeNull();
    el.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#content-1'))).not.toBeNull();
  });
});
