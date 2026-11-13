import { Component, ElementRef, signal, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxNavGroup, CngxNavGroupContent } from '@cngx/common/interactive';
import { describe, expect, it } from 'vitest';

import type { CngxNavRailSide } from './nav-rail';
import { injectNavRailFlyout } from './nav-rail-flyout';

@Component({
  selector: 'test-rail',
  imports: [CngxNavGroup, CngxNavGroupContent],
  template: `
    <button type="button" cngxNavGroup #settings="cngxNavGroup" class="head-a">Settings</button>
    <div [cngxNavGroupContent]="settings" class="content-a">
      <div>
        <a href="#general" class="link-a1">General</a>
        <a href="#security" class="link-a2">Security</a>
      </div>
    </div>
    <button type="button" cngxNavGroup #team="cngxNavGroup" class="head-b">Team</button>
    <div [cngxNavGroupContent]="team" class="content-b">
      <div><a href="#members">Members</a></div>
    </div>
    <button type="button" class="outside">Elsewhere</button>
  `,
})
class TestRail {
  readonly railed = signal(true);
  readonly side = signal<CngxNavRailSide>('start');
  readonly groups = viewChildren(CngxNavGroup);
  readonly groupElements = viewChildren(CngxNavGroup, { read: ElementRef });
  readonly contents = viewChildren(CngxNavGroupContent);
  readonly contentElements = viewChildren(CngxNavGroupContent, { read: ElementRef });

  constructor() {
    injectNavRailFlyout({
      railed: this.railed,
      side: this.side,
      groups: this.groups,
      groupElements: this.groupElements,
      contents: this.contents,
      contentElements: this.contentElements,
    });
  }
}

function setup(railed = true) {
  const fixture = TestBed.createComponent(TestRail);
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
  const open = (selector: string) => el(selector).hasAttribute('data-popover-open');
  return { fixture, host, el, settle, open };
}

describe('injectNavRailFlyout', () => {
  it('turns each group content into a manual popover anchored to its head while railed', () => {
    const { el } = setup();
    expect(el('.content-a').getAttribute('popover')).toBe('manual');
    const anchor = el('.head-a').style.getPropertyValue('anchor-name');
    expect(anchor).not.toBe('');
    expect(el('.content-a').style.getPropertyValue('position-anchor')).toBe(anchor);
    expect(el('.head-b').style.getPropertyValue('anchor-name')).not.toBe(anchor);
  });

  it('marks the flyout content with the rail side and follows a flip', () => {
    const { fixture, el, settle } = setup();
    expect(el('.content-a').getAttribute('data-cngx-rail-side')).toBe('start');
    fixture.componentInstance.side.set('end');
    settle();
    expect(el('.content-a').getAttribute('data-cngx-rail-side')).toBe('end');
    expect(el('.content-b').getAttribute('data-cngx-rail-side')).toBe('end');
  });

  it('leaves the group content inline while not railed', () => {
    const { el } = setup(false);
    expect(el('.content-a').hasAttribute('popover')).toBe(false);
    expect(el('.content-a').hasAttribute('data-cngx-rail-side')).toBe(false);
    expect(el('.head-a').style.getPropertyValue('anchor-name')).toBe('');
  });

  it('opens the flyout with the disclosure, so aria-expanded stays the one source', () => {
    const { el, settle, open } = setup();
    el('.head-a').click();
    settle();
    expect(el('.head-a').getAttribute('aria-expanded')).toBe('true');
    expect(open('.content-a')).toBe(true);
    expect(open('.content-b')).toBe(false);
    el('.head-a').click();
    settle();
    expect(el('.head-a').getAttribute('aria-expanded')).toBe('false');
    expect(open('.content-a')).toBe(false);
  });

  it('keeps the links reachable in DOM order and gives them no menu roles', () => {
    const { host, el, settle } = setup();
    el('.head-a').click();
    settle();
    expect(el('.content-a').hasAttribute('inert')).toBe(false);
    const order = Array.from(host.querySelectorAll('button, a'));
    expect(order.indexOf(el('.link-a1'))).toBe(order.indexOf(el('.head-a')) + 1);
    expect(host.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
    expect(el('.link-a1').hasAttribute('role')).toBe(false);
  });

  it('closes open groups when the rows enter the rail', () => {
    const { fixture, el, settle, open } = setup(false);
    el('.head-a').click();
    settle();
    expect(el('.head-a').getAttribute('aria-expanded')).toBe('true');
    fixture.componentInstance.railed.set(true);
    settle();
    expect(el('.head-a').getAttribute('aria-expanded')).toBe('false');
    expect(open('.content-a')).toBe(false);
  });

  it('hides the flyout when the rows leave the rail and shows the group inline, still open', () => {
    const { fixture, el, settle, open } = setup();
    el('.head-a').click();
    settle();
    fixture.componentInstance.railed.set(false);
    settle();
    expect(open('.content-a')).toBe(false);
    expect(el('.content-a').hasAttribute('popover')).toBe(false);
    expect(el('.head-a').getAttribute('aria-expanded')).toBe('true');
    expect(el('.content-a').classList.contains('cngx-nav-group-content--open')).toBe(true);
  });

  it('closes on Escape and moves focus to the head', () => {
    const { el, settle, open } = setup();
    el('.head-a').click();
    settle();
    el('.link-a1').focus();
    el('.link-a1').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    settle();
    expect(open('.content-a')).toBe(false);
    expect(document.activeElement).toBe(el('.head-a'));
  });

  it('leaves an Escape outside the head and the flyout to its owner', () => {
    const { el, settle, open } = setup();
    el('.head-a').click();
    settle();
    const seen: KeyboardEvent[] = [];
    const listener = (event: Event) => seen.push(event as KeyboardEvent);
    document.addEventListener('keydown', listener);
    el('.outside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.removeEventListener('keydown', listener);
    settle();
    expect(seen).toHaveLength(1);
    expect(open('.content-a')).toBe(true);
  });

  it('closes when focus moves to an element outside the head and the flyout', () => {
    const { el, settle, open } = setup();
    el('.head-a').click();
    settle();
    el('.link-a1').dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: el('.link-a2') }),
    );
    settle();
    expect(open('.content-a')).toBe(true);
    el('.link-a2').dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: el('.outside') }),
    );
    settle();
    expect(open('.content-a')).toBe(false);
    expect(el('.head-a').getAttribute('aria-expanded')).toBe('false');
  });

  it('stays open when the window loses focus', () => {
    const { el, settle, open } = setup();
    el('.head-a').click();
    settle();
    el('.link-a1').dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    );
    settle();
    expect(open('.content-a')).toBe(true);
  });

  it('closes on a press outside the head and the flyout, but not on a press inside', () => {
    const { el, settle, open } = setup();
    el('.head-a').click();
    settle();
    el('.link-a2').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    settle();
    expect(open('.content-a')).toBe(true);
    el('.outside').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    settle();
    expect(open('.content-a')).toBe(false);
  });

  it('closes an open flyout when the host turns inert', async () => {
    const { host, el, settle, open } = setup();
    el('.head-a').click();
    settle();
    host.setAttribute('inert', '');
    await new Promise((resolve) => setTimeout(resolve));
    settle();
    expect(open('.content-a')).toBe(false);
  });

  it('releases the popover wiring on destroy', () => {
    const { fixture, el } = setup();
    const content = el('.content-a');
    fixture.destroy();
    expect(content.hasAttribute('popover')).toBe(false);
    expect(content.hasAttribute('data-cngx-rail-side')).toBe(false);
  });
});
