import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSpeak: Headless read-aloud',
  subtitle:
    '<code>[cngxSpeak]</code> is headless: no DOM, no CSS, no button. It exposes <code>speaking()</code>, <code>supported</code>, <code>toggle()</code>, <code>speak()</code>, and <code>cancel()</code>. The consumer renders their own button. For a ready-made one, see <code>CngxSpeakButton</code> in <code>@cngx/ui</code>.',
  description:
    'End-to-end demo of the headless surface: two static passages, each paired with a consumer-owned play/stop button that calls toggle() and reflects the speaking() signal. While speaking() is true the demo paints a "Reading..." badge on the passage so the visible state stays in sync with audio output. Each [cngxSpeak] instance carries its own speech state, so starting the second passage interrupts the first. Use CngxSpeak as a cognitive UX helper (dyslexia, reading load); for screen-reader announcements use CngxLiveRegion.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxSpeak'],
  imports: ['CngxSpeak'],
  setup: ``,
  template: `<div style="display: flex; flex-direction: column; gap: 16px; max-width: 480px;">
    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div
        class="demo-speak-passage"
        [class.demo-speak-passage--speaking]="tts1.speaking()"
        [cngxSpeak]="'Welcome to the CNGX component library. This is a headless, typed, production-grade set of Angular directives built for serious applications.'"
        [enabled]="false"
        #tts1="cngxSpeak"
        style="flex: 1; position: relative;"
      >
        @if (tts1.speaking()) {
          <span class="demo-speak-reading-badge" aria-hidden="true">Reading...</span>
        }
        Welcome to the CNGX component library. This is a headless, typed,
        production-grade set of Angular directives built for serious applications.
      </div>
      <button
        type="button"
        class="sort-btn demo-speak-icon-btn"
        [class.demo-speak-icon-btn--active]="tts1.speaking()"
        [attr.aria-label]="tts1.speaking() ? 'Stop reading' : 'Read passage'"
        [attr.aria-pressed]="tts1.speaking()"
        (click)="tts1.toggle()"
      >
        <span aria-hidden="true">{{ tts1.speaking() ? '&#9632;' : '&#9654;' }}</span>
      </button>
    </div>

    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div
        class="demo-speak-passage demo-speak-passage--accent"
        [class.demo-speak-passage--speaking]="tts2.speaking()"
        [cngxSpeak]="'Your order has been shipped and is expected to arrive within 3 to 5 business days. Track your package using the link in your confirmation email.'"
        [enabled]="false"
        #tts2="cngxSpeak"
        style="flex: 1; position: relative;"
      >
        @if (tts2.speaking()) {
          <span class="demo-speak-reading-badge" aria-hidden="true">Reading...</span>
        }
        <strong style="display: block; margin-bottom: 4px;">Order Shipped</strong>
        Your order has been shipped and is expected to arrive within 3-5 business
        days. Track your package using the link in your confirmation email.
      </div>
      <button
        type="button"
        class="sort-btn demo-speak-icon-btn"
        [class.demo-speak-icon-btn--active]="tts2.speaking()"
        [attr.aria-label]="tts2.speaking() ? 'Stop reading' : 'Read passage'"
        [attr.aria-pressed]="tts2.speaking()"
        (click)="tts2.toggle()"
      >
        <span aria-hidden="true">{{ tts2.speaking() ? '&#9632;' : '&#9654;' }}</span>
      </button>
    </div>
  </div>`,
  templateChrome: `<p class="demo-speak-note" style="margin-top: 12px;">
    No audio? The visible "Reading..." badge confirms the directive is firing; if speaking() is true but you hear nothing the cause is OS-side - check that system audio is unmuted, the right output device is selected, and the browser has at least one voice installed for the default language (<code>speechSynthesis.getVoices()</code> in DevTools returns the list). Chrome plays speech only after a user gesture (the button click counts) and may stall briefly on the first call while the OS voice list loads. If a click does nothing at all (no badge, no audio), Chrome's speech engine has likely entered a stuck state that survives page reloads - a full quit and restart of Chrome clears it.
  </p>`,
};
