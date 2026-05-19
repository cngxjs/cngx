import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxClickOutside — enabled toggle',
  subtitle: 'When <code>[enabled]="false"</code> the directive is inactive and no events are emitted.',
  description: 'Emits an event when the user interacts outside the host element. Useful for closing dropdowns, tooltips, and overlays.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxClickOutside',
  ],
  imports: ['CngxClickOutside'],
  setup: `protected clickCount = signal(0);
  protected enabled = signal(true);`,
  template: `  <div
    cngxClickOutside
    [enabled]="enabled()"
    (clickOutside)="clickCount.update(n => n + 1)"
    style="
      padding: 16px;
      border: 2px dashed var(--cngx-color-border, #aaa);
      border-radius: 6px;
      margin-top: 8px;
      text-align: center;
    "
  >
    Click outside this box
  </div>

  <div class="output-badge" style="margin-top:12px">
    Outside clicks detected: <strong>{{ clickCount() }}</strong>
  </div>`,
  templateChrome: `<div class="button-row">
    <button class="sort-btn" (click)="enabled.set(!enabled())">
      {{ enabled() ? 'Disable' : 'Enable' }} outside detection
    </button>
    <span class="chip" [class.chip--active]="enabled()">{{ enabled() ? 'enabled' : 'disabled' }}</span>
  </div>`,
};
