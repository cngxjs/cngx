import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTrim: normalize on blur',
  subtitle:
    '<code>CngxTrim</code> trims the ends, NFC-normalizes Unicode, and (with <code>cngxTrimCollapse</code>) collapses internal whitespace runs on <code>blur</code>, then re-emits <code>input</code> so a bound field sees the cleaned value. Type padded text and tab away.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxInput', 'CngxTrim'],
  moduleImports: ["import { CngxInput, CngxTrim } from '@cngx/forms/input';"],
  imports: ['CngxInput', 'CngxTrim'],
  setup: `protected readonly stored = signal('');
  protected sync(event: Event): void {
    this.stored.set((event.target as HTMLInputElement).value);
  }`,
  template: `  <div class="demo-field" style="max-inline-size:24rem">
    <label for="trim-name" class="demo-label">Username</label>
    <input
      id="trim-name"
      cngxInput
      cngxTrim
      cngxTrimCollapse
      (input)="sync($event)"
      placeholder="  pad   and   tab   away  "
    />
    <p style="margin:0">Stored: <code>"{{ stored() }}"</code></p>
  </div>`,
};
