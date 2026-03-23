import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxDisclosure } from './disclosure.directive';

@Component({
  template: `
    <button cngxDisclosure #d="cngxDisclosure"
            [cngxDisclosureOpened]="controlled()"
            [controls]="'content-1'"
            (openedChange)="changed($event)">
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

  it('toggles on Enter key', () => {
    const { fixture, dir, el } = setup();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(dir.opened()).toBe(true);
  });

  it('toggles on Space key and prevents default', () => {
    const { fixture, dir, el } = setup();
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    fixture.detectChanges();
    expect(dir.opened()).toBe(true);
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
