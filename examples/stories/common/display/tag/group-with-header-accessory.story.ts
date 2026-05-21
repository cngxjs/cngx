import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTagGroup: header and accessory slots',
  subtitle: 'Project <code>&lt;ng-template cngxTagGroupHeader&gt;</code> above the tag row and <code>&lt;ng-template cngxTagGroupAccessory&gt;</code> below it. Both slot contexts expose the reactive <code>count</code> of projected <code>cngxTag</code> children.',
  description: 'A "Filters ({{ count }})" header and a working "Clear all" accessory share the same reactive count source. The accessory click clears the underlying filter signal so the count and the visible tags drop in lockstep.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxTagGroup', 'CngxTagGroupHeader', 'CngxTagGroupAccessory', 'CngxTag'],
  moduleImports: [
    "import { CngxTag, CngxTagGroup, CngxTagGroupHeader, CngxTagGroupAccessory } from '@cngx/common/display';",
    "import { signal } from '@angular/core';",
  ],
  imports: ['CngxTag', 'CngxTagGroup', 'CngxTagGroupHeader', 'CngxTagGroupAccessory'],
  references: [
    {
      label: 'WAI-ARIA APG: list pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/list/',
    },
  ],
  setup: `protected readonly filters = signal<readonly { label: string; color: 'info' | 'success' | 'warning' | 'error' }[]>([
  { label: 'Frontend', color: 'info' },
  { label: 'Backend', color: 'info' },
  { label: 'Cleared', color: 'success' },
  { label: 'Pending', color: 'warning' },
  { label: 'Failed', color: 'error' },
]);
protected readonly clearAll = () => this.filters.set([]);`,
  template: `
  <cngx-tag-group [semanticList]="true" label="Active filters">
    <ng-template cngxTagGroupHeader let-count="count">
      <strong>Filters ({{ count }})</strong>
    </ng-template>
    @for (f of filters(); track f.label) {
      <span cngxTag [color]="f.color">{{ f.label }}</span>
    }
    <ng-template cngxTagGroupAccessory let-count="count">
      <button type="button" (click)="clearAll()" [disabled]="count === 0">Clear all ({{ count }})</button>
    </ng-template>
  </cngx-tag-group>`,
};
