import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxChip } from '@cngx/common/display';
import { describe, expect, it } from 'vitest';

import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxChipInteraction } from './chip-interaction.directive';

@Component({
  template: `
    <cngx-chip
      cngxChipInteraction
      [value]="'tag-1'"
      [(selected)]="bound"
      [disabled]="off()"
      [removable]="true"
      (removeRequest)="removed.set(removed() + 1)"
    >Tag 1</cngx-chip>
  `,
  imports: [CngxChip, CngxChipInteraction],
})
class Host {
  bound = signal(false);
  off = signal(false);
  removed = signal(0);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxChipInteraction));
  return {
    fixture,
    host: fixture.componentInstance,
    dir: de.injector.get(CngxChipInteraction) as CngxChipInteraction<string>,
    el: de.nativeElement as HTMLElement,
    de,
  };
}

describe('CngxChipInteraction', () => {
  it('initialises with role=option, aria-selected=false, tabindex=0', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('option');
    expect(el.getAttribute('aria-selected')).toBe('false');
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('toggles selected on click and reflects aria-selected reactively', () => {
    const { fixture, el, host } = setup();
    el.click();
    fixture.detectChanges();
    expect(host.bound()).toBe(true);
    expect(el.getAttribute('aria-selected')).toBe('true');
    el.click();
    fixture.detectChanges();
    expect(host.bound()).toBe(false);
  });

  it('toggles selected on Space and Enter, preventing default', () => {
    const { fixture, el } = setup();
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    el.dispatchEvent(space);
    fixture.detectChanges();
    expect(el.getAttribute('aria-selected')).toBe('true');
    expect(space.defaultPrevented).toBe(true);

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    el.dispatchEvent(enter);
    fixture.detectChanges();
    expect(el.getAttribute('aria-selected')).toBe('false');
    expect(enter.defaultPrevented).toBe(true);
  });

  it('emits removeRequest on Backspace and Delete', () => {
    const { fixture, el, host } = setup();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', cancelable: true }));
    fixture.detectChanges();
    expect(host.removed()).toBe(2);
  });

  it('blocks all interactions when disabled (aria-disabled, tabindex=-1)', () => {
    const { fixture, el, host } = setup();
    host.off.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('-1');
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    fixture.detectChanges();
    expect(host.bound()).toBe(false);
    expect(host.removed()).toBe(0);
  });

  it('does NOT toggle when click originates inside the chip close button', () => {
    const { fixture, el, host } = setup();
    const closeBtn = el.querySelector('.cngx-chip__remove') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();
    fixture.detectChanges();
    // Close-button click bubbles to host (click), but the directive's
    // isCloseButtonClick guard short-circuits — the chip stays unselected.
    expect(host.bound()).toBe(false);
  });

  it('provides CNGX_CONTROL_VALUE via useExisting', () => {
    const { dir, de } = setup();
    expect(de.injector.get(CNGX_CONTROL_VALUE)).toBe(dir);
  });

  // NOTE: the dev-mode ancestor-guard is intentionally not unit-tested
  // here — the throw fires inside `afterNextRender`, after TestBed's
  // synchronous assertions have already returned. Production-mode
  // behaviour (no ancestor read, no throw) and the guard's correctness
  // when a misuse is wired (throws "must NOT be used inside …") are
  // verified by static review + the dev-app demo. Asserting on the
  // throw through TestBed without zone-aware infrastructure produces
  // noisy unhandled-error stderr without a meaningful assertion target.
});
