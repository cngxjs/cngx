import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxExpandable } from './expandable.directive';

@Component({
  template: `
    <div
      cngxExpandable
      #e="cngxExpandable"
      [cngxExpandableOpen]="controlled()"
      [controls]="'panel-1'"
      (expandedChange)="changed($event)"
    ></div>
  `,
  imports: [CngxExpandable],
})
class TestHost {
  controlled = signal<boolean | undefined>(undefined);
  changed = vi.fn();
}

function setup() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxExpandable));
  const dir = de.injector.get(CngxExpandable);
  const el = de.nativeElement as HTMLElement;
  return { fixture, dir, el, host: fixture.componentInstance };
}

describe('CngxExpandable', () => {
  it('starts collapsed and reflects aria-expanded=false, aria-controls', () => {
    const { dir, el } = setup();
    expect(dir.expanded()).toBe(false);
    expect(el.getAttribute('aria-expanded')).toBe('false');
    expect(el.getAttribute('aria-controls')).toBe('panel-1');
  });

  it('expand/collapse/toggle drive uncontrolled state and emit openedChange', () => {
    const { fixture, dir, el, host } = setup();

    dir.expand();
    fixture.detectChanges();
    expect(dir.expanded()).toBe(true);
    expect(el.getAttribute('aria-expanded')).toBe('true');
    expect(host.changed).toHaveBeenLastCalledWith(true);

    dir.toggle();
    fixture.detectChanges();
    expect(dir.expanded()).toBe(false);
    expect(host.changed).toHaveBeenLastCalledWith(false);
  });

  it('expand() is a no-op when already expanded; collapse() a no-op when collapsed', () => {
    const { dir, host } = setup();
    dir.collapse();
    expect(host.changed).not.toHaveBeenCalled();
    dir.expand();
    expect(host.changed).toHaveBeenCalledTimes(1);
    dir.expand();
    expect(host.changed).toHaveBeenCalledTimes(1);
  });

  it('controlled input wins over internal state', () => {
    const { fixture, dir, el, host } = setup();
    host.controlled.set(true);
    fixture.detectChanges();
    expect(dir.expanded()).toBe(true);
    expect(el.getAttribute('aria-expanded')).toBe('true');
    host.controlled.set(false);
    fixture.detectChanges();
    expect(dir.expanded()).toBe(false);
  });

  it('does not bind click/Enter/Space host handlers', () => {
    const { fixture, dir, el, host } = setup();
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(dir.expanded()).toBe(false);
    expect(host.changed).not.toHaveBeenCalled();
  });
});
