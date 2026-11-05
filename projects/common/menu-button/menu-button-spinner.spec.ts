import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxButtonBrain, provideButtonSpinner } from '@cngx/common/button';
import { CngxAsyncClick, CngxMenu, CngxMenuItem } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { describe, expect, it } from 'vitest';

import { CngxIconMenuButton } from './icon-menu-button.component';
import { CngxMenuButton } from './menu-button.component';

@Component({
  selector: 'demo-dots',
  template: `<span class="demo-dots">...</span>`,
})
class DemoDots {}

@Component({
  viewProviders: [provideButtonSpinner(DemoDots)],
  template: `
    <button
      id="menu"
      cngxMenuButton
      [menu]="menu"
      [popover]="pop"
      [cngxAsyncClick]="run"
      [showDelay]="0"
      [minDwell]="0"
    >
      Export
    </button>
    <button
      id="icon"
      cngxIconMenuButton
      aria-label="More"
      [menu]="menu"
      [popover]="pop"
      [cngxAsyncClick]="run"
      [showDelay]="0"
      [minDwell]="0"
    ></button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Export format'" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
      </ul>
    </div>
  `,
  imports: [
    CngxMenuButton,
    CngxIconMenuButton,
    CngxAsyncClick,
    CngxPopover,
    CngxMenu,
    CngxMenuItem,
  ],
})
class Host {
  readonly run = (): Promise<void> => new Promise<void>(() => undefined);
}

describe('menu buttons with provideButtonSpinner', () => {
  it('render the provided glyph in their busy layer', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    for (const id of ['menu', 'icon']) {
      const de = fixture.debugElement.query(By.css(`#${id}`));
      expect(de.injector.get(CngxButtonBrain).spinner).toBe(DemoDots);
      (de.nativeElement as HTMLElement).click();
    }
    fixture.detectChanges();
    TestBed.flushEffects();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    for (const id of ['menu', 'icon']) {
      const layer = el.querySelector(`#${id} .cngx-button__busy`);
      expect(layer?.querySelector('.demo-dots')).not.toBeNull();
      expect(layer?.querySelector('.cngx-button__spinner')).toBeNull();
    }
  });
});
