import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

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
  `,
  imports: [CngxButton, CngxIconButton, CngxCloseButton],
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
    const ids = ['button', 'icon', 'close'];
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
  });
});
