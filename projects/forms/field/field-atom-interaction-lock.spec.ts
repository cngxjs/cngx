import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, FormField, readonly } from '@angular/forms/signals';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxChip } from '@cngx/common/display';
import {
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
import { CngxInput } from '@cngx/forms/input';

import { CngxFormField } from './form-field.component';
import { CngxSuffix } from './suffix.directive';

// A disabled or readonly field reaches the atom it discovered: disabled
// blocks every value change and marks the atom aria-disabled; readonly
// blocks every value change but keeps the atom focusable and sets
// aria-readonly only on the roles that allow it.

type Lock = 'none' | 'disabled' | 'readonly';

@Component({
  template: `
    <cngx-form-field [field]="f.check" data-atom="checkbox">
      <cngx-checkbox>Check</cngx-checkbox>
    </cngx-form-field>
    <cngx-form-field [field]="f.toggle" data-atom="toggle">
      <cngx-toggle>Toggle</cngx-toggle>
    </cngx-form-field>
    <cngx-form-field [field]="f.chip" data-atom="chip-interaction">
      <cngx-chip cngxChipInteraction [value]="'chip'">Chip</cngx-chip>
    </cngx-form-field>
    <cngx-form-field [field]="f.radio" data-atom="radio-group">
      <cngx-radio-group label="Radio">
        <cngx-radio value="a">A</cngx-radio>
        <cngx-radio value="b">B</cngx-radio>
      </cngx-radio-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.single" data-atom="button-toggle-group">
      <cngx-button-toggle-group label="Single">
        <button type="button" cngxButtonToggle value="a">A</button>
        <button type="button" cngxButtonToggle value="b">B</button>
      </cngx-button-toggle-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.multi" data-atom="button-multi-toggle-group">
      <cngx-button-multi-toggle-group label="Multi">
        <button type="button" cngxButtonToggle value="a">A</button>
        <button type="button" cngxButtonToggle value="b">B</button>
      </cngx-button-multi-toggle-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.boxes" data-atom="checkbox-group">
      <cngx-checkbox-group label="Boxes" [allValues]="options" #g="cngxCheckboxGroup">
        @for (opt of options; track opt) {
          <cngx-checkbox
            [value]="g.selectedValues().includes(opt)"
            (valueChange)="$event ? g.select(opt) : g.deselect(opt)"
            >{{ opt }}</cngx-checkbox
          >
        }
      </cngx-checkbox-group>
      <span class="readout">{{ g.selectedValues().join(',') }}</span>
    </cngx-form-field>
    <cngx-form-field [field]="f.size" data-atom="chip-group">
      <cngx-chip-group label="Size">
        <cngx-chip cngxChipInGroup [value]="'a'">A</cngx-chip>
        <cngx-chip cngxChipInGroup [value]="'b'">B</cngx-chip>
      </cngx-chip-group>
    </cngx-form-field>
    <cngx-form-field [field]="f.tags" data-atom="multi-chip-group">
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
  readonly lock = signal<Lock>('none');
  readonly model = signal({
    check: false,
    toggle: false,
    chip: false,
    radio: '',
    single: '',
    multi: [] as string[],
    boxes: [] as string[],
    size: '',
    tags: [] as string[],
  });
  readonly f = form(this.model, (p) => {
    disabled(p, () => this.lock() === 'disabled');
    readonly(p, () => this.lock() === 'readonly');
  });
}

interface AtomCase {
  readonly name: string;
  /** The field's control host. */
  readonly host: string;
  /** The element a user clicks or presses keys on. */
  readonly target: string;
  /** Leaves that must report the group's disabled state. */
  readonly leaves?: string;
  /** Whether the host role allows `aria-readonly` (checkbox, switch, radiogroup, listbox). */
  readonly ariaReadonly: boolean;
  readonly state: (field: HTMLElement) => string;
}

const attr =
  (selector: string, name: string) =>
  (field: HTMLElement): string =>
    Array.from(field.querySelectorAll(selector))
      .map((n) => n.getAttribute(name))
      .join('|');

const CASES: readonly AtomCase[] = [
  {
    name: 'checkbox',
    host: 'cngx-checkbox',
    target: 'cngx-checkbox',
    ariaReadonly: true,
    state: attr('cngx-checkbox', 'aria-checked'),
  },
  {
    name: 'toggle',
    host: 'cngx-toggle',
    target: 'cngx-toggle',
    ariaReadonly: true,
    state: attr('cngx-toggle', 'aria-checked'),
  },
  {
    name: 'chip-interaction',
    host: '[cngxChipInteraction]',
    target: '[cngxChipInteraction]',
    ariaReadonly: false,
    state: attr('[cngxChipInteraction]', 'aria-selected'),
  },
  {
    name: 'radio-group',
    host: 'cngx-radio-group',
    target: 'cngx-radio',
    leaves: 'cngx-radio',
    ariaReadonly: true,
    state: attr('cngx-radio', 'aria-checked'),
  },
  {
    name: 'button-toggle-group',
    host: 'cngx-button-toggle-group',
    target: 'button',
    leaves: 'button',
    ariaReadonly: true,
    state: attr('button', 'aria-checked'),
  },
  {
    name: 'button-multi-toggle-group',
    host: 'cngx-button-multi-toggle-group',
    target: 'button',
    ariaReadonly: false,
    state: attr('button', 'aria-pressed'),
  },
  {
    name: 'checkbox-group',
    host: 'cngx-checkbox-group',
    target: 'cngx-checkbox',
    ariaReadonly: false,
    state: (field) => field.querySelector('.readout')!.textContent ?? '',
  },
  {
    name: 'chip-group',
    host: 'cngx-chip-group',
    target: '[cngxChipInGroup]',
    ariaReadonly: true,
    state: attr('[cngxChipInGroup]', 'aria-selected'),
  },
  {
    name: 'multi-chip-group',
    host: 'cngx-multi-chip-group',
    target: '[cngxChipInGroup]',
    ariaReadonly: true,
    state: attr('[cngxChipInGroup]', 'aria-selected'),
  },
];

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

function mountAtoms(lock: Lock) {
  const fixture = TestBed.createComponent(AtomsHost);
  document.body.appendChild(fixture.nativeElement);
  fixture.componentInstance.lock.set(lock);
  fixture.detectChanges();
  flush(fixture);
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function key(target: Element, k: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

function interact(fixture: { detectChanges: () => void }, field: HTMLElement, c: AtomCase): void {
  const target = field.querySelector<HTMLElement>(c.target)!;
  target.click();
  flush(fixture);
  key(target, ' ');
  flush(fixture);
  key(target, 'Enter');
  flush(fixture);
  const host = field.querySelector<HTMLElement>(c.host)!;
  key(host, 'ArrowDown');
  flush(fixture);
  key(host, 'ArrowRight');
  flush(fixture);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('field atom interaction lock - disabled field', () => {
  for (const c of CASES) {
    it(`${c.name}: aria-disabled and no value change on click, Space, Enter and arrows`, () => {
      const { fixture, host, el } = mountAtoms('disabled');
      const field = el.querySelector<HTMLElement>(`[data-atom="${c.name}"]`)!;
      const before = c.state(field);
      const modelBefore = host.model();

      expect(field.querySelector(c.host)!.getAttribute('aria-disabled')).toBe('true');
      interact(fixture, field, c);

      expect(c.state(field)).toBe(before);
      expect(host.model()).toEqual(modelBefore);
    });
  }

  for (const c of CASES.filter((x) => x.leaves)) {
    it(`${c.name}: every leaf reports the field's disabled state`, () => {
      const { el } = mountAtoms('disabled');
      const field = el.querySelector<HTMLElement>(`[data-atom="${c.name}"]`)!;
      const leaves = Array.from(field.querySelectorAll(c.leaves!));
      expect(leaves.length).toBeGreaterThan(0);
      for (const leaf of leaves) {
        expect(leaf.getAttribute('aria-disabled')).toBe('true');
      }
    });
  }

  it('an enabled field leaves every atom enabled', () => {
    const { el } = mountAtoms('none');
    for (const c of CASES) {
      const field = el.querySelector<HTMLElement>(`[data-atom="${c.name}"]`)!;
      expect(field.querySelector(c.host)!.hasAttribute('aria-disabled')).toBe(false);
      expect(field.querySelector(c.host)!.hasAttribute('aria-readonly')).toBe(false);
    }
  });

  it('a checkbox-group leaf is not the field control and ignores the field', () => {
    const { el } = mountAtoms('disabled');
    const field = el.querySelector<HTMLElement>('[data-atom="checkbox-group"]')!;
    for (const leaf of Array.from(field.querySelectorAll('cngx-checkbox'))) {
      expect(leaf.hasAttribute('aria-disabled')).toBe(false);
    }
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.email">
        <input cngxInput [formField]="f.email" />
        <cngx-toggle cngxSuffix>Remember</cngx-toggle>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxInput, FormField, CngxToggle, CngxSuffix],
  })
  class AffixHost {
    readonly f = form(signal({ email: '' }), (p) => {
      disabled(p.email);
      readonly(p.email);
    });
  }

  it('an affix atom is not the field control and ignores the field', () => {
    const fixture = TestBed.createComponent(AffixHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'cngx-toggle',
    )!;
    expect(toggle.hasAttribute('aria-disabled')).toBe(false);
    expect(toggle.hasAttribute('aria-readonly')).toBe(false);
    toggle.click();
    flush(fixture);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.check">
        <cngx-checkbox [disabled]="true">Check</cngx-checkbox>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxCheckbox],
  })
  class ConsumerDisabledHost {
    readonly f = form(signal({ check: false }));
  }

  it('a consumer [disabled] in an enabled field still wins', () => {
    const fixture = TestBed.createComponent(ConsumerDisabledHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    flush(fixture);
    const box = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('cngx-checkbox')!;
    expect(box.getAttribute('aria-disabled')).toBe('true');
    box.click();
    flush(fixture);
    expect(box.getAttribute('aria-checked')).toBe('false');
  });
});

describe('field atom interaction lock - readonly field', () => {
  for (const c of CASES) {
    it(`${c.name}: no value change, focus kept, aria-readonly ${c.ariaReadonly ? 'set' : 'absent'}`, () => {
      const { fixture, host, el } = mountAtoms('readonly');
      const field = el.querySelector<HTMLElement>(`[data-atom="${c.name}"]`)!;
      const atom = field.querySelector<HTMLElement>(c.host)!;
      const before = c.state(field);
      const modelBefore = host.model();

      expect(atom.getAttribute('aria-readonly')).toBe(c.ariaReadonly ? 'true' : null);
      expect(atom.hasAttribute('aria-disabled')).toBe(false);

      interact(fixture, field, c);
      expect(c.state(field)).toBe(before);
      expect(host.model()).toEqual(modelBefore);

      const stop = field.querySelector<HTMLElement>('[tabindex="0"]');
      expect(stop).not.toBeNull();
      stop!.focus();
      expect(document.activeElement).toBe(stop);
    });
  }
});
