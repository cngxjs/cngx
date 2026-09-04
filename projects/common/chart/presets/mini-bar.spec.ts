import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CngxMiniBar } from './mini-bar.component';

@Component({
  standalone: true,
  imports: [CngxMiniBar],
  template: `
    <cngx-mini-bar
      [value]="value()"
      [max]="max()"
      [min]="min()"
      [aria-label]="label()"
      data-testid="bar"
    />
  `,
})
class TestHost {
  value = signal<number>(50);
  max = signal<number>(100);
  min = signal<number>(0);
  label = signal<string | null>('Test bar');
}

describe('CngxMiniBar', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
    fill: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    const fill = host.querySelector('.cngx-mini-bar__fill') as HTMLElement;
    return { fixture, host, fill };
  }

  it('carries role="meter" with reactive ARIA value attributes', () => {
    const { host } = setup();
    expect(host.getAttribute('role')).toBe('meter');
    expect(host.getAttribute('aria-valuenow')).toBe('50');
    expect(host.getAttribute('aria-valuemin')).toBe('0');
    expect(host.getAttribute('aria-valuemax')).toBe('100');
    expect(host.getAttribute('aria-label')).toBe('Test bar');
  });

  it('sets the fill width to the value-as-percent of the range', () => {
    const { fill } = setup();
    expect(fill.style.width).toBe('50%');
  });

  it('clamps fills to [0, 100] when the value is outside [min, max]', () => {
    const { fixture, fill } = setup();
    fixture.componentInstance.value.set(150);
    fixture.detectChanges();
    expect(fill.style.width).toBe('100%');
    fixture.componentInstance.value.set(-50);
    fixture.detectChanges();
    expect(fill.style.width).toBe('0%');
  });

  it('updates ARIA attributes reactively as inputs change', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(75);
    fixture.componentInstance.max.set(200);
    fixture.detectChanges();
    expect(host.getAttribute('aria-valuenow')).toBe('75');
    expect(host.getAttribute('aria-valuemax')).toBe('200');
  });
});

@Component({
  standalone: true,
  imports: [CngxMiniBar],
  template: `
    <cngx-mini-bar
      [value]="value()"
      [label]="label()"
      [aria-label]="ariaLabel()"
      [state]="state()"
      data-testid="bar"
    />
  `,
})
class LabelHost {
  value = signal<number>(50);
  label = signal<string | null>(null);
  ariaLabel = signal<string | null>(null);
  state = signal<CngxAsyncState<number> | undefined>(undefined);
}

describe('CngxMiniBar label + meter name', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<LabelHost>>;
    host: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [LabelHost] });
    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    return { fixture, host };
  }

  it('renders the label caption above the track', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.label.set('CPU');
    fixture.detectChanges();
    const caption = host.querySelector('.cngx-mini-bar__label') as HTMLElement;
    expect(caption).not.toBeNull();
    expect(caption.textContent?.trim()).toBe('CPU');
  });

  it('names the meter from the label when [aria-label] is unbound', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.label.set('CPU');
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('CPU');
  });

  it('lets [aria-label] win over the visible label when both are bound', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.label.set('CPU');
    fixture.componentInstance.ariaLabel.set('Processor load');
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Processor load');
    expect(host.querySelector('.cngx-mini-bar__label')?.textContent?.trim()).toBe('CPU');
  });

  it('renders no caption while a loading state shows its fallback', () => {
    const { fixture, host } = setup();
    const state = createManualState<number>();
    state.set('loading');
    fixture.componentInstance.state.set(state);
    fixture.componentInstance.label.set('CPU');
    fixture.detectChanges();
    expect(host.querySelector('.cngx-mini-bar__label')).toBeNull();
    expect(host.querySelector('.cngx-preset-skeleton')).not.toBeNull();
  });
});

describe('CngxMiniBar - unnamed-meter dev warning', () => {
  afterEach(() => vi.restoreAllMocks());

  @Component({
    standalone: true,
    imports: [CngxMiniBar],
    template: `<cngx-mini-bar [value]="50" />`,
  })
  class WarnHost {}

  it('warns in dev mode when neither [label] nor [aria-label] names the meter', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ imports: [WarnHost] });
    const fixture = TestBed.createComponent(WarnHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('cngx-mini-bar') && String(c[0]).includes('accessible name')),
    ).toBe(true);
  });

  it('does not warn when the visible label supplies the accessible name', async () => {
    @Component({
      standalone: true,
      imports: [CngxMiniBar],
      template: `<cngx-mini-bar [value]="50" [label]="'CPU'" />`,
    })
    class NamedHost {}
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ imports: [NamedHost] });
    const fixture = TestBed.createComponent(NamedHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).not.toHaveBeenCalled();
  });
});
