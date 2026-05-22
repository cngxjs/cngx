import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPressable: tappable card',
  subtitle: 'The host is a real <code>&lt;button&gt;</code> styled as a card. <code>CngxPressable</code> paints <code>.cngx-pressed</code> on pointerdown only, so the press-state visual fires for mouse and touch but not for keyboard. Keyboard Space and Enter still fire native <code>click</code>, which is wired here to a counter so activation is observable.',
  description: 'Press-feedback layer plus native button activation. The directive is pointer-only by design; pair it with click for keyboard parity.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxPressable',
  ],
  moduleImports: [
    'import { CngxPressable } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxPressable'],
  setup: `protected readonly activationCount = signal(0);`,
  template: `
  <button
    type="button"
    cngxPressable
    #card="cngxPressable"
    class="demo-gesture-card"
    [class.is-pressed]="card.pressed()"
    [style.transform]="card.pressed() ? 'scale(0.98)' : ''"
    (click)="activationCount.update(n => n + 1)"
  >
    <strong style="display:block">Tappable card</strong>
    <p class="demo-gesture-hint" style="margin:8px 0 0">
      Mouse or touch shows the pressed state. Enter and Space fire the click only.
    </p>
  </button>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">pressed()</span>
      <span class="event-value">{{ card.pressed() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">click activations</span>
      <span class="event-value">{{ activationCount() }}</span>
    </div>
  </div>`,
};
