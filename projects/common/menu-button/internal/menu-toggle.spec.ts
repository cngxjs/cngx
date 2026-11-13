import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxButtonBrain, provideButtonHost } from '@cngx/common/button';
import { CngxMenu, CngxMenuItem, CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';
import { describe, expect, it } from 'vitest';

import { injectMenuToggle } from './menu-toggle';

// A minimal host on the brain and both triggers, outside the shipped components.
@Component({
  selector: 'button[demoMenuButton]',
  hostDirectives: [
    { directive: CngxButtonBrain, inputs: ['variant: demoMenuButton', 'disabled'] },
    { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
    { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
  ],
  providers: [provideButtonHost('demoMenuButton', { defaultVariant: 'outline' })],
  host: { '(click)': 'toggle.handleClick()' },
  template: '<ng-content />',
})
class DemoMenuButton {
  protected readonly toggle = injectMenuToggle(inject(CngxButtonBrain).blocked);
}

@Component({
  template: `
    <button demoMenuButton [menu]="menu" [popover]="pop" [disabled]="disabled()">Export</button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
      </ul>
    </div>
  `,
  imports: [DemoMenuButton, CngxPopover, CngxMenu, CngxMenuItem],
})
class Host {
  readonly disabled = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const flush = (): void => {
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
  return { host: fixture.componentInstance, button, popover, flush };
}

describe('injectMenuToggle', () => {
  it('toggles the menu on click', () => {
    const { button, popover, flush } = setup();
    button.click();
    flush();
    expect(popover.isVisible()).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.click();
    flush();
    expect(popover.isVisible()).toBe(false);
  });

  it('refuses to open while the brain blocks the host', () => {
    const { button, host, popover, flush } = setup();
    host.disabled.set(true);
    flush();

    button.click();
    flush();
    expect(popover.isVisible()).toBe(false);
  });
});
