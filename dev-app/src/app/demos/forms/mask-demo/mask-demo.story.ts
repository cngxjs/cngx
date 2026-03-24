import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Input Mask',
  navLabel: 'Mask',
  navCategory: 'input',
  description:
    'Pattern-based input masking with locale-aware presets, multi-pattern support, custom tokens, and Reactive Forms integration.',
  apiComponents: ['CngxInputMask'],
  overview:
    '<p><code>CngxInputMask</code> intercepts keyboard input to enforce a pattern. ' +
    'Supports built-in presets (<code>phone</code>, <code>date</code>, <code>creditcard</code>, <code>iban</code>, etc.), ' +
    'locale-aware formatting, multiple patterns via <code>|</code>, prefix/suffix, custom tokens, and character transforms.</p>' +
    '<p>Implements <code>ControlValueAccessor</code> — works with Reactive Forms (<code>[formControl]</code>) out of the box. ' +
    'The form control receives the <strong>raw value</strong> (no literals).</p>',
  moduleImports: [
    "import { CngxInputMask } from '@cngx/forms/input';",
  ],
  setup: `
  protected readonly maskPhoneRaw = signal('');
  protected readonly maskDateRaw = signal('');
  protected readonly maskCardRaw = signal('');
  protected readonly maskCustomRaw = signal('');
  `,
  sections: [
    {
      title: 'Locale Presets',
      subtitle:
        'Pass a preset name like <code>phone</code>, <code>date</code>, or <code>creditcard</code>. ' +
        'Region suffix optional: <code>phone:CH</code>, <code>iban:DE</code>.',
      imports: ['CngxInputMask'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Phone (US)</label>
      <input cngxInputMask="phone:US" #phoneMask="cngxInputMask"
        (valueChange)="maskPhoneRaw.set($event)" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">Raw: {{ phoneMask.rawValue() }}</span>
        <span class="status-badge">Complete: {{ phoneMask.isComplete() }}</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">Date</label>
      <input cngxInputMask="date" #dateMask="cngxInputMask" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">Raw: {{ dateMask.rawValue() }}</span>
        <span class="status-badge">Pattern: {{ dateMask.currentPattern() }}</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">Credit Card</label>
      <input cngxInputMask="creditcard" #cardMask="cngxInputMask" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">Raw: {{ cardMask.rawValue() }}</span>
        <span class="status-badge">Complete: {{ cardMask.isComplete() }}</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">Time (24h)</label>
      <input cngxInputMask="time" #timeMask="cngxInputMask" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">{{ timeMask.maskedValue() }}</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">IP Address</label>
      <input cngxInputMask="ip" #ipMask="cngxInputMask" class="demo-input" />
    </div>
  </div>`,
    },
    {
      title: 'Custom Pattern',
      subtitle:
        'Define a mask with tokens: <code>0</code> (digit), <code>A</code> (letter), <code>*</code> (alphanumeric), ' +
        '<code>9</code> (optional digit), <code>a</code> (optional letter). Escape with <code>\\\\</code>.',
      imports: ['CngxInputMask'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Swiss IBAN</label>
      <input cngxInputMask="AA00 0000 0000 0000 0000 0" #ibanMask="cngxInputMask" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">Raw: {{ ibanMask.rawValue() }}</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">License Plate (with prefix)</label>
      <input cngxInputMask="AA 000 000" prefix="CH-" #plateMask="cngxInputMask" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">Display: {{ plateMask.maskedValue() }}</span>
        <span class="status-badge">Raw: {{ plateMask.rawValue() }}</span>
      </div>
    </div>
  </div>`,
    },
    {
      title: 'Custom Tokens and Transform',
      subtitle:
        'Define custom token characters via <code>[customTokens]</code>. ' +
        'Use <code>[transform]</code> for global character transforms.',
      imports: ['CngxInputMask'],
      setup: `
  protected readonly hexTokens = { H: { pattern: /[0-9a-fA-F]/, transform: (c: string) => c.toUpperCase() } };
  protected readonly upper = (c: string) => c.toUpperCase();
  `,
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Hex Color (#HHHHHH)</label>
      <input [cngxInputMask]="'\\\\#HHHHHH'" [customTokens]="hexTokens"
        #hexMask="cngxInputMask" class="demo-input" />
      <div class="status-row">
        <span class="status-badge"
          [style.background-color]="hexMask.isComplete() ? hexMask.maskedValue() : 'transparent'"
          [style.color]="hexMask.isComplete() ? '#fff' : 'inherit'"
          [style.padding]="'2px 8px'"
        >{{ hexMask.maskedValue() }}</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">Uppercase Letters Only</label>
      <input cngxInputMask="AAAA-AAAA" [transform]="upper" #upMask="cngxInputMask" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">{{ upMask.rawValue() }}</span>
      </div>
    </div>
  </div>`,
    },
  ],
};
