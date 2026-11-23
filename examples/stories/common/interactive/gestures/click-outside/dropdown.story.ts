import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxClickOutside: dropdown',
  subtitle: '<code>[cngxClickOutside]</code> listens for <code>pointerdown</code> on the document and emits <code>(clickOutside)</code> when the target is outside the host. The toggle names the panel in <code>aria-controls</code>, so its own press is not outside and closes the open dropdown. The directive is pointer-only, so the dropdown adds the keyboard paths itself: Escape on the toggle or inside the panel closes it and returns focus to the toggle, and tabbing to a control outside closes it too (WCAG 2.1.1).',
  description: 'Outside-pointer dismissal plus the keyboard equivalents a consumer wires next to it. The directive binds no keyboard handlers; the wrapper around toggle and panel owns Escape and the focus-out close, so neither depends on where focus sits inside the widget.',
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
  setup: `protected open = signal(false);
  protected closeAndReturnFocus(toggle: HTMLButtonElement): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    toggle.focus();
  }
  protected closeWhenFocusLeaves(event: FocusEvent, widget: HTMLElement): void {
    const next = event.relatedTarget as Node | null;
    // A pointer press on a non-focusable spot moves focus to nowhere (null):
    // that case belongs to (clickOutside), not to the focus path.
    if (next && !widget.contains(next)) {
      this.open.set(false);
    }
  }`,
  template: `  <div
    #widget
    (keydown.escape)="closeAndReturnFocus(toggle)"
    (focusout)="closeWhenFocusLeaves($event, widget)"
  >
    <div class="button-row">
      <button
        #toggle
        type="button"
        class="sort-btn"
        [attr.aria-controls]="open() ? 'demo-dropdown' : null"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        Toggle dropdown ({{ open() ? 'open' : 'closed' }})
      </button>
    </div>

    @if (open()) {
      <div
        id="demo-dropdown"
        cngxClickOutside
        (clickOutside)="open.set(false)"
        tabindex="-1"
        class="demo-gesture-panel"
        style="margin-top: 8px;"
      >
        <p style="margin: 0 0 8px">I close on outside pointer, Escape, or when focus leaves.</p>
        <button type="button" class="sort-btn">Inner button (does not close)</button>
      </div>
    }
  </div>

  <div class="output-badge" style="margin-top:12px">
    Dropdown: <strong>{{ open() ? 'open' : 'closed' }}</strong>
  </div>`,
};
