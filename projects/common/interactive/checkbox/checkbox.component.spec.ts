import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';
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

    it('aria-errormessage emits errorMessageId when invalid()', () => {
      @Component({
        template: `<cngx-checkbox [errorMessageId]="msgId()" [(invalid)]="bad">L</cngx-checkbox>`,
        imports: [CngxCheckbox],
      })
      class MsgHost {
        msgId = signal<string | null>('cb-err');
        bad = signal(true);
      }
      const fixture = TestBed.createComponent(MsgHost);
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(CngxCheckbox))
        .nativeElement as HTMLElement;
      expect(el.getAttribute('aria-errormessage')).toBe('cb-err');
    });

    it('aria-errormessage is null when neither invalid() nor errorState() is set', () => {
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
      expect(el.getAttribute('aria-errormessage')).toBeNull();

      fixture.componentInstance.bad.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('aria-errormessage')).toBe('cb-err');
    });
  });

  describe('aria-describedby stability', () => {
    it('the SR-only span carries the stable describedId even when disabledReason is empty', () => {
      const { fixture } = setup();
      const srSpan = fixture.debugElement.query(By.css('.cngx-checkbox__sr-only'))
        .nativeElement as HTMLElement;
      expect(srSpan.id).toMatch(/^cngx-checkbox-desc/);
      expect(srSpan.getAttribute('aria-hidden')).toBe('true');
      expect(srSpan.textContent?.trim()).toBe('');
    });

    it('host aria-describedby always carries describedId across (disabled, invalid) state combinations', () => {
      @Component({
        template: `<cngx-checkbox [(invalid)]="bad" [disabled]="off()">L</cngx-checkbox>`,
        imports: [CngxCheckbox],
      })
      class MatrixHost {
        bad = signal(false);
        off = signal(false);
      }
      const fixture = TestBed.createComponent(MatrixHost);
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(CngxCheckbox))
        .nativeElement as HTMLElement;
      const srSpan = fixture.debugElement.query(By.css('.cngx-checkbox__sr-only'))
        .nativeElement as HTMLElement;
      const expectedId = srSpan.id;

      // disabled=false, invalid=false
      expect(el.getAttribute('aria-describedby')).toBe(expectedId);

      // disabled=false, invalid=true
      fixture.componentInstance.bad.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('aria-describedby')).toBe(expectedId);

      // disabled=true, invalid=true
      fixture.componentInstance.off.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('aria-describedby')).toBe(expectedId);

      // disabled=true, invalid=false
      fixture.componentInstance.bad.set(false);
      fixture.detectChanges();
      expect(el.getAttribute('aria-describedby')).toBe(expectedId);
    });
  });

  describe('roving composition', () => {
    it('standalone <cngx-checkbox> exposes tabindex="0" when enabled', () => {
      const { el } = setup();
      expect(el.getAttribute('tabindex')).toBe('0');
    });

    it('standalone <cngx-checkbox> exposes tabindex="-1" when disabled', () => {
      const { fixture, el, host } = setup();
      host.off.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    it('projected into a CngxRovingTabindex parent, the host yields tabindex ownership', () => {
      @Component({
        template: `
          <div cngxRovingTabindex>
            <cngx-checkbox>A</cngx-checkbox>
            <cngx-checkbox>B</cngx-checkbox>
            <cngx-checkbox>C</cngx-checkbox>
          </div>
        `,
        imports: [CngxCheckbox, CngxRovingTabindex],
      })
      class RovingHost {}

      const fixture = TestBed.createComponent(RovingHost);
      fixture.detectChanges();
      TestBed.flushEffects();

      const checkboxes = fixture.debugElement
        .queryAll(By.directive(CngxCheckbox))
        .map((de) => de.nativeElement as HTMLElement);

      // The roving controller's setAttribute writes the active leaf to "0"
      // and others to "-1". The host's [attr.tabindex]="hostTabindex()"
      // returns null under a roving parent, so it does not compete.
      expect(checkboxes[0].getAttribute('tabindex')).toBe('0');
      expect(checkboxes[1].getAttribute('tabindex')).toBe('-1');
      expect(checkboxes[2].getAttribute('tabindex')).toBe('-1');
    });

    it('hostTabindex() returning null does not clobber the controller setAttribute across CD cycles', () => {
      // Post-CD write-conflict regression: the pre-fix code shipped
      // [attr.tabindex]="disabled() ? -1 : 0" which raced the controller's
      // imperative writes on every CD. With hostTabindex()===null under a
      // roving parent, the binding must be a no-op even after detectChanges
      // and flushEffects rerun.
      @Component({
        template: `
          <div cngxRovingTabindex>
            <cngx-checkbox>A</cngx-checkbox>
            <cngx-checkbox>B</cngx-checkbox>
          </div>
        `,
        imports: [CngxCheckbox, CngxRovingTabindex],
      })
      class StabilityHost {}

      const fixture = TestBed.createComponent(StabilityHost);
      fixture.detectChanges();
      TestBed.flushEffects();

      const checkboxes = fixture.debugElement
        .queryAll(By.directive(CngxCheckbox))
        .map((de) => de.nativeElement as HTMLElement);

      expect(checkboxes[0].getAttribute('tabindex')).toBe('0');
      expect(checkboxes[1].getAttribute('tabindex')).toBe('-1');

      fixture.detectChanges();
      TestBed.flushEffects();

      expect(checkboxes[0].getAttribute('tabindex')).toBe('0');
      expect(checkboxes[1].getAttribute('tabindex')).toBe('-1');

      fixture.detectChanges();
      TestBed.flushEffects();

      expect(checkboxes[0].getAttribute('tabindex')).toBe('0');
      expect(checkboxes[1].getAttribute('tabindex')).toBe('-1');
    });

    it('forwards per-leaf [disabled] to the injected CngxRovingItem via the alias', () => {
      @Component({
        template: `
          <div cngxRovingTabindex>
            <cngx-checkbox>A</cngx-checkbox>
            <cngx-checkbox>B</cngx-checkbox>
            <cngx-checkbox [disabled]="cOff()">C</cngx-checkbox>
          </div>
        `,
        imports: [CngxCheckbox, CngxRovingTabindex],
      })
      class DisabledLeafHost {
        cOff = signal(true);
      }

      const fixture = TestBed.createComponent(DisabledLeafHost);
      fixture.detectChanges();

      const rovingItems = fixture.debugElement
        .queryAll(By.directive(CngxRovingItem))
        .map((de) => de.injector.get(CngxRovingItem));
      expect(rovingItems[0].disabled()).toBe(false);
      expect(rovingItems[1].disabled()).toBe(false);
      expect(rovingItems[2].disabled()).toBe(true);
    });

    it('ArrowDown on the roving parent skips a disabled cngx-checkbox leaf', () => {
      @Component({
        template: `
          <div cngxRovingTabindex orientation="vertical">
            <cngx-checkbox>A</cngx-checkbox>
            <cngx-checkbox [disabled]="bOff()">B</cngx-checkbox>
            <cngx-checkbox>C</cngx-checkbox>
          </div>
        `,
        imports: [CngxCheckbox, CngxRovingTabindex],
      })
      class SkipHost {
        bOff = signal(true);
      }

      const fixture = TestBed.createComponent(SkipHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const wrapper = fixture.debugElement.query(By.directive(CngxRovingTabindex))
        .nativeElement as HTMLElement;
      const checkboxes = fixture.debugElement
        .queryAll(By.directive(CngxCheckbox))
        .map((de) => de.nativeElement as HTMLElement);

      expect(checkboxes[0].getAttribute('tabindex')).toBe('0');

      wrapper.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(checkboxes[0].getAttribute('tabindex')).toBe('-1');
      expect(checkboxes[1].getAttribute('tabindex')).toBe('-1');
      expect(checkboxes[2].getAttribute('tabindex')).toBe('0');
    });
  });
});
