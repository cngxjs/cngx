import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom Toggle Template',
  subtitle: 'Use <code>ng-template[cngxExpandableToggle]</code> for a fully custom toggle — icon buttons, links, or any element.',
  description: 'Molecule wrapping CngxTruncate with a built-in expand/collapse toggle and aria-expanded.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxExpandableText',
  ],
  moduleImports: [
    'import { CngxExpandableText } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxExpandableText', 'CngxExpandableToggle'],
  template: `
  <div style="max-width:400px">
    <cngx-expandable-text [lines]="2">
      The native autofocus HTML attribute only works on initial page load.
      This directive handles dynamic content: dialogs, panels, stepper steps,
      and any element that appears after the initial render. It focuses the host
      element after the next render frame using afterNextRender.
      <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
        <button type="button" (click)="toggle()"
                [attr.aria-expanded]="expanded"
                style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;
                       background:none;border:1px solid var(--cngx-color-border,#ddd);border-radius:4px;
                       padding:4px 10px;cursor:pointer;font-size:0.8125rem;
                       color:var(--interactive,#f5a623)">
          {{ expanded ? 'Collapse' : 'Expand' }}
          <span style="font-size:1rem">{{ expanded ? '▲' : '▼' }}</span>
        </button>
      </ng-template>
    </cngx-expandable-text>
  </div>`,
};
