import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Long Press',
  navLabel: 'LongPress',
  navCategory: 'interactive',
  description:
    'Detects long-press gestures via Pointer Events. Cancels on move to prevent accidental triggers during scrolling.',
  apiComponents: ['CngxLongPress'],
  overview:
    '<p><code>[cngxLongPress]</code> fires after the pointer is held for a configurable duration without moving. ' +
    'The <code>longPressing</code> signal enables real-time visual feedback (progress indicator) while the user holds.</p>',
  moduleImports: [
    "import { CngxLongPress } from '@cngx/common/interactive';",
  ],
  setup: `
  protected pressCount = signal(0);
  protected lastEvent = signal<string>('none');

  protected handleLongPress(event: PointerEvent): void {
    this.pressCount.update(n => n + 1);
    this.lastEvent.set(\`(\${Math.round(event.clientX)}, \${Math.round(event.clientY)})\`);
  }
  `,
  sections: [
    {
      title: 'Long Press with Visual Feedback',
      subtitle:
        'Hold for 500ms (default). The holding state is shown via <code>longPressing()</code> signal. Moving >10px cancels.',
      imports: ['CngxLongPress'],
      template: `
  <div cngxLongPress (longPressed)="handleLongPress($event)"
       #lp="cngxLongPress"
       style="display:inline-flex;align-items:center;justify-content:center;width:160px;height:80px;
              border:2px solid var(--cngx-border,#ddd);border-radius:12px;cursor:pointer;user-select:none;
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
    },
    {
      title: 'Custom Threshold',
      subtitle:
        'Set <code>[threshold]="1000"</code> for a 1-second hold. Useful for destructive actions.',
      imports: ['CngxLongPress'],
      template: `
  <button cngxLongPress [threshold]="1000" #lp2="cngxLongPress"
          (longPressed)="pressCount.update(n => n + 1)"
          class="chip"
          [style.background]="lp2.longPressing() ? '#ffebee' : ''"
          [style.borderColor]="lp2.longPressing() ? '#c62828' : ''">
    {{ lp2.longPressing() ? 'Hold 1s to delete...' : 'Long press to delete' }}
  </button>`,
    },
  ],
};
