import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSpeak — Headless Read-aloud',
  subtitle: '<code>[cngxSpeak]</code> is headless — no DOM, no CSS, no button. It exposes <code>speaking()</code>, <code>supported()</code>, <code>toggle()</code>, <code>speak()</code>, and <code>cancel()</code>. The consumer renders their own button. For a ready-made button, see <code>CngxSpeakButton</code> in the <code>@cngx/ui</code> section.',
  description: 'Headless text-to-speech directive using the browser SpeechSynthesis API. For dyslexia support, reading assistance, and convenience.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSpeak',
  ],
  imports: ['CngxSpeak'],
  setup: `protected email = signal('');`,
  template: `
  <div style="display: flex; flex-direction: column; gap: 16px; max-width: 480px;">
    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div
        [cngxSpeak]="'Welcome to the CNGX component library. This is a headless, typed, production-grade set of Angular directives built for serious applications.'"
        #tts1="cngxSpeak"
        style="
          padding: 16px 20px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--cngx-surface-alt, #f8f9fa), var(--cngx-surface, #fff));
          border: 1px solid var(--cngx-color-border, #ddd);
          line-height: 1.6;
          font-size: 0.875rem;
          flex: 1;
        "
      >
        Welcome to the CNGX component library. This is a headless, typed,
        production-grade set of Angular directives built for serious applications.
      </div>
      <button
        class="sort-btn"
        (click)="tts1.toggle()"
        [style.background]="tts1.speaking() ? 'var(--cngx-accent, #f5a623)' : ''"
        [style.color]="tts1.speaking() ? '#000' : ''"
      >
        {{ tts1.speaking() ? 'Stop' : 'Listen' }}
      </button>
    </div>

    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div
        [cngxSpeak]="'Your order has been shipped and is expected to arrive within 3 to 5 business days. Track your package using the link in your confirmation email.'"
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
        <strong style="display: block; margin-bottom: 4px;">Order Shipped</strong>
        Your order has been shipped and is expected to arrive within 3–5 business
        days. Track your package using the link in your confirmation email.
      </div>
      <button
        class="sort-btn"
        (click)="tts2.toggle()"
        [style.background]="tts2.speaking() ? 'var(--cngx-accent, #f5a623)' : ''"
        [style.color]="tts2.speaking() ? '#000' : ''"
      >
        {{ tts2.speaking() ? 'Stop' : 'Listen' }}
      </button>
    </div>
  </div>

  <div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">TTS supported</span>
      <span class="event-value">{{ tts1.supported }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Any speaking</span>
      <span class="event-value">{{ tts1.speaking() || tts2.speaking() }}</span>
    </div>
  </div>`,
};
