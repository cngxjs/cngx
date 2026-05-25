import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCard: Disabled with reason',
  subtitle:
    'Communicates <em>why</em> via <code>aria-describedby</code>. The disabled-reason span is always in the DOM so the AT can read it the moment focus lands on the card; the visual state mirrors the same intent.',
  description:
    'Button card with <code>[disabled]="true"</code> plus a <code>disabledReason</code> string. The card renders the reason as a visually-positioned span, sets <code>aria-disabled</code>, and wires <code>aria-describedby</code> to the reason\'s id so a screen reader announces both the action and why it is unavailable. Inspect the DOM to see the persistent describedby target.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxCard'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody } from '@cngx/common/card';",
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-disabled',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-disabled',
    },
    {
      label: 'WAI-ARIA 1.2: aria-describedby',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-describedby',
    },
  ],
  template: `  <div style="max-width:400px">
    <cngx-card as="button"
               [disabled]="true"
               disabledReason="Only project leads can edit release settings"
               ariaLabel="Edit release">
      <header cngxCardHeader><h3 cngxCardTitle>Edit release</h3></header>
      <div cngxCardBody>
        <p style="margin:0">This card is disabled with a reason.</p>
      </div>
    </cngx-card>
  </div>`,
};
