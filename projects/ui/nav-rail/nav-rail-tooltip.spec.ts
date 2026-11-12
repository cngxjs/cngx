import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { injectNavRailTooltip } from './nav-rail-tooltip';

@Component({
  selector: 'test-rail',
  template: `
    <a class="cngx-nav-link row-inbox" href="#inbox">
      <span class="cngx-nav-icon" aria-hidden="true">inbox</span>
      Inbox
      <span class="cngx-nav-badge">7</span>
    </a>
    <button type="button" class="cngx-nav-group row-settings">Settings</button>
    <span class="outside">Not a row</span>
  `,
})
class TestRail {
  readonly railed = signal(true);

  constructor() {
    injectNavRailTooltip(this.railed);
  }
}

function setup() {
  const fixture = TestBed.createComponent(TestRail);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.nativeElement as HTMLElement;
  const tip = host.querySelector<HTMLElement>('.cngx-nav-rail-tooltip')!;
  const row = (selector: string) => host.querySelector<HTMLElement>(selector)!;
  const isOpen = () => tip.hasAttribute('data-popover-open');
  return { fixture, host, tip, row, isOpen };
}

function pointer(type: 'pointerover' | 'pointerout', target: Element, related?: Element): void {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, relatedTarget: related ?? null }));
}

describe('injectNavRailTooltip', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates one hidden tooltip element with the tooltip skin, out of the accessibility tree', () => {
    const { host, tip, isOpen } = setup();
    expect(host.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
    expect(tip.getAttribute('popover')).toBe('manual');
    expect(tip.getAttribute('aria-hidden')).toBe('true');
    expect(tip.classList.contains('cngx-tooltip')).toBe(true);
    expect(isOpen()).toBe(false);
  });

  it('shows the row label without icon and badge when a row takes focus', () => {
    const { row, tip, isOpen } = setup();
    row('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(isOpen()).toBe(true);
    expect(tip.textContent).toBe('Inbox');
    expect(row('.row-inbox').style.getPropertyValue('anchor-name')).toBe(
      tip.style.getPropertyValue('position-anchor'),
    );
  });

  it('shows after the hover dwell, not before', () => {
    vi.useFakeTimers();
    const { row, isOpen } = setup();
    pointer('pointerover', row('.row-settings'));
    vi.advanceTimersByTime(299);
    expect(isOpen()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(isOpen()).toBe(true);
  });

  it('follows the row: the anchor moves to the row now in focus', () => {
    const { row, tip } = setup();
    row('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    row('.row-settings').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(tip.textContent).toBe('Settings');
    expect(row('.row-settings').style.getPropertyValue('anchor-name')).not.toBe('');
    expect(row('.row-inbox').style.getPropertyValue('anchor-name')).toBe('');
  });

  it('hides when the pointer leaves the row and on blur', () => {
    const { row, host, isOpen } = setup();
    row('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    pointer('pointerout', row('.row-inbox'), host.querySelector('.outside')!);
    expect(isOpen()).toBe(false);
    row('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    row('.row-inbox').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(isOpen()).toBe(false);
  });

  it('hides on Escape', () => {
    const { row, isOpen } = setup();
    row('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(isOpen()).toBe(false);
  });

  it('hides when the rows stop being railed and stays hidden while they are not', () => {
    const { fixture, row, isOpen } = setup();
    row('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.componentInstance.railed.set(false);
    TestBed.flushEffects();
    expect(isOpen()).toBe(false);
    row('.row-settings').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(isOpen()).toBe(false);
  });

  it('ignores elements that are not nav rows', () => {
    const { host, isOpen } = setup();
    host.querySelector('.outside')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(isOpen()).toBe(false);
  });

  it('removes the tooltip element on destroy', () => {
    const { fixture, host } = setup();
    fixture.destroy();
    expect(host.querySelector('.cngx-nav-rail-tooltip')).toBeNull();
  });
});
