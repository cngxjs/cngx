import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Input Utilities',
  navLabel: 'Utilities',
  navCategory: 'input',
  description:
    'Small headless behaviors: clear button, clipboard copy, and display formatting.',
  apiComponents: ['CngxInputClear', 'CngxCopyValue', 'CngxInputFormat'],
  overview:
    '<p><code>CngxInputClear</code> provides a headless clear behavior for any input/textarea.</p>' +
    '<p><code>CngxCopyValue</code> copies text to clipboard with auto-reset feedback.</p>' +
    '<p><code>CngxInputFormat</code> applies formatting on blur and shows the raw value on focus.</p>',
  moduleImports: [
    "import { CngxInputClear, CngxCopyValue, CngxInputFormat } from '@cngx/forms/input';",
  ],
  setup: `
  protected readonly formatCurrency = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };
  protected readonly parseCurrency = (v: string) => v.replace(/[^0-9.\\-]/g, '');
  protected readonly token = signal('sk-proj-abc123def456ghi789');
  `,
  sections: [
    {
      title: 'Input Clear',
      subtitle:
        '<code>[cngxInputClear]</code> takes a reference to the target input. ' +
        'Exposes <code>hasValue()</code> signal and <code>clear()</code> method.',
      imports: ['CngxInputClear'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Name</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input #nameInput placeholder="Type something..." class="demo-input" style="flex:1" />
        <button [cngxInputClear]="nameInput" #clr="cngxInputClear"
          class="chip" [style.opacity]="clr.hasValue() ? 1 : 0.3">
          Clear
        </button>
      </div>
    </div>
  </div>`,
    },
    {
      title: 'Copy to Clipboard',
      subtitle:
        '<code>[cngxCopyValue]</code> copies text on click. The <code>copied()</code> signal stays <code>true</code> for 2 seconds.',
      imports: ['CngxCopyValue'],
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
    },
    {
      title: 'Input Format',
      subtitle:
        '<code>[cngxInputFormat]</code> formats on blur (display) and parses on focus (edit). ' +
        'Reactive forms receive the raw value.',
      imports: ['CngxInputFormat'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Amount (formatted as USD on blur)</label>
      <input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency"
        #fmt="cngxInputFormat" placeholder="Enter amount..." class="demo-input" />
      <div class="status-row">
        <span class="status-badge">Raw: {{ fmt.rawValue() }}</span>
        <span class="status-badge">Display: {{ fmt.displayValue() }}</span>
      </div>
    </div>
  </div>`,
    },
  ],
};
