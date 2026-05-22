import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxClickOutside: enabled toggle',
  subtitle: 'When <code>[enabled]="false"</code> the directive stays mounted but stops emitting. Useful for pausing outside-dismiss while a child overlay handles its own pointer events.',
  description: 'Toggle the enabled flag and watch outside-click detection start and stop without remounting the directive.',
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
    class="demo-gesture-target"
    style="margin-top: 8px;"
  >
    Click outside this box
  </div>

  <div class="output-badge" style="margin-top:12px">
    Outside clicks detected: <strong>{{ clickCount() }}</strong>
  </div>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="sort-btn" (click)="enabled.set(!enabled())">
      {{ enabled() ? 'Disable' : 'Enable' }} outside detection
    </button>
    <span class="chip" [class.chip--active]="enabled()">{{ enabled() ? 'enabled' : 'disabled' }}</span>
  </div>`,
};
