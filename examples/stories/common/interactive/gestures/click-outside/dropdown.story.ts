import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxClickOutside: dropdown',
  subtitle: '<code>[cngxClickOutside]</code> listens for <code>pointerdown</code> on the document and emits <code>(clickOutside)</code> when the target is outside the host. The directive is sighted-only, so the dropdown also binds <code>(keydown.escape)</code> as the keyboard equivalent (WCAG 2.1.1).',
  description: 'Outside-pointer dismissal plus a keyboard-equivalent Escape binding. The directive itself does not bind any keyboard handlers; consumers wire Escape alongside it.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    { label: 'WCAG 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  apiComponents: [
    'CngxClickOutside',
  ],
  imports: ['CngxClickOutside'],
  setup: `protected open = signal(false);`,
  template: `  @if (open()) {
    <div
      cngxClickOutside
      (clickOutside)="open.set(false)"
      (keydown.escape)="open.set(false)"
      role="dialog"
      aria-label="Demo dropdown"
      tabindex="-1"
      class="demo-gesture-panel"
      style="margin-top: 8px;"
    >
      <p style="margin: 0 0 8px">I close on outside pointer or Escape.</p>
      <button type="button" class="sort-btn">Inner button (does not close)</button>
    </div>
  }

  <div class="output-badge" style="margin-top:12px">
    Dropdown: <strong>{{ open() ? 'open' : 'closed' }}</strong>
  </div>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="sort-btn" (click)="open.set(!open())">
      Toggle dropdown ({{ open() ? 'open' : 'closed' }})
    </button>
  </div>`,
};
