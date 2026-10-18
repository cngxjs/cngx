import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { CNGX_STEPPER_GLYPHS } from '@cngx/common/stepper';

import { CngxStepperErrorLine } from './stepper-error-line.component';

@Component({
  standalone: true,
  imports: [CngxStepperErrorLine],
  template: `<span
    cngxStepperErrorLine
    block="demo-line"
    [text]="text()"
    [reason]="reason()"
  ></span>`,
})
class LineHost {
  readonly text = signal('');
  readonly reason = signal<'refused' | null>(null);
}

function setup() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(LineHost);
  fixture.detectChanges();
  const line = fixture.nativeElement.querySelector('[cngxStepperErrorLine]') as HTMLElement;
  const glyph = (): HTMLElement | null => line.querySelector('.demo-line-glyph');
  return { fixture, line, glyph };
}

describe('CngxStepperErrorLine', () => {
  it('stays mounted, quiet and unhooked while empty', () => {
    const { line, glyph } = setup();
    expect(line.getAttribute('role')).toBe('status');
    expect(line.hasAttribute('data-state')).toBe(false);
    expect(line.hasAttribute('data-reason')).toBe(false);
    expect(glyph()).toBeNull();
  });

  it('renders the error glyph for an error', () => {
    const { fixture, line, glyph } = setup();
    fixture.componentInstance.text.set('Payment: Errored');
    fixture.detectChanges();
    expect(line.getAttribute('data-state')).toBe('error');
    expect(line.hasAttribute('data-reason')).toBe(false);
    expect(glyph()?.textContent?.trim()).toBe(CNGX_STEPPER_GLYPHS.errorBadge);
    expect(glyph()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the refused glyph and the data-reason hook for a refusal', () => {
    const { fixture, line, glyph } = setup();
    fixture.componentInstance.text.set('Payment: Not allowed');
    fixture.componentInstance.reason.set('refused');
    fixture.detectChanges();
    expect(line.getAttribute('data-state')).toBe('error');
    expect(line.getAttribute('data-reason')).toBe('refused');
    expect(glyph()?.textContent?.trim()).toBe(CNGX_STEPPER_GLYPHS.refusedIcon);
    expect(glyph()?.getAttribute('aria-hidden')).toBe('true');
    expect(line.textContent).toContain('Payment: Not allowed');
  });

  it('drops the refused hook once the line is empty again', () => {
    const { fixture, line } = setup();
    fixture.componentInstance.text.set('Payment: Not allowed');
    fixture.componentInstance.reason.set('refused');
    fixture.detectChanges();
    fixture.componentInstance.text.set('');
    fixture.detectChanges();
    expect(line.hasAttribute('data-reason')).toBe(false);
  });
});
