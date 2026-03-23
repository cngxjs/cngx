import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Speak',
  description: 'Headless text-to-speech directive using the browser SpeechSynthesis API. For dyslexia support, reading assistance, and convenience.',
  setup: `
  protected email = signal('');
  protected emailError = computed(() => {
    const v = this.email();
    if (!v) return '';
    if (!v.includes('@')) return 'Missing @ symbol';
    if (!v.includes('.')) return 'Missing domain (e.g. .com)';
    return '';
  });
  `,
  sections: [
    {
      title: 'CngxSpeak — Headless Read-aloud',
      subtitle:
        '<code>[cngxSpeak]</code> is headless — no DOM, no CSS, no button. ' +
        'It exposes <code>speaking()</code>, <code>supported()</code>, ' +
        '<code>toggle()</code>, <code>speak()</code>, and <code>cancel()</code>. ' +
        'The consumer renders their own button. For a ready-made button, see ' +
        '<code>CngxSpeakButton</code> in the <code>@cngx/ui</code> section.',
      imports: ['CngxSpeak'],
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
          border: 1px solid var(--cngx-border, #ddd);
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
    },
    {
      title: 'Form Error — Read-aloud on Demand',
      subtitle:
        'Pair <code>[cngxSpeak]</code> with a custom button to let users hear ' +
        'validation errors. The button only appears when there is an error.',
      imports: ['CngxSpeak'],
      template: `
  <div style="display: flex; flex-direction: column; gap: 6px; max-width: 360px;">
    <label style="font-size: 0.875rem; font-weight: 500;">Email address</label>
    <input
      type="text"
      placeholder="user@example.com"
      [value]="email()"
      (input)="email.set($any($event.target).value)"
      [style.borderColor]="emailError() ? '#e53e3e' : 'var(--cngx-border, #ddd)'"
      style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--cngx-border, #ddd); font-size: 0.875rem;"
    />
    <div style="min-height: 1.25rem; font-size: 0.8125rem; display: flex; align-items: center; gap: 6px;"
         [style.color]="emailError() ? '#e53e3e' : 'transparent'">
      <span [cngxSpeak]="emailError()" #ttsErr="cngxSpeak">{{ emailError() }}</span>
      @if (emailError()) {
        <button
          class="sort-btn"
          style="padding: 2px 8px; font-size: 0.75rem;"
          (click)="ttsErr.toggle()"
        >
          {{ ttsErr.speaking() ? 'stop' : 'hear error' }}
        </button>
      }
    </div>
  </div>

  <p style="margin-top: 12px; font-size: 0.75rem; color: var(--cngx-text-secondary, #999);">
    For screen reader a11y, use <code>[cngxLiveRegion]</code> on the error element
    (see LiveRegion demo). CngxSpeak is a cognitive UX feature, not an a11y tool.
  </p>`,
    },
  ],
};
