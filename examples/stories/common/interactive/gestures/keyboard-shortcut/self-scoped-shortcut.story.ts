import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxKeyboardShortcut: self-scoped shortcut',
  subtitle: 'With <code>[shortcutScope]="\'self\'"</code> the listener binds to the host element instead of <code>document</code>. The target is a focusable region (<code>tabindex="0"</code>, <code>role="group"</code>, <code>aria-keyshortcuts</code>) so screen readers announce the combo and Escape only fires while focus is inside.',
  description: 'Self-scoped shortcuts compose with focus management; only the focused widget reacts. Used by dialogs, comboboxes, and inline editors that need a local Escape handler without colliding with document-level shortcuts.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA aria-keyshortcuts', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts' },
  ],
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
  template: `  <div
    [cngxKeyboardShortcut]="'escape'"
    [shortcutScope]="'self'"
    (shortcutTriggered)="handleEscape()"
    role="group"
    aria-label="Press Escape to dismiss"
    aria-keyshortcuts="Escape"
    tabindex="0"
    class="demo-gesture-target"
    [class.demo-gesture-target--accent]="escapeCount() > 0"
    style="max-width:300px; cursor:pointer;"
  >
    <p style="margin:0;font-size:0.875rem">Focus me, then press <kbd>Escape</kbd></p>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Escape triggers</span>
      <span class="event-value">{{ escapeCount() }}</span>
    </div>
  </div>`,
};
