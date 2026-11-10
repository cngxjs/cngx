import { createMockField } from '@cngx/forms/field/testing';

import { describeMobileSheet } from '../shared/__test-helpers/mobile-sheet';
import { CngxSelect } from './select.component';

// F5: single-select runs the shared mobile-sheet contract like the other eight.
describeMobileSheet('CngxSelect', CngxSelect, 'cngx-select', {
  inputs: '[options]="options"',
  optionSelector: '[cngxOption]',
  fill: 'sheet',
  showDone: false,
  showInput: false,
  makeField: () => {
    const { accessor, ref } = createMockField<string | undefined>({ name: 'pick', value: undefined });
    return { accessor, touched: () => ref.touched() };
  },
});
