import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, required } from '@angular/forms/signals';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRangeSlider, CngxSlider } from '@cngx/common/interactive';

import { CngxFormField } from './form-field.component';
import { CngxHint } from './hint.directive';
import { CngxLabel } from './label.component';
import { CngxRangeSliderFieldBridge } from './range-slider-field-bridge.directive';
import { CngxSliderFieldBridge } from './slider-field-bridge.directive';

// A bridged slider has one aria-describedby writer, the track: it joins the
// field's ids, its own disabled reason and a consumer cngxDescribedBy. A
// consumer [disabled] is OR-ed with the field instead of being overwritten,
// and focus moving between the two thumbs of a range stays inside the
// control.

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

function mount<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  flush(fixture);
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function ids(el: Element, attr: string): string[] {
  return (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('slider bridge aria - one describedby writer', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.volume">
        <label cngxLabel>Volume</label>
        <cngx-slider
          cngxSliderFieldBridge
          [min]="0"
          [max]="100"
          [disabled]="busy()"
          disabledReason="Muted by the system"
          cngxDescribedBy="volume-note"
        />
        <span cngxHint>Pick a level.</span>
      </cngx-form-field>
      <p id="volume-note">Applies to every speaker.</p>
    `,
    imports: [CngxFormField, CngxLabel, CngxHint, CngxSlider, CngxSliderFieldBridge],
  })
  class SliderHost {
    readonly busy = signal(false);
    readonly f = form(signal({ volume: 120 }), (p) => {
      required(p.volume);
    });
  }

  function slider(el: HTMLElement): HTMLElement {
    return el.querySelector<HTMLElement>('[role="slider"]')!;
  }

  it('references the hint, the consumer note and the own reason together', () => {
    const { fixture, host, el } = mount(SliderHost);
    const hintId = el.querySelector('[cngxHint]')!.id;
    expect(ids(slider(el), 'aria-describedby')).toEqual(
      expect.arrayContaining([hintId, 'volume-note']),
    );

    host.busy.set(true);
    flush(fixture);
    const described = ids(slider(el), 'aria-describedby');
    expect(described).toContain(hintId);
    expect(described).toContain('volume-note');
    const reason = described.find((id) => id !== hintId && id !== 'volume-note');
    expect(reason).toBeDefined();
    expect(document.getElementById(reason!)!.textContent).toBe('Muted by the system');
  });

  it('keeps a consumer [disabled] when the field toggles its own disabled state', () => {
    const { fixture, host, el } = mount(SliderHost);
    host.busy.set(true);
    flush(fixture);
    expect(slider(el).getAttribute('aria-disabled')).toBe('true');
    expect(slider(el).getAttribute('tabindex')).toBe('-1');
  });

  it('carries no aria-required on role=slider', () => {
    const { el } = mount(SliderHost);
    expect(slider(el).hasAttribute('aria-required')).toBe(false);
  });
});

describe('slider bridge aria - consumer and field disabled', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.volume">
        <label cngxLabel>Volume</label>
        <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" [disabled]="busy()" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxSlider, CngxSliderFieldBridge],
  })
  class Host {
    readonly busy = signal(true);
    readonly locked = signal(false);
    readonly f = form(signal({ volume: 10 }), (p) => {
      disabled(p.volume, () => this.locked());
    });
  }

  it('stays disabled through a field disable and enable while the consumer holds it', () => {
    const { fixture, host, el } = mount(Host);
    const track = el.querySelector<HTMLElement>('[role="slider"]')!;
    expect(track.getAttribute('aria-disabled')).toBe('true');
    host.locked.set(true);
    flush(fixture);
    host.locked.set(false);
    flush(fixture);
    expect(track.getAttribute('aria-disabled')).toBe('true');
    expect(track.getAttribute('tabindex')).toBe('-1');

    host.busy.set(false);
    flush(fixture);
    expect(track.hasAttribute('aria-disabled')).toBe(false);
    host.locked.set(true);
    flush(fixture);
    expect(track.getAttribute('aria-disabled')).toBe('true');
  });
});

describe('range slider bridge aria', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.price">
        <label cngxLabel>Price</label>
        <cngx-range-slider cngxRangeSliderFieldBridge [min]="0" [max]="1000" />
        <span cngxHint>Per night.</span>
      </cngx-form-field>
      <button type="button">after</button>
    `,
    imports: [CngxFormField, CngxLabel, CngxHint, CngxRangeSlider, CngxRangeSliderFieldBridge],
  })
  class RangeHost {
    readonly f = form(signal({ price: [100, 400] as [number, number] }));
  }

  it('does not touch the field when focus moves from one thumb to the other', () => {
    const { fixture, host, el } = mount(RangeHost);
    const [start, end] = Array.from(el.querySelectorAll<HTMLElement>('[role="slider"]'));
    start.focus();
    start.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: end }));
    end.focus();
    flush(fixture);
    expect(host.f.price().touched()).toBe(false);

    const after = el.querySelector('button')!;
    end.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: after }));
    flush(fixture);
    expect(host.f.price().touched()).toBe(true);
  });

  it('describes the group with the hint and carries no aria-required or aria-readonly', () => {
    const { el } = mount(RangeHost);
    const group = el.querySelector('cngx-range-slider')!;
    expect(ids(group, 'aria-describedby')).toContain(el.querySelector('[cngxHint]')!.id);
    expect(group.hasAttribute('aria-required')).toBe(false);
    expect(group.hasAttribute('aria-readonly')).toBe(false);
  });
});
