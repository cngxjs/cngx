import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { describe, expect, it, vi } from 'vitest';
import { CngxBackdrop } from './backdrop.directive';
import { CngxDrawer } from './drawer.directive';
import { CngxDrawerPanel } from './drawer-panel.directive';

@Component({
  template: `
    <div class="container">
      <div
        [cngxBackdrop]="visible()"
        [closeOnClick]="closeOnClick()"
        (backdropClick)="clicked()"
        class="backdrop"
      ></div>
      <div class="sibling-a">A</div>
      <div class="sibling-b">B</div>
      <div class="cngx-drawer-panel sibling-panel">Panel</div>
      @if (showLate()) {
        <div class="sibling-late">Late</div>
      }
    </div>
  `,
  imports: [CngxBackdrop],
})
class TestHost {
  visible = signal(false);
  closeOnClick = signal(true);
  showLate = signal(false);
  clicked = vi.fn();
}

@Component({
  template: `
    <div cngxDrawer #drawer="cngxDrawer">
      <div [cngxBackdrop]="drawer.opened()" class="cngx-backdrop"></div>
      <nav [cngxDrawerPanel]="drawer"><a href="#">Link</a></nav>
      <main class="content">Content</main>
    </div>
  `,
  imports: [CngxBackdrop, CngxDrawer, CngxDrawerPanel],
})
class CompositionHost {}

describe('CngxBackdrop', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const backdropEl = fixture.debugElement.query(By.directive(CngxBackdrop))
      .nativeElement as HTMLElement;
    const sibA = fixture.debugElement.query(By.css('.sibling-a')).nativeElement as HTMLElement;
    const sibB = fixture.debugElement.query(By.css('.sibling-b')).nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, backdropEl, sibA, sibB };
  }

  it('does not have visible class initially', () => {
    const { backdropEl } = setup();
    expect(backdropEl.classList.contains('cngx-backdrop--visible')).toBe(false);
  });

  it('adds visible class when visible', () => {
    const { fixture, host, backdropEl } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(backdropEl.classList.contains('cngx-backdrop--visible')).toBe(true);
  });

  it('sets inert on siblings when visible', () => {
    const { fixture, host, sibA, sibB } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sibA.hasAttribute('inert')).toBe(true);
    expect(sibB.hasAttribute('inert')).toBe(true);
  });

  it('removes inert from siblings when hidden', () => {
    const { fixture, host, sibA, sibB } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.visible.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sibA.hasAttribute('inert')).toBe(false);
    expect(sibB.hasAttribute('inert')).toBe(false);
  });

  it('emits backdropClick on click when visible and closeOnClick', () => {
    const { fixture, host, backdropEl } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    backdropEl.click();
    expect(host.clicked).toHaveBeenCalledOnce();
  });

  it('does not emit backdropClick when closeOnClick is false', () => {
    const { fixture, host, backdropEl } = setup();
    host.visible.set(true);
    host.closeOnClick.set(false);
    fixture.detectChanges();
    backdropEl.click();
    expect(host.clicked).not.toHaveBeenCalled();
  });

  it('does not emit backdropClick when not visible', () => {
    const { backdropEl, host } = setup();
    backdropEl.click();
    expect(host.clicked).not.toHaveBeenCalled();
  });

  it('keeps aria-hidden=true regardless of visibility', () => {
    const { fixture, host, backdropEl } = setup();
    expect(backdropEl.getAttribute('aria-hidden')).toBe('true');
    host.visible.set(true);
    fixture.detectChanges();
    expect(backdropEl.getAttribute('aria-hidden')).toBe('true');
  });

  it('excludes a sibling drawer panel from the inert set', () => {
    const { fixture, host } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    const panel = fixture.debugElement.query(By.css('.sibling-panel')).nativeElement as HTMLElement;
    expect(panel.hasAttribute('inert')).toBe(false);
  });

  it('re-queries the sibling set at show so late-rendered siblings are inerted', () => {
    const { fixture, host } = setup();
    host.showLate.set(true);
    fixture.detectChanges();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    const late = fixture.debugElement.query(By.css('.sibling-late')).nativeElement as HTMLElement;
    expect(late.hasAttribute('inert')).toBe(true);
  });

  it('leaves a consumer-set inert untouched across the show/hide cycle', () => {
    const { fixture, host, sibA, sibB } = setup();
    sibB.setAttribute('inert', '');

    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sibA.hasAttribute('inert')).toBe(true);

    host.visible.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sibA.hasAttribute('inert')).toBe(false);
    expect(sibB.hasAttribute('inert')).toBe(true);
  });

  it('removes inert from siblings on destroy while visible', () => {
    const { fixture, host, sibA } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sibA.hasAttribute('inert')).toBe(true);
    fixture.destroy();
    expect(sibA.hasAttribute('inert')).toBe(false);
  });

  it('keeps the drawer panel interactive in the documented composition', () => {
    TestBed.configureTestingModule({
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
    const fixture = TestBed.createComponent(CompositionHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const drawer = fixture.debugElement.query(By.directive(CngxDrawer)).injector.get(CngxDrawer);
    drawer.open();
    fixture.detectChanges();
    TestBed.flushEffects();
    const panelEl = fixture.debugElement.query(By.directive(CngxDrawerPanel))
      .nativeElement as HTMLElement;
    const contentEl = fixture.debugElement.query(By.css('.content')).nativeElement as HTMLElement;
    expect(panelEl.hasAttribute('inert')).toBe(false);
    expect(contentEl.hasAttribute('inert')).toBe(true);
  });
});
