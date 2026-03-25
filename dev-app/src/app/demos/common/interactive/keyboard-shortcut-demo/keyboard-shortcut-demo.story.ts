import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Keyboard Shortcut',
  navLabel: 'KeyboardShortcut',
  navCategory: 'interactive',
  description:
    'Declarative keyboard shortcut handler. Supports mod (Meta/Ctrl), global/self scope, and input element filtering.',
  apiComponents: ['CngxKeyboardShortcut'],
  overview:
    '<p><code>[cngxKeyboardShortcut]</code> binds keyboard combos declaratively. ' +
    '<code>mod</code> resolves to Meta on macOS, Ctrl elsewhere. ' +
    'Global scope ignores events from input elements to prevent interference with typing.</p>',
  moduleImports: [
    "import { CngxKeyboardShortcut } from '@cngx/common/interactive';",
  ],
  setup: `
  protected globalCount = signal(0);
  protected escapeCount = signal(0);
  protected lastShortcut = signal('none');

  protected handleGlobal(): void {
    this.globalCount.update(n => n + 1);
    this.lastShortcut.set('Ctrl+K / Cmd+K');
  }

  protected handleEscape(): void {
    this.escapeCount.update(n => n + 1);
    this.lastShortcut.set('Escape (scoped)');
  }
  `,
  sections: [
    {
      title: 'Global Shortcut',
      subtitle:
        'Press <code>Ctrl+K</code> (or <code>Cmd+K</code> on macOS) anywhere on the page. ' +
        'It will not fire while typing in the input field below — global scope filters input elements.',
      imports: ['CngxKeyboardShortcut'],
      template: `
  <div [cngxKeyboardShortcut]="'mod+k'" (shortcutTriggered)="handleGlobal()">
    <p style="font-size:0.875rem;margin:0 0 12px;color:var(--cngx-text-secondary,#666)">
      Try pressing <kbd style="padding:2px 6px;background:var(--code-bg,#f5f5f5);border:1px solid var(--code-border,#ddd);border-radius:3px;font-size:0.8rem">Ctrl+K</kbd> now.
      Then click into the input and try again — it won't fire.
    </p>
    <input placeholder="Type here — Ctrl+K won't fire"
           style="padding:8px 12px;border:1px solid var(--cngx-border,#ddd);border-radius:6px;width:260px" />
  </div>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Global triggers</span>
      <span class="event-value">{{ globalCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last shortcut</span>
      <span class="event-value">{{ lastShortcut() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Self-Scoped Shortcut',
      subtitle:
        'Escape only fires when this box has focus. Click it first, then press Escape.',
      imports: ['CngxKeyboardShortcut'],
      template: `
  <div [cngxKeyboardShortcut]="'escape'" [shortcutScope]="'self'"
       (shortcutTriggered)="handleEscape()"
       tabindex="0"
       style="padding:16px;border:2px dashed var(--cngx-border,#ddd);border-radius:8px;
              max-width:300px;cursor:pointer;outline:none"
       [style.borderColor]="escapeCount() > 0 ? 'var(--interactive,#f5a623)' : ''">
    <p style="margin:0;font-size:0.875rem">Click me, then press <kbd style="padding:2px 6px;background:var(--code-bg,#f5f5f5);border:1px solid var(--code-border,#ddd);border-radius:3px;font-size:0.8rem">Escape</kbd></p>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Escape triggers</span>
      <span class="event-value">{{ escapeCount() }}</span>
    </div>
  </div>`,
    },
  ],
};
