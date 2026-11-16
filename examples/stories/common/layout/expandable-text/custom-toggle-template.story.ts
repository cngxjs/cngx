import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxExpandableText: Custom toggle template',
  subtitle:
    'Use <code>ng-template[cngxExpandableToggle]</code> for a fully custom toggle - icon buttons, links, or any element.',
  description:
    'Projects a custom toggle template via ng-template[cngxExpandableToggle]. The let-context exposes expanded and toggle, so the consumer can render any markup while CngxExpandableText keeps owning the clamped/expanded model.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
  ],
  apiComponents: ['CngxExpandableText', 'CngxExpandableToggle'],
  moduleImports: [
    "import { CngxExpandableText, CngxExpandableToggle } from '@cngx/common/layout';",
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
        <button type="button" class="demo-expandable-toggle" (click)="toggle()"
                [attr.aria-expanded]="expanded"
                style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;">
          {{ expanded ? 'Collapse' : 'Expand' }}
          <span class="demo-expandable-toggle__glyph">{{ expanded ? '▲' : '▼' }}</span>
        </button>
      </ng-template>
    </cngx-expandable-text>
  </div>`,
  css: `.demo-expandable-toggle {
  border: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #d0d5dd));
  border-radius: var(--cngx-radius-sm, 4px);
  background: none;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--cngx-color-primary, var(--cngx-ex-focus, #2563eb));
}

.demo-expandable-toggle__glyph {
  font-size: 1rem;
}`,
};
