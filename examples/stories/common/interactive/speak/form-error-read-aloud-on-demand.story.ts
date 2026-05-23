import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSpeak: Form error read-aloud on demand',
  subtitle:
    'Pair <code>[cngxSpeak]</code> with a custom button so users can opt into hearing a validation error. The button only renders while an error is present and toggles the speech state.',
  description:
    'Wires CngxSpeak into a form-error row with a consumer-owned "hear error" button. The directive itself is headless: no DOM, no styling. [enabled]="false" suppresses the default auto-speak so the directive only fires when the button calls toggle(). The input lands pre-filled with an invalid value so the error row + button render immediately; clearing the field collapses both. CngxSpeak targets cognitive UX (dyslexia, reading load), not screen-reader announcements - use CngxLiveRegion for that.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxSpeak'],
  imports: ['CngxSpeak'],
  setup: `protected email = signal('not-an-email');
  protected emailError = computed(() => {
    const v = this.email();
    if (!v) {
      return '';
    }
    if (!v.includes('@')) {
      return 'Missing @ symbol';
    }
    if (!v.includes('.')) {
      return 'Missing domain (e.g. .com)';
    }
    return '';
  });`,
  template: `
  <div style="display: flex; flex-direction: column; gap: 6px; max-width: 360px;">
    <label class="demo-speak-label" for="speak-email">Email address</label>
    <input
      id="speak-email"
      type="email"
      class="demo-speak-input"
      [class.demo-speak-input--invalid]="!!emailError()"
      placeholder="user@example.com"
      [value]="email()"
      (input)="email.set($any($event.target).value)"
    />
    <div
      class="demo-speak-error-row"
      [class.demo-speak-error-row--shown]="!!emailError()"
      style="display: flex; align-items: center; gap: 6px; min-height: 1.25rem;"
    >
      <span [cngxSpeak]="emailError()" [enabled]="false" #ttsErr="cngxSpeak">{{ emailError() }}</span>
      @if (emailError()) {
        <button
          type="button"
          class="sort-btn demo-speak-hear-btn"
          [class.demo-speak-hear-btn--active]="ttsErr.speaking()"
          [attr.aria-pressed]="ttsErr.speaking()"
          (click)="ttsErr.toggle()"
        >
          {{ ttsErr.speaking() ? 'stop' : 'hear error' }}
        </button>
      }
      @if (ttsErr.speaking()) {
        <span class="demo-speak-reading-pulse" aria-hidden="true">Reading...</span>
      }
    </div>
  </div>

  <p class="demo-speak-note" style="margin-top: 12px;">
    For screen-reader a11y, use <code>[cngxLiveRegion]</code> on the error element
    (see LiveRegion demo). CngxSpeak is a cognitive UX feature, not an assistive-tech tool.
  </p>`,
};
