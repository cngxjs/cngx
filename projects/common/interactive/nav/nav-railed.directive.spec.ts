import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxNavGroup } from './nav-group.directive';
import { CngxNavGroupContent } from './nav-group-content.directive';
import { CngxNavLink } from './nav-link.directive';
import { CngxNavRailed } from './nav-railed.directive';

@Component({
  imports: [CngxNavRailed, CngxNavLink, CngxNavGroup, CngxNavGroupContent],
  template: `
    <aside
      class="rail"
      [cngxNavRailed]="railed()"
      [cngxNavRailedSide]="side()"
      [hoverDelay]="hoverDelay()"
    >
      <a cngxNavLink href="#inbox" class="inbox">Inbox</a>
      <button type="button" cngxNavGroup #reports="cngxNavGroup" class="head">Reports</button>
      <div [cngxNavGroupContent]="reports" class="content">
        <div><a cngxNavLink href="#weekly" class="weekly">Weekly</a></div>
      </div>
    </aside>
  `,
})
class TestHost {
  readonly railed = signal(true);
  readonly side = signal<'start' | 'end'>('start');
  readonly hoverDelay = signal(300);
}

function setup(railed = true) {
  const fixture = TestBed.createComponent(TestHost);
  fixture.componentInstance.railed.set(railed);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.nativeElement as HTMLElement;
  const el = (selector: string) => host.querySelector<HTMLElement>(selector)!;
  const settle = () => {
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
  };
  const tip = () => host.querySelector<HTMLElement>('.cngx-nav-rail-tooltip');
  const flyoutOpen = () => el('.content').hasAttribute('data-popover-open');
  return { fixture, el, settle, tip, flyoutOpen };
}

/**
 * Keyboard focus. jsdom has no `:focus-visible` heuristic, so the row reports
 * it while it holds focus.
 */
function keyFocus(el: HTMLElement): void {
  const matches = el.matches.bind(el);
  Object.defineProperty(el, 'matches', {
    configurable: true,
    value: (selector: string) =>
      selector === ':focus-visible' ? el.ownerDocument.activeElement === el : matches(selector),
  });
  el.focus();
}

describe('CngxNavRailed', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the row label in a tooltip on keyboard focus while railed', () => {
    const { el, tip } = setup();
    keyFocus(el('.inbox'));
    expect(tip()?.hasAttribute('data-popover-open')).toBe(true);
    expect(tip()?.textContent).toBe('Inbox');
    expect(tip()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens a group as a flyout and Escape returns focus to the head', () => {
    const { el, settle, flyoutOpen } = setup();
    expect(el('.content').getAttribute('popover')).toBe('manual');
    el('.head').click();
    settle();
    expect(el('.head').getAttribute('aria-expanded')).toBe('true');
    expect(flyoutOpen()).toBe(true);
    el('.weekly').focus();
    el('.weekly').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    settle();
    expect(flyoutOpen()).toBe(false);
    expect(document.activeElement).toBe(el('.head'));
  });

  it('attaches neither tooltip nor flyout while not railed', () => {
    const { el, settle, tip } = setup(false);
    expect(tip()).toBeNull();
    expect(el('.content').hasAttribute('popover')).toBe(false);
    el('.head').click();
    settle();
    expect(el('.head').getAttribute('aria-expanded')).toBe('true');
    expect(el('.content').hasAttribute('popover')).toBe(false);
  });

  it('follows the bound rail state without syncing it', () => {
    const { fixture, settle, tip } = setup(false);
    fixture.componentInstance.railed.set(true);
    settle();
    expect(tip()).not.toBeNull();
    fixture.componentInstance.railed.set(false);
    settle();
    expect(tip()).toBeNull();
  });

  it('writes data-nav-railed on the host only while railed', () => {
    const { fixture, el, settle } = setup(false);
    expect(el('.rail').hasAttribute('data-nav-railed')).toBe(false);
    fixture.componentInstance.railed.set(true);
    settle();
    expect(el('.rail').getAttribute('data-nav-railed')).toBe('');
  });

  it('opens away from cngxNavRailedSide', () => {
    const { fixture, el, settle } = setup();
    fixture.componentInstance.side.set('end');
    settle();
    expect(el('.content').getAttribute('data-cngx-rail-side')).toBe('end');
  });

  it('takes the pointer dwell from hoverDelay', () => {
    vi.useFakeTimers();
    const { fixture, el, settle, tip } = setup();
    fixture.componentInstance.hoverDelay.set(500);
    settle();
    el('.inbox').dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
    vi.advanceTimersByTime(499);
    expect(tip()?.hasAttribute('data-popover-open')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(tip()?.hasAttribute('data-popover-open')).toBe(true);
  });
});
