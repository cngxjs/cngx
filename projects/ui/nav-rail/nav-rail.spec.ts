import { Component, effect, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxNavFooter,
  CngxNavGroup,
  CngxNavGroupContent,
  CngxNavHeader,
  CngxNavLink,
} from '@cngx/common/interactive';
import { describe, expect, it, vi } from 'vitest';

import { CNGX_NAV_RAIL_I18N, provideNavRailI18n, withNavRailI18nLabels } from './nav-rail-i18n';
import { CngxNavRail, type CngxNavRailLabelPlacement } from './nav-rail';
import { CNGX_NAV_RAIL_FLYOUT_FACTORY, injectNavRailFlyout } from './nav-rail-flyout';
import { CNGX_NAV_RAIL_TOOLTIP_FACTORY, injectNavRailTooltip } from './nav-rail-tooltip';

@Component({
  imports: [
    CngxNavRail,
    CngxNavLink,
    CngxNavGroup,
    CngxNavGroupContent,
    CngxNavHeader,
    CngxNavFooter,
  ],
  template: `
    <cngx-nav-rail [labelPlacement]="placement()" [ariaLabel]="label()" [tooltip]="tooltip()">
      <cngx-nav-footer class="footer">v1</cngx-nav-footer>
      <a cngxNavLink href="#inbox" class="row-inbox">Inbox</a>
      <button type="button" cngxNavGroup #reports="cngxNavGroup" class="head">Reports</button>
      <div [cngxNavGroupContent]="reports" class="content">
        <div><a cngxNavLink href="#weekly" [depth]="1">Weekly</a></div>
      </div>
      <cngx-nav-header class="header">Acme</cngx-nav-header>
    </cngx-nav-rail>
  `,
})
class RailHost {
  readonly placement = signal<CngxNavRailLabelPlacement>('end');
  readonly label = signal<string | undefined>(undefined);
  readonly tooltip = signal<boolean | undefined>(undefined);
}

function setup() {
  const fixture = TestBed.createComponent(RailHost);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.nativeElement as HTMLElement;
  const rail = host.querySelector<HTMLElement>('cngx-nav-rail')!;
  const el = (selector: string) => host.querySelector<HTMLElement>(selector)!;
  const settle = () => {
    fixture.detectChanges();
    TestBed.flushEffects();
  };
  return { fixture, rail, el, settle };
}

describe('CngxNavRail', () => {
  it('is a navigation landmark named by the language pack while [ariaLabel] is unbound', () => {
    const { rail } = setup();
    expect(rail.getAttribute('role')).toBe('navigation');
    expect(rail.getAttribute('aria-label')).toBe('Navigation');
  });

  it('lets a bound [ariaLabel] win over the copy', () => {
    const { fixture, rail, settle } = setup();
    fixture.componentInstance.label.set('Main');
    settle();
    expect(rail.getAttribute('aria-label')).toBe('Main');
  });

  it('follows a provided copy signal, so the name follows a language switch', () => {
    const copy = signal({ ariaLabel: 'Hauptnavigation' });
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_NAV_RAIL_I18N, useValue: copy }],
    });
    const { rail, settle } = setup();
    expect(rail.getAttribute('aria-label')).toBe('Hauptnavigation');
    copy.set({ ariaLabel: 'Navigazione' });
    settle();
    expect(rail.getAttribute('aria-label')).toBe('Navigazione');
  });

  it('takes a single key from provideNavRailI18n(withNavRailI18nLabels(...)), also as a Signal', () => {
    const copy = signal<{ ariaLabel?: string }>({ ariaLabel: 'Hauptnavigation' });
    TestBed.configureTestingModule({
      providers: [provideNavRailI18n(withNavRailI18nLabels(copy))],
    });
    const { rail, settle } = setup();
    expect(rail.getAttribute('aria-label')).toBe('Hauptnavigation');
    copy.set({});
    settle();
    expect(rail.getAttribute('aria-label')).toBe('Navigation');
  });

  it('reflects the look as data-label-placement', () => {
    const { fixture, rail, settle } = setup();
    expect(rail.getAttribute('data-label-placement')).toBe('end');
    fixture.componentInstance.placement.set('below');
    settle();
    expect(rail.getAttribute('data-label-placement')).toBe('below');
  });

  it('projects the header first, the rows in the body and the footer last', () => {
    const { rail } = setup();
    // The tooltip is a top-layer popover and takes no part in the layout.
    const children = Array.from(rail.children).filter(
      (child) => !child.classList.contains('cngx-nav-rail-tooltip'),
    );
    expect(children[0].classList.contains('header')).toBe(true);
    expect(children[1].classList.contains('cngx-nav-rail__body')).toBe(true);
    expect(children[1].querySelector('.row-inbox')).not.toBeNull();
    expect(children.at(-1)?.classList.contains('footer')).toBe(true);
  });

  it('shows the row label in a tooltip in the icon-only look and not in the stacked look', () => {
    const { fixture, rail, el, settle } = setup();
    const tip = rail.querySelector<HTMLElement>('.cngx-nav-rail-tooltip')!;
    // Keyboard focus: jsdom has no :focus-visible heuristic, so the row reports it.
    const row = el('.row-inbox');
    const matches = row.matches.bind(row);
    row.matches = (selector: string) => selector === ':focus-visible' || matches(selector);
    row.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(tip.hasAttribute('data-popover-open')).toBe(true);
    el('.row-inbox').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.componentInstance.placement.set('below');
    settle();
    el('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(tip.hasAttribute('data-popover-open')).toBe(false);
  });

  it('sets the tooltip up and tears it down when [tooltip] flips at runtime', () => {
    const { fixture, rail, el, settle } = setup();
    const listen = vi.spyOn(rail, 'addEventListener');
    fixture.componentInstance.tooltip.set(false);
    settle();
    expect(rail.querySelector('.cngx-nav-rail-tooltip')).toBeNull();
    // Off: focus on a row finds nothing to open.
    el('.row-inbox').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(rail.querySelector('.cngx-nav-rail-tooltip')).toBeNull();
    fixture.componentInstance.tooltip.set(true);
    settle();
    expect(rail.querySelectorAll('.cngx-nav-rail-tooltip')).toHaveLength(1);
    expect(listen).toHaveBeenCalled();
    listen.mockRestore();
  });

  it('creates no tooltip in the stacked look even with [tooltip] on', () => {
    const { fixture, rail, settle } = setup();
    fixture.componentInstance.tooltip.set(true);
    fixture.componentInstance.placement.set('below');
    settle();
    expect(rail.querySelector('.cngx-nav-rail-tooltip')).toBeNull();
  });

  it('defaults its swap tokens to the shipped injection functions', () => {
    expect(TestBed.inject(CNGX_NAV_RAIL_TOOLTIP_FACTORY)).toBe(injectNavRailTooltip);
    expect(TestBed.inject(CNGX_NAV_RAIL_FLYOUT_FACTORY)).toBe(injectNavRailFlyout);
  });

  it('lets the swap tokens replace or drop tooltip and flyout, with the switch folded in', () => {
    const seen: boolean[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_NAV_RAIL_TOOLTIP_FACTORY,
          useValue: (active: Signal<boolean>) => {
            effect(() => {
              seen.push(active());
            });
          },
        },
        { provide: CNGX_NAV_RAIL_FLYOUT_FACTORY, useValue: () => undefined },
      ],
    });
    const { fixture, rail, el, settle } = setup();
    expect(rail.querySelector('.cngx-nav-rail-tooltip')).toBeNull();
    expect(el('.content').hasAttribute('popover')).toBe(false);
    fixture.componentInstance.tooltip.set(false);
    settle();
    expect(seen).toEqual([true, false]);
  });

  it('opens a projected nav group as a flyout', () => {
    const { el, settle } = setup();
    expect(el('.content').getAttribute('popover')).toBe('manual');
    el('.head').click();
    settle();
    expect(el('.head').getAttribute('aria-expanded')).toBe('true');
    expect(el('.content').hasAttribute('data-popover-open')).toBe(true);
  });
});
