import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { describe, expect, it } from 'vitest';

// The menu hosts sit on the same brain; imported by path so the spec covers
// every common host in one place (the action button is covered in @cngx/ui).
import { CngxIconMenuButton } from '../menu-button/icon-menu-button.component';
import { CngxMenuButton } from '../menu-button/menu-button.component';
import { CngxButton } from './button.component';
import { CngxCloseButton } from './close-button.component';
import { CngxIconButton } from './icon-button.component';

@Component({
  template: `
    <button id="button" cngxButton [disabled]="disabled()" [disabledReason]="reason()">Save</button>
    <button
      id="icon"
      cngxIconButton
      aria-label="Sync"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    ></button>
    <button
      id="close"
      cngxCloseButton
      aria-label="Close"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    ></button>
    <button
      id="menu"
      cngxMenuButton
      [menu]="menu"
      [popover]="pop"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    >
      Export
    </button>
    <button
      id="icon-menu"
      cngxIconMenuButton
      aria-label="Row actions"
      [menu]="menu"
      [popover]="pop"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    >
      <span aria-hidden="true">&#8942;</span>
    </button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Actions'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
      </ul>
    </div>
  `,
  imports: [
    CngxButton,
    CngxIconButton,
    CngxCloseButton,
    CngxMenuButton,
    CngxIconMenuButton,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
  ],
})
class Host {
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>(undefined);
}

describe('button reason span', () => {
  it('renders only while a reason exists and is referenced only while disabled', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const ids = ['button', 'icon', 'close', 'menu', 'icon-menu'];
    const span = (id: string) => el.querySelector(`#${id} .cngx-button__reason`);
    for (const id of ids) {
      expect(span(id)).toBeNull();
    }

    fixture.componentInstance.reason.set('Nothing to save');
    fixture.detectChanges();
    for (const id of ids) {
      expect(span(id)?.textContent).toBe('Nothing to save');
      expect(el.querySelector(`#${id}`)?.hasAttribute('aria-describedby')).toBe(false);
    }

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    for (const id of ids) {
      expect(el.querySelector(`#${id}`)?.getAttribute('aria-describedby')).toBe(span(id)?.id);
    }

    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    for (const id of ids) {
      expect(el.querySelector(`#${id}`)?.hasAttribute('aria-describedby')).toBe(false);
    }
  });
});
