import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPasteTransform: sanitize on paste',
  subtitle:
    '<code>CngxPasteTransform</code> runs your transform over the pasted clipboard text before it is inserted at the caret, then re-emits <code>input</code> so a bound field sees the cleaned value. Here it keeps digits only - paste <code>"1 234-5678"</code> and the separators drop.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxPasteTransform'],
  moduleImports: ["import { CngxPasteTransform } from '@cngx/forms/input';"],
  imports: ['CngxPasteTransform'],
  setup: `protected readonly digitsOnly = (pasted: string): string => pasted.replace(/[^0-9]/g, '');`,
  template: `  <div class="demo-field" style="max-inline-size:24rem">
    <label class="demo-label" for="paste-acct">Account number</label>
    <input
      id="paste-acct"
      [cngxPasteTransform]="digitsOnly"
      inputmode="numeric"
      autocomplete="off"
      class="demo-input"
      placeholder="Paste a formatted number"
    />
  </div>`,
};
