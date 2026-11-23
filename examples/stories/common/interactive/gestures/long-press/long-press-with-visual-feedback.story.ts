import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLongPress: visual feedback',
  subtitle: 'Hold for 500ms (default). The <code>longPressing()</code> signal reflects whether the gesture is currently building. Moving the pointer more than 10px cancels the hold so accidental scrolls do not trigger. The click counter shows the release rule: a short tap clicks, the pointer click after a completed long press is swallowed.',
  description: 'Demonstrates the longPressing signal as a hold indicator. The target is a real button, so Enter and Space still click it: a long press has no keyboard equivalent, and the click path is what keyboard and switch users get. The progress transition respects prefers-reduced-motion via the .demo-gesture-target helper.',
  level: 'atom',
  audience: ['dev'],
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
  protected readonly clickCount = signal(0);
  protected lastEvent = signal<string>('none');
  protected handleLongPress(event: PointerEvent): void {
    this.pressCount.update(n => n + 1);
    this.lastEvent.set(\`(\${Math.round(event.clientX)}, \${Math.round(event.clientY)})\`);
  }`,
  template: `  <button
    type="button"
    cngxLongPress
    (longPressed)="handleLongPress($event)"
    (click)="clickCount.update(n => n + 1)"
    #lp="cngxLongPress"
    class="demo-gesture-target"
    [class.demo-gesture-target--accent]="lp.longPressing()"
    style="display:inline-flex;align-items:center;justify-content:center;width:160px;height:80px;cursor:pointer;user-select:none;font:inherit;"
  >
    {{ lp.longPressing() ? 'Hold...' : 'Long press me' }}
  </button>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Long pressing</span>
      <span class="event-value">{{ lp.longPressing() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Completed</span>
      <span class="event-value">{{ pressCount() }} times</span>
    </div>
    <div class="event-row">
      <span class="event-label">Clicks</span>
      <span class="event-value">{{ clickCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last position</span>
      <span class="event-value">{{ lastEvent() }}</span>
    </div>
  </div>`,
};
