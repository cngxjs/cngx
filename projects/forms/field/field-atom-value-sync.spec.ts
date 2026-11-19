import { Component, DestroyRef, inject, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { disabled, form, FormField, readonly } from '@angular/forms/signals';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxChip } from '@cngx/common/display';
import {
  CngxSlider,
  CngxSliderTrack,
  CngxButtonMultiToggleGroup,
  CngxButtonToggle,
  CngxButtonToggleGroup,
  CngxCheckbox,
  CngxCheckboxGroup,
  CngxChipGroup,
  CngxChipInGroup,
  CngxChipInteraction,
  CngxMultiChipGroup,
  CngxRadio,
  CngxRadioGroup,
  CngxToggle,
} from '@cngx/common/interactive';
import { CngxFormBridge } from '@cngx/forms/controls';
import { CngxInput, CngxNumericInput, CngxRating } from '@cngx/forms/input';
import { CngxSelect } from '@cngx/forms/select';

import { adaptFormControl } from './form-control-adapter';
import { CngxFormField } from './form-field.component';
import { CngxSliderFieldBridge } from './slider-field-bridge.directive';

// An atom dropped into cngx-form-field without a value binding: the field
// syncs the control it discovered. A click writes the model and dirties the
// field, the mount seed leaves it pristine, reset() clears both. Reactive
// Forms directives and [formField] bindings keep the value; the presenter
// stays out.

interface AtomModel {
  check: boolean;
  toggle: boolean;
  chip: boolean;
  radio: string;
  single: string;
  multi: string[];
  boxes: string[];
  size: string;
  tags: string[];
}

const DEFAULTS: AtomModel = {
  check: false,
  toggle: false,
  chip: false,
  radio: '',
  single: '',
  multi: [],
  boxes: [],
  size: '',
  tags: [],
};

const SEEDED: AtomModel = {
  check: true,
  toggle: true,
  chip: true,
  radio: 'a',
  single: 'a',
  multi: ['b'],
  boxes: ['b'],
  size: 'a',
  tags: ['b'],
};

let initial: AtomModel = DEFAULTS;

@Component({
  template: `
    <cngx-form-field [field]="f.check" data-atom="check">
      <cngx-checkbox>Check</cngx-checkbox>
    </cngx-form-field>
    <cngx-form-field [field]="f.toggle" data-atom="toggle">
      <cngx-toggle>Toggle</cngx-toggle>
    </cngx-form-field>
    <cngx-form-field [field]="f.chip" data-atom="chip">
      <cngx-chip cngxChipInteraction [value]="'chip'">Chip</cngx-chip>
    </cngx-form-field>
    <cngx-form-field [field]="f.radio" data-atom="radio">
      <cngx-radio-group label="Radio">
        <cngx-radio value="a">A</cngx-radio>
        <cngx-radio value="b">B</cngx-radio>
      </cngx-radio-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.single" data-atom="single">
      <cngx-button-toggle-group label="Single">
        <button type="button" cngxButtonToggle value="a">A</button>
        <button type="button" cngxButtonToggle value="b">B</button>
      </cngx-button-toggle-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.multi" data-atom="multi">
      <cngx-button-multi-toggle-group label="Multi">
        <button type="button" cngxButtonToggle value="a">A</button>
        <button type="button" cngxButtonToggle value="b">B</button>
      </cngx-button-multi-toggle-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.boxes" data-atom="boxes">
      <cngx-checkbox-group label="Boxes" [allValues]="options" #g="cngxCheckboxGroup">
        @for (opt of options; track opt) {
          <cngx-checkbox
            [attr.data-value]="opt"
            [value]="g.selectedValues().includes(opt)"
            (valueChange)="$event ? g.select(opt) : g.deselect(opt)"
            >{{ opt }}</cngx-checkbox
          >
        }
      </cngx-checkbox-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.size" data-atom="size">
      <cngx-chip-group label="Size">
        <cngx-chip cngxChipInGroup [value]="'a'">A</cngx-chip>
        <cngx-chip cngxChipInGroup [value]="'b'">B</cngx-chip>
      </cngx-chip-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.tags" data-atom="tags">
      <cngx-multi-chip-group label="Tags">
        <cngx-chip cngxChipInGroup [value]="'a'">A</cngx-chip>
        <cngx-chip cngxChipInGroup [value]="'b'">B</cngx-chip>
      </cngx-multi-chip-group>
    </cngx-form-field>
  `,
  imports: [
    CngxFormField,
    CngxCheckbox,
    CngxToggle,
    CngxChip,
    CngxChipInteraction,
    CngxRadioGroup,
    CngxRadio,
    CngxButtonToggleGroup,
    CngxButtonMultiToggleGroup,
    CngxButtonToggle,
    CngxCheckboxGroup,
    CngxChipGroup,
    CngxMultiChipGroup,
    CngxChipInGroup,
  ],
})
class AtomsHost {
  readonly options = ['a', 'b'];
  readonly model = signal<AtomModel>(structuredClone(initial));
  readonly f = form(this.model);
}

interface AtomCase {
  readonly key: keyof AtomModel;
  /** Clicked to move the atom off its default. */
  readonly click: string;
  /** The value the click writes into the model. */
  readonly clicked: unknown;
  /** `[selector, attribute]` that reads `'true'` when the atom shows {@link SEEDED}. */
  readonly seeded: readonly [string, string];
  /** `[selector, attribute]` that reads `'true'` after {@link click}. */
  readonly shown: readonly [string, string];
}

const CASES: readonly AtomCase[] = [
  {
    key: 'check',
    click: 'cngx-checkbox',
    clicked: true,
    seeded: ['cngx-checkbox', 'aria-checked'],
    shown: ['cngx-checkbox', 'aria-checked'],
  },
  {
    key: 'toggle',
    click: 'cngx-toggle',
    clicked: true,
    seeded: ['cngx-toggle', 'aria-checked'],
    shown: ['cngx-toggle', 'aria-checked'],
  },
  {
    key: 'chip',
    click: '[cngxChipInteraction]',
    clicked: true,
    seeded: ['[cngxChipInteraction]', 'aria-selected'],
    shown: ['[cngxChipInteraction]', 'aria-selected'],
  },
  {
    key: 'radio',
    click: 'cngx-radio:nth-of-type(2)',
    clicked: 'b',
    seeded: ['cngx-radio:nth-of-type(1)', 'aria-checked'],
    shown: ['cngx-radio:nth-of-type(2)', 'aria-checked'],
  },
  {
    key: 'single',
    click: 'button:nth-of-type(2)',
    clicked: 'b',
    seeded: ['button:nth-of-type(1)', 'aria-checked'],
    shown: ['button:nth-of-type(2)', 'aria-checked'],
  },
  {
    key: 'multi',
    click: 'button:nth-of-type(1)',
    clicked: ['a'],
    seeded: ['button:nth-of-type(2)', 'aria-pressed'],
    shown: ['button:nth-of-type(1)', 'aria-pressed'],
  },
  {
    key: 'boxes',
    click: 'cngx-checkbox[data-value="a"]',
    clicked: ['a'],
    seeded: ['cngx-checkbox[data-value="b"]', 'aria-checked'],
    shown: ['cngx-checkbox[data-value="a"]', 'aria-checked'],
  },
  {
    key: 'size',
    click: '[cngxChipInGroup]:nth-of-type(2)',
    clicked: 'b',
    seeded: ['[cngxChipInGroup]:nth-of-type(1)', 'aria-selected'],
    shown: ['[cngxChipInGroup]:nth-of-type(2)', 'aria-selected'],
  },
  {
    key: 'tags',
    click: '[cngxChipInGroup]:nth-of-type(1)',
    clicked: ['a'],
    seeded: ['[cngxChipInGroup]:nth-of-type(2)', 'aria-selected'],
    shown: ['[cngxChipInGroup]:nth-of-type(1)', 'aria-selected'],
  },
];

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

function mountAtoms(values: AtomModel) {
  initial = values;
  const fixture = TestBed.createComponent(AtomsHost);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  flush(fixture);
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function within(el: HTMLElement, key: keyof AtomModel, selector: string): HTMLElement {
  return el.querySelector<HTMLElement>(`[data-atom="${key}"] ${selector}`)!;
}

afterEach(() => {
  initial = DEFAULTS;
  document.body.innerHTML = '';
});

describe('field atom value sync - R1 atom without a value binding', () => {
  for (const c of CASES) {
    it(`${c.key}: a click writes the model and dirties the field`, () => {
      const { fixture, host, el } = mountAtoms(DEFAULTS);
      expect(host.f[c.key]().dirty()).toBe(false);

      within(el, c.key, c.click).click();
      flush(fixture);

      expect(host.model()[c.key]).toEqual(c.clicked);
      expect(host.f[c.key]().dirty()).toBe(true);
      const [selector, attr] = c.shown;
      expect(within(el, c.key, selector).getAttribute(attr)).toBe('true');
    });

    it(`${c.key}: a non-default model value shows after mount and the field stays pristine`, () => {
      const { host, el } = mountAtoms(SEEDED);
      const [selector, attr] = c.seeded;

      expect(within(el, c.key, selector).getAttribute(attr)).toBe('true');
      expect(host.model()[c.key]).toEqual(SEEDED[c.key]);
      expect(host.f[c.key]().dirty()).toBe(false);
    });

    it(`${c.key}: reset() restores the atom and the pristine state`, () => {
      const { fixture, host, el } = mountAtoms(DEFAULTS);
      within(el, c.key, c.click).click();
      flush(fixture);

      host.f().reset(structuredClone(DEFAULTS));
      flush(fixture);

      expect(host.model()[c.key]).toEqual(DEFAULTS[c.key]);
      expect(host.f[c.key]().dirty()).toBe(false);
      const [selector, attr] = c.shown;
      expect(within(el, c.key, selector).getAttribute(attr)).not.toBe('true');
    });
  }

  it('R5: only the checkbox-group value reaches the model, never a leaf', () => {
    const { fixture, host, el } = mountAtoms(DEFAULTS);
    within(el, 'boxes', 'cngx-checkbox[data-value="a"]').click();
    flush(fixture);
    within(el, 'boxes', 'cngx-checkbox[data-value="b"]').click();
    flush(fixture);

    expect(host.model()).toEqual({ ...DEFAULTS, boxes: ['a', 'b'] });
  });
});

describe('field atom value sync - R2 hand value binding', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        <cngx-checkbox [(value)]="f.check().value">Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox],
  })
  class HandBoundHost {
    readonly model = signal({ check: false });
    readonly f = form(this.model);
  }

  it('the hand binding writes once, the presenter sees equal values and stays out', () => {
    const fixture = TestBed.createComponent(HandBoundHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const host = fixture.componentInstance;
    const box = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('cngx-checkbox')!;

    box.click();
    flush(fixture);
    flush(fixture);

    expect(host.model().check).toBe(true);
    expect(box.getAttribute('aria-checked')).toBe('true');
    // value.set is programmatic: the field stays pristine.
    expect(host.f.check().dirty()).toBe(false);
  });
});

describe('field atom value sync - R3 Reactive Forms on the atom', () => {
  @Component({
    template: `
      <cngx-form-field [field]="field">
        <cngx-checkbox [formControl]="control">Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox, ReactiveFormsModule, CngxFormBridge],
  })
  class RfHost {
    readonly control = new FormControl(false, { nonNullable: true });
    readonly field = adaptFormControl(this.control, 'check', inject(DestroyRef));
  }

  it('CngxFormBridge is the only writer: one setValue per click', () => {
    const fixture = TestBed.createComponent(RfHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const host = fixture.componentInstance;
    const setValue = vi.spyOn(host.control, 'setValue');
    const box = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('cngx-checkbox')!;

    box.click();
    flush(fixture);

    expect(host.control.value).toBe(true);
    expect(setValue).toHaveBeenCalledTimes(1);
  });

  @Component({
    template: `
      <cngx-form-field [field]="field">
        <cngx-checkbox [formControl]="control">Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox, ReactiveFormsModule, CngxFormBridge],
  })
  class RfBlurHost {
    readonly control = new FormControl(false, { nonNullable: true, updateOn: 'blur' });
    readonly field = adaptFormControl(this.control, 'check', inject(DestroyRef));
  }

  it("an updateOn: 'blur' control keeps its value until blur", () => {
    const fixture = TestBed.createComponent(RfBlurHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const host = fixture.componentInstance;
    const box = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('cngx-checkbox')!;

    box.click();
    flush(fixture);
    expect(host.control.value).toBe(false);

    box.dispatchEvent(new FocusEvent('blur'));
    box.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    flush(fixture);
    expect(host.control.value).toBe(true);
  });
});

describe('field atom value sync - R4 the value has another owner', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        <input type="checkbox" style="display: none" [formField]="f.check" />
        <cngx-checkbox>Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox, FormField],
  })
  class BoundElsewhereHost {
    readonly model = signal({ check: false });
    readonly f = form(this.model);
  }

  it('a [formField] binding anywhere on the field keeps the presenter out', () => {
    const fixture = TestBed.createComponent(BoundElsewhereHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const host = fixture.componentInstance;

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('cngx-checkbox')!.click();
    flush(fixture);

    expect(host.model().check).toBe(false);
    expect(host.f.check().dirty()).toBe(false);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.amount">
        <input cngxInput cngxNumericInput [formField]="f.amount" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxInput, CngxNumericInput, FormField],
  })
  class NumericHost {
    readonly model = signal({ amount: 3 });
    readonly f = form(this.model);
  }

  it('a numeric cngxInput keeps its [formField] as the only writer', () => {
    const fixture = TestBed.createComponent(NumericHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const host = fixture.componentInstance;
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    expect(host.model().amount).toBe(3);
    expect(host.f.amount().dirty()).toBe(false);

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = '42';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    input.dispatchEvent(new FocusEvent('blur'));
    flush(fixture);

    expect(host.model().amount).toBe(42);
    expect(input.value).toBe('42');
  });
});

describe('field atom value sync - R6 late mount', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        @if (show()) {
          <cngx-checkbox>Check</cngx-checkbox>
        }
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox],
  })
  class LateHost {
    readonly show = signal(false);
    readonly model = signal({ check: true });
    readonly f = form(this.model);
  }

  it('an atom mounted after the first change detection is seeded pristine', () => {
    const fixture = TestBed.createComponent(LateHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const host = fixture.componentInstance;

    host.show.set(true);
    flush(fixture);

    const box = (fixture.nativeElement as HTMLElement).querySelector('cngx-checkbox')!;
    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(host.model().check).toBe(true);
    expect(host.f.check().dirty()).toBe(false);
  });
});

describe('field atom value sync - R7 locked field', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        <cngx-checkbox>Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox],
  })
  class LockedHost {
    readonly lock = signal<'disabled' | 'readonly'>('disabled');
    readonly model = signal({ check: false });
    readonly f = form(this.model, (p) => {
      disabled(p.check, () => this.lock() === 'disabled');
      readonly(p.check, () => this.lock() === 'readonly');
    });
  }

  for (const lock of ['disabled', 'readonly'] as const) {
    it(`a ${lock} field ignores the click: model and dirty untouched`, () => {
      const fixture = TestBed.createComponent(LockedHost);
      document.body.appendChild(fixture.nativeElement);
      fixture.componentInstance.lock.set(lock);
      fixture.detectChanges();
      flush(fixture);
      const host = fixture.componentInstance;

      (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('cngx-checkbox')!.click();
      flush(fixture);

      expect(host.model().check).toBe(false);
      expect(host.f.check().dirty()).toBe(false);
    });
  }
});

describe('field atom value sync - CNGX2032 hand value binding warning', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function collectWarnings() {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    return () =>
      warn.mock.calls
        .map((call: unknown[]) => String(call[0]))
        .filter((message) => message.startsWith('CNGX2032: '));
  }

  function mountHost<T>(type: Type<T>) {
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        <cngx-checkbox [(value)]="f.check().value">Check</cngx-checkbox>
      </cngx-form-field>
      <cngx-form-field [field]="f.pay">
        <cngx-radio-group label="Pay" [(value)]="f.pay().value">
          <cngx-radio value="card">Card</cngx-radio>
          <cngx-radio value="cash">Cash</cngx-radio>
        </cngx-radio-group>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox, CngxRadioGroup, CngxRadio],
  })
  class HandBoundHost {
    readonly model = signal({ check: false, pay: 'card' });
    readonly f = form(this.model);
  }

  it('warns once per field when an atom is also bound by hand', () => {
    const warnings = collectWarnings();
    const { fixture, el } = mountHost(HandBoundHost);
    expect(warnings()).toEqual([]);

    const box = el.querySelector<HTMLElement>('cngx-checkbox')!;
    box.click();
    flush(fixture);
    box.click();
    flush(fixture);
    el.querySelector<HTMLElement>('cngx-radio:nth-of-type(2)')!.click();
    flush(fixture);

    expect(warnings()).toHaveLength(2);
    expect(warnings()[0]).toMatch(
      /^CNGX2032: \[cngx-form-field\] the field "[^"]*check" is also bound by hand on its control/,
    );
    expect(warnings()[1]).toMatch(/the field "[^"]*pay"/);
  });

  it('stays silent for atoms without a value binding: clicks, reset(value), external writes', () => {
    const warnings = collectWarnings();
    const { fixture, host, el } = mountAtoms(SEEDED);
    for (const c of CASES) {
      within(el, c.key, c.click).click();
      flush(fixture);
    }
    host.f().reset(structuredClone(DEFAULTS));
    flush(fixture);
    host.f.check().value.set(true);
    host.model.set(structuredClone(SEEDED));
    flush(fixture);
    fixture.debugElement.query(By.directive(CngxCheckbox)).componentInstance.value.set(false);
    flush(fixture);

    expect(warnings()).toEqual([]);
  });

  @Component({
    template: `
      <cngx-form-field [field]="field">
        <cngx-checkbox [formControl]="control">Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox, ReactiveFormsModule, CngxFormBridge],
  })
  class RfHost {
    readonly control = new FormControl(false, { nonNullable: true });
    readonly field = adaptFormControl(this.control, 'check', inject(DestroyRef));
  }

  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        <input type="checkbox" style="display: none" [formField]="f.check" />
        <cngx-checkbox>Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox, FormField],
  })
  class BoundElsewhereHost {
    readonly model = signal({ check: false });
    readonly f = form(this.model);
  }

  it('stays silent for Reactive Forms and [formField] owners', () => {
    const warnings = collectWarnings();
    const rf = mountHost(RfHost);
    rf.el.querySelector<HTMLElement>('cngx-checkbox')!.click();
    flush(rf.fixture);
    rf.host.control.setValue(false);
    rf.host.control.reset(true);
    flush(rf.fixture);

    const owned = mountHost(BoundElsewhereHost);
    owned.el.querySelector<HTMLElement>('cngx-checkbox')!.click();
    flush(owned.fixture);
    owned.host.f.check().value.set(true);
    flush(owned.fixture);

    expect(warnings()).toEqual([]);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.colour">
        <cngx-select [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="f.stars">
        <cngx-rating />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxSelect, CngxRating],
  })
  class SelectHost {
    readonly options = [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
    ];
    readonly model = signal({ colour: 'red', stars: 0 });
    readonly f = form(this.model);
  }

  @Component({
    template: `
      <cngx-form-field [field]="f.colour">
        <cngx-select [label]="'Colour'" [options]="options" [(value)]="f.colour().value" />
      </cngx-form-field>
      <cngx-form-field [field]="f.stars">
        <cngx-rating [(value)]="f.stars().value" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxSelect, CngxRating],
  })
  class HandBoundSelectHost {
    readonly options = [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
    ];
    readonly model = signal({ colour: 'red', stars: 0 });
    readonly f = form(this.model);
  }

  it('covers the select family and the rating: silent without a hand binding, one warning each with it', () => {
    const warnings = collectWarnings();
    const plain = mountHost(SelectHost);
    const plainSelect = plain.fixture.debugElement.query(By.directive(CngxSelect))
      .componentInstance as CngxSelect<string>;
    plainSelect.value.set('blue');
    flush(plain.fixture);
    plain.fixture.debugElement.query(By.directive(CngxRating)).componentInstance.value.set(3);
    flush(plain.fixture);
    expect(plain.host.model()).toEqual({ colour: 'blue', stars: 3 });
    plain.host.f().reset({ colour: 'red', stars: 0 });
    flush(plain.fixture);
    expect(plain.host.model()).toEqual({ colour: 'red', stars: 0 });
    expect(warnings()).toEqual([]);

    const bound = mountHost(HandBoundSelectHost);
    const boundSelect = bound.fixture.debugElement.query(By.directive(CngxSelect))
      .componentInstance as CngxSelect<string>;
    boundSelect.value.set('blue');
    flush(bound.fixture);
    bound.fixture.debugElement.query(By.directive(CngxRating)).componentInstance.value.set(3);
    flush(bound.fixture);
    expect(bound.host.model()).toEqual({ colour: 'blue', stars: 3 });
    expect(warnings()).toHaveLength(2);
    expect(warnings()[0]).toMatch(/the field "[^"]*colour"/);
    expect(warnings()[1]).toMatch(/the field "[^"]*stars"/);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.plain">
        <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" aria-label="Plain" />
      </cngx-form-field>
      <cngx-form-field [field]="f.bound">
        <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" aria-label="Bound" [(value)]="f.bound().value" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxSlider, CngxSliderFieldBridge],
  })
  class SliderHost {
    readonly model = signal({ plain: 40, bound: 40 });
    readonly f = form(this.model);
  }

  it('covers the slider bridge: silent without a hand binding, one warning with it', () => {
    const warnings = collectWarnings();
    const { fixture, host } = mountHost(SliderHost);
    const [plain, bound] = fixture.debugElement
      .queryAll(By.directive(CngxSlider))
      .map((de) => de.injector.get(CngxSliderTrack));

    plain.value.set(60);
    flush(fixture);
    host.f().reset({ plain: 40, bound: 40 });
    flush(fixture);
    expect(warnings()).toEqual([]);

    bound.value.set(70);
    flush(fixture);
    bound.value.set(80);
    flush(fixture);
    expect(host.model()).toEqual({ plain: 40, bound: 80 });
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatch(/the field "[^"]*bound"/);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.colour">
        <cngx-select [label]="'Colour'" [options]="options" [formField]="f.colour" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxSelect, FormField],
  })
  class FormFieldSelectHost {
    readonly options = [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
    ];
    readonly model = signal({ colour: 'red' });
    readonly f = form(this.model);
  }

  it('stays silent for a select bound through [formField]', () => {
    const warnings = collectWarnings();
    const { fixture, host } = mountHost(FormFieldSelectHost);
    const select = fixture.debugElement.query(By.directive(CngxSelect))
      .componentInstance as CngxSelect<string>;
    select.value.set('blue');
    flush(fixture);

    expect(host.model().colour).toBe('blue');
    expect(host.f.colour().dirty()).toBe(true);
    expect(warnings()).toEqual([]);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        @if (owned()) {
          <input type="checkbox" style="display: none" [formField]="f.check" />
        }
        <cngx-checkbox>Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox, FormField],
  })
  class SwitchingOwnerHost {
    readonly owned = signal(true);
    readonly model = signal({ check: false });
    readonly f = form(this.model);
  }

  it('stays silent when a [formField] owner comes and goes', () => {
    const warnings = collectWarnings();
    const { fixture, host, el } = mountHost(SwitchingOwnerHost);
    host.owned.set(false);
    flush(fixture);
    host.owned.set(true);
    flush(fixture);
    el.querySelector<HTMLElement>('cngx-checkbox')!.click();
    flush(fixture);
    host.owned.set(false);
    flush(fixture);
    el.querySelector<HTMLElement>('cngx-checkbox')!.click();
    flush(fixture);

    expect(warnings()).toEqual([]);
  });

  interface Colour {
    readonly id: number;
  }

  @Component({
    template: `
      <cngx-form-field [field]="f.colour">
        <cngx-select [label]="'Colour'" [options]="options" [compareWith]="byId" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxSelect],
  })
  class ObjectSelectHost {
    readonly options = [
      { value: { id: 1 }, label: 'Red' },
      { value: { id: 2 }, label: 'Blue' },
    ];
    readonly byId = (a: Colour | undefined, b: Colour | undefined) => a?.id === b?.id;
    readonly model = signal<{ colour: Colour }>({ colour: { id: 2 } });
    readonly f = form(this.model);
  }

  it('stays silent when a compareWith select re-picks an equal value with a new identity', () => {
    const warnings = collectWarnings();
    const { fixture, host } = mountHost(ObjectSelectHost);
    const select = fixture.debugElement.query(By.directive(CngxSelect))
      .componentInstance as CngxSelect<Colour>;
    select.value.set(host.options[1].value);
    flush(fixture);

    expect(warnings()).toEqual([]);
  });
});

