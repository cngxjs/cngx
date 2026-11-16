import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { describe, expect, it, vi } from 'vitest';
import { CngxDrawer } from './drawer.directive';
import { CngxDrawerContent } from './drawer-content.directive';
import { CngxDrawerPanel, type DrawerMode } from './drawer-panel.directive';

@Component({
  template: `
    <div cngxDrawer #drawer="cngxDrawer">
      <main [cngxDrawerContent]="drawer">Content</main>
    </div>
  `,
  imports: [CngxDrawer, CngxDrawerContent],
})
class TestHost {}

@Component({
  template: `
    <div cngxDrawer #drawer="cngxDrawer">
      <nav [cngxDrawerPanel]="drawer" [mode]="mode()" [position]="position()">Panel</nav>
      <main [cngxDrawerContent]="drawer">Content</main>
    </div>
  `,
  imports: [CngxDrawer, CngxDrawerContent, CngxDrawerPanel],
})
class PanelHost {
  readonly mode = signal<DrawerMode>('push');
  readonly position = signal<'left' | 'right' | 'top' | 'bottom'>('left');
}

describe('CngxDrawerContent', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        {
          provide: FocusTrapFactory,
          useValue: {
            create: vi.fn(() => ({
              enabled: false,
              focusFirstTabbableElementWhenReady: vi.fn(),
              focusLastTabbableElementWhenReady: vi.fn(),
              destroy: vi.fn(),
            })),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const drawer = fixture.debugElement.query(By.directive(CngxDrawer)).injector.get(CngxDrawer);
    const content = fixture.debugElement
      .query(By.directive(CngxDrawerContent))
      .injector.get(CngxDrawerContent);
    const contentEl = fixture.debugElement.query(By.directive(CngxDrawerContent))
      .nativeElement as HTMLElement;
    return { fixture, drawer, content, contentEl };
  }

  it('has cngx-drawer-content class', () => {
    const { contentEl } = setup();
    expect(contentEl.classList.contains('cngx-drawer-content')).toBe(true);
  });

  it('reflects isOpen from drawer ref', () => {
    const { content, drawer } = setup();
    expect(content.isOpen()).toBe(false);
    drawer.open();
    expect(content.isOpen()).toBe(true);
  });

  it('adds shifted class when drawer is open', () => {
    const { fixture, drawer, contentEl } = setup();
    expect(contentEl.classList.contains('cngx-drawer-content--shifted')).toBe(false);
    drawer.open();
    fixture.detectChanges();
    expect(contentEl.classList.contains('cngx-drawer-content--shifted')).toBe(true);
  });

  it('removes shifted class when drawer closes', () => {
    const { fixture, drawer, contentEl } = setup();
    drawer.open();
    fixture.detectChanges();
    drawer.close();
    fixture.detectChanges();
    expect(contentEl.classList.contains('cngx-drawer-content--shifted')).toBe(false);
  });

  describe('data-drawer-push', () => {
    function setupPanel() {
      TestBed.configureTestingModule({ imports: [PanelHost] });
      const fixture = TestBed.createComponent(PanelHost);
      fixture.detectChanges();
      const drawer = fixture.debugElement.query(By.directive(CngxDrawer)).injector.get(CngxDrawer);
      const contentEl = fixture.debugElement.query(By.directive(CngxDrawerContent))
        .nativeElement as HTMLElement;
      return { fixture, drawer, contentEl };
    }

    it('writes the side of an open push panel and nothing while closed', () => {
      const { fixture, drawer, contentEl } = setupPanel();
      expect(contentEl.hasAttribute('data-drawer-push')).toBe(false);
      drawer.open();
      fixture.detectChanges();
      expect(contentEl.getAttribute('data-drawer-push')).toBe('left');
      fixture.componentInstance.position.set('bottom');
      fixture.detectChanges();
      expect(contentEl.getAttribute('data-drawer-push')).toBe('bottom');
      drawer.close();
      fixture.detectChanges();
      expect(contentEl.hasAttribute('data-drawer-push')).toBe(false);
    });

    it('writes nothing for an open over panel', () => {
      const { fixture, drawer, contentEl } = setupPanel();
      fixture.componentInstance.mode.set('over');
      drawer.open();
      fixture.detectChanges();
      expect(contentEl.hasAttribute('data-drawer-push')).toBe(false);
    });
  });
});
