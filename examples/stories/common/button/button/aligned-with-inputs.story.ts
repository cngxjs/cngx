import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Aligned with inputs',
  subtitle: 'An <code>md</code> button and a <code>cngxInput</code> share top and bottom edge in every density.',
  description: 'The <code>md</code> button uses the form-control row: the control line box plus <code>--cngx-space-sm</code> padding and a 1px border on both block sides. It therefore lines up with an input and a select trigger in a toolbar without a wrapper, at comfortable, compact and spacious density and on a coarse pointer. Switch the density to check the edges.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['integration', 'visual-variants'],
  apiComponents: ['CngxButton', 'CngxInput'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: ['CngxButton', 'CngxInput'],
  setup: `
  protected readonly density = signal<'comfortable' | 'compact' | 'spacious'>('comfortable');`,
  template: `
  <div [attr.data-density]="density()" style="display:flex; flex-wrap:wrap; align-items:flex-start; gap:8px">
    <input cngxInput aria-label="Search projects" placeholder="Search projects" />
    <button cngxButton tone="primary">Search</button>
    <button cngxButton="outline">Reset</button>
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px" role="group" aria-label="Density">
    <button type="button" (click)="density.set('compact')" [attr.aria-pressed]="density() === 'compact'">Compact</button>
    <button type="button" (click)="density.set('comfortable')" [attr.aria-pressed]="density() === 'comfortable'">Comfortable</button>
    <button type="button" (click)="density.set('spacious')" [attr.aria-pressed]="density() === 'spacious'">Spacious</button>
  </div>`,
};
