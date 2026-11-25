import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCopyBlock: Failed copy',
  subtitle:
    'When the clipboard refuses the write, the button shows <code>failedLabel</code> and the polite region speaks <code>failedAnnouncement</code>. The chrome switch makes the clipboard refuse.',
  description:
    'A copy can fail: the page lacks clipboard permission, the document is not focused, or the browser has no Clipboard API. <code>CngxCopyBlock</code> then flips its button to the failed state (class <code>cngx-copy-block__button--failed</code>) and writes the failure into the same always-present polite region that announces a success, so the outcome is seen and heard either way. Both failure strings resolve from the interactive language section unless bound, as here.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['error-handling', 'behavior'],
  apiComponents: ['CngxCopyBlock'],
  moduleImports: [
    "import { CngxCopyBlock } from '@cngx/common/interactive';",
    "import { refuseClipboardWhile } from '../../../../fixtures';",
  ],
  imports: ['CngxCopyBlock'],
  setup: `protected readonly apiKey = signal('sk_test_EXAMPLE_KEY_1234567890');`,
  setupChrome: `  protected readonly refuse = signal(true);
  // Makes navigator.clipboard.writeText reject while the switch is on.
  private readonly clipboardSwitch = refuseClipboardWhile(() => this.refuse());`,
  template: `
  <div style="max-width:380px">
    <cngx-copy-block
      [value]="apiKey()"
      buttonLabel="Copy Key"
      copiedLabel="Key copied!"
      failedLabel="Copy blocked"
      failedAnnouncement="The key was not copied. Select it and copy it by hand."
    >
      {{ apiKey() }}
    </cngx-copy-block>
  </div>`,
  templateChrome: `<label class="event-row" style="margin-top:12px;gap:6px;align-items:center">
    <input type="checkbox" [checked]="refuse()" (change)="refuse.set($any($event.target).checked)" />
    <span>Clipboard refuses</span>
  </label>`,
};
