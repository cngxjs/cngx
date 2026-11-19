import { Component, DestroyRef, inject, signal, viewChild, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxCheckbox } from '@cngx/common/interactive';
import {
  adaptFormControl,
  CngxFormField,
  CngxHint,
  CngxSuffix,
  CNGX_FORM_FIELD_CONTROL,
  type CngxFieldAccessor,
} from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';
import { CngxInput } from './input.directive';

@Component({
  template: `<input cngxInput skin="bare" />`,
  imports: [CngxInput],
})
class SkinHost {}

// ── With form field parent ──────────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput placeholder="test" />
      <span cngxHint>Work address</span>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput, CngxHint],
})
class HostWithFormField {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

// ── Standalone (no form field parent) ───────────────────────────────

@Component({
  template: `<input cngxInput id="standalone" placeholder="standalone" />`,
  imports: [CngxInput],
})
class HostStandalone {}

@Component({
  template: `<input cngxInput aria-labelledby="col-name" aria-describedby="col-note" />`,
  imports: [CngxInput],
})
class HostStandaloneWithAria {}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput aria-labelledby="custom-label" aria-describedby="extra-note" />
      <span cngxHint>Work address</span>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput, CngxHint],
})
class HostFieldWithAria {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

describe('CngxInput', () => {
  describe('with CngxFormField parent', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<HostWithFormField>>;
    let inputEl: HTMLInputElement;
    let directive: CngxInput;
    let ref: MockFieldRef;

    beforeEach(() => {
      const mock = createMockField({ name: 'email' });
      ref = mock.ref;

      TestBed.configureTestingModule({ imports: [HostWithFormField] });
      fixture = TestBed.createComponent(HostWithFormField);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const debugEl = fixture.debugElement.query(By.directive(CngxInput));
      inputEl = debugEl.nativeElement;
      directive = debugEl.injector.get(CngxInput);
    });

    // ── ID ────────────────────────────────────────────────────────

    it('sets id from presenter', () => {
      expect(inputEl.id).toBe('cngx-email-input');
    });

    it('updates id when field name changes', () => {
      ref.name.set('password');
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.id).toBe('cngx-password-input');
    });

    // ── aria-describedby ─────────────────────────────────────────

    it('sets aria-describedby to the hint ID while no error is shown', () => {
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint');
    });

    it('adds the error ID to aria-describedby while showError is true', () => {
      ref.invalid.set(true);
      ref.touched.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint cngx-email-error');
    });

    // ── aria-labelledby ──────────────────────────────────────────

    it('sets aria-labelledby to label ID', () => {
      expect(inputEl.getAttribute('aria-labelledby')).toBe('cngx-email-label');
    });

    // ── aria-invalid ─────────────────────────────────────────────

    it('does not set aria-invalid when field is valid', () => {
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('does not set aria-invalid when invalid but untouched', () => {
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('sets aria-invalid when touched and invalid', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-invalid')).toBe('true');
    });

    // ── aria-required ────────────────────────────────────────────

    it('does not set aria-required when not required', () => {
      expect(inputEl.getAttribute('aria-required')).toBeNull();
    });

    it('sets aria-required when field is required', () => {
      ref.required.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-required')).toBe('true');
    });

    // ── aria-busy ────────────────────────────────────────────────

    it('does not set aria-busy when not pending', () => {
      expect(inputEl.getAttribute('aria-busy')).toBeNull();
    });

    it('sets aria-busy when async validation is pending', () => {
      ref.pending.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-busy')).toBe('true');
    });

    // ── aria-errormessage ────────────────────────────────────────

    it('does not set aria-errormessage when no error', () => {
      expect(inputEl.getAttribute('aria-errormessage')).toBeNull();
    });

    it('sets aria-errormessage to error ID when showError', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-errormessage')).toBe('cngx-email-error');
    });

    // ── aria-readonly ────────────────────────────────────────────

    it('does not set aria-readonly when not readonly', () => {
      expect(inputEl.getAttribute('aria-readonly')).toBeNull();
    });

    it('sets aria-readonly when field is readonly', () => {
      ref.readonly.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-readonly')).toBe('true');
    });

    // ── disabled ─────────────────────────────────────────────────

    it('is not disabled by default', () => {
      expect(inputEl.disabled).toBe(false);
    });

    it('becomes disabled when field is disabled', () => {
      ref.disabled.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.disabled).toBe(true);
    });

    // ── Focus tracking ───────────────────────────────────────────

    it('tracks focus state', () => {
      expect(directive.focused()).toBe(false);

      inputEl.dispatchEvent(new FocusEvent('focus'));
      expect(directive.focused()).toBe(true);

      inputEl.dispatchEvent(new FocusEvent('blur'));
      expect(directive.focused()).toBe(false);
    });

    // ── Empty tracking ───────────────────────────────────────────

    it('tracks empty state', () => {
      expect(directive.empty()).toBe(true);

      inputEl.value = 'hello';
      inputEl.dispatchEvent(new Event('input'));
      expect(directive.empty()).toBe(false);

      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
      expect(directive.empty()).toBe(true);
    });

    // ── CNGX_FORM_FIELD_CONTROL token ────────────────────────────

    it('provides CNGX_FORM_FIELD_CONTROL', () => {
      const debugEl = fixture.debugElement.query(By.directive(CngxInput));
      const control = debugEl.injector.get(CNGX_FORM_FIELD_CONTROL);
      expect(control).toBe(directive);
    });

    // ── errorState ───────────────────────────────────────────────

    it('errorState mirrors showError', () => {
      expect(directive.errorState()).toBe(false);

      ref.touched.set(true);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(directive.errorState()).toBe(true);
    });

    // ── Smart autocomplete ───────────────────────────────────────

    it('auto-sets autocomplete=email for email field', () => {
      expect(inputEl.getAttribute('autocomplete')).toBe('email');
    });

    // ── Smart spellcheck ─────────────────────────────────────────

    it('auto-disables spellcheck for email field', () => {
      expect(inputEl.getAttribute('spellcheck')).toBe('false');
    });
  });

  // ── Standalone mode (no parent) ────────────────────────────────

  describe('standalone (no CngxFormField parent)', () => {
    let inputEl: HTMLInputElement;
    let directive: CngxInput;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [HostStandalone] });
      const fixture = TestBed.createComponent(HostStandalone);
      fixture.detectChanges();
      TestBed.flushEffects();

      const debugEl = fixture.debugElement.query(By.directive(CngxInput));
      inputEl = debugEl.nativeElement;
      directive = debugEl.injector.get(CngxInput);
    });

    it('does not crash without presenter', () => {
      expect(directive).toBeTruthy();
    });

    it('uses native id when no presenter', () => {
      expect(directive.id()).toBe('standalone');
    });

    it('does not set aria-describedby without presenter', () => {
      expect(inputEl.getAttribute('aria-describedby')).toBeNull();
    });

    it('does not set aria-invalid without presenter', () => {
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('does not set aria-required without presenter', () => {
      expect(inputEl.getAttribute('aria-required')).toBeNull();
    });

    it('still tracks focus', () => {
      expect(directive.focused()).toBe(false);
      inputEl.dispatchEvent(new FocusEvent('focus'));
      expect(directive.focused()).toBe(true);
    });

    it('still tracks empty', () => {
      expect(directive.empty()).toBe(true);
      inputEl.value = 'text';
      inputEl.dispatchEvent(new Event('input'));
      expect(directive.empty()).toBe(false);
    });
  });

  describe('consumer aria references', () => {
    it('keeps aria-labelledby and aria-describedby without a presenter', () => {
      const fixture = TestBed.createComponent(HostStandaloneWithAria);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('input') as HTMLElement;
      expect(el.getAttribute('aria-labelledby')).toBe('col-name');
      expect(el.getAttribute('aria-describedby')).toBe('col-note');
    });

    it('lets a consumer aria-labelledby win over the field label', () => {
      const fixture = TestBed.createComponent(HostFieldWithAria);
      fixture.detectChanges();
      TestBed.flushEffects();
      const el = fixture.nativeElement.querySelector('input') as HTMLElement;
      expect(el.getAttribute('aria-labelledby')).toBe('custom-label');
    });

    it('appends a consumer aria-describedby to the field hint and error ids', () => {
      const fixture = TestBed.createComponent(HostFieldWithAria);
      fixture.detectChanges();
      TestBed.flushEffects();
      const el = fixture.nativeElement.querySelector('input') as HTMLElement;
      const ids = el.getAttribute('aria-describedby')?.split(' ') ?? [];
      expect(ids).toContain('extra-note');
      expect(ids.some((id) => id.endsWith('-hint'))).toBe(true);
    });
  });

  describe('skin alias', () => {
    it('reaches the composed CngxFieldSkinHost', () => {
      const fixture = TestBed.createComponent(SkinHost);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('input') as HTMLElement;
      expect(el.getAttribute('data-skin')).toBe('bare');
    });
  });
});

describe('CngxInput readonly', () => {
  it('reads a static readonly attribute without a surrounding field', () => {
    @Component({ template: `<input cngxInput readonly />`, imports: [CngxInput] })
    class Host {
      readonly input = viewChild.required(CngxInput);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.componentInstance.input().readonly()).toBe(true);
  });

  it('is not readonly without the attribute or a readonly field', () => {
    @Component({ template: `<input cngxInput />`, imports: [CngxInput] })
    class Host {
      readonly input = viewChild.required(CngxInput);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.componentInstance.input().readonly()).toBe(false);
  });
});

describe('CngxInput - unbound field warning (CNGX2031)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function settle(fixture: { detectChanges: () => void }): void {
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
  }

  function mountCollecting<T>(type: Type<T>) {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(type);
    fixture.detectChanges();
    settle(fixture);
    const warnings = () =>
      warn.mock.calls
        .map((call: unknown[]) => String(call[0]))
        .filter((message) => message.startsWith('CNGX2031: '));
    return { fixture, warnings };
  }

  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <input cngxInput />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxInput],
  })
  class UnboundHost {
    readonly f = form(signal({ name: '' }));
  }

  it('warns once when the field control has no [formField] binding', () => {
    const { fixture, warnings } = mountCollecting(UnboundHost);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatch(
      /^CNGX2031: \[cngxInput\] the field "[^"]*name" has no \[formField\] binding/,
    );

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'x';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    settle(fixture);
    settle(fixture);
    expect(warnings()).toHaveLength(1);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <input cngxInput />
      </cngx-form-field>
      <cngx-form-field [field]="f.name">
        <input cngxInput />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxInput],
  })
  class TwoUnboundFieldsHost {
    readonly f = form(signal({ name: '' }));
  }

  it('warns once per field, not per cngx-form-field', () => {
    const { warnings } = mountCollecting(TwoUnboundFieldsHost);
    expect(warnings()).toHaveLength(1);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <input cngxInput [formField]="f.name" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxInput, FormField],
  })
  class BoundHost {
    readonly f = form(signal({ name: '' }));
  }

  it('stays silent with [formField] on the input', () => {
    expect(mountCollecting(BoundHost).warnings()).toEqual([]);
  });

  @Component({
    template: `
      <cngx-form-field [field]="name">
        <input cngxInput [formControl]="control" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxInput, ReactiveFormsModule],
  })
  class AdaptedHost {
    readonly control = new FormControl('', { nonNullable: true });
    readonly name = adaptFormControl(this.control, 'name', inject(DestroyRef));
  }

  it('stays silent for an adaptFormControl() field', () => {
    expect(mountCollecting(AdaptedHost).warnings()).toEqual([]);
  });

  it('stays silent for a createMockField() accessor', () => {
    expect(mountCollecting(HostWithFormField).warnings()).toEqual([]);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.agreed">
        <cngx-checkbox>Agree</cngx-checkbox>
        <input cngxInput cngxSuffix />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxInput, CngxCheckbox, CngxSuffix],
  })
  class AffixHost {
    readonly f = form(signal({ agreed: false }));
  }

  it('stays silent for an affix cngxInput next to another control', () => {
    expect(mountCollecting(AffixHost).warnings()).toEqual([]);
  });
});

describe('CngxInput - template disabled without a field presenter', () => {
  @Component({
    template: `<input cngxInput [disabled]="off()" />`,
    imports: [CngxInput],
  })
  class TemplateDisabledHost {
    readonly off = signal(true);
  }

  function setupTemplateDisabled() {
    TestBed.configureTestingModule({ imports: [TemplateDisabledHost] });
    const fixture = TestBed.createComponent(TemplateDisabledHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const inputEl = fixture.debugElement.query(By.directive(CngxInput))
      .nativeElement as HTMLInputElement;
    return { fixture, inputEl };
  }

  it('keeps a template [disabled] from the first frame', () => {
    const { inputEl } = setupTemplateDisabled();
    expect(inputEl.disabled).toBe(true);
  });

  it('follows later template [disabled] flips', () => {
    const { fixture, inputEl } = setupTemplateDisabled();
    fixture.componentInstance.off.set(false);
    fixture.detectChanges();
    expect(inputEl.disabled).toBe(false);

    fixture.componentInstance.off.set(true);
    fixture.detectChanges();
    expect(inputEl.disabled).toBe(true);
  });
});
