import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCard: Interactive card with actions',
  subtitle:
    'Multiple independent actions live inside <code>[cngxCardActions]</code>. The card itself stays <code>role="article"</code>; the buttons own the interaction, so neither swallows the other\'s clicks.',
  description:
    'The opposite of an "as button" card: the card is a container, and individual action buttons inside <code>[cngxCardActions]</code> carry the verbs. The actions slot handles alignment via <code>align="end"</code>, leaving the consumer to focus on the buttons themselves.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardBody',
    'CngxCardActions',
  ],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody, CngxCardActions } from '@cngx/common/card';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardBody',
    'CngxCardActions',
  ],
  template: `  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader><h3 cngxCardTitle>Release plan</h3></header>
      <div cngxCardBody>
        <p style="margin:0">Next review: 18.07.2025</p>
      </div>
      <div cngxCardActions align="end">
        <button type="button" class="chip">Edit</button>
        <button type="button" class="chip">Delete</button>
      </div>
    </cngx-card>
  </div>`,
};
