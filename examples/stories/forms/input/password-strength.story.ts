import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPasswordStrength: live strength feedback',
  subtitle:
    '<code>CngxPasswordStrength</code> derives a 0–4 <code>score()</code> and a <code>label()</code> through the swappable <code>CNGX_PASSWORD_STRENGTH_FACTORY</code>, announcing the label politely (debounced). Pair the live <code>score()</code> with <code>&lt;cngx-password-strength-meter&gt;</code> for the visual.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxInput', 'CngxPasswordStrength', 'CngxPasswordStrengthMeter'],
  moduleImports: [
    "import { CngxInput, CngxPasswordStrength } from '@cngx/forms/input';",
    "import { CngxPasswordStrengthMeter } from '@cngx/common/display';",
  ],
  imports: ['CngxInput', 'CngxPasswordStrength', 'CngxPasswordStrengthMeter'],
  template: `  <label for="strength-pw" class="demo-label">Password</label>
  <input
    id="strength-pw"
    cngxInput
    cngxPasswordStrength
    #pw="cngxPasswordStrength"
    type="password"
    placeholder="Type to see strength"
    style="width:100%;max-inline-size:24rem"
  />
  <cngx-password-strength-meter [score]="pw.score()" style="display:flex;max-inline-size:24rem" />
  <p class="demo-strength-label">Strength: {{ pw.label() }}</p>`,
};
