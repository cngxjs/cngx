import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxDrawer } from '../drawer/drawer.directive';
import { CngxDrawerPanel } from '../drawer/drawer-panel.directive';
import { provideLayoutI18n, withLayoutI18nLabels } from '../i18n/layout-i18n';
import { CNGX_PANEL_TARGET, type CngxPanelTarget } from './panel-target';
import { CngxPanelTrigger, type CngxPanelTriggerAction } from './panel-trigger.directive';

function createTarget(withPeek = true) {
  const open = signal(false);
  const target: CngxPanelTarget & { peek?: () => void } = {
    id: signal('panel-a').asReadonly(),
    expanded: computed(() => open()),
    toggle: vi.fn(() => open.update((v) => !v)),
  };
  if (withPeek) {
    target.peek = vi.fn();
  }
  return { target, open };
}

@Component({
  template: `
    <button type="button" class="text" [cngxPanelTrigger]="target" [action]="action()">Menu</button>
    <button type="button" class="icon" [cngxPanelTrigger]="target" [label]="label()"></button>
    <span class="span" [cngxPanelTrigger]="target"></span>
  `,
  imports: [CngxPanelTrigger],
})
class Host {
  target: CngxPanelTarget = createTarget().target;
  readonly action = signal<CngxPanelTriggerAction>('toggle');
  readonly label = signal<string | undefined>(undefined);
}

@Component({
  template: `<div class="inside" cngxPanelTrigger></div>`,
  imports: [CngxPanelTrigger],
})
class InsideHost {}

@Component({
  template: `
    <button type="button" class="outside" [cngxPanelTrigger]="drawer">Menu</button>
    <div cngxDrawer #drawer="cngxDrawer" panelId="nav">
      <nav [cngxDrawerPanel]="drawer" mode="push">
        <button type="button" class="close" cngxPanelTrigger>Close</button>
      </nav>
    </div>
  `,
  imports: [CngxPanelTrigger, CngxDrawer, CngxDrawerPanel],
})
class DrawerHost {}

function setup(target = createTarget(), providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [Host], providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.target = target.target;
  fixture.detectChanges();
  TestBed.tick();
  const q = (sel: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(sel) as HTMLElement;
  return { fixture, ...target, q };
}

describe('CngxPanelTrigger', () => {
  it('mirrors expanded and points aria-controls at the target id', () => {
    const { fixture, open, q } = setup();
    expect(q('.text').getAttribute('aria-expanded')).toBe('false');
    expect(q('.text').getAttribute('aria-controls')).toBe('panel-a');

    open.set(true);
    fixture.detectChanges();
    expect(q('.text').getAttribute('aria-expanded')).toBe('true');
  });

  it('toggles the target on click', () => {
    const { target, q } = setup();
    q('.text').click();
    expect(target.toggle).toHaveBeenCalledTimes(1);
  });

  it('peeks when the action is peek', () => {
    const { fixture, target, q } = setup();
    fixture.componentInstance.action.set('peek');
    fixture.detectChanges();
    q('.text').click();
    expect(target.peek).toHaveBeenCalledTimes(1);
    expect(target.toggle).not.toHaveBeenCalled();
  });

  it('toggles a target without peek when the action is peek', () => {
    const { fixture, target, q } = setup(createTarget(false));
    fixture.componentInstance.action.set('peek');
    fixture.detectChanges();
    q('.text').click();
    expect(target.toggle).toHaveBeenCalledTimes(1);
  });

  it('keeps the text name of a trigger with text and names an icon trigger', () => {
    const { q } = setup();
    expect(q('.text').hasAttribute('aria-label')).toBe(false);
    expect(q('.icon').getAttribute('aria-label')).toBe('Toggle panel');
  });

  it('lets a bound label win and reads overridden layout copy', () => {
    const { fixture, q } = setup(createTarget(), [
      provideLayoutI18n(withLayoutI18nLabels({ panelTrigger: 'Bereich umschalten' })),
    ]);
    expect(q('.icon').getAttribute('aria-label')).toBe('Bereich umschalten');
    fixture.componentInstance.label.set('Filters');
    fixture.detectChanges();
    expect(q('.icon').getAttribute('aria-label')).toBe('Filters');
  });

  it('gives a non-button host button semantics and Enter / Space activation', () => {
    const { target, q } = setup();
    const span = q('.span');
    expect(span.getAttribute('role')).toBe('button');
    expect(span.getAttribute('tabindex')).toBe('0');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    span.dispatchEvent(enter);
    span.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    expect(target.toggle).toHaveBeenCalledTimes(2);
    expect(enter.defaultPrevented).toBe(true);
  });

  it('leaves Enter / Space to a native button', () => {
    const { target, q } = setup();
    const button = q('.text');
    expect(button.hasAttribute('role')).toBe(false);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(target.toggle).not.toHaveBeenCalled();
  });

  it('resolves a bare trigger from CNGX_PANEL_TARGET', () => {
    const { target } = createTarget();
    TestBed.configureTestingModule({
      imports: [InsideHost],
      providers: [{ provide: CNGX_PANEL_TARGET, useValue: target }],
    });
    const fixture = TestBed.createComponent(InsideHost);
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelector('.inside') as HTMLElement;
    expect(el.getAttribute('aria-controls')).toBe('panel-a');
    el.click();
    expect(target.toggle).toHaveBeenCalledTimes(1);
  });

  describe('with CngxDrawer', () => {
    function setupDrawer() {
      TestBed.configureTestingModule({ imports: [DrawerHost] });
      const fixture = TestBed.createComponent(DrawerHost);
      fixture.detectChanges();
      const q = (sel: string) =>
        (fixture.nativeElement as HTMLElement).querySelector(sel) as HTMLElement;
      return { fixture, q };
    }

    it('controls the panel the drawer names', () => {
      const { q } = setupDrawer();
      expect(q('nav').id).toBe('nav');
      expect(q('.outside').getAttribute('aria-controls')).toBe('nav');
    });

    it('opens and closes the drawer with one press each, the press not counting as outside', () => {
      const { fixture, q } = setupDrawer();
      const press = () => {
        q('.outside').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        q('.outside').click();
        fixture.detectChanges();
      };
      press();
      expect(q('.outside').getAttribute('aria-expanded')).toBe('true');
      press();
      expect(q('.outside').getAttribute('aria-expanded')).toBe('false');
    });

    it('closes the drawer from a bare trigger inside it', () => {
      const { fixture, q } = setupDrawer();
      q('.outside').click();
      fixture.detectChanges();
      q('.close').click();
      fixture.detectChanges();
      expect(q('.outside').getAttribute('aria-expanded')).toBe('false');
    });
  });
});
