import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Form Error — Read-aloud on Demand',
  subtitle: 'Pair <code>[cngxSpeak]</code> with a custom button to let users hear validation errors. The button only appears when there is an error.',
  description: 'Headless text-to-speech directive using the browser SpeechSynthesis API. For dyslexia support, reading assistance, and convenience.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSpeak',
  ],
  imports: ['CngxSpeak'],
  setup: `protected email = signal('');
  protected emailError = computed(() => {
    const v = this.email();
    if (!v) return '';
    if (!v.includes('@')) return 'Missing @ symbol';
    if (!v.includes('.')) return 'Missing domain (e.g. .com)';
    return '';
  });`,
  template: `
  <div style="display: flex; flex-direction: column; gap: 6px; max-width: 360px;">
    <label style="font-size: 0.875rem; font-weight: 500;">Email address</label>
    <input
      type="text"
      placeholder="user@example.com"
      [value]="email()"
      (input)="email.set($any($event.target).value)"
      [style.borderColor]="emailError() ? '#e53e3e' : 'var(--cngx-color-border, #ddd)'"
      style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--cngx-color-border, #ddd); font-size: 0.875rem;"
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
};
