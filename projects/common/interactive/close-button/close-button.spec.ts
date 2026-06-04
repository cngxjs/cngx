import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxCloseButton } from './close-button';

function collectInjectedStyles(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((node) => node.textContent ?? '')
    .join('\n');
}

@Component({
  template: `<cngx-close-button [label]="label()" />`,
  imports: [CngxCloseButton],
})
class Host {
  label = signal('Close session-expired alert');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxCloseButton));
  return {
    fixture,
    host: fixture.componentInstance,
    el: de.nativeElement as HTMLElement,
    btn: de.nativeElement.querySelector('button.cngx-close-button__btn') as HTMLButtonElement,
  };
}

describe('CngxCloseButton', () => {
  it('renders the host with the cngx-close-button class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-close-button')).toBe(true);
  });

  it('hosts the inner native <button> with the required aria-label', () => {
    const { btn, host } = setup();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.getAttribute('aria-label')).toBe(host.label());
  });

  it('reflects label updates onto aria-label reactively', () => {
    const { fixture, btn, host } = setup();
    host.label.set('Dismiss session toast');
    fixture.detectChanges();
    expect(btn.getAttribute('aria-label')).toBe('Dismiss session toast');
  });

  it('renders the default X glyph as the projection fallback', () => {
    const { btn } = setup();
    const svg = btn.querySelector('svg.cngx-close-button__icon');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
    expect(svg!.querySelectorAll('line').length).toBe(2);
  });

  it('ships a host :scope rule declaring inline-flex (not display: contents)', () => {
    setup();
    const styleText = collectInjectedStyles();
    expect(styleText).toMatch(
      /@scope \(\.cngx-close-button\)\s*\{\s*:scope\s*\{[^}]*display:\s*inline-flex/,
    );
    expect(styleText).not.toMatch(/:scope\s*\{[^}]*display:\s*contents/);
  });
});
