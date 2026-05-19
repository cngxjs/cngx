import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Locale Presets',
  subtitle: 'Pass a preset name like <code>phone</code>, <code>date</code>, or <code>creditcard</code>. Region suffix optional: <code>phone:CH</code>, <code>iban:DE</code>.',
  description: 'Pattern-based input masking with locale-aware presets, multi-pattern support, custom tokens, and Reactive Forms integration.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxInputMask',
  ],
  moduleImports: [
    'import { CngxInputMask } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxInputMask'],
  setup: `protected readonly maskPhoneRaw = signal('');`,
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Phone (US)</label>
      <input cngxInputMask="phone:US" #phoneMask="cngxInputMask"
        (valueChange)="maskPhoneRaw.set($event)" class="demo-input" />
      
    </div>
    <div class="demo-field">
      <label class="demo-label">Date</label>
      <input cngxInputMask="date" #dateMask="cngxInputMask" class="demo-input" />
      
    </div>
    <div class="demo-field">
      <label class="demo-label">Credit Card</label>
      <input cngxInputMask="creditcard" #cardMask="cngxInputMask" class="demo-input" />
      
    </div>
    <div class="demo-field">
      <label class="demo-label">Time (24h)</label>
      <input cngxInputMask="time" #timeMask="cngxInputMask" class="demo-input" />
      
    </div>
    <div class="demo-field">
      <label class="demo-label">IP Address</label>
      <input cngxInputMask="ip" #ipMask="cngxInputMask" class="demo-input" />
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Raw: {{ phoneMask.rawValue() }}</span>
        <span class="status-badge">Complete: {{ phoneMask.isComplete() }}</span>
      </div>
<div class="status-row">
        <span class="status-badge">Raw: {{ dateMask.rawValue() }}</span>
        <span class="status-badge">Pattern: {{ dateMask.currentPattern() }}</span>
      </div>
<div class="status-row">
        <span class="status-badge">Raw: {{ cardMask.rawValue() }}</span>
        <span class="status-badge">Complete: {{ cardMask.isComplete() }}</span>
      </div>
<div class="status-row">
        <span class="status-badge">{{ timeMask.maskedValue() }}</span>
      </div>`,
};
