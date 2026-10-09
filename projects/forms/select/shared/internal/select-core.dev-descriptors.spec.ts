import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { resolveDevDescriptors } from '@cngx/core/utils';

import { CngxMultiSelect } from '../../multi-select/multi-select.component';
import type { CngxSelectOptionDef } from '../option.model';

@Component({
  template: `<cngx-multi-select [label]="'Colour'" [options]="options" [(values)]="values" />`,
  imports: [CngxMultiSelect],
})
class Host {
  readonly options: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
  ];
  readonly values = signal<string[]>([]);
}

describe('createSelectCore - dev descriptors on a mounted composite', () => {
  it('resolves the select core and its nested selection controller', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect)).componentInstance;

    const found = resolveDevDescriptors(multi).map((entry) => ({
      path: entry.path,
      factory: entry.descriptor.kind === 'cngx-dev:factory' ? entry.descriptor.factory : null,
    }));

    expect(found).toContainEqual({ path: ['core'], factory: 'createSelectCore' });
    expect(found).toContainEqual({
      path: ['core', 'selection'],
      factory: 'createSelectionController',
    });
  });
});
