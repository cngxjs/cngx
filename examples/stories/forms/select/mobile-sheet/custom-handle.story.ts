import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: custom sheet handle',
  subtitle:
    '<code>*cngxSelectSheetHandle</code> replaces the drag handle at the top of the sheet. The context carries the presentation and whether a swipe is in progress.',
  description:
    'The handle is decorative: it renders inside an <code>aria-hidden</code> wrapper, because a screen-reader swipe is consumed by navigation. Close the sheet with X or Done instead. Swipe the header down to see <code>dragging</code> flip. An app-wide default goes through <code>CNGX_SELECT_CONFIG.templates.sheetHandle</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxMultiSelect', 'CngxSelectSheetHandle'],
  moduleImports: [
    "import { CngxMultiSelect, CngxSelectSheetHandle, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxMultiSelect', 'CngxSelectSheetHandle'],
  setup: `protected readonly toppings: CngxSelectOptionDef<string>[] = [
    { value: 'basil', label: 'Basil' },
    { value: 'olives', label: 'Olives' },
    { value: 'mushrooms', label: 'Mushrooms' },
    { value: 'peppers', label: 'Peppers' },
  ];`,
  template: `<div style="max-inline-size: 24rem">
    <cngx-multi-select label="Toppings" [options]="toppings" presentation="sheet">
      <ng-template cngxSelectSheetHandle let-dragging="dragging">
        <span
          style="display: block; margin: 0 auto 12px; inline-size: 56px; block-size: 6px; border-radius: 3px"
          [style.background]="dragging ? 'currentColor' : 'color-mix(in oklch, currentColor 30%, transparent)'"
        ></span>
      </ng-template>
    </cngx-multi-select>
  </div>`,
};
