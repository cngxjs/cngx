import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputFilter: charset restriction',
  subtitle:
    '<code>CngxInputFilter</code> cancels any <code>beforeinput</code> insertion (typing, paste, IME) that contains a disallowed character and announces the rejection assertively - never a silent drop. Presets: <code>digits</code> / <code>alpha</code> / <code>alphanumeric</code>, or a single-character <code>RegExp</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxInput', 'CngxInputFilter'],
  moduleImports: ["import { CngxInput, CngxInputFilter } from '@cngx/forms/input';"],
  imports: ['CngxInput', 'CngxInputFilter'],
  template: `  <div class="demo-field" style="max-inline-size:24rem">
    <label for="pin-digits" class="demo-label">PIN (digits only)</label>
    <input
      id="pin-digits"
      cngxInput
      cngxInputFilter="digits"
      inputmode="numeric"
      autocomplete="off"
      placeholder="Try typing letters - they are blocked"
    />
  </div>`,
};
