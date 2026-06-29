import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSensitiveValue: mask with reveal and audit',
  subtitle:
    '<code>CngxSensitiveValue</code> masks a field (<code>type="password"</code>) with a consumer-owned reveal button. Every reveal/hide is announced and emits an <code>audit</code> event (<code>{ revealed, at }</code>) for compliance logging. The reveal button is an interactive affix (<code>cngxSuffixInteractive</code>) inside <code>cngxAffixRow</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxSensitiveValue', 'CngxSuffix', 'CngxAffixRow'],
  moduleImports: [
    "import { CngxSensitiveValue, type SensitiveRevealAudit } from '@cngx/forms/input';",
    "import { CngxSuffix, CngxAffixRow } from '@cngx/forms/field';",
  ],
  imports: ['CngxSensitiveValue', 'CngxSuffix', 'CngxAffixRow'],
  setup: `protected readonly lastAudit = signal<SensitiveRevealAudit | null>(null);`,
  template: `  <div class="demo-field" style="max-inline-size:24rem">
    <label class="demo-label" for="sv-key">API key</label>
    <span cngxAffixRow>
      <input
        id="sv-key"
        cngxSensitiveValue
        #sv="cngxSensitiveValue"
        class="demo-input"
        value="sk-live-abc123"
        (audit)="lastAudit.set($event)"
      />
      <button
        cngxSuffix
        cngxSuffixInteractive
        type="button"
        class="chip"
        (click)="sv.toggle()"
        [attr.aria-label]="sv.revealed() ? 'Hide value' : 'Reveal value'"
      >
        {{ sv.revealed() ? 'Hide' : 'Reveal' }}
      </button>
    </span>
  </div>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">revealed: {{ sv.revealed() }}</span>
      @if (lastAudit(); as a) {
        <span class="status-badge">audit: {{ a.revealed ? 'reveal' : 'hide' }}</span>
      }
    </div>`,
};
