import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxDelta } from './delta.component';
import type { DeltaMode, DeltaPolarity } from '../shared/delta-format';

@Component({
  template: `<cngx-delta
    [value]="value()"
    [polarity]="polarity()"
    [mode]="mode()"
    [label]="label()"
  />`,
  imports: [CngxDelta],
})
class TestHost {
  value = signal(5.3);
  polarity = signal<DeltaPolarity>('higher-is-better');
  mode = signal<DeltaMode>('percent');
  label = signal<string | undefined>(undefined);
}

describe('CngxDelta', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    }),
  );

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('cngx-delta');
    return { fixture, el, host: fixture.componentInstance };
  }

  it('colours by sentiment and shows the up arrow for a rise (higher-is-better)', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-delta--positive')).toBe(true);
    expect(el.textContent).toContain('↑');
    expect(el.getAttribute('aria-label')).toContain('improved');
  });

  it('under lower-is-better a drop is positive while the arrow points down', () => {
    const { fixture, el, host } = setup();
    host.value.set(-2.1);
    host.polarity.set('lower-is-better');
    fixture.detectChanges();

    // Colour and SR word read positive...
    expect(el.classList.contains('cngx-delta--positive')).toBe(true);
    expect(el.getAttribute('aria-label')).toContain('improved');
    // ...while the arrow still points down. Colour is never the only signal.
    expect(el.textContent).toContain('↓');
    expect(el.textContent).not.toContain('↑');
  });

  it('under higher-is-better a drop is negative', () => {
    const { fixture, el, host } = setup();
    host.value.set(-2.1);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-delta--negative')).toBe(true);
    expect(el.textContent).toContain('↓');
    expect(el.getAttribute('aria-label')).toContain('declined');
  });

  it('neutral polarity and flat value read neutral', () => {
    const { fixture, el, host } = setup();
    host.polarity.set('neutral');
    fixture.detectChanges();
    expect(el.classList.contains('cngx-delta--neutral')).toBe(true);

    host.polarity.set('higher-is-better');
    host.value.set(0);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-delta--neutral')).toBe(true);
    expect(el.textContent).toContain('→');
    expect(el.getAttribute('aria-label')).toContain('unchanged');
  });

  it('consumer label override replaces the generated SR label', () => {
    const { fixture, el, host } = setup();
    host.label.set('-2.1% vs. last quarter');
    fixture.detectChanges();
    expect(el.getAttribute('aria-label')).toBe('-2.1% vs. last quarter');
  });

  it('absolute mode formats the magnitude without a percent sign', () => {
    const { fixture, el, host } = setup();
    host.value.set(1234);
    host.mode.set('absolute');
    fixture.detectChanges();
    expect(el.textContent).toContain('+1,234');
    expect(el.textContent).not.toContain('%');
  });
});
