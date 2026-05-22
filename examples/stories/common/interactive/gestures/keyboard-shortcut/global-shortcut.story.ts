import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Global Shortcut',
  subtitle: 'Press <code>Ctrl+K</code> (or <code>Cmd+K</code> on macOS) anywhere on the page. It will not fire while typing in the input field below — global scope filters input elements.',
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
  setup: `protected globalCount = signal(0);
  protected lastShortcut = signal('none');
  protected handleGlobal(): void {
    this.globalCount.update(n => n + 1);
    this.lastShortcut.set('Ctrl+K / Cmd+K');
  }`,
  template: `  <div [cngxKeyboardShortcut]="'mod+k'" (shortcutTriggered)="handleGlobal()">
    <p style="font-size:0.875rem;margin:0 0 12px;color:var(--cngx-text-secondary,#666)">
      Try pressing <kbd style="padding:2px 6px;background:var(--code-bg,#f5f5f5);border:1px solid var(--code-border,#ddd);border-radius:3px;font-size:0.8rem">Ctrl+K</kbd> now.
      Then click into the input and try again — it won't fire.
    </p>
    <input placeholder="Type here — Ctrl+K won't fire"
           style="padding:8px 12px;border:1px solid var(--cngx-color-border,#ddd);border-radius:6px;width:260px" />
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Global triggers</span>
      <span class="event-value">{{ globalCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last shortcut</span>
      <span class="event-value">{{ lastShortcut() }}</span>
    </div>
  </div>`,
};
