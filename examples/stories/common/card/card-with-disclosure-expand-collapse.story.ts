import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card with Disclosure (Expand/Collapse)',
  subtitle: 'Card header as disclosure trigger — click to expand/collapse the body content. Uses <code>cngxDisclosure</code> from interactive.',
  description: 'Semantic card component with three archetypes: display (article), action (button), and link. Supports selection, loading, disabled with reason, and SR live announcements.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardMedia',
    'CngxCardFooter',
    'CngxCardActions',
    'CngxCardBadge',
    'CngxCardAccent',
    'CngxCardSkeleton',
  ],
  moduleImports: [
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody } from \'@cngx/common/card\';',
    'import { CngxDisclosure } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxDisclosure'],
  template: `
  <div style="max-width:400px;display:flex;flex-direction:column;gap:12px">
    <cngx-card>
      <header cngxCardHeader cngxDisclosure #d1="cngxDisclosure" [controls]="'detail-1'"
              style="cursor:pointer;user-select:none">
        <h3 cngxCardTitle>Issue #1042: Anxiety Management</h3>
        <span cngxCardSubtitle>Status: Active | {{ d1.opened() ? 'Expanded' : 'Collapsed' }}</span>
      </header>
      @if (d1.opened()) {
        <div cngxCardBody id="detail-1">
          <p style="margin:0;color:var(--cngx-color-text-muted);font-size:0.875rem">
            Patient has learned preventive measures and applies them independently.
            Evaluation: 17.10.2025. Uses aids correctly. Next evaluation: 27.03.2026.
          </p>
        </div>
      }
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader cngxDisclosure #d2="cngxDisclosure" [controls]="'detail-2'"
              style="cursor:pointer;user-select:none">
        <h3 cngxCardTitle>Issue #3004: Cognitive Adjustment</h3>
        <span cngxCardSubtitle>Status: Active | {{ d2.opened() ? 'Expanded' : 'Collapsed' }}</span>
      </header>
      @if (d2.opened()) {
        <div cngxCardBody id="detail-2">
          <p style="margin:0;color:var(--cngx-color-text-muted);font-size:0.875rem">
            Hazard sources in the environment have been reduced.
            Can organize daily routine independently.
          </p>
        </div>
      }
    </cngx-card>
  </div>`,
};
