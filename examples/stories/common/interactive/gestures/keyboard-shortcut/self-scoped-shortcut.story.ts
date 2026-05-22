import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Self-Scoped Shortcut',
  subtitle: 'Escape only fires when this box has focus. Click it first, then press Escape.',
  description: 'Declarative keyboard shortcut handler. Supports mod (Meta/Ctrl), global/self scope, and input element filtering.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxKeyboardShortcut',
  ],
  moduleImports: [
    'import { CngxKeyboardShortcut } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxKeyboardShortcut'],
  setup: `protected escapeCount = signal(0);
  protected lastShortcut = signal('none');
  protected handleEscape(): void {
    this.escapeCount.update(n => n + 1);
    this.lastShortcut.set('Escape (scoped)');
  }`,
  template: `  <div [cngxKeyboardShortcut]="'escape'" [shortcutScope]="'self'"
       (shortcutTriggered)="handleEscape()"
       tabindex="0"
       style="padding:16px;border:2px dashed var(--cngx-color-border,#ddd);border-radius:8px;
              max-width:300px;cursor:pointer;outline:none"
       [style.borderColor]="escapeCount() > 0 ? 'var(--interactive,#f5a623)' : ''">
    <p style="margin:0;font-size:0.875rem">Click me, then press <kbd style="padding:2px 6px;background:var(--code-bg,#f5f5f5);border:1px solid var(--code-border,#ddd);border-radius:3px;font-size:0.8rem">Escape</kbd></p>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Escape triggers</span>
      <span class="event-value">{{ escapeCount() }}</span>
    </div>
  </div>`,
};
