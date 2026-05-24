import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSpeakButton: styled speaker icon',
  subtitle: '<code>&lt;cngx-speak-button&gt;</code> connects to a <code>CngxSpeak</code> directive via <code>[speakRef]</code>. It renders a speaker icon with wave animation while speaking. Fully themeable via <code>--cngx-speak-btn-*</code> CSS custom properties.',
  description: 'Two reading cards wired to a shared rate/pitch control: demonstrates linking <code>cngx-speak-button</code> to <code>CngxSpeak</code> directives via <code>[speakRef]</code>, plus the live rate/pitch signals feeding both speak instances.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'Web Speech API - SpeechSynthesis', href: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis' },
  ],
  apiComponents: [
    'CngxSpeakButton',
    'CngxSpeak',
  ],
  imports: ['CngxSpeak', 'CngxSpeakButton'],
  setup: `protected rate = signal(1);
  protected pitch = signal(1);`,
  template: `  <div class="demo-speak-stack">
    <div class="demo-speak-row">
      <div
        [cngxSpeak]="'CNGX is the missing composition layer between Angular CDK and Angular Material. It makes both declarative and Signal-first without replacing them.'"
        [rate]="rate()"
        [pitch]="pitch()"
        #tts1="cngxSpeak"
        class="demo-speak-card"
      >
        CNGX is the missing composition layer between Angular CDK and Angular
        Material. It makes both declarative and Signal-first without replacing them.
      </div>
      <cngx-speak-button [speakRef]="tts1" />
    </div>

    <div class="demo-speak-row">
      <div
        [cngxSpeak]="'Free shipping on orders over 50 dollars. Returns accepted within 30 days. Standard delivery takes 3 to 5 business days.'"
        [rate]="rate()"
        [pitch]="pitch()"
        #tts2="cngxSpeak"
        class="demo-speak-card demo-speak-card--accent"
      >
        <strong class="demo-speak-strong">Shipping Info</strong>
        Free shipping on orders over $50. Returns accepted within 30 days.
        Standard delivery takes 3 to 5 business days.
      </div>
      <cngx-speak-button [speakRef]="tts2" />
    </div>
  </div>

  <div class="demo-speak-control-row">
    <label>
      Rate
      <input type="range" min="0.5" max="2" step="0.1" [value]="rate()" (input)="rate.set(+$any($event.target).value)" />
      {{ rate() }}x
    </label>
    <label>
      Pitch
      <input type="range" min="0" max="2" step="0.1" [value]="pitch()" (input)="pitch.set(+$any($event.target).value)" />
      {{ pitch() }}
    </label>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">TTS supported</span>
      <span class="event-value">{{ tts1.supported }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Speaking</span>
      <span class="event-value">{{ tts1.speaking() || tts2.speaking() }}</span>
    </div>
  </div>`,
};
