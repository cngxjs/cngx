import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxKeyboardShortcut: global shortcut',
  subtitle: 'Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (<kbd>Cmd</kbd>+<kbd>K</kbd> on macOS) or <kbd>/</kbd> anywhere on the page. Both shortcuts run on the app\'s hotkey registry, and the directive sets <code>aria-keyshortcuts</code> on each actuator. In a text field only modifier combos, <kbd>Escape</kbd> and function keys fire: <kbd>Ctrl</kbd>+<kbd>K</kbd> still works while typing, <kbd>/</kbd> types a slash.',
  description: 'Global keyboard shortcuts bound declaratively on focusable actuators. The directive registers them in the document keymap and owns aria-keyshortcuts; the text-entry rule keeps bare keys from firing while the user types.',
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
  protected handleShortcut(name: string): void {
    this.globalCount.update(n => n + 1);
    this.lastShortcut.set(name);
  }`,
  template: `  <div class="button-row">
    <button
      type="button"
      [cngxKeyboardShortcut]="'mod+k'"
      (shortcutTriggered)="handleShortcut('Ctrl+K / Cmd+K')"
      class="sort-btn"
    >
      Run command (<kbd>Ctrl</kbd>+<kbd>K</kbd>)
    </button>
    <button
      type="button"
      [cngxKeyboardShortcut]="'/'"
      (shortcutTriggered)="handleShortcut('/')"
      class="sort-btn"
    >
      Focus search (<kbd>/</kbd>)
    </button>
  </div>

  <p class="demo-gesture-hint" style="margin-top:12px">
    Press <kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>/</kbd> anywhere on the page. Then focus the field and try again: Ctrl/Cmd+K fires in the text field too; / does not.
  </p>
  <label class="demo-gesture-hint" style="display:block">
    <span style="display:block;margin-bottom:4px">Type here (Ctrl/Cmd+K fires, / types)</span>
    <input type="text" placeholder="Ctrl+K fires, / types a slash" style="width:260px" />
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
