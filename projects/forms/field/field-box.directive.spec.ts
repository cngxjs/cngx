import { Component, Directive, input, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
  type CngxFormFieldHostContract,
} from '@cngx/core/tokens';
import { describe, expect, it } from 'vitest';
import { CngxInput } from '@cngx/forms/input';
import { CngxAffixRow, CngxFieldBox } from './field-box.directive';
import { CNGX_FIELD_BOX } from './field-box.token';
import { CngxPrefix } from './prefix.directive';
import { CngxSuffix } from './suffix.directive';

@Directive({
  selector: '[stubControl]',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: StubControl }],
})
class StubControl implements CngxFormFieldControl {
  readonly invalid = input(false);
  readonly off = input(false);
  readonly id = signal('stub');
  readonly focused = signal(false);
  readonly empty = signal(true);
  readonly disabled = this.off;
  readonly errorState = this.invalid;
  focusCalls = 0;
  focus(): void {
    this.focusCalls++;
  }
}

function box(fixture: { nativeElement: HTMLElement }): HTMLElement {
  return fixture.nativeElement.querySelector('.cngx-field-box') as HTMLElement;
}

describe('CngxFieldBox', () => {
  // The affix marker is an implementation detail shared by sibling files; the
  // public entry must not leak it.
  it('keeps the affix marker token out of the public entry', async () => {
    const api: Record<string, unknown> = await import('./public-api');
    expect(api['CNGX_FIELD_AFFIX']).toBeUndefined();
    expect(api['CNGX_FIELD_BOX']).toBeDefined();
  });

  it('carries the box class and keeps the affix-row class for existing CSS', () => {
    @Component({ template: `<span cngxFieldBox><input /></span>`, imports: [CngxFieldBox] })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(box(fixture).classList.contains('cngx-field-box')).toBe(true);
    expect(box(fixture).classList.contains('cngx-field-affix-row')).toBe(true);
  });

  it('still resolves through the deprecated cngxAffixRow selector and alias', () => {
    @Component({
      template: `<span cngxAffixRow skin="fill"><input /></span>`,
      imports: [CngxAffixRow],
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(CngxAffixRow).toBe(CngxFieldBox);
    expect(box(fixture).getAttribute('data-skin')).toBe('fill');
  });

  it('provides CNGX_FIELD_BOX with the direct-child control elements', () => {
    @Component({
      template: `<span cngxFieldBox
        ><input cngxInput /><span><input cngxInput class="deep" /></span
      ></span>`,
      imports: [CngxFieldBox, CngxInput],
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const token = fixture.debugElement
      .query((d) => d.nativeElement === box(fixture))
      .injector.get(CNGX_FIELD_BOX);
    const elements = token.controlElements().map((ref) => ref.nativeElement);
    expect(elements).toEqual([fixture.nativeElement.querySelector('input:not(.deep)')]);
  });

  describe('main control', () => {
    @Component({
      template: `
        <span cngxFieldBox>
          <span stubControl cngxPrefix [invalid]="affixInvalid()" [off]="affixOff()"></span>
          <span stubControl [invalid]="mainInvalid()" [off]="mainOff()"></span>
        </span>
      `,
      imports: [CngxFieldBox, CngxPrefix, StubControl],
    })
    class AffixFirst {
      readonly affixInvalid = signal(false);
      readonly affixOff = signal(false);
      readonly mainInvalid = signal(false);
      readonly mainOff = signal(false);
    }

    @Component({
      template: `
        <span cngxFieldBox>
          <span stubControl [invalid]="mainInvalid()" [off]="mainOff()"></span>
          <span stubControl cngxSuffix [invalid]="affixInvalid()" [off]="affixOff()"></span>
        </span>
      `,
      imports: [CngxFieldBox, CngxSuffix, StubControl],
    })
    class AffixLast {
      readonly affixInvalid = signal(false);
      readonly affixOff = signal(false);
      readonly mainInvalid = signal(false);
      readonly mainOff = signal(false);
    }

    for (const [name, host] of [
      ['an affix control before the main control', AffixFirst],
      ['an affix control after the main control', AffixLast],
    ] as const) {
      it(`ignores ${name}`, () => {
        const fixture = TestBed.createComponent(host);
        fixture.detectChanges();

        fixture.componentInstance.affixInvalid.set(true);
        fixture.componentInstance.affixOff.set(true);
        fixture.detectChanges();
        expect(box(fixture).hasAttribute('data-invalid')).toBe(false);
        expect(box(fixture).hasAttribute('data-disabled')).toBe(false);

        fixture.componentInstance.mainInvalid.set(true);
        fixture.componentInstance.mainOff.set(true);
        fixture.detectChanges();
        expect(box(fixture).getAttribute('data-invalid')).toBe('');
        expect(box(fixture).getAttribute('data-disabled')).toBe('');
      });
    }

    it('takes a lone unmarked control as the main control', () => {
      @Component({
        template: `<span cngxFieldBox
          ><span stubControl [invalid]="true" [off]="true"></span
        ></span>`,
        imports: [CngxFieldBox, StubControl],
      })
      class Host {}
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      expect(box(fixture).getAttribute('data-invalid')).toBe('');
      expect(box(fixture).getAttribute('data-disabled')).toBe('');
    });

    it('does not count an affix element without a control as a main-control candidate', () => {
      @Component({
        template: `
          <span cngxFieldBox>
            <span cngxPrefix>CHF</span>
            <span stubControl [invalid]="true"></span>
          </span>
        `,
        imports: [CngxFieldBox, CngxPrefix, StubControl],
      })
      class Host {}
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      expect(box(fixture).getAttribute('data-invalid')).toBe('');
    });
  });

  it('publishes readonly from the surrounding field host', () => {
    const readonly = signal(false);
    const fieldHost: CngxFormFieldHostContract = {
      showError: signal(false),
      markAsTouched: () => undefined,
      readonly,
    };
    @Component({
      template: `<span cngxFieldBox><span stubControl></span></span>`,
      imports: [CngxFieldBox, StubControl],
      providers: [{ provide: CNGX_FORM_FIELD_HOST, useValue: fieldHost }],
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(box(fixture).hasAttribute('data-readonly')).toBe(false);

    readonly.set(true);
    fixture.detectChanges();
    expect(box(fixture).getAttribute('data-readonly')).toBe('');
  });

  it('publishes readonly from the main control outside a field', () => {
    @Component({
      template: `<span cngxFieldBox><input cngxInput readonly /></span>`,
      imports: [CngxFieldBox, CngxInput],
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(box(fixture).getAttribute('data-readonly')).toBe('');
  });

  it('ignores a readonly affix control', () => {
    @Component({
      template: `<span cngxFieldBox
        ><input cngxInput cngxPrefix readonly /><span stubControl></span
      ></span>`,
      imports: [CngxFieldBox, CngxInput, CngxPrefix, StubControl],
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(box(fixture).hasAttribute('data-readonly')).toBe(false);
  });

  it('writes no state attribute without a field host or a control', () => {
    @Component({ template: `<span cngxFieldBox><input /></span>`, imports: [CngxFieldBox] })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(box(fixture).hasAttribute('data-invalid')).toBe(false);
    expect(box(fixture).hasAttribute('data-disabled')).toBe(false);
    expect(box(fixture).hasAttribute('data-readonly')).toBe(false);
  });

  describe('click forwarding', () => {
    @Component({
      template: `
        <span cngxFieldBox>
          <span stubControl cngxPrefix class="affix"></span>
          <span stubControl class="main"></span>
        </span>
      `,
      imports: [CngxFieldBox, CngxPrefix, StubControl],
    })
    class Host {}

    function controls(fixture: ComponentFixture<unknown>) {
      const [affix, main] = fixture.debugElement
        .queryAll((d) => d.nativeElement.hasAttribute?.('stubControl'))
        .map((d) => d.injector.get(StubControl));
      return { affix, main };
    }

    it('focuses the main control on a click on the box padding', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      box(fixture).click();
      const { affix, main } = controls(fixture);
      expect(main.focusCalls).toBe(1);
      expect(affix.focusCalls).toBe(0);
    });

    it('leaves a click on a child to that child', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.affix') as HTMLElement).click();
      expect(controls(fixture).main.focusCalls).toBe(0);
    });
  });
});
