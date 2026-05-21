import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCard: Card with disclosure expand collapse',
  subtitle:
    'The card header doubles as a disclosure trigger: click to expand or collapse the body. <code>cngxDisclosure</code> paints <code>aria-expanded</code> and <code>aria-controls</code>, the body sits behind the matching id and <code>@if</code>-mounts when opened.',
  description:
    'Composes two atoms into a real disclosure pattern: the card supplies the surface and the header slot, <code>cngxDisclosure</code> on the header handles the toggle wiring + ARIA. Each card runs its own disclosure instance so the two demos toggle independently.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxDisclosure',
  ],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody } from '@cngx/common/card';",
    "import { CngxDisclosure } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxDisclosure',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
    {
      label: 'WAI-ARIA 1.2: aria-expanded',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-expanded',
    },
  ],
  template: `  <div style="max-width:400px;display:flex;flex-direction:column;gap:12px">
    <cngx-card>
      <header cngxCardHeader
              cngxDisclosure
              #d1="cngxDisclosure"
              [controls]="'cngx-card-disclosure-1'"
              style="cursor:pointer;user-select:none">
        <h3 cngxCardTitle>Issue #1042: Onboarding flow drop-off</h3>
        <span cngxCardSubtitle>Status: Open, {{ d1.opened() ? 'expanded' : 'collapsed' }}</span>
      </header>
      @if (d1.opened()) {
        <div cngxCardBody id="cngx-card-disclosure-1">
          <p style="margin:0">
            A/B test on the step-2 form simplification confirmed a 12% reduction in
            drop-off. Rollout: 17.10.2025. Telemetry stable. Next review: 27.03.2026.
          </p>
        </div>
      }
    </cngx-card>

    <cngx-card>
      <header cngxCardHeader
              cngxDisclosure
              #d2="cngxDisclosure"
              [controls]="'cngx-card-disclosure-2'"
              style="cursor:pointer;user-select:none">
        <h3 cngxCardTitle>Issue #3004: Search index latency</h3>
        <span cngxCardSubtitle>Status: Open, {{ d2.opened() ? 'expanded' : 'collapsed' }}</span>
      </header>
      @if (d2.opened()) {
        <div cngxCardBody id="cngx-card-disclosure-2">
          <p style="margin:0">
            Sharding rebalanced after the data import. p95 query latency back under 80&nbsp;ms.
            Monitoring extended for two further weeks.
          </p>
        </div>
      }
    </cngx-card>
  </div>`,
};
