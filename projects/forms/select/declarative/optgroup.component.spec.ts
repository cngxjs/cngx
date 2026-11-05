import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxOptionGroup } from '@cngx/common/interactive';

import { CngxSelectOptgroup } from './optgroup.component';
import { CngxSelectOption } from './option.component';

// Own unit coverage for the declarative <cngx-optgroup> wrapper. It renders a
// WAI-ARIA group: `role="group"` with the label as `aria-label`, a visual
// header carrying the same text, and the CngxOptionGroup atom reporting its
// projected option children in DOM order. (The atom labels the group through
// `aria-label`, not `aria-labelledby`, and carries no disabled input - grouping
// is presentational, so there is no disabled-propagation to assert.)

@Component({
  standalone: true,
  imports: [CngxSelectOptgroup, CngxSelectOption],
  template: `
    <cngx-optgroup [label]="label()">
      <cngx-option [value]="'red'">Red</cngx-option>
      <cngx-option [value]="'amber'">Amber</cngx-option>
    </cngx-optgroup>
  `,
})
class GroupHost {
  readonly label = signal('Warm');
}

function mount() {
  const fixture = TestBed.createComponent(GroupHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return fixture;
}

describe('CngxSelectOptgroup', () => {
  let fixture: ReturnType<typeof mount>;

  beforeEach(() => {
    fixture = mount();
  });

  it('renders role=group labelled by its label input', () => {
    const group = fixture.nativeElement.querySelector('cngx-optgroup') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Warm');
  });

  it('renders a header carrying the label text', () => {
    const header = fixture.nativeElement.querySelector('.cngx-select__group-header') as HTMLElement;
    expect(header.textContent?.trim()).toBe('Warm');
  });

  it('follows a changed label on both the aria-label and the header', () => {
    fixture.componentInstance.label.set('Cold');
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('cngx-optgroup') as HTMLElement;
    const header = fixture.nativeElement.querySelector('.cngx-select__group-header') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Cold');
    expect(header.textContent?.trim()).toBe('Cold');
  });

  it('reports its projected option children in DOM order', () => {
    const groupAtom = fixture.debugElement
      .query(By.directive(CngxSelectOptgroup))
      .injector.get(CngxOptionGroup);
    expect(groupAtom.options().map((option) => option.value())).toEqual(['red', 'amber']);
  });
});
