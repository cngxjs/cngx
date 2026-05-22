import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxKeyboardShortcut: global shortcut',
  subtitle: 'Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (<kbd>Cmd</kbd>+<kbd>K</kbd> on macOS) anywhere on the page. The actuator carries <code>aria-keyshortcuts</code> so screen readers announce the combo. Global scope skips <code>INPUT</code>, <code>TEXTAREA</code>, <code>SELECT</code> and <code>contenteditable</code> targets so typing in the field below does not fire it.',
  description: 'Global keyboard shortcut bound declaratively on a focusable actuator. Discoverability via aria-keyshortcuts is the consumer\'s responsibility; the directive only intercepts keydown.',
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
  setup: `protected globalCount = signal(0);
  protected lastShortcut = signal('none');
  protected handleGlobal(): void {
    this.globalCount.update(n => n + 1);
    this.lastShortcut.set('Ctrl+K / Cmd+K');
  }`,
  template: `  <button
    type="button"
    [cngxKeyboardShortcut]="'mod+k'"
    (shortcutTriggered)="handleGlobal()"
    aria-keyshortcuts="Control+K Meta+K"
    class="sort-btn"
  >
    Run command (<kbd>Ctrl</kbd>+<kbd>K</kbd>)
  </button>

  <p class="demo-gesture-hint" style="margin-top:12px">
    Press <kbd>Ctrl</kbd>+<kbd>K</kbd> anywhere on the page. Then focus the input and try again: it stays silent because global scope filters form fields.
  </p>
  <label class="demo-gesture-hint" style="display:block">
    <span style="display:block;margin-bottom:4px">Type here (shortcut suppressed)</span>
    <input type="text" placeholder="Ctrl+K does not fire while focused" style="width:260px" />
  </label>`,
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
