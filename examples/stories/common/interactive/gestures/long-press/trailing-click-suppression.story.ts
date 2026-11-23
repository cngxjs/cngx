import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLongPress: trailing click suppression',
  subtitle: 'One gesture, one action. After a completed long press the pointer <code>click</code> of the release is cancelled on the host, so a button with both <code>(longPressed)</code> and <code>(click)</code> does not run both. A short tap, Enter and Space click as usual.',
  description: 'The directive cancels the next pointer click in the capture phase once <code>(longPressed)</code> has fired, and only that one: any later pointerdown or keydown disarms the guard, and a keyboard or programmatic click (<code>detail</code> 0) is never cancelled. Only the primary button starts a press, so a right-button hold never fires. The event log shows which handler ran for each gesture.',
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
  setup: `protected readonly log = signal<readonly string[]>([]);
  protected record(entry: string): void {
    this.log.update((list) => [entry, ...list].slice(0, 5));
  }`,
  template: `  <button
    type="button"
    cngxLongPress
    #lp="cngxLongPress"
    (longPressed)="record('longPressed: open the menu')"
    (click)="record('click: select the item')"
    class="chip"
    [class.demo-gesture-target--accent]="lp.longPressing()"
  >
    {{ lp.longPressing() ? 'Keep holding...' : 'Tap to select, hold for the menu' }}
  </button>`,
  templateChrome: `<ol style="margin-top:12px" aria-label="Event log">
    @for (entry of log(); track $index) {
      <li>{{ entry }}</li>
    } @empty {
      <li>No events yet.</li>
    }
  </ol>`,
};
