import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Long Press with Visual Feedback',
  subtitle: 'Hold for 500ms (default). The holding state is shown via <code>longPressing()</code> signal. Moving >10px cancels.',
  description: 'Detects long-press gestures via Pointer Events. Cancels on move to prevent accidental triggers during scrolling.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxLongPress',
  ],
  moduleImports: [
    'import { CngxLongPress } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxLongPress'],
  setup: `protected pressCount = signal(0);
  protected lastEvent = signal<string>('none');
  protected handleLongPress(event: PointerEvent): void {
    this.pressCount.update(n => n + 1);
    this.lastEvent.set(\`(\${Math.round(event.clientX)}, \${Math.round(event.clientY)})\`);
  }`,
  template: `
  <div cngxLongPress (longPressed)="handleLongPress($event)"
       #lp="cngxLongPress"
       style="display:inline-flex;align-items:center;justify-content:center;width:160px;height:80px;
              border:2px solid var(--cngx-color-border,#ddd);border-radius:12px;cursor:pointer;user-select:none;
              transition:border-color 150ms,background 150ms"
       [style.borderColor]="lp.longPressing() ? 'var(--interactive,#f5a623)' : ''"
       [style.background]="lp.longPressing() ? 'var(--interactive-subtle-bg,#fff8e1)' : ''">
    {{ lp.longPressing() ? 'Hold...' : 'Long press me' }}
  </div>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Long pressing</span>
      <span class="event-value">{{ lp.longPressing() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Completed</span>
      <span class="event-value">{{ pressCount() }} times</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last position</span>
      <span class="event-value">{{ lastEvent() }}</span>
    </div>
  </div>`,
};
