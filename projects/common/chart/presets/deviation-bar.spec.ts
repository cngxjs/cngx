import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxDeviationBar } from './deviation-bar.component';

@Component({
  standalone: true,
  imports: [CngxDeviationBar],
  template: `
    <cngx-deviation-bar
      [value]="value()"
      [baseline]="baseline()"
      [magnitude]="magnitude()"
      data-testid="bar"
    />
  `,
})
class TestHost {
  value = signal<number>(20);
  baseline = signal<number>(0);
  magnitude = signal<number>(100);
}

describe('CngxDeviationBar', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    return { fixture, host };
  }

  it('renders a positive fill anchored at the baseline (50%)', () => {
    const { host } = setup();
    const fill = host.querySelector('.cngx-deviation-bar__fill') as HTMLElement;
    expect(fill.classList.contains('cngx-deviation-bar__fill--positive')).toBe(true);
    expect(fill.style.left).toBe('50%');
    expect(fill.style.width).toBe('10%'); // 20 / 100 * 50 = 10
  });

  it('renders a negative fill to the left of the baseline', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(-30);
    fixture.detectChanges();
    const fill = host.querySelector('.cngx-deviation-bar__fill') as HTMLElement;
    expect(fill.classList.contains('cngx-deviation-bar__fill--negative')).toBe(true);
    expect(fill.style.left).toBe('35%'); // 50 - 30/100 * 50 = 35
    expect(fill.style.width).toBe('15%');
  });

  it('renders no fill when the value equals the baseline', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(0);
    fixture.detectChanges();
    const fill = host.querySelector('.cngx-deviation-bar__fill');
    expect(fill).toBeNull();
  });

  it('clamps the fill width when the deviation exceeds the magnitude', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(500);
    fixture.detectChanges();
    const fill = host.querySelector('.cngx-deviation-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('exposes role="meter" with a range of baseline ± magnitude', () => {
    const { host } = setup();
    expect(host.getAttribute('role')).toBe('meter');
    expect(host.getAttribute('aria-valuenow')).toBe('20');
    expect(host.getAttribute('aria-valuemin')).toBe('-100');
    expect(host.getAttribute('aria-valuemax')).toBe('100');
  });

  it('centres the meter range on a non-zero baseline so the reading stays in range', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.baseline.set(100);
    fixture.componentInstance.magnitude.set(50);
    fixture.componentInstance.value.set(130);
    fixture.detectChanges();
    // ±magnitude alone would declare [-50, 50] and leave valuenow=130
    // outside its own range - invalid meter semantics.
    expect(host.getAttribute('aria-valuemin')).toBe('50');
    expect(host.getAttribute('aria-valuemax')).toBe('150');
    expect(host.getAttribute('aria-valuenow')).toBe('130');
  });
});

describe('CngxDeviationBar - unnamed-meter dev warning', () => {
  @Component({
    standalone: true,
    imports: [CngxDeviationBar],
    template: `<cngx-deviation-bar [value]="5" [aria-label]="name()" />`,
  })
  class NameHost {
    readonly name = signal<string | null>(null);
  }

  function warningsFor(name: string | null): unknown[][] {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    warn.mockClear();
    TestBed.configureTestingModule({ imports: [NameHost] });
    const fixture = TestBed.createComponent(NameHost);
    fixture.componentInstance.name.set(name);
    fixture.detectChanges();
    TestBed.tick();
    const calls = warn.mock.calls.filter(([m]) => /^CNGX1010: /.test(String(m)));
    warn.mockRestore();
    return calls;
  }

  it('warns CNGX1010 when the meter has no accessible name, an empty one included', () => {
    for (const name of [null, '']) {
      TestBed.resetTestingModule();
      const calls = warningsFor(name);
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toMatch(/^CNGX1010: cngx-deviation-bar: role="meter" has no accessible name - /);
    }
  });

  it('stays silent with a bound name', () => {
    expect(warningsFor('Revenue')).toEqual([]);
  });
});
