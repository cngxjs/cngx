import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxAriaExpanded } from '@cngx/common/a11y';
import { CngxExpandable } from './expandable.directive';

@Component({
  template: `
    <div
      cngxExpandable
      #e="cngxExpandable"
      [controls]="'panel-1'"
      (expandedChange)="changed($event)"
    ></div>
  `,
  imports: [CngxExpandable],
})
class UncontrolledHost {
  changed = vi.fn();
}

@Component({
  template: `<div cngxExpandable [(expanded)]="open"></div>`,
  imports: [CngxExpandable],
})
class TwoWayHost {
  readonly open = signal(true);
}

@Component({
  template: `<div cngxExpandable [expanded]="open()"></div>`,
  imports: [CngxExpandable],
})
class OneWayHost {
  readonly open = signal(false);
}

@Component({
  template: `<div cngxExpandable [leaf]="leaf()" [controls]="'panel-1'"></div>`,
  imports: [CngxExpandable],
})
class LeafHost {
  readonly leaf = signal(true);
}

function setup<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxExpandable));
  const dir = de.injector.get(CngxExpandable);
  const el = de.nativeElement as HTMLElement;
  return { fixture, dir, el, de, host: fixture.componentInstance };
}

describe('CngxExpandable', () => {
  it('starts collapsed and reflects aria-expanded=false, aria-controls', () => {
    const { dir, el } = setup(UncontrolledHost);
    expect(dir.expanded()).toBe(false);
    expect(el.getAttribute('aria-expanded')).toBe('false');
    expect(el.getAttribute('aria-controls')).toBe('panel-1');
  });

  it('composes CngxAriaExpanded for the host attributes', () => {
    const { de } = setup(UncontrolledHost);
    expect(de.injector.get(CngxAriaExpanded, null, { self: true })).not.toBeNull();
  });

  it('expand/collapse/toggle drive uncontrolled state and emit expandedChange', () => {
    const { fixture, dir, el, host } = setup(UncontrolledHost);

    dir.expand();
    fixture.detectChanges();
    expect(dir.expanded()).toBe(true);
    expect(el.getAttribute('aria-expanded')).toBe('true');
    expect(host.changed).toHaveBeenLastCalledWith(true);

    dir.toggle();
    fixture.detectChanges();
    expect(dir.expanded()).toBe(false);
    expect(el.getAttribute('aria-expanded')).toBe('false');
    expect(host.changed).toHaveBeenLastCalledWith(false);
  });

  it('expand() is a no-op when already expanded; collapse() a no-op when collapsed', () => {
    const { dir, host } = setup(UncontrolledHost);
    dir.collapse();
    expect(host.changed).not.toHaveBeenCalled();
    dir.expand();
    expect(host.changed).toHaveBeenCalledTimes(1);
    dir.expand();
    expect(host.changed).toHaveBeenCalledTimes(1);
  });

  it('two-way binds through [(expanded)]', () => {
    const { fixture, dir, el, host } = setup(TwoWayHost);
    expect(el.getAttribute('aria-expanded')).toBe('true');

    dir.collapse();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(el.getAttribute('aria-expanded')).toBe('false');

    host.open.set(true);
    fixture.detectChanges();
    expect(dir.expanded()).toBe(true);
    expect(el.getAttribute('aria-expanded')).toBe('true');
  });

  it('follows a one-way [expanded] binding on every change', () => {
    const { fixture, dir, el, host } = setup(OneWayHost);
    host.open.set(true);
    fixture.detectChanges();
    expect(dir.expanded()).toBe(true);
    expect(el.getAttribute('aria-expanded')).toBe('true');
    host.open.set(false);
    fixture.detectChanges();
    expect(dir.expanded()).toBe(false);
    expect(el.getAttribute('aria-expanded')).toBe('false');
  });

  it('omits aria-expanded on a leaf, so it does not read as a collapsed parent', () => {
    const { fixture, el, host } = setup(LeafHost);
    expect(el.hasAttribute('aria-expanded')).toBe(false);

    host.leaf.set(false);
    fixture.detectChanges();
    expect(el.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not bind click/Enter/Space host handlers', () => {
    const { fixture, dir, el, host } = setup(UncontrolledHost);
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(dir.expanded()).toBe(false);
    expect(host.changed).not.toHaveBeenCalled();
  });
});
