import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card with Speak Badge',
  subtitle: 'A <code>cngx-speak-button</code> positioned as a badge reads the card content aloud. The <code>[cngxSpeak]</code> directive on the card body provides the text; the button connects via <code>[speakRef]</code>.',
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
    'import { CngxSpeak } from \'@cngx/common/interactive\';',
    'import { CngxSpeakButton } from \'@cngx/ui\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxCardBadge', 'CngxSpeak', 'CngxSpeakButton'],
  template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;max-width:760px">
    <cngx-card style="overflow:visible">
      <cngx-speak-button cngxCardBadge position="top-end" [speakRef]="tts1"
                          class="speak-btn-round" />
      <header cngxCardHeader>
        <h3 cngxCardTitle>Project Summary</h3>
        <span cngxCardSubtitle>Q1 2026</span>
      </header>
      <div cngxCardBody
           [cngxSpeak]="'Project Summary, Q1 2026. 12 features shipped. 3 bugs resolved. 98 percent uptime. Next milestone: public beta in April.'"
           [enabled]="false"
           #tts1="cngxSpeak">
        <p style="margin:0 0 4px;color:var(--cngx-color-text-muted);font-size:0.875rem">
          12 features shipped
        </p>
        <p style="margin:0 0 4px;color:var(--cngx-color-text-muted);font-size:0.875rem">
          3 bugs resolved
        </p>
        <p style="margin:0;color:var(--cngx-color-text-muted);font-size:0.875rem">
          98% uptime &mdash; next: public beta
        </p>
      </div>
    </cngx-card>

    <cngx-card style="overflow:visible">
      <cngx-speak-button cngxCardBadge position="top-end" [speakRef]="tts2"
                          class="speak-btn-round" />
      <header cngxCardHeader>
        <h3 cngxCardTitle>Team Updates</h3>
        <span cngxCardSubtitle>Latest activity</span>
      </header>
      <div cngxCardBody
           [cngxSpeak]="'Team Updates. Anna completed the dashboard redesign. Ben merged the API refactor. Clara started the accessibility audit.'"
           [enabled]="false"
           #tts2="cngxSpeak">
        <p style="margin:0 0 4px;color:var(--cngx-color-text-muted);font-size:0.875rem">
          Anna: Dashboard redesign done
        </p>
        <p style="margin:0 0 4px;color:var(--cngx-color-text-muted);font-size:0.875rem">
          Ben: API refactor merged
        </p>
        <p style="margin:0;color:var(--cngx-color-text-muted);font-size:0.875rem">
          Clara: A11y audit started
        </p>
      </div>
    </cngx-card>
  </div>`,
};
