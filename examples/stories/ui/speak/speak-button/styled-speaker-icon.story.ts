import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSpeakButton — Styled Speaker Icon',
  subtitle: '<code>&lt;cngx-speak-button&gt;</code> connects to a <code>CngxSpeak</code> directive via <code>[speakRef]</code>. It renders a speaker icon with wave animation while speaking. Fully themeable via <code>--cngx-speak-btn-*</code> CSS custom properties.',
  description: 'Ready-made speaker button component that connects to a CngxSpeak directive. Fully themeable via CSS custom properties.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSpeakButton',
    'CngxSpeak',
  ],
  imports: ['CngxSpeak', 'CngxSpeakButton'],
  setup: `protected rate = signal(1);
  protected pitch = signal(1);`,
  template: `  <div style="display: flex; flex-direction: column; gap: 16px; max-width: 480px;">
    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div
        [cngxSpeak]="'CNGX is the missing composition layer between Angular CDK and Angular Material. It makes both declarative and Signal-first without replacing them.'"
        [rate]="rate()"
        [pitch]="pitch()"
        #tts1="cngxSpeak"
        style="
          padding: 16px 20px;
          border-radius: 8px;
          background: var(--cngx-surface-alt, #f8f9fa);
          border: 1px solid var(--cngx-color-border, #ddd);
          line-height: 1.6;
          font-size: 0.875rem;
          flex: 1;
        "
      >
        CNGX is the missing composition layer between Angular CDK and Angular
        Material. It makes both declarative and Signal-first without replacing them.
      </div>
      <cngx-speak-button [speakRef]="tts1" />
    </div>

    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div
        [cngxSpeak]="'Free shipping on orders over 50 dollars. Returns accepted within 30 days. Standard delivery takes 3 to 5 business days.'"
        [rate]="rate()"
        [pitch]="pitch()"
        #tts2="cngxSpeak"
        style="
          padding: 16px 20px;
          border-radius: 8px;
          border-left: 4px solid var(--cngx-accent, #f5a623);
          background: var(--cngx-surface-alt, #f8f9fa);
          line-height: 1.6;
          font-size: 0.875rem;
          flex: 1;
        "
      >
        <strong style="display: block; margin-bottom: 4px;">Shipping Info</strong>
        Free shipping on orders over $50. Returns accepted within 30 days.
        Standard delivery takes 3–5 business days.
      </div>
      <cngx-speak-button [speakRef]="tts2" />
    </div>
  </div>

  <div style="margin-top: 16px; display: flex; gap: 16px; align-items: center; font-size: 0.8125rem;">
    <label style="display: flex; align-items: center; gap: 6px;">
      Rate
      <input type="range" min="0.5" max="2" step="0.1" [value]="rate()" (input)="rate.set(+$any($event.target).value)" style="width: 100px;" />
      {{ rate() }}x
    </label>
    <label style="display: flex; align-items: center; gap: 6px;">
      Pitch
      <input type="range" min="0" max="2" step="0.1" [value]="pitch()" (input)="pitch.set(+$any($event.target).value)" style="width: 100px;" />
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
