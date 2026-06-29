import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxFormField } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { CngxInputMask } from '../input-mask.directive';
import {
  provideInputConfig,
  withInputAriaLabels,
  withPhoneDefaultRegion,
} from '../input-config';
import { CngxPhoneInput } from './phone-input.component';
import { CNGX_PHONE_COUNTRIES } from './countries';

@Component({
  template: `<cngx-phone-input [(value)]="value" [(country)]="country" [disabled]="disabled" />`,
  imports: [CngxPhoneInput],
})
class Host {
  readonly phone = viewChild.required(CngxPhoneInput);
  value = '';
  country = CNGX_PHONE_COUNTRIES[0];
  disabled = false;
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  TestBed.flushEffects();
  const phone = fixture.componentInstance.phone();
  const mask = fixture.debugElement
    .query(By.directive(CngxInputMask))
    .injector.get(CngxInputMask);
  return { fixture, phone, mask };
}

const germany = CNGX_PHONE_COUNTRIES.find((c) => c.region === 'DE')!;
const usa = CNGX_PHONE_COUNTRIES.find((c) => c.region === 'US')!;

afterEach(() => {
  document.body.replaceChildren();
});

describe('CngxPhoneInput', () => {
  it('re-targets the mask region when the country changes', () => {
    const { fixture, phone, mask } = setup();
    phone.country.set(germany);
    fixture.detectChanges();
    expect(mask.mask()).toBe('phone:DE');

    phone.country.set(usa);
    fixture.detectChanges();
    expect(mask.mask()).toBe('phone:US');
  });

  it('exposes the form-field control contract', () => {
    const { phone } = setup();
    expect(phone.empty()).toBe(true);
    phone.value.set('49123456789');
    expect(phone.empty()).toBe(false);
    expect(phone.errorState()).toBe(false);
    expect(typeof phone.id()).toBe('string');
  });

  it('syncs value bidirectionally inside cngx-form-field', () => {
    const { accessor, ref } = createMockField<string>({ name: 'phone', value: '' });

    @Component({
      template: `
        <cngx-form-field [field]="field">
          <cngx-phone-input [(value)]="value" />
        </cngx-form-field>
      `,
      imports: [CngxFormField, CngxPhoneInput],
    })
    class FieldHost {
      readonly phone = viewChild.required(CngxPhoneInput);
      readonly field = accessor;
      value = '';
    }

    const fixture = TestBed.createComponent(FieldHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.flushEffects();

    ref.value.set('49170123456');
    TestBed.flushEffects();
    expect(fixture.componentInstance.phone().value()).toBe('49170123456');

    fixture.componentInstance.phone().value.set('4915112345');
    TestBed.flushEffects();
    expect(ref.value()).toBe('4915112345');
  });

  it('is the single labelled control - the masked input carries the field id', () => {
    const { accessor } = createMockField<string>({ name: 'phone', value: '' });

    @Component({
      template: `
        <cngx-form-field [field]="field">
          <cngx-phone-input />
        </cngx-form-field>
      `,
      imports: [CngxFormField, CngxPhoneInput],
    })
    class FieldHost {
      readonly field = accessor;
    }

    const fixture = TestBed.createComponent(FieldHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.flushEffects();

    const input = fixture.nativeElement.querySelector(
      '.cngx-phone-input__number',
    ) as HTMLInputElement;
    expect(input.id).toBe('cngx-phone-input');
  });

  it('derives disabled from a disabled form field', () => {
    const { accessor } = createMockField<string>({ name: 'phone', value: '', disabled: true });

    @Component({
      template: `
        <cngx-form-field [field]="field">
          <cngx-phone-input />
        </cngx-form-field>
      `,
      imports: [CngxFormField, CngxPhoneInput],
    })
    class FieldHost {
      readonly phone = viewChild.required(CngxPhoneInput);
      readonly field = accessor;
    }

    const fixture = TestBed.createComponent(FieldHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.phone().disabled()).toBe(true);
  });

  it('marks aria-disabled and exposes a disabled reason', () => {
    @Component({
      template: `<cngx-phone-input [disabled]="true" disabledReason="Locked until sign-in" />`,
      imports: [CngxPhoneInput],
    })
    class DisabledHost {}

    const fixture = TestBed.createComponent(DisabledHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('cngx-phone-input') as HTMLElement;
    expect(group.getAttribute('aria-disabled')).toBe('true');

    const reason = fixture.nativeElement.querySelector(
      '.cngx-phone-input__disabled-reason',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      '.cngx-phone-input__number',
    ) as HTMLElement;
    expect(input.getAttribute('aria-describedby')).toContain(reason.id);
    expect(reason.textContent).toContain('Locked until sign-in');
    expect(reason.getAttribute('aria-hidden')).toBeNull();
  });

  it('routes the country label through the config cascade', () => {
    TestBed.configureTestingModule({
      providers: [provideInputConfig(withInputAriaLabels({ phoneCountry: 'Land' }))],
    });
    const { fixture } = setup();
    const select = fixture.nativeElement.querySelector('cngx-select') as HTMLElement;
    expect(select.getAttribute('aria-label')).toBe('Land');
  });

  it('applies the configured default region when no country is bound', () => {
    TestBed.configureTestingModule({
      providers: [provideInputConfig(withPhoneDefaultRegion('DE'))],
    });

    @Component({ template: `<cngx-phone-input />`, imports: [CngxPhoneInput] })
    class BareHost {
      readonly phone = viewChild.required(CngxPhoneInput);
    }

    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.phone().country().region).toBe('DE');
  });
});
