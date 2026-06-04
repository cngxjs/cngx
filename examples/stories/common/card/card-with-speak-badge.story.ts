import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSpeakButton: Card with speak badge',
  subtitle:
    'A <code>&lt;cngx-speak-button&gt;</code> positioned via <code>cngxCardBadge</code> reads the card content aloud. The <code>[cngxSpeak]</code> directive on the body provides the spoken text; the button binds to it through <code>[speakRef]</code>.',
  description:
    'Composes three primitives into a usable pattern: the card supplies structure, <code>cngxCardBadge</code> places a trigger at the corner, and the speak / speak-button pair handles the Web Speech API wiring. The spoken text is a normalised summary that is more useful to a screen reader than the body markup alone.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxSpeakButton', 'CngxSpeak'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody, CngxCardBadge } from '@cngx/common/card';",
    "import { CngxSpeak } from '@cngx/common/interactive';",
    "import { CngxSpeakButton } from '@cngx/ui';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardBadge',
    'CngxSpeak',
    'CngxSpeakButton',
  ],
  references: [
    {
      label: 'Web Speech API: SpeechSynthesis',
      href: 'https://www.w3.org/TR/speech-synthesis11/',
    },
    {
      label: 'WCAG 2.1 SC 1.4.5 Images of Text',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/images-of-text.html',
    },
  ],
  template: `  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;max-width:760px">
    <cngx-card style="overflow:visible">
      <cngx-speak-button cngxCardBadge position="top-end" [speakRef]="tts1" />
      <header cngxCardHeader>
        <h3 cngxCardTitle>Project summary</h3>
        <span cngxCardSubtitle>Q1 2026</span>
      </header>
      <div cngxCardBody
           [cngxSpeak]="'Project summary, Q1 2026. 12 features shipped. 3 bugs resolved. 98 percent uptime. Next milestone: public beta in April.'"
           [enabled]="false"
           #tts1="cngxSpeak">
        <p style="margin:0 0 4px">12 features shipped</p>
        <p style="margin:0 0 4px">3 bugs resolved</p>
        <p style="margin:0">98% uptime, next: public beta</p>
      </div>
    </cngx-card>

    <cngx-card style="overflow:visible">
      <cngx-speak-button cngxCardBadge position="top-end" [speakRef]="tts2" />
      <header cngxCardHeader>
        <h3 cngxCardTitle>Team updates</h3>
        <span cngxCardSubtitle>Latest activity</span>
      </header>
      <div cngxCardBody
           [cngxSpeak]="'Team updates. Anna completed the dashboard redesign. Ben merged the API refactor. Clara started the accessibility audit.'"
           [enabled]="false"
           #tts2="cngxSpeak">
        <p style="margin:0 0 4px">Anna: Dashboard redesign done</p>
        <p style="margin:0 0 4px">Ben: API refactor merged</p>
        <p style="margin:0">Clara: A11y audit started</p>
      </div>
    </cngx-card>
  </div>`,
};
