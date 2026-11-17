import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Hotkey registry: app, focus and dialog scopes',
  subtitle: 'One keymap, three scopes. <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd> is an app binding and fires anywhere, also in the text field. <kbd>N</kbd> / <kbd>P</kbd> belong to the result list and fire only while focus is in it. The modal dialog blocks the app binding while it is open; its own <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Enter</kbd> fires only while it is open.',
  description: 'The hotkey registry resolves every press against the scope chain of the focused element: the deepest scope wins, a modal scope blocks app bindings outside it, and a closed dialog mutes the bindings inside it. CngxDialog and CngxDrawerSurface provide their scope; [cngxHotkeyScope] marks any other subtree.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior', 'composition'],
  references: [
    { label: 'WCAG 2.1.4 Character Key Shortcuts', href: 'https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html' },
  ],
  apiComponents: [
    'CngxHotkeyScope',
    'CngxKeyboardShortcut',
    'CngxDialog',
  ],
  moduleImports: [
    'import { CngxHotkeyScope, CngxKeyboardShortcut } from \'@cngx/common/interactive\';',
    'import { CngxDialog, CngxDialogClose, CngxDialogTitle } from \'@cngx/common/dialog\';',
    'import { HotkeyResultsList } from \'./_hotkey-results-list.component\';',
  ],
  imports: ['CngxHotkeyScope', 'CngxKeyboardShortcut', 'CngxDialog', 'CngxDialogClose', 'CngxDialogTitle', 'HotkeyResultsList'],
  setup: `protected readonly lastFired = signal('none');
  protected readonly saveCount = signal(0);
  protected readonly submitCount = signal(0);
  protected handleSave(): void {
    this.saveCount.update(n => n + 1);
    this.lastFired.set('app.save');
  }
  protected handleSubmit(): void {
    this.submitCount.update(n => n + 1);
    this.lastFired.set('dialog.submit');
  }`,
  template: `  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
    <button type="button" class="chip" [cngxKeyboardShortcut]="'mod+s'" shortcutId="app.save" (shortcutTriggered)="handleSave()">
      Save (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd>)
    </button>
    <button type="button" class="chip" (click)="confirm.open()">Open dialog</button>
  </div>

  <label class="demo-gesture-hint" style="display:block;margin-top:12px">
    <span style="display:block;margin-bottom:4px">Notes (Ctrl/Cmd+S fires here, N and P type)</span>
    <input type="text" style="width:260px" />
  </label>

  <div cngxHotkeyScope role="group" aria-label="Results, N and P move" style="margin-top:12px;max-width:260px">
    <demo-hotkey-results-list (fired)="lastFired.set($event)" />
  </div>

  <dialog cngxDialog #confirm="cngxDialog">
    <h2 cngxDialogTitle>Submit changes</h2>
    <p style="margin:12px 0">Ctrl/Cmd+Enter submits. Ctrl/Cmd+S is blocked while this dialog is open.</p>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button type="button" class="chip" cngxDialogClose>Cancel</button>
      <button type="button" class="chip chip--active" [cngxDialogClose]="'submitted'" [cngxKeyboardShortcut]="'mod+enter'" shortcutId="dialog.submit" (shortcutTriggered)="handleSubmit(); confirm.close('submitted')" (click)="handleSubmit()">
        Submit (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Enter</kbd>)
      </button>
    </div>
  </dialog>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last fired</span>
      <span class="event-value" data-testid="last-fired">{{ lastFired() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Saves</span>
      <span class="event-value" data-testid="save-count">{{ saveCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Submits</span>
      <span class="event-value" data-testid="submit-count">{{ submitCount() }}</span>
    </div>
  </div>`,
};
