import { type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxActionMultiSelect } from '../../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../../action-select/action-select.component';
import { CngxCombobox } from '../../combobox/combobox.component';
import { CngxMultiSelect } from '../../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../../select-shell/select-shell.component';
import { CngxSelect } from '../../single-select/select.component';
import { CngxTreeSelect } from '../../tree-select/tree-select.component';
import { CngxTypeahead } from '../../typeahead/typeahead.component';
import { CngxSelectAnnouncer } from '../announcer';
import { CngxScopedSelectAnnouncer } from './scoped-announcer';

const VARIANTS: readonly [string, Type<unknown>][] = [
  ['CngxSelect', CngxSelect],
  ['CngxMultiSelect', CngxMultiSelect],
  ['CngxCombobox', CngxCombobox],
  ['CngxTypeahead', CngxTypeahead],
  ['CngxTreeSelect', CngxTreeSelect],
  ['CngxReorderableMultiSelect', CngxReorderableMultiSelect],
  ['CngxActionSelect', CngxActionSelect],
  ['CngxActionMultiSelect', CngxActionMultiSelect],
  ['CngxSelectShell', CngxSelectShell],
];

describe('CngxScopedSelectAnnouncer mounted per variant', () => {
  it.each(VARIANTS)('%s constructs with the scoped announcer and announces once', (_, type) => {
    const fixture = TestBed.createComponent(type);
    if (type === CngxTreeSelect) {
      fixture.componentRef.setInput('nodeIdFn', (v: unknown) => String(v));
    }
    fixture.detectChanges();

    const scoped = fixture.debugElement.injector.get(CngxSelectAnnouncer);
    expect(scoped).toBeInstanceOf(CngxScopedSelectAnnouncer);

    const root = vi
      .spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce')
      .mockImplementation(() => {});
    scoped.announce('Red selected', 'polite');
    expect(root).toHaveBeenCalledExactlyOnceWith('Red selected', 'polite');
  });
});
