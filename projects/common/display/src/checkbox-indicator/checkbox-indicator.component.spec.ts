import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxCheckboxIndicator } from './checkbox-indicator.component';

@Component({
  template: `
    <cngx-checkbox-indicator
      [variant]="variant()"
      [checked]="checked()"
      [indeterminate]="indeterminate()"
      [disabled]="disabled()"
      [size]="size()"
    />
  `,
  imports: [CngxCheckboxIndicator],
})
class Host {
  readonly variant = signal<'checkbox' | 'checkmark'>('checkbox');
  readonly checked = signal<boolean>(false);
  readonly indeterminate = signal<boolean>(false);
  readonly disabled = signal<boolean>(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

function hostEl(fixture: { nativeElement: HTMLElement }): HTMLElement {
  const el = fixture.nativeElement.querySelector('cngx-checkbox-indicator');
  if (!el) {
    throw new Error('cngx-checkbox-indicator host not found');
  }
  return el as HTMLElement;
}

describe('CngxCheckboxIndicator', () => {
  it('host carries .cngx-checkbox-indicator and aria-hidden="true"', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('default variant "checkbox" renders the .__box frame', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checkbox')).toBe(true);
    expect(host.querySelector('.cngx-checkbox-indicator__box')).not.toBeNull();
  });

  it('variant "checkmark" does not render the box frame', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.variant.set('checkmark');
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checkmark')).toBe(true);
    expect(host.classList.contains('cngx-checkbox-indicator--checkbox')).toBe(false);
    expect(host.querySelector('.cngx-checkbox-indicator__box')).toBeNull();
  });

  it('variant modifier classes are mutually exclusive', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    let host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checkbox')).toBe(true);
    expect(host.classList.contains('cngx-checkbox-indicator--checkmark')).toBe(false);

    fixture.componentInstance.variant.set('checkmark');
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checkbox')).toBe(false);
    expect(host.classList.contains('cngx-checkbox-indicator--checkmark')).toBe(true);
  });

  it('checked=false & indeterminate=false → no glyph rendered', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.querySelector('.cngx-checkbox-indicator__check')).toBeNull();
    expect(host.querySelector('.cngx-checkbox-indicator__dash')).toBeNull();
  });

  it('checked=true renders the check glyph', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.checked.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checked')).toBe(true);
    expect(host.querySelector('.cngx-checkbox-indicator__check')).not.toBeNull();
    expect(host.querySelector('.cngx-checkbox-indicator__dash')).toBeNull();
  });

  it('indeterminate=true renders the dash glyph', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.indeterminate.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--indeterminate')).toBe(true);
    expect(host.querySelector('.cngx-checkbox-indicator__dash')).not.toBeNull();
    expect(host.querySelector('.cngx-checkbox-indicator__check')).toBeNull();
  });

  it('indeterminate takes precedence over checked when both are true', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.checked.set(true);
    fixture.componentInstance.indeterminate.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.querySelector('.cngx-checkbox-indicator__dash')).not.toBeNull();
    expect(host.querySelector('.cngx-checkbox-indicator__check')).toBeNull();
  });

  it('disabled=true sets the --disabled host class', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.disabled.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--disabled')).toBe(true);
  });

  it('size modifiers toggle mutually exclusively', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    let host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--md')).toBe(true);
    expect(host.classList.contains('cngx-checkbox-indicator--sm')).toBe(false);
    expect(host.classList.contains('cngx-checkbox-indicator--lg')).toBe(false);

    fixture.componentInstance.size.set('sm');
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--sm')).toBe(true);
    expect(host.classList.contains('cngx-checkbox-indicator--md')).toBe(false);

    fixture.componentInstance.size.set('lg');
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--lg')).toBe(true);
    expect(host.classList.contains('cngx-checkbox-indicator--sm')).toBe(false);
  });

  it('state classes toggle reactively as inputs change', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    let host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checked')).toBe(false);

    fixture.componentInstance.checked.set(true);
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checked')).toBe(true);

    fixture.componentInstance.checked.set(false);
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-checkbox-indicator--checked')).toBe(false);
  });

  it('aria-hidden stays "true" regardless of input changes', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.checked.set(true);
    fixture.componentInstance.indeterminate.set(true);
    fixture.componentInstance.disabled.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('host click is a no-op — no output emitters defined', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(() => host.click()).not.toThrow();
  });
});
