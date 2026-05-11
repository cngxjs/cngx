import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxCheckboxIndicator } from '@cngx/common/display';
import { describe, expect, it } from 'vitest';
import { CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';

import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxCheckbox } from './checkbox.component';

@Component({
  template: `<cngx-checkbox [(value)]="v" [(indeterminate)]="ind" [disabled]="off()">L</cngx-checkbox>`,
  imports: [CngxCheckbox],
})
class Host {
  v = signal(false);
  ind = signal(false);
  off = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxCheckbox));
  return {
    fixture,
    host: fixture.componentInstance,
    dir: de.injector.get(CngxCheckbox),
    el: de.nativeElement as HTMLElement,
  };
}

describe('CngxCheckbox', () => {
  it('initialises with role=checkbox and aria-checked=false', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('checkbox');
    expect(el.getAttribute('aria-checked')).toBe('false');
  });

  it('flips value on click and propagates via two-way binding', () => {
    const { fixture, el, host } = setup();
    el.click();
    fixture.detectChanges();
    expect(host.v()).toBe(true);
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('reports aria-checked="mixed" when indeterminate', () => {
    const { fixture, el, host } = setup();
    host.ind.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-checked')).toBe('mixed');
  });

  it('clicking an indeterminate checkbox sets value=true AND indeterminate=false in one step', () => {
    const { fixture, el, host } = setup();
    host.ind.set(true);
    fixture.detectChanges();
    el.click();
    fixture.detectChanges();
    expect(host.v()).toBe(true);
    expect(host.ind()).toBe(false);
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('Space and Enter advance the same way as click', () => {
    const { fixture, el, host } = setup();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    fixture.detectChanges();
    expect(host.v()).toBe(true);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    fixture.detectChanges();
    expect(host.v()).toBe(false);
  });

  it('composes <cngx-checkbox-indicator> with checkbox variant + reactive checked/indeterminate inputs', () => {
    const { fixture, host } = setup();
    const indicator = fixture.debugElement
      .query(By.directive(CngxCheckboxIndicator))
      .componentInstance as CngxCheckboxIndicator;
    expect(indicator.variant()).toBe('checkbox');
    expect(indicator.checked()).toBe(false);
    expect(indicator.indeterminate()).toBe(false);

    host.v.set(true);
    fixture.detectChanges();
    expect(indicator.checked()).toBe(true);

    host.ind.set(true);
    fixture.detectChanges();
    expect(indicator.indeterminate()).toBe(true);
  });

  it('forwards checkGlyph + dashGlyph through to the indicator', () => {
    @Component({
      template: `
        <ng-template #c><span data-test="custom-check">✔</span></ng-template>
        <ng-template #d><span data-test="custom-dash">─</span></ng-template>
        <cngx-checkbox [checkGlyph]="c" [dashGlyph]="d">L</cngx-checkbox>
      `,
      imports: [CngxCheckbox],
    })
    class GlyphHost {}

    const fixture = TestBed.createComponent(GlyphHost);
    fixture.detectChanges();
    const indicator = fixture.debugElement
      .query(By.directive(CngxCheckboxIndicator))
      .componentInstance as CngxCheckboxIndicator;
    expect(indicator.checkGlyph()).not.toBeNull();
    expect(indicator.dashGlyph()).not.toBeNull();
  });

  it('disabled blocks click and emits aria-disabled', () => {
    const { fixture, el, host } = setup();
    host.off.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-disabled')).toBe('true');
    el.click();
    fixture.detectChanges();
    expect(host.v()).toBe(false);
  });

  it('provides CNGX_CONTROL_VALUE useExisting', () => {
    const { dir, fixture } = setup();
    const de = fixture.debugElement.query(By.directive(CngxCheckbox));
    expect(de.injector.get(CNGX_CONTROL_VALUE)).toBe(dir);
  });

  describe('aria-invalid + aria-errormessage symmetric semantics', () => {
    it('aria-invalid reflects invalid() alone (no form-field host)', () => {
      const { fixture, dir, el } = setup();
      expect(el.getAttribute('aria-invalid')).toBeNull();
      dir.invalid.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('aria-invalid')).toBe('true');
    });

    it('aria-invalid reflects errorState() alone (form-field host showError=true)', () => {
      @Component({
        template: `<cngx-checkbox>L</cngx-checkbox>`,
        imports: [CngxCheckbox],
        providers: [
          {
            provide: CNGX_FORM_FIELD_HOST,
            useValue: {
              showError: () => true,
              markAsTouched: () => undefined,
            },
          },
        ],
      })
      class FieldHost {}
      const fixture = TestBed.createComponent(FieldHost);
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(CngxCheckbox))
        .nativeElement as HTMLElement;
      expect(el.getAttribute('aria-invalid')).toBe('true');
    });

    it('aria-invalid is null when both invalid() and errorState() are false', () => {
      const { el } = setup();
      expect(el.getAttribute('aria-invalid')).toBeNull();
    });

    it('aria-errormessage always reflects errorMessageId (independent of invalid)', () => {
      @Component({
        template: `<cngx-checkbox [errorMessageId]="msgId()" [(invalid)]="bad">L</cngx-checkbox>`,
        imports: [CngxCheckbox],
      })
      class MsgHost {
        msgId = signal<string | null>('cb-err');
        bad = signal(false);
      }
      const fixture = TestBed.createComponent(MsgHost);
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(CngxCheckbox))
        .nativeElement as HTMLElement;
      expect(el.getAttribute('aria-errormessage')).toBe('cb-err');
      fixture.componentInstance.bad.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('aria-errormessage')).toBe('cb-err');
    });
  });
});
