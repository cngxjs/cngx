import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPasswordStrengthMeter: strength levels',
  subtitle:
    'A decorative four-segment meter that fills with the 0–4 <code>[score]</code>. Takes a score, not a password, so it carries no forms dependency; it is <code>aria-hidden</code> because the paired <code>CngxPasswordStrength</code> directive owns the live announcement. Colour escalates per strength tier.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxPasswordStrengthMeter'],
  moduleImports: ["import { CngxPasswordStrengthMeter } from '@cngx/common/display';"],
  imports: ['CngxPasswordStrengthMeter'],
  setup: `protected readonly levels = [
    { score: 0, label: 'empty' },
    { score: 1, label: 'weak' },
    { score: 2, label: 'fair' },
    { score: 3, label: 'good' },
    { score: 4, label: 'strong' },
  ] as const;`,
  template: `  <div style="display:flex;flex-direction:column;gap:0.75rem;max-inline-size:24rem">
    @for (level of levels; track level.score) {
      <div style="display:flex;align-items:center;gap:0.75rem">
        <cngx-password-strength-meter [score]="level.score" style="display:flex;flex:1 1 0" />
        <span style="min-inline-size:4rem">{{ level.label }}</span>
      </div>
    }
  </div>`,
};
