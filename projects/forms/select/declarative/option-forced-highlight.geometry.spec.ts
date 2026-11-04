/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxSelectOption } from './option.component';

// Runs in a real Chromium (the `test-geometry` target) against the shipped
// select-base stylesheet. The shell projects declarative `<cngx-option>` hosts,
// which carry the atom class `cngx-option--highlighted` but not
// `.cngx-select__option`. The forced-colors highlight rule keys on the atom
// class, so a highlighted shell option paints the Highlight pair without the
// `@cngx/common` listbox stylesheet on the page (I5 / verify-first).

@Component({
  selector: 'cngx-option-forced-host',
  standalone: true,
  imports: [CngxSelectOption],
  styleUrls: ['../shared/select-base.css'],
  encapsulation: ViewEncapsulation.None,
  template: `<cngx-option class="probe" [value]="'red'">Red</cngx-option>`,
})
class Host {}

let mountedRoot: HTMLElement | null = null;

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('declarative option forced-colors highlight', () => {
  it('paints a highlighted declarative option in the Highlight pair', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const fixture = TestBed.createComponent(Host);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();

    const option = mountedRoot.querySelector<HTMLElement>('.probe')!;
    option.classList.add('cngx-option--highlighted');

    const probe = document.createElement('span');
    probe.style.backgroundColor = 'Highlight';
    probe.style.color = 'HighlightText';
    document.body.appendChild(probe);
    const highlight = computedValue(probe, 'background-color');
    const highlightText = computedValue(probe, 'color');
    probe.remove();

    expect(computedValue(option, 'background-color')).toBe(highlight);
    expect(computedValue(option, 'color')).toBe(highlightText);
  });
});
