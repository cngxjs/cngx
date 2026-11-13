import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideDirection } from '@cngx/core';
import {
  CNGX_ICON_MENU,
  CNGX_ICON_PANEL_CLOSE,
  CNGX_ICON_PANEL_OPEN,
  CNGX_ICON_X,
} from '@cngx/utils';
import { describe, expect, it, vi } from 'vitest';

import { CngxDrawer } from '../drawer/drawer.directive';
import { CngxDrawerPanel, type DrawerMode } from '../drawer/drawer-panel.directive';
import type { CngxDrawerModality } from '../drawer/drawer-surface.directive';
import type { DrawerPosition } from '../drawer/drawer.directive';
import { CngxSidebar } from '../sidebar/sidebar.directive';
import type { CngxPanelSide, CngxPanelTarget } from '../panel-trigger/panel-target';
import { CngxPanelToggle } from './panel-toggle.component';

@Component({
  template: `
    <button
      type="button"
      class="toggle"
      [cngxPanelToggle]="drawer"
      [disabled]="disabled()"
    ></button>
    <div cngxDrawer #drawer="cngxDrawer" panelId="nav">
      <nav
        [cngxDrawerPanel]="drawer"
        [mode]="mode()"
        [modality]="modality()"
        [position]="position()"
      >
        Links
      </nav>
    </div>
  `,
  imports: [CngxPanelToggle, CngxDrawer, CngxDrawerPanel],
})
class DrawerHost {
  readonly mode = signal<DrawerMode>('over');
  readonly modality = signal<CngxDrawerModality | undefined>(undefined);
  readonly position = signal<DrawerPosition>('left');
  readonly disabled = signal(false);
}

@Component({
  template: `
    <button type="button" class="toggle" [cngxPanelToggle]="sidebar"></button>
    <nav cngxSidebar #sidebar="cngxSidebar" id="side" [(collapsed)]="collapsed">Links</nav>
  `,
  imports: [CngxPanelToggle, CngxSidebar],
})
class SidebarHost {
  readonly collapsed = signal(false);
}

@Component({
  template: `
    <button type="button" class="toggle" [cngxPanelToggle]="target()" label="Filters"></button>
  `,
  imports: [CngxPanelToggle],
})
class TargetHost {
  readonly target = signal<CngxPanelTarget>(createTarget());
}

function createTarget(side?: CngxPanelSide): CngxPanelTarget {
  const open = signal(false);
  return {
    id: signal('panel-a').asReadonly(),
    expanded: computed(() => open()),
    toggle: vi.fn(() => open.update((v) => !v)),
    ...(side ? { side: signal(side).asReadonly() } : {}),
  };
}

function mount<T>(host: new () => T, providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [host], providers: providers as never[] });
  const fixture = TestBed.createComponent(host);
  const settle = () => {
    fixture.detectChanges();
    TestBed.tick();
  };
  settle();
  const el = fixture.nativeElement as HTMLElement;
  const toggle = el.querySelector('.toggle') as HTMLButtonElement;
  const glyph = () => toggle.querySelector('svg.cngx-panel-toggle__icon') as SVGSVGElement;
  const path = () => glyph().querySelector('.cngx-icon-svg__path')?.getAttribute('d');
  const mirrored = () => glyph().classList.contains('cngx-panel-toggle__icon--mirrored');
  return { fixture, host: fixture.componentInstance, settle, toggle, glyph, path, mirrored };
}

@Component({
  template: `
    <button type="button" class="toggle" [cngxPanelToggle]="drawer" #toggle="cngxPanelToggle">
      <span
        class="glyph"
        [attr.data-expanded]="toggle.expanded()"
        [attr.data-modal]="toggle.modalOverlay()"
        [attr.data-mirrored]="toggle.mirrored()"
      ></span>
    </button>
    <div cngxDrawer #drawer="cngxDrawer" panelId="nav">
      <nav [cngxDrawerPanel]="drawer" [mode]="mode()" position="right">Links</nav>
    </div>
  `,
  imports: [CngxPanelToggle, CngxDrawer, CngxDrawerPanel],
})
class ProjectedGlyphHost {
  readonly mode = signal<DrawerMode>('push');
}

describe('CngxPanelToggle', () => {
  it('is an icon button on the button core', () => {
    const { toggle } = mount(SidebarHost);
    expect(toggle.classList).toContain('cngx-button');
    expect(toggle.classList).toContain('cngx-icon-button');
    expect(toggle.classList).toContain('cngx-panel-toggle');
    expect(toggle.getAttribute('data-variant')).toBe('ghost');
    expect(toggle.getAttribute('type')).toBe('button');
  });

  it('shows the hamburger on a closed modal over-drawer and the cross while it is open', () => {
    const { fixture, settle, toggle, path, mirrored } = mount(DrawerHost);
    expect(path()).toBe(CNGX_ICON_MENU.d);
    expect(mirrored()).toBe(false);
    toggle.click();
    settle();
    expect(fixture.nativeElement.querySelector('nav').classList).toContain(
      'cngx-drawer-panel--open',
    );
    expect(path()).toBe(CNGX_ICON_X.d);
  });

  it('counts a contained over-drawer as modal', () => {
    const { host, settle, path } = mount(DrawerHost);
    host.modality.set('contained');
    settle();
    expect(path()).toBe(CNGX_ICON_MENU.d);
  });

  it('shows the open glyph on a closed push drawer and the close glyph while it is open', () => {
    const { host, settle, toggle, path } = mount(DrawerHost);
    host.mode.set('push');
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_OPEN.d);
    toggle.click();
    settle();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(path()).toBe(CNGX_ICON_PANEL_CLOSE.d);
    toggle.click();
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_OPEN.d);
  });

  it('shows the panel glyph on a non-modal over-drawer', () => {
    const { host, settle, path } = mount(DrawerHost);
    host.modality.set('none');
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_OPEN.d);
  });

  it('follows a breakpoint that switches the live mode', () => {
    const { host, settle, toggle, path } = mount(DrawerHost);
    host.mode.set('push');
    settle();
    toggle.click();
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_CLOSE.d);
    // Narrow viewport: the same open drawer becomes the modal mobile nav.
    host.mode.set('over');
    settle();
    expect(path()).toBe(CNGX_ICON_X.d);
    host.mode.set('push');
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_CLOSE.d);
  });

  it('mirrors the panel glyph for a drawer on the right in both states', () => {
    const { host, settle, toggle, path, mirrored } = mount(DrawerHost);
    host.mode.set('push');
    settle();
    expect(mirrored()).toBe(false);
    host.position.set('right');
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_OPEN.d);
    expect(mirrored()).toBe(true);
    toggle.click();
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_CLOSE.d);
    expect(mirrored()).toBe(true);
  });

  it('keeps a physical left drawer unmirrored under RTL', () => {
    const { host, settle, mirrored } = mount(DrawerHost, [provideDirection('rtl')]);
    host.mode.set('push');
    settle();
    expect(mirrored()).toBe(false);
  });

  it('shows the close glyph on an expanded sidebar and the open glyph once collapsed', () => {
    const { host, settle, path, mirrored } = mount(SidebarHost);
    expect(path()).toBe(CNGX_ICON_PANEL_CLOSE.d);
    expect(mirrored()).toBe(false);
    host.collapsed.set(true);
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_OPEN.d);
    expect(mirrored()).toBe(false);
  });

  it('mirrors the sidebar glyph under RTL in both states', () => {
    const { host, settle, path, mirrored } = mount(SidebarHost, [provideDirection('rtl')]);
    expect(path()).toBe(CNGX_ICON_PANEL_CLOSE.d);
    expect(mirrored()).toBe(true);
    host.collapsed.set(true);
    settle();
    expect(path()).toBe(CNGX_ICON_PANEL_OPEN.d);
    expect(mirrored()).toBe(true);
  });

  it('mirrors an end-side panel in LTR and not in RTL', () => {
    const ltr = mount(TargetHost);
    ltr.host.target.set(createTarget('end'));
    ltr.settle();
    expect(ltr.mirrored()).toBe(true);
    TestBed.resetTestingModule();

    const rtl = mount(TargetHost, [provideDirection('rtl')]);
    rtl.host.target.set(createTarget('end'));
    rtl.settle();
    expect(rtl.mirrored()).toBe(false);
  });

  it('reads a target without mode, modal or side as an inline start panel', () => {
    const { path, mirrored } = mount(TargetHost);
    expect(path()).toBe(CNGX_ICON_PANEL_OPEN.d);
    expect(mirrored()).toBe(false);
  });

  it('exposes the glyph state to a projected glyph and draws no default one', () => {
    TestBed.configureTestingModule({ imports: [ProjectedGlyphHost] });
    const fixture = TestBed.createComponent(ProjectedGlyphHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const glyph = root.querySelector('.glyph') as HTMLElement;
    const read = () => [
      glyph.dataset['expanded'],
      glyph.dataset['modal'],
      glyph.dataset['mirrored'],
    ];

    expect(root.querySelector('.cngx-panel-toggle__icon')).toBeNull();
    expect(read()).toEqual(['false', 'false', 'true']);

    (root.querySelector('.toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(read()).toEqual(['true', 'false', 'true']);

    fixture.componentInstance.mode.set('over');
    fixture.detectChanges();
    expect(read()).toEqual(['true', 'true', 'false']);
  });

  it('hides the glyph from assistive technology', () => {
    const { toggle, glyph } = mount(SidebarHost);
    expect(toggle.querySelector('.cngx-icon-button__glyph')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(glyph().getAttribute('aria-hidden')).toBe('true');
  });

  it('is named after the sidebar region and keeps the name across states', () => {
    const { host, settle, toggle } = mount(SidebarHost);
    expect(toggle.getAttribute('aria-label')).toBe('Sidebar');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    host.collapsed.set(true);
    settle();
    expect(toggle.getAttribute('aria-label')).toBe('Sidebar');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps its name while a disabled reason renders', () => {
    TestBed.configureTestingModule({ imports: [ReasonHost] });
    const fixture = TestBed.createComponent(ReasonHost);
    fixture.detectChanges();
    TestBed.tick();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector('.toggle')!;
    expect(toggle.getAttribute('aria-label')).toBe('Sidebar');
  });

  it('takes a bound label over the panel name', () => {
    const { toggle } = mount(TargetHost);
    expect(toggle.getAttribute('aria-label')).toBe('Filters');
  });

  it('takes the default name for a drawer, whatever its state', () => {
    const { settle, toggle } = mount(DrawerHost);
    expect(toggle.getAttribute('aria-label')).toBe('Panel');
    toggle.click();
    settle();
    expect(toggle.getAttribute('aria-label')).toBe('Panel');
  });

  it('composes the panel trigger: aria-expanded, aria-controls and the toggle', () => {
    const { fixture, settle, toggle } = mount(DrawerHost);
    const drawer = fixture.debugElement.children[1].injector.get(CngxDrawer);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe('nav');
    toggle.click();
    settle();
    expect(drawer.opened()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    settle();
    expect(drawer.opened()).toBe(false);
  });

  it('swallows activation while disabled', () => {
    const { fixture, host, settle, toggle } = mount(DrawerHost);
    const drawer = fixture.debugElement.children[1].injector.get(CngxDrawer);
    host.disabled.set(true);
    settle();
    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    toggle.click();
    settle();
    expect(drawer.opened()).toBe(false);
  });

  // A11: expected to fail until PR 8 (T8) removes the aria-expanded exemption in the click guard.
  it.fails('swallows activation while disabled with its panel open', () => {
    const { fixture, host, settle, toggle } = mount(DrawerHost);
    const drawer = fixture.debugElement.children[1].injector.get(CngxDrawer);
    toggle.click();
    settle();
    expect(drawer.opened()).toBe(true);
    host.disabled.set(true);
    settle();
    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    settle();
    expect(drawer.opened()).toBe(true);
  });
});

@Component({
  template: `
    <button
      type="button"
      class="toggle"
      [cngxPanelToggle]="sidebar"
      disabled
      disabledReason="Locked"
    ></button>
    <nav cngxSidebar #sidebar="cngxSidebar">Links</nav>
  `,
  imports: [CngxPanelToggle, CngxSidebar],
})
class ReasonHost {}
