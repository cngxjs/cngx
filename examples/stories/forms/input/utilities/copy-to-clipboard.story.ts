import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Copy to Clipboard',
  subtitle: '<code>[cngxCopyValue]</code> copies text on click. The <code>copied()</code> signal stays <code>true</code> for 2 seconds.',
  description: 'Small headless behaviors: clear button, clipboard copy, and display formatting.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxInputClear',
    'CngxCopyValue',
    'CngxInputFormat',
  ],
  moduleImports: [
    'import { CngxCopyValue } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxCopyValue'],
  setup: `protected readonly token = signal('sk-proj-abc123def456ghi789');`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">API Token</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input #tokenInput readonly [value]="token()" class="demo-input" style="flex:1;font-family:var(--font-mono)" />
        <button [cngxCopyValue] [source]="tokenInput" #cp="cngxCopyValue" class="chip">
          {{ cp.copied() ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">Copy explicit value</label>
      <button [cngxCopyValue]="'hello@example.com'" #cp2="cngxCopyValue" class="chip">
        {{ cp2.copied() ? 'Copied!' : 'Copy email' }}
      </button>
    </div>
  </div>`,
};
