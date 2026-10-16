import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: turn the mobile sheet off',
  subtitle:
    "<code>withMobileSheet('off')</code> keeps every select in its scope anchored, on phones too. A per-instance <code>[presentation]</code> still wins.",
  description:
    'The first select follows the scoped config and stays anchored on every screen. The second binds <code>presentation="sheet"</code>, so it opens as a modal sheet even on a desktop. Use <code>provideSelectConfig(withMobileSheet(\'off\'))</code> for the whole app, <code>provideSelectConfigAt</code> for one subtree.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withMobileSheet, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect'],
  viewProviders: ["provideSelectConfigAt(withMobileSheet('off'))"],
  setup: `protected readonly sizes: CngxSelectOptionDef<string>[] = [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' },
  ];`,
  template: `<div style="display: grid; gap: 16px; max-inline-size: 24rem">
    <cngx-select label="Size (always anchored)" [options]="sizes" />
    <cngx-select label="Size (always a sheet)" [options]="sizes" presentation="sheet" />
  </div>`,
};
